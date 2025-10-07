import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface MetricsAuthConfig {
  allowedIPs: string[];
  authToken?: string;
  allowInDevelopment: boolean;
}

/**
 * Middleware to protect metrics endpoint with IP allowlist and optional auth token
 * Scrub PII from metric labels and ensure no sensitive data leaks
 */
export function metricsAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const config: MetricsAuthConfig = {
    allowedIPs: process.env.METRICS_ALLOWED_IPS?.split(',') || ['127.0.0.1', '::1'],
    authToken: process.env.METRICS_AUTH_TOKEN,
    allowInDevelopment: process.env.NODE_ENV === 'development'
  };

  // Get client IP with proper forwarding support
  const clientIP = req.ip || 
                   req.get('X-Forwarded-For')?.split(',')[0]?.trim() ||
                   req.get('X-Real-IP') ||
                   req.connection.remoteAddress || 
                   'unknown';
  const authHeader = req.get('Authorization');
  const providedToken = authHeader?.replace('Bearer ', '');

  // Debug logging
  logger.debug('Metrics auth check', { 
    clientIP, 
    nodeEnv: process.env.NODE_ENV,
    allowedIPs: config.allowedIPs,
    allowInDevelopment: config.allowInDevelopment
  });

  // Allow in development if configured
  if (config.allowInDevelopment && process.env.NODE_ENV === 'development') {
    logger.debug('Metrics access allowed in development', { clientIP });
    return next();
  }

  // Check IP allowlist
  const isIPAllowed = config.allowedIPs.some(allowedIP => {
    if (allowedIP === clientIP) return true;
    // Support CIDR notation for IP ranges
    if (allowedIP.includes('/')) {
      // Simple CIDR check (for basic cases like 192.168.1.0/24)
      const [network, prefixLength] = allowedIP.split('/');
      const networkParts = network.split('.').map(Number);
      const clientParts = clientIP.split('.').map(Number);
      
      if (networkParts.length === 4 && clientParts.length === 4) {
        const mask = (0xffffffff << (32 - parseInt(prefixLength))) >>> 0;
        const networkNum = (networkParts[0] << 24) | (networkParts[1] << 16) | (networkParts[2] << 8) | networkParts[3];
        const clientNum = (clientParts[0] << 24) | (clientParts[1] << 16) | (clientParts[2] << 8) | clientParts[3];
        return (clientNum & mask) === (networkNum & mask);
      }
    }
    return false;
  });

  if (!isIPAllowed) {
    logger.warn('Metrics access denied - IP not in allowlist', { 
      clientIP, 
      allowedIPs: config.allowedIPs 
    });
    res.status(403).json({ 
      error: 'Access denied',
      message: 'IP address not authorized for metrics access'
    });
    return;
  }

  // Check auth token if configured
  if (config.authToken && providedToken !== config.authToken) {
    logger.warn('Metrics access denied - invalid auth token', { 
      clientIP,
      hasToken: !!providedToken
    });
    res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Valid auth token required for metrics access'
    });
    return;
  }

  logger.debug('Metrics access granted', { 
    clientIP, 
    hasAuthToken: !!config.authToken 
  });
  
  next();
}

/**
 * Scrub PII from metric labels to prevent data leaks
 * This function should be called before recording any metrics with user data
 */
export function scrubMetricLabels(labels: Record<string, string | number>): Record<string, string | number> {
  const scrubbed = { ...labels };
  
  // List of patterns that might contain PII
  const piiPatterns = [
    /email/i,
    /userid/i,
    /user_id/i,
    /username/i,
    /name/i,
    /phone/i,
    /address/i,
    /ssn/i,
    /credit/i,
    /card/i,
    /token/i,
    /key/i,
    /secret/i,
    /password/i
  ];

  // Scrub any label that matches PII patterns
  Object.keys(scrubbed).forEach(key => {
    const isPII = piiPatterns.some(pattern => pattern.test(key));
    if (isPII) {
      scrubbed[key] = '[REDACTED]';
    }
    
    // Also check if the value itself looks like PII
    const value = String(scrubbed[key]);
    if (value.includes('@') || // Email
        value.match(/^\d{4}-\d{4}-\d{4}-\d{4}$/) || // Credit card
        value.match(/^\d{3}-\d{2}-\d{4}$/) || // SSN
        value.length > 50) { // Suspiciously long values
      scrubbed[key] = '[REDACTED]';
    }
  });

  return scrubbed;
}

/**
 * Validate metric labels before recording to ensure no PII leaks
 */
export function validateMetricLabels(labels: Record<string, string | number>): boolean {
  const scrubbed = scrubMetricLabels(labels);
  const hasRedacted = Object.values(scrubbed).some(value => value === '[REDACTED]');
  
  if (hasRedacted) {
    logger.warn('PII detected in metric labels, scrubbing applied', {
      originalLabels: labels,
      scrubbedLabels: scrubbed
    });
  }
  
  return true;
}
