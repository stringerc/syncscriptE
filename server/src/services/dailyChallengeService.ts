import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import EnergyEngineService, { DailyChallengeData } from './energyEngineService';

const prisma = new PrismaClient();

export interface ChallengeTemplate {
  id: string;
  title: string;
  description: string;
  domain: string;
  type: 'core' | 'stretch';
  target: string;
  epReward: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

export class DailyChallengeService {
  // Challenge templates organized by domain
  static readonly CHALLENGE_TEMPLATES: ChallengeTemplate[] = [
    // Body domain
    {
      id: 'body_walk_10min',
      title: '10-Minute Walk',
      description: 'Take a 10-minute walk to get your body moving',
      domain: 'body',
      type: 'core',
      target: 'Walk for 10 minutes',
      epReward: 15,
      difficulty: 'easy',
      category: 'movement'
    },
    {
      id: 'body_stretch_5min',
      title: 'Morning Stretch',
      description: 'Do 5 minutes of stretching to start your day',
      domain: 'body',
      type: 'core',
      target: 'Stretch for 5 minutes',
      epReward: 10,
      difficulty: 'easy',
      category: 'flexibility'
    },
    {
      id: 'body_workout_30min',
      title: '30-Minute Workout',
      description: 'Complete a 30-minute workout session',
      domain: 'body',
      type: 'stretch',
      target: 'Work out for 30 minutes',
      epReward: 40,
      difficulty: 'hard',
      category: 'exercise'
    },
    
    // Mind domain
    {
      id: 'mind_read_20min',
      title: 'Read for 20 Minutes',
      description: 'Read a book, article, or educational content',
      domain: 'mind',
      type: 'core',
      target: 'Read for 20 minutes',
      epReward: 20,
      difficulty: 'easy',
      category: 'learning'
    },
    {
      id: 'mind_meditate_10min',
      title: '10-Minute Meditation',
      description: 'Practice mindfulness or meditation',
      domain: 'mind',
      type: 'core',
      target: 'Meditate for 10 minutes',
      epReward: 15,
      difficulty: 'medium',
      category: 'mindfulness'
    },
    {
      id: 'mind_learn_skill',
      title: 'Learn Something New',
      description: 'Spend 30 minutes learning a new skill',
      domain: 'mind',
      type: 'stretch',
      target: 'Learn for 30 minutes',
      epReward: 35,
      difficulty: 'hard',
      category: 'skill_development'
    },
    
    // Social domain
    {
      id: 'social_connect_friend',
      title: 'Connect with a Friend',
      description: 'Reach out to a friend or family member',
      domain: 'social',
      type: 'core',
      target: 'Connect with someone',
      epReward: 15,
      difficulty: 'easy',
      category: 'connection'
    },
    {
      id: 'social_compliment',
      title: 'Give a Genuine Compliment',
      description: 'Give someone a sincere compliment',
      domain: 'social',
      type: 'core',
      target: 'Give one compliment',
      epReward: 10,
      difficulty: 'easy',
      category: 'kindness'
    },
    {
      id: 'social_help_someone',
      title: 'Help Someone',
      description: 'Offer help to someone in need',
      domain: 'social',
      type: 'stretch',
      target: 'Help someone',
      epReward: 30,
      difficulty: 'medium',
      category: 'service'
    },
    
    // Order domain
    {
      id: 'order_organize_space',
      title: 'Organize a Space',
      description: 'Tidy up and organize one area of your home',
      domain: 'order',
      type: 'core',
      target: 'Organize one space',
      epReward: 20,
      difficulty: 'medium',
      category: 'organization'
    },
    {
      id: 'order_plan_tomorrow',
      title: 'Plan Tomorrow',
      description: 'Create a plan for tomorrow\'s tasks',
      domain: 'order',
      type: 'core',
      target: 'Plan tomorrow',
      epReward: 15,
      difficulty: 'easy',
      category: 'planning'
    },
    {
      id: 'order_deep_clean',
      title: 'Deep Clean',
      description: 'Do a thorough cleaning of one room',
      domain: 'order',
      type: 'stretch',
      target: 'Deep clean one room',
      epReward: 35,
      difficulty: 'hard',
      category: 'cleaning'
    },
    
    // Finance domain
    {
      id: 'finance_track_expenses',
      title: 'Track Expenses',
      description: 'Record your expenses for the day',
      domain: 'finance',
      type: 'core',
      target: 'Track expenses',
      epReward: 10,
      difficulty: 'easy',
      category: 'tracking'
    },
    {
      id: 'finance_review_budget',
      title: 'Review Budget',
      description: 'Review and update your budget',
      domain: 'finance',
      type: 'core',
      target: 'Review budget',
      epReward: 15,
      difficulty: 'medium',
      category: 'planning'
    },
    {
      id: 'finance_research_investment',
      title: 'Research Investment',
      description: 'Research a potential investment opportunity',
      domain: 'finance',
      type: 'stretch',
      target: 'Research investment',
      epReward: 25,
      difficulty: 'hard',
      category: 'investment'
    },
    
    // Outdoors domain
    {
      id: 'outdoors_nature_break',
      title: 'Nature Break',
      description: 'Spend 15 minutes outdoors in nature',
      domain: 'outdoors',
      type: 'core',
      target: 'Spend 15 minutes outdoors',
      epReward: 15,
      difficulty: 'easy',
      category: 'nature'
    },
    {
      id: 'outdoors_garden_work',
      title: 'Garden Work',
      description: 'Do some gardening or plant care',
      domain: 'outdoors',
      type: 'core',
      target: 'Do garden work',
      epReward: 20,
      difficulty: 'medium',
      category: 'gardening'
    },
    {
      id: 'outdoors_hike',
      title: 'Go for a Hike',
      description: 'Take a 45-minute hike or nature walk',
      domain: 'outdoors',
      type: 'stretch',
      target: 'Hike for 45 minutes',
      epReward: 40,
      difficulty: 'hard',
      category: 'hiking'
    },
    
    // Rest domain
    {
      id: 'rest_early_bed',
      title: 'Early to Bed',
      description: 'Go to bed 30 minutes earlier than usual',
      domain: 'rest',
      type: 'core',
      target: 'Sleep 30 minutes earlier',
      epReward: 15,
      difficulty: 'medium',
      category: 'sleep'
    },
    {
      id: 'rest_digital_detox',
      title: 'Digital Detox',
      description: 'Take a 1-hour break from screens',
      domain: 'rest',
      type: 'core',
      target: '1-hour screen break',
      epReward: 20,
      difficulty: 'medium',
      category: 'wellness'
    },
    {
      id: 'rest_spa_time',
      title: 'Spa Time',
      description: 'Treat yourself to a relaxing spa activity',
      domain: 'rest',
      type: 'stretch',
      target: 'Do spa activity',
      epReward: 30,
      difficulty: 'easy',
      category: 'relaxation'
    }
  ];

  /**
   * Generate daily challenges for a user
   */
  static async generateDailyChallenges(userId: string, date?: Date): Promise<DailyChallengeData[]> {
    const targetDate = date || new Date();
    targetDate.setHours(0, 0, 0, 0);

    // Check if challenges already exist for this date
    const existingChallenges = await prisma.dailyChallenge.findMany({
      where: {
        userId,
        date: targetDate
      }
    });

    if (existingChallenges.length > 0) {
      return existingChallenges.map(challenge => ({
        title: challenge.title,
        description: challenge.description,
        domain: challenge.domain,
        type: challenge.type as 'core' | 'stretch',
        target: challenge.target,
        epReward: challenge.epReward
      }));
    }

    // Get user's energy profile for personalization
    const energyProfile = await EnergyEngineService.getOrCreateEnergyProfile(userId);
    const domainWeights = energyProfile.domainWeights ? 
      JSON.parse(energyProfile.domainWeights) : 
      EnergyEngineService.DOMAINS.reduce((acc, domain) => {
        acc[domain.id] = domain.weight;
        return acc;
      }, {} as Record<string, number>);

    // Analyze user's recent activity to identify gaps
    const gaps = await this.analyzeUserGaps(userId);

    // Select 3 core challenges (one from each of the 3 lowest domains)
    const coreChallenges = this.selectCoreChallenges(domainWeights, gaps);
    
    // Select 1 stretch challenge (from a random domain)
    const stretchChallenge = this.selectStretchChallenge(domainWeights);

    const selectedChallenges = [...coreChallenges, stretchChallenge];

    // Create challenges in database
    const createdChallenges = await Promise.all(
      selectedChallenges.map(challenge => 
        prisma.dailyChallenge.create({
          data: {
            userId,
            title: challenge.title,
            description: challenge.description,
            domain: challenge.domain,
            type: challenge.type,
            target: challenge.target,
            epReward: challenge.epReward,
            date: targetDate,
            metadata: JSON.stringify({
              templateId: challenge.id,
              difficulty: challenge.difficulty,
              category: challenge.category
            })
          }
        })
      )
    );

    logger.info('Daily challenges generated', {
      userId,
      date: targetDate,
      challenges: createdChallenges.length,
      domains: selectedChallenges.map(c => c.domain)
    });

    return selectedChallenges;
  }

  /**
   * Analyze user's recent activity to identify domain gaps
   */
  private static async analyzeUserGaps(userId: string): Promise<Record<string, number>> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get recent EP by domain
    const recentEP = await prisma.energyPoint.groupBy({
      by: ['domain'],
      where: {
        userId,
        earnedAt: {
          gte: sevenDaysAgo
        },
        domain: {
          not: null
        }
      },
      _sum: {
        amount: true
      }
    });

    // Get recent completed challenges by domain
    const recentChallenges = await prisma.dailyChallenge.groupBy({
      by: ['domain'],
      where: {
        userId,
        isCompleted: true,
        date: {
          gte: sevenDaysAgo
        }
      },
      _count: {
        id: true
      }
    });

    // Calculate gaps (lower activity = higher gap score)
    const gaps: Record<string, number> = {};
    
    for (const domain of EnergyEngineService.DOMAINS) {
      const epData = recentEP.find(ep => ep.domain === domain.id);
      const challengeData = recentChallenges.find(ch => ch.domain === domain.id);
      
      const epScore = epData?._sum.amount || 0;
      const challengeScore = (challengeData?._count.id || 0) * 20; // Each challenge worth 20 points
      const totalScore = epScore + challengeScore;
      
      // Higher gap score means more attention needed
      gaps[domain.id] = Math.max(0, 100 - totalScore);
    }

    return gaps;
  }

  /**
   * Select 3 core challenges from domains with highest gaps
   */
  private static selectCoreChallenges(
    domainWeights: Record<string, number>,
    gaps: Record<string, number>
  ): ChallengeTemplate[] {
    // Sort domains by gap score (highest first)
    const sortedDomains = Object.entries(gaps)
      .sort(([, a], [, b]) => b - a)
      .map(([domain]) => domain);

    const selectedChallenges: ChallengeTemplate[] = [];
    const usedTemplates = new Set<string>();

    // Select one challenge from each of the top 3 gap domains
    for (let i = 0; i < Math.min(3, sortedDomains.length); i++) {
      const domain = sortedDomains[i];
      const domainChallenges = this.CHALLENGE_TEMPLATES.filter(
        template => template.domain === domain && template.type === 'core'
      );

      if (domainChallenges.length > 0) {
        // Select a random challenge from this domain
        const availableChallenges = domainChallenges.filter(
          challenge => !usedTemplates.has(challenge.id)
        );
        
        if (availableChallenges.length > 0) {
          const selectedChallenge = availableChallenges[
            Math.floor(Math.random() * availableChallenges.length)
          ];
          selectedChallenges.push(selectedChallenge);
          usedTemplates.add(selectedChallenge.id);
        }
      }
    }

    // If we don't have 3 challenges, fill with random core challenges
    while (selectedChallenges.length < 3) {
      const coreChallenges = this.CHALLENGE_TEMPLATES.filter(
        template => template.type === 'core' && !usedTemplates.has(template.id)
      );
      
      if (coreChallenges.length === 0) break;
      
      const selectedChallenge = coreChallenges[
        Math.floor(Math.random() * coreChallenges.length)
      ];
      selectedChallenges.push(selectedChallenge);
      usedTemplates.add(selectedChallenge.id);
    }

    return selectedChallenges;
  }

  /**
   * Select 1 stretch challenge
   */
  private static selectStretchChallenge(
    domainWeights: Record<string, number>
  ): ChallengeTemplate {
    const stretchChallenges = this.CHALLENGE_TEMPLATES.filter(
      template => template.type === 'stretch'
    );

    if (stretchChallenges.length === 0) {
      // Fallback to a random core challenge if no stretch challenges
      const coreChallenges = this.CHALLENGE_TEMPLATES.filter(
        template => template.type === 'core'
      );
      return coreChallenges[Math.floor(Math.random() * coreChallenges.length)];
    }

    const selectedChallenge = stretchChallenges[
      Math.floor(Math.random() * stretchChallenges.length)
    ];

    return selectedChallenge;
  }

  /**
   * Complete a daily challenge
   */
  static async completeChallenge(challengeId: string, userId: string) {
    const challenge = await prisma.dailyChallenge.findFirst({
      where: {
        id: challengeId,
        userId,
        isCompleted: false
      }
    });

    if (!challenge) {
      throw new Error('Challenge not found or already completed');
    }

    // Mark challenge as completed
    await prisma.dailyChallenge.update({
      where: { id: challengeId },
      data: {
        isCompleted: true,
        completedAt: new Date()
      }
    });

    // Award EP
    const epResult = await EnergyEngineService.awardEnergyPoints(
      userId,
      challenge.epReward,
      'challenge_completion',
      challenge.domain,
      `Completed challenge: ${challenge.title}`,
      {
        challengeId: challenge.id,
        challengeType: challenge.type,
        completedAt: new Date()
      }
    );

    logger.info('Daily challenge completed', {
      userId,
      challengeId,
      challengeTitle: challenge.title,
      epAwarded: epResult.awarded,
      domain: challenge.domain
    });

    return {
      challenge,
      epAwarded: epResult.awarded,
      capped: epResult.capped
    };
  }

  /**
   * Get user's daily challenges for a specific date
   */
  static async getDailyChallenges(userId: string, date?: Date) {
    const targetDate = date || new Date();
    targetDate.setHours(0, 0, 0, 0);

    let challenges = await prisma.dailyChallenge.findMany({
      where: {
        userId,
        date: targetDate
      },
      orderBy: [
        { type: 'asc' }, // core challenges first
        { domain: 'asc' }
      ]
    });

    // If no challenges exist, generate them
    if (challenges.length === 0) {
      await this.generateDailyChallenges(userId, targetDate);
      challenges = await prisma.dailyChallenge.findMany({
        where: {
          userId,
          date: targetDate
        },
        orderBy: [
          { type: 'asc' },
          { domain: 'asc' }
        ]
      });
    }

    return challenges;
  }

  /**
   * Get user's challenge statistics
   */
  static async getChallengeStats(userId: string) {
    const totalChallenges = await prisma.dailyChallenge.count({
      where: { userId }
    });

    const completedChallenges = await prisma.dailyChallenge.count({
      where: {
        userId,
        isCompleted: true
      }
    });

    const completionRate = totalChallenges > 0 ? 
      (completedChallenges / totalChallenges) * 100 : 0;

    // Get challenges by domain
    const domainStats = await prisma.dailyChallenge.groupBy({
      by: ['domain'],
      where: { userId },
      _count: {
        id: true
      },
      _sum: {
        epReward: true
      }
    });

    return {
      totalChallenges,
      completedChallenges,
      completionRate,
      domainStats: domainStats.map(stat => ({
        domain: stat.domain,
        total: stat._count.id,
        epEarned: stat._sum.epReward || 0
      }))
    };
  }
}

export default DailyChallengeService;