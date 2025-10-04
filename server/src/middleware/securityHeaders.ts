/**
 * Security Headers Middleware
 * 
 * Implements comprehensive security headers for protection against common attacks
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { getCurrentTraceContext } from '../services/traceService';

/**
 * Generate a cryptographically secure nonce for CSP
 */
function generateNonce(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(16).toString('base64');
}

/**
 * Security headers middleware
 */
export function securityHeadersMiddleware(req: Request, res: Response, next: NextFunction): void {
  const traceContext = getCurrentTraceContext();
  
  try {
    // Generate nonce for this request
    const nonce = generateNonce();
    
    // Store nonce in response locals for use in templates
    res.locals.nonce = nonce;
    
    // Content Security Policy (CSP)
    // Allow inline scripts/styles with nonce, but block eval and unsafe-inline
    const cspDirectives = [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https://cdn.jsdelivr.net https://unpkg.com`,
      `style-src 'self' 'nonce-${nonce}' https://fonts.googleapis.com`,
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "media-src 'self' https:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
      "block-all-mixed-content"
    ].join('; ');
    
    res.setHeader('Content-Security-Policy', cspDirectives);
    
    // X-Frame-Options: DENY (prevent clickjacking)
    res.setHeader('X-Frame-Options', 'DENY');
    
    // Cross-Origin Embedder Policy (COEP)
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    
    // Cross-Origin Opener Policy (COOP)
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    
    // Cross-Origin Resource Policy (CORP)
    res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
    
    // Referrer Policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // X-Content-Type-Options (prevent MIME sniffing)
    res.setHeader('X-Content-Type-Options', 'nosniff');
    
    // X-Download-Options (IE8+)
    res.setHeader('X-Download-Options', 'noopen');
    
    // X-Permitted-Cross-Domain-Policies
    res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
    
    // Permissions Policy (formerly Feature Policy)
    const permissionsPolicy = [
      'accelerometer=()',
      'ambient-light-sensor=()',
      'autoplay=()',
      'battery=()',
      'camera=()',
      'cross-origin-isolated=()',
      'display-capture=()',
      'document-domain=()',
      'encrypted-media=()',
      'execution-while-not-rendered=()',
      'execution-while-out-of-viewport=()',
      'fullscreen=(self)',
      'geolocation=(self)',
      'gyroscope=()',
      'keyboard-map=()',
      'magnetometer=()',
      'microphone=()',
      'midi=()',
      'navigation-override=()',
      'payment=()',
      'picture-in-picture=()',
      'publickey-credentials-get=(self)',
      'screen-wake-lock=()',
      'sync-xhr=()',
      'usb=()',
      'web-share=()',
      'xr-spatial-tracking=()'
    ].join(', ');
    
    res.setHeader('Permissions-Policy', permissionsPolicy);
    
    // Strict-Transport-Security (HSTS) - only for HTTPS
    if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    }
    
    // X-XSS-Protection (legacy, but still useful for older browsers)
    res.setHeader('X-XSS-Protection', '1; mode=block');
    
    // Cache-Control for sensitive endpoints
    if (req.path.startsWith('/api/') && req.method !== 'GET') {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
    
    // Add security headers to response for debugging
    if (process.env.NODE_ENV === 'development') {
      res.setHeader('X-Security-Headers-Applied', 'true');
      res.setHeader('X-Nonce', nonce);
    }
    
    logger.debug('Security headers applied', {
      traceId: traceContext?.traceId,
      path: req.path,
      method: req.method,
      nonce: nonce.substring(0, 8) + '...'
    });
    
    next();
    
  } catch (error) {
    logger.error('Failed to apply security headers', {
      traceId: traceContext?.traceId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    // Continue without security headers rather than failing the request
    next();
  }
}

/**
 * Middleware to add security headers for static assets
 */
export function staticSecurityHeadersMiddleware(req: Request, res: Response, next: NextFunction): void {
  // Add security headers specifically for static assets
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  
  next();
}

/**
 * Middleware to validate and sanitize request headers
 */
export function requestValidationMiddleware(req: Request, res: Response, next: NextFunction): void {
  const traceContext = getCurrentTraceContext();
  
  try {
    // Check for suspicious headers
    const suspiciousHeaders = [
      'x-forwarded-host',
      'x-originating-ip',
      'x-remote-ip',
      'x-remote-addr',
      'x-client-ip'
    ];
    
    for (const header of suspiciousHeaders) {
      if (req.headers[header]) {
        logger.warn('Suspicious header detected', {
          traceId: traceContext?.traceId,
          header,
          value: req.headers[header],
          ip: req.ip,
          userAgent: req.get('User-Agent')
        });
      }
    }
    
    // Validate Content-Type for POST/PUT requests
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const contentType = req.get('Content-Type');
      if (!contentType || !contentType.includes('application/json')) {
        logger.warn('Invalid Content-Type for request', {
          traceId: traceContext?.traceId,
          method: req.method,
          contentType,
          path: req.path
        });
      }
    }
    
    next();
    
  } catch (error) {
    logger.error('Request validation failed', {
      traceId: traceContext?.traceId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    // Continue processing the request
    next();
  }
}
