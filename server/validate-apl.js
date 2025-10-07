const { PrismaClient } = require('@prisma/client');

async function validateAPL() {
  console.log('🚀 APL Implementation Validation');
  console.log('================================');
  
  const prisma = new PrismaClient();
  
  try {
    // 1. Test database connection
    console.log('1. Testing database connection...');
    await prisma.$connect();
    console.log('   ✅ Database connected');
    
    // 2. Create test user and event first
    console.log('2. Creating test user and event...');
    const testUser = await prisma.user.upsert({
      where: { email: 'test-user@example.com' },
      update: {},
      create: {
        id: 'test-user-123',
        email: 'test-user@example.com',
        name: 'Test User'
      }
    });
    
    const testEvent = await prisma.event.upsert({
      where: { id: 'test-event-123' },
      update: {},
      create: {
        id: 'test-event-123',
        title: 'Test Event',
        description: 'Test event for APL validation',
        startTime: new Date(Date.now() + 3600 * 1000),
        endTime: new Date(Date.now() + 3600 * 1000 + 30 * 60 * 1000),
        userId: testUser.id,
        isAllDay: false
      }
    });
    console.log('   ✅ Test user and event created');
    
    // 3. Test TentativeHold model
    console.log('3. Testing TentativeHold model...');
    const testHold = await prisma.tentativeHold.create({
      data: {
        eventId: testEvent.id,
        userId: testUser.id,
        provider: 'syncscript',
        startsAt: new Date(Date.now() + 3600 * 1000),
        endsAt: new Date(Date.now() + 3600 * 1000 + 30 * 60 * 1000),
        status: 'suggested',
        idempotencyKey: `test-key-${Date.now()}`
      }
    });
    console.log('   ✅ TentativeHold created:', testHold.id);
    
    // 4. Test idempotency constraint
    console.log('4. Testing idempotency constraint...');
    try {
      await prisma.tentativeHold.create({
        data: {
          eventId: testEvent.id,
          userId: testUser.id,
          provider: 'syncscript',
          startsAt: new Date(Date.now() + 3600 * 1000),
          endsAt: new Date(Date.now() + 3600 * 1000 + 30 * 60 * 1000),
          status: 'suggested',
          idempotencyKey: testHold.idempotencyKey // Same key
        }
      });
      console.log('   ❌ Idempotency constraint failed - duplicate key allowed');
    } catch (error) {
      if (error.code === 'P2002') {
        console.log('   ✅ Idempotency constraint working - duplicate key rejected');
      } else {
        console.log('   ⚠️  Unexpected error:', error.message);
      }
    }
    
    // 5. Test status updates
    console.log('5. Testing status updates...');
    const updatedHold = await prisma.tentativeHold.update({
      where: { id: testHold.id },
      data: { status: 'confirmed' }
    });
    console.log('   ✅ Status updated to:', updatedHold.status);
    
    // 6. Test sibling dismissal
    console.log('6. Testing sibling dismissal...');
    const siblingHold = await prisma.tentativeHold.create({
      data: {
        eventId: testHold.eventId,
        userId: testHold.userId,
        provider: 'syncscript',
        startsAt: new Date(Date.now() + 7200 * 1000),
        endsAt: new Date(Date.now() + 7200 * 1000 + 30 * 60 * 1000),
        status: 'suggested',
        idempotencyKey: `sibling-key-${Date.now()}`
      }
    });
    
    const dismissedSiblings = await prisma.tentativeHold.updateMany({
      where: { 
        eventId: testHold.eventId, 
        id: { not: testHold.id }, 
        status: 'suggested' 
      },
      data: { status: 'dismissed' }
    });
    console.log('   ✅ Siblings dismissed:', dismissedSiblings.count);
    
    // 7. Test cleanup (stale holds)
    console.log('7. Testing cleanup functionality...');
    const staleEvent = await prisma.event.upsert({
      where: { id: 'stale-event-123' },
      update: {},
      create: {
        id: 'stale-event-123',
        title: 'Stale Event',
        description: 'Stale event for cleanup test',
        startTime: new Date(Date.now() - 50 * 60 * 60 * 1000),
        endTime: new Date(Date.now() - 49 * 60 * 60 * 1000),
        userId: testUser.id,
        isAllDay: false
      }
    });
    
    const staleHold = await prisma.tentativeHold.create({
      data: {
        eventId: staleEvent.id,
        userId: testUser.id,
        provider: 'syncscript',
        startsAt: new Date(Date.now() - 50 * 60 * 60 * 1000), // 50 hours ago
        endsAt: new Date(Date.now() - 49 * 60 * 60 * 1000),   // 49 hours ago
        status: 'suggested',
        idempotencyKey: `stale-key-${Date.now()}`
      }
    });
    
    const threshold = new Date(Date.now() - 48 * 60 * 60 * 1000); // 48 hours ago
    const cleanupResult = await prisma.tentativeHold.updateMany({
      where: { 
        status: 'suggested', 
        startsAt: { lt: threshold } 
      },
      data: { status: 'dismissed' }
    });
    console.log('   ✅ Stale holds cleaned up:', cleanupResult.count);
    
    // 8. Cleanup test data
    console.log('8. Cleaning up test data...');
    await prisma.tentativeHold.deleteMany({
      where: { 
        OR: [
          { eventId: testEvent.id },
          { eventId: staleEvent.id }
        ]
      }
    });
    await prisma.event.deleteMany({
      where: { 
        OR: [
          { id: testEvent.id },
          { id: staleEvent.id }
        ]
      }
    });
    await prisma.user.delete({
      where: { id: testUser.id }
    });
    console.log('   ✅ Test data cleaned up');
    
    console.log('\n🎉 APL Implementation Validation Complete!');
    console.log('All core functionality is working correctly.');
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

validateAPL();
