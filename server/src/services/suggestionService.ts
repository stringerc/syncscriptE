import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger'
import OpenAI from 'openai'

const prisma = new PrismaClient()
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export interface Suggestion {
  id: string
  type: 'task' | 'event'
  title: string
  description: string
  reason: string
  confidence: number // 0-100
  suggestedData: {
    priority?: string
    dueDate?: string
    startTime?: string
    endTime?: string
    tags?: string[]
    durationMin?: number
  }
}

export class SuggestionService {
  private static instance: SuggestionService

  static getInstance(): SuggestionService {
    if (!SuggestionService.instance) {
      SuggestionService.instance = new SuggestionService()
    }
    return SuggestionService.instance
  }

  /**
   * Generate task suggestions based on user context
   */
  async suggestTasks(userId: string, context?: string): Promise<Suggestion[]> {
    const startTime = Date.now()
    
    try {
      // Get user's recent tasks and patterns
      const recentTasks = await prisma.task.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20
      })

      const recentEvents = await prisma.event.findMany({
        where: { userId },
        orderBy: { startsAt: 'desc' },
        take: 10
      })

      // Build context for AI
      const userContext = this.buildUserContext(recentTasks, recentEvents, context)

      // Call OpenAI with timeout
      const aiPromise = this.getAISuggestions(userContext, 'task')
      const timeoutPromise = new Promise<Suggestion[]>((_, reject) => 
        setTimeout(() => reject(new Error('AI timeout')), 1500)
      )

      const suggestions = await Promise.race([aiPromise, timeoutPromise])
        .catch(error => {
          logger.warn('AI suggestion timeout or error, using fallback', { error: error.message, userId })
          return this.getFallbackTaskSuggestions(recentTasks)
        })

      const latency = Date.now() - startTime
      logger.info('Task suggestions generated', { userId, count: suggestions.length, latency })

      return suggestions.slice(0, 3) // Top 3
    } catch (error) {
      logger.error('Failed to generate task suggestions', { error, userId })
      return this.getFallbackTaskSuggestions([])
    }
  }

  /**
   * Generate event suggestions based on user context
   */
  async suggestEvents(userId: string, context?: string): Promise<Suggestion[]> {
    const startTime = Date.now()
    
    try {
      const recentEvents = await prisma.event.findMany({
        where: { userId },
        orderBy: { startsAt: 'desc' },
        take: 20
      })

      const upcomingEvents = await prisma.event.findMany({
        where: {
          userId,
          startsAt: { gte: new Date() }
        },
        orderBy: { startsAt: 'asc' },
        take: 10
      })

      const userContext = this.buildUserContext([], [...recentEvents, ...upcomingEvents], context)

      const aiPromise = this.getAISuggestions(userContext, 'event')
      const timeoutPromise = new Promise<Suggestion[]>((_, reject) => 
        setTimeout(() => reject(new Error('AI timeout')), 1500)
      )

      const suggestions = await Promise.race([aiPromise, timeoutPromise])
        .catch(error => {
          logger.warn('AI suggestion timeout or error, using fallback', { error: error.message, userId })
          return this.getFallbackEventSuggestions(recentEvents)
        })

      const latency = Date.now() - startTime
      logger.info('Event suggestions generated', { userId, count: suggestions.length, latency })

      return suggestions.slice(0, 3)
    } catch (error) {
      logger.error('Failed to generate event suggestions', { error, userId })
      return this.getFallbackEventSuggestions([])
    }
  }

  /**
   * Build context string from user data
   */
  private buildUserContext(tasks: any[], events: any[], additionalContext?: string): string {
    const taskSummary = tasks.slice(0, 10).map(t => `- ${t.title} (${t.status})`).join('\n')
    const eventSummary = events.slice(0, 10).map(e => `- ${e.title} at ${e.startsAt}`).join('\n')

    return `
Recent Tasks:
${taskSummary || 'None'}

Recent/Upcoming Events:
${eventSummary || 'None'}

${additionalContext ? `User Context: ${additionalContext}` : ''}
    `.trim()
  }

  /**
   * Get AI-powered suggestions
   */
  private async getAISuggestions(context: string, type: 'task' | 'event'): Promise<Suggestion[]> {
    const prompt = type === 'task' 
      ? `Based on the user's recent activity, suggest 3 helpful tasks they should create. Focus on:
- Follow-ups to completed tasks
- Preparation for upcoming events
- Common productivity patterns
- Gaps in their planning

Return JSON array of suggestions with: title, description, reason, priority (low/medium/high), tags[]

Context:
${context}`
      : `Based on the user's recent activity, suggest 3 helpful events they should schedule. Focus on:
- Regular appointments they might have missed
- Follow-up meetings
- Time blocks for focus work
- Personal wellness events

Return JSON array of suggestions with: title, description, reason, startTime (ISO), endTime (ISO), durationMin

Context:
${context}`

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful productivity assistant. Return only valid JSON arrays.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 800
    })

    const content = response.choices[0]?.message?.content || '[]'
    
    try {
      const parsed = JSON.parse(content)
      return parsed.map((item: any, index: number) => ({
        id: `ai-${type}-${Date.now()}-${index}`,
        type,
        title: item.title || 'Suggested item',
        description: item.description || '',
        reason: item.reason || 'Based on your recent activity',
        confidence: 85,
        suggestedData: type === 'task' ? {
          priority: item.priority || 'medium',
          tags: item.tags || []
        } : {
          startTime: item.startTime,
          endTime: item.endTime,
          durationMin: item.durationMin || 60
        }
      }))
    } catch (error) {
      logger.error('Failed to parse AI suggestions', { error, content })
      throw error
    }
  }

  /**
   * Fallback task suggestions (rule-based)
   */
  private getFallbackTaskSuggestions(recentTasks: any[]): Suggestion[] {
    const suggestions: Suggestion[] = []

    // Suggest follow-up if user has completed tasks recently
    const completedTasks = recentTasks.filter(t => t.status === 'DONE')
    if (completedTasks.length > 0) {
      suggestions.push({
        id: `fallback-task-1`,
        type: 'task',
        title: `Follow up on: ${completedTasks[0].title}`,
        description: 'Review and document outcomes',
        reason: 'Common next step after completing tasks',
        confidence: 70,
        suggestedData: { priority: 'medium' }
      })
    }

    // Suggest planning session
    suggestions.push({
      id: `fallback-task-2`,
      type: 'task',
      title: 'Weekly planning session',
      description: 'Review upcoming week and set priorities',
      reason: 'Regular planning improves productivity',
      confidence: 80,
      suggestedData: { priority: 'high', tags: ['planning'] }
    })

    // Suggest review
    suggestions.push({
      id: `fallback-task-3`,
      type: 'task',
      title: 'Review and organize tasks',
      description: 'Clean up completed tasks and update priorities',
      reason: 'Maintenance improves clarity',
      confidence: 75,
      suggestedData: { priority: 'low', tags: ['maintenance'] }
    })

    return suggestions
  }

  /**
   * Fallback event suggestions (rule-based)
   */
  private getFallbackEventSuggestions(recentEvents: any[]): Suggestion[] {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0)

    return [
      {
        id: `fallback-event-1`,
        type: 'event',
        title: 'Focus time',
        description: 'Dedicated time for deep work',
        reason: 'Regular focus blocks improve productivity',
        confidence: 85,
        suggestedData: {
          startTime: tomorrow.toISOString(),
          endTime: new Date(tomorrow.getTime() + 2 * 60 * 60 * 1000).toISOString(),
          durationMin: 120
        }
      },
      {
        id: `fallback-event-2`,
        type: 'event',
        title: 'Exercise break',
        description: '30-minute workout or walk',
        reason: 'Physical activity boosts energy',
        confidence: 75,
        suggestedData: {
          durationMin: 30
        }
      },
      {
        id: `fallback-event-3`,
        type: 'event',
        title: 'End-of-day review',
        description: 'Reflect on today and plan tomorrow',
        reason: 'Daily reflection improves awareness',
        confidence: 80,
        suggestedData: {
          durationMin: 15
        }
      }
    ]
  }

  /**
   * Log suggestion acceptance/rejection
   */
  async logSuggestionResponse(
    userId: string,
    suggestionId: string,
    action: 'accepted' | 'rejected',
    createdItemId?: string
  ): Promise<void> {
    try {
      const { analyticsService } = await import('./analyticsService')
      
      await analyticsService.logEvent(
        userId,
        action === 'accepted' ? 'suggestion_accepted' : 'suggestion_rejected',
        {
          suggestionId,
          createdItemId
        }
      )

      logger.info('Suggestion response logged', { userId, suggestionId, action })
    } catch (error) {
      logger.error('Failed to log suggestion response', { error, userId, suggestionId })
    }
  }
}

export const suggestionService = SuggestionService.getInstance()
