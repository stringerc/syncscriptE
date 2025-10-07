import { Request, Response, NextFunction } from 'express'
import { createError } from './errorHandler'
import { logger } from '../utils/logger'

// In-memory store for idempotency keys
// For production, use Redis with TTL
const idempotencyStore = new Map<string, { response: any; timestamp: number }>()
const IDEMPOTENCY_TTL = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Idempotency middleware
 * Prevents duplicate operations by checking idempotency keys
 */
export function idempotencyMiddleware(scope: string) {
  return (req: any, res: Response, next: NextFunction) => {
  // Only apply to POST, PUT, PATCH operations
  if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
    return next()
  }

  const idempotencyKey = req.headers['idempotency-key'] as string

  if (!idempotencyKey) {
    // Idempotency key is optional, but recommended for write operations
    return next()
  }

  // Generate a unique key based on user and idempotency key
  const userId = req.user?.id || 'anonymous'
  const storeKey = `${userId}:${idempotencyKey}`

  // Check if we've seen this key before
  const cached = idempotencyStore.get(storeKey)
  
  if (cached) {
    // Return cached response
    logger.info('Idempotent request detected, returning cached response', {
      userId,
      idempotencyKey,
      path: req.path
    })

    return res.status(200).json(cached.response)
  }

  // Store the original res.json function
  const originalJson = res.json.bind(res)

  // Override res.json to cache the response
  res.json = function(body: any) {
    // Cache the response
    idempotencyStore.set(storeKey, {
      response: body,
      timestamp: Date.now()
    })

    // Clean up old entries periodically
    cleanupExpiredKeys()

    return originalJson(body)
  }

  next()
  }
}

/**
 * Clean up expired idempotency keys
 */
function cleanupExpiredKeys() {
  const now = Date.now()
  const expiredKeys: string[] = []

  for (const [key, value] of idempotencyStore.entries()) {
    if (now - value.timestamp > IDEMPOTENCY_TTL) {
      expiredKeys.push(key)
    }
  }

  expiredKeys.forEach(key => idempotencyStore.delete(key))

  if (expiredKeys.length > 0) {
    logger.info('Cleaned up expired idempotency keys', { count: expiredKeys.length })
  }
}

/**
 * Clear idempotency cache (for testing)
 */
export function clearIdempotencyCache() {
  idempotencyStore.clear()
}
