import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger'
// import { notificationService } from './notificationService'

const prisma = new PrismaClient()

export interface ChallengeSession {
  id: string
  userId: string
  challengeId: string
  startedAt: Date
  pausedAt?: Date
  resumedAt?: Date
  completedAt?: Date
  elapsedSeconds: number
  targetDuration: number
  isPaused: boolean
  isComplete: boolean
  partialCredit: boolean
}

export class DailyChallengeService {
  private static instance: DailyChallengeService
  private activeSessions = new Map<string, ChallengeSession>()

  static getInstance(): DailyChallengeService {
    if (!DailyChallengeService.instance) {
      DailyChallengeService.instance = new DailyChallengeService()
    }
    return DailyChallengeService.instance
  }

  /**
   * Start a challenge session
   */
  async startChallenge(userId: string, challengeId: string): Promise<ChallengeSession> {
    try {
      // Get challenge details
      const challenge = await prisma.dailyChallenge.findUnique({
        where: { id: challengeId }
      })

      if (!challenge) {
        throw new Error('Challenge not found')
      }

      // Check if there's already an active session
      const existingSession = await prisma.challengeSession.findFirst({
        where: {
          userId,
          challengeId,
          completedAt: null
        }
      })

      if (existingSession) {
        logger.warn('User already has active session for this challenge', { userId, challengeId })
        
        // Resume existing session
        const session: ChallengeSession = {
          id: existingSession.id,
          userId,
          challengeId,
          startedAt: existingSession.startedAt,
          elapsedSeconds: existingSession.elapsedSeconds || 0,
          targetDuration: challenge.requiredMinutes || 10,
          isPaused: !!existingSession.pausedAt,
          isComplete: false,
          partialCredit: false
        }

        this.activeSessions.set(session.id, session)
        return session
      }

      // Create new session
      const dbSession = await prisma.challengeSession.create({
        data: {
          userId,
          challengeId,
          startedAt: new Date(),
          elapsedSeconds: 0,
          status: 'IN_PROGRESS'
        }
      })

      const session: ChallengeSession = {
        id: dbSession.id,
        userId,
        challengeId,
        startedAt: dbSession.startedAt,
        elapsedSeconds: 0,
        targetDuration: challenge.requiredMinutes || 10,
        isPaused: false,
        isComplete: false,
        partialCredit: false
      }

      this.activeSessions.set(session.id, session)

      // Log analytics
      const { analyticsService } = await import('./analyticsService')
      await analyticsService.logEvent(userId, 'challenge_start', { challengeId })

      logger.info('Challenge session started', { userId, challengeId, sessionId: session.id })
      
      return session
    } catch (error) {
      logger.error('Failed to start challenge', { error, userId, challengeId })
      throw error
    }
  }

  /**
   * Pause challenge session
   */
  async pauseChallenge(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    session.isPaused = true
    session.pausedAt = new Date()

    await prisma.challengeSession.update({
      where: { id: sessionId },
      data: {
        pausedAt: session.pausedAt,
        elapsedSeconds: session.elapsedSeconds
      }
    })

    // Log analytics
    const { analyticsService } = await import('./analyticsService')
    await analyticsService.logEvent(session.userId, 'challenge_pause', { 
      challengeId: session.challengeId,
      elapsedSeconds: session.elapsedSeconds 
    })

    logger.info('Challenge session paused', { sessionId, elapsedSeconds: session.elapsedSeconds })
  }

  /**
   * Resume challenge session
   */
  async resumeChallenge(sessionId: string): Promise<void> {
    const session = this.activeSessions.get(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    session.isPaused = false
    session.resumedAt = new Date()

    await prisma.challengeSession.update({
      where: { id: sessionId },
      data: {
        resumedAt: session.resumedAt
      }
    })

    // Log analytics
    const { analyticsService } = await import('./analyticsService')
    await analyticsService.logEvent(session.userId, 'challenge_resume', { 
      challengeId: session.challengeId 
    })

    logger.info('Challenge session resumed', { sessionId })
  }

  /**
   * Complete challenge session
   */
  async completeChallenge(sessionId: string, elapsedMinutes: number, partialCredit: boolean): Promise<void> {
    const session = this.activeSessions.get(sessionId)
    if (!session) {
      throw new Error('Session not found')
    }

    session.isComplete = true
    session.partialCredit = partialCredit
    session.completedAt = new Date()

    // Update database
    await prisma.challengeSession.update({
      where: { id: sessionId },
      data: {
        completedAt: session.completedAt,
        elapsedSeconds: Math.floor(elapsedMinutes * 60),
        status: 'COMPLETED',
        partialCredit
      }
    })

    // Award energy points based on completion
    const pointsMultiplier = partialCredit ? 0.5 : 1.0
    const basePoints = 20
    const pointsAwarded = Math.floor(basePoints * pointsMultiplier * (elapsedMinutes / session.targetDuration))

    // Log analytics
    const { analyticsService } = await import('./analyticsService')
    await analyticsService.logEvent(session.userId, 'challenge_complete', { 
      challengeId: session.challengeId,
      elapsedMinutes,
      partialCredit,
      pointsAwarded
    })

    // Remove from active sessions
    this.activeSessions.delete(sessionId)

    logger.info('Challenge session completed', { 
      sessionId, 
      elapsedMinutes, 
      partialCredit,
      pointsAwarded 
    })
  }

  /**
   * Get active session for user
   */
  getActiveSession(userId: string): ChallengeSession | null {
    for (const session of this.activeSessions.values()) {
      if (session.userId === userId && !session.isComplete) {
        return session
      }
    }
    return null
  }

  /**
   * Update session elapsed time
   */
  updateSessionTime(sessionId: string, elapsedSeconds: number): void {
    const session = this.activeSessions.get(sessionId)
    if (session) {
      session.elapsedSeconds = elapsedSeconds
    }
  }
}

export const dailyChallengeService = DailyChallengeService.getInstance()