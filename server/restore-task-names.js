#!/usr/bin/env node

/**
 * Script to restore original task names instead of event names
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Map of event names to proper task names
const taskNameMapping = {
  "Isla's Birthday Party": [
    "Plan party decorations",
    "Order birthday cake", 
    "Create guest list",
    "Coordinate activities and entertainment",
    "Confirm venue arrangements",
    "Plan the party theme and decorations",
    "Prepare the guest list and send invitations",
    "Arrange catering or food options",
    "Organize activities and entertainment",
    "Confirm reservations and logistics with Truck and Tap"
  ],
  "Pediatrician": [
    "Prepare necessary materials",
    "Review pediatric practices", 
    "Confirm transportation arrangements",
    "Set reminders for the event",
    "Confirm event location"
  ],
  "Eat food": [
    "Set up dining area",
    "Decide on food options",
    "Set a reminder for the event", 
    "Gather necessary utensils",
    "Choose a comfortable eating environment",
    "Prepare or order food"
  ]
};

async function restoreTaskNames() {
  try {
    console.log('🔄 Restoring original task names...');

    // Get all tasks that have eventId (prep tasks)
    const prepTasks = await prisma.task.findMany({
      where: {
        eventId: {
          not: null
        }
      },
      include: {
        event: true
      }
    });

    console.log(`📋 Found ${prepTasks.length} prep tasks to restore`);

    let restoredCount = 0;

    for (const task of prepTasks) {
      const eventTitle = task.event?.title;
      
      if (eventTitle && taskNameMapping[eventTitle]) {
        // Find a task name that hasn't been used yet for this event
        const usedTaskNames = await prisma.task.findMany({
          where: {
            eventId: task.eventId,
            title: {
              in: taskNameMapping[eventTitle]
            }
          },
          select: { title: true }
        });
        
        const usedNames = usedTaskNames.map(t => t.title);
        const availableNames = taskNameMapping[eventTitle].filter(name => !usedNames.includes(name));
        
        if (availableNames.length > 0) {
          const newTaskName = availableNames[0]; // Take the first available name
          
          await prisma.task.update({
            where: { id: task.id },
            data: { title: newTaskName }
          });
          
          console.log(`✅ Restored task: "${task.title}" → "${newTaskName}" (for ${eventTitle})`);
          restoredCount++;
        } else {
          // If all names are taken, generate a generic one
          const genericName = `Prepare for ${eventTitle}`;
          await prisma.task.update({
            where: { id: task.id },
            data: { title: genericName }
          });
          
          console.log(`✅ Restored task: "${task.title}" → "${genericName}" (for ${eventTitle})`);
          restoredCount++;
        }
      } else {
        // For unknown events, create a generic prep task name
        const genericName = eventTitle ? `Prepare for ${eventTitle}` : 'Preparation task';
        await prisma.task.update({
          where: { id: task.id },
          data: { title: genericName }
        });
        
        console.log(`✅ Restored task: "${task.title}" → "${genericName}"`);
        restoredCount++;
      }
    }

    console.log('🎉 Task name restoration completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Tasks restored: ${restoredCount}`);

  } catch (error) {
    console.error('❌ Error during restoration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the restoration
restoreTaskNames();
