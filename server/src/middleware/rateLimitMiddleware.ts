import rateLimit from 'express-rate-limit'
import { createError } from './errorHandler'

// In-memory store for rate limiting
// For production, consider using Redis
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

/**
 * Create a custom rate limiter with in-memory store
 */
function createRateLimiter(options: {
  windowMs: number
  max: number
  message?: string
  keyGenerator?: (req: any) => string
}) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message || 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: options.keyGenerator || ((req: any) => req.user?.id || req.ip),
    handler: (req, res) => {
      throw createError(429, options.message || 'Too many requests, please try again later')
    }
  })
}

/**
 * Rate limiter for Ask AI feature
 * 20 requests per hour per user
 */
export const askAIRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: 'Too many AI requests. Please try again in an hour.'
})

/**
 * Rate limiter for Suggest API
 * 100 requests per hour per user
 */
export const suggestAPIRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  message: 'Too many suggestion requests. Please try again later.'
})

/**
 * Rate limiter for Feedback submissions
 * 10 per day per user
 */
export const feedbackRateLimit = createRateLimiter({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 10,
  message: 'Too many feedback submissions. Please try again tomorrow.'
})

/**
 * Rate limiter for Calendar writes
 * 100 writes per hour per user
 */
export const calendarWriteRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100,
  message: 'Too many calendar operations. Please slow down.'
})

/**
 * Rate limiter for Task creation
 * 200 tasks per hour per user
 */
export const taskCreateRateLimit = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 200,
  message: 'Too many tasks created. Please try again later.'
})

/**
 * General API rate limiter
 * 1000 requests per 15 minutes per user
 */
export const generalAPIRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  message: 'Too many requests. Please slow down.'
})
