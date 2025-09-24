import { Request, Response, NextFunction } from 'express';
import { PrismaClientKnownRequestError, PrismaClientValidationError } from '@prisma/client/runtime/library';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';

  // Log error
  logger.error('Error occurred', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Handle Prisma errors
  if (error instanceof PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        statusCode = 409;
        // Check if it's a unique constraint violation on email
        const target = error.meta?.target as string[] | undefined;
        if (target && Array.isArray(target) && target.includes('email')) {
          message = 'An account with this email already exists';
        } else {
          message = 'This information is already in use';
        }
        break;
      case 'P2025':
        statusCode = 404;
        message = 'Resource not found';
        break;
      case 'P2003':
        statusCode = 400;
        message = 'Invalid reference';
        break;
      default:
        statusCode = 400;
        message = 'Database error';
    }
  }

  // Handle Prisma validation errors
  if (error instanceof PrismaClientValidationError) {
    statusCode = 400;
    message = 'Invalid data provided';
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    statusCode = 400;
    const firstError = error.errors[0];
    
    // Customize messages based on the field and error type
    if (firstError.path[0] === 'password') {
      if (firstError.code === 'too_small') {
        message = 'Password must be at least 8 characters long';
      } else if (firstError.code === 'invalid_string' && firstError.validation === 'regex') {
        message = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
      } else {
        message = 'Password does not meet requirements';
      }
    } else if (firstError.path[0] === 'email') {
      message = 'Please enter a valid email address';
    } else if (firstError.path[0] === 'name') {
      message = 'Name is required';
    } else {
      message = firstError.message;
    }
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Don't leak error details in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Internal Server Error';
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
};

export const createError = (message: string, statusCode: number = 500): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
