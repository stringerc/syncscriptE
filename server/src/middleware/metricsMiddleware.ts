import { Request, Response, NextFunction } from 'express';
import { metricsService } from '../services/metricsService';

/**
 * Middleware to record HTTP request metrics
 */
export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  // Extract route information
  const route = req.route?.path || req.path;
  const method = req.method;
  
  // Override res.end to capture response status and duration
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any) {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    
    // Record the metric
    metricsService.recordHttpRequest(route, method, statusCode, duration);
    
    // Call original end
    originalEnd.call(this, chunk, encoding);
  };
  
  next();
}
