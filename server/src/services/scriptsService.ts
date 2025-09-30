import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger'

const prisma = new PrismaClient()

export interface ScriptManifest {
  tasks: ScriptTask[]
  subEvents?: ScriptEvent[]
  metadata?: any
}

export interface ScriptTask {
  title: string
  description?: string
  durationMin: number
  offsetDays: number // Days before event
  dependencies?: string[] // Template IDs of other tasks
  priority?: string
  tags?: string[]
}

export interface ScriptEvent {
  title: string
  description?: string
  offsetDays: number
  durationMin: number
  tasks?: ScriptTask[]
}

export interface ScriptVariable {
  key: string
  label: string
  type: 'text' | 'number' | 'date'
  defaultValue?: any
  required?: boolean
}

export class ScriptsService {
  private static instance: ScriptsService

  static getInstance(): ScriptsService {
    if (!ScriptsService.instance) {
      ScriptsService.instance = new ScriptsService()
    }
    return ScriptsService.instance
  }

  /**
   * Create script from event
   */
  async createFromEvent(userId: string, eventId: string, title: string, description?: string): Promise<any> {
    try {
      // Get event with tasks
      const event = await prisma.event.findFirst({
        where: { id: eventId, userId },
        include: {
          preparationTasks: true
        }
      })

      if (!event) {
        throw new Error('Event not found')
      }

      // Build manifest
      const eventDate = new Date(event.startTime)
      const manifest: ScriptManifest = {
        tasks: event.preparationTasks.map(task => {
          const taskDate = task.scheduledAt ? new Date(task.scheduledAt) : new Date()
          const offsetDays = Math.floor((eventDate.getTime() - taskDate.getTime()) / (24 * 60 * 60 * 1000))

          return {
            title: task.title,
            description: task.description || undefined,
            durationMin: task.durationMin || task.estimatedDuration || 30,
            offsetDays: Math.max(0, offsetDays),
            priority: task.priority,
            dependencies: task.dependencies ? JSON.parse(task.dependencies).map((d: any) => d.taskId) : undefined,
            tags: task.tags ? task.tags.split(',') : undefined
          }
        })
      }

      // Check for PII (simple check)
      const containsPII = this.checkForPII(JSON.stringify(manifest))

      // Create script
      const script = await prisma.script.create({
        data: {
          userId,
          title,
          description,
          status: 'DRAFT',
          manifest: JSON.stringify(manifest),
          containsPII
        }
      })

      logger.info('Script created from event', { userId, eventId, scriptId: script.id, containsPII })

      return script
    } catch (error) {
      logger.error('Failed to create script from event', { error, userId, eventId })
      throw error
    }
  }

  /**
   * Apply script to event
   */
  async applyScript(
    userId: string,
    scriptId: string,
    targetEventId: string,
    variableValues?: Record<string, any>
  ): Promise<any> {
    try {
      console.log('applyScript called with:', { userId, scriptId, targetEventId, variableValues })
      
      if (!userId) {
        throw new Error('userId is required but was undefined')
      }
      
      // Check for existing application (idempotent)
      const existing = await prisma.scriptApplication.findUnique({
        where: { eventId: targetEventId }
      })

      if (existing) {
        logger.warn('Script already applied to this event', { userId, scriptId, eventId: targetEventId })
        return {
          application: existing,
          isDuplicate: true
        }
      }

      // Get script
      const script = await prisma.script.findFirst({
        where: {
          id: scriptId,
          OR: [
            { userId },
            { isPublic: true }
          ]
        }
      })

      if (!script) {
        throw new Error('Script not found or access denied')
      }

      // Get target event
      const event = await prisma.event.findFirst({
        where: { id: targetEventId, userId }
      })

      if (!event) {
        throw new Error('Target event not found')
      }

      // Parse manifest
      const manifest: ScriptManifest = JSON.parse(script.manifest)

      // Apply variable substitution
      let processedManifest = manifest
      if (variableValues && script.variables) {
        processedManifest = this.substituteVariables(manifest, variableValues)
      }

      // Generate tasks
      const eventDate = new Date(event.startTime)
      const generatedTaskIds: string[] = []

      for (const scriptTask of processedManifest.tasks) {
        try {
          // Handle offsetDays if present, otherwise schedule for event date
          const taskDate = new Date(eventDate)
          if (scriptTask.offsetDays !== undefined) {
            taskDate.setDate(taskDate.getDate() - scriptTask.offsetDays)
          }

          const taskData: any = {
            userId: userId, // Explicitly pass userId
            eventId: targetEventId,
            title: scriptTask.title,
            description: scriptTask.description || '',
            estimatedDuration: scriptTask.durationMin || 30,
            durationMin: scriptTask.durationMin || 30,
            priority: scriptTask.priority || 'MEDIUM',
            status: 'PENDING',
            scheduledAt: taskDate
          }

          console.log('Creating task - userId:', userId, 'taskData:', JSON.stringify(taskData, null, 2))

          const task = await prisma.task.create({
            data: taskData
          })

          generatedTaskIds.push(task.id)
        } catch (taskError: any) {
          console.error('Failed to create task:', scriptTask.title, taskError.message)
          logger.error('Task creation failed', { 
            task: scriptTask, 
            error: taskError.message,
            details: taskError 
          })
          throw new Error(`Failed to create task "${scriptTask.title}": ${taskError.message}`)
        }
      }

      // Create application record
      const application = await prisma.scriptApplication.create({
        data: {
          scriptId,
          userId,
          eventId: targetEventId,
          scriptVersion: script.version,
          status: 'PROPOSED',
          variableValues: variableValues ? JSON.stringify(variableValues) : null,
          generatedTasks: JSON.stringify(generatedTaskIds)
        }
      })

      // Update script stats
      await prisma.script.update({
        where: { id: scriptId },
        data: {
          timesApplied: { increment: 1 },
          lastApplied: new Date()
        }
      })

      logger.info('Script applied to event', {
        userId,
        scriptId,
        eventId: targetEventId,
        tasksGenerated: generatedTaskIds.length
      })

      return {
        application,
        generatedTasks: generatedTaskIds,
        isDuplicate: false
      }
    } catch (error) {
      logger.error('Failed to apply script', { error, userId, scriptId })
      throw error
    }
  }

  /**
   * Confirm script application (promote to active)
   */
  async confirmApplication(applicationId: string): Promise<void> {
    await prisma.scriptApplication.update({
      where: { id: applicationId },
      data: {
        status: 'ACTIVE',
        confirmedAt: new Date()
      }
    })

    logger.info('Script application confirmed', { applicationId })
  }

  /**
   * Simple PII detection
   */
  private checkForPII(text: string): boolean {
    const piiPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b\d{16}\b/, // Credit card
      /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, // Email (if in manifest)
      /\b\d{3}-\d{3}-\d{4}\b/ // Phone
    ]

    return piiPatterns.some(pattern => pattern.test(text))
  }

  /**
   * Substitute variables in manifest
   */
  private substituteVariables(
    manifest: ScriptManifest,
    values: Record<string, any>
  ): ScriptManifest {
    const stringified = JSON.stringify(manifest)
    let result = stringified

    for (const [key, value] of Object.entries(values)) {
      const placeholder = `{{${key}}}`
      result = result.split(placeholder).join(String(value))
    }

    return JSON.parse(result)
  }
}

export const scriptsService = ScriptsService.getInstance()
