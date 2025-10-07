import request from 'supertest';
import { app } from '../../server/src/index';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

describe('APL Metrics', () => {
  let testEventId: string;
  let testUserId: string;
  let authToken: string;

  beforeAll(async () => {
    // Create test user and event
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        email: 'metrics-test@example.com',
        name: 'Metrics Test User',
        role: 'user'
      }
    });
    testUserId = user.id;

    const event = await prisma.event.create({
      data: {
        id: uuidv4(),
        title: 'Metrics Test Event',
        description: 'Test event for metrics',
        startTime: new Date(Date.now() + 3600 * 1000),
        endTime: new Date(Date.now() + 3600 * 1000 + 30 * 60 * 1000),
        userId: testUserId,
        isAllDay: false
      }
    });
    testEventId = event.id;

    authToken = 'test-token';
  });

  afterAll(async () => {
    // Cleanup
    await prisma.tentativeHold.deleteMany({ where: { eventId: testEventId } });
    await prisma.event.deleteMany({ where: { id: testEventId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
    await prisma.$disconnect();
  });

  describe('APL metrics tracking', () => {
    it('should track APL suggest metrics', async () => {
      // Get initial metrics
      const metricsBefore = await request(app)
        .get('/metrics')
        .expect(200);

      const beforeText = metricsBefore.text;

      // Call APL suggest endpoint
      const idempotencyKey = `metrics-test-${uuidv4()}`;
      await request(app)
        .post(`/api/apl/suggest?eventId=${testEventId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-idempotency-key', idempotencyKey)
        .send({ max: 3, source: 'metrics-test' })
        .expect(200);

      // Get final metrics
      const metricsAfter = await request(app)
        .get('/metrics')
        .expect(200);

      const afterText = metricsAfter.text;

      // Check for APL suggest metrics
      expect(afterText).toContain('apl_suggested_total');
      expect(afterText).toContain('apl_suggest_duration_ms');

      // Verify metrics increased
      const beforeSuggestCount = (beforeText.match(/apl_suggested_total\s+(\d+)/) || [null, '0'])[1];
      const afterSuggestCount = (afterText.match(/apl_suggested_total\s+(\d+)/) || [null, '0'])[1];
      
      expect(parseInt(afterSuggestCount)).toBeGreaterThan(parseInt(beforeSuggestCount));
    });

    it('should track APL confirm metrics', async () => {
      // Create a hold to confirm
      const hold = await prisma.tentativeHold.create({
        data: {
          id: uuidv4(),
          userId: testUserId,
          eventId: testEventId,
          start: new Date(Date.now() + 3600 * 1000),
          end: new Date(Date.now() + 3600 * 1000 + 30 * 60 * 1000),
          provider: 'syncscript',
          status: 'suggested',
          key: `confirm-metrics-${uuidv4()}`
        }
      });

      // Get initial metrics
      const metricsBefore = await request(app)
        .get('/metrics')
        .expect(200);

      const beforeText = metricsBefore.text;

      // Call APL confirm endpoint
      const confirmKey = `confirm-metrics-${uuidv4()}`;
      await request(app)
        .post(`/api/apl/confirm/${hold.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-idempotency-key', confirmKey)
        .expect(202);

      // Get final metrics
      const metricsAfter = await request(app)
        .get('/metrics')
        .expect(200);

      const afterText = metricsAfter.text;

      // Check for APL confirm metrics
      expect(afterText).toContain('apl_confirm_success_total');

      // Verify metrics increased
      const beforeConfirmCount = (beforeText.match(/apl_confirm_success_total\s+(\d+)/) || [null, '0'])[1];
      const afterConfirmCount = (afterText.match(/apl_confirm_success_total\s+(\d+)/) || [null, '0'])[1];
      
      expect(parseInt(afterConfirmCount)).toBeGreaterThan(parseInt(beforeConfirmCount));
    });

    it('should track APL dismiss metrics', async () => {
      // Create a hold to dismiss
      const hold = await prisma.tentativeHold.create({
        data: {
          id: uuidv4(),
          userId: testUserId,
          eventId: testEventId,
          start: new Date(Date.now() + 3600 * 1000),
          end: new Date(Date.now() + 3600 * 1000 + 30 * 60 * 1000),
          provider: 'syncscript',
          status: 'suggested',
          key: `dismiss-metrics-${uuidv4()}`
        }
      });

      // Get initial metrics
      const metricsBefore = await request(app)
        .get('/metrics')
        .expect(200);

      const beforeText = metricsBefore.text;

      // Call APL dismiss endpoint
      const dismissKey = `dismiss-metrics-${uuidv4()}`;
      await request(app)
        .post(`/api/apl/dismiss/${hold.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-idempotency-key', dismissKey)
        .expect(200);

      // Get final metrics
      const metricsAfter = await request(app)
        .get('/metrics')
        .expect(200);

      const afterText = metricsAfter.text;

      // Check for APL dismiss metrics
      expect(afterText).toContain('apl_dismissed_total');

      // Verify metrics increased
      const beforeDismissCount = (beforeText.match(/apl_dismissed_total\s+(\d+)/) || [null, '0'])[1];
      const afterDismissCount = (afterText.match(/apl_dismissed_total\s+(\d+)/) || [null, '0'])[1];
      
      expect(parseInt(afterDismissCount)).toBeGreaterThan(parseInt(beforeDismissCount));
    });
  });

  describe('PII scrubbing in metrics', () => {
    it('should not expose PII in metric labels', async () => {
      // Call APL endpoints with user data
      const idempotencyKey = `pii-test-${uuidv4()}`;
      await request(app)
        .post(`/api/apl/suggest?eventId=${testEventId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-idempotency-key', idempotencyKey)
        .send({ max: 3, source: 'pii-test' })
        .expect(200);

      // Get metrics
      const metrics = await request(app)
        .get('/metrics')
        .expect(200);

      const metricsText = metrics.text;

      // Check that no PII is exposed in metrics
      expect(metricsText).not.toContain('metrics-test@example.com');
      expect(metricsText).not.toContain('Metrics Test User');
      expect(metricsText).not.toContain(testUserId);
      expect(metricsText).not.toContain(testEventId);

      // Check that redacted values are present instead
      expect(metricsText).toContain('[REDACTED]');
    });

    it('should scrub PII from telemetry events', async () => {
      // Simulate telemetry event with PII
      const telemetryEvent = {
        events: [
          {
            event: 'ui.apl.suggest_clicked',
            properties: {
              eventId: testEventId,
              userId: testUserId,
              userEmail: 'metrics-test@example.com',
              userName: 'Metrics Test User'
            },
            timestamp: new Date().toISOString()
          }
        ]
      };

      await request(app)
        .post('/api/telemetry')
        .send(telemetryEvent)
        .expect(200);

      // Get metrics to check if PII was scrubbed
      const metrics = await request(app)
        .get('/metrics')
        .expect(200);

      const metricsText = metrics.text;

      // PII should be scrubbed
      expect(metricsText).not.toContain('metrics-test@example.com');
      expect(metricsText).not.toContain('Metrics Test User');
      expect(metricsText).not.toContain(testUserId);
      expect(metricsText).not.toContain(testEventId);
    });
  });

  describe('Metrics format validation', () => {
    it('should return valid Prometheus format', async () => {
      const response = await request(app)
        .get('/metrics')
        .expect(200);

      const metricsText = response.text;

      // Check Prometheus format
      expect(metricsText).toContain('# HELP');
      expect(metricsText).toContain('# TYPE');
      expect(metricsText).toContain('counter');
      expect(metricsText).toContain('histogram');

      // Check APL-specific metrics
      expect(metricsText).toContain('apl_suggested_total');
      expect(metricsText).toContain('apl_confirm_success_total');
      expect(metricsText).toContain('apl_dismissed_total');
      expect(metricsText).toContain('apl_suggest_duration_ms');
    });

    it('should have consistent metric naming', async () => {
      const response = await request(app)
        .get('/metrics')
        .expect(200);

      const metricsText = response.text;

      // Check for consistent naming patterns
      const aplMetrics = metricsText.match(/apl_\w+/g) || [];
      const uniqueMetrics = [...new Set(aplMetrics)];

      // All APL metrics should follow naming convention
      uniqueMetrics.forEach(metric => {
        expect(metric).toMatch(/^apl_[a-z_]+$/);
      });
    });
  });
});
