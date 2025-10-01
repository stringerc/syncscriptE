import express from 'express';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { briefService } from '../services/briefService';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// ============================================================
// BRIEF GENERATION
// ============================================================

// POST /api/brief/build - Build morning or evening brief
router.post('/build', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { when } = req.body;

  if (!['morning', 'evening'].includes(when)) {
    return res.status(400).json({
      success: false,
      error: 'when must be either "morning" or "evening"'
    });
  }

  const cards = await briefService.buildBrief(userId, when);

  res.json({
    success: true,
    data: {
      when,
      cards,
      generatedAt: new Date()
    }
  });
}));

// GET /api/brief/today - Get today's brief cards (cached)
router.get('/today', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { type = 'morning' } = req.query;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const cards = await prisma.briefCard.findMany({
    where: {
      userId,
      briefType: type === 'evening' ? 'EVENING' : 'MORNING',
      date: { gte: today, lt: tomorrow },
      dismissed: false
    },
    orderBy: [
      { score: 'desc' },
      { priority: 'desc' }
    ]
  });

  res.json({
    success: true,
    data: {
      cards: cards.map(card => ({
        ...card,
        keyFacts: card.keyFacts ? JSON.parse(card.keyFacts) : [],
        primaryAction: JSON.parse(card.primaryAction),
        secondaryActions: card.secondaryActions ? JSON.parse(card.secondaryActions) : [],
        metadata: card.metadata ? JSON.parse(card.metadata) : null
      }))
    }
  });
}));

// POST /api/brief/action - Execute a card's primary action
router.post('/action', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { cardId, action } = req.body;

  const card = await prisma.briefCard.findFirst({
    where: { id: cardId, userId }
  });

  if (!card) {
    return res.status(404).json({
      success: false,
      error: 'Card not found'
    });
  }

  // Mark card as action taken
  await prisma.briefCard.update({
    where: { id: cardId },
    data: {
      actionTaken: true,
      actionTakenAt: new Date()
    }
  });

  const actionData = JSON.parse(card.primaryAction);

  res.json({
    success: true,
    data: {
      action: actionData,
      message: 'Action recorded'
    }
  });
}));

// POST /api/brief/dismiss - Dismiss a card
router.post('/dismiss', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { cardId } = req.body;

  await prisma.briefCard.updateMany({
    where: {
      id: cardId,
      userId
    },
    data: {
      dismissed: true,
      dismissedAt: new Date()
    }
  });

  res.json({
    success: true,
    message: 'Card dismissed'
  });
}));

// ============================================================
// JOURNAL ENTRIES
// ============================================================

// POST /api/brief/journal - Create/update journal entry
router.post('/journal', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  
  const schema = z.object({
    date: z.string(),
    highlights: z.array(z.string()).optional(),
    lowlights: z.array(z.string()).optional(),
    blockers: z.array(z.string()).optional(),
    freeformNote: z.string().optional()
  });

  const data = schema.parse(req.body);
  const entryDate = new Date(data.date);
  entryDate.setHours(0, 0, 0, 0);

  // Get today's stats
  const today = new Date(entryDate);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [tasksCompleted, eventsAttended, energyPoints] = await Promise.all([
    prisma.task.count({
      where: {
        userId,
        status: 'COMPLETED',
        completedAt: { gte: today, lt: tomorrow }
      }
    }),
    prisma.event.count({
      where: {
        userId,
        startTime: { gte: today, lt: tomorrow }
      }
    }),
    prisma.energyPoint.aggregate({
      where: {
        userId,
        earnedAt: { gte: today, lt: tomorrow }
      },
      _sum: { amount: true }
    })
  ]);

  // Upsert journal entry
  const entry = await prisma.journalEntry.upsert({
    where: {
      userId_date: {
        userId,
        date: entryDate
      }
    },
    update: {
      highlights: data.highlights ? JSON.stringify(data.highlights) : undefined,
      lowlights: data.lowlights ? JSON.stringify(data.lowlights) : undefined,
      blockers: data.blockers ? JSON.stringify(data.blockers) : undefined,
      freeformNote: data.freeformNote,
      tasksCompleted,
      eventsAttended,
      energyPointsEarned: energyPoints._sum.amount || 0
    },
    create: {
      userId,
      date: entryDate,
      highlights: data.highlights ? JSON.stringify(data.highlights) : null,
      lowlights: data.lowlights ? JSON.stringify(data.lowlights) : null,
      blockers: data.blockers ? JSON.stringify(data.blockers) : null,
      freeformNote: data.freeformNote,
      tasksCompleted,
      eventsAttended,
      energyPointsEarned: energyPoints._sum.amount || 0
    }
  });

  res.json({
    success: true,
    data: { entry },
    message: 'Journal entry saved'
  });
}));

// GET /api/brief/journal - Get journal entries
router.get('/journal', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { startDate, endDate, limit = '30' } = req.query;

  const where: any = { userId };
  
  if (startDate && endDate) {
    where.date = {
      gte: new Date(startDate as string),
      lte: new Date(endDate as string)
    };
  }

  const entries = await prisma.journalEntry.findMany({
    where,
    orderBy: { date: 'desc' },
    take: parseInt(limit as string)
  });

  const formattedEntries = entries.map(entry => ({
    ...entry,
    highlights: entry.highlights ? JSON.parse(entry.highlights) : [],
    lowlights: entry.lowlights ? JSON.parse(entry.lowlights) : [],
    blockers: entry.blockers ? JSON.parse(entry.blockers) : [],
    tomorrowPriorities: entry.tomorrowPriorities ? JSON.parse(entry.tomorrowPriorities) : []
  }));

  res.json({
    success: true,
    data: { entries: formattedEntries }
  });
}));

// ============================================================
// PREFERENCES
// ============================================================

// GET /api/brief/prefs - Get user brief preferences
router.get('/prefs', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  let prefs = await prisma.briefPreferences.findUnique({
    where: { userId }
  });

  if (!prefs) {
    prefs = await prisma.briefPreferences.create({
      data: { userId }
    });
  }

  res.json({
    success: true,
    data: { preferences: prefs }
  });
}));

// PATCH /api/brief/prefs - Update brief preferences
router.patch('/prefs', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  const prefs = await prisma.briefPreferences.upsert({
    where: { userId },
    update: req.body,
    create: {
      userId,
      ...req.body
    }
  });

  res.json({
    success: true,
    data: { preferences: prefs },
    message: 'Preferences updated'
  });
}));

export default router;

