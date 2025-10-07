import express from 'express';
import { z } from 'zod';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import energyTrackingService, { EnergyLevel } from '../services/energyTrackingService';
import emblemService from '../services/emblemService';
import aiInsightsService from '../services/aiInsightsService';

const router = express.Router();

// Validation schemas
const logEnergySchema = z.object({
  energyLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'PEAK']),
  mood: z.string().optional(),
  notes: z.string().optional()
});

const equipEmblemSchema = z.object({
  emblemId: z.string().min(1)
});

// POST /api/energy/log - Log current energy level
router.post('/log', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { energyLevel, mood, notes } = logEnergySchema.parse(req.body);
  const userId = req.user!.id;

  const log = await energyTrackingService.logEnergy(userId, energyLevel as EnergyLevel, {
    mood,
    notes,
    source: 'manual'
  });

  res.json({
    success: true,
    data: log,
    message: `Energy logged: ${energyLevel}`
  });
}));

// GET /api/energy/history - Get energy history
router.get('/history', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const days = req.query.days ? parseInt(req.query.days as string) : 7;

  const history = await energyTrackingService.getEnergyHistory(userId, days);

  res.json({
    success: true,
    data: history
  });
}));

// GET /api/energy/pattern - Get energy pattern analysis
router.get('/pattern', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  const pattern = await energyTrackingService.analyzeEnergyPattern(userId);

  res.json({
    success: true,
    data: pattern
  });
}));

// POST /api/energy/predict - Predict energy for a time
router.post('/predict', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { targetTime } = req.body;

  if (!targetTime) {
    throw createError('targetTime is required', 400);
  }

  const prediction = await energyTrackingService.predictEnergy(
    userId, 
    new Date(targetTime)
  );

  res.json({
    success: true,
    data: prediction
  });
}));

// GET /api/energy/emblems - Get all emblems
router.get('/emblems', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const emblems = await emblemService.getAllEmblems();

  res.json({
    success: true,
    data: emblems
  });
}));

// GET /api/energy/emblems/mine - Get user's emblems with unlock status
router.get('/emblems/mine', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  const userEmblems = await emblemService.getUserEmblems(userId);

  res.json({
    success: true,
    data: userEmblems
  });
}));

// GET /api/energy/emblems/equipped - Get equipped emblems
router.get('/emblems/equipped', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  const equipped = await emblemService.getEquippedEmblems(userId);

  res.json({
    success: true,
    data: equipped
  });
}));

// POST /api/energy/emblems/equip - Equip an emblem
router.post('/emblems/equip', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { emblemId } = equipEmblemSchema.parse(req.body);
  const userId = req.user!.id;

  await emblemService.equipEmblem(userId, emblemId);

  res.json({
    success: true,
    message: 'Emblem equipped successfully'
  });
}));

// POST /api/energy/emblems/unequip - Unequip an emblem
router.post('/emblems/unequip', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { emblemId } = equipEmblemSchema.parse(req.body);
  const userId = req.user!.id;

  await emblemService.unequipEmblem(userId, emblemId);

  res.json({
    success: true,
    message: 'Emblem unequipped successfully'
  });
}));

// GET /api/energy/bonuses - Get active bonuses
router.get('/bonuses', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  const bonuses = await emblemService.calculateActiveBonuses(userId);

  res.json({
    success: true,
    data: bonuses
  });
}));

// GET /api/energy/insights - Get AI-generated insights
router.get('/insights', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  const insights = await aiInsightsService.generateInsights(userId);

  res.json({
    success: true,
    data: insights
  });
}));

// POST /api/energy/suggestions - Get task suggestions for current energy
router.post('/suggestions', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { energyLevel } = req.body;

  if (!energyLevel) {
    throw createError('energyLevel is required', 400);
  }

  const suggestions = await aiInsightsService.generateTaskSuggestions(
    userId,
    energyLevel as EnergyLevel
  );

  res.json({
    success: true,
    data: suggestions
  });
}));

export default router;

