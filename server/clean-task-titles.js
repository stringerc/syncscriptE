#!/usr/bin/env node

/**
 * Script to clean up task titles by removing "Prep for:" prefixes
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanTaskTitles() {
  try {
    console.log('🧹 Cleaning up task titles by removing "Prep for:" prefixes...');

    // Find all tasks that have "Prep for:" in their title
    const tasksWithPrepPrefix = await prisma.task.findMany({
      where: {
        title: {
          startsWith: 'Prep for:'
        }
      }
    });

    console.log(`📋 Found ${tasksWithPrepPrefix.length} tasks with "Prep for:" prefix`);

    for (const task of tasksWithPrepPrefix) {
      const cleanTitle = task.title.replace(/^Prep for:\s*/i, '');
      
      await prisma.task.update({
        where: { id: task.id },
        data: { title: cleanTitle }
      });
      
      console.log(`✅ Cleaned task: "${task.title}" → "${cleanTitle}"`);
    }

    // Also clean up any events that might have "Prep for:" prefix
    const eventsWithPrepPrefix = await prisma.event.findMany({
      where: {
        title: {
          startsWith: 'Prep for:'
        }
      }
    });

    console.log(`📅 Found ${eventsWithPrepPrefix.length} events with "Prep for:" prefix`);

    for (const event of eventsWithPrepPrefix) {
      const cleanTitle = event.title.replace(/^Prep for:\s*/i, '');
      
      await prisma.event.update({
        where: { id: event.id },
        data: { title: cleanTitle }
      });
      
      console.log(`✅ Cleaned event: "${event.title}" → "${cleanTitle}"`);
    }

    console.log('🎉 Task title cleanup completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Tasks cleaned: ${tasksWithPrepPrefix.length}`);
    console.log(`   - Events cleaned: ${eventsWithPrepPrefix.length}`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanTaskTitles();
