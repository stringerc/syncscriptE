import { Bell, Search, Sparkles, Zap, Lock, Brain, Calendar as CalendarIcon, Target, CheckCircle2, TrendingUp, Plus, Edit, Settings, Users, Plug, Award, FileText, BarChart3, Activity } from 'lucide-react';
import { ProfileMenu } from './ProfileMenuNew';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { WeatherWidget } from './WeatherWidget';
import { NotificationsSheet } from './NotificationsSheet';
import { ConversationExtractionDialog } from './ConversationExtractionDialog';
import { Switch } from './ui/switch';
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import imgImageSyncScript from "figma:asset/32f9c29c68f7ed10b9efd8ff6ac4135b7a2a4290.png";
import { motion, AnimatePresence } from 'motion/react';
import { CURRENT_USER } from '../utils/user-constants';
import { EnergyDisplay } from './energy/EnergyDisplay';
import { toast } from 'sonner';
import { useEnergy } from '../contexts/EnergyContext';
import { useCurrentReadiness } from '../hooks/useCurrentReadiness';

interface DashboardHeaderProps {
  isAIInsightsOpen: boolean;
  onToggleAIInsights: () => void;
}

// Command registry - all available actions
type CommandAction = 'modal' | 'navigate' | 'function';

interface Command {
  id: string;
  label: string;
  keywords: string[];
  category: 'action' | 'navigation' | 'settings';
  icon: any;
  action: CommandAction;
  handler: string; // Modal name, route, or function name
  description?: string;
}

const commands: Command[] = [
  // Quick Actions - Create/Add
  { id: 'create-task', label: 'Create Task', keywords: ['create task', 'new task', 'add task', 'task'], category: 'action', icon: Plus, action: 'modal', handler: 'task', description: 'Create a new task' },
  { id: 'create-goal', label: 'Create Goal', keywords: ['create goal', 'new goal', 'add goal', 'goal'], category: 'action', icon: Target, action: 'modal', handler: 'goal', description: 'Create a new goal' },
  { id: 'create-event', label: 'Create Event', keywords: ['create event', 'new event', 'add event', 'event', 'schedule'], category: 'action', icon: CalendarIcon, action: 'modal', handler: 'event', description: 'Create a calendar event' },
  { id: 'create-script', label: 'Create Script', keywords: ['create script', 'new script', 'add script', 'script'], category: 'action', icon: FileText, action: 'modal', handler: 'script', description: 'Create a new script' },
  
  // Navigation - Pages
  { id: 'goto-tasks', label: 'Go to Tasks', keywords: ['tasks', 'todos', 'go to tasks', 'open tasks'], category: 'navigation', icon: CheckCircle2, action: 'navigate', handler: '/dashboard/tasks' },
  { id: 'goto-calendar', label: 'Go to Calendar', keywords: ['calendar', 'schedule', 'events', 'go to calendar'], category: 'navigation', icon: CalendarIcon, action: 'navigate', handler: '/dashboard/calendar' },
  { id: 'goto-analytics', label: 'Go to Analytics', keywords: ['analytics', 'stats', 'data', 'reports'], category: 'navigation', icon: BarChart3, action: 'navigate', handler: '/dashboard/analytics' },
  { id: 'goto-resonance', label: 'Go to Resonance', keywords: ['resonance', 'energy', 'focus'], category: 'navigation', icon: Activity, action: 'navigate', handler: '/dashboard/resonance' },
  { id: 'goto-ai', label: 'Go to AI Assistant', keywords: ['ai', 'assistant', 'chat', 'help'], category: 'navigation', icon: Brain, action: 'navigate', handler: '/dashboard/ai-assistant' },
  { id: 'goto-team', label: 'Go to Team', keywords: ['team', 'collaboration', 'members'], category: 'navigation', icon: Users, action: 'navigate', handler: '/dashboard/team' },
  { id: 'goto-integrations', label: 'Go to Integrations', keywords: ['integrations', 'apps', 'connections'], category: 'navigation', icon: Plug, action: 'navigate', handler: '/dashboard/integrations' },
  { id: 'goto-scripts', label: 'Go to Scripts', keywords: ['scripts', 'templates', 'marketplace'], category: 'navigation', icon: FileText, action: 'navigate', handler: '/dashboard/scripts' },
  { id: 'goto-gamification', label: 'Go to Gamification', keywords: ['gamification', 'rewards', 'achievements'], category: 'navigation', icon: Award, action: 'navigate', handler: '/dashboard/gamification' },
  { id: 'goto-settings', label: 'Go to Settings', keywords: ['settings', 'preferences', 'config'], category: 'navigation', icon: Settings, action: 'navigate', handler: '/dashboard/settings' },
];

// Calculate Levenshtein distance for fuzzy matching
function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}

// Detect if query is an AI question
function isAIQuestion(query: string): boolean {
  const aiKeywords = [
    'how', 'what', 'why', 'when', 'where', 'who', 'which',
    'can you', 'could you', 'would you', 'should i', 'help me',
    'explain', 'tell me', 'show me', 'find', 'suggest',
    'recommend', 'advice', 'best way', 'improve', 'optimize'
  ];
  
  const lowerQuery = query.toLowerCase().trim();
  return aiKeywords.some(keyword => lowerQuery.startsWith(keyword) || lowerQuery.includes(keyword + ' '));
}

// Mock searchable content (in real app, this would come from global state/context)
const mockContent = {
  tasks: [
    { id: '1', title: 'Complete budget allocation analysis', type: 'task', route: '/dashboard/tasks' },
    { id: '2', title: 'Review project proposal draft', type: 'task', route: '/dashboard/tasks' },
    { id: '3', title: 'Team sync meeting preparation', type: 'task', route: '/dashboard/tasks' },
  ],
  goals: [
    { id: '1', title: 'Launch Personal Finance Dashboard', type: 'goal', route: '/dashboard/tasks' },
    { id: '2', title: 'Read 24 Books This Year', type: 'goal', route: '/dashboard/tasks' },
  ],
  events: [
    { id: '1', title: 'Team Standup', type: 'event', route: '/dashboard/calendar' },
    { id: '2', title: 'Project Review Meeting', type: 'event', route: '/dashboard/calendar' },
  ]
};

// Search through content
function searchContent(query: string): Array<{ id: string; title: string; type: string; route: string }> {
  if (!query.trim() || query.length < 2) return [];
  
  const lowerQuery = query.toLowerCase().trim();
  const results: Array<{ id: string; title: string; type: string; route: string }> = [];
  
  // Search tasks
  mockContent.tasks.forEach(task => {
    if (task.title.toLowerCase().includes(lowerQuery)) {
      results.push(task);
    }
  });
  
  // Search goals
  mockContent.goals.forEach(goal => {
    if (goal.title.toLowerCase().includes(lowerQuery)) {
      results.push(goal);
    }
  });
  
  // Search events
  mockContent.events.forEach(event => {
    if (event.title.toLowerCase().includes(lowerQuery)) {
      results.push(event);
    }
  });
  
  return results.slice(0, 5); // Limit to 5 results
}

// Search commands - fuzzy matching with keywords
function searchCommands(query: string): Command[] {
  if (!query.trim() || query.length < 2) return [];
  
  const lowerQuery = query.toLowerCase().trim();
  const matches: Array<{ command: Command; score: number }> = [];
  
  commands.forEach(command => {
    // Check if any keyword matches or contains the query
    const keywordMatch = command.keywords.some(keyword => 
      keyword.includes(lowerQuery) || lowerQuery.includes(keyword)
    );
    
    // Check label match
    const labelMatch = command.label.toLowerCase().includes(lowerQuery);
    
    if (keywordMatch || labelMatch) {
      // Calculate relevance score (lower is better)
      let score = 100;
      
      // Exact keyword match gets highest priority
      if (command.keywords.includes(lowerQuery)) {
        score = 0;
      }
      // Keyword starts with query
      else if (command.keywords.some(k => k.startsWith(lowerQuery))) {
        score = 1;
      }
      // Keyword contains query
      else if (keywordMatch) {
        score = 2;
      }
      // Label matches
      else if (labelMatch) {
        score = 3;
      }
      
      matches.push({ command, score });
    }
  });
  
  // Sort by relevance and return top 5
  matches.sort((a, b) => a.score - b.score);
  return matches.slice(0, 5).map(m => m.command);
}

// Searchable items with common misspellings (keeping for backward compatibility)
const searchableItems = [
  { term: 'tasks', keywords: ['task', 'todo', 'todos', 'taks', 'tassk', 'tak'], route: '/dashboard/tasks' },
  { term: 'goals', keywords: ['goal', 'goall', 'gols', 'gol', 'gaols'], route: '/dashboard/tasks' },
  { term: 'calendar', keywords: ['calender', 'calandar', 'calander', 'schedule', 'events'], route: '/dashboard/calendar' },
  { term: 'analytics', keywords: ['analytic', 'stats', 'statistics', 'data', 'analitics', 'analytiks'], route: '/dashboard/analytics' },
  { term: 'resonance', keywords: ['resonence', 'resonanse', 'energy', 'focus', 'reson'], route: '/dashboard/resonance' },
  { term: 'ai assistant', keywords: ['ai', 'assistant', 'help', 'chatbot', 'asistant', 'assistent'], route: '/dashboard/ai-assistant' },
  { term: 'settings', keywords: ['setting', 'preferences', 'config', 'setings', 'settigns'], route: '/dashboard/settings' },
  { term: 'team', keywords: ['collaboration', 'members', 'collab', 'teem'], route: '/dashboard/team' },
  { term: 'integrations', keywords: ['integration', 'apps', 'connections', 'integretion'], route: '/dashboard/integrations' },
  { term: 'scripts', keywords: ['script', 'templates', 'automation', 'scrips'], route: '/dashboard/scripts' },
  { term: 'gamification', keywords: ['rewards', 'achievements', 'points', 'badges', 'game'], route: '/dashboard/gamification' },
  { term: 'enterprise', keywords: ['business', 'admin', 'tools', 'enterprize'], route: '/dashboard/enterprise' },
];

// Find best match for search query
function findBestMatch(query: string): { term: string; route: string; score: number } | null {
  if (!query.trim()) return null;
  
  const lowerQuery = query.toLowerCase().trim();
  let bestMatch: { term: string; route: string; score: number } | null = null;
  
  for (const item of searchableItems) {
    // Check exact match
    if (item.term === lowerQuery) {
      return { term: item.term, route: item.route, score: 0 };
    }
    
    // Check keywords
    for (const keyword of item.keywords) {
      if (keyword === lowerQuery) {
        return { term: item.term, route: item.route, score: 0 };
      }
    }
    
    // Calculate fuzzy match score
    const termDistance = levenshteinDistance(lowerQuery, item.term);
    const termThreshold = Math.ceil(item.term.length * 0.4); // Allow 40% difference
    
    if (termDistance <= termThreshold) {
      if (!bestMatch || termDistance < bestMatch.score) {
        bestMatch = { term: item.term, route: item.route, score: termDistance };
      }
    }
    
    // Check keywords with fuzzy matching
    for (const keyword of item.keywords) {
      const keywordDistance = levenshteinDistance(lowerQuery, keyword);
      const keywordThreshold = Math.ceil(keyword.length * 0.4);
      
      if (keywordDistance <= keywordThreshold) {
        if (!bestMatch || keywordDistance < bestMatch.score) {
          bestMatch = { term: item.term, route: item.route, score: keywordDistance };
        }
      }
    }
  }
  
  // Only return if score indicates a typo (not too different)
  return bestMatch && bestMatch.score > 0 && bestMatch.score <= 3 ? bestMatch : null;
}

export function DashboardHeader({ isAIInsightsOpen, onToggleAIInsights }: DashboardHeaderProps) {
  const [lowEnergyMode, setLowEnergyMode] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [conversationExtractionOpen, setConversationExtractionOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [contentResults, setContentResults] = useState<Array<{ id: string; title: string; type: string; route: string }>>([]);
  const [commandResults, setCommandResults] = useState<Command[]>([]);
  const [isAIQuery, setIsAIQuery] = useState(false);
  const [suggestion, setSuggestion] = useState<{ term: string; route: string } | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get real energy data from context
  const { energy } = useEnergy();
  
  // ══════════════════════════════════════════════════════════════════════════════
  // UNIFIED ENERGY CALCULATION - Synchronized across entire app
  // ══════════════════════════════════════════════════════════════════════════════
  // This ensures the header avatar shows the SAME energy % as:
  // 1. AI Focus Energy Adaptive Agent card on dashboard
  // 2. Current Readiness card on Energy & Focus tab
  // 
  // New users start at 0% (RED) and increase as they complete tasks
  // Research: Oura Ring (2023), Whoop (2024), Apple Watch (2024)
  // ══════════════════════════════════════════════════════════════════════════════
  
  const energyPercentage = useCurrentReadiness();

  const handleProfileNavigation = (route: string) => {
    console.log('Navigating to:', route);
    // You can handle navigation logic here
    if (route === '/logout') {
      // Handle logout logic
      console.log('User logged out');
    } else {
      navigate(route);
    }
  };

  // Handle search input changes - check for AI questions, commands, and content
  useEffect(() => {
    if (searchQuery.trim()) {
      // Check if it's an AI question first
      const aiQuestion = isAIQuestion(searchQuery);
      setIsAIQuery(aiQuestion);
      
      if (!aiQuestion) {
        // Search for commands
        const cmdResults = searchCommands(searchQuery);
        setCommandResults(cmdResults);
        
        // Search for content
        const contentRes = searchContent(searchQuery);
        setContentResults(contentRes);
        
        // If no commands or content results, check for navigation suggestions
        if (cmdResults.length === 0 && contentRes.length === 0) {
          const match = findBestMatch(searchQuery);
          if (match) {
            setSuggestion({ term: match.term, route: match.route });
          } else {
            setSuggestion(null);
          }
        } else {
          setSuggestion(null);
        }
        
        setShowDropdown(cmdResults.length > 0 || contentRes.length > 0 || !!suggestion);
      } else {
        // It's an AI question
        setCommandResults([]);
        setContentResults([]);
        setSuggestion(null);
        setShowDropdown(true);
      }
    } else {
      setCommandResults([]);
      setContentResults([]);
      setSuggestion(null);
      setIsAIQuery(false);
      setShowDropdown(false);
    }
  }, [searchQuery]);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    // If it's an AI question, navigate to AI Assistant with the query
    if (isAIQuery) {
      navigate('/dashboard/ai-assistant', { state: { initialMessage: searchQuery } });
      toast.success('Opening AI Assistant...', { description: 'Your question will be sent to the AI' });
      setSearchQuery('');
      setShowDropdown(false);
      return;
    }
    
    // Try to find exact navigation match
    const exactMatch = searchableItems.find(item => 
      item.term === searchQuery.toLowerCase().trim() ||
      item.keywords.includes(searchQuery.toLowerCase().trim())
    );
    
    if (exactMatch) {
      navigate(exactMatch.route);
      toast.success(`Navigating to ${exactMatch.term}...`);
      setSearchQuery('');
      setShowDropdown(false);
    } else if (suggestion) {
      navigate(suggestion.route);
      toast.success(`Navigating to ${suggestion.term}...`);
      setSearchQuery('');
      setShowDropdown(false);
    } else if (contentResults.length > 0) {
      // Navigate to first content result
      navigate(contentResults[0].route);
      toast.success(`Opening ${contentResults[0].type}: ${contentResults[0].title}`);
      setSearchQuery('');
      setShowDropdown(false);
    } else {
      toast.info('No results found', { description: 'Try rephrasing your search or ask AI for help' });
    }
  };

  const handleContentResultClick = (result: { id: string; title: string; type: string; route: string }) => {
    navigate(result.route);
    toast.success(`Opening ${result.type}: ${result.title}`);
    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleAIQuestionClick = () => {
    navigate('/dashboard/ai-assistant', { state: { initialMessage: searchQuery } });
    toast.success('Opening AI Assistant...', { description: 'Your question will be sent to the AI' });
    setSearchQuery('');
    setShowDropdown(false);
  };

  const handleSuggestionClick = () => {
    if (suggestion) {
      navigate(suggestion.route);
      toast.success(`Navigating to ${suggestion.term}...`);
      setSearchQuery('');
      setShowDropdown(false);
    }
  };

  // Handle command execution
  const handleCommandClick = (command: Command) => {
    if (command.action === 'navigate') {
      navigate(command.handler);
      toast.success(`Navigating to ${command.label.replace('Go to ', '')}...`);
    } else if (command.action === 'modal') {
      // Navigate to the appropriate page and show success message
      let route = '';
      let message = '';
      
      switch (command.handler) {
        case 'task':
          route = '/dashboard/tasks';
          message = 'Opening task creation...';
          toast.success('Create Task', { description: message });
          break;
        case 'goal':
          route = '/dashboard/tasks';
          message = 'Opening goal creation...';
          toast.success('Create Goal', { description: message });
          break;
        case 'event':
          route = '/dashboard/calendar';
          message = 'Opening event creation...';
          toast.success('Create Event', { description: message });
          break;
        case 'script':
          route = '/dashboard/scripts';
          message = 'Opening script creation...';
          toast.success('Create Script', { description: message });
          break;
        default:
          toast.info('Command executed', { description: `${command.label} action triggered` });
          return;
      }
      
      navigate(route);
    } else if (command.action === 'function') {
      toast.info('Function executed', { description: `${command.label} triggered` });
    }
    
    setSearchQuery('');
    setShowDropdown(false);
  };

  // Get icon for content type
  const getContentIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <CheckCircle2 className="w-4 h-4 text-teal-400" />;
      case 'goal':
        return <Target className="w-4 h-4 text-purple-400" />;
      case 'event':
        return <CalendarIcon className="w-4 h-4 text-blue-400" />;
      default:
        return <Search className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <header className="h-16 bg-[#1e2128] border-b border-gray-800 flex items-center justify-between px-6">
      {/* Left: Logo */}
      <div className="flex items-center gap-3">
        <div className="relative shrink-0 h-[32px] w-[152px]">
          <img 
            alt="SyncScript" 
            className="absolute inset-0 w-full h-full object-contain object-left" 
            src={imgImageSyncScript} 
          />
        </div>
      </div>

      {/* Center: Universal Search Bar + Conversation Extraction */}
      <div className="flex-1 max-w-3xl mx-8 flex items-center gap-2">
        <div className="flex-1 relative" ref={searchRef}>
          <form onSubmit={handleSearchSubmit}>
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => suggestion && setShowDropdown(true)}
              placeholder="Universal Search & Command"
              className="w-full bg-[#2a2d35] border border-gray-700 rounded-lg pl-10 pr-10 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-teal-600 transition-colors"
              data-nav="universal-search"
            />
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-4 h-4" />
          </form>

          {/* Dropdown for search results and suggestions */}
          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 right-0 mt-2 bg-[#2a2d35] border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden max-h-96 overflow-y-auto"
              >
                <div className="p-3 space-y-2">
                  {/* AI Question Option */}
                  {isAIQuery && (
                    <div>
                      <div className="text-xs text-gray-400 mb-2 px-1">Ask AI Assistant:</div>
                      <button
                        onClick={handleAIQuestionClick}
                        className="w-full text-left px-3 py-2.5 rounded-lg bg-gradient-to-r from-teal-600/20 to-blue-600/20 hover:from-teal-600/30 hover:to-blue-600/30 border border-teal-600/30 transition-all group"
                      >
                        <div className="flex items-center gap-2">
                          <Brain className="w-4 h-4 text-teal-400" />
                          <span className="text-white group-hover:text-teal-300 transition-colors">
                            "{searchQuery}"
                          </span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1 ml-6">
                          Press Enter or click to ask AI
                        </div>
                      </button>
                    </div>
                  )}

                  {/* Command Results */}
                  {commandResults.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-400 mb-2 px-1">Commands:</div>
                      <div className="space-y-1">
                        {commandResults.map(cmd => {
                          const IconComponent = cmd.icon;
                          return (
                            <button
                              key={cmd.id}
                              onClick={() => handleCommandClick(cmd)}
                              className="w-full text-left px-3 py-2 rounded-lg bg-[#1e2128] hover:bg-teal-600/10 border border-gray-700 hover:border-teal-600/30 transition-all group"
                            >
                              <div className="flex items-center gap-2">
                                <IconComponent className={`w-4 h-4 ${
                                  cmd.category === 'action' ? 'text-green-400' : 
                                  cmd.category === 'navigation' ? 'text-blue-400' : 
                                  'text-gray-400'
                                }`} />
                                <div className="flex-1 min-w-0">
                                  <div className="text-white group-hover:text-teal-300 transition-colors truncate">
                                    {cmd.label}
                                  </div>
                                  {cmd.description && (
                                    <div className="text-xs text-gray-500">
                                      {cmd.description}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Content Results */}
                  {contentResults.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-400 mb-2 px-1">Found {contentResults.length} result{contentResults.length !== 1 ? 's' : ''}:</div>
                      <div className="space-y-1">
                        {contentResults.map(result => (
                          <button
                            key={result.id}
                            onClick={() => handleContentResultClick(result)}
                            className="w-full text-left px-3 py-2 rounded-lg bg-[#1e2128] hover:bg-teal-600/10 border border-gray-700 hover:border-teal-600/30 transition-all group"
                          >
                            <div className="flex items-center gap-2">
                              {getContentIcon(result.type)}
                              <div className="flex-1 min-w-0">
                                <div className="text-white group-hover:text-teal-300 transition-colors truncate">
                                  {result.title}
                                </div>
                                <div className="text-xs text-gray-500 capitalize">
                                  {result.type}
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Navigation Suggestion */}
                  {suggestion && !isAIQuery && contentResults.length === 0 && (
                    <div>
                      <div className="text-xs text-gray-400 mb-2 px-1">Did you mean:</div>
                      <button
                        onClick={handleSuggestionClick}
                        className="w-full text-left px-3 py-2 rounded-lg bg-[#1e2128] hover:bg-teal-600/10 border border-teal-600/20 hover:border-teal-600/40 transition-all group"
                      >
                        <div className="flex items-center gap-2">
                          <Search className="w-4 h-4 text-teal-400" />
                          <span className="text-white group-hover:text-teal-300 transition-colors capitalize">
                            {suggestion.term}
                          </span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Conversation Extraction - Right next to search */}
        <button 
          onClick={() => setConversationExtractionOpen(true)}
          className="flex items-center gap-1.5 text-teal-400 hover:text-teal-300 transition-colors hover:bg-teal-900/20 px-3 py-2 rounded-lg whitespace-nowrap border border-teal-600/20 hover:border-teal-600/40"
          data-nav="conversation-extraction"
          aria-label="Conversation Extraction"
        >
          <Sparkles className="w-4 h-4" />
          <span className="text-xs">AI Extract</span>
        </button>

        {/* Conversation Extraction Dialog */}
        <ConversationExtractionDialog
          open={conversationExtractionOpen}
          onOpenChange={setConversationExtractionOpen}
        />
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">

        {/* Weather Widget */}
        <WeatherWidget />

        {/* Notifications */}
        <button 
          onClick={() => setNotificationsOpen(true)}
          className="relative p-2 hover:bg-gray-700 rounded-lg transition-colors"
          data-nav="notifications"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        </button>

        {/* Notifications Sheet */}
        <NotificationsSheet 
          open={notificationsOpen}
          onOpenChange={setNotificationsOpen}
        />

        {/* Low Energy Mode Toggle */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#2a2d35] rounded-lg border border-gray-700">
            <Zap className={`w-4 h-4 transition-colors ${lowEnergyMode ? 'text-red-400' : 'text-emerald-400'}`} />
            <span className="text-xs text-gray-400 whitespace-nowrap">Low Energy Mode</span>
            <Switch 
              checked={!lowEnergyMode}
              onCheckedChange={(checked) => setLowEnergyMode(!checked)}
              data-nav="low-energy-mode-toggle"
              className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-red-500"
            />
          </div>
        </div>

        {/* User Profile Menu with Animated Avatar */}
        <ProfileMenu 
          energyLevel={energyPercentage}
          dailyStreak={CURRENT_USER.dailyStreak}
          onNavigate={handleProfileNavigation}
        />
      </div>
    </header>
  );
}