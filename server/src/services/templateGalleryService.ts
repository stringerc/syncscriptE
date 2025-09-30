import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger'

const prisma = new PrismaClient()

interface RecommendationScore {
  versionId: string
  score: number
  reason: string
  template: any
}

export class TemplateGalleryService {
  private static instance: TemplateGalleryService

  static getInstance(): TemplateGalleryService {
    if (!TemplateGalleryService.instance) {
      TemplateGalleryService.instance = new TemplateGalleryService()
    }
    return TemplateGalleryService.instance
  }

  /**
   * Get templates from catalog with filters
   */
  async getCatalogTemplates(filters: {
    tags?: string[]
    category?: string
    q?: string
    page?: number
    minQuality?: number
    locale?: string
  }): Promise<any> {
    try {
      const {
        tags = [],
        category,
        q,
        page = 1,
        minQuality = 70,
        locale = 'en-US'
      } = filters

      const pageSize = 20
      const skip = (page - 1) * pageSize

      // Build where clause
      const where: any = {
        quality: { gte: minQuality },
        locale
      }

      if (category) {
        where.category = category
      }

      // Get catalog entries
      let catalogEntries = await prisma.templateCatalog.findMany({
        where,
        include: {
          script: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          }
        },
        orderBy: { quality: 'desc' },
        skip,
        take: pageSize
      })

      // Filter by tags (JSON string search)
      if (tags.length > 0) {
        catalogEntries = catalogEntries.filter(entry => {
          const entryTags = JSON.parse(entry.tags || '[]')
          return tags.some(tag => entryTags.includes(tag.toLowerCase()))
        })
      }

      // Filter by search query
      if (q) {
        const searchLower = q.toLowerCase()
        catalogEntries = catalogEntries.filter(entry =>
          entry.script.title.toLowerCase().includes(searchLower) ||
          entry.script.description?.toLowerCase().includes(searchLower)
        )
      }

      // Get stats
      const templates = await Promise.all(
        catalogEntries.map(async (entry) => {
          const stats = await prisma.templateStats.findUnique({
            where: { versionId: entry.versionId }
          })

          return {
            versionId: entry.versionId,
            title: entry.script.title,
            description: entry.script.description,
            category: entry.category,
            tags: JSON.parse(entry.tags || '[]'),
            quality: entry.quality,
            locale: entry.locale,
            manifest: entry.script.manifest, // Include manifest for frontend parsing
            applyCount: stats?.applyCount || 0,
            lastApplied: stats?.lastApplied,
            createdBy: 'SyncScript', // Always show as SyncScript for curated templates
            createdAt: entry.createdAt
          }
        })
      )

      const total = await prisma.templateCatalog.count({ where })

      return {
        templates,
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    } catch (error: any) {
      logger.error('Failed to get catalog templates', { error: error.message })
      throw error
    }
  }

  /**
   * Get template recommendations for an event
   */
  async getRecommendations(userId: string, eventId: string): Promise<any[]> {
    try {
      const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: { tasks: true }
      })

      if (!event) {
        throw new Error('Event not found')
      }

      // Check if event is within 14 days
      const daysUntil = Math.ceil(
        (new Date(event.startTime).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )

      if (daysUntil < 0 || daysUntil > 14) {
        return [] // Not within recommendation window
      }

      // Get all catalog templates
      const catalogEntries = await prisma.templateCatalog.findMany({
        where: {
          quality: { gte: 70 }
        },
        include: {
          script: true
        }
      })

      // Score each template
      const scores: RecommendationScore[] = []

      for (const entry of catalogEntries) {
        const score = await this.scoreTemplate(userId, event, entry)
        if (score > 0) {
          scores.push({
            versionId: entry.versionId,
            score,
            reason: await this.generateReason(event, entry, score),
            template: {
              versionId: entry.versionId,
              title: entry.script.title,
              description: entry.script.description,
              category: entry.category,
              tags: JSON.parse(entry.tags || '[]'),
              quality: entry.quality
            }
          })
        }
      }

      // Sort by score descending
      scores.sort((a, b) => b.score - a.score)

      // Get top 3
      const topRecommendations = scores.slice(0, 3).map((rec, index) => ({
        ...rec.template,
        reason: rec.reason,
        position: index + 1,
        score: rec.score
      }))

      // Log recommendations
      for (const rec of topRecommendations) {
        await prisma.recommendationLog.create({
          data: {
            userId,
            eventId,
            versionId: rec.versionId,
            position: rec.position,
            reason: rec.reason
          }
        })
      }

      logger.info('Recommendations generated', {
        userId,
        eventId,
        count: topRecommendations.length
      })

      return topRecommendations
    } catch (error: any) {
      logger.error('Failed to get recommendations', { error: error.message })
      throw error
    }
  }

  /**
   * Score a template for an event (deterministic)
   */
  private async scoreTemplate(userId: string, event: any, catalogEntry: any): Promise<number> {
    let score = 0

    const templateTags = JSON.parse(catalogEntry.tags || '[]')
    const eventTitle = event.title.toLowerCase()
    const eventDesc = (event.description || '').toLowerCase()

    // 1. Title/Tag match (strict keyword overlap) - 40 points max
    const titleWords = eventTitle.split(/\s+/).filter(w => w.length > 3)
    const templateTitle = catalogEntry.script.title.toLowerCase()

    for (const word of titleWords) {
      if (templateTitle.includes(word)) {
        score += 10
      }
    }

    for (const tag of templateTags) {
      if (eventTitle.includes(tag) || eventDesc.includes(tag)) {
        score += 10
      }
    }

    score = Math.min(score, 40) // Cap title/tag match at 40

    // 2. User history (previous applies of same category) - 30 points max
    const userHistory = await prisma.scriptApplication.count({
      where: {
        userId,
        script: {
          catalogEntry: {
            category: catalogEntry.category
          }
        }
      }
    })

    score += Math.min(userHistory * 10, 30)

    // 3. Popularity (global apply count with decay) - 20 points max
    const stats = await prisma.templateStats.findUnique({
      where: { versionId: catalogEntry.versionId }
    })

    if (stats) {
      const applyScore = Math.log10(Math.max(stats.applyCount, 1)) * 5
      
      // Decay by age (newer templates get slight boost)
      const daysSinceCreated = Math.ceil(
        (Date.now() - new Date(catalogEntry.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      )
      const ageFactor = Math.max(0.5, 1 - (daysSinceCreated / 365))
      
      score += Math.min(applyScore * ageFactor, 20)
    }

    // 4. Quality score bonus - 10 points max
    score += (catalogEntry.quality / 100) * 10

    return Math.round(score)
  }

  /**
   * Generate human-readable reason for recommendation
   */
  private async generateReason(event: any, catalogEntry: any, score: number): Promise<string> {
    const reasons: string[] = []

    const templateTags = JSON.parse(catalogEntry.tags || '[]')
    const eventTitle = event.title.toLowerCase()

    // Title match
    const titleWords = eventTitle.split(/\s+/).filter(w => w.length > 3)
    const matches = titleWords.filter(word =>
      catalogEntry.script.title.toLowerCase().includes(word)
    )

    if (matches.length > 0) {
      reasons.push(`Matches: "${matches[0]}"`)
    }

    // Tag match
    const matchingTags = templateTags.filter((tag: string) =>
      eventTitle.includes(tag)
    )

    if (matchingTags.length > 0) {
      reasons.push(`Tags: ${matchingTags.slice(0, 2).join(', ')}`)
    }

    // Category
    if (catalogEntry.category) {
      reasons.push(`Category: ${catalogEntry.category}`)
    }

    // Popular
    const stats = await prisma.templateStats.findUnique({
      where: { versionId: catalogEntry.versionId }
    })

    if (stats && stats.applyCount > 10) {
      reasons.push(`Popular (${stats.applyCount} uses)`)
    }

    return reasons.length > 0 ? reasons.join(' • ') : `Score: ${score}`
  }

  /**
   * Log recommendation interaction
   */
  async logRecommendationClick(userId: string, versionId: string, eventId?: string): Promise<void> {
    try {
      await prisma.recommendationLog.updateMany({
        where: {
          userId,
          versionId,
          eventId,
          clicked: false
        },
        data: { clicked: true }
      })

      logger.info('Recommendation clicked', { userId, versionId, eventId })
    } catch (error: any) {
      logger.error('Failed to log click', { error: error.message })
    }
  }

  async logRecommendationApply(userId: string, versionId: string, eventId?: string): Promise<void> {
    try {
      await prisma.recommendationLog.updateMany({
        where: {
          userId,
          versionId,
          eventId,
          applied: false
        },
        data: { applied: true }
      })

      // Increment stats
      await prisma.templateStats.upsert({
        where: { versionId },
        create: {
          versionId,
          applyCount: 1,
          lastApplied: new Date()
        },
        update: {
          applyCount: { increment: 1 },
          lastApplied: new Date()
        }
      })

      logger.info('Recommendation applied', { userId, versionId, eventId })
    } catch (error: any) {
      logger.error('Failed to log apply', { error: error.message })
    }
  }

  /**
   * Curate a template (admin only)
   */
  async curateTemplate(
    versionId: string,
    category: string,
    tags: string[],
    quality: number
  ): Promise<any> {
    try {
      // Verify script exists
      const script = await prisma.script.findUnique({
        where: { id: versionId }
      })

      if (!script) {
        throw new Error('Script not found')
      }

      // Check for PII
      if (script.containsPII) {
        throw new Error('Cannot curate script with PII')
      }

      // Create catalog entry
      const catalogEntry = await prisma.templateCatalog.create({
        data: {
          versionId,
          tags: JSON.stringify(tags.map(t => t.toLowerCase())),
          category,
          quality: Math.max(0, Math.min(100, quality))
        }
      })

      logger.info('Template curated', { versionId, category, quality })

      return catalogEntry
    } catch (error: any) {
      logger.error('Failed to curate template', { error: error.message })
      throw error
    }
  }

  /**
   * Remove template from catalog (takedown)
   */
  async removeFromCatalog(versionId: string): Promise<void> {
    try {
      await prisma.templateCatalog.delete({
        where: { versionId }
      })

      logger.info('Template removed from catalog', { versionId })
    } catch (error: any) {
      logger.error('Failed to remove from catalog', { error: error.message })
      throw error
    }
  }
}

export const templateGalleryService = TemplateGalleryService.getInstance()
