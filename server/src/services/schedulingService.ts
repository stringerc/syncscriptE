import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger'

const prisma = new PrismaClient()

export interface Dependency {
  taskId: string
  type: 'finish-to-start' // v1 only supports this
}

export interface StoreHours {
  start: string // "09:00"
  end: string // "17:00"
  days: number[] // [1,2,3,4,5] = Mon-Fri
}

export interface Conflict {
  id: string
  type: 'task_overlap' | 'dependency_violation' | 'store_hours_violation' | 'insufficient_buffer'
  description: string
  affectedTasks: string[]
  suggestedFix?: {
    action: 'reschedule' | 'extend_buffer' | 'remove_dependency'
    targetId: string
    newValue: any
  }
}

export interface SchedulingAnalysis {
  projectedFinish: Date | null
  bufferMinutes: number
  hasConflicts: boolean
  conflicts: Conflict[]
  totalDuration: number
  criticalPath: string[] // Task IDs in order
}

export class SchedulingService {
  private static instance: SchedulingService

  static getInstance(): SchedulingService {
    if (!SchedulingService.instance) {
      SchedulingService.instance = new SchedulingService()
    }
    return SchedulingService.instance
  }

  /**
   * Analyze scheduling for an event and its tasks
   */
  async analyzeEventScheduling(eventId: string): Promise<SchedulingAnalysis> {
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          preparationTasks: {
            where: {
              status: { not: 'COMPLETED' }
            },
            orderBy: { createdAt: 'asc' }
          }
        }
      })

      if (!event) {
        throw new Error('Event not found')
      }

      // Calculate total duration
      const totalDuration = event.preparationTasks.reduce((sum, task) => {
        return sum + (task.durationMin || task.estimatedDuration || 30) // Default 30 min
      }, 0)

      // Detect conflicts
      const conflicts = await this.detectConflicts(event, event.preparationTasks)

      // Calculate projected finish
      const now = new Date()
      const projectedFinish = new Date(now.getTime() + totalDuration * 60 * 1000)

      // Calculate buffer
      const bufferMinutes = Math.floor(
        (new Date(event.startTime).getTime() - projectedFinish.getTime()) / (60 * 1000)
      )

      // Build critical path (simple sequential for v1)
      const criticalPath = event.preparationTasks.map(t => t.id)

      const analysis: SchedulingAnalysis = {
        projectedFinish,
        bufferMinutes,
        hasConflicts: conflicts.length > 0,
        conflicts,
        totalDuration,
        criticalPath
      }

      // Update event with analysis
      await prisma.event.update({
        where: { id: eventId },
        data: {
          projectedFinish,
          bufferMinutes,
          hasConflicts: conflicts.length > 0
        }
      })

      logger.info('Scheduling analysis completed', {
        eventId,
        totalDuration,
        bufferMinutes,
        conflictCount: conflicts.length
      })

      return analysis
    } catch (error) {
      logger.error('Failed to analyze event scheduling', { error, eventId })
      throw error
    }
  }

  /**
   * Detect scheduling conflicts
   */
  private async detectConflicts(event: any, tasks: any[]): Promise<Conflict[]> {
    const conflicts: Conflict[] = []

    // 1. Check dependencies (circular and unmet)
    const dependencyConflicts = this.checkDependencies(tasks)
    conflicts.push(...dependencyConflicts)

    // 2. Check store hours violations
    for (const task of tasks) {
      if (task.storeHours) {
        try {
          const storeHours: StoreHours = JSON.parse(task.storeHours)
          const violation = this.checkStoreHoursViolation(task, storeHours, event)
          if (violation) conflicts.push(violation)
        } catch (e) {
          // Invalid JSON, skip
        }
      }
    }

    // 3. Check insufficient buffer
    const totalDuration = tasks.reduce((sum, t) => 
      sum + (t.durationMin || t.estimatedDuration || 30), 0
    )
    const eventStart = new Date(event.startTime)
    const now = new Date()
    const availableMinutes = (eventStart.getTime() - now.getTime()) / (60 * 1000)
    
    if (totalDuration > availableMinutes) {
      conflicts.push({
        id: `conflict-buffer-${event.id}`,
        type: 'insufficient_buffer',
        description: `Need ${totalDuration} minutes but only ${Math.floor(availableMinutes)} minutes available`,
        affectedTasks: tasks.map(t => t.id),
        suggestedFix: {
          action: 'extend_buffer',
          targetId: event.id,
          newValue: totalDuration - availableMinutes + 30 // Add 30 min buffer
        }
      })
    }

    // 4. Check task overlaps (if scheduledAt is set)
    const scheduledTasks = tasks.filter(t => t.scheduledAt)
    for (let i = 0; i < scheduledTasks.length; i++) {
      for (let j = i + 1; j < scheduledTasks.length; j++) {
        const overlap = this.checkTaskOverlap(scheduledTasks[i], scheduledTasks[j])
        if (overlap) conflicts.push(overlap)
      }
    }

    return conflicts
  }

  /**
   * Check for dependency violations
   */
  private checkDependencies(tasks: any[]): Conflict[] {
    const conflicts: Conflict[] = []
    const taskMap = new Map(tasks.map(t => [t.id, t]))

    for (const task of tasks) {
      if (!task.dependencies) continue

      try {
        const deps: Dependency[] = JSON.parse(task.dependencies)
        
        for (const dep of deps) {
          const depTask = taskMap.get(dep.taskId)
          
          // Check if dependency exists
          if (!depTask) {
            conflicts.push({
              id: `conflict-dep-missing-${task.id}`,
              type: 'dependency_violation',
              description: `Task "${task.title}" depends on non-existent task`,
              affectedTasks: [task.id],
              suggestedFix: {
                action: 'remove_dependency',
                targetId: task.id,
                newValue: deps.filter(d => d.taskId !== dep.taskId)
              }
            })
            continue
          }

          // Check for circular dependencies (simple check for v1)
          if (depTask.dependencies) {
            try {
              const depTaskDeps: Dependency[] = JSON.parse(depTask.dependencies)
              if (depTaskDeps.some(d => d.taskId === task.id)) {
                conflicts.push({
                  id: `conflict-dep-circular-${task.id}`,
                  type: 'dependency_violation',
                  description: `Circular dependency between "${task.title}" and "${depTask.title}"`,
                  affectedTasks: [task.id, depTask.id],
                  suggestedFix: {
                    action: 'remove_dependency',
                    targetId: task.id,
                    newValue: deps.filter(d => d.taskId !== dep.taskId)
                  }
                })
              }
            } catch (e) {
              // Invalid JSON
            }
          }
        }
      } catch (e) {
        // Invalid JSON, skip
      }
    }

    return conflicts
  }

  /**
   * Check store hours violation
   */
  private checkStoreHoursViolation(task: any, storeHours: StoreHours, event: any): Conflict | null {
    if (!task.scheduledAt) return null

    const scheduledDate = new Date(task.scheduledAt)
    const dayOfWeek = scheduledDate.getDay() // 0 = Sunday
    
    // Check if day is allowed
    if (!storeHours.days.includes(dayOfWeek)) {
      return {
        id: `conflict-hours-day-${task.id}`,
        type: 'store_hours_violation',
        description: `"${task.title}" scheduled on unavailable day`,
        affectedTasks: [task.id],
        suggestedFix: {
          action: 'reschedule',
          targetId: task.id,
          newValue: this.findNextAvailableDay(scheduledDate, storeHours)
        }
      }
    }

    // Check time range
    const taskTime = `${scheduledDate.getHours().toString().padStart(2, '0')}:${scheduledDate.getMinutes().toString().padStart(2, '0')}`
    if (taskTime < storeHours.start || taskTime > storeHours.end) {
      return {
        id: `conflict-hours-time-${task.id}`,
        type: 'store_hours_violation',
        description: `"${task.title}" scheduled outside store hours (${storeHours.start}-${storeHours.end})`,
        affectedTasks: [task.id],
        suggestedFix: {
          action: 'reschedule',
          targetId: task.id,
          newValue: this.adjustToStoreHours(scheduledDate, storeHours)
        }
      }
    }

    return null
  }

  /**
   * Check task overlap
   */
  private checkTaskOverlap(task1: any, task2: any): Conflict | null {
    const start1 = new Date(task1.scheduledAt)
    const end1 = new Date(start1.getTime() + (task1.durationMin || task1.estimatedDuration || 30) * 60 * 1000)
    
    const start2 = new Date(task2.scheduledAt)
    const end2 = new Date(start2.getTime() + (task2.durationMin || task2.estimatedDuration || 30) * 60 * 1000)

    // Check overlap
    if (start1 < end2 && start2 < end1) {
      return {
        id: `conflict-overlap-${task1.id}-${task2.id}`,
        type: 'task_overlap',
        description: `"${task1.title}" and "${task2.title}" overlap`,
        affectedTasks: [task1.id, task2.id],
        suggestedFix: {
          action: 'reschedule',
          targetId: task2.id,
          newValue: end1
        }
      }
    }

    return null
  }

  /**
   * Apply suggested fix
   */
  async applyFix(conflict: Conflict): Promise<boolean> {
    if (!conflict.suggestedFix) return false

    const { action, targetId, newValue } = conflict.suggestedFix

    try {
      if (action === 'reschedule') {
        await prisma.task.update({
          where: { id: targetId },
          data: { scheduledAt: new Date(newValue) }
        })
      } else if (action === 'remove_dependency') {
        await prisma.task.update({
          where: { id: targetId },
          data: { dependencies: JSON.stringify(newValue) }
        })
      } else if (action === 'extend_buffer') {
        // This would extend event start time
        const event = await prisma.event.findUnique({ where: { id: targetId } })
        if (event) {
          const newStart = new Date(event.startTime.getTime() + newValue * 60 * 1000)
          await prisma.event.update({
            where: { id: targetId },
            data: { startTime: newStart }
          })
        }
      }

      logger.info('Conflict fix applied', { conflictId: conflict.id, action })
      return true
    } catch (error) {
      logger.error('Failed to apply fix', { error, conflict })
      return false
    }
  }

  // Helper methods
  private findNextAvailableDay(date: Date, storeHours: StoreHours): Date {
    const newDate = new Date(date)
    for (let i = 1; i <= 7; i++) {
      newDate.setDate(newDate.getDate() + 1)
      if (storeHours.days.includes(newDate.getDay())) {
        return newDate
      }
    }
    return newDate
  }

  private adjustToStoreHours(date: Date, storeHours: StoreHours): Date {
    const [hours, minutes] = storeHours.start.split(':').map(Number)
    const newDate = new Date(date)
    newDate.setHours(hours, minutes, 0, 0)
    return newDate
  }
}

export const schedulingService = SchedulingService.getInstance()
