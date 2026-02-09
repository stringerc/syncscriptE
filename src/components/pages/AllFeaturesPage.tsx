import { useState } from 'react';
import { 
  LayoutDashboard, Target, Calendar, Bot, Zap, Users, TrendingUp, 
  Gamepad2, Link2, Building2, FileText, Settings, Clock, Brain,
  CheckCircle2, Sparkles, Shield, Rocket, Heart, Code, Globe,
  Search, Filter, Star, ChevronRight, Lock
} from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import { useNavigate } from 'react-router';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Card } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { navigationLinks } from '../../utils/navigation';

interface Feature {
  id: string;
  name: string;
  description: string;
  icon: typeof LayoutDashboard;
  category: 'core' | 'productivity' | 'collaboration' | 'advanced' | 'integrations';
  status: 'active' | 'beta' | 'coming-soon' | 'pro';
  path?: string;
  popular?: boolean;
  new?: boolean;
}

export function AllFeaturesPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'active' | 'coming-soon'>('active');

  const features: Feature[] = [
    // Core Features
    {
      id: 'dashboard',
      name: 'Dashboard',
      description: 'Your central command center with AI insights and daily orchestration',
      icon: LayoutDashboard,
      category: 'core',
      status: 'active',
      path: navigationLinks.sidebar.dashboard,
      popular: true
    },
    {
      id: 'tasks-goals',
      name: 'Tasks & Goals',
      description: 'Smart task management with goal tracking and resonance scoring',
      icon: Target,
      category: 'core',
      status: 'active',
      path: navigationLinks.sidebar.tasks,
      popular: true
    },
    {
      id: 'calendar',
      name: 'Calendar & Events',
      description: 'Intelligent scheduling with time blocking and phase alignment',
      icon: Calendar,
      category: 'core',
      status: 'active',
      path: navigationLinks.sidebar.calendar
    },
    {
      id: 'energy-focus',
      name: 'Energy & Focus',
      description: 'Track your energy levels and optimize focus windows',
      icon: Zap,
      category: 'productivity',
      status: 'active',
      path: navigationLinks.sidebar.energy,
      new: true
    },

    // Productivity Features
    {
      id: 'ai-assistant',
      name: 'AI Assistant',
      description: 'Your intelligent companion for task suggestions and insights',
      icon: Bot,
      category: 'productivity',
      status: 'active',
      path: navigationLinks.sidebar.ai,
      popular: true
    },
    {
      id: 'analytics',
      name: 'Analytics & Insights',
      description: 'Deep dive into your productivity patterns and trends',
      icon: TrendingUp,
      category: 'productivity',
      status: 'active',
      path: navigationLinks.sidebar.analytics
    },
    {
      id: 'gamification',
      name: 'Gamification Hub',
      description: 'Level up with achievements, streaks, and rewards',
      icon: Gamepad2,
      category: 'productivity',
      status: 'active',
      path: navigationLinks.sidebar.gamification,
      popular: true
    },
    {
      id: 'scripts',
      name: 'Scripts & Templates',
      description: 'Automate workflows with custom scripts and pre-built templates',
      icon: FileText,
      category: 'productivity',
      status: 'active',
      path: navigationLinks.sidebar.scripts
    },

    // Collaboration
    {
      id: 'team',
      name: 'Team Collaboration',
      description: 'Real-time collaboration with shared workspaces and chat',
      icon: Users,
      category: 'collaboration',
      status: 'active',
      path: navigationLinks.sidebar.team
    },
    {
      id: 'enterprise',
      name: 'Enterprise Tools',
      description: 'Advanced features for organizations and large teams',
      icon: Building2,
      category: 'collaboration',
      status: 'pro',
      path: navigationLinks.sidebar.enterprise
    },

    // Integrations
    {
      id: 'integrations',
      name: 'Integrations',
      description: 'Connect with your favorite apps and services',
      icon: Link2,
      category: 'integrations',
      status: 'active',
      path: navigationLinks.sidebar.integrations
    },

    // Advanced Features
    {
      id: 'resonance',
      name: 'Resonance Engine',
      description: 'AI-powered task harmony and phase alignment optimization',
      icon: Sparkles,
      category: 'advanced',
      status: 'beta',
      new: true
    },
    {
      id: 'circadian',
      name: 'Circadian Optimization',
      description: 'Learn your natural rhythms and optimize task scheduling',
      icon: Clock,
      category: 'advanced',
      status: 'beta',
      new: true
    },
    {
      id: 'flow-tracking',
      name: 'Flow State Tracking',
      description: 'Monitor and maximize your deep work sessions',
      icon: Brain,
      category: 'advanced',
      status: 'active'
    },
    {
      id: 'habit-builder',
      name: 'Habit Builder',
      description: 'Build lasting habits with science-backed techniques',
      icon: Heart,
      category: 'productivity',
      status: 'active'
    },
    {
      id: 'api-access',
      name: 'API Access',
      description: 'Build custom integrations with our developer API',
      icon: Code,
      category: 'integrations',
      status: 'pro'
    },
    {
      id: 'global-timezone',
      name: 'Global Timezone Support',
      description: 'Seamlessly work across multiple timezones',
      icon: Globe,
      category: 'collaboration',
      status: 'active'
    },
    {
      id: 'security',
      name: 'Advanced Security',
      description: 'Enterprise-grade encryption and compliance',
      icon: Shield,
      category: 'advanced',
      status: 'pro'
    },
    {
      id: 'automation',
      name: 'Advanced Automation',
      description: 'Create complex workflows with conditional logic',
      icon: Rocket,
      category: 'advanced',
      status: 'beta'
    }
  ];

  const categories = [
    { id: 'all', label: 'All Features', count: features.length },
    { id: 'core', label: 'Core', count: features.filter(f => f.category === 'core').length },
    { id: 'productivity', label: 'Productivity', count: features.filter(f => f.category === 'productivity').length },
    { id: 'collaboration', label: 'Collaboration', count: features.filter(f => f.category === 'collaboration').length },
    { id: 'advanced', label: 'Advanced', count: features.filter(f => f.category === 'advanced').length },
    { id: 'integrations', label: 'Integrations', count: features.filter(f => f.category === 'integrations').length }
  ];

  const filteredFeatures = features.filter(feature => {
    const matchesSearch = feature.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         feature.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || feature.category === selectedCategory;
    const matchesStatus = activeTab === 'active' ? feature.status !== 'coming-soon' : feature.status === 'coming-soon';
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusBadge = (status: Feature['status']) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="border-green-500/50 text-green-400">Active</Badge>;
      case 'beta':
        return <Badge variant="outline" className="border-blue-500/50 text-blue-400">Beta</Badge>;
      case 'coming-soon':
        return <Badge variant="outline" className="border-amber-500/50 text-amber-400">Coming Soon</Badge>;
      case 'pro':
        return <Badge variant="outline" className="border-purple-500/50 text-purple-400 gap-1">
          <Lock className="w-3 h-3" /> Pro
        </Badge>;
    }
  };

  return (
    <div className="h-full overflow-hidden">
      <motion.div
        className="p-6 h-full overflow-y-auto hide-scrollbar"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl text-white mb-2">All Features</h1>
              <p className="text-gray-400">Explore everything SyncScript has to offer</p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="gap-2 text-white">
                <CheckCircle2 className="w-3 h-3 text-green-400" />
                {features.filter(f => f.status === 'active').length} Active
              </Badge>
              <Badge variant="outline" className="gap-2 text-white">
                <Sparkles className="w-3 h-3 text-blue-400" />
                {features.filter(f => f.new).length} New
              </Badge>
            </div>
          </div>
        </div>

        {/* Search and Quick Stats */}
        <div className="mb-6 space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search features..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-[#1e2128] border-gray-800"
              />
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 flex-wrap">
            {categories.map((cat) => (
              <Badge
                key={cat.id}
                variant={selectedCategory === cat.id ? 'default' : 'outline'}
                className={`cursor-pointer hover:bg-white/5 transition-colors text-white ${
                  selectedCategory === cat.id ? 'bg-teal-600 border-teal-600' : ''
                }`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                {cat.label} ({cat.count})
              </Badge>
            ))}
          </div>
        </div>

        {/* Popular Features Highlight */}
        {selectedCategory === 'all' && !searchQuery && (
          <div className="mb-6">
            <h2 className="text-white text-xl mb-4 flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              Popular Features
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {features.filter(f => f.popular).slice(0, 3).map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <motion.div
                    key={feature.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className="bg-gradient-to-br from-purple-600/10 to-blue-600/10 border-purple-600/30 p-4 cursor-pointer hover:scale-[1.02] transition-transform"
                      onClick={() => {
                        if (feature.path) {
                          navigate(feature.path);
                        } else {
                          toast.info(feature.name, { description: 'Feature details' });
                        }
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-white font-medium mb-1">{feature.name}</h3>
                          <p className="text-sm text-gray-400 line-clamp-2">{feature.description}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* All Features Grid */}
        <div>
          <h2 className="text-white text-xl mb-4">
            {selectedCategory === 'all' ? 'All Features' : categories.find(c => c.id === selectedCategory)?.label}
            <span className="text-gray-500 ml-2">({filteredFeatures.length})</span>
          </h2>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredFeatures.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <Card 
                    className={`bg-[#1e2128] border-gray-800 p-5 hover:border-teal-600/50 transition-all cursor-pointer group h-full ${
                      feature.status === 'pro' ? 'opacity-75' : ''
                    }`}
                    onClick={() => {
                      if (feature.status === 'pro') {
                        toast.info('Pro Feature', { description: 'Upgrade to access this feature' });
                      } else if (feature.status === 'coming-soon') {
                        toast.info('Coming Soon', { description: 'This feature is in development' });
                      } else if (feature.path) {
                        navigate(feature.path);
                      } else {
                        toast.info(feature.name, { description: feature.description });
                      }
                    }}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-12 h-12 bg-gradient-to-br ${
                        feature.status === 'pro' ? 'from-purple-600 to-pink-600' :
                        feature.category === 'core' ? 'from-teal-600 to-cyan-600' :
                        feature.category === 'productivity' ? 'from-blue-600 to-indigo-600' :
                        feature.category === 'collaboration' ? 'from-green-600 to-emerald-600' :
                        feature.category === 'advanced' ? 'from-amber-600 to-orange-600' :
                        'from-purple-600 to-pink-600'
                      } rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="text-white font-medium line-clamp-1">{feature.name}</h3>
                          {feature.new && (
                            <Badge variant="outline" className="border-green-500/50 text-green-400 text-xs shrink-0">
                              New
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 line-clamp-2 mb-3">{feature.description}</p>
                        <div className="flex items-center justify-between">
                          {getStatusBadge(feature.status)}
                          {feature.path && feature.status === 'active' && (
                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-teal-400 group-hover:translate-x-1 transition-all" />
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {filteredFeatures.length === 0 && (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-white text-xl mb-2">No features found</h3>
              <p className="text-gray-400">Try a different search term or category</p>
            </div>
          )}
        </div>

      </motion.div>
    </div>
  );
}