import { PrismaClient } from '@prisma/client';
import { NotificationType } from '../src/types';

const prisma = new PrismaClient();

async function createSampleNotifications() {
  console.log('🎯 Creating sample notifications...');

  // Get the first user
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log('❌ No users found. Please create a user first.');
    return;
  }

  console.log(`📧 Creating notifications for user: ${user.email}`);

  const sampleNotifications = [
    {
      type: NotificationType.TASK_REMINDER,
      title: 'Task Due Soon',
      message: 'Your task "Complete project proposal" is due in 2 hours.',
      isRead: false,
      actionUrl: '/tasks',
      metadata: { taskId: 'sample-task-1', priority: 'high' }
    },
    {
      type: NotificationType.ACHIEVEMENT_UNLOCKED,
      title: 'Achievement Unlocked! 🏆',
      message: 'Congratulations! You\'ve completed 10 tasks this week.',
      isRead: false,
      actionUrl: '/achievements',
      metadata: { 
        achievement: {
          title: 'Task Master',
          description: 'Complete 10 tasks in a week',
          points: 50,
          icon: '🎯'
        }
      }
    },
    {
      type: NotificationType.ENERGY_ADAPTATION,
      title: 'Energy Level Updated',
      message: 'Your energy level has increased to 8/10 after completing your morning routine.',
      isRead: true,
      actionUrl: '/energy-analysis',
      metadata: { energyLevel: 8, previousLevel: 6 }
    },
    {
      type: NotificationType.WEATHER_ALERT,
      title: 'Weather Alert',
      message: 'Rain expected for your outdoor event tomorrow. Consider indoor alternatives.',
      isRead: false,
      actionUrl: '/calendar',
      metadata: { eventId: 'sample-event-1', weather: 'rain' }
    },
    {
      type: NotificationType.GENERAL,
      title: 'Welcome to SyncScript!',
      message: 'Thanks for joining us. Start by completing your first task or setting up your calendar.',
      isRead: true,
      actionUrl: '/dashboard',
      metadata: { type: 'welcome' }
    },
    {
      type: NotificationType.BUDGET_ALERT,
      title: 'Budget Alert',
      message: 'You\'ve spent 80% of your monthly budget. Consider reviewing your expenses.',
      isRead: false,
      actionUrl: '/financial',
      metadata: { spent: 800, budget: 1000, percentage: 80 }
    },
    {
      type: NotificationType.SCHEDULE_CONFLICT,
      title: 'Schedule Conflict Detected',
      message: 'Your meeting at 2 PM conflicts with your focus time. Consider rescheduling.',
      isRead: false,
      actionUrl: '/calendar',
      metadata: { 
        conflictingEvents: [
          { id: 'event-1', title: 'Team Meeting', time: '2:00 PM' },
          { id: 'event-2', title: 'Focus Time', time: '2:00 PM' }
        ]
      }
    }
  ];

  let createdCount = 0;
  for (const notification of sampleNotifications) {
    try {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          isRead: notification.isRead,
          actionUrl: notification.actionUrl,
          metadata: JSON.stringify(notification.metadata),
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random time within last week
        }
      });
      createdCount++;
      console.log(`✅ Created: ${notification.title}`);
    } catch (error) {
      console.error(`❌ Failed to create notification: ${notification.title}`, error);
    }
  }

  console.log(`\n🎉 Successfully created ${createdCount} sample notifications!`);
  console.log('📱 Check your notifications page to see them.');

  await prisma.$disconnect();
}

createSampleNotifications().catch(e => {
  console.error(e);
  process.exit(1);
});
