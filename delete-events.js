const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deleteAllEvents() {
  try {
    console.log('🗑️  Deleting all events...');
    
    // Delete all events
    const deletedEvents = await prisma.event.deleteMany({});
    
    console.log(`✅ Deleted ${deletedEvents.count} events`);
    
    // Also delete any tasks that were linked to events
    const deletedTasks = await prisma.task.deleteMany({
      where: {
        eventId: {
          not: null
        }
      }
    });
    
    console.log(`✅ Deleted ${deletedTasks.count} tasks linked to events`);
    
    console.log('🎉 All events and related tasks have been deleted!');
    
  } catch (error) {
    console.error('❌ Error deleting events:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllEvents();
