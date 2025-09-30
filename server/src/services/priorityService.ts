import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger'

const prisma = new PrismaClient()

const PRIORITY_LEVELS = {
  URGENT: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1
}

const PRIORITY_NAMES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT']

export interface PriorityRecomputeResult {
  tasksUpdated: number
  criticalTasks: string[]
  warnings: string[]
  computeTime: number
}

export class PriorityService {
  private static instance: PriorityService

  static getInstance(): PriorityService {
    if (!PriorityService.instance) {
      PriorityService.instance = new PriorityService()
    }
    return PriorityService.instance
  }

  /**
   * Recompute priorities for an event's tasks
   * Based on critical path and slack analysis
   */
  async recomputeEventPriorities(eventId: string): Promise<PriorityRecomputeResult> {
    const startTime = Date.now()
    const warnings: string[] = []
    const criticalTasks: string[] = []
    let tasksUpdated = 0

    try {
      // Get event with tasks
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
          preparationTasks: {
            where: { status: { not: 'COMPLETED' } }
          }
        }
      })

      if (!event) {
        throw new Error('Event not found')
      }

      // Get event priority level
      const eventPriorityLevel = PRIORITY_LEVELS[event.priority as keyof typeof PRIORITY_LEVELS] || 2

      // Build dependency graph and compute critical path
      const { criticalPath, slackMap } = this.computeCriticalPath(event.preparationTasks, event)

      // Update priorities
      for (const task of event.preparationTasks) {
        // Skip if manually locked
        if (task.lockedPriority) {
          warnings.push(`Task "${task.title}" has locked priority, skipping`)
          continue
        }

        const currentPriorityLevel = PRIORITY_LEVELS[task.priority as keyof typeof PRIORITY_LEVELS] || 2
        const isCritical = criticalPath.includes(task.id)
        const slack = slackMap.get(task.id) || 0

        let newPriorityLevel = currentPriorityLevel

        if (isCritical) {
          // Critical path tasks can never be below event priority
          newPriorityLevel = Math.max(eventPriorityLevel, currentPriorityLevel)
          criticalTasks.push(task.id)
        } else {
          // Non-critical can drop one tier if sufficient slack
          const minAllowedLevel = Math.max(1, eventPriorityLevel - 1)
          
          if (slack > 24 * 60) { // More than 1 day slack
            newPriorityLevel = Math.max(minAllowedLevel, currentPriorityLevel - 1)
          } else {
            // Keep at event level or higher
            newPriorityLevel = Math.max(eventPriorityLevel, currentPriorityLevel)
          }
        }

        // Apply priority change
        if (newPriorityLevel !== currentPriorityLevel) {
          await prisma.task.update({
            where: { id: task.id },
            data: {
              priority: PRIORITY_NAMES[newPriorityLevel - 1],
              isCritical: isCritical,
              slackMin: Math.floor(slack)
            }
          })
          tasksUpdated++
        }
      }

      const computeTime = Date.now() - startTime

      logger.info('Priority recompute completed', {
        eventId,
        tasksUpdated,
        criticalTasks: criticalTasks.length,
        computeTime
      })

      return {
        tasksUpdated,
        criticalTasks,
        warnings,
        computeTime
      }
    } catch (error) {
      logger.error('Failed to recompute priorities', { error, eventId })
      throw error
    }
  }

  /**
   * Compute critical path and slack for tasks
   * Simple version: sequential tasks by dependencies
   */
  private computeCriticalPath(
    tasks: any[],
    event: any
  ): { criticalPath: string[]; slackMap: Map<string, number> } {
    const criticalPath: string[] = []
    const slackMap = new Map<string, number>()
    
    // Build dependency graph
    const dependencyMap = new Map<string, string[]>()
    for (const task of tasks) {
      if (task.dependencies) {
        try {
          const deps = JSON.parse(task.dependencies)
          dependencyMap.set(task.id, deps.map((d: any) => d.taskId))
        } catch (e) {
          // Invalid JSON, skip
        }
      }
    }

    // Find tasks with no dependencies (start of critical path)
    const rootTasks = tasks.filter(t => !dependencyMap.has(t.id) || dependencyMap.get(t.id)!.length === 0)

    // Simple critical path: longest duration chain
    let longestChain: any[] = []
    for (const rootTask of rootTasks) {
      const chain = this.findLongestChain(rootTask, tasks, dependencyMap)
      if (chain.reduce((sum, t) => sum + (t.durationMin || t.estimatedDuration || 30), 0) > 
          longestChain.reduce((sum, t) => sum + (t.durationMin || t.estimatedDuration || 30), 0)) {
        longestChain = chain
      }
    }

    // Mark critical path
    longestChain.forEach(task => criticalPath.push(task.id))

    // Calculate slack for each task
    const eventStart = new Date(event.startTime).getTime()
    const now = Date.now()
    const totalAvailableTime = (eventStart - now) / (60 * 1000) // minutes

    for (const task of tasks) {
      const duration = task.durationMin || task.estimatedDuration || 30
      const isCritical = criticalPath.includes(task.id)
      
      if (isCritical) {
        // Critical path has minimal slack
        slackMap.set(task.id, 0)
      } else {
        // Non-critical has more slack
        const slack = Math.max(0, totalAvailableTime - duration)
        slackMap.set(task.id, slack)
      }
    }

    return { criticalPath, slackMap }
  }

  /**
   * Find longest dependency chain from a task
   */
  private findLongestChain(
    task: any,
    allTasks: any[],
    dependencyMap: Map<string, string[]>
  ): any[] {
    const chain = [task]
    
    // Find tasks that depend on this one
    const dependents = allTasks.filter(t => {
      const deps = dependencyMap.get(t.id) || []
      return deps.includes(task.id)
    })

    if (dependents.length === 0) {
      return chain
    }

    // Recursively find longest chain
    let longestSubChain: any[] = []
    for (const dependent of dependents) {
      const subChain = this.findLongestChain(dependent, allTasks, dependencyMap)
      if (subChain.length > longestSubChain.length) {
        longestSubChain = subChain
      }
    }

    return [...chain, ...longestSubChain]
  }

  /**
   * Calculate WSJF (Weighted Shortest Job First) score
   * WSJF = Cost of Delay / Duration
   */
  calculateWSJF(task: any): number {
    const duration = task.durationMin || task.estimatedDuration || 30
    const priorityLevel = PRIORITY_LEVELS[task.priority as keyof typeof PRIORITY_LEVELS] || 2
    const costOfDelay = priorityLevel * 10 // Simple multiplier
    
    return costOfDelay / duration
  }

  /**
   * Lock task priority (manual override)
   */
  async lockTaskPriority(taskId: string, priority: string): Promise<void> {
    await prisma.task.update({
      where: { id: taskId },
      data: {
        priority,
        lockedPriority: true
      }
    })

    logger.info('Task priority locked', { taskId, priority })
  }

  /**
   * Unlock task priority (allow auto-recompute)
   */
  async unlockTaskPriority(taskId: string): Promise<void> {
    await prisma.task.update({
      where: { id: taskId },
      data: { lockedPriority: false }
    })

    logger.info('Task priority unlocked', { taskId })
  }
}

export const priorityService = PriorityService.getInstance()
