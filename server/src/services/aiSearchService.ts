import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger'
import OpenAI from 'openai'

const prisma = new PrismaClient()
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export interface SearchResult {
  id: string
  type: 'task' | 'event' | 'resource'
  title: string
  description: string
  relevance: number
  matchedFields: string[]
  metadata?: any
}

export interface Citation {
  itemId: string
  itemType: 'task' | 'event' | 'resource'
  title: string
  excerpt: string
}

export interface AISearchResponse {
  keywordResults: SearchResult[]
  aiAnswer?: string
  citations?: Citation[]
  fallbackMode: boolean
  latency: number
}

export class AISearchService {
  private static instance: AISearchService

  static getInstance(): AISearchService {
    if (!AISearchService.instance) {
      AISearchService.instance = new AISearchService()
    }
    return AISearchService.instance
  }

  /**
   * Perform AI-enhanced search with fallback
   */
  async search(userId: string, query: string): Promise<AISearchResponse> {
    const startTime = Date.now()
    
    try {
      // Always do keyword search first (fast)
      const keywordResults = await this.keywordSearch(userId, query)

      // Try AI answer with timeout
      let aiAnswer: string | undefined
      let citations: Citation[] | undefined
      let fallbackMode = false

      try {
        const aiPromise = this.getAIAnswer(userId, query, keywordResults)
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('AI timeout')), 2000)
        )

        const aiResponse = await Promise.race([aiPromise, timeoutPromise])
        aiAnswer = aiResponse.answer
        citations = aiResponse.citations
      } catch (error) {
        logger.warn('AI search timeout or error, using keyword-only', { 
          error: error.message, 
          userId,
          query: query.substring(0, 50)
        })
        fallbackMode = true
      }

      const latency = Date.now() - startTime

      return {
        keywordResults,
        aiAnswer,
        citations,
        fallbackMode,
        latency
      }
    } catch (error) {
      logger.error('Search failed', { error, userId, query })
      throw error
    }
  }

  /**
   * Keyword-based search (fast, always works)
   */
  private async keywordSearch(userId: string, query: string): Promise<SearchResult[]> {
    const searchTerms = query.toLowerCase().split(' ').filter(t => t.length > 2)
    
    if (searchTerms.length === 0) {
      return []
    }

    // Search tasks
    const tasks = await prisma.task.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: query } },
          { description: { contains: query } },
          { notes: { contains: query } }
        ]
      },
      take: 20,
      orderBy: { updatedAt: 'desc' }
    })

    // Search events
    const events = await prisma.event.findMany({
      where: {
        userId,
        OR: [
          { title: { contains: query } },
          { description: { contains: query } }
        ]
      },
      take: 20,
      orderBy: { startsAt: 'desc' }
    })

    // Search resources
    const resources = await prisma.resource.findMany({
      where: {
        createdById: userId,
        OR: [
          { title: { contains: query } },
          { note: { contains: query } },
          { urlOrKey: { contains: query } }
        ]
      },
      take: 10,
      orderBy: { createdAt: 'desc' }
    })

    // Combine and score results
    const results: SearchResult[] = []

    tasks.forEach(task => {
      const matchedFields: string[] = []
      let relevance = 0

      if (task.title.toLowerCase().includes(query.toLowerCase())) {
        matchedFields.push('title')
        relevance += 50
      }
      if (task.description?.toLowerCase().includes(query.toLowerCase())) {
        matchedFields.push('description')
        relevance += 30
      }
      if (task.notes?.toLowerCase().includes(query.toLowerCase())) {
        matchedFields.push('notes')
        relevance += 20
      }

      results.push({
        id: task.id,
        type: 'task',
        title: task.title,
        description: task.description || '',
        relevance,
        matchedFields,
        metadata: {
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate
        }
      })
    })

    events.forEach(event => {
      const matchedFields: string[] = []
      let relevance = 0

      if (event.title.toLowerCase().includes(query.toLowerCase())) {
        matchedFields.push('title')
        relevance += 50
      }
      if (event.description?.toLowerCase().includes(query.toLowerCase())) {
        matchedFields.push('description')
        relevance += 30
      }

      results.push({
        id: event.id,
        type: 'event',
        title: event.title,
        description: event.description || '',
        relevance,
        matchedFields,
        metadata: {
          startsAt: event.startsAt,
          endsAt: event.endsAt
        }
      })
    })

    resources.forEach(resource => {
      const matchedFields: string[] = []
      let relevance = 0

      if (resource.title?.toLowerCase().includes(query.toLowerCase())) {
        matchedFields.push('title')
        relevance += 50
      }
      if (resource.note?.toLowerCase().includes(query.toLowerCase())) {
        matchedFields.push('note')
        relevance += 30
      }

      results.push({
        id: resource.id,
        type: 'resource',
        title: resource.title || 'Untitled Resource',
        description: resource.note || '',
        relevance,
        matchedFields,
        metadata: {
          kind: resource.kind,
          urlOrKey: resource.urlOrKey
        }
      })
    })

    // Sort by relevance
    results.sort((a, b) => b.relevance - a.relevance)

    return results.slice(0, 10) // Top 10
  }

  /**
   * Get AI answer with citations (read-only, no mutations)
   */
  private async getAIAnswer(
    userId: string, 
    query: string, 
    keywordResults: SearchResult[]
  ): Promise<{ answer: string; citations: Citation[] }> {
    // Build context from keyword results
    const context = keywordResults.slice(0, 5).map(result => 
      `[${result.type}:${result.id}] ${result.title} - ${result.description}`
    ).join('\n')

    const prompt = `You are a helpful assistant for a productivity app. Answer the user's question based on their tasks, events, and resources.

User's Question: ${query}

Relevant Items:
${context}

Instructions:
1. Provide a clear, concise answer
2. Reference specific items using [type:id] format (e.g., [task:123])
3. If the answer isn't in the context, say so politely
4. Do NOT suggest creating or modifying anything (read-only)
5. Keep your answer under 200 words

Answer:`

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful read-only assistant. Never suggest mutations.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.5,
      max_tokens: 300
    })

    const answer = response.choices[0]?.message?.content || 'Unable to generate answer'

    // Extract citations from answer
    const citationRegex = /\[(task|event|resource):([^\]]+)\]/g
    const citations: Citation[] = []
    let match

    while ((match = citationRegex.exec(answer)) !== null) {
      const [, type, id] = match
      const result = keywordResults.find(r => r.id === id && r.type === type)
      
      if (result) {
        citations.push({
          itemId: result.id,
          itemType: result.type as 'task' | 'event' | 'resource',
          title: result.title,
          excerpt: result.description.substring(0, 100)
        })
      }
    }

    return { answer, citations }
  }
}

export const aiSearchService = AISearchService.getInstance()
