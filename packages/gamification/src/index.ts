/**
 * Gamification Domain - Public API
 * 
 * This package contains the gamification and energy domain logic:
 * - Energy system and tracking
 * - Achievements and badges
 * - Points and levels
 * - Daily challenges
 * - Progress tracking
 */

import { BaseEntity, UserContext, DomainError } from '@syncscript/shared-kernel'

// Energy domain
export interface EnergyProfile extends BaseEntity {
  userId: string
  currentEnergy: number
  energyLevel: number
  epToday: number
  domainWeights: Record<string, number>
  personalizationData: Record<string, any>
  lastConversion?: Date
}

export interface EnergyPoint extends BaseEntity {
  userId: string
  amount: number
  source: string
  domain: string
  earnedAt: Date
  description?: string
}

export interface EnergyConversion extends BaseEntity {
  userId: string
  epAmount: number
  energyGained: number
  conversionDate: Date
  conversionRate: number
}

// Achievement domain
export interface Achievement extends BaseEntity {
  name: string
  description: string
  category: string
  icon: string
  points: number
  requirements: AchievementRequirement[]
  isHidden: boolean
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
}

export interface UserAchievement extends BaseEntity {
  userId: string
  achievementId: string
  earnedAt: Date
  progress: number
  isCompleted: boolean
  achievement: Achievement
}

export interface AchievementRequirement {
  type: 'task_completed' | 'event_attended' | 'energy_earned' | 'streak_days' | 'points_earned'
  target: number
  description: string
  domain?: string
}

// Badge domain
export interface Badge extends BaseEntity {
  name: string
  description: string
  icon: string
  category: string
  rarity: 'bronze' | 'silver' | 'gold' | 'platinum'
  requirements: BadgeRequirement[]
}

export interface UserBadge extends BaseEntity {
  userId: string
  badgeId: string
  earnedAt: Date
  badge: Badge
}

export interface BadgeRequirement {
  type: 'achievement_count' | 'energy_level' | 'streak_days' | 'points_total'
  target: number
  description: string
}

// Points and levels
export interface Point extends BaseEntity {
  userId: string
  amount: number
  source: string
  category: string
  earnedAt: Date
  description?: string
}

export interface UserStats extends BaseEntity {
  userId: string
  totalPoints: number
  currentLevel: number
  experiencePoints: number
  tasksCompleted: number
  tasksCreated: number
  totalTaskTime: number
  eventsAttended: number
  eventsCreated: number
  longestStreak: number
  currentStreak: number
}

// Daily challenges
export interface DailyChallenge extends BaseEntity {
  title: string
  description: string
  type: 'energy' | 'tasks' | 'events' | 'streak'
  target: number
  reward: {
    points: number
    energy?: number
    badge?: string
  }
  difficulty: 'easy' | 'medium' | 'hard'
  category: string
  isActive: boolean
  startDate: Date
  endDate: Date
}

export interface ChallengeSession extends BaseEntity {
  userId: string
  challengeId: string
  startedAt: Date
  completedAt?: Date
  progress: number
  isCompleted: boolean
  rewardClaimed: boolean
  challenge: DailyChallenge
}

// Streaks
export interface Streak extends BaseEntity {
  userId: string
  type: 'daily_tasks' | 'daily_energy' | 'weekly_goals' | 'monthly_achievements'
  currentCount: number
  longestCount: number
  lastActivityDate: Date
  isActive: boolean
}

// Energy emblems
export interface EnergyEmblem extends BaseEntity {
  userId: string
  name: string
  description: string
  icon: string
  energyThreshold: number
  isActive: boolean
  unlockedAt: Date
  animationData?: Record<string, any>
}

// Domain services (interfaces only - implementations in server)
export interface EnergyService {
  getProfile(userId: string): Promise<EnergyProfile>
  updateProfile(userId: string, updates: Partial<EnergyProfile>): Promise<EnergyProfile>
  addEnergyPoints(userId: string, amount: number, source: string, domain: string, description?: string): Promise<EnergyPoint>
  convertEPToEnergy(userId: string, date: Date): Promise<EnergyConversion>
  resetDailyEnergy(userId: string): Promise<EnergyProfile>
  getEnergyHistory(userId: string, days: number): Promise<EnergyPoint[]>
}

export interface AchievementService {
  getAchievements(userId: string, filters?: { category?: string; isCompleted?: boolean }): Promise<UserAchievement[]>
  getAchievement(userId: string, achievementId: string): Promise<UserAchievement>
  checkAchievements(userId: string, activity: { type: string; data: any }): Promise<UserAchievement[]>
  claimAchievement(userId: string, achievementId: string): Promise<UserAchievement>
}

export interface BadgeService {
  getBadges(userId: string, filters?: { category?: string; rarity?: string }): Promise<UserBadge[]>
  getBadge(userId: string, badgeId: string): Promise<UserBadge>
  checkBadgeEligibility(userId: string, badgeId: string): Promise<boolean>
  awardBadge(userId: string, badgeId: string): Promise<UserBadge>
}

export interface PointsService {
  addPoints(userId: string, amount: number, source: string, category: string, description?: string): Promise<Point>
  getPoints(userId: string, filters?: { startDate?: Date; endDate?: Date; category?: string }): Promise<Point[]>
  getTotalPoints(userId: string): Promise<number>
  getLevel(userId: string): Promise<number>
}

export interface ChallengeService {
  getActiveChallenges(userId: string): Promise<ChallengeSession[]>
  getChallenge(userId: string, challengeId: string): Promise<ChallengeSession>
  startChallenge(userId: string, challengeId: string): Promise<ChallengeSession>
  updateChallengeProgress(userId: string, challengeId: string, progress: number): Promise<ChallengeSession>
  completeChallenge(userId: string, challengeId: string): Promise<ChallengeSession>
  claimChallengeReward(userId: string, challengeId: string): Promise<ChallengeSession>
}

export interface StreakService {
  getStreaks(userId: string): Promise<Streak[]>
  getStreak(userId: string, type: string): Promise<Streak>
  updateStreak(userId: string, type: string, activityDate: Date): Promise<Streak>
  resetStreak(userId: string, type: string): Promise<Streak>
}

export interface EmblemService {
  getEmblems(userId: string): Promise<EnergyEmblem[]>
  getEmblem(userId: string, emblemId: string): Promise<EnergyEmblem>
  unlockEmblem(userId: string, emblemId: string): Promise<EnergyEmblem>
  updateEmblemAnimation(userId: string, emblemId: string, animationData: Record<string, any>): Promise<EnergyEmblem>
}

// Domain errors
export class EnergyProfileNotFoundError extends DomainError {
  constructor(userId: string) {
    super(`Energy profile for user ${userId} not found`, 'ENERGY_PROFILE_NOT_FOUND', { userId })
  }
}

export class AchievementNotFoundError extends DomainError {
  constructor(achievementId: string) {
    super(`Achievement with id ${achievementId} not found`, 'ACHIEVEMENT_NOT_FOUND', { achievementId })
  }
}

export class BadgeNotFoundError extends DomainError {
  constructor(badgeId: string) {
    super(`Badge with id ${badgeId} not found`, 'BADGE_NOT_FOUND', { badgeId })
  }
}

export class ChallengeNotFoundError extends DomainError {
  constructor(challengeId: string) {
    super(`Challenge with id ${challengeId} not found`, 'CHALLENGE_NOT_FOUND', { challengeId })
  }
}

export class InsufficientEnergyError extends DomainError {
  constructor(required: number, available: number) {
    super(`Insufficient energy: required ${required}, available ${available}`, 'INSUFFICIENT_ENERGY', { required, available })
  }
}
