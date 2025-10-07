import request from 'supertest';
import { app } from '../../server/src/index';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

describe('APL API Contracts', () => {
  let testEventId: string;
  let testUserId: string;
  let authToken: string;

  beforeAll(async () => {
    // Create test user and event
    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        email: 'test@example.com',
        name: 'Test User',
        role: 'user'
      }
    });
    testUserId = user.id;

    const event = await prisma.event.create({
      data: {
        id: uuidv4(),
        title: 'Test Event',
        description: 'Test event for APL',
        startTime: new Date(Date.now() + 3600 * 1000), // 1 hour from now
        endTime: new Date(Date.now() + 3600 * 1000 + 30 * 60 * 1000), // 30 min duration
        userId: testUserId,
        isAllDay: false
      }
    });
    testEventId = event.id;

    // Mock auth token (adjust based on your auth implementation)
    authToken = 'test-token';
  });

  afterAll(async () => {
    // Cleanup
    await prisma.tentativeHold.deleteMany({ where: { eventId: testEventId } });
    await prisma.event.deleteMany({ where: { id: testEventId } });
    await prisma.user.deleteMany({ where: { id: testUserId } });
    await prisma.$disconnect();
  });

  describe('GET /api/apl/ready', () => {
    it('should return ready status for valid event', async () => {
      const response = await request(app)
        .get(`/api/apl/ready?eventId=${testEventId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        ready: expect.any(Boolean)
      });
    });

    it('should return 400 for missing eventId', async () => {
      await request(app)
        .get('/api/apl/ready')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);
    });
  });

  describe('POST /api/apl/suggest', () => {
    const idempotencyKey = `test-key-${uuidv4()}`;

    it('should suggest holds for valid event', async () => {
      const response = await request(app)
        .post(`/api/apl/suggest?eventId=${testEventId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-idempotency-key', idempotencyKey)
        .send({ max: 3, source: 'test' })
        .expect(200);

      expect(response.body).toMatchObject({
        holds: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            start: expect.any(String),
            end: expect.any(String),
            provider: expect.any(String),
            status: 'suggested'
          })
        ]),
        maxHolds: 3
      });

      // Verify holds were created in database
      const holds = await prisma.tentativeHold.findMany({
        where: { eventId: testEventId }
      });
      expect(holds).toHaveLength(3);
      
      // Verify hold structure
      holds.forEach(hold => {
        expect(hold).toMatchObject({
          id: expect.any(String),
          eventId: testEventId,
          userId: testUserId,
          provider: expect.any(String),
          status: 'suggested',
          idempotencyKey: expect.any(String),
          startsAt: expect.any(Date),
          endsAt: expect.any(Date)
        });
      });
    });

    it('should return same result for duplicate idempotency key', async () => {
      const response1 = await request(app)
        .post(`/api/apl/suggest?eventId=${testEventId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-idempotency-key', idempotencyKey)
        .send({ max: 3, source: 'test' });

      const response2 = await request(app)
        .post(`/api/apl/suggest?eventId=${testEventId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-idempotency-key', idempotencyKey)
        .send({ max: 3, source: 'test' });

      // Should return same response (idempotent)
      expect(response1.body.holds).toEqual(response2.body.holds);

      // Should not create additional holds
      const holds = await prisma.tentativeHold.findMany({
        where: { eventId: testEventId }
      });
      expect(holds).toHaveLength(3); // Still only 3 from first call
    });
  });

  describe('GET /api/apl/holds/:eventId', () => {
    it('should return holds for event', async () => {
      const response = await request(app)
        .get(`/api/apl/holds/${testEventId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        holds: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            start: expect.any(String),
            end: expect.any(String),
            provider: expect.any(String),
            status: 'suggested'
          })
        ])
      });
    });
  });

  describe('POST /api/apl/confirm/:holdId', () => {
    let holdId: string;

    beforeAll(async () => {
      // Get a hold ID from the created holds
      const holds = await prisma.tentativeHold.findMany({
        where: { eventId: testEventId }
      });
      holdId = holds[0].id;
    });

    it('should confirm a hold', async () => {
      const confirmKey = `confirm-${uuidv4()}`;
      
      const response = await request(app)
        .post(`/api/apl/confirm/${holdId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-idempotency-key', confirmKey)
        .expect(202);

      expect(response.body).toMatchObject({
        enqueued: true,
        providerEventId: expect.any(String)
      });

      // Verify hold status updated
      const hold = await prisma.tentativeHold.findUnique({
        where: { id: holdId }
      });
      expect(hold?.status).toBe('confirmed');
      
      // Verify siblings are dismissed
      const siblings = await prisma.tentativeHold.findMany({
        where: { 
          eventId: testEventId, 
          id: { not: holdId }, 
          status: 'suggested' 
        }
      });
      expect(siblings).toHaveLength(0); // All siblings should be dismissed
    });
  });

  describe('POST /api/apl/dismiss/:holdId', () => {
    let holdId: string;

    beforeAll(async () => {
      // Get a different hold ID
      const holds = await prisma.tentativeHold.findMany({
        where: { eventId: testEventId, status: 'suggested' }
      });
      holdId = holds[0]?.id;
    });

    it('should dismiss a hold', async () => {
      const dismissKey = `dismiss-${uuidv4()}`;
      
      const response = await request(app)
        .post(`/api/apl/dismiss/${holdId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .set('x-idempotency-key', dismissKey)
        .expect(200);

      expect(response.body).toMatchObject({
        ok: true
      });

      // Verify hold status updated
      const hold = await prisma.tentativeHold.findUnique({
        where: { id: holdId }
      });
      expect(hold?.status).toBe('dismissed');
    });
  });
});
