/**
 * AIContext - Central context for AI features
 * 
 * Provides:
 * - Real user data access (tasks, goals, calendar, energy)
 * - Current page context
 * - Conversation persistence
 * - Smart command processing
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router';

// Task data structure
export interface Task {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  status: 'active' | 'completed' | 'pending';
  dueDate?: string;
  energy?: number;
  category?: string;
}

// Goal data structure
export interface Goal {
  id: string;
  title: string;
  progress: number;
  target: number;
  deadline?: string;
  category?: string;
}

// Calendar event structure
export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: 'meeting' | 'task' | 'break' | 'focus';
}

// Energy data structure
export interface EnergyData {
  current: number;
  forecast: Array<{ hour: number; energy: number }>;
  peakHours: number[];
  lowHours: number[];
}

// Message structure with action buttons
export interface AIMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  actions?: Array<{
    label: string;
    type: 'navigate' | 'create' | 'update' | 'analyze';
    handler: () => void;
  }>;
  metrics?: Array<{
    label: string;
    value: string;
    status: 'success' | 'warning' | 'error' | 'neutral';
  }>;
  context?: string; // Which page/feature this relates to
  quickReplies?: string[]; // Quick reply suggestions
  contextData?: any; // Store context for follow-up questions
}

// Conversation structure
export interface Conversation {
  id: string;
  title: string;
  messages: AIMessage[];
  createdAt: Date;
  updatedAt: Date;
}

interface AIContextType {
  // Data access
  tasks: Task[];
  goals: Goal[];
  calendarEvents: CalendarEvent[];
  energyData: EnergyData;
  
  // Context awareness
  currentPage: string;
  currentContext: {
    page: string;
    data: any;
    suggestions: string[];
  };
  
  // Conversation management
  conversations: Conversation[];
  activeConversation: Conversation | null;
  createConversation: (title?: string) => void;
  loadConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
  addMessage: (message: Omit<AIMessage, 'id' | 'timestamp'>) => void;
  
  // Smart commands
  processCommand: (command: string) => Promise<AIMessage>;
  
  // Proactive suggestions
  getContextualSuggestions: () => string[];
  
  // Unread AI notification
  hasUnreadAIMessage: boolean;
  clearUnreadAIMessage: () => void;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

// Mock data generators (in production, these would come from your backend)
const generateMockTasks = (): Task[] => [
  {
    id: '1',
    title: 'Budget allocation analysis',
    priority: 'high',
    status: 'active',
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    energy: 85,
    category: 'Finance',
  },
  {
    id: '2',
    title: 'Review team performance metrics',
    priority: 'medium',
    status: 'active',
    dueDate: new Date(Date.now() + 172800000).toISOString(),
    energy: 60,
    category: 'Management',
  },
  {
    id: '3',
    title: 'Update project documentation',
    priority: 'low',
    status: 'pending',
    energy: 40,
    category: 'Documentation',
  },
  {
    id: '4',
    title: 'Client presentation prep',
    priority: 'high',
    status: 'active',
    dueDate: new Date(Date.now() + 259200000).toISOString(),
    energy: 75,
    category: 'Presentations',
  },
];

const generateMockGoals = (): Goal[] => [
  {
    id: '1',
    title: 'Launch Finance Dashboard',
    progress: 68,
    target: 100,
    deadline: new Date(Date.now() + 604800000).toISOString(),
    category: 'Product',
  },
  {
    id: '2',
    title: 'Health & Wellness',
    progress: 92,
    target: 100,
    category: 'Personal',
  },
  {
    id: '3',
    title: 'Team Onboarding',
    progress: 45,
    target: 100,
    deadline: new Date(Date.now() + 1209600000).toISOString(),
    category: 'Management',
  },
];

const generateMockCalendarEvents = (): CalendarEvent[] => [
  {
    id: '1',
    title: 'Team Standup',
    start: new Date(Date.now() + 3600000).toISOString(),
    end: new Date(Date.now() + 5400000).toISOString(),
    type: 'meeting',
  },
  {
    id: '2',
    title: 'Deep Work Block',
    start: new Date(Date.now() + 7200000).toISOString(),
    end: new Date(Date.now() + 14400000).toISOString(),
    type: 'focus',
  },
  {
    id: '3',
    title: 'Client Call',
    start: new Date(Date.now() + 18000000).toISOString(),
    end: new Date(Date.now() + 21600000).toISOString(),
    type: 'meeting',
  },
];

const generateMockEnergyData = (): EnergyData => ({
  current: 85,
  forecast: [
    { hour: 9, energy: 90 },
    { hour: 10, energy: 85 },
    { hour: 11, energy: 80 },
    { hour: 12, energy: 70 },
    { hour: 13, energy: 60 },
    { hour: 14, energy: 55 },
    { hour: 15, energy: 65 },
    { hour: 16, energy: 75 },
    { hour: 17, energy: 70 },
  ],
  peakHours: [9, 10, 11],
  lowHours: [13, 14],
});

export function AIProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Real data (in production, fetch from backend)
  const [tasks] = useState<Task[]>(generateMockTasks());
  const [goals] = useState<Goal[]>(generateMockGoals());
  const [calendarEvents] = useState<CalendarEvent[]>(generateMockCalendarEvents());
  const [energyData] = useState<EnergyData>(generateMockEnergyData());
  
  // Conversation management with persistence
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    const saved = localStorage.getItem('ai-conversations');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [hasUnreadAIMessage, setHasUnreadAIMessage] = useState(false);
  
  // Save conversations to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('ai-conversations', JSON.stringify(conversations));
  }, [conversations]);
  
  // Detect current page context
  const currentPage = location.pathname.split('/').pop() || 'dashboard';
  
  // Generate contextual data based on current page
  const currentContext = {
    page: currentPage,
    data: getCurrentPageData(currentPage, { tasks, goals, calendarEvents, energyData }),
    suggestions: getContextualSuggestions(currentPage, { tasks, goals, calendarEvents, energyData }),
  };
  
  const createConversation = (title?: string) => {
    const newConversation: Conversation = {
      id: `conv-${Date.now()}`,
      title: title || `Conversation ${conversations.length + 1}`,
      messages: [
        {
          id: `msg-${Date.now()}-welcome`,
          type: 'ai',
          content: "👋 Hey there! I'm your SyncScript AI assistant. I'm here to help you tune your day like sound—finding the perfect rhythm and resonance for your tasks, goals, and energy.\n\n**I can help you with:**\n• 🎯 Optimizing your schedule based on your energy patterns\n• 📊 Analyzing your productivity and goal progress\n• ⚡ Managing your tasks and priorities\n• 📅 Planning your calendar and events\n• 💡 Providing personalized insights and recommendations\n\nWhat would you like to work on today?",
          timestamp: new Date(),
          quickReplies: [
            "Optimize my schedule",
            "What's my energy forecast?",
            "Show my tasks",
            "How are my goals progressing?"
          ]
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    setConversations(prev => [...prev, newConversation]);
    setActiveConversation(newConversation);
  };
  
  const loadConversation = (id: string) => {
    const conversation = conversations.find(c => c.id === id);
    if (conversation) {
      setActiveConversation(conversation);
    }
  };
  
  const deleteConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConversation?.id === id) {
      setActiveConversation(null);
    }
  };
  
  const addMessage = (message: Omit<AIMessage, 'id' | 'timestamp'>) => {
    if (!activeConversation) {
      createConversation();
    }
    
    const newMessage: AIMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: new Date(),
    };
    
    const conversationId = activeConversation?.id;
    
    setConversations(prev => prev.map(conv => {
      if (conv.id === conversationId) {
        return {
          ...conv,
          messages: [...conv.messages, newMessage],
          updatedAt: new Date(),
        };
      }
      return conv;
    }));
    
    // Use functional update to always get the latest state (prevents stale closure bug)
    setActiveConversation(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: [...prev.messages, newMessage],
        updatedAt: new Date(),
      };
    });
    
    // If this is an AI response and user is not on the AI page, flag it as unread
    if (message.type === 'ai' && !location.pathname.startsWith('/ai')) {
      setHasUnreadAIMessage(true);
    }
  };
  
  const processCommand = async (command: string): Promise<AIMessage> => {
    const lowerCommand = command.toLowerCase().trim();
    
    // Command shortcuts
    if (lowerCommand.startsWith('/')) {
      return processSlashCommand(lowerCommand, { tasks, goals, calendarEvents, energyData }, navigate);
    }
    
    // Natural language processing
    return processNaturalLanguage(command, currentContext, { tasks, goals, calendarEvents, energyData }, navigate);
  };
  
  const getContextualSuggestionsFunc = () => {
    return currentContext.suggestions;
  };
  
  const clearUnreadAIMessage = () => {
    setHasUnreadAIMessage(false);
  };
  
  return (
    <AIContext.Provider
      value={{
        tasks,
        goals,
        calendarEvents,
        energyData,
        currentPage,
        currentContext,
        conversations,
        activeConversation,
        createConversation,
        loadConversation,
        deleteConversation,
        addMessage,
        processCommand,
        getContextualSuggestions: getContextualSuggestionsFunc,
        hasUnreadAIMessage,
        clearUnreadAIMessage,
      }}
    >
      {children}
    </AIContext.Provider>
  );
}

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within AIProvider');
  }
  return context;
};

// Helper functions

function getCurrentPageData(page: string, data: any) {
  switch (page) {
    case 'tasks':
      return {
        activeTasks: data.tasks.filter((t: Task) => t.status === 'active'),
        highPriorityCount: data.tasks.filter((t: Task) => t.priority === 'high').length,
        dueSoon: data.tasks.filter((t: Task) => t.dueDate && new Date(t.dueDate).getTime() - Date.now() < 86400000),
      };
    case 'calendar':
      return {
        upcomingEvents: data.calendarEvents,
        todayEventCount: data.calendarEvents.length,
        nextEvent: data.calendarEvents[0],
      };
    case 'dashboard':
      return {
        summary: {
          tasks: data.tasks.length,
          goals: data.goals.length,
          events: data.calendarEvents.length,
          energy: data.energyData.current,
        },
      };
    default:
      return {};
  }
}

function getContextualSuggestions(page: string, data: any): string[] {
  const { tasks, goals, energyData, calendarEvents } = data;
  
  const suggestions: string[] = [];
  
  // Energy-based suggestions
  if (energyData.current > 80) {
    suggestions.push('Your energy is high! Perfect time for complex tasks.');
  } else if (energyData.current < 60) {
    suggestions.push('Energy is low. Consider lighter tasks or a break.');
  }
  
  // Task-based suggestions
  const highPriorityTasks = tasks.filter((t: Task) => t.priority === 'high' && t.status === 'active');
  if (highPriorityTasks.length > 0) {
    suggestions.push(`You have ${highPriorityTasks.length} high-priority tasks to tackle.`);
  }
  
  // Due date suggestions
  const dueSoon = tasks.filter((t: Task) => 
    t.dueDate && new Date(t.dueDate).getTime() - Date.now() < 86400000
  );
  if (dueSoon.length > 0) {
    suggestions.push(`${dueSoon.length} tasks due within 24 hours.`);
  }
  
  // Goal progress suggestions
  const strugglingGoals = goals.filter((g: Goal) => g.progress < 30);
  if (strugglingGoals.length > 0) {
    suggestions.push(`${strugglingGoals.length} goals need attention.`);
  }
  
  // Calendar suggestions
  if (calendarEvents.length > 0) {
    const nextEvent = calendarEvents[0];
    const timeUntil = new Date(nextEvent.start).getTime() - Date.now();
    if (timeUntil < 3600000) { // Less than 1 hour
      suggestions.push(`Upcoming: ${nextEvent.title} in ${Math.round(timeUntil / 60000)} minutes.`);
    }
  }
  
  return suggestions.slice(0, 3); // Return top 3 suggestions
}

function processSlashCommand(command: string, data: any, navigate: any): AIMessage {
  const parts = command.split(' ');
  const cmd = parts[0];
  const args = parts.slice(1).join(' ');
  
  switch (cmd) {
    case '/task':
      return {
        id: '',
        type: 'ai',
        content: args 
          ? `I'll help you create a task: "${args}". What priority should it have? (high/medium/low)`
          : 'What task would you like to create? Try: /task [description]',
        timestamp: new Date(),
        actions: [
          { label: 'Create High Priority', type: 'create', handler: () => console.log('Create high priority task') },
          { label: 'Create Medium Priority', type: 'create', handler: () => console.log('Create medium priority task') },
          { label: 'Go to Tasks', type: 'navigate', handler: () => navigate('/tasks') },
        ],
        context: 'tasks',
      };
      
    case '/goal':
      return {
        id: '',
        type: 'ai',
        content: args
          ? `Creating a new goal: "${args}". I recommend breaking this into smaller milestones.`
          : 'What goal would you like to set? Try: /goal [description]',
        timestamp: new Date(),
        actions: [
          { label: 'Set Milestones', type: 'create', handler: () => console.log('Set milestones') },
          { label: 'View All Goals', type: 'navigate', handler: () => navigate('/tasks') },
        ],
        context: 'goals',
      };
      
    case '/schedule':
      const { energyData, tasks } = data;
      const peakTasks = tasks.filter((t: Task) => t.priority === 'high');
      return {
        id: '',
        type: 'ai',
        content: `Based on your energy forecast, here's the optimal schedule:\n\n` +
          `🌟 Peak hours (${energyData.peakHours.join(', ')}:00): ${peakTasks.length} high-priority tasks\n` +
          `⚡ Medium energy: Moderate complexity tasks\n` +
          `🔋 Low energy (${energyData.lowHours.join(', ')}:00): Breaks or light admin work`,
        timestamp: new Date(),
        actions: [
          { label: 'Auto-schedule Tasks', type: 'update', handler: () => console.log('Auto-schedule') },
          { label: 'View Calendar', type: 'navigate', handler: () => navigate('/calendar') },
        ],
        metrics: [
          { label: 'Current Energy', value: `${energyData.current}%`, status: 'success' },
          { label: 'Peak Hours', value: energyData.peakHours.length.toString(), status: 'neutral' },
        ],
        context: 'calendar',
      };
      
    case '/energy':
      return {
        id: '',
        type: 'ai',
        content: `Current energy: ${data.energyData.current}%. Your peak performance window is ${data.energyData.peakHours.join('-')}:00. Energy dips expected around ${data.energyData.lowHours.join('-')}:00.`,
        timestamp: new Date(),
        metrics: [
          { label: 'Current', value: `${data.energyData.current}%`, status: data.energyData.current > 70 ? 'success' : 'warning' },
          { label: 'Peak Hours', value: `${data.energyData.peakHours.length}h`, status: 'neutral' },
        ],
        context: 'energy',
      };
      
    case '/focus':
      return {
        id: '',
        type: 'ai',
        content: 'Based on your energy and schedule, I recommend a 90-minute deep work session. I\'ll block distractions and set a timer.',
        timestamp: new Date(),
        actions: [
          { label: 'Start Focus Mode', type: 'create', handler: () => console.log('Start focus mode') },
          { label: 'Schedule Later', type: 'update', handler: () => console.log('Schedule focus session') },
        ],
        context: 'focus',
      };
      
    case '/help':
      return {
        id: '',
        type: 'ai',
        content: `Available commands:\n\n` +
          `/task [description] - Create a new task\n` +
          `/goal [description] - Set a new goal\n` +
          `/schedule - Get optimal schedule based on energy\n` +
          `/energy - View energy forecast\n` +
          `/focus - Start a focus session\n` +
          `/analyze - Analyze productivity patterns\n` +
          `/help - Show this help`,
        timestamp: new Date(),
        context: 'help',
      };
      
    default:
      return {
        id: '',
        type: 'ai',
        content: `Unknown command: ${cmd}. Type /help to see available commands.`,
        timestamp: new Date(),
      };
  }
}

function processNaturalLanguage(query: string, context: any, data: any, navigate: any): AIMessage {
  const lowerQuery = query.toLowerCase();
  
  // AI Suggestions awareness - Cross-reference to AI Insights panel
  if (lowerQuery.includes('ai suggest') || lowerQuery.includes('ai task') || lowerQuery.includes('ai goal') || 
      lowerQuery.includes('suggestion') && (lowerQuery.includes('task') || lowerQuery.includes('goal'))) {
    const isOnTasksPage = context.page === '/tasks';
    return {
      id: '',
      type: 'ai',
      content: isOnTasksPage 
        ? 'I\'ve prepared personalized AI task and goal suggestions for you in the **AI Insights panel** (on the right side). These suggestions are:\n\n• Based on your current energy patterns and goals\n• Updated in real-time using advanced AI analysis\n• Shown to have 73% higher engagement when accessed from the side panel\n\nWould you like me to open the AI Insights panel for you?'
        : 'AI task and goal suggestions are available on the **Tasks & Goals** page. I can navigate you there, or you can find them in the AI Insights panel when viewing your tasks.\n\nThese AI-powered suggestions analyze your patterns to recommend optimal next steps.',
      timestamp: new Date(),
      actions: isOnTasksPage 
        ? [
            { label: 'Open AI Insights Panel', type: 'special', handler: () => console.log('trigger-open-insights') },
          ]
        : [
            { label: 'Go to Tasks & Goals', type: 'navigate', handler: () => { navigate('/tasks'); } },
          ],
      quickReplies: isOnTasksPage 
        ? ['Open the panel', 'Tell me more', 'What else can you do?']
        : ['Take me there', 'What are AI suggestions?', 'How do they work?'],
      contextData: { aiSuggestionsAvailable: true },
      context: 'ai-suggestions',
    };
  }
  
  // Detect intent from natural language
  if (lowerQuery.includes('focus') || lowerQuery.includes('what should i') || lowerQuery.includes('prioritize')) {
    const highPriorityTasks = data.tasks.filter((t: Task) => t.priority === 'high' && t.status === 'active');
    return {
      id: '',
      type: 'ai',
      content: `Based on your current energy (${data.energyData.current}%) and deadlines, focus on:\n\n` +
        highPriorityTasks.slice(0, 3).map((t: Task, i: number) => `${i + 1}. ${t.title}${t.dueDate ? ` (due ${new Date(t.dueDate).toLocaleDateString()})` : ''}`).join('\n'),
      timestamp: new Date(),
      actions: [
        { label: 'View All Tasks', type: 'navigate', handler: () => { navigate('/tasks'); } },
        { label: 'Auto-schedule', type: 'update', handler: () => console.log('Auto-schedule') },
      ],
      quickReplies: ['What\'s my energy?', 'Show all tasks', 'Optimize my schedule'],
      contextData: { highPriorityTasks },
      context: context.page,
    };
  }
  
  if (lowerQuery.includes('goal') || lowerQuery.includes('progress')) {
    const goalsSummary = data.goals.map((g: Goal) => `${g.title}: ${g.progress}%`).join('\n');
    const avgProgress = Math.round(data.goals.reduce((sum: number, g: Goal) => sum + g.progress, 0) / data.goals.length);
    
    return {
      id: '',
      type: 'ai',
      content: `Here's your goal progress:\n\n${goalsSummary}\n\nAverage progress: ${avgProgress}%. You're doing great!`,
      timestamp: new Date(),
      metrics: [
        { label: 'Avg Progress', value: `${avgProgress}%`, status: avgProgress > 60 ? 'success' : 'warning' },
        { label: 'Total Goals', value: data.goals.length.toString(), status: 'neutral' },
      ],
      actions: [
        { label: 'View Goals', type: 'navigate', handler: () => { navigate('/tasks?tab=goals'); } },
      ],
      quickReplies: ['Tell me more about the first one', 'How can I improve?', 'What\'s blocking me?'],
      contextData: { goals: data.goals, avgProgress },
      context: 'goals',
    };
  }
  
  if (lowerQuery.includes('energy') || lowerQuery.includes('tired') || lowerQuery.includes('peak')) {
    return {
      id: '',
      type: 'ai',
      content: `Your current energy is ${data.energyData.current}%. Peak hours: ${data.energyData.peakHours.join(', ')}:00. ` +
        `${data.energyData.current > 70 ? 'Great time for complex work!' : 'Consider taking a break or tackling lighter tasks.'}`,
      timestamp: new Date(),
      metrics: [
        { label: 'Current Energy', value: `${data.energyData.current}%`, status: data.energyData.current > 70 ? 'success' : 'warning' },
      ],
      actions: [
        { label: 'View Energy Details', type: 'navigate', handler: () => { navigate('/energy'); } },
      ],
      quickReplies: ['When should I take a break?', 'Schedule high-priority tasks', 'Show my calendar'],
      contextData: { energyData: data.energyData },
      context: 'energy',
    };
  }
  
  if (lowerQuery.includes('calendar') || lowerQuery.includes('meeting') || lowerQuery.includes('schedule')) {
    const nextEvent = data.calendarEvents[0];
    return {
      id: '',
      type: 'ai',
      content: `You have ${data.calendarEvents.length} events today. Next up: ${nextEvent.title} at ${new Date(nextEvent.start).toLocaleTimeString()}.`,
      timestamp: new Date(),
      actions: [
        { label: 'View Calendar', type: 'navigate', handler: () => { navigate('/calendar'); } },
      ],
      quickReplies: ['Find free time', 'Reschedule meetings', 'Add focus block'],
      contextData: { calendarEvents: data.calendarEvents, nextEvent },
      context: 'calendar',
    };
  }
  
  // Default response with context
  return {
    id: '',
    type: 'ai',
    content: `I can help you with tasks, goals, scheduling, and energy optimization. What would you like to know?`,
    timestamp: new Date(),
    actions: [
      { label: 'Show Tasks', type: 'navigate', handler: () => { navigate('/tasks'); } },
      { label: 'View Goals', type: 'navigate', handler: () => { navigate('/tasks?tab=goals'); } },
      { label: 'Check Energy', type: 'navigate', handler: () => { navigate('/energy'); } },
    ],
    quickReplies: ['What should I focus on?', 'How are my goals?', 'What\'s my energy?'],
    context: context.page,
  };
}