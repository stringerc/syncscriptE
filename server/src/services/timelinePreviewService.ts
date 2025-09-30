import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger'

const prisma = new PrismaClient()

interface BusyBlock {
  start: Date
  end: Date
  source: 'external' | 'event' | 'task'
  title?: string
}

interface WorkingHours {
  start: number // 0-23
  end: number // 0-23
  days: number[] // 0=Sunday, 6=Saturday
}

interface StoreHours {
  open: number
  close: number
  days: number[]
}

export class TimelinePreviewService {
  private static instance: TimelinePreviewService

  static getInstance(): TimelinePreviewService {
    if (!TimelinePreviewService.instance) {
      TimelinePreviewService.instance = new TimelinePreviewService()
    }
    return TimelinePreviewService.instance
  }

  /**
   * Generate busy-aware timeline preview for script/template
   */
  async generateTimelinePreview(
    userId: string,
    anchorEventId: string,
    proposedTasks: any[]
  ): Promise<any> {
    try {
      // Get anchor event
      const anchorEvent = await prisma.event.findUnique({
        where: { id: anchorEventId }
      })

      if (!anchorEvent) {
        throw new Error('Anchor event not found')
      }

      // Get user preferences
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { externalCalendarAccounts: true }
      })

      const workingHours: WorkingHours = {
        start: 9,
        end: 17,
        days: [1, 2, 3, 4, 5] // Mon-Fri
      }

      // Get busy blocks
      const busyBlocks = await this.getBusyBlocks(userId, anchorEvent.startTime, anchorEvent.endTime)

      // Schedule tasks
      const scheduledTasks: any[] = []
      const conflicts: any[] = []
      let currentTime = new Date(anchorEvent.startTime)
      currentTime.setDate(currentTime.getDate() - 7) // Start 1 week before event

      for (const task of proposedTasks) {
        const durationMs = (task.durationMin || 30) * 60 * 1000
        
        // Find next available slot
        const slot = this.findAvailableSlot(
          currentTime,
          durationMs,
          busyBlocks,
          workingHours,
          task.storeHours
        )

        if (slot) {
          scheduledTasks.push({
            ...task,
            proposedStart: slot.start,
            proposedEnd: slot.end,
            hasConflict: false
          })
          currentTime = new Date(slot.end.getTime() + 30 * 60 * 1000) // 30min buffer
        } else {
          // No slot found - conflict
          conflicts.push({
            taskTitle: task.title,
            reason: 'No available time slot',
            suggestedActions: [
              { action: 'reduce_duration', description: 'Reduce task duration' },
              { action: 'extend_hours', description: 'Extend working hours' },
              { action: 'skip', description: 'Skip this task' }
            ]
          })

          scheduledTasks.push({
            ...task,
            proposedStart: null,
            proposedEnd: null,
            hasConflict: true
          })
        }
      }

      // Calculate buffers
      const buffer = this.calculateBuffer(anchorEvent.startTime, scheduledTasks)

      return {
        anchorEvent: {
          id: anchorEvent.id,
          title: anchorEvent.title,
          startTime: anchorEvent.startTime
        },
        scheduledTasks,
        conflicts,
        projectedFinish: scheduledTasks.length > 0 
          ? scheduledTasks[scheduledTasks.length - 1].proposedEnd 
          : null,
        bufferMinutes: buffer,
        busyBlocks: busyBlocks.map(b => ({
          start: b.start,
          end: b.end,
          source: b.source
        }))
      }
    } catch (error: any) {
      logger.error('Timeline preview generation failed', { error: error.message })
      throw error
    }
  }

  /**
   * Get all busy blocks from external calendars and local events
   */
  private async getBusyBlocks(
    userId: string,
    startRange: Date,
    endRange: Date
  ): Promise<BusyBlock[]> {
    const busyBlocks: BusyBlock[] = []

    // Get external calendar events
    const externalLinks = await prisma.externalCalendarLink.findMany({
      where: {
        account: { userId },
        canonicalEvent: {
          OR: [
            {
              AND: [
                { startTime: { lte: endRange } },
                { endTime: { gte: startRange } }
              ]
            }
          ]
        }
      },
      include: { canonicalEvent: true }
    })

    for (const link of externalLinks) {
      if (link.canonicalEvent) {
        busyBlocks.push({
          start: link.canonicalEvent.startTime,
          end: link.canonicalEvent.endTime,
          source: 'external',
          title: link.canonicalEvent.title
        })
      }
    }

    // Get local events
    const localEvents = await prisma.event.findMany({
      where: {
        userId,
        calendarProvider: null, // Only local events
        startTime: { lte: endRange },
        endTime: { gte: startRange }
      }
    })

    for (const event of localEvents) {
      busyBlocks.push({
        start: event.startTime,
        end: event.endTime,
        source: 'event',
        title: event.title
      })
    }

    // Sort by start time
    busyBlocks.sort((a, b) => a.start.getTime() - b.start.getTime())

    return busyBlocks
  }

  /**
   * Find next available time slot
   */
  private findAvailableSlot(
    startSearch: Date,
    durationMs: number,
    busyBlocks: BusyBlock[],
    workingHours: WorkingHours,
    storeHours?: StoreHours
  ): { start: Date; end: Date } | null {
    const maxSearchDays = 30
    let current = new Date(startSearch)

    for (let day = 0; day < maxSearchDays; day++) {
      current.setDate(current.getDate() + (day > 0 ? 1 : 0))
      
      // Check if day is in working days
      const dayOfWeek = current.getDay()
      if (!workingHours.days.includes(dayOfWeek)) continue

      // Get working hours for this day
      const dayStart = new Date(current)
      dayStart.setHours(workingHours.start, 0, 0, 0)
      
      const dayEnd = new Date(current)
      dayEnd.setHours(workingHours.end, 0, 0, 0)

      // Adjust for store hours
      if (storeHours) {
        const storeStart = new Date(current)
        storeStart.setHours(storeHours.open, 0, 0, 0)
        
        const storeEnd = new Date(current)
        storeEnd.setHours(storeHours.close, 0, 0, 0)

        // Use store hours if more restrictive
        if (storeStart > dayStart) dayStart.setTime(storeStart.getTime())
        if (storeEnd < dayEnd) dayEnd.setTime(storeEnd.getTime())
      }

      // Try to find slot in this day
      let slotStart = new Date(Math.max(dayStart.getTime(), current.getTime()))

      while (slotStart.getTime() + durationMs <= dayEnd.getTime()) {
        const slotEnd = new Date(slotStart.getTime() + durationMs)

        // Check for conflicts with busy blocks
        const hasConflict = busyBlocks.some(block => 
          (slotStart < block.end && slotEnd > block.start)
        )

        if (!hasConflict) {
          return { start: slotStart, end: slotEnd }
        }

        // Move to end of conflicting block + 15 min buffer
        const conflictingBlock = busyBlocks.find(block => 
          slotStart < block.end && slotEnd > block.start
        )
        
        if (conflictingBlock) {
          slotStart = new Date(conflictingBlock.end.getTime() + 15 * 60 * 1000)
        } else {
          slotStart = new Date(slotStart.getTime() + 30 * 60 * 1000)
        }
      }
    }

    return null // No slot found
  }

  /**
   * Calculate buffer between last task and event
   */
  private calculateBuffer(eventStart: Date, scheduledTasks: any[]): number {
    if (scheduledTasks.length === 0) return 0

    const lastTask = scheduledTasks[scheduledTasks.length - 1]
    if (!lastTask.proposedEnd) return 0

    const bufferMs = eventStart.getTime() - new Date(lastTask.proposedEnd).getTime()
    return Math.floor(bufferMs / (60 * 1000)) // Convert to minutes
  }

  /**
   * Generate one-click fix for conflicts
   */
  async generateConflictFixes(conflict: any): Promise<any[]> {
    const fixes: any[] = []

    if (conflict.reason === 'No available time slot') {
      fixes.push({
        action: 'reduce_duration',
        description: 'Reduce task duration by 50%',
        impact: 'May require rushing'
      })

      fixes.push({
        action: 'extend_working_hours',
        description: 'Extend working hours to 8am-8pm',
        impact: 'Longer work days'
      })

      fixes.push({
        action: 'remove_task',
        description: 'Remove this task from timeline',
        impact: 'Task will not be scheduled'
      })
    }

    if (conflict.reason === 'Store closed') {
      fixes.push({
        action: 'ship_to_home',
        description: 'Ship to home instead of pickup',
        impact: 'May cost extra shipping fee'
      })

      fixes.push({
        action: 'reschedule_pickup',
        description: 'Schedule pickup for next business day',
        impact: 'Delays by 1 day'
      })
    }

    return fixes
  }
}

export const timelinePreviewService = TimelinePreviewService.getInstance()
