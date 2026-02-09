import { useState, useEffect } from 'react';
import { 
  FileText, Code, Zap, Plus, Search, Filter, Star, 
  Download, Copy, Play, Clock, TrendingUp, Sparkles,
  CheckCircle2, Circle, MoreVertical, ChevronRight, Users,
  Shield, Calendar, Mail, Sliders, Eye, Edit, ThumbsUp,
  MessageSquare, Award, Bookmark, Share2, ExternalLink,
  Lightbulb, Flame, Heart, Target, Layout, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Label } from '../ui/label';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { DashboardLayout } from '../layout/DashboardLayout';
import { AIInsightsContent } from '../AIInsightsSection';
import { ResonanceBadge } from '../ResonanceBadge';
import {
  AutomationUsageTrend,
  TimeSavedEstimate,
  TopCommunityScripts,
  ScriptCategories,
  ScriptSuccessRate
} from '../ScriptsAnalytics';
import { useUserPreferences } from '../../utils/user-preferences';
import { AdaptationEngine } from '../../utils/adaptation-engine';
import { ScriptAnalyticsTracker } from '../../utils/script-analytics';
import { EnhancedSearch, SearchSuggestion } from '../../utils/enhanced-search';
import { UserPreferencesDialog } from '../UserPreferencesDialog';
import { useTeamScripts } from '../../hooks/useTeamScripts';
import { TeamScriptCard } from '../team/TeamScriptCard';
import { useTeam } from '../../contexts/TeamContext';

interface Script {
  id: number;
  name: string;
  description: string;
  fullDescription?: string;
  category: 'time-management' | 'meetings' | 'email' | 'focus' | 'reporting' | 'onboarding' | 'task-management';
  icon: typeof FileText;
  uses: number;
  saved: boolean;
  tags: string[];
  lastUpdated: string;
  author: string;
  authorType: 'system' | 'community';
  rating: number;
  reviewCount: number;
  isNew?: boolean;
  isPopular?: boolean;
  isRecommended?: boolean;
  complexity: 'beginner' | 'intermediate' | 'advanced';
  requiredIntegrations?: string[];
  timeSaved?: string;
  thumbnail?: string;
  reviews?: Review[];
  adaptableParams?: AdaptableParam[];
}

interface Review {
  id: number;
  author: string;
  avatar?: string;
  rating: number;
  date: string;
  comment: string;
  helpful: number;
}

interface AdaptableParam {
  name: string;
  description: string;
  type: 'number' | 'time' | 'text' | 'boolean';
  defaultValue: any;
  adaptedValue?: any;
  reason?: string;
}

interface Collection {
  id: number;
  name: string;
  description: string;
  icon: typeof Layout;
  scripts: number[];
  color: string;
}

export function ScriptsTemplatesPage() {
  const { preferences } = useUserPreferences();
  
  // Team scripts integration
  const {
    scripts: teamScripts,
    searchScripts: searchTeamScripts,
    getMyScripts,
    getFavoriteScripts: getFavoriteTeamScripts,
    favoriteScript,
    unfavoriteScript,
    canEdit,
    canDelete,
  } = useTeamScripts();
  const { teams, getUserTeams } = useTeam();
  const CURRENT_USER_ID = 'user-1';
  const userTeams = getUserTeams(CURRENT_USER_ID);
  
  const [activeTab, setActiveTab] = useState<'marketplace' | 'team' | 'my-scripts'>('marketplace');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [showPersonalization, setShowPersonalization] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'popular' | 'rating' | 'recent'>('popular');
  const [adaptedParams, setAdaptedParams] = useState<AdaptableParam[]>([]);
  const [isPreferencesDialogOpen, setIsPreferencesDialogOpen] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [savedScripts, setSavedScripts] = useState<number[]>([]);
  const [usageStats, setUsageStats] = useState({
    totalViews: 0,
    totalImports: 0,
    timeSaved: { hours: 0, minutes: 0 }
  });

  // Load analytics on mount
  useEffect(() => {
    const analytics = ScriptAnalyticsTracker.getAnalytics();
    const timeSaved = ScriptAnalyticsTracker.getTotalTimeSaved();
    setUsageStats({
      totalViews: analytics.totalViews,
      totalImports: analytics.totalImports,
      timeSaved
    });
    setSavedScripts(analytics.favoriteScripts);
  }, []);

  // Enhanced search with autocomplete
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const scriptNames = scripts.map(s => s.name);
      const allTags = Array.from(new Set(scripts.flatMap(s => s.tags)));
      const categories = Array.from(new Set(scripts.map(s => s.category)));
      const authors = Array.from(new Set(scripts.map(s => s.author)));

      const suggestions = EnhancedSearch.generateSuggestions(
        searchQuery,
        scriptNames,
        allTags,
        categories,
        authors,
        5
      );
      
      setSearchSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } else {
      setShowSuggestions(false);
      setSearchSuggestions([]);
    }
  }, [searchQuery]);

  // Featured Collections
  const collections: Collection[] = [
    {
      id: 1,
      name: 'Focus Tools',
      description: 'Deep work and concentration enhancers',
      icon: Target,
      scripts: [3, 8],
      color: 'from-purple-600 to-blue-600'
    },
    {
      id: 2,
      name: 'Team Collaboration',
      description: 'Essential tools for team productivity',
      icon: Users,
      scripts: [5, 7],
      color: 'from-teal-600 to-cyan-600'
    },
    {
      id: 3,
      name: 'Quick Wins',
      description: 'Simple scripts with immediate impact',
      icon: Zap,
      scripts: [1, 4],
      color: 'from-amber-600 to-orange-600'
    }
  ];

  const scripts: Script[] = [
    {
      id: 1,
      name: 'Daily Morning Routine',
      description: 'Automated morning task sequence with energy optimization',
      fullDescription: 'Start your day with optimal energy alignment. This script automatically sequences your morning tasks based on your circadian rhythm and cognitive load patterns. It creates an intelligent morning routine that adapts to your energy levels.',
      category: 'time-management',
      icon: Zap,
      uses: 12470,
      saved: true,
      tags: ['Morning', 'Energy', 'Habits', 'Routine'],
      lastUpdated: '2 days ago',
      author: 'SyncScript Team',
      authorType: 'system',
      rating: 4.8,
      reviewCount: 342,
      isNew: true,
      isPopular: true,
      isRecommended: true,
      complexity: 'beginner',
      requiredIntegrations: ['Calendar', 'Tasks'],
      timeSaved: '45 min/day',
      thumbnail: 'https://images.unsplash.com/photo-1506784983877-45594efa4cbe?w=400&h=300&fit=crop',
      adaptableParams: [
        {
          name: 'Start Time',
          description: 'When to begin your morning routine',
          type: 'time',
          defaultValue: '7:00 AM',
          adaptedValue: '8:30 AM',
          reason: 'Your peak energy starts later - we moved this to match your natural rhythm'
        },
        {
          name: 'Task Count',
          description: 'Number of morning tasks',
          type: 'number',
          defaultValue: 8,
          adaptedValue: 5,
          reason: 'You complete tasks 25% faster than average - streamlined for your pace'
        },
        {
          name: 'Break Duration',
          description: 'Rest between task blocks',
          type: 'number',
          defaultValue: 10,
          adaptedValue: 15,
          reason: 'Your focus improves with slightly longer breaks'
        }
      ],
      reviews: [
        {
          id: 1,
          author: 'Sarah M.',
          avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
          rating: 5,
          date: '1 week ago',
          comment: 'Absolutely game-changing! My mornings are now so much more productive and I actually feel energized.',
          helpful: 47
        },
        {
          id: 2,
          author: 'Michael T.',
          rating: 4,
          date: '2 weeks ago',
          comment: 'Great script, though I had to adjust the timing slightly for my schedule. The resonance adaptation feature is brilliant!',
          helpful: 23
        }
      ]
    },
    {
      id: 2,
      name: 'Weekly Sprint Planner',
      description: 'Comprehensive weekly retrospective and planning workflow',
      fullDescription: 'Structure your week like a pro with this comprehensive planning template. Includes goal setting, task prioritization, energy mapping, and weekly review components.',
      category: 'task-management',
      icon: TrendingUp,
      uses: 8920,
      saved: false,
      tags: ['Review', 'Planning', 'Goals', 'Weekly'],
      lastUpdated: '1 week ago',
      author: 'Productivity Pro',
      authorType: 'community',
      rating: 4.9,
      reviewCount: 156,
      isPopular: true,
      complexity: 'intermediate',
      requiredIntegrations: ['Tasks', 'Calendar', 'Analytics'],
      timeSaved: '2 hrs/week',
      thumbnail: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400&h=300&fit=crop',
      adaptableParams: [
        {
          name: 'Review Day',
          description: 'Day of week for weekly review',
          type: 'text',
          defaultValue: 'Sunday',
          adaptedValue: 'Friday',
          reason: 'You typically reflect on Fridays - aligned to your pattern'
        }
      ],
      reviews: []
    },
    {
      id: 3,
      name: 'Focus Block Generator',
      description: 'Automatically creates optimal deep work blocks based on energy',
      fullDescription: 'Harness the power of deep work with AI-optimized focus blocks. This script analyzes your energy patterns and calendar to automatically schedule uninterrupted deep work sessions when you\'re at peak cognitive performance.',
      category: 'focus',
      icon: Sparkles,
      uses: 21030,
      saved: true,
      tags: ['Focus', 'Deep Work', 'AI', 'Energy'],
      lastUpdated: '3 days ago',
      author: 'SyncScript Team',
      authorType: 'system',
      rating: 5.0,
      reviewCount: 567,
      isPopular: true,
      isRecommended: true,
      complexity: 'beginner',
      requiredIntegrations: ['Calendar', 'Energy Tracker'],
      timeSaved: '3 hrs/week',
      thumbnail: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&h=300&fit=crop',
      adaptableParams: [
        {
          name: 'Block Duration',
          description: 'Length of each focus session',
          type: 'number',
          defaultValue: 90,
          adaptedValue: 120,
          reason: 'Your data shows sustained focus for 2-hour blocks - extended for better flow'
        }
      ],
      reviews: []
    },
    {
      id: 4,
      name: 'Client Report Builder',
      description: 'Generate beautiful client reports from your task completion data',
      fullDescription: 'Transform your work data into professional client reports automatically. Pull metrics, visualizations, and insights to create comprehensive progress reports in minutes.',
      category: 'reporting',
      icon: FileText,
      uses: 5670,
      saved: false,
      tags: ['Reports', 'Clients', 'Analytics', 'Professional'],
      lastUpdated: '5 days ago',
      author: 'Agency Expert',
      authorType: 'community',
      rating: 4.6,
      reviewCount: 89,
      complexity: 'intermediate',
      requiredIntegrations: ['Analytics', 'Export'],
      timeSaved: '1 hr/report',
      thumbnail: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
      adaptableParams: [],
      reviews: []
    },
    {
      id: 5,
      name: 'Slack Integration Flow',
      description: 'Sync tasks and notifications with your Slack workspace',
      fullDescription: 'Seamlessly integrate SyncScript with Slack. Get real-time task updates, create tasks from messages, and keep your team in sync without context switching.',
      category: 'meetings',
      icon: Code,
      uses: 14560,
      saved: true,
      tags: ['Slack', 'Integration', 'Notifications', 'Team'],
      lastUpdated: '1 day ago',
      author: 'Integration Hub',
      authorType: 'community',
      rating: 4.7,
      reviewCount: 234,
      isNew: true,
      complexity: 'advanced',
      requiredIntegrations: ['Slack', 'Notifications'],
      timeSaved: '30 min/day',
      thumbnail: 'https://images.unsplash.com/photo-1611606063065-ee7946f0787a?w=400&h=300&fit=crop',
      adaptableParams: [],
      reviews: []
    },
    {
      id: 6,
      name: 'Goal Achievement Tracker',
      description: 'Weekly goal tracking with progress visualizations and insights',
      fullDescription: 'Stay on track with your long-term goals. Automated weekly check-ins, progress visualization, and intelligent suggestions to keep you motivated and accountable.',
      category: 'task-management',
      icon: Target,
      uses: 7230,
      saved: false,
      tags: ['Goals', 'Progress', 'Insights', 'Motivation'],
      lastUpdated: '4 days ago',
      author: 'Goal Master',
      authorType: 'community',
      rating: 4.8,
      reviewCount: 178,
      isRecommended: true,
      complexity: 'beginner',
      requiredIntegrations: ['Tasks', 'Analytics'],
      timeSaved: '20 min/week',
      thumbnail: 'https://images.unsplash.com/photo-1533749047139-189de3cf06d3?w=400&h=300&fit=crop',
      adaptableParams: [],
      reviews: []
    },
    {
      id: 7,
      name: 'Meeting Prep Automation',
      description: 'Automatically prepare agendas and gather context before meetings',
      fullDescription: 'Never walk into a meeting unprepared. This script pulls relevant information, creates structured agendas, and sends prep materials to attendees automatically.',
      category: 'meetings',
      icon: Users,
      uses: 9340,
      saved: true,
      tags: ['Meetings', 'Agendas', 'Preparation', 'Team'],
      lastUpdated: '6 days ago',
      author: 'SyncScript Team',
      authorType: 'system',
      rating: 4.9,
      reviewCount: 201,
      isPopular: true,
      complexity: 'intermediate',
      requiredIntegrations: ['Calendar', 'Email', 'Tasks'],
      timeSaved: '15 min/meeting',
      thumbnail: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop',
      adaptableParams: [],
      reviews: []
    },
    {
      id: 8,
      name: 'Email Inbox Zero Flow',
      description: 'Smart email triage and task creation from your inbox',
      fullDescription: 'Achieve inbox zero effortlessly. Automatically categorize emails, create tasks from action items, and archive processed messages based on learned patterns.',
      category: 'email',
      icon: Mail,
      uses: 11890,
      saved: false,
      tags: ['Email', 'Inbox Zero', 'Automation', 'Productivity'],
      lastUpdated: '3 days ago',
      author: 'Email Ninja',
      authorType: 'community',
      rating: 4.7,
      reviewCount: 312,
      isNew: true,
      isPopular: true,
      complexity: 'intermediate',
      requiredIntegrations: ['Email', 'Tasks'],
      timeSaved: '1 hr/day',
      thumbnail: 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=400&h=300&fit=crop',
      adaptableParams: [
        {
          name: 'Processing Time',
          description: 'When to process emails',
          type: 'time',
          defaultValue: '9:00 AM',
          adaptedValue: '2:00 PM',
          reason: 'You handle administrative tasks better in the afternoon'
        }
      ],
      reviews: []
    }
  ];

  const categories = [
    { id: 'all', label: 'All Scripts', count: scripts.length },
    { id: 'time-management', label: 'Time Management', count: scripts.filter(s => s.category === 'time-management').length },
    { id: 'task-management', label: 'Task Management', count: scripts.filter(s => s.category === 'task-management').length },
    { id: 'meetings', label: 'Meetings & Notes', count: scripts.filter(s => s.category === 'meetings').length },
    { id: 'email', label: 'Email & Comm.', count: scripts.filter(s => s.category === 'email').length },
    { id: 'focus', label: 'Focus & Deep Work', count: scripts.filter(s => s.category === 'focus').length },
    { id: 'reporting', label: 'Reporting & Docs', count: scripts.filter(s => s.category === 'reporting').length },
  ];

  // AI Insights with AUTOMATION ANALYTICS
  const aiInsightsContent: AIInsightsContent = {
    title: 'Automation Analytics',
    mode: 'custom',
    customContent: (
      <div className="space-y-6">
        <div>
          <h3 className="text-sm text-gray-300 mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            Automation Growth
          </h3>
          <AutomationUsageTrend />
        </div>

        <div>
          <h3 className="text-sm text-gray-300 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            Time Saved
          </h3>
          <TimeSavedEstimate />
        </div>

        <div>
          <h3 className="text-sm text-gray-300 mb-3 flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400" />
            Top Community Scripts
          </h3>
          <TopCommunityScripts />
        </div>

        <div>
          <h3 className="text-sm text-gray-300 mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            Your Automation Mix
          </h3>
          <ScriptCategories />
        </div>

        <div>
          <h3 className="text-sm text-gray-300 mb-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            Reliability Score
          </h3>
          <ScriptSuccessRate />
        </div>
      </div>
    ),
  };

  // Filter scripts with enhanced search
  const filteredScripts = scripts
    .filter((script) => {
      const matchesCategory = selectedCategory === 'all' || script.category === selectedCategory;
      const matchesSource = selectedSource === 'all' || 
        (selectedSource === 'system' && script.authorType === 'system') ||
        (selectedSource === 'community' && script.authorType === 'community');
      
      // Use enhanced search
      const matchesSearch = searchQuery === '' || EnhancedSearch.advancedSearch(
        [script],
        searchQuery,
        ['name', 'description', 'tags']
      ).length > 0;
      
      const matchesRating = script.rating >= minRating;
      const matchesSaved = !showSavedOnly || savedScripts.includes(script.id);
      return matchesCategory && matchesSource && matchesSearch && matchesRating && matchesSaved;
    })
    .sort((a, b) => {
      if (sortBy === 'popular') return b.uses - a.uses;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0; // recent
    });

  const handleScriptClick = (script: Script) => {
    // Track view analytics
    ScriptAnalyticsTracker.trackEvent({
      scriptId: script.id,
      scriptName: script.name,
      action: 'view'
    });
    
    setSelectedScript(script);
    setIsDetailModalOpen(true);
    setShowPersonalization(false);
    setIsEditing(false);
    
    // Update stats
    const analytics = ScriptAnalyticsTracker.getAnalytics();
    setUsageStats(prev => ({
      ...prev,
      totalViews: analytics.totalViews
    }));
  };

  const handleAdaptToResonance = () => {
    if (selectedScript?.adaptableParams) {
      // Use real adaptation engine
      const adaptationResult = AdaptationEngine.adaptScript(
        selectedScript.adaptableParams,
        preferences,
        selectedScript.category
      );
      
      setAdaptedParams(adaptationResult.params);
      setShowPersonalization(true);
      
      toast.success('Resonance Adaptation Applied!', {
        description: adaptationResult.overallExplanation,
        duration: 5000
      });
    }
  };

  const handleImportAsIs = () => {
    if (selectedScript) {
      // Track import analytics
      ScriptAnalyticsTracker.trackEvent({
        scriptId: selectedScript.id,
        scriptName: selectedScript.name,
        action: 'import',
        adaptationType: 'none'
      });
      
      toast.success('Script Imported!', {
        description: `${selectedScript.name} added to your workspace`
      });
      
      // Update stats
      const analytics = ScriptAnalyticsTracker.getAnalytics();
      const timeSaved = ScriptAnalyticsTracker.getTotalTimeSaved();
      setUsageStats({
        totalViews: analytics.totalViews,
        totalImports: analytics.totalImports,
        timeSaved
      });
    }
    setIsDetailModalOpen(false);
  };

  const handleImportPersonalized = () => {
    if (selectedScript) {
      // Track import with resonance adaptation
      ScriptAnalyticsTracker.trackEvent({
        scriptId: selectedScript.id,
        scriptName: selectedScript.name,
        action: 'import',
        adaptationType: 'resonance'
      });
      
      toast.success('Personalized Script Imported!', {
        description: `${selectedScript.name} tuned to your resonance and added to workspace`,
        duration: 5000
      });
      
      // Update stats
      const analytics = ScriptAnalyticsTracker.getAnalytics();
      const timeSaved = ScriptAnalyticsTracker.getTotalTimeSaved();
      setUsageStats({
        totalViews: analytics.totalViews,
        totalImports: analytics.totalImports,
        timeSaved
      });
    }
    setIsDetailModalOpen(false);
  };

  const handleToggleFavorite = (scriptId: number, scriptName: string) => {
    const isFavorite = ScriptAnalyticsTracker.isFavorite(scriptId);
    
    ScriptAnalyticsTracker.trackEvent({
      scriptId,
      scriptName,
      action: isFavorite ? 'unfavorite' : 'favorite'
    });
    
    const analytics = ScriptAnalyticsTracker.getAnalytics();
    setSavedScripts(analytics.favoriteScripts);
    
    toast.success(isFavorite ? 'Removed from favorites' : 'Added to favorites');
  };

  return (
    <DashboardLayout aiInsightsContent={aiInsightsContent}>
      {/* Coming Soon Overlay */}
      <div className="absolute inset-0 z-50 bg-[#1a1d24]/95 backdrop-blur-sm flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto px-6 text-center"
        >
          <div className="bg-gradient-to-br from-teal-600/20 to-cyan-600/20 border border-teal-500/30 rounded-2xl p-8 shadow-2xl shadow-teal-500/10">
            <div className="w-20 h-20 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-white" />
            </div>
            
            <h2 className="text-4xl font-bold text-white mb-4">
              Coming Soon
            </h2>
            
            <div className="space-y-4 text-gray-300">
              <p className="text-xl">
                Scripts & Templates Marketplace
              </p>
              
              <p className="text-base leading-relaxed">
                Browse and customize pre-built automation scripts tailored to your workflow. 
                The marketplace will feature community-contributed templates for time management, 
                meetings, email automation, focus sessions, and more—all tuned to your unique 
                energy patterns and resonance score.
              </p>
              
              <div className="flex flex-wrap gap-2 justify-center mt-6">
                <Badge variant="secondary" className="bg-teal-600/20 text-teal-300 border-teal-500/30">
                  <Zap className="w-3 h-3 mr-1" />
                  Auto-Scheduling
                </Badge>
                <Badge variant="secondary" className="bg-cyan-600/20 text-cyan-300 border-cyan-500/30">
                  <Users className="w-3 h-3 mr-1" />
                  Community Scripts
                </Badge>
                <Badge variant="secondary" className="bg-purple-600/20 text-purple-300 border-purple-500/30">
                  <Sparkles className="w-3 h-3 mr-1" />
                  AI Personalization
                </Badge>
                <Badge variant="secondary" className="bg-blue-600/20 text-blue-300 border-blue-500/30">
                  <Code className="w-3 h-3 mr-1" />
                  Custom Templates
                </Badge>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        className="space-y-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Page Header */}
        <div className="mb-2 flex items-start justify-between">
          <div>
            <h1 className="text-3xl text-white mb-2">Scripts & Templates Marketplace</h1>
            <p className="text-gray-400">Discover, customize, and import automations tuned to your workflow</p>
            {/* Usage Stats */}
            <div className="flex gap-6 mt-3 text-sm">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-blue-400" />
                <span className="text-gray-400">{usageStats.totalViews} views</span>
              </div>
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-teal-400" />
                <span className="text-gray-400">{usageStats.totalImports} imports</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-gray-400">
                  {usageStats.timeSaved.hours}h {usageStats.timeSaved.minutes}m saved
                </span>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setIsPreferencesDialogOpen(true)}
          >
            <Settings className="w-4 h-4" />
            My Preferences
          </Button>
        </div>

        {/* Search Bar - Prominent */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search scripts, templates, and automations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className="pl-12 bg-[#1e2128] border-gray-800 h-12 text-base"
            />
            {/* Autocomplete Suggestions */}
            {showSuggestions && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1c20] border border-gray-800 rounded-lg shadow-xl z-50 overflow-hidden">
                {searchSuggestions.map((suggestion, idx) => (
                  <div
                    key={idx}
                    className="px-4 py-3 hover:bg-gray-800/50 cursor-pointer flex items-center justify-between group"
                    onClick={() => {
                      setSearchQuery(suggestion.text);
                      setShowSuggestions(false);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <Search className="w-4 h-4 text-gray-500" />
                      <span className="text-white">{suggestion.text}</span>
                    </div>
                    <Badge variant="outline" className="text-xs text-gray-400 border-gray-700">
                      {suggestion.type}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
          <Button 
            variant="outline" 
            className="gap-2 h-12"
            onClick={() => setIsFilterDialogOpen(true)}
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-[180px] bg-[#1e2128] border-gray-800 h-12 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1a1c20] border-gray-800">
              <SelectItem value="popular" className="text-white">Most Popular</SelectItem>
              <SelectItem value="rating" className="text-white">Highest Rated</SelectItem>
              <SelectItem value="recent" className="text-white">Recently Added</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Featured Collections */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              Featured Collections
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {collections.map((collection) => {
              const Icon = collection.icon;
              return (
                <motion.div
                  key={collection.id}
                  whileHover={{ scale: 1.02 }}
                  className="cursor-pointer"
                >
                  <Card className={`bg-gradient-to-br ${collection.color} p-5 border-0 shadow-lg`}>
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white mb-1">{collection.name}</h3>
                        <p className="text-white/80 text-sm">{collection.description}</p>
                        <div className="mt-3 flex items-center gap-2">
                          <Badge variant="secondary" className="bg-white/20 text-white border-0">
                            {collection.scripts.length} scripts
                          </Badge>
                          <ChevronRight className="w-4 h-4 text-white/60" />
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Category Pills */}
        <div className="space-y-3">
          <h3 className="text-white text-sm">Browse by Category</h3>
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <Badge
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                className={`cursor-pointer hover:bg-white/5 transition-colors text-white ${
                  selectedCategory === cat.id 
                    ? 'bg-teal-600 border-teal-600' 
                    : 'border-gray-600 hover:border-teal-500/50'
                }`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.label} ({cat.count})
              </Badge>
            ))}
          </div>
        </div>

        {/* Source Filter Pills */}
        <div className="flex gap-2">
          {['all', 'system', 'community'].map((source) => (
            <Badge
              key={source}
              variant={selectedSource === source ? 'default' : 'outline'}
              className={`cursor-pointer hover:bg-white/5 transition-colors text-white ${
                selectedSource === source 
                  ? 'bg-purple-600 border-purple-600' 
                  : 'border-gray-600'
              }`}
              onClick={() => setSelectedSource(source)}
            >
              {source === 'all' && 'All Sources'}
              {source === 'system' && '🛡️ System Scripts'}
              {source === 'community' && '👥 Community'}
            </Badge>
          ))}
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between">
          <p className="text-gray-400 text-sm">
            {filteredScripts.length} {filteredScripts.length === 1 ? 'script' : 'scripts'} found
          </p>
          {(selectedCategory !== 'all' || selectedSource !== 'all' || searchQuery) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedCategory('all');
                setSelectedSource('all');
                setSearchQuery('');
                setMinRating(0);
                setShowSavedOnly(false);
                toast.success('Filters cleared');
              }}
            >
              Clear all filters
            </Button>
          )}
        </div>

        {/* Scripts Marketplace Grid */}
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredScripts.map((script, index) => {
            const Icon = script.icon;
            return (
              <motion.div
                key={script.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => handleScriptClick(script)}
              >
                <Card className="bg-[#1e2128] border-gray-800 overflow-hidden hover:border-teal-600/50 transition-all hover:shadow-lg hover:shadow-teal-500/10 cursor-pointer group h-full flex flex-col">
                  {/* Thumbnail */}
                  {script.thumbnail && (
                    <div className="relative h-40 overflow-hidden bg-gray-900">
                      <img 
                        src={script.thumbnail} 
                        alt={script.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      {/* Badges Overlay */}
                      <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
                        {script.isNew && (
                          <Badge className="bg-blue-600 text-white border-0">
                            <Sparkles className="w-3 h-3 mr-1" />
                            New
                          </Badge>
                        )}
                        {script.isPopular && (
                          <Badge className="bg-orange-600 text-white border-0">
                            <Flame className="w-3 h-3 mr-1" />
                            Popular
                          </Badge>
                        )}
                        {script.isRecommended && (
                          <Badge className="bg-teal-600 text-white border-0">
                            <Award className="w-3 h-3 mr-1" />
                            For You
                          </Badge>
                        )}
                      </div>
                      {/* Author Type Badge */}
                      <div className="absolute top-2 right-2">
                        {script.authorType === 'system' && (
                          <Badge className="bg-purple-600/90 text-white border-0 backdrop-blur-sm">
                            <Shield className="w-3 h-3 mr-1" />
                            System
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="p-5 flex-1 flex flex-col">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-white mb-1 group-hover:text-teal-400 transition-colors">
                          {script.name}
                        </h3>
                        <p className="text-sm text-gray-400 line-clamp-2">{script.description}</p>
                      </div>
                      <button
                        className="text-gray-400 hover:text-yellow-400 transition-colors ml-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleFavorite(script.id, script.name);
                        }}
                      >
                        <Star className={`w-5 h-5 ${savedScripts.includes(script.id) ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                      </button>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {script.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-2 mb-4 mt-auto">
                      <div className="text-center p-2 bg-black/20 rounded">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span className="text-white text-sm">{script.rating}</span>
                        </div>
                        <p className="text-xs text-gray-500">{script.reviewCount} reviews</p>
                      </div>
                      <div className="text-center p-2 bg-black/20 rounded">
                        <div className="text-white text-sm mb-1">{(script.uses / 1000).toFixed(1)}k</div>
                        <p className="text-xs text-gray-500">uses</p>
                      </div>
                      <div className="text-center p-2 bg-black/20 rounded">
                        <div className="text-white text-sm mb-1">{script.timeSaved || 'N/A'}</div>
                        <p className="text-xs text-gray-500">saved</p>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                      <span>{script.author}</span>
                      <span>{script.lastUpdated}</span>
                    </div>

                    {/* Quick Action */}
                    <Button
                      className="w-full gap-2 bg-gradient-to-r from-teal-600 to-blue-600 hover:scale-[1.02] transition-transform"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleScriptClick(script);
                      }}
                    >
                      <Eye className="w-4 h-4" />
                      View Details
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredScripts.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-white text-xl mb-2">No Scripts Found</h3>
            <p className="text-gray-400 mb-4">Try adjusting your filters or search query</p>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedCategory('all');
                setSelectedSource('all');
                setSearchQuery('');
                setMinRating(0);
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </motion.div>

      {/* Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="bg-[#1a1c20] border-gray-800 max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedScript && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <DialogTitle className="text-white text-2xl mb-2">
                      {selectedScript.name}
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                      {selectedScript.description}
                    </DialogDescription>
                    <div className="flex items-center gap-2 flex-wrap mb-3 mt-2">
                      {selectedScript.isNew && (
                        <Badge className="bg-blue-600 text-white">New</Badge>
                      )}
                      {selectedScript.isPopular && (
                        <Badge className="bg-orange-600 text-white">Popular</Badge>
                      )}
                      {selectedScript.isRecommended && (
                        <ResonanceBadge 
                          score={95} 
                          size="sm"
                          showLabel={true}
                        />
                      )}
                      <Badge variant="outline" className="text-white">
                        {selectedScript.complexity}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toast.success('Shared to clipboard')}
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleToggleFavorite(selectedScript.id, selectedScript.name)}
                    >
                      <Bookmark className={savedScripts.includes(selectedScript.id) ? 'fill-current' : ''} />
                    </Button>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Preview Image */}
                {selectedScript.thumbnail && (
                  <div className="relative h-64 rounded-lg overflow-hidden">
                    <img 
                      src={selectedScript.thumbnail} 
                      alt={selectedScript.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Author & Stats */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback className="bg-purple-600 text-white">
                        {selectedScript.author[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-white">{selectedScript.author}</p>
                      <p className="text-sm text-gray-400">
                        {selectedScript.authorType === 'system' ? 'Official SyncScript' : 'Community Contributor'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-amber-400 mb-1">
                      <Star className="w-5 h-5 fill-current" />
                      <span className="text-white text-xl">{selectedScript.rating}</span>
                    </div>
                    <p className="text-sm text-gray-400">{selectedScript.reviewCount} reviews</p>
                  </div>
                </div>

                <Separator className="bg-gray-800" />

                {/* Full Description */}
                <div>
                  <h3 className="text-white mb-3">About This Script</h3>
                  <p className="text-gray-300 leading-relaxed">
                    {selectedScript.fullDescription || selectedScript.description}
                  </p>
                </div>

                {/* Key Features */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-[#1e2128] p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Download className="w-4 h-4 text-teal-400" />
                      <span className="text-gray-400 text-sm">Total Uses</span>
                    </div>
                    <p className="text-white text-xl">{selectedScript.uses.toLocaleString()}</p>
                  </div>
                  <div className="bg-[#1e2128] p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span className="text-gray-400 text-sm">Time Saved</span>
                    </div>
                    <p className="text-white text-xl">{selectedScript.timeSaved || 'Varies'}</p>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <h3 className="text-white mb-3 text-sm">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedScript.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="text-white">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Required Integrations */}
                {selectedScript.requiredIntegrations && selectedScript.requiredIntegrations.length > 0 && (
                  <div>
                    <h3 className="text-white mb-3 text-sm">Required Features</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedScript.requiredIntegrations.map((integration) => (
                        <Badge key={integration} className="bg-purple-600/20 text-purple-300 border-purple-600/30">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {integration}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Personalization Section */}
                {showPersonalization && adaptedParams.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-gradient-to-br from-teal-900/30 to-blue-900/30 border border-teal-600/30 rounded-lg p-5 space-y-4"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-teal-400" />
                      <h3 className="text-white">Resonance Adaptations</h3>
                    </div>
                    <p className="text-gray-300 text-sm mb-4">
                      We've tuned this script to match your unique productivity rhythm. Here's what changed and why:
                    </p>

                    {adaptedParams.map((param, index) => (
                      <div key={index} className="bg-black/20 rounded-lg p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="text-white mb-1">{param.name}</h4>
                            <p className="text-sm text-gray-400 mb-2">{param.description}</p>
                          </div>
                          {isEditing && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toast.info('Edit mode enabled')}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Default</p>
                            <p className="text-gray-300">{param.defaultValue}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Adapted for You</p>
                            <p className="text-teal-400">{param.adaptedValue}</p>
                          </div>
                        </div>
                        {param.reason && (
                          <div className="flex items-start gap-2 mt-2 pt-2 border-t border-gray-700">
                            <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-gray-300">{param.reason}</p>
                          </div>
                        )}
                      </div>
                    ))}

                    {!isEditing && (
                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => {
                          setIsEditing(true);
                          toast.info('Edit mode enabled', { description: 'Customize the adapted values' });
                        }}
                      >
                        <Edit className="w-4 h-4" />
                        Edit Before Importing
                      </Button>
                    )}
                  </motion.div>
                )}

                {/* Reviews Section */}
                {selectedScript.reviews && selectedScript.reviews.length > 0 && (
                  <div>
                    <h3 className="text-white mb-4">User Reviews</h3>
                    <div className="space-y-4">
                      {selectedScript.reviews.map((review) => (
                        <div key={review.id} className="bg-[#1e2128] rounded-lg p-4">
                          <div className="flex items-start gap-3 mb-3">
                            <Avatar className="w-10 h-10">
                              {review.avatar && <AvatarImage src={review.avatar} />}
                              <AvatarFallback>{review.author[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-white">{review.author}</p>
                                <div className="flex items-center gap-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-3 h-3 ${
                                        i < review.rating 
                                          ? 'fill-amber-400 text-amber-400' 
                                          : 'text-gray-600'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-sm text-gray-400">{review.date}</p>
                            </div>
                          </div>
                          <p className="text-gray-300 mb-3">{review.comment}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <button className="flex items-center gap-1 text-gray-400 hover:text-teal-400 transition-colors">
                              <ThumbsUp className="w-3 h-3" />
                              Helpful ({review.helpful})
                            </button>
                            <button className="flex items-center gap-1 text-gray-400 hover:text-teal-400 transition-colors">
                              <MessageSquare className="w-3 h-3" />
                              Reply
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Import Actions */}
                <div className="flex gap-3 pt-4 border-t border-gray-800">
                  {!showPersonalization ? (
                    <>
                      <Button
                        variant="outline"
                        className="flex-1 gap-2"
                        onClick={handleImportAsIs}
                      >
                        <Download className="w-4 h-4" />
                        Import As-Is
                      </Button>
                      {selectedScript.adaptableParams && selectedScript.adaptableParams.length > 0 && (
                        <Button
                          className="flex-1 gap-2 bg-gradient-to-r from-teal-600 to-blue-600"
                          onClick={handleAdaptToResonance}
                        >
                          <Sparkles className="w-4 h-4" />
                          Adapt to My Resonance
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button
                      className="w-full gap-2 bg-gradient-to-r from-teal-600 to-blue-600"
                      onClick={handleImportPersonalized}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Import Personalized Script
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Advanced Filter Dialog */}
      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent className="bg-[#1a1c20] border-gray-800">
          <DialogHeader>
            <DialogTitle className="text-white">Advanced Filters</DialogTitle>
            <DialogDescription className="text-gray-400">
              Refine your script search with advanced criteria
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Minimum Rating Filter */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-gray-300">Minimum Rating</Label>
                <span className="text-sm text-gray-400">{minRating.toFixed(1)}+ stars</span>
              </div>
              <Slider
                value={[minRating]}
                onValueChange={(value) => setMinRating(value[0])}
                min={0}
                max={5}
                step={0.1}
                className="w-full"
              />
            </div>

            {/* Saved Only Toggle */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-gray-300">Favorites Only</Label>
                <p className="text-sm text-gray-500">Show only saved scripts</p>
              </div>
              <Switch
                checked={showSavedOnly}
                onCheckedChange={setShowSavedOnly}
              />
            </div>

            {/* Active Filters Summary */}
            <div className="pt-4 border-t border-gray-800">
              <p className="text-xs text-gray-500 mb-2">Active Filters:</p>
              <div className="flex flex-wrap gap-2">
                {selectedCategory !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    Category: {categories.find(c => c.id === selectedCategory)?.label}
                  </Badge>
                )}
                {selectedSource !== 'all' && (
                  <Badge variant="secondary" className="text-xs">
                    Source: {selectedSource}
                  </Badge>
                )}
                {minRating > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    Rating: {minRating.toFixed(1)}+
                  </Badge>
                )}
                {showSavedOnly && (
                  <Badge variant="secondary" className="text-xs">
                    Favorites only
                  </Badge>
                )}
                {selectedCategory === 'all' && selectedSource === 'all' && minRating === 0 && !showSavedOnly && (
                  <span className="text-xs text-gray-500">None</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setMinRating(0);
                setShowSavedOnly(false);
                setSelectedCategory('all');
                setSelectedSource('all');
                toast.success('Filters cleared');
              }}
            >
              Clear All
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600"
              onClick={() => {
                setIsFilterDialogOpen(false);
                toast.success('Filters applied');
              }}
            >
              Apply Filters
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* User Preferences Dialog */}
      <UserPreferencesDialog 
        open={isPreferencesDialogOpen}
        onOpenChange={setIsPreferencesDialogOpen}
      />
    </DashboardLayout>
  );
}
