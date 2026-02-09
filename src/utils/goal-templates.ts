// Goal Templates for different types of trackable goals
// Used in NewGoalDialog for template-based goal creation

export interface GoalTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  category: 'Professional' | 'Personal' | 'Financial' | 'Health';
  trackingType: 'financial' | 'habit' | 'learning' | 'project' | 'custom';
  trackingFields: string[];
  suggestedMilestones: string[];
  defaultValues?: Record<string, any>;
  formFields: {
    name: string;
    label: string;
    type: 'text' | 'number' | 'currency';
    placeholder: string;
    required?: boolean;
  }[];
}

export const GOAL_TEMPLATES: Record<string, GoalTemplate[]> = {
  financial: [
    {
      id: 'emergency-fund',
      name: 'Emergency Fund',
      icon: '💵',
      description: 'Build your financial safety net',
      category: 'Financial',
      trackingType: 'financial',
      trackingFields: ['currentAmount', 'targetAmount'],
      suggestedMilestones: ['$1,000 starter fund', '$2,500 (25% saved)', '$5,000 (50% saved)', '$7,500 (75% saved)', '$10,000 goal complete'],
      defaultValues: {
        targetAmount: '$10,000',
        currentAmount: '$0'
      },
      formFields: [
        { name: 'targetAmount', label: 'Target Amount', type: 'currency', placeholder: '$10,000', required: true },
        { name: 'currentAmount', label: 'Current Amount Saved', type: 'currency', placeholder: '$0', required: false },
      ]
    },
    {
      id: 'debt-payoff',
      name: 'Pay Off Debt',
      icon: '💳',
      description: 'Eliminate debt and achieve financial freedom',
      category: 'Financial',
      trackingType: 'financial',
      trackingFields: ['currentAmount', 'targetAmount'],
      suggestedMilestones: ['Debt assessed & plan created', '25% paid off', '50% paid off', '75% paid off', 'Debt-free celebration!'],
      defaultValues: {
        targetAmount: '$5,000',
        currentAmount: '$5,000'
      },
      formFields: [
        { name: 'targetAmount', label: 'Total Debt Amount', type: 'currency', placeholder: '$5,000', required: true },
        { name: 'currentAmount', label: 'Current Debt Remaining', type: 'currency', placeholder: '$5,000', required: false },
      ]
    },
    {
      id: 'savings-goal',
      name: 'Savings Goal',
      icon: '🏦',
      description: 'Save for a specific purchase or event',
      category: 'Financial',
      trackingType: 'financial',
      trackingFields: ['currentAmount', 'targetAmount'],
      suggestedMilestones: ['25% saved', '50% saved', '75% saved', 'Goal reached'],
      defaultValues: {
        targetAmount: '$3,000',
        currentAmount: '$0'
      },
      formFields: [
        { name: 'targetAmount', label: 'Savings Target', type: 'currency', placeholder: '$3,000', required: true },
        { name: 'currentAmount', label: 'Amount Saved So Far', type: 'currency', placeholder: '$0', required: false },
      ]
    }
  ],
  health: [
    {
      id: 'workout-habit',
      name: 'Workout Routine',
      icon: '💪',
      description: 'Build a consistent exercise habit',
      category: 'Health',
      trackingType: 'habit',
      trackingFields: ['streak', 'thisWeek', 'targetWeekly'],
      suggestedMilestones: ['Complete first week', 'Hit 2-week streak', '30-day consistency', '90-day habit formed'],
      defaultValues: {
        thisWeek: 0,
        streak: 0,
        targetWeekly: 5
      },
      formFields: [
        { name: 'targetWeekly', label: 'Weekly Goal', type: 'number', placeholder: '5', required: true },
      ]
    },
    {
      id: 'meditation-habit',
      name: 'Daily Meditation',
      icon: '🧘',
      description: 'Develop a mindfulness practice',
      category: 'Health',
      trackingType: 'habit',
      trackingFields: ['streak', 'thisWeek', 'targetWeekly'],
      suggestedMilestones: ['First 7 days', '30-day streak', '60-day streak', '100-day milestone'],
      defaultValues: {
        thisWeek: 0,
        streak: 0,
        targetWeekly: 7
      },
      formFields: [
        { name: 'targetWeekly', label: 'Days Per Week', type: 'number', placeholder: '7', required: true },
      ]
    },
    {
      id: 'sleep-schedule',
      name: 'Sleep Schedule',
      icon: '😴',
      description: 'Improve sleep consistency and quality',
      category: 'Health',
      trackingType: 'habit',
      trackingFields: ['streak', 'thisWeek', 'targetWeekly'],
      suggestedMilestones: ['First week on schedule', 'Two weeks consistent', 'One month of quality sleep', 'Sleep routine established'],
      defaultValues: {
        thisWeek: 0,
        streak: 0,
        targetWeekly: 7
      },
      formFields: [
        { name: 'targetWeekly', label: 'Days Per Week', type: 'number', placeholder: '7', required: true },
      ]
    }
  ],
  learning: [
    {
      id: 'reading-goal',
      name: 'Reading Challenge',
      icon: '📚',
      description: 'Read more books this year',
      category: 'Personal',
      trackingType: 'learning',
      trackingFields: ['currentBook', 'booksRead', 'targetBooks'],
      suggestedMilestones: ['First 6 books', '12 books (halfway)', '18 books (75%)', '24 books complete'],
      defaultValues: {
        booksRead: 0,
        targetBooks: 24,
        currentBook: ''
      },
      formFields: [
        { name: 'targetBooks', label: 'Books Goal', type: 'number', placeholder: '24', required: true },
        { name: 'currentBook', label: 'Currently Reading (Optional)', type: 'text', placeholder: 'Book title...', required: false },
      ]
    },
    {
      id: 'course-completion',
      name: 'Complete Online Course',
      icon: '🎓',
      description: 'Finish an online learning program',
      category: 'Professional',
      trackingType: 'learning',
      trackingFields: ['currentModule', 'modulesCompleted', 'targetModules'],
      suggestedMilestones: ['Course started', '25% complete', '50% complete', '75% complete', 'Course finished'],
      defaultValues: {
        modulesCompleted: 0,
        targetModules: 10,
        currentModule: ''
      },
      formFields: [
        { name: 'targetModules', label: 'Total Modules/Sections', type: 'number', placeholder: '10', required: true },
        { name: 'currentModule', label: 'Current Module (Optional)', type: 'text', placeholder: 'Module name...', required: false },
      ]
    },
    {
      id: 'skill-mastery',
      name: 'Learn New Skill',
      icon: '⚡',
      description: 'Master a new professional or personal skill',
      category: 'Personal',
      trackingType: 'learning',
      trackingFields: ['hoursSpent', 'targetHours'],
      suggestedMilestones: ['10 hours practice', '25 hours practice', '50 hours practice', '100 hours mastery'],
      defaultValues: {
        hoursSpent: 0,
        targetHours: 100
      },
      formFields: [
        { name: 'targetHours', label: 'Target Practice Hours', type: 'number', placeholder: '100', required: true },
      ]
    }
  ],
  project: [
    {
      id: 'launch-product',
      name: 'Launch Project',
      icon: '🚀',
      description: 'Build and launch a new product or project',
      category: 'Professional',
      trackingType: 'project',
      trackingFields: ['milestones', 'keyResults'],
      suggestedMilestones: ['Planning & Research', 'Design Phase', 'Development', 'Testing & QA', 'Launch'],
      defaultValues: {},
      formFields: []
    },
    {
      id: 'side-business',
      name: 'Start Side Business',
      icon: '💼',
      description: 'Launch and grow a side business',
      category: 'Professional',
      trackingType: 'project',
      trackingFields: ['milestones', 'keyResults', 'revenue'],
      suggestedMilestones: ['Business plan complete', 'First sale', '$1K revenue', '$5K revenue', 'Sustainable income'],
      defaultValues: {
        revenue: '$0'
      },
      formFields: [
        { name: 'revenue', label: 'Current Revenue (Optional)', type: 'currency', placeholder: '$0', required: false },
      ]
    }
  ],
  lifestyle: [
    {
      id: 'declutter-home',
      name: 'Declutter Home',
      icon: '🏠',
      description: 'Organize and simplify your living space',
      category: 'Personal',
      trackingType: 'project',
      trackingFields: ['roomsCompleted', 'targetRooms'],
      suggestedMilestones: ['Bedroom organized', 'Kitchen decluttered', 'Living room done', 'All rooms complete'],
      defaultValues: {
        roomsCompleted: 0,
        targetRooms: 4
      },
      formFields: [
        { name: 'targetRooms', label: 'Number of Rooms/Areas', type: 'number', placeholder: '4', required: true },
      ]
    },
    {
      id: 'travel-goal',
      name: 'Travel Adventure',
      icon: '✈️',
      description: 'Visit new places and create memories',
      category: 'Personal',
      trackingType: 'learning',
      trackingFields: ['placesVisited', 'targetPlaces'],
      suggestedMilestones: ['Trip planned', 'Tickets booked', 'Accommodations set', 'Adventure complete'],
      defaultValues: {
        placesVisited: 0,
        targetPlaces: 3
      },
      formFields: [
        { name: 'targetPlaces', label: 'Places to Visit', type: 'number', placeholder: '3', required: true },
      ]
    }
  ]
};

// Helper function to get all templates as a flat array
export function getAllTemplates(): GoalTemplate[] {
  return Object.values(GOAL_TEMPLATES).flat();
}

// Helper function to get template by ID
export function getTemplateById(id: string): GoalTemplate | undefined {
  return getAllTemplates().find(template => template.id === id);
}

// Template categories for UI display
export const TEMPLATE_CATEGORIES = [
  { id: 'financial', name: 'Financial', icon: '💰', color: 'emerald' },
  { id: 'health', name: 'Health & Wellness', icon: '❤️', color: 'rose' },
  { id: 'learning', name: 'Learning & Growth', icon: '📚', color: 'blue' },
  { id: 'project', name: 'Projects', icon: '🚀', color: 'purple' },
  { id: 'lifestyle', name: 'Lifestyle', icon: '🎯', color: 'amber' },
];
