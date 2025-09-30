import express from 'express'
import { templateGalleryService } from '../services/templateGalleryService'
import { authenticateToken as auth } from '../middleware/auth'
import { scriptsService } from '../services/scriptsService'

const router = express.Router()

/**
 * GET /api/templates/catalog
 * Get curated templates from catalog
 */
router.get('/catalog', auth, async (req, res) => {
  try {
    const { tags, category, q, page, minQuality, locale } = req.query

    const filters = {
      tags: tags ? (tags as string).split(',') : undefined,
      category: category as string,
      q: q as string,
      page: page ? parseInt(page as string) : 1,
      minQuality: minQuality ? parseInt(minQuality as string) : 70,
      locale: (locale as string) || 'en-US'
    }

    const result = await templateGalleryService.getCatalogTemplates(filters)

    res.json({
      success: true,
      data: result
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * GET /api/templates/:versionId/preview
 * Preview a template (uses existing scripts preview)
 */
router.get('/:versionId/preview', auth, async (req, res) => {
  try {
    const { versionId } = req.params
    const { eventId } = req.query

    if (!eventId) {
      return res.status(400).json({
        success: false,
        error: 'eventId is required'
      })
    }

    // Use existing preview from scriptsService
    const preview = await scriptsService.previewScriptApplication(
      versionId,
      eventId as string
    )

    res.json({
      success: true,
      data: preview
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * GET /api/templates/recommend
 * Get recommendations for an event
 */
router.get('/recommend', auth, async (req, res) => {
  try {
    const userId = req.user!.userId
    const { eventId } = req.query

    if (!eventId) {
      return res.status(400).json({
        success: false,
        error: 'eventId is required'
      })
    }

    const recommendations = await templateGalleryService.getRecommendations(
      userId,
      eventId as string
    )

    res.json({
      success: true,
      data: { recommendations }
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * POST /api/templates/:versionId/apply-to/:eventId
 * Apply template to event (idempotent)
 */
router.post('/:versionId/apply-to/:eventId', auth, async (req, res) => {
  try {
    const userId = req.user!.userId
    const { versionId, eventId } = req.params

    // Log apply
    await templateGalleryService.logRecommendationApply(userId, versionId, eventId)

    // Use existing apply from scriptsService
    const result = await scriptsService.applyScript(userId, versionId, eventId, req.body.variables)

    res.json({
      success: true,
      data: result,
      message: 'Template applied successfully'
    })
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * POST /api/templates/:versionId/click
 * Log recommendation click
 */
router.post('/:versionId/click', auth, async (req, res) => {
  try {
    const userId = req.user!.userId
    const { versionId } = req.params
    const { eventId } = req.body

    await templateGalleryService.logRecommendationClick(userId, versionId, eventId)

    res.json({
      success: true,
      message: 'Click logged'
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * POST /api/templates/curate (Admin only)
 * Add a script to the curated catalog
 */
router.post('/curate', auth, async (req, res) => {
  try {
    const { versionId, category, tags, quality } = req.body

    if (!versionId || !category || !tags || quality === undefined) {
      return res.status(400).json({
        success: false,
        error: 'versionId, category, tags, and quality are required'
      })
    }

    const catalogEntry = await templateGalleryService.curateTemplate(
      versionId,
      category,
      tags,
      quality
    )

    res.json({
      success: true,
      data: catalogEntry,
      message: 'Template added to catalog'
    })
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * DELETE /api/templates/:versionId/catalog (Admin only)
 * Remove template from catalog (takedown)
 */
router.delete('/:versionId/catalog', auth, async (req, res) => {
  try {
    const { versionId } = req.params

    await templateGalleryService.removeFromCatalog(versionId)

    res.json({
      success: true,
      message: 'Template removed from catalog'
    })
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
})

export default router
