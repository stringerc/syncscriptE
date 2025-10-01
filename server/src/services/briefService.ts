import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface BriefCard {
  id?: string;
  cardType: string;
  title: string;
  reason?: string;
  keyFacts?: string[];
  icon?: string;
  color?: string;
  primaryAction: {
    label: string;
    endpoint: string;
    method: string;
    payload?: any;
  };
  secondaryActions?: Array<{
    label: string;
    action: string;
  }>;
  deepLink?: string;
  score: number;
  priority: number;
  metadata?: any;
}

export class BriefService {
  private static instance: BriefService;

  static getInstance(): BriefService {
    if (!BriefService.instance) {
      BriefService.instance = new BriefService();
    }
    return BriefService.instance;
  }

  /**
   * Build morning or evening brief for user
   */
  async buildBrief(userId: string, when: 'morning' | 'evening'): Promise<BriefCard[]> {
    try {
      logger.info('Building brief', { userId, when });

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Get user preferences
      const prefs = await this.getOrCreatePreferences(userId);

      // Check if brief is enabled
      if (when === 'morning' && !prefs.morningBriefEnabled) return [];
      if (when === 'evening' && !prefs.eveningBriefEnabled) return [];

      // Build all card types
      const cards: BriefCard[] = [];

      if (when === 'morning') {
        cards.push(...await this.buildFirstBlockCard(userId, prefs));
        cards.push(...await this.buildCriticalPrepCards(userId, prefs));
        cards.push(...await this.buildConflictsCard(userId, prefs));
        cards.push(...await this.buildPinnedEventsCards(userId, prefs));
        cards.push(...await this.buildBudgetCard(userId, prefs));
        cards.push(...await this.buildWeatherCard(userId, prefs));
        cards.push(...await this.buildTemplateRecommendationCards(userId, prefs));
        cards.push(...await this.buildApprovalsCards(userId, prefs));
        cards.push(...await this.buildChallengeCard(userId, prefs));
      } else {
        cards.push(...await this.buildJournalCard(userId, prefs));
        cards.push(...await this.buildCompletionRecapCard(userId, prefs));
        cards.push(...await this.buildBufferRiskCard(userId, prefs));
        cards.push(...await this.buildBudgetDeltaCard(userId, prefs));
        cards.push(...await this.buildTomorrowSetupCard(userId, prefs));
        cards.push(...await this.buildSaveAsPlaybookCard(userId, prefs));
      }

      // Sort by score (highest first), then by priority
      cards.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return b.priority - a.priority;
      });

      // Limit to maxCards
      const topCards = cards.slice(0, prefs.maxCards);

      // Save cards to database
      await this.saveCards(userId, when, today, topCards);

      logger.info('Brief built', { userId, when, cardCount: topCards.length });
      return topCards;
    } catch (error: any) {
      logger.error('Failed to build brief', { userId, when, error: error.message });
      throw error;
    }
  }

  /**
   * Get or create user preferences
   */
  private async getOrCreatePreferences(userId: string): Promise<any> {
    let prefs = await prisma.briefPreferences.findUnique({
      where: { userId }
    });

    if (!prefs) {
      prefs = await prisma.briefPreferences.create({
        data: { userId }
      });
    }

    return prefs;
  }

  /**
   * Save cards to database
   */
  private async saveCards(userId: string, briefType: string, date: Date, cards: BriefCard[]): Promise<void> {
    // Delete old cards for this brief
    await prisma.briefCard.deleteMany({
      where: {
        userId,
        briefType: briefType.toUpperCase(),
        date: {
          gte: date,
          lt: new Date(date.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    // Create new cards
    await prisma.briefCard.createMany({
      data: cards.map((card, index) => ({
        userId,
        briefType: briefType.toUpperCase(),
        cardType: card.cardType,
        date,
        score: card.score,
        priority: card.priority,
        title: card.title,
        reason: card.reason,
        keyFacts: card.keyFacts ? JSON.stringify(card.keyFacts) : null,
        icon: card.icon,
        color: card.color,
        primaryAction: JSON.stringify(card.primaryAction),
        secondaryActions: card.secondaryActions ? JSON.stringify(card.secondaryActions) : null,
        deepLink: card.deepLink,
        metadata: card.metadata ? JSON.stringify(card.metadata) : null
      }))
    });
  }

  // ============================================================
  // MORNING BRIEF CARD BUILDERS
  // ============================================================

  /**
   * First Block - Next timeblock to start now
   */
  private async buildFirstBlockCard(userId: string, prefs: any): Promise<BriefCard[]> {
    if (prefs.preferFirstBlock === 0) return [];

    // Get next scheduled task or suggested focus block
    const nextTask = await prisma.task.findFirst({
      where: {
        userId,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        scheduledAt: { gte: new Date() }
      },
      orderBy: { scheduledAt: 'asc' }
    });

    if (!nextTask) return [];

    return [{
      cardType: 'FIRST_BLOCK',
      title: 'Start Your Day',
      reason: 'Your first scheduled block is ready',
      keyFacts: [
        `Task: ${nextTask.title}`,
        `Estimated: ${nextTask.estimatedDuration || 30} minutes`,
        nextTask.scheduledAt ? `Scheduled: ${new Date(nextTask.scheduledAt).toLocaleTimeString()}` : undefined
      ].filter(Boolean) as string[],
      icon: 'Zap',
      color: 'blue',
      primaryAction: {
        label: 'Start Focus Lock',
        endpoint: '/api/focus-lock/start',
        method: 'POST',
        payload: { taskId: nextTask.id }
      },
      secondaryActions: [
        { label: 'Move 30m', action: 'reschedule' },
        { label: 'Skip', action: 'dismiss' }
      ],
      deepLink: `/tasks?id=${nextTask.id}`,
      score: 95 + prefs.preferFirstBlock,
      priority: 10
    }];
  }

  /**
   * Critical Prep - Critical path tasks due today
   */
  private async buildCriticalPrepCards(userId: string, prefs: any): Promise<BriefCard[]> {
    if (prefs.preferCriticalPrep === 0) return [];

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const criticalTasks = await prisma.task.findMany({
      where: {
        userId,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        priority: { in: ['HIGH', 'URGENT'] },
        dueDate: { lte: today }
      },
      orderBy: [
        { priority: 'desc' },
        { dueDate: 'asc' }
      ],
      take: 3
    });

    if (criticalTasks.length === 0) return [];

    return [{
      cardType: 'CRITICAL_PREP',
      title: `${criticalTasks.length} Critical Task${criticalTasks.length > 1 ? 's' : ''} Due Today`,
      reason: 'These tasks are on the critical path',
      keyFacts: criticalTasks.map(t => `${t.priority}: ${t.title}`),
      icon: 'AlertTriangle',
      color: 'red',
      primaryAction: {
        label: 'View Tasks',
        endpoint: '/tasks',
        method: 'GET'
      },
      secondaryActions: [
        { label: 'Start first task', action: 'start_focus' }
      ],
      deepLink: '/tasks?filter=critical',
      score: 90 + prefs.preferCriticalPrep,
      priority: 9
    }];
  }

  /**
   * Conflicts - Schedule conflicts needing resolution
   */
  private async buildConflictsCard(userId: string, prefs: any): Promise<BriefCard[]> {
    if (prefs.preferConflicts === 0) return [];

    // Get today's events
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const events = await prisma.event.findMany({
      where: {
        userId,
        startTime: { gte: today, lt: tomorrow }
      },
      orderBy: { startTime: 'asc' }
    });

    // Detect overlaps
    const conflicts: any[] = [];
    for (let i = 0; i < events.length - 1; i++) {
      const current = events[i];
      const next = events[i + 1];
      
      if (new Date(current.endTime) > new Date(next.startTime)) {
        conflicts.push({
          event1: current,
          event2: next,
          overlap: (new Date(current.endTime).getTime() - new Date(next.startTime).getTime()) / (1000 * 60)
        });
      }
    }

    if (conflicts.length === 0) return [];

    return [{
      cardType: 'CONFLICTS',
      title: `${conflicts.length} Schedule Conflict${conflicts.length > 1 ? 's' : ''} Detected`,
      reason: 'Fix these to avoid missed commitments',
      keyFacts: conflicts.slice(0, 3).map(c => 
        `${c.event1.title} overlaps ${c.event2.title} by ${Math.round(c.overlap)} min`
      ),
      icon: 'AlertCircle',
      color: 'orange',
      primaryAction: {
        label: 'Fix All',
        endpoint: '/api/scheduling/resolve-conflicts',
        method: 'POST',
        payload: { conflictIds: conflicts.map((_, i) => i) }
      },
      secondaryActions: [
        { label: 'Review individually', action: 'review' }
      ],
      deepLink: '/calendar?view=conflicts',
      score: 95 + prefs.preferConflicts,
      priority: 10,
      metadata: { conflicts }
    }];
  }

  /**
   * Pinned Events - Today's actions for pinned items
   */
  private async buildPinnedEventsCards(userId: string, prefs: any): Promise<BriefCard[]> {
    if (prefs.preferPinned === 0) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const pinnedEvents = await prisma.event.findMany({
      where: {
        userId,
        isPinned: true,
        startTime: { gte: today, lt: tomorrow }
      },
      include: {
        preparationTasks: {
          where: { status: { in: ['PENDING', 'IN_PROGRESS'] } }
        }
      },
      orderBy: { startTime: 'asc' }
    });

    if (pinnedEvents.length === 0) return [];

    return pinnedEvents.map(event => ({
      cardType: 'PINNED_EVENT',
      title: event.title,
      reason: 'Pinned event today',
      keyFacts: [
        `Time: ${new Date(event.startTime).toLocaleTimeString()}`,
        `Location: ${event.location || 'Not set'}`,
        `Pending tasks: ${event.preparationTasks.length}`
      ],
      icon: 'Pin',
      color: 'purple',
      primaryAction: {
        label: 'Open Run-of-Show',
        endpoint: `/calendar/${event.id}`,
        method: 'GET'
      },
      secondaryActions: [
        { label: 'Add missing step', action: 'suggest' }
      ],
      deepLink: `/calendar?event=${event.id}`,
      score: 85 + prefs.preferPinned,
      priority: 8
    }));
  }

  /**
   * Budget - Safe to spend today
   */
  private async buildBudgetCard(userId: string, prefs: any): Promise<BriefCard[]> {
    if (prefs.preferBudget === 0) return [];

    // Get active budget
    const budget = await prisma.budget.findFirst({
      where: {
        userId,
        isActive: true,
        startDate: { lte: new Date() },
        OR: [
          { endDate: { gte: new Date() } },
          { endDate: null }
        ]
      },
      include: { categories: true }
    });

    if (!budget) return [];

    const totalSpent = budget.categories.reduce((sum, cat) => sum + cat.spentAmount, 0);
    const totalBudget = budget.categories.reduce((sum, cat) => sum + cat.budgetedAmount, 0);
    const remaining = totalBudget - totalSpent;

    // Calculate safe to spend today
    const daysLeft = budget.endDate 
      ? Math.ceil((budget.endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      : 30;
    const safeToSpendToday = remaining / Math.max(daysLeft, 1);

    return [{
      cardType: 'BUDGET',
      title: `Safe to Spend Today: $${safeToSpendToday.toFixed(2)}`,
      reason: `${daysLeft} days left in budget period`,
      keyFacts: [
        `Budget remaining: $${remaining.toFixed(2)}`,
        `Total spent: $${totalSpent.toFixed(2)} / $${totalBudget.toFixed(2)}`,
        `Avg per day: $${safeToSpendToday.toFixed(2)}`
      ],
      icon: 'DollarSign',
      color: safeToSpendToday < 0 ? 'red' : safeToSpendToday < 20 ? 'orange' : 'green',
      primaryAction: {
        label: 'View Budget',
        endpoint: '/financial',
        method: 'GET'
      },
      secondaryActions: [
        { label: 'Adjust plan', action: 'adjust_budget' }
      ],
      deepLink: '/financial?tab=overview',
      score: 70 + prefs.preferBudget,
      priority: 7
    }];
  }

  /**
   * Weather - Weather impact on today's events
   */
  private async buildWeatherCard(userId: string, prefs: any): Promise<BriefCard[]> {
    if (prefs.preferWeather === 0) return [];

    // Get today's outdoor events
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const outdoorEvents = await prisma.event.findMany({
      where: {
        userId,
        startTime: { gte: today, lt: tomorrow },
        location: { not: null }
      }
    });

    if (outdoorEvents.length === 0) return [];

    // TODO: Integrate with weather service for real weather data
    // For now, return placeholder
    return [{
      cardType: 'WEATHER',
      title: 'Weather Check',
      reason: `${outdoorEvents.length} outdoor event${outdoorEvents.length > 1 ? 's' : ''} today`,
      keyFacts: outdoorEvents.map(e => e.title),
      icon: 'Cloud',
      color: 'blue',
      primaryAction: {
        label: 'View Forecast',
        endpoint: '/dashboard',
        method: 'GET'
      },
      deepLink: '/calendar',
      score: 60 + prefs.preferWeather,
      priority: 6
    }];
  }

  /**
   * Templates - Playbook recommendations for upcoming events
   */
  private async buildTemplateRecommendationCards(userId: string, prefs: any): Promise<BriefCard[]> {
    if (prefs.preferTemplates === 0) return [];

    // Get events in next 14 days without templates applied
    const twoWeeksFromNow = new Date();
    twoWeeksFromNow.setDate(twoWeeksFromNow.getDate() + 14);

    const upcomingEvents = await prisma.event.findMany({
      where: {
        userId,
        startTime: { gte: new Date(), lte: twoWeeksFromNow },
        aiGenerated: false // Haven't applied template yet
      },
      take: 3,
      orderBy: { startTime: 'asc' }
    });

    if (upcomingEvents.length === 0) return [];

    return upcomingEvents.map(event => ({
      cardType: 'TEMPLATE_RECOMMENDATION',
      title: `Playbook Available: ${event.title}`,
      reason: `Event in ${Math.ceil((new Date(event.startTime).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days`,
      keyFacts: [
        `Date: ${new Date(event.startTime).toLocaleDateString()}`,
        'AI can generate preparation tasks'
      ],
      icon: 'BookTemplate',
      color: 'purple',
      primaryAction: {
        label: 'Apply Playbook',
        endpoint: '/api/ai/generate-tasks',
        method: 'POST',
        payload: { eventId: event.id }
      },
      secondaryActions: [
        { label: 'Preview', action: 'preview' },
        { label: 'Skip', action: 'dismiss' }
      ],
      deepLink: `/templates?event=${event.id}`,
      score: 65 + prefs.preferTemplates,
      priority: 7
    }));
  }

  /**
   * Approvals - Pending ShareScript approvals
   */
  private async buildApprovalsCards(userId: string, prefs: any): Promise<BriefCard[]> {
    if (prefs.preferApprovals === 0) return [];

    // Get pending assignments in active projects
    const pendingAssignments = await prisma.assignment.findMany({
      where: {
        assigneeId: userId,
        status: 'PENDING'
      },
      include: {
        projectItem: {
          include: { project: true }
        }
      },
      take: 3
    });

    if (pendingAssignments.length === 0) return [];

    return [{
      cardType: 'APPROVALS',
      title: `${pendingAssignments.length} Pending Approval${pendingAssignments.length > 1 ? 's' : ''}`,
      reason: 'Team members waiting on your response',
      keyFacts: pendingAssignments.map(a => 
        `${a.projectItem.project.name}: ${a.projectItem.title}`
      ),
      icon: 'UserPlus',
      color: 'teal',
      primaryAction: {
        label: 'Review All',
        endpoint: '/projects',
        method: 'GET'
      },
      deepLink: '/projects?filter=pending',
      score: 75 + prefs.preferApprovals,
      priority: 8
    }];
  }

  /**
   * Challenge - Daily energy challenge
   */
  private async buildChallengeCard(userId: string, prefs: any): Promise<BriefCard[]> {
    if (prefs.preferChallenges === 0) return [];

    // Get today's uncompleted challenge
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const challenge = await prisma.dailyChallenge.findFirst({
      where: {
        userId,
        date: { gte: today, lt: tomorrow },
        isCompleted: false
      }
    });

    if (!challenge) return [];

    return [{
      cardType: 'CHALLENGE',
      title: challenge.title,
      reason: `${challenge.domain} domain • ${challenge.epReward} EP reward`,
      keyFacts: [
        challenge.description,
        `Type: ${challenge.type === 'core' ? 'Core' : 'Stretch'}`,
        challenge.requiredMinutes ? `Duration: ${challenge.requiredMinutes} minutes` : undefined
      ].filter(Boolean) as string[],
      icon: 'Flame',
      color: 'orange',
      primaryAction: {
        label: 'Start Challenge',
        endpoint: '/api/energy-engine/challenges/start',
        method: 'POST',
        payload: { challengeId: challenge.id }
      },
      secondaryActions: [
        { label: 'Pick alternate', action: 'swap_challenge' }
      ],
      deepLink: `/gamification?tab=challenges`,
      score: 70 + prefs.preferChallenges,
      priority: 7
    }];
  }

  // ============================================================
  // EVENING BRIEF CARD BUILDERS
  // ============================================================

  /**
   * Journal/Recap - Evening reflection
   */
  private async buildJournalCard(userId: string, prefs: any): Promise<BriefCard[]> {
    if (prefs.preferJournal === 0) return [];

    // Get today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [tasksCompleted, eventsToday] = await Promise.all([
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
      })
    ]);

    return [{
      cardType: 'JOURNAL',
      title: 'Reflect on Your Day',
      reason: `${tasksCompleted} tasks completed, ${eventsToday} events attended`,
      keyFacts: [
        'What went well?',
        'What could improve?',
        'Any blockers?'
      ],
      icon: 'Book',
      color: 'indigo',
      primaryAction: {
        label: 'Log Reflection',
        endpoint: '/api/brief/journal',
        method: 'POST',
        payload: { date: today }
      },
      deepLink: '/journal',
      score: 90 + prefs.preferJournal,
      priority: 10
    }];
  }

  /**
   * Completion Recap - Today's completions
   */
  private async buildCompletionRecapCard(userId: string, prefs: any): Promise<BriefCard[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [completed, incomplete, streak] = await Promise.all([
      prisma.task.findMany({
        where: {
          userId,
          status: 'COMPLETED',
          completedAt: { gte: today, lt: tomorrow }
        },
        select: { title: true, priority: true }
      }),
      prisma.task.count({
        where: {
          userId,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          dueDate: { gte: today, lt: tomorrow }
        }
      }),
      prisma.streak.findFirst({
        where: { userId },
        orderBy: { currentStreak: 'desc' }
      })
    ]);

    return [{
      cardType: 'COMPLETION_RECAP',
      title: `${completed.length} Task${completed.length !== 1 ? 's' : ''} Completed Today`,
      reason: `${incomplete} still pending • ${streak?.currentStreak || 0} day streak`,
      keyFacts: completed.slice(0, 3).map(t => `✓ ${t.title}`),
      icon: 'CheckCircle',
      color: 'green',
      primaryAction: {
        label: incomplete > 0 ? 'Roll to Tomorrow' : 'Great Job!',
        endpoint: '/api/tasks/roll-incomplete',
        method: 'POST'
      },
      deepLink: '/tasks?filter=completed&date=today',
      score: 85,
      priority: 9
    }];
  }

  /**
   * Tomorrow Setup - Propose first block for tomorrow
   */
  private async buildTomorrowSetupCard(userId: string, prefs: any): Promise<BriefCard[]> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0); // Default 9 AM

    const topTask = await prisma.task.findFirst({
      where: {
        userId,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        priority: 'HIGH'
      },
      orderBy: { priority: 'desc' }
    });

    if (!topTask) return [];

    return [{
      cardType: 'TOMORROW_SETUP',
      title: 'Plan Tomorrow',
      reason: 'Start strong with your highest priority',
      keyFacts: [
        `First block: ${topTask.title}`,
        `Suggested time: 9:00 AM`,
        `Duration: ${topTask.estimatedDuration || 60} minutes`
      ],
      icon: 'Calendar',
      color: 'blue',
      primaryAction: {
        label: 'Schedule Block',
        endpoint: '/api/tasks/schedule',
        method: 'POST',
        payload: {
          taskId: topTask.id,
          scheduledAt: tomorrow.toISOString()
        }
      },
      deepLink: '/calendar?date=tomorrow',
      score: 75,
      priority: 7
    }];
  }

  /**
   * Save as Playbook - Suggest saving today as template
   */
  private async buildSaveAsPlaybookCard(userId: string, prefs: any): Promise<BriefCard[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find events with 8+ completed tasks
    const eventsWithTasks = await prisma.event.findMany({
      where: {
        userId,
        startTime: { gte: today, lt: tomorrow }
      },
      include: {
        preparationTasks: {
          where: { status: 'COMPLETED' }
        }
      }
    });

    const eligibleEvents = eventsWithTasks.filter(e => e.preparationTasks.length >= 8);
    
    if (eligibleEvents.length === 0) return [];

    const event = eligibleEvents[0];

    return [{
      cardType: 'SAVE_PLAYBOOK',
      title: `Save "${event.title}" as Playbook?`,
      reason: `${event.preparationTasks.length} tasks completed - could help others!`,
      keyFacts: [
        `Tasks: ${event.preparationTasks.length} completed`,
        'Share this workflow',
        'Help future events'
      ],
      icon: 'Save',
      color: 'purple',
      primaryAction: {
        label: 'Save as Template',
        endpoint: '/api/scripts/create-from-event',
        method: 'POST',
        payload: { eventId: event.id }
      },
      deepLink: `/templates/create?event=${event.id}`,
      score: 70,
      priority: 6
    }];
  }

  /**
   * Additional evening cards
   */
  private async buildBufferRiskCard(userId: string, prefs: any): Promise<BriefCard[]> {
    return []; // Placeholder for now
  }

  private async buildBudgetDeltaCard(userId: string, prefs: any): Promise<BriefCard[]> {
    return []; // Placeholder for now
  }
}

export const briefService = BriefService.getInstance();

