#!/usr/bin/env node

/**
 * Script to restore "Prep for:" prefixes for tasks that are related to events (have eventId)
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function restorePrepPrefixes() {
  try {
    console.log('🔄 Restoring "Prep for:" prefixes for event-related tasks...');

    // Find all tasks that have an eventId but don't have "Prep for:" in their title
    const tasksWithEventId = await prisma.task.findMany({
      where: {
        eventId: {
          not: null
        },
        title: {
          not: {
            startsWith: 'Prep for:'
          }
        }
      },
      include: {
        event: true // Include the related event
      }
    });

    console.log(`📋 Found ${tasksWithEventId.length} event-related tasks without "Prep for:" prefix`);

    for (const task of tasksWithEventId) {
      const cleanTitle = task.title.replace(/^Prep for:\s*/i, '');
      const newTitle = `Prep for: ${task.event?.title || 'Unknown Event'}`;
      
      await prisma.task.update({
        where: { id: task.id },
        data: { title: newTitle }
      });
      
      console.log(`✅ Updated task: "${task.title}" → "${newTitle}"`);
    }

    // Also find events that don't have "Prep for:" but should (if they're prep events)
    const eventsWithPrepTitle = await prisma.event.findMany({
      where: {
        title: {
          startsWith: 'Prep for:'
        }
      }
    });

    console.log(`📅 Found ${eventsWithPrepTitle.length} events with "Prep for:" prefix`);

    for (const event of eventsWithPrepTitle) {
      const cleanTitle = event.title.replace(/^Prep for:\s*/i, '');
      
      await prisma.event.update({
        where: { id: event.id },
        data: { title: cleanTitle }
      });
      
      console.log(`✅ Cleaned event: "${event.title}" → "${cleanTitle}"`);
    }

    console.log('🎉 Prep prefix restoration completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Event-related tasks updated: ${tasksWithEventId.length}`);
    console.log(`   - Events cleaned: ${eventsWithPrepTitle.length}`);

  } catch (error) {
    console.error('❌ Error during restoration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the restoration
restorePrepPrefixes();
