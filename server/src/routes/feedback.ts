import { Router } from 'express'
import { authenticateToken, AuthRequest } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'
import { logger } from '../utils/logger'
import { PrismaClient } from '@prisma/client'
import GamificationService from '../services/gamificationService'

const prisma = new PrismaClient()
import nodemailer from 'nodemailer'

const router = Router()

// Email configuration
const createEmailTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail', // You can change this to your preferred email service
    auth: {
      user: process.env.EMAIL_USER || process.env.FEEDBACK_EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_APP_PASSWORD || process.env.FEEDBACK_EMAIL_PASSWORD || 'your-app-password'
    }
  })
}

// Submit feedback
router.post('/', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const userId = req.user!.id
  const { message, timestamp } = req.body

  if (!message || !message.trim()) {
    return res.status(400).json({
      success: false,
      error: 'Feedback message is required'
    })
  }

  try {
    // Get user information for the email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true }
    })

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      })
    }

    // Send email notification
    try {
      const transporter = createEmailTransporter()
      
      const mailOptions = {
        from: process.env.EMAIL_USER || process.env.FEEDBACK_EMAIL_USER || 'your-email@gmail.com',
        to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER || 'admin@syncscript.com', // Your email address
        subject: `SyncScript Feedback from ${user.name || user.email}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">New Feedback from SyncScript User</h2>
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #374151;">User Information</h3>
              <p><strong>Name:</strong> ${user.name || 'Not provided'}</p>
              <p><strong>Email:</strong> ${user.email}</p>
              <p><strong>User ID:</strong> ${userId}</p>
              <p><strong>Timestamp:</strong> ${new Date(timestamp).toLocaleString()}</p>
            </div>
            <div style="background-color: #ffffff; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
              <h3 style="margin-top: 0; color: #374151;">Feedback Message</h3>
              <p style="white-space: pre-wrap; line-height: 1.6;">${message}</p>
            </div>
            <div style="margin-top: 20px; padding: 15px; background-color: #fef3c7; border-radius: 8px;">
              <p style="margin: 0; font-size: 14px; color: #92400e;">
                💡 This feedback was submitted through the SyncScript app's feedback system.
              </p>
            </div>
          </div>
        `
      }

      await transporter.sendMail(mailOptions)
      logger.info('Feedback email sent successfully', { userId, userEmail: user.email })
    } catch (emailError) {
      logger.error('Failed to send feedback email', { error: emailError, userId })
      // Don't fail the request if email fails, just log the error
    }

    // Check daily feedback limit (50 points per day)
    const today = new Date()
    today.setHours(0, 0, 0, 0) // Start of today
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1) // Start of tomorrow

    const todayFeedbackPoints = await prisma.point.aggregate({
      where: {
        userId,
        source: 'feedback_submission',
        earnedAt: {
          gte: today,
          lt: tomorrow
        }
      },
      _sum: {
        amount: true
      }
    })

    const dailyPointsUsed = todayFeedbackPoints._sum.amount || 0
    const maxDailyPoints = 50
    const remainingPoints = maxDailyPoints - dailyPointsUsed

    // Award points for submitting feedback (respecting daily limit)
    try {
      let pointsToAward = 0
      let message = ''

      if (remainingPoints > 0) {
        pointsToAward = Math.min(50, remainingPoints) // Award up to 50 points, but not more than remaining daily limit
        
        // Use the gamification service to properly update totalPoints
        await GamificationService.addPoints(userId, pointsToAward, 'feedback_submission', 'Submitted feedback to help improve SyncScript')

        // Check if this is their first feedback by counting existing feedback points
        const existingFeedbackPoints = await prisma.point.count({
          where: {
            userId,
            source: 'feedback_submission'
          }
        })

        // Create achievement record if this is their first feedback
        if (existingFeedbackPoints === 1) {
          await GamificationService.unlockAchievement(userId, {
            id: 'feedback_contributor',
            title: 'Feedback Contributor',
            description: 'Submitted your first feedback',
            points: 0, // Points already awarded above
            icon: '💬',
            rarity: 'common',
            condition: () => true
          })
        }

        if (pointsToAward < 50) {
          message = `Feedback submitted successfully! You earned ${pointsToAward} points (daily limit: ${maxDailyPoints} points per day)`
        } else {
          message = 'Feedback submitted successfully! You earned 50 points'
        }

        logger.info('Feedback points awarded', { userId, points: pointsToAward, dailyPointsUsed: dailyPointsUsed + pointsToAward })
      } else {
        message = 'Feedback submitted successfully! You have already reached your daily limit of 50 points for feedback'
        logger.info('Feedback submitted but no points awarded - daily limit reached', { userId, dailyPointsUsed })
      }

      res.json({
        success: true,
        message,
        data: {
          pointsAwarded: pointsToAward,
          dailyLimit: maxDailyPoints,
          dailyPointsUsed: dailyPointsUsed + pointsToAward,
          remainingDailyPoints: maxDailyPoints - (dailyPointsUsed + pointsToAward)
        }
      })

    } catch (gamificationError) {
      logger.error('Failed to award feedback points', { error: gamificationError, userId })
      // Don't fail the request if gamification fails
      res.json({
        success: true,
        message: 'Feedback submitted successfully, but there was an issue awarding points',
        data: {
          pointsAwarded: 0
        }
      })
    }

  } catch (error) {
    logger.error('Error submitting feedback', { error, userId })
    res.status(500).json({
      success: false,
      error: 'Failed to submit feedback'
    })
  }
}))

export default router
