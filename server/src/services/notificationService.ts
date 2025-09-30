import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger'
import nodemailer from 'nodemailer'

const prisma = new PrismaClient()

export interface NotificationPreferences {
  email: boolean
  webPush: boolean
  quietHoursStart?: string // "22:00"
  quietHoursEnd?: string // "08:00"
  categories: {
    challenges: boolean
    focusLock: boolean
    dueTasks: boolean
    conflicts: boolean
  }
}

export interface Notification {
  id: string
  userId: string
  type: 'challenge_reminder' | 'focus_lock_resume' | 'task_due_soon' | 'calendar_conflict'
  title: string
  body: string
  data?: any
  sentAt?: Date
  readAt?: Date
}

export class NotificationService {
  private static instance: NotificationService
  private emailTransporter: any
  private dedupeCache = new Map<string, number>() // key -> timestamp
  private readonly DEDUPE_WINDOW = 60 * 60 * 1000 // 1 hour

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
      NotificationService.instance.initializeEmail()
    }
    return NotificationService.instance
  }

  /**
   * Initialize email transporter
   */
  private initializeEmail() {
    try {
      this.emailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER || process.env.NOTIFICATION_EMAIL_USER,
          pass: process.env.EMAIL_APP_PASSWORD || process.env.NOTIFICATION_EMAIL_PASSWORD
        }
      })
      logger.info('Email transporter initialized')
    } catch (error) {
      logger.error('Failed to initialize email transporter', { error })
    }
  }

  /**
   * Send notification to user
   */
  async sendNotification(
    userId: string,
    type: Notification['type'],
    title: string,
    body: string,
    data?: any
  ): Promise<boolean> {
    try {
      // Get user and preferences
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          email: true,
          name: true,
          settings: true
        }
      })

      if (!user) {
        logger.warn('User not found for notification', { userId })
        return false
      }

      // Check if user has quiet hours enabled
      if (this.isInQuietHours(userId)) {
        logger.info('Notification suppressed during quiet hours', { userId, type })
        return false
      }

      // Check dedupe window
      const dedupeKey = `${userId}:${type}:${title}`
      if (this.isDuplicate(dedupeKey)) {
        logger.info('Duplicate notification suppressed', { userId, type })
        return false
      }

      // Send via email
      if (user.email) {
        await this.sendEmailNotification(user.email, user.name, title, body, data)
      }

      // TODO: Send via web push (future implementation)
      // await this.sendWebPushNotification(userId, title, body, data)

      // Store notification in database
      await prisma.notification.create({
        data: {
          userId,
          type,
          title,
          message: body,
          read: false,
          metadata: data ? JSON.stringify(data) : null
        }
      })

      // Add to dedupe cache
      this.dedupeCache.set(dedupeKey, Date.now())

      // Clean up old dedupe entries
      this.cleanupDedupeCache()

      logger.info('Notification sent', { userId, type, title })
      return true
    } catch (error) {
      logger.error('Failed to send notification', { error, userId, type })
      return false
    }
  }

  /**
   * Send email notification
   */
  private async sendEmailNotification(
    email: string,
    name: string | null,
    title: string,
    body: string,
    data?: any
  ): Promise<void> {
    if (!this.emailTransporter) {
      logger.warn('Email transporter not initialized')
      return
    }

    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@syncscript.com',
      to: email,
      subject: `SyncScript: ${title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">⚡ SyncScript</h1>
          </div>
          <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #1e293b; margin-top: 0;">${title}</h2>
            <p style="color: #475569; font-size: 16px; line-height: 1.6;">${body}</p>
            ${data ? `
              <div style="background: white; padding: 15px; border-radius: 8px; margin-top: 20px;">
                <pre style="font-size: 14px; color: #64748b; margin: 0;">${JSON.stringify(data, null, 2)}</pre>
              </div>
            ` : ''}
            <div style="margin-top: 30px; text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'https://syncscript.app'}" 
                 style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600;">
                Open SyncScript
              </a>
            </div>
          </div>
          <div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 12px;">
            <p>You're receiving this because you enabled notifications in SyncScript.</p>
            <p><a href="${process.env.FRONTEND_URL}/settings" style="color: #667eea;">Manage notification preferences</a></p>
          </div>
        </div>
      `
    }

    await this.emailTransporter.sendMail(mailOptions)
    logger.info('Email notification sent', { email, title })
  }

  /**
   * Check if current time is in user's quiet hours
   */
  private isInQuietHours(userId: string): boolean {
    // TODO: Fetch from user preferences
    // For now, assume quiet hours are 22:00 - 08:00
    const now = new Date()
    const hour = now.getHours()
    return hour >= 22 || hour < 8
  }

  /**
   * Check if notification is duplicate within dedupe window
   */
  private isDuplicate(dedupeKey: string): boolean {
    const lastSent = this.dedupeCache.get(dedupeKey)
    if (!lastSent) return false

    const timeSince = Date.now() - lastSent
    return timeSince < this.DEDUPE_WINDOW
  }

  /**
   * Clean up old dedupe cache entries
   */
  private cleanupDedupeCache(): void {
    const now = Date.now()
    const toDelete: string[] = []

    for (const [key, timestamp] of this.dedupeCache.entries()) {
      if (now - timestamp > this.DEDUPE_WINDOW) {
        toDelete.push(key)
      }
    }

    toDelete.forEach(key => this.dedupeCache.delete(key))

    if (toDelete.length > 0) {
      logger.info('Cleaned up dedupe cache', { removed: toDelete.length })
    }
  }

  /**
   * Schedule challenge reminder
   */
  async scheduleChallengeReminder(userId: string, challengeId: string, reminderTime: Date): Promise<void> {
    const delay = reminderTime.getTime() - Date.now()
    
    if (delay <= 0) {
      logger.warn('Challenge reminder time is in the past', { userId, challengeId })
      return
    }

    setTimeout(async () => {
      await this.sendNotification(
        userId,
        'challenge_reminder',
        '🎯 Daily Challenge Reminder',
        'Time to complete your daily challenge! Keep your streak going.',
        { challengeId }
      )
    }, delay)

    logger.info('Challenge reminder scheduled', { userId, challengeId, reminderTime })
  }

  /**
   * Send focus lock resume nudge
   */
  async sendFocusLockNudge(userId: string, sessionId: string): Promise<void> {
    await this.sendNotification(
      userId,
      'focus_lock_resume',
      '🔒 Resume Focus Session',
      'Your focus session is paused. Resume to maintain your momentum!',
      { sessionId }
    )
  }

  /**
   * Send due soon task notification
   */
  async sendTaskDueSoon(userId: string, taskId: string, taskTitle: string, dueDate: Date): Promise<void> {
    const timeUntil = dueDate.getTime() - Date.now()
    const hours = Math.floor(timeUntil / (60 * 60 * 1000))

    await this.sendNotification(
      userId,
      'task_due_soon',
      `⏰ Task Due in ${hours} Hours`,
      `"${taskTitle}" is due soon. Make sure you're on track!`,
      { taskId, dueDate }
    )
  }

  /**
   * Send calendar conflict notification
   */
  async sendCalendarConflict(userId: string, eventId: string, conflictDescription: string): Promise<void> {
    await this.sendNotification(
      userId,
      'calendar_conflict',
      '⚠️ Scheduling Conflict Detected',
      conflictDescription,
      { eventId }
    )
  }

  /**
   * Check and send due task notifications
   */
  async checkDueTaskNotifications(): Promise<void> {
    try {
      // Find tasks due in next 24 hours that haven't been notified
      const tomorrow = new Date()
      tomorrow.setHours(tomorrow.getHours() + 24)

      const dueTasks = await prisma.task.findMany({
        where: {
          status: { not: 'COMPLETED' },
          dueDate: {
            gte: new Date(),
            lte: tomorrow
          }
        },
        select: {
          id: true,
          userId: true,
          title: true,
          dueDate: true
        }
      })

      for (const task of dueTasks) {
        if (task.dueDate) {
          await this.sendTaskDueSoon(task.userId, task.id, task.title, task.dueDate)
        }
      }

      logger.info('Due task notifications checked', { count: dueTasks.length })
    } catch (error) {
      logger.error('Failed to check due task notifications', { error })
    }
  }
}

export const notificationService = NotificationService.getInstance()
