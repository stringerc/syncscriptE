import { Challenge } from '@/components/challenges/DailyChallengeCard';

/**
 * Mock daily challenges for demo/development
 */
export const mockChallenges: Challenge[] = [
  {
    id: 'daily-1',
    title: 'Peak Performance',
    description: 'Complete 3 tasks while at PEAK or HIGH energy',
    type: 'daily',
    progress: 2,
    target: 3,
    reward: {
      points: 150,
      emblem: {
        name: 'Thunder Storm',
        emoji: '⚡',
        rarity: 'epic',
      },
    },
    difficulty: 'medium',
    expiresAt: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours
    completed: false,
    icon: '🔥',
  },
  {
    id: 'daily-2',
    title: 'Morning Momentum',
    description: 'Log your energy before 9am',
    type: 'daily',
    progress: 1,
    target: 1,
    reward: {
      points: 50,
    },
    difficulty: 'easy',
    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours
    completed: true,
    icon: '🌅',
  },
  {
    id: 'daily-3',
    title: 'Consistency Counts',
    description: 'Complete at least 5 tasks today',
    type: 'daily',
    progress: 3,
    target: 5,
    reward: {
      points: 100,
    },
    difficulty: 'medium',
    expiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000), // 8 hours
    completed: false,
    icon: '🎯',
  },
  {
    id: 'weekly-1',
    title: 'Seven Day Streak',
    description: 'Log your energy for 7 consecutive days',
    type: 'weekly',
    progress: 5,
    target: 7,
    reward: {
      points: 500,
      emblem: {
        name: 'Sunrise Keeper',
        emoji: '🌄',
        rarity: 'rare',
      },
    },
    difficulty: 'hard',
    expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
    completed: false,
    icon: '🔥',
  },
  {
    id: 'weekly-2',
    title: 'Time Master',
    description: 'Schedule 15 events this week',
    type: 'weekly',
    progress: 8,
    target: 15,
    reward: {
      points: 300,
      emblem: {
        name: 'Chrono Keeper',
        emoji: '⏰',
        rarity: 'rare',
      },
    },
    difficulty: 'medium',
    expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
    completed: false,
    icon: '📅',
  },
  {
    id: 'monthly-1',
    title: 'Productivity Legend',
    description: 'Complete 100 tasks this month',
    type: 'monthly',
    progress: 47,
    target: 100,
    reward: {
      points: 1000,
      emblem: {
        name: 'Diamond Focus',
        emoji: '💎',
        rarity: 'legendary',
      },
    },
    difficulty: 'hard',
    expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
    completed: false,
    icon: '👑',
  },
];

/**
 * Get challenges filtered by type
 */
export function getChallengesByType(type: Challenge['type']): Challenge[] {
  return mockChallenges.filter(c => c.type === type);
}

/**
 * Get active (incomplete) challenges
 */
export function getActiveChallenges(): Challenge[] {
  return mockChallenges.filter(c => !c.completed);
}

/**
 * Get completed challenges ready to claim
 */
export function getCompletedChallenges(): Challenge[] {
  return mockChallenges.filter(c => c.completed);
}

/**
 * Simulate claiming a challenge reward
 */
export function claimChallenge(challengeId: string): {
  points: number;
  emblem?: Challenge['reward']['emblem'];
} {
  const challenge = mockChallenges.find(c => c.id === challengeId);
  if (!challenge) {
    throw new Error('Challenge not found');
  }

  return {
    points: challenge.reward.points,
    emblem: challenge.reward.emblem,
  };
}

