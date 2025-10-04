/**
 * Trace Service
 * 
 * Provides distributed tracing capabilities for request tracking across services
 */

import { v4 as uuidv4 } from 'uuid';
import { logger } from '../utils/logger';

export interface TraceContext {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  userId?: string;
  operation?: string;
  startTime: number;
  tags?: Record<string, string>;
}

// Store trace context in AsyncLocalStorage for request-scoped access
import { AsyncLocalStorage } from 'async_hooks';

const traceStorage = new AsyncLocalStorage<TraceContext>();

/**
 * Generate a new trace ID
 */
export function generateTraceId(): string {
  return uuidv4();
}

/**
 * Generate a new span ID
 */
export function generateSpanId(): string {
  return uuidv4().substring(0, 16); // Shorter span IDs
}

/**
 * Create a new trace context
 */
export function createTraceContext(
  traceId?: string,
  parentSpanId?: string,
  userId?: string,
  operation?: string
): TraceContext {
  return {
    traceId: traceId || generateTraceId(),
    spanId: generateSpanId(),
    parentSpanId,
    userId,
    operation,
    startTime: Date.now(),
    tags: {}
  };
}

/**
 * Get the current trace context
 */
export function getCurrentTraceContext(): TraceContext | undefined {
  return traceStorage.getStore();
}

/**
 * Get the current trace ID
 */
export function getCurrentTraceId(): string | undefined {
  const context = getCurrentTraceContext();
  return context?.traceId;
}

/**
 * Get the current span ID
 */
export function getCurrentSpanId(): string | undefined {
  const context = getCurrentTraceContext();
  return context?.spanId;
}

/**
 * Run a function with a trace context
 */
export function runWithTraceContext<T>(
  context: TraceContext,
  fn: () => T
): T {
  return traceStorage.run(context, fn);
}

/**
 * Create a child span
 */
export function createChildSpan(
  operation: string,
  tags?: Record<string, string>
): TraceContext | undefined {
  const parentContext = getCurrentTraceContext();
  if (!parentContext) {
    return undefined;
  }

  const childContext: TraceContext = {
    traceId: parentContext.traceId,
    spanId: generateSpanId(),
    parentSpanId: parentContext.spanId,
    userId: parentContext.userId,
    operation,
    startTime: Date.now(),
    tags: { ...parentContext.tags, ...tags }
  };

  return childContext;
}

/**
 * Log with trace context
 */
export function logWithTrace(
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  data?: Record<string, any>
): void {
  const context = getCurrentTraceContext();
  const traceData = context ? {
    traceId: context.traceId,
    spanId: context.spanId,
    operation: context.operation,
    userId: context.userId
  } : {};

  const logData = {
    ...traceData,
    ...data
  };

  switch (level) {
    case 'info':
      logger.info(message, logData);
      break;
    case 'warn':
      logger.warn(message, logData);
      break;
    case 'error':
      logger.error(message, logData);
      break;
    case 'debug':
      logger.debug(message, logData);
      break;
  }
}

/**
 * Add tags to current trace context
 */
export function addTraceTags(tags: Record<string, string>): void {
  const context = getCurrentTraceContext();
  if (context) {
    context.tags = { ...context.tags, ...tags };
  }
}

/**
 * Finish a span and log duration
 */
export function finishSpan(operation?: string): void {
  const context = getCurrentTraceContext();
  if (!context) {
    return;
  }

  const duration = Date.now() - context.startTime;
  const op = operation || context.operation || 'unknown';
  
  logWithTrace('debug', `Span finished: ${op}`, {
    duration,
    operation: op
  });
}

/**
 * Extract trace context from headers
 */
export function extractTraceFromHeaders(headers: Record<string, string | string[] | undefined>): {
  traceId?: string;
  spanId?: string;
} {
  const traceId = Array.isArray(headers['x-trace-id']) 
    ? headers['x-trace-id'][0] 
    : headers['x-trace-id'] as string;
    
  const spanId = Array.isArray(headers['x-span-id']) 
    ? headers['x-span-id'][0] 
    : headers['x-span-id'] as string;

  return { traceId, spanId };
}

/**
 * Create headers for trace propagation
 */
export function createTraceHeaders(context?: TraceContext): Record<string, string> {
  const traceContext = context || getCurrentTraceContext();
  if (!traceContext) {
    return {};
  }

  return {
    'x-trace-id': traceContext.traceId,
    'x-span-id': traceContext.spanId,
    'x-parent-span-id': traceContext.parentSpanId || ''
  };
}

/**
 * Middleware to create trace context for requests
 */
export function traceMiddleware(req: any, res: any, next: any): void {
  const { traceId, spanId } = extractTraceFromHeaders(req.headers);
  
  const context = createTraceContext(
    traceId,
    undefined, // No parent span for incoming requests
    req.user?.id,
    `${req.method} ${req.path}`
  );

  // Add trace headers to response
  res.set(createTraceHeaders(context));

  // Run the request with trace context
  runWithTraceContext(context, () => {
    logWithTrace('info', 'Request started', {
      method: req.method,
      path: req.path,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });

    // Override res.end to log request completion
    const originalEnd = res.end;
    res.end = function(chunk?: any, encoding?: any) {
      const duration = Date.now() - context.startTime;
      logWithTrace('info', 'Request completed', {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        duration
      });
      
      originalEnd.call(this, chunk, encoding);
    };

    next();
  });
}
