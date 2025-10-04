const { PrismaClient } = require('@prisma/client');

async function initDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Initializing database...');
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');
    
    // Create a test user to verify the database works
    const testUser = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        timezone: 'UTC'
      }
    });
    
    console.log('✅ Test user created:', testUser.id);
    
    // Check if key tables exist by querying them
    const userCount = await prisma.user.count();
    console.log('✅ User table accessible, count:', userCount);
    
    // Try to create a test event
    const testEvent = await prisma.event.create({
      data: {
        title: 'Test Event',
        description: 'Test event for verification',
        startTime: new Date(),
        endTime: new Date(Date.now() + 3600000), // 1 hour later
        userId: testUser.id
      }
    });
    
    console.log('✅ Test event created:', testEvent.id);
    
    // Check if outbox table exists
    try {
      const outboxCount = await prisma.outbox.count();
      console.log('✅ Outbox table accessible, count:', outboxCount);
    } catch (error) {
      console.log('❌ Outbox table not accessible:', error.message);
    }
    
    console.log('🎉 Database initialization completed successfully!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initDatabase();
