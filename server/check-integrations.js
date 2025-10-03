import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkIntegrations() {
  try {
    const integrations = await prisma.calendarIntegration.findMany({
      where: {
        userId: 'cmfzql79u0002krjyxplrmcri' // Your user ID from the logs
      }
    });
    
    console.log('Calendar Integrations:');
    console.log(JSON.stringify(integrations, null, 2));
    
    // Also check for any integrations with 'apple' provider
    const appleIntegrations = await prisma.calendarIntegration.findMany({
      where: {
        provider: 'apple'
      }
    });
    
    console.log('\nApple Provider Integrations:');
    console.log(JSON.stringify(appleIntegrations, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkIntegrations();
