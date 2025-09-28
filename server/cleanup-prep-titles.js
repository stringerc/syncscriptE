#!/usr/bin/env node

/**
 * Script to clean up "Prep for:" prefixes from existing task and event titles in the database
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function cleanupPrepTitles() {
  try {
    console.log('🧹 Starting cleanup of "Prep for:" prefixes...');

    // Get all tasks with "Prep for:" prefixes and update them individually
    const tasksWithPrep = await prisma.task.findMany({
      where: {
        title: {
          startsWith: 'Prep for:'
        }
      }
    });

    console.log(`📋 Found ${tasksWithPrep.length} tasks with "Prep for:" prefixes`);

    for (const task of tasksWithPrep) {
      const cleanTitle = task.title.replace(/^Prep for:\s*/i, '');
      await prisma.task.update({
        where: { id: task.id },
        data: { title: cleanTitle }
      });
      console.log(`✅ Cleaned task: "${task.title}" → "${cleanTitle}"`);
    }

    // Clean up Event titles
    const eventsWithPrep = await prisma.event.findMany({
      where: {
        title: {
          startsWith: 'Prep for:'
        }
      }
    });

    console.log(`📅 Found ${eventsWithPrep.length} events with "Prep for:" prefixes`);

    for (const event of eventsWithPrep) {
      const cleanTitle = event.title.replace(/^Prep for:\s*/i, '');
      await prisma.event.update({
        where: { id: event.id },
        data: { title: cleanTitle }
      });
      console.log(`✅ Cleaned event: "${event.title}" → "${cleanTitle}"`);
    }

    console.log('🎉 Cleanup completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Tasks cleaned: ${tasksWithPrep.length}`);
    console.log(`   - Events cleaned: ${eventsWithPrep.length}`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupPrepTitles();
