import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixProviderNames() {
  try {
    // Update all 'apple' providers to 'icloud'
    const result = await prisma.calendarIntegration.updateMany({
      where: {
        provider: 'apple'
      },
      data: {
        provider: 'icloud'
      }
    });
    
    console.log(`Updated ${result.count} integrations from 'apple' to 'icloud'`);
    
    // Check the updated integrations
    const integrations = await prisma.calendarIntegration.findMany({
      where: {
        userId: 'cmfzql79u0002krjyxplrmcri'
      }
    });
    
    console.log('\nUpdated Calendar Integrations:');
    console.log(JSON.stringify(integrations, null, 2));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixProviderNames();
