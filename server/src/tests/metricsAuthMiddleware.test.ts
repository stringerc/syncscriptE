import { Request, Response, NextFunction } from 'express';
import { metricsAuthMiddleware, scrubMetricLabels, validateMetricLabels } from '../middleware/metricsAuthMiddleware';

// Mock logger
jest.mock('../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    error: jest.fn()
  }
}));

describe('MetricsAuthMiddleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      ip: '127.0.0.1',
      get: jest.fn(),
      connection: { remoteAddress: '127.0.0.1' }
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    mockNext = jest.fn();

    // Reset environment variables
    delete process.env.METRICS_ALLOWED_IPS;
    delete process.env.METRICS_AUTH_TOKEN;
    process.env.NODE_ENV = 'production';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('IP allowlist', () => {
    it('should allow localhost IPs by default', () => {
      metricsAuthMiddleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it('should allow custom IPs from environment', () => {
      process.env.METRICS_ALLOWED_IPS = '192.168.1.100,10.0.0.1';
      mockReq.ip = '192.168.1.100';
      
      metricsAuthMiddleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny IPs not in allowlist', () => {
      process.env.METRICS_ALLOWED_IPS = '192.168.1.100';
      mockReq.ip = '192.168.1.200';
      
      metricsAuthMiddleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Access denied',
        message: 'IP address not authorized for metrics access'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should support CIDR notation', () => {
      process.env.METRICS_ALLOWED_IPS = '192.168.1.0/24';
      mockReq.ip = '192.168.1.50';
      
      metricsAuthMiddleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Auth token', () => {
    it('should allow access without token when not configured', () => {
      metricsAuthMiddleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should require valid token when configured', () => {
      process.env.METRICS_AUTH_TOKEN = 'secret-token';
      (mockReq.get as jest.Mock).mockReturnValue('Bearer secret-token');
      
      metricsAuthMiddleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should deny access with invalid token', () => {
      process.env.METRICS_AUTH_TOKEN = 'secret-token';
      (mockReq.get as jest.Mock).mockReturnValue('Bearer wrong-token');
      
      metricsAuthMiddleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Unauthorized',
        message: 'Valid auth token required for metrics access'
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access without token when required', () => {
      process.env.METRICS_AUTH_TOKEN = 'secret-token';
      (mockReq.get as jest.Mock).mockReturnValue(undefined);
      
      metricsAuthMiddleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Development mode', () => {
    it('should allow all access in development when configured', () => {
      process.env.NODE_ENV = 'development';
      mockReq.ip = '192.168.1.200'; // Not in allowlist
      
      metricsAuthMiddleware(mockReq as Request, mockRes as Response, mockNext);
      expect(mockNext).toHaveBeenCalled();
    });
  });
});

describe('PII Scrubbing', () => {
  describe('scrubMetricLabels', () => {
    it('should scrub email addresses', () => {
      const labels = { user: 'john@example.com', route: '/api/users' };
      const scrubbed = scrubMetricLabels(labels);
      expect(scrubbed.user).toBe('[REDACTED]');
      expect(scrubbed.route).toBe('/api/users');
    });

    it('should scrub user IDs', () => {
      const labels = { userId: '12345', feature: 'export' };
      const scrubbed = scrubMetricLabels(labels);
      expect(scrubbed.userId).toBe('[REDACTED]');
      expect(scrubbed.feature).toBe('export');
    });

    it('should scrub credit card patterns', () => {
      const labels = { card: '1234-5678-9012-3456', status: 'success' };
      const scrubbed = scrubMetricLabels(labels);
      expect(scrubbed.card).toBe('[REDACTED]');
      expect(scrubbed.status).toBe('success');
    });

    it('should scrub SSN patterns', () => {
      const labels = { ssn: '123-45-6789', action: 'login' };
      const scrubbed = scrubMetricLabels(labels);
      expect(scrubbed.ssn).toBe('[REDACTED]');
      expect(scrubbed.action).toBe('login');
    });

    it('should scrub suspiciously long values', () => {
      const labels = { token: 'a'.repeat(100), method: 'POST' };
      const scrubbed = scrubMetricLabels(labels);
      expect(scrubbed.token).toBe('[REDACTED]');
      expect(scrubbed.method).toBe('POST');
    });

    it('should preserve safe values', () => {
      const labels = { 
        route: '/api/tasks', 
        method: 'GET', 
        status: '200',
        feature: 'dashboard'
      };
      const scrubbed = scrubMetricLabels(labels);
      expect(scrubbed).toEqual(labels);
    });
  });

  describe('validateMetricLabels', () => {
    it('should return true for valid labels', () => {
      const labels = { route: '/api/tasks', method: 'GET' };
      const result = validateMetricLabels(labels);
      expect(result).toBe(true);
    });

    it('should return true and log warning for PII labels', () => {
      const labels = { user: 'john@example.com', route: '/api/users' };
      const result = validateMetricLabels(labels);
      expect(result).toBe(true);
    });
  });
});
