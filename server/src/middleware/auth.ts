import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
  body: any;
  params: any;
  query: any;
  headers: any;
  url: string;
  file?: any;
}

export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    logger.info('Auth middleware', { 
      url: req.url, 
      hasAuthHeader: !!authHeader,
      tokenPrefix: token ? token.substring(0, 20) + '...' : 'none'
    });

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'Access token required' 
      });
    }

    // Check if this is a mock Google token
    if (token.startsWith('google_token_')) {
      // Mock authentication for Google OAuth
      req.user = {
        id: 'google_mock_user',
        email: 'user@gmail.com'
      };
      return next();
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      logger.error('JWT_SECRET not configured');
      return res.status(500).json({ 
        success: false, 
        error: 'Server configuration error' 
      });
    }

    const decoded = jwt.verify(token, secret) as any;
    
    logger.info('JWT decoded', { 
      userId: decoded.userId,
      hasUserId: !!decoded.userId
    });
    
    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true }
    });

    if (!user) {
      logger.error('User not found for token', { userId: decoded.userId });
      return res.status(401).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.error('Token verification failed', { error });
    return res.status(403).json({ 
      success: false, 
      error: 'Invalid or expired token' 
    });
  }
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next(); // Continue without authentication
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return next();
    }

    const decoded = jwt.verify(token, secret) as any;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true }
    });

    if (user) {
      req.user = user;
    }

    return next();
  } catch (error) {
    // Continue without authentication if token is invalid
    return next();
  }
};
