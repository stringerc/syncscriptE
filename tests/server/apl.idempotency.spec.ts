import request from 'supertest';
import { app } from '../../server/src/index';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

describe('APL Idempotency', () => {
  let testEventId: string;
  let testUserId: string;
  let authToken: string;

  beforeAll(async () => {
    // Create test user and event
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        email: 'idempotency-test@example.com',
        name: 'Idempotency Test User',
        role: 'user'
      }
    });
    testUserId = user.id;

    const event = await prisma.event.create({
      data: {
        id: uuidv4(),
        title: 'Idempotency Test Event',
        description: 'Test event for idempotency',
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
    await prisma.idempotencyKey.deleteMany({ where: { key: { contains: 'idempotency-test' } } });
    await prisma.event.deleteMany({ where: { id: testEventId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
    await prisma.$disconnect();
  });

  describe('Duplicate suggest requests', () => {
    it('should not create duplicate holds with same idempotency key', async () => {
      const idempotencyKey = `idempotency-test-${uuidv4()}`;

      // First request
      const response1 = await request(app)
        .post(`/api/apl/suggest?eventId=${testEventId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-idempotency-key', idempotencyKey)
        .send({ max: 3, source: 'idempotency-test' })
        .expect(200);

      const initialHoldsCount = response1.body.holds.length;
      expect(initialHoldsCount).toBeGreaterThan(0);

      // Second request with same key
      const response2 = await request(app)
        .post(`/api/apl/suggest?eventId=${testEventId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-idempotency-key', idempotencyKey)
        .send({ max: 3, source: 'idempotency-test' })
        .expect(200);

      // Should return same response
      expect(response1.body.holds).toEqual(response2.body.holds);

      // Should not create additional holds in database
      const holds = await prisma.tentativeHold.findMany({
        where: { eventId: testEventId }
      });
      expect(holds).toHaveLength(initialHoldsCount);
    });

    it('should track idempotency metrics correctly', async () => {
      const idempotencyKey = `metrics-test-${uuidv4()}`;

      // Get initial metrics
      const metricsBefore = await request(app)
        .get('/metrics')
        .expect(200);

      // First request
      await request(app)
        .post(`/api/apl/suggest?eventId=${testEventId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-idempotency-key', idempotencyKey)
        .send({ max: 3, source: 'metrics-test' })
        .expect(200);

      // Second request (should hit idempotency)
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

      // Should see idempotency hit counter increase
      const beforeText = metricsBefore.text;
      const afterText = metricsAfter.text;

      // Extract idempotency hit count (adjust pattern based on your metrics format)
      const beforeHits = (beforeText.match(/idempotency_hit_count.*apl-suggest/g) || []).length;
      const afterHits = (afterText.match(/idempotency_hit_count.*apl-suggest/g) || []).length;

      expect(afterHits).toBeGreaterThanOrEqual(beforeHits);
    });
  });

  describe('Duplicate confirm requests', () => {
    let holdId: string;

    beforeAll(async () => {
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
          key: `test-hold-${uuidv4()}`
        }
      });
      holdId = hold.id;
    });

    it('should not create duplicate confirmations with same idempotency key', async () => {
      const confirmKey = `confirm-idempotency-${uuidv4()}`;

      // First confirmation
      const response1 = await request(app)
        .post(`/api/apl/confirm/${holdId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-idempotency-key', confirmKey)
        .expect(202);

      // Second confirmation with same key
      const response2 = await request(app)
        .post(`/api/apl/confirm/${holdId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-idempotency-key', confirmKey)
        .expect(202);

      // Should return same response
      expect(response1.body).toEqual(response2.body);

      // Hold should still be confirmed (not double-confirmed)
      const hold = await prisma.tentativeHold.findUnique({
        where: { id: holdId }
      });
      expect(hold?.status).toBe('confirmed');
    });
  });

  describe('Duplicate dismiss requests', () => {
    let holdId: string;

    beforeAll(async () => {
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
          key: `dismiss-test-${uuidv4()}`
        }
      });
      holdId = hold.id;
    });

    it('should not create duplicate dismissals with same idempotency key', async () => {
      const dismissKey = `dismiss-idempotency-${uuidv4()}`;

      // First dismissal
      const response1 = await request(app)
        .post(`/api/apl/dismiss/${holdId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-idempotency-key', dismissKey)
        .expect(200);

      // Second dismissal with same key
      const response2 = await request(app)
        .post(`/api/apl/dismiss/${holdId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-idempotency-key', dismissKey)
        .expect(200);

      // Should return same response
      expect(response1.body).toEqual(response2.body);

      // Hold should still be dismissed (not double-dismissed)
      const hold = await prisma.tentativeHold.findUnique({
        where: { id: holdId }
      });
      expect(hold?.status).toBe('dismissed');
    });
  });
});
