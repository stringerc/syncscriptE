import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface IdempotencyOptions {
  key: string;
  scope: string;
  requestBody: any;
  ttlHours?: number; // Time to live in hours, default 24
}

/**
 * Generate a hash of the request for change detection
 */
function generateRequestHash(requestBody: any): string {
  const normalized = JSON.stringify(requestBody, Object.keys(requestBody).sort());
  return createHash('sha256').update(normalized).digest('hex');
}

/**
 * Check if a request is idempotent and return cached response if available
 */
export async function checkIdempotency(options: IdempotencyOptions): Promise<any | null> {
  const { key, scope, requestBody, ttlHours = 24 } = options;
  const requestHash = generateRequestHash(requestBody);
  
  try {
    const existing = await prisma.idempotencyKey.findUnique({
      where: { key }
    });
    
    if (!existing) {
      return null; // No existing key, proceed with request
    }
    
    // Check if key has expired
    if (existing.expiresAt < new Date()) {
      await prisma.idempotencyKey.delete({
        where: { key }
      });
      logger.info('Expired idempotency key removed', { key, scope });
      return null;
    }
    
    // Check if request has changed
    if (existing.requestHash !== requestHash) {
      logger.warn('Idempotency key collision - request changed', { 
        key, 
        scope, 
        oldHash: existing.requestHash,
        newHash: requestHash 
      });
      // For safety, we could either reject or update the key
      // For now, we'll reject to prevent accidental overwrites
      throw new Error('Idempotency key collision: request content has changed');
    }
    
    // Return cached response
    logger.info('Idempotent request - returning cached response', { key, scope });
    return JSON.parse(existing.response);
    
  } catch (error) {
    logger.error('Error checking idempotency', { 
      key, 
      scope, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw error;
  }
}

/**
 * Store the response for an idempotent request
 */
export async function storeIdempotentResponse(
  key: string, 
  scope: string, 
  requestBody: any, 
  response: any,
  ttlHours: number = 24
): Promise<void> {
  const requestHash = generateRequestHash(requestBody);
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + ttlHours);
  
  try {
    await prisma.idempotencyKey.upsert({
      where: { key },
      create: {
        key,
        scope,
        requestHash,
        response: JSON.stringify(response),
        expiresAt
      },
      update: {
        requestHash,
        response: JSON.stringify(response),
        expiresAt
      }
    });
    
    logger.info('Idempotent response stored', { key, scope, expiresAt });
    
  } catch (error) {
    logger.error('Error storing idempotent response', { 
      key, 
      scope, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
    throw error;
  }
}

/**
 * Middleware factory for Express routes
 */
export function idempotencyMiddleware(scope: string, ttlHours: number = 24) {
  return async (req: any, res: any, next: any) => {
    const idempotencyKey = req.headers['idempotency-key'] as string;
    
    if (!idempotencyKey) {
      // Generate a key if none provided
      req.idempotencyKey = `auto-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      return next();
    }
    
    req.idempotencyKey = idempotencyKey;
    
    try {
      // Check for existing response
      const cachedResponse = await checkIdempotency({
        key: idempotencyKey,
        scope,
        requestBody: req.body,
        ttlHours
      });
      
      if (cachedResponse) {
        return res.json(cachedResponse);
      }
      
      // Store original res.json to intercept response
      const originalJson = res.json.bind(res);
      res.json = function(data: any) {
        // Store the response for future idempotent requests
        storeIdempotentResponse(idempotencyKey, scope, req.body, data, ttlHours)
          .catch(error => {
            logger.error('Failed to store idempotent response', { 
              key: idempotencyKey, 
              scope, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            });
          });
        
        return originalJson(data);
      };
      
      next();
      
    } catch (error) {
      logger.error('Idempotency middleware error', { 
        key: idempotencyKey, 
        scope, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      
      if (error instanceof Error && error.message.includes('collision')) {
        return res.status(409).json({
          error: 'Idempotency key collision',
          message: 'Request content has changed for this idempotency key'
        });
      }
      
      // For other errors, continue with the request
      next();
    }
  };
}

/**
 * Clean up expired idempotency keys (run periodically)
 */
export async function cleanupExpiredKeys(): Promise<number> {
  const result = await prisma.idempotencyKey.deleteMany({
    where: {
      expiresAt: { lt: new Date() }
    }
  });
  
  logger.info('Cleaned up expired idempotency keys', { count: result.count });
  return result.count;
}
