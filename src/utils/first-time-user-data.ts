/**
 * FIRST-TIME USER SAMPLE DATA GENERATOR
 * 
 * Research-backed approach: Show users what's possible BEFORE asking them to work
 * - Superhuman: Pre-populates inbox with sample emails
 * - Notion: Shows template examples on first load
 * - Linear: Creates sample issues to demonstrate features
 * 
 * This generates realistic sample data that:
 * 1. Shows completed progress (Endowed Progress Effect - Nunes & Drèze 2006)
 * 2. Demonstrates all key features
 * 3. Creates FOMO ("I want MY data to look this good!")
 * 4. Provides clear path to first action
 */

export interface SampleEnergyLog {
  id: string;
  timestamp: string;
  level: number;
  note?: string;
  isSample: true;
}

export interface SampleScript {
  id: string;
  name: string;
  description: string;
  trigger: string;
  status: 'sample';
  icon: string;
}

export interface SampleAchievement {
  id: string;
  name: string;
  description: string;
  progress: number; // 0-100
  threshold: number;
  unlocked: false;
  icon: string;
}

export interface SampleData {
  energyLogs: SampleEnergyLog[];
  roygbivProgress: number; // 0.0 - 1.0 (we'll show 0.4 = Orange level)
  currentEnergyLevel: number;
  achievements: SampleAchievement[];
  scripts: SampleScript[];
  aiSuggestions: string[];
  stats: {
    avgEnergy: number;
    bestDay: string;
    streak: number;
    totalLogs: number;
  };
}

/**
 * Generate 7 days of sample energy data
 * Pattern: Shows realistic energy fluctuations with peaks in AM/mid-afternoon
 */
export function generateSampleEnergyLogs(): SampleEnergyLog[] {
  const logs: SampleEnergyLog[] = [];
  const now = new Date();
  
  // Generate 7 days of data (3 logs per day = 21 total)
  for (let day = 6; day >= 0; day--) {
    const date = new Date(now);
    date.setDate(date.getDate() - day);
    
    // Morning log (7-9 AM) - Usually moderate energy
    const morningHour = 7 + Math.floor(Math.random() * 2);
    logs.push({
      id: `sample-${day}-morning`,
      timestamp: new Date(date.setHours(morningHour, 0, 0, 0)).toISOString(),
      level: 5 + Math.floor(Math.random() * 3), // 5-7
      note: day === 0 ? 'Morning coffee ☕' : undefined,
      isSample: true
    });
    
    // Mid-day log (11 AM - 1 PM) - Peak energy
    const middayHour = 11 + Math.floor(Math.random() * 2);
    logs.push({
      id: `sample-${day}-midday`,
      timestamp: new Date(date.setHours(middayHour, 0, 0, 0)).toISOString(),
      level: 7 + Math.floor(Math.random() * 3), // 7-9
      note: day === 1 ? 'Post-workout energy! 💪' : undefined,
      isSample: true
    });
    
    // Afternoon log (3-5 PM) - Lower energy
    const afternoonHour = 15 + Math.floor(Math.random() * 2);
    logs.push({
      id: `sample-${day}-afternoon`,
      timestamp: new Date(date.setHours(afternoonHour, 0, 0, 0)).toISOString(),
      level: 4 + Math.floor(Math.random() * 3), // 4-6
      note: day === 2 ? 'Need a break 😴' : undefined,
      isSample: true
    });
  }
  
  return logs.sort((a, b) => 
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

/**
 * Generate sample scripts showing automation possibilities
 */
export function generateSampleScripts(): SampleScript[] {
  return [
    {
      id: 'sample-morning-routine',
      name: 'Morning Routine',
      description: 'Auto-trigger at 8 AM: Review today\'s tasks, check calendar, plan priorities',
      trigger: 'Time: 8:00 AM',
      status: 'sample',
      icon: '☀️'
    },
    {
      id: 'sample-focus-time',
      name: 'Focus Time',
      description: 'When energy ≥ 8: Block calendar, enable Do Not Disturb, start deep work timer',
      trigger: 'Energy ≥ 8',
      status: 'sample',
      icon: '🎯'
    },
    {
      id: 'sample-afternoon-break',
      name: 'Afternoon Break',
      description: 'When energy ≤ 4: Suggest 15-min walk, hydration reminder, stretch exercises',
      trigger: 'Energy ≤ 4',
      status: 'sample',
      icon: '🚶'
    }
  ];
}

/**
 * Generate sample achievements showing gamification
 * Progress set to 70-90% to create "almost there!" motivation
 */
export function generateSampleAchievements(): SampleAchievement[] {
  return [
    {
      id: 'sample-first-log',
      name: 'First Energy Log',
      description: 'Log your first energy level',
      progress: 95, // Almost unlocked!
      threshold: 1,
      unlocked: false,
      icon: '🎯'
    },
    {
      id: 'sample-week-streak',
      name: '7-Day Streak',
      description: 'Log energy for 7 days in a row',
      progress: 85, // 6/7 days
      threshold: 7,
      unlocked: false,
      icon: '🔥'
    },
    {
      id: 'sample-first-script',
      name: 'Automation Master',
      description: 'Create your first script',
      progress: 80,
      threshold: 1,
      unlocked: false,
      icon: '⚡'
    },
    {
      id: 'sample-roygbiv-red',
      name: 'Red Loop Master',
      description: 'Complete the Red level of ROYGBIV',
      progress: 100, // This one is "done" to show what completion looks like
      threshold: 1,
      unlocked: false,
      icon: '🔴'
    },
    {
      id: 'sample-roygbiv-orange',
      name: 'Orange Loop Master',
      description: 'Complete the Orange level of ROYGBIV',
      progress: 75, // Currently working on this
      threshold: 1,
      unlocked: false,
      icon: '🟠'
    }
  ];
}

/**
 * Generate AI suggestions based on current energy level
 * These adapt to show relevant suggestions for the user's state
 */
export function generateAISuggestions(currentEnergy: number = 7): string[] {
  if (currentEnergy >= 8) {
    // High energy - suggest challenging tasks
    return [
      '🎯 Perfect time for deep work! Your energy is high.',
      '💡 Tackle that complex problem you\'ve been postponing.',
      '✍️ Great time for creative brainstorming or writing.',
      '📊 Review and plan your week while you\'re focused.'
    ];
  } else if (currentEnergy >= 5) {
    // Moderate energy - suggest balanced tasks
    return [
      '📧 Good time to catch up on emails and messages.',
      '🤝 Schedule meetings or collaborative work.',
      '📋 Organize your tasks and clean up your workspace.',
      '📚 Review documentation or learn something new.'
    ];
  } else {
    // Low energy - suggest restorative activities
    return [
      '🚶 Take a 15-minute walk to recharge.',
      '💧 Hydration check! Grab some water.',
      '🧘 Try a 5-minute meditation or stretch break.',
      '☕ Maybe it\'s time for a coffee or healthy snack.'
    ];
  }
}

/**
 * Main function to generate complete sample data set
 */
export function generateFirstTimeUserData(): SampleData {
  const energyLogs = generateSampleEnergyLogs();
  const currentEnergy = 7; // Start with moderate-high energy
  
  // Calculate average energy from sample logs
  const avgEnergy = Math.round(
    energyLogs.reduce((sum, log) => sum + log.level, 0) / energyLogs.length
  );
  
  return {
    energyLogs,
    roygbivProgress: 0.4, // 40% through Orange level (2nd of 7 colors)
    currentEnergyLevel: currentEnergy,
    achievements: generateSampleAchievements(),
    scripts: generateSampleScripts(),
    aiSuggestions: generateAISuggestions(currentEnergy),
    stats: {
      avgEnergy,
      bestDay: 'Yesterday', // The most recent day in sample data
      streak: 6, // 6 days of sample logging (creates FOMO for day 7!)
      totalLogs: energyLogs.length
    }
  };
}

/**
 * Helper to check if data is sample data
 */
export function isSampleData(item: any): boolean {
  return item?.isSample === true || item?.status === 'sample';
}

/**
 * Helper to get appropriate badge/indicator for sample data
 */
export function getSampleDataBadge() {
  return {
    label: 'SAMPLE DATA',
    description: 'Your real data starts when you log your first energy level',
    color: 'bg-indigo-500/20 text-indigo-300 border-indigo-400/30'
  };
}

/**
 * Helper to get encouragement message based on onboarding step
 */
export function getOnboardingMessage(step: number): {
  title: string;
  message: string;
  action: string;
} {
  const messages = [
    {
      title: 'Welcome to SyncScript! 🎉',
      message: 'This is a demo showing what\'s possible. Your real journey starts when you log your first energy level.',
      action: 'Log Your Energy'
    },
    {
      title: 'Great start! ⚡',
      message: 'You logged your first energy! The AI is already learning your patterns. Try logging again later today.',
      action: 'Explore Dashboard'
    },
    {
      title: 'You\'re on a roll! 🔥',
      message: 'Keep logging your energy 2-3 times per day. Within a week, you\'ll see personalized patterns emerge.',
      action: 'Create a Script'
    },
    {
      title: 'Power user unlocked! 💪',
      message: 'You\'ve created your first script! Now your tasks will automate based on your energy levels.',
      action: 'View AI Insights'
    },
    {
      title: 'Almost there! 🌟',
      message: 'You\'re crushing it! Keep up the energy logging to unlock advanced AI predictions.',
      action: 'Check Achievements'
    },
    {
      title: 'You\'re a pro! 🏆',
      message: 'You\'ve mastered the basics. Explore advanced features in Settings.',
      action: 'View All Features'
    }
  ];
  
  return messages[Math.min(step, messages.length - 1)];
}

/**
 * Storage keys for first-time user state
 */
export const FIRST_TIME_USER_KEYS = {
  HAS_SEEN_WELCOME: 'syncscript_has_seen_welcome',
  CURRENT_TOOLTIP: 'syncscript_current_tooltip',
  DISMISSED_TOOLTIPS: 'syncscript_dismissed_tooltips',
  SAMPLE_DATA_SHOWN: 'syncscript_sample_data_shown'
};

/**
 * Helper to manage first-time user state in localStorage
 */
export const firstTimeUserState = {
  hasSeenWelcome: (): boolean => {
    return localStorage.getItem(FIRST_TIME_USER_KEYS.HAS_SEEN_WELCOME) === 'true';
  },
  
  markWelcomeSeen: (): void => {
    localStorage.setItem(FIRST_TIME_USER_KEYS.HAS_SEEN_WELCOME, 'true');
  },
  
  getCurrentTooltipStep: (): number => {
    return parseInt(localStorage.getItem(FIRST_TIME_USER_KEYS.CURRENT_TOOLTIP) || '0', 10);
  },
  
  setTooltipStep: (step: number): void => {
    localStorage.setItem(FIRST_TIME_USER_KEYS.CURRENT_TOOLTIP, step.toString());
  },
  
  hasSeenSampleData: (): boolean => {
    return localStorage.getItem(FIRST_TIME_USER_KEYS.SAMPLE_DATA_SHOWN) === 'true';
  },
  
  markSampleDataSeen: (): void => {
    localStorage.setItem(FIRST_TIME_USER_KEYS.SAMPLE_DATA_SHOWN, 'true');
  },
  
  reset: (): void => {
    Object.values(FIRST_TIME_USER_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }
};
