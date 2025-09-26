import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

interface TaskSchedulingOptions {
  userId: string;
  eventId: string;
  taskId: string;
  eventStartTime: Date;
  prepTimeHours?: number; // How many hours before the event should prep tasks be scheduled
}

class TaskSchedulingService {
  private static instance: TaskSchedulingService;

  private constructor() {}

  public static getInstance(): TaskSchedulingService {
    if (!TaskSchedulingService.instance) {
      TaskSchedulingService.instance = new TaskSchedulingService();
    }
    return TaskSchedulingService.instance;
  }

  /**
   * Automatically schedule a prep task before its related event
   */
  public async schedulePrepTaskBeforeEvent(options: TaskSchedulingOptions): Promise<void> {
    const { userId, eventId, taskId, eventStartTime, prepTimeHours = 24 } = options;

    try {
      // Calculate when the prep task should be scheduled
      const prepTime = new Date(eventStartTime);
      prepTime.setHours(prepTime.getHours() - prepTimeHours);

      // Don't schedule in the past
      if (prepTime < new Date()) {
        logger.warn('Cannot schedule prep task in the past', { 
          taskId, 
          eventId, 
          prepTime: prepTime.toISOString(),
          eventStartTime: eventStartTime.toISOString()
        });
        return;
      }

      // Update the task with the scheduled time
      await prisma.task.update({
        where: { id: taskId },
        data: {
          scheduledAt: prepTime,
          dueDate: prepTime // Set due date to the scheduled time
        }
      });

      logger.info('Prep task scheduled before event', {
        taskId,
        eventId,
        scheduledAt: prepTime.toISOString(),
        eventStartTime: eventStartTime.toISOString(),
        prepTimeHours
      });

    } catch (error) {
      logger.error('Failed to schedule prep task before event', {
        error: error.message,
        taskId,
        eventId,
        userId
      });
      throw error;
    }
  }

  /**
   * Schedule all prep tasks for an event before the event date
   */
  public async scheduleAllPrepTasksForEvent(eventId: string, prepTimeHours: number = 24): Promise<void> {
    try {
      // Get the event
      const event = await prisma.event.findUnique({
        where: { id: eventId }
      });

      if (!event) {
        throw new Error(`Event ${eventId} not found`);
      }

      // Get all prep tasks for this event
      const prepTasks = await prisma.task.findMany({
        where: {
          eventId: eventId,
          status: { not: 'COMPLETED' } // Don't reschedule completed tasks
        }
      });

      // Schedule each prep task
      for (const task of prepTasks) {
        await this.schedulePrepTaskBeforeEvent({
          userId: task.userId,
          eventId: eventId,
          taskId: task.id,
          eventStartTime: event.startTime,
          prepTimeHours
        });
      }

      logger.info('Scheduled all prep tasks for event', {
        eventId,
        eventTitle: event.title,
        prepTasksCount: prepTasks.length,
        prepTimeHours
      });

    } catch (error) {
      logger.error('Failed to schedule prep tasks for event', {
        error: error.message,
        eventId
      });
      throw error;
    }
  }

  /**
   * Check for events that have ended but still have incomplete prep tasks
   */
  public async checkForEndedEventsWithIncompleteTasks(): Promise<Array<{
    event: any;
    incompleteTasks: any[];
  }>> {
    try {
      const now = new Date();
      
      // Find events that have ended
      const endedEvents = await prisma.event.findMany({
        where: {
          endTime: { lt: now }
        },
        include: {
          tasks: {
            where: {
              status: { not: 'COMPLETED' }
            }
          }
        }
      });

      // Filter events that have incomplete prep tasks
      const eventsWithIncompleteTasks = endedEvents.filter(event => 
        event.tasks.length > 0
      );

      logger.info('Found events with incomplete prep tasks', {
        count: eventsWithIncompleteTasks.length,
        events: eventsWithIncompleteTasks.map(e => ({
          id: e.id,
          title: e.title,
          incompleteTasksCount: e.tasks.length
        }))
      });

      return eventsWithIncompleteTasks.map(event => ({
        event: {
          id: event.id,
          title: event.title,
          endTime: event.endTime
        },
        incompleteTasks: event.tasks
      }));

    } catch (error) {
      logger.error('Failed to check for ended events with incomplete tasks', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Create notifications for events that have ended with incomplete prep tasks
   */
  public async createEventEndedNotifications(userId: string): Promise<void> {
    try {
      const eventsWithIncompleteTasks = await this.checkForEndedEventsWithIncompleteTasks();

      for (const { event, incompleteTasks } of eventsWithIncompleteTasks) {
        // Check if notification already exists for this event
        const existingNotification = await prisma.notification.findFirst({
          where: {
            userId: userId,
            title: `Event "${event.title}" has ended`,
            read: false
          }
        });

        if (existingNotification) {
          continue; // Skip if notification already exists
        }

        // Create notification
        await prisma.notification.create({
          data: {
            userId: userId,
            title: `Event "${event.title}" has ended`,
            message: `The event "${event.title}" has ended, but there are still ${incompleteTasks.length} preparation task(s) that remain. Please choose what to do with them.`,
            type: 'event_ended',
            priority: 'HIGH',
            channels: ['in_app', 'email'],
            metadata: JSON.stringify({
              eventId: event.id,
              eventTitle: event.title,
              incompleteTasksCount: incompleteTasks.length,
              taskIds: incompleteTasks.map(t => t.id)
            })
          }
        });

        logger.info('Created event ended notification', {
          userId,
          eventId: event.id,
          eventTitle: event.title,
          incompleteTasksCount: incompleteTasks.length
        });
      }

    } catch (error) {
      logger.error('Failed to create event ended notifications', {
        error: error.message,
        userId
      });
      throw error;
    }
  }
}

export default TaskSchedulingService.getInstance();
