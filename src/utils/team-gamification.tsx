/**
 * Team Gamification System (Phase 6E)
 * 
 * Comprehensive team gamification featuring achievements, leaderboards,
 * challenges, badges, and collaborative rewards.
 * 
 * Features:
 * - Team achievements (unlockable milestones)
 * - Team leaderboards (rankings across teams)
 * - Team challenges (time-based collaborative goals)
 * - Point sharing (distribute energy to team members)
 * - Team badges and trophies
 * - Celebration moments
 * - Streak tracking
 * - Collective rewards
 */

// ============================================================================
// TYPES
// ============================================================================

export type AchievementCategory = 
  | 'energy' 
  | 'collaboration' 
  | 'resonance' 
  | 'events' 
  | 'consistency' 
  | 'growth';

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export type ChallengeStatus = 'active' | 'completed' | 'failed' | 'expired';

export type RewardType = 'badge' | 'trophy' | 'title' | 'boost' | 'unlock';

export interface TeamAchievement {
  id: string;
  category: AchievementCategory;
  tier: AchievementTier;
  
  name: string;
  description: string;
  icon: string;
  
  // Requirements
  requirement: {
    type: 'energy' | 'members' | 'events' | 'resonance' | 'streak' | 'custom';
    target: number;
    current: number;
  };
  
  // Rewards
  rewards: TeamReward[];
  
  // Status
  unlocked: boolean;
  unlockedAt?: Date;
  unlockedBy?: string[]; // User IDs who contributed
  progress: number; // 0-100
  
  // Metadata
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  points: number; // Achievement points
}

export interface TeamReward {
  type: RewardType;
  name: string;
  description: string;
  icon?: string;
  value?: number;
  duration?: number; // For temporary boosts (in hours)
}

export interface TeamChallenge {
  id: string;
  name: string;
  description: string;
  icon: string;
  
  // Challenge details
  type: 'energy' | 'events' | 'resonance' | 'collaboration';
  goal: number;
  current: number;
  
  // Time-based
  startDate: Date;
  endDate: Date;
  status: ChallengeStatus;
  
  // Participation
  participatingMembers: string[]; // User IDs
  requiredParticipation: number; // Minimum % of team
  
  // Rewards
  rewards: TeamReward[];
  
  // Difficulty
  difficulty: 'easy' | 'medium' | 'hard' | 'extreme';
  points: number;
}

export interface TeamLeaderboardEntry {
  rank: number;
  teamId: string;
  teamName: string;
  teamColor: string;
  
  // Scores
  totalPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
  
  // Stats
  memberCount: number;
  averageResonance: number;
  totalEnergy: number;
  achievementsUnlocked: number;
  challengesCompleted: number;
  
  // Trends
  rankChange: number; // +/- from previous period
  trend: 'rising' | 'falling' | 'stable';
  
  // Badges
  badges: TeamBadge[];
}

export interface TeamBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  tier: AchievementTier;
  earnedAt: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface TeamStreak {
  type: 'daily' | 'weekly' | 'event' | 'resonance';
  current: number;
  longest: number;
  lastUpdate: Date;
  active: boolean;
}

export interface TeamStats {
  // Overall
  totalPoints: number;
  level: number;
  experiencePoints: number;
  nextLevelXP: number;
  
  // Achievements
  achievementsUnlocked: number;
  totalAchievements: number;
  achievementPoints: number;
  
  // Challenges
  challengesActive: number;
  challengesCompleted: number;
  challengeSuccessRate: number; // 0-100
  
  // Streaks
  streaks: {
    daily: TeamStreak;
    weekly: TeamStreak;
    event: TeamStreak;
    resonance: TeamStreak;
  };
  
  // Leaderboard
  globalRank: number;
  categoryRanks: {
    energy: number;
    collaboration: number;
    resonance: number;
    consistency: number;
  };
  
  // Rewards
  badgesEarned: number;
  trophiesEarned: number;
  activeBadges: TeamBadge[];
}

export interface PointTransfer {
  id: string;
  fromUserId: string;
  fromUserName: string;
  toUserId: string;
  toUserName: string;
  amount: number;
  reason?: string;
  timestamp: Date;
  teamId: string;
}

export interface CelebrationMoment {
  id: string;
  type: 'achievement' | 'challenge' | 'milestone' | 'level-up' | 'streak';
  title: string;
  description: string;
  icon: string;
  color: string;
  timestamp: Date;
  participants: string[]; // User IDs
  rewards?: TeamReward[];
}

// ============================================================================
// ACHIEVEMENT DEFINITIONS
// ============================================================================

export const TEAM_ACHIEVEMENTS: Omit<TeamAchievement, 'unlocked' | 'unlockedAt' | 'unlockedBy' | 'requirement' | 'progress'>[] = [
  // Energy Achievements
  {
    id: 'energy-1k',
    category: 'energy',
    tier: 'bronze',
    name: 'Energy Spark',
    description: 'Team earns 1,000 total energy points',
    icon: '⚡',
    rarity: 'common',
    points: 100,
    rewards: [
      { type: 'badge', name: 'Energy Spark Badge', description: 'Your team is generating energy!' },
    ],
  },
  {
    id: 'energy-10k',
    category: 'energy',
    tier: 'silver',
    name: 'Energy Wave',
    description: 'Team earns 10,000 total energy points',
    icon: '⚡',
    rarity: 'rare',
    points: 250,
    rewards: [
      { type: 'badge', name: 'Energy Wave Badge', description: 'Riding the energy wave!' },
      { type: 'boost', name: '10% Energy Boost', description: '+10% energy for 24 hours', value: 10, duration: 24 },
    ],
  },
  {
    id: 'energy-50k',
    category: 'energy',
    tier: 'gold',
    name: 'Energy Storm',
    description: 'Team earns 50,000 total energy points',
    icon: '⚡',
    rarity: 'epic',
    points: 500,
    rewards: [
      { type: 'badge', name: 'Energy Storm Badge', description: 'Unleashing the storm!' },
      { type: 'trophy', name: 'Energy Storm Trophy', description: 'Master of energy generation' },
    ],
  },
  {
    id: 'energy-100k',
    category: 'energy',
    tier: 'platinum',
    name: 'Energy Titan',
    description: 'Team earns 100,000 total energy points',
    icon: '⚡',
    rarity: 'legendary',
    points: 1000,
    rewards: [
      { type: 'badge', name: 'Energy Titan Badge', description: 'Legendary energy mastery!' },
      { type: 'title', name: 'Energy Titans', description: 'Display as team title' },
      { type: 'boost', name: '20% Energy Boost', description: '+20% energy for 7 days', value: 20, duration: 168 },
    ],
  },
  
  // Collaboration Achievements
  {
    id: 'collab-10-events',
    category: 'collaboration',
    tier: 'bronze',
    name: 'Team Players',
    description: 'Complete 10 team events',
    icon: '🤝',
    rarity: 'common',
    points: 100,
    rewards: [
      { type: 'badge', name: 'Team Players Badge', description: 'Working together!' },
    ],
  },
  {
    id: 'collab-50-events',
    category: 'collaboration',
    tier: 'silver',
    name: 'Collaboration Masters',
    description: 'Complete 50 team events',
    icon: '🤝',
    rarity: 'rare',
    points: 300,
    rewards: [
      { type: 'badge', name: 'Collaboration Masters Badge', description: 'True team collaboration!' },
    ],
  },
  {
    id: 'collab-full-participation',
    category: 'collaboration',
    tier: 'gold',
    name: 'United Front',
    description: 'Achieve 100% member participation in an event',
    icon: '🤝',
    rarity: 'epic',
    points: 400,
    rewards: [
      { type: 'badge', name: 'United Front Badge', description: 'Everyone together!' },
      { type: 'boost', name: 'Team Unity Boost', description: '+15% resonance for 48 hours', value: 15, duration: 48 },
    ],
  },
  
  // Resonance Achievements
  {
    id: 'resonance-80',
    category: 'resonance',
    tier: 'silver',
    name: 'Harmony Seekers',
    description: 'Achieve team resonance of 80+',
    icon: '🎵',
    rarity: 'rare',
    points: 250,
    rewards: [
      { type: 'badge', name: 'Harmony Seekers Badge', description: 'In perfect harmony!' },
    ],
  },
  {
    id: 'resonance-90',
    category: 'resonance',
    tier: 'gold',
    name: 'Peak Harmony',
    description: 'Achieve team resonance of 90+',
    icon: '🎵',
    rarity: 'epic',
    points: 500,
    rewards: [
      { type: 'badge', name: 'Peak Harmony Badge', description: 'Peak performance!' },
      { type: 'trophy', name: 'Harmony Trophy', description: 'Masters of resonance' },
    ],
  },
  {
    id: 'resonance-7-day',
    category: 'resonance',
    tier: 'platinum',
    name: 'Sustained Harmony',
    description: 'Maintain 80+ resonance for 7 consecutive days',
    icon: '🎵',
    rarity: 'legendary',
    points: 750,
    rewards: [
      { type: 'badge', name: 'Sustained Harmony Badge', description: 'Legendary consistency!' },
      { type: 'title', name: 'Harmony Masters', description: 'Display as team title' },
    ],
  },
  
  // Consistency Achievements
  {
    id: 'streak-7',
    category: 'consistency',
    tier: 'bronze',
    name: 'Week Warriors',
    description: 'Maintain a 7-day activity streak',
    icon: '🔥',
    rarity: 'common',
    points: 150,
    rewards: [
      { type: 'badge', name: 'Week Warriors Badge', description: '7 days strong!' },
    ],
  },
  {
    id: 'streak-30',
    category: 'consistency',
    tier: 'gold',
    name: 'Month Masters',
    description: 'Maintain a 30-day activity streak',
    icon: '🔥',
    rarity: 'epic',
    points: 600,
    rewards: [
      { type: 'badge', name: 'Month Masters Badge', description: '30 days of excellence!' },
      { type: 'trophy', name: 'Consistency Trophy', description: 'Unwavering dedication' },
    ],
  },
  
  // Growth Achievements
  {
    id: 'growth-10-members',
    category: 'growth',
    tier: 'bronze',
    name: 'Growing Squad',
    description: 'Reach 10 team members',
    icon: '📈',
    rarity: 'common',
    points: 100,
    rewards: [
      { type: 'badge', name: 'Growing Squad Badge', description: 'Team is expanding!' },
    ],
  },
  {
    id: 'growth-25-members',
    category: 'growth',
    tier: 'silver',
    name: 'Thriving Team',
    description: 'Reach 25 team members',
    icon: '📈',
    rarity: 'rare',
    points: 250,
    rewards: [
      { type: 'badge', name: 'Thriving Team Badge', description: 'Community growing!' },
    ],
  },
];

// ============================================================================
// CHALLENGE TEMPLATES
// ============================================================================

export const CHALLENGE_TEMPLATES: Omit<TeamChallenge, 'id' | 'current' | 'startDate' | 'endDate' | 'status' | 'participatingMembers'>[] = [
  {
    name: 'Weekend Energy Sprint',
    description: 'Earn 5,000 energy points as a team this weekend',
    icon: '⚡',
    type: 'energy',
    goal: 5000,
    difficulty: 'medium',
    points: 300,
    requiredParticipation: 75,
    rewards: [
      { type: 'badge', name: 'Sprint Champion', description: 'Completed weekend sprint!' },
      { type: 'boost', name: 'Energy Boost', description: '+15% energy for 3 days', value: 15, duration: 72 },
    ],
  },
  {
    name: 'Perfect Harmony Week',
    description: 'Maintain 75+ team resonance for 7 days',
    icon: '🎵',
    type: 'resonance',
    goal: 75,
    difficulty: 'hard',
    points: 500,
    requiredParticipation: 80,
    rewards: [
      { type: 'badge', name: 'Harmony Master', description: 'Perfect harmony achieved!' },
      { type: 'trophy', name: 'Harmony Trophy', description: 'Week of perfect resonance' },
    ],
  },
  {
    name: 'Event Blitz',
    description: 'Complete 20 team events in one week',
    icon: '📅',
    type: 'events',
    goal: 20,
    difficulty: 'hard',
    points: 400,
    requiredParticipation: 70,
    rewards: [
      { type: 'badge', name: 'Event Master', description: 'Event completion expert!' },
    ],
  },
  {
    name: 'Collaboration Challenge',
    description: 'Have every team member contribute to at least 3 shared events',
    icon: '🤝',
    type: 'collaboration',
    goal: 100, // 100% participation
    difficulty: 'extreme',
    points: 750,
    requiredParticipation: 100,
    rewards: [
      { type: 'badge', name: 'Ultimate Collaborators', description: 'Everyone contributed!' },
      { type: 'trophy', name: 'Collaboration Trophy', description: 'Perfect teamwork' },
      { type: 'title', name: 'The Collaborators', description: 'Display as team title' },
    ],
  },
];

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Calculate team level from experience points
 */
export function calculateTeamLevel(xp: number): { level: number; nextLevelXP: number; progress: number } {
  // XP required for each level follows a curve: level^2 * 1000
  let level = 1;
  let totalXP = 0;
  
  while (totalXP + (level * level * 1000) <= xp) {
    totalXP += level * level * 1000;
    level++;
  }
  
  const currentLevelXP = totalXP;
  const nextLevelXP = level * level * 1000;
  const xpIntoLevel = xp - currentLevelXP;
  const progress = (xpIntoLevel / nextLevelXP) * 100;
  
  return { level, nextLevelXP, progress };
}

/**
 * Calculate achievement progress
 */
export function calculateAchievementProgress(
  achievement: TeamAchievement,
  teamStats: {
    totalEnergy: number;
    eventsCompleted: number;
    resonance: number;
    memberCount: number;
    streakDays: number;
  }
): number {
  const req = achievement.requirement;
  
  switch (req.type) {
    case 'energy':
      return Math.min(100, (teamStats.totalEnergy / req.target) * 100);
    case 'events':
      return Math.min(100, (teamStats.eventsCompleted / req.target) * 100);
    case 'resonance':
      return Math.min(100, (teamStats.resonance / req.target) * 100);
    case 'members':
      return Math.min(100, (teamStats.memberCount / req.target) * 100);
    case 'streak':
      return Math.min(100, (teamStats.streakDays / req.target) * 100);
    default:
      return 0;
  }
}

/**
 * Check if achievement is unlocked
 */
export function isAchievementUnlocked(
  achievement: TeamAchievement,
  progress: number
): boolean {
  return progress >= 100;
}

/**
 * Calculate challenge progress
 */
export function calculateChallengeProgress(challenge: TeamChallenge): number {
  return Math.min(100, (challenge.current / challenge.goal) * 100);
}

/**
 * Check if challenge is completed
 */
export function isChallengeCompleted(challenge: TeamChallenge): boolean {
  return challenge.current >= challenge.goal;
}

/**
 * Check if challenge has expired
 */
export function isChallengeExpired(challenge: TeamChallenge): boolean {
  return new Date() > challenge.endDate;
}

/**
 * Generate leaderboard from teams
 */
export function generateLeaderboard(
  teams: Array<{
    id: string;
    name: string;
    color: string;
    memberCount: number;
    energyStats: { totalEnergyEarned: number };
    stats: any;
  }>,
  resonanceScores: Map<string, number>
): TeamLeaderboardEntry[] {
  const entries = teams.map((team, idx) => {
    const totalPoints = team.energyStats.totalEnergyEarned + (team.stats.achievementsUnlocked * 100);
    const averageResonance = resonanceScores.get(team.id) || 50;
    
    return {
      rank: idx + 1,
      teamId: team.id,
      teamName: team.name,
      teamColor: team.color,
      totalPoints,
      weeklyPoints: Math.floor(totalPoints * 0.2), // Mock
      monthlyPoints: Math.floor(totalPoints * 0.5), // Mock
      memberCount: team.memberCount,
      averageResonance,
      totalEnergy: team.energyStats.totalEnergyEarned,
      achievementsUnlocked: team.stats.achievementsUnlocked || 0,
      challengesCompleted: team.stats.challengesCompleted || 0,
      rankChange: 0, // Mock
      trend: 'stable' as const,
      badges: [],
    };
  });
  
  // Sort by total points
  return entries.sort((a, b) => b.totalPoints - a.totalPoints).map((entry, idx) => ({
    ...entry,
    rank: idx + 1,
  }));
}

/**
 * Transfer points between team members
 */
export function createPointTransfer(
  fromUserId: string,
  fromUserName: string,
  toUserId: string,
  toUserName: string,
  amount: number,
  teamId: string,
  reason?: string
): PointTransfer {
  return {
    id: `transfer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    fromUserId,
    fromUserName,
    toUserId,
    toUserName,
    amount,
    reason,
    timestamp: new Date(),
    teamId,
  };
}

/**
 * Create celebration moment
 */
export function createCelebration(
  type: CelebrationMoment['type'],
  title: string,
  description: string,
  participants: string[],
  rewards?: TeamReward[]
): CelebrationMoment {
  const icons = {
    achievement: '🏆',
    challenge: '🎯',
    milestone: '🎖️',
    'level-up': '⬆️',
    streak: '🔥',
  };
  
  const colors = {
    achievement: '#10b981',
    challenge: '#3b82f6',
    milestone: '#8b5cf6',
    'level-up': '#f59e0b',
    streak: '#ef4444',
  };
  
  return {
    id: `celebration-${Date.now()}`,
    type,
    title,
    description,
    icon: icons[type],
    color: colors[type],
    timestamp: new Date(),
    participants,
    rewards,
  };
}

/**
 * Get tier color
 */
export function getTierColor(tier: AchievementTier): string {
  switch (tier) {
    case 'bronze': return '#cd7f32';
    case 'silver': return '#c0c0c0';
    case 'gold': return '#ffd700';
    case 'platinum': return '#e5e4e2';
    case 'diamond': return '#b9f2ff';
  }
}

/**
 * Get rarity color
 */
export function getRarityColor(rarity: 'common' | 'rare' | 'epic' | 'legendary'): string {
  switch (rarity) {
    case 'common': return '#9ca3af';
    case 'rare': return '#3b82f6';
    case 'epic': return '#8b5cf6';
    case 'legendary': return '#f59e0b';
  }
}

/**
 * Get difficulty color
 */
export function getDifficultyColor(difficulty: 'easy' | 'medium' | 'hard' | 'extreme'): string {
  switch (difficulty) {
    case 'easy': return '#10b981';
    case 'medium': return '#3b82f6';
    case 'hard': return '#f59e0b';
    case 'extreme': return '#ef4444';
  }
}
