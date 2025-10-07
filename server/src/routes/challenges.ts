import express from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import dailyChallengeService from '../services/dailyChallengeService';

const router = express.Router();

// GET /api/challenges/active - Get today's active challenge
router.get('/active', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  let challenge = await dailyChallengeService.getActiveChallenge(userId);

  // Generate one if doesn't exist
  if (!challenge) {
    challenge = await dailyChallengeService.generateDailyChallenge(userId);
  }

  res.json({
    success: true,
    data: challenge
  });
}));

// POST /api/challenges/generate - Generate a new daily challenge
router.post('/generate', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  const challenge = await dailyChallengeService.generateDailyChallenge(userId);

  res.json({
    success: true,
    data: challenge,
    message: 'Daily challenge generated'
  });
}));

// GET /api/challenges/stats - Get challenge statistics
router.get('/stats', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  const stats = await dailyChallengeService.getChallengeStats(userId);

  res.json({
    success: true,
    data: stats
  });
}));

export default router;

