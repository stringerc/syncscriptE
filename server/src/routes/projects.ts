import express from 'express'
import { projectsService } from '../services/projectsService'
import { authenticateToken as auth } from '../middleware/auth'

const router = express.Router()

/**
 * GET /api/projects
 * Get user's projects
 */
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user!.userId
    const projects = await projectsService.getUserProjects(userId)
    
    res.json({
      success: true,
      data: { projects }
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * POST /api/projects
 * Create new project
 */
router.post('/', auth, async (req, res) => {
  try {
    const userId = req.user!.userId
    const { name, description } = req.body

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Project name is required'
      })
    }

    const project = await projectsService.createProject(userId, name, description)
    
    res.json({
      success: true,
      data: { project },
      message: 'Project created successfully'
    })
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * GET /api/projects/:projectId
 * Get project details
 */
router.get('/:projectId', auth, async (req, res) => {
  try {
    const userId = req.user!.userId
    const { projectId } = req.params

    const project = await projectsService.getProject(projectId, userId)
    
    res.json({
      success: true,
      data: { project }
    })
  } catch (error: any) {
    res.status(403).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * POST /api/projects/:projectId/invite
 * Invite user to project
 */
router.post('/:projectId/invite', auth, async (req, res) => {
  try {
    const userId = req.user!.userId
    const { projectId } = req.params
    const { email, role } = req.body

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      })
    }

    const member = await projectsService.inviteToProject(
      projectId,
      userId,
      email,
      role || 'contributor'
    )
    
    res.json({
      success: true,
      data: { member },
      message: 'Invite sent successfully'
    })
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * POST /api/projects/:projectId/respond
 * Accept/decline project invite
 */
router.post('/:projectId/respond', auth, async (req, res) => {
  try {
    const userId = req.user!.userId
    const { projectId } = req.params
    const { accept } = req.body

    const result = await projectsService.respondToInvite(projectId, userId, accept)
    
    res.json({
      success: true,
      data: result,
      message: accept ? 'Invite accepted' : 'Invite declined'
    })
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * PATCH /api/projects/:projectId/members/:memberId
 * Change member role
 */
router.patch('/:projectId/members/:memberId', auth, async (req, res) => {
  try {
    const userId = req.user!.userId
    const { projectId, memberId } = req.params
    const { role } = req.body

    if (!role) {
      return res.status(400).json({
        success: false,
        error: 'Role is required'
      })
    }

    const member = await projectsService.changeMemberRole(projectId, userId, memberId, role)
    
    res.json({
      success: true,
      data: { member },
      message: 'Role updated successfully'
    })
  } catch (error: any) {
    res.status(403).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * DELETE /api/projects/:projectId/members/:memberId
 * Remove member from project
 */
router.delete('/:projectId/members/:memberId', auth, async (req, res) => {
  try {
    const userId = req.user!.userId
    const { projectId, memberId } = req.params

    await projectsService.removeMember(projectId, userId, memberId)
    
    res.json({
      success: true,
      message: 'Member removed successfully'
    })
  } catch (error: any) {
    res.status(403).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * POST /api/projects/:projectId/items
 * Add item to project
 */
router.post('/:projectId/items', auth, async (req, res) => {
  try {
    const userId = req.user!.userId
    const { projectId } = req.params
    const { itemId, itemType, privacy } = req.body

    if (!itemId || !itemType) {
      return res.status(400).json({
        success: false,
        error: 'itemId and itemType are required'
      })
    }

    const item = await projectsService.addItemToProject(
      projectId,
      userId,
      itemId,
      itemType,
      privacy || 'project'
    )
    
    res.json({
      success: true,
      data: { item },
      message: 'Item added to project'
    })
  } catch (error: any) {
    res.status(403).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * POST /api/projects/:projectId/archive
 * Archive project
 */
router.post('/:projectId/archive', auth, async (req, res) => {
  try {
    const userId = req.user!.userId
    const { projectId } = req.params

    await projectsService.archiveProject(projectId, userId)
    
    res.json({
      success: true,
      message: 'Project archived successfully'
    })
  } catch (error: any) {
    res.status(403).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * GET /api/projects/:projectId/audit
 * Get project audit trail
 */
router.get('/:projectId/audit', auth, async (req, res) => {
  try {
    const userId = req.user!.userId
    const { projectId } = req.params
    const { itemId, actorId, limit } = req.query

    const trail = await projectsService.getAuditTrail(projectId, userId, {
      itemId: itemId as string,
      actorId: actorId as string,
      limit: limit ? parseInt(limit as string) : 100
    })
    
    res.json({
      success: true,
      data: { trail }
    })
  } catch (error: any) {
    res.status(403).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * POST /api/assign/:itemId
 * Assign user to item
 */
router.post('/assign/:itemId', auth, async (req, res) => {
  try {
    const userId = req.user!.userId
    const { itemId } = req.params
    const { assigneeId, itemType, role } = req.body

    if (!assigneeId || !itemType) {
      return res.status(400).json({
        success: false,
        error: 'assigneeId and itemType are required'
      })
    }

    const assignment = await projectsService.assignUser(
      itemId,
      itemType,
      userId,
      assigneeId,
      role || 'assignee'
    )
    
    res.json({
      success: true,
      data: { assignment },
      message: 'User assigned successfully'
    })
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: error.message
    })
  }
})

/**
 * GET /api/provenance/:itemId
 * Get item provenance
 */
router.get('/provenance/:itemId', auth, async (req, res) => {
  try {
    const { itemId } = req.params
    const provenance = await projectsService.getProvenance(itemId)
    
    res.json({
      success: true,
      data: { provenance }
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

export default router
