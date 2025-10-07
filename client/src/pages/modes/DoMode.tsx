import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DailyChallengeCard } from '@/components/challenges/DailyChallengeCard';
import { AITaskSuggestions } from '@/components/ai/AITaskSuggestions';
import { mockChallenges } from '@/data/mockChallenges';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { TaskCreationForm } from '@/components/tasks/TaskCreationForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Zap, 
  Plus, 
  Filter, 
  CheckSquare, 
  Circle,
  Flame,
  Trophy,
  Target,
  Play,
  Clock,
  AlertCircle,
  Edit,
  Trash2,
  MoreVertical,
  Search,
  X,
  Bot
} from 'lucide-react';

// Mock data (will connect to real API later)
const mockData = {
  user: {
    energy: 'HIGH',
    energyEmoji: '⚡',
    equippedEmblem: {
      name: 'Phoenix Flame',
      bonus: 25,
      emoji: '🔥'
    }
  },
  stats: {
    completed: 5,
    total: 8,
    pointsToday: 850,
    streak: 14
  },
  perfectTasks: [
    {
      id: 1,
      title: 'Write Q4 Strategy Document',
      description: 'Complete strategic planning for Q4 initiatives',
      priority: 'high',
      energy: 'HIGH',
      basePoints: 150,
      energyBonus: 37,
      dueDate: 'Today',
      tags: ['strategic', 'planning'],
      completed: false
    },
    {
      id: 2,
      title: 'Code Review - Authentication Module',
      description: 'Review PR #234 for security vulnerabilities',
      priority: 'high',
      energy: 'HIGH',
      basePoints: 100,
      energyBonus: 25,
      dueDate: 'Today',
      tags: ['code', 'security'],
      completed: false
    },
    {
      id: 3,
      title: 'Budget Analysis for Marketing',
      description: 'Analyze Q3 marketing spend and ROI',
      priority: 'medium',
      energy: 'HIGH',
      basePoints: 100,
      energyBonus: 25,
      dueDate: 'Tomorrow',
      tags: ['finance', 'analysis'],
      completed: false
    }
  ],
  otherTasks: [
    {
      id: 4,
      title: 'Respond to Client Emails',
      description: '5 pending client inquiries',
      priority: 'low',
      energy: 'LOW',
      basePoints: 20,
      energyBonus: 0,
      dueDate: 'Today',
      tags: ['email', 'communication'],
      completed: false,
      warning: 'Wait for LOW energy'
    },
    {
      id: 5,
      title: 'File Monthly Expenses',
      description: 'Upload receipts and categorize',
      priority: 'low',
      energy: 'LOW',
      basePoints: 20,
      energyBonus: 0,
      dueDate: 'Friday',
      tags: ['admin', 'finance'],
      completed: false,
      warning: 'Wait for LOW energy'
    },
    {
      id: 6,
      title: 'Update Documentation',
      description: 'Add new API endpoints to docs',
      priority: 'medium',
      energy: 'MEDIUM',
      basePoints: 60,
      energyBonus: 0,
      dueDate: 'Next Week',
      tags: ['documentation'],
      completed: false,
      warning: 'Better at MEDIUM energy'
    }
  ],
  scripts: [
    { id: 1, name: 'Morning Routine', icon: '🌅', tasks: 5 },
    { id: 2, name: 'End of Day', icon: '🌙', tasks: 4 },
    { id: 3, name: 'Focus Session', icon: '🎯', tasks: 3 },
    { id: 4, name: 'Weekly Review', icon: '📊', tasks: 8 }
  ],
  achievements: [
    { title: 'Early Bird', description: '3 tasks before 9am', progress: 66 },
    { title: 'Power Hour', description: 'Complete 5 tasks in 1 hour', progress: 80 }
  ]
};

export function DoMode() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loadTime] = useState(performance.now());
  const [activeTab, setActiveTab] = useState<'tasks' | 'challenges'>('tasks');

  // Fetch real tasks from backend with timeout protection
  const { data: backendTasks, isLoading, error, refetch } = useQuery({
    queryKey: ['tasks'],
    queryFn: async () => {
      console.log('🔄 Fetching tasks from backend...');
      try {
        const response = await Promise.race([
          api.get('/tasks'),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Backend timeout')), 15000)
          )
        ]);
        console.log('✅ Backend response:', response);
        const tasks = response.data?.data || response.data || [];
        console.log(`📦 Received ${tasks.length} tasks from backend`);
        return tasks;
      } catch (err: any) {
        console.error('❌ Failed to fetch tasks:', err.message || err);
        throw err;
      }
    },
    retry: 1,
    staleTime: 30000, // 30 seconds
    enabled: true, // Enable backend queries for real data
  });

  // Hybrid approach: Use backend tasks if available, otherwise use mock + local storage
  const tasksFromBackend = backendTasks || [];
  const [localTasks, setLocalTasks] = useState(() => {
    try {
      const saved = localStorage.getItem('syncscript-local-tasks');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  
  // Combine backend + local tasks, fallback to mock
  const allTasks = tasksFromBackend.length > 0 ? tasksFromBackend : 
                   localTasks.length > 0 ? localTasks : 
                   [...mockData.perfectTasks, ...mockData.otherTasks];
  
  const tasks = allTasks;
  
  // Mutation for completing tasks
  const completeMutation = useMutation({
    mutationFn: async (taskId: string) => {
      await api.patch(`/tasks/${taskId}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Mutation for deleting tasks
  const deleteMutation = useMutation({
    mutationFn: async (taskId: string) => {
      await api.delete(`/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  useEffect(() => {
    const endTime = performance.now();
    console.log(`⚡ DoMode loaded in ${Math.round(endTime - loadTime)}ms`);
    console.log('📊 Query status:', { isLoading, hasError: !!error, backendTaskCount: tasksFromBackend.length, localTaskCount: localTasks.length });
    console.log(tasksFromBackend.length > 0 
      ? `✅ Using REAL backend data (${tasksFromBackend.length} tasks)` 
      : localTasks.length > 0 
      ? `💾 Using LOCAL data (${localTasks.length} tasks) - Backend slow`
      : '📋 Using mock data (no tasks anywhere)'
    );
    if (error) {
      console.error('🔴 Backend error:', error);
    }
  }, [loadTime, tasksFromBackend.length, localTasks.length, isLoading, error]);

  const handleTaskComplete = (taskId: number | string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    console.log(`✅ Task toggled: ${task.title}`);
    
    // Show completion toast
    toast({
      title: task.completed ? `↩️ Task Uncompleted` : `✅ Task Complete!`,
      description: task.completed ? task.title : `+${task.basePoints || 100} points earned`,
      duration: 3000,
    });
    
    // Update local storage for all tasks (both local and backend tasks)
    if (typeof taskId === 'string') {
      const updatedLocalTasks = localTasks.map(t => 
        t.id === taskId ? { ...t, completed: !t.completed } : t
      );
      setLocalTasks(updatedLocalTasks);
      localStorage.setItem('syncscript-local-tasks', JSON.stringify(updatedLocalTasks));
      
      // If it's a backend task (not local), also try to sync to backend
      if (!task.isLocal && !task.completed) {
        completeMutation.mutate(taskId);
      }
    }
    // If it's a mock task (number ID), just update local state (legacy)
    // This will be removed once all tasks are from backend
  };

  const handleDeleteTask = (taskId: number | string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    console.log(`🗑️ Task deleted: ${task.title}`);
    
    // Show deletion toast
    toast({
      title: `🗑️ Task Deleted`,
      description: `${task.title} has been removed`,
      duration: 3000,
    });
    
    // Update local storage for all tasks (both local and backend tasks)
    if (typeof taskId === 'string') {
      const updatedLocalTasks = localTasks.filter(t => t.id !== taskId);
      setLocalTasks(updatedLocalTasks);
      localStorage.setItem('syncscript-local-tasks', JSON.stringify(updatedLocalTasks));
      
      // If it's a backend task (not local), also try to delete from backend
      if (!task.isLocal) {
        deleteMutation.mutate(taskId);
      }
    }
    // If it's a mock task (number ID), just update local state (legacy)
    // This will be removed once all tasks are from backend
  };

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [taskFilter, setTaskFilter] = useState<'all' | 'high' | 'medium' | 'low' | 'completed' | 'pending'>('all');
  const [taskSearch, setTaskSearch] = useState('');

  const handleAddTask = () => {
    console.log('➕ Add new task clicked');
    setEditingTask(null);
    setShowTaskModal(true);
  };

  const handleEditTask = (task: any) => {
    console.log('✏️ Edit task clicked:', task.title);
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const handleAITaskCreated = (suggestion: any) => {
    console.log('🤖 AI task created:', suggestion.title);
    
    // Create task object from AI suggestion
    const newTask = {
      id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: suggestion.title,
      description: suggestion.description,
      priority: suggestion.priority,
      energyLevel: suggestion.energyLevel,
      dueDate: null,
      status: 'PENDING',
      completed: false,
      basePoints: suggestion.priority === 'HIGH' ? 150 : suggestion.priority === 'MEDIUM' ? 100 : 50,
      energyBonus: 0,
      tags: suggestion.tags || [],
      isLocal: true,
      createdAt: new Date().toISOString()
    };

    // Save to local storage immediately
    try {
      const existingTasks = JSON.parse(localStorage.getItem('syncscript-local-tasks') || '[]');
      const updatedTasks = [...existingTasks, newTask];
      localStorage.setItem('syncscript-local-tasks', JSON.stringify(updatedTasks));
      console.log('💾 AI task saved to local storage:', newTask.title);
    } catch (error) {
      console.error('❌ Failed to save AI task to local storage:', error);
    }

    // Update local state
    setLocalTasks(prev => [...prev, newTask]);
  };

  // Helper to normalize task data (backend vs mock vs local)
  const normalizeTask = (task: any) => {
    const isBackendTask = typeof task.id === 'string' && !task.isLocal;
    const isLocalTask = task.isLocal || (typeof task.id === 'string' && localTasks.some(lt => lt.id === task.id));
    return {
      ...task,
      energy: task.energyLevel || task.energy || 'HIGH',
      completed: task.status === 'COMPLETED' || task.completed || false,
      basePoints: task.basePoints || (task.priority === 'HIGH' ? 150 : task.priority === 'MEDIUM' ? 100 : 50),
      energyBonus: task.energyBonus || 0,
      dueDate: task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date',
      tags: task.tags || [],
      description: task.description || '',
      priority: task.priority || 'MEDIUM',
      isBackendTask,
      isLocalTask
    };
  };

  const handleRunScript = (scriptId: number) => {
    const script = mockData.scripts.find(s => s.id === scriptId);
    console.log(`▶️ Running script: ${script?.name}`);
    
    toast({
      title: `🚀 Script Running`,
      description: `${script?.name} - ${script?.description}`,
      duration: 3000,
    });
    // TODO: Execute script
  };

  const handleClaimChallenge = (challengeId: string) => {
    console.log('🎉 Claiming challenge:', challengeId);
    
    const challenge = mockChallenges.find(c => c.id === challengeId);
    if (!challenge) return;

    toast({
      title: `🎉 Challenge Complete!`,
      description: `+${challenge.reward.points} points${challenge.reward.emblem ? ` | ${challenge.reward.emblem.emoji} ${challenge.reward.emblem.name} unlocked!` : ''}`,
      duration: 5000,
    });

    // Remove challenge after claiming
    const challengeIndex = mockChallenges.findIndex(c => c.id === challengeId);
    if (challengeIndex !== -1) {
      mockChallenges.splice(challengeIndex, 1);
      setActiveTab('challenges'); // Force re-render
    }
  };

  const energyColors = {
    LOW: 'bg-red-100 text-red-700 border-red-300',
    MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    HIGH: 'bg-green-100 text-green-700 border-green-300',
    PEAK: 'bg-purple-100 text-purple-700 border-purple-300'
  };

  const priorityColors = {
    low: 'bg-gray-100 text-gray-600',
    medium: 'bg-blue-100 text-blue-600',
    high: 'bg-red-100 text-red-600'
  };

  // Categorize tasks by energy match
  const currentEnergy = mockData.user.energy;
  const perfectTasksFiltered = tasks.filter(t => {
    // For backend tasks, check if energyLevel matches current energy
    if (t.energyLevel) {
      return t.energyLevel === currentEnergy;
    }
    // For mock tasks, use old logic
    return mockData.perfectTasks.some(pt => pt.id === t.id);
  });
  
  const otherTasksFiltered = tasks.filter(t => {
    // For backend tasks, check if energyLevel doesn't match
    if (t.energyLevel) {
      return t.energyLevel !== currentEnergy;
    }
    // For mock tasks, use old logic
    return mockData.otherTasks.some(ot => ot.id === t.id);
  });

  // Enhanced filtering with search and filter options
  const applyFilters = (taskList: any[]) => {
    return taskList.filter(task => {
      const normalized = normalizeTask(task);
      
      // Search filter
      if (taskSearch && !task.title.toLowerCase().includes(taskSearch.toLowerCase()) && 
          !normalized.description.toLowerCase().includes(taskSearch.toLowerCase())) {
        return false;
      }
      
      // Priority filter
      switch (taskFilter) {
        case 'high':
          return normalized.priority === 'HIGH';
        case 'medium':
          return normalized.priority === 'MEDIUM';
        case 'low':
          return normalized.priority === 'LOW';
        case 'completed':
          return normalized.completed;
        case 'pending':
          return !normalized.completed;
        default:
          return true;
      }
    });
  };

  // Apply filters to both task lists
  const filteredPerfectTasks = applyFilters(perfectTasksFiltered);
  const filteredOtherTasks = applyFilters(otherTasksFiltered);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 md:space-y-8 animate-fade-in">
      {/* Hybrid Status Bar */}
      <div className="flex items-center justify-between gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${
            tasksFromBackend.length > 0 ? 'bg-green-500 animate-pulse' : 
            localTasks.length > 0 ? 'bg-blue-500 animate-pulse' : 
            'bg-orange-500'
          }`}></div>
          <div className="text-sm">
            <span className="font-semibold text-gray-900 dark:text-white">
              {isLoading ? '🔄 Loading tasks...' : 
               tasksFromBackend.length > 0 ? `✅ ${tasksFromBackend.length} tasks from backend` : 
               localTasks.length > 0 ? `💾 ${localTasks.length} tasks from local storage` : 
               '📋 Using mock data'}
            </span>
            {error && <span className="text-red-600 dark:text-red-400 ml-2">• Backend offline</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => {
              console.log('🔄 Manual refresh triggered');
              refetch();
              toast({
                title: '🔄 Refreshing tasks...',
                description: 'Fetching latest from backend',
                duration: 2000,
              });
            }}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <span className="text-lg">🔄</span>
            Refresh
          </Button>
          <Button 
            onClick={() => {
              localStorage.removeItem('syncscript-local-tasks');
              setLocalTasks([]);
              toast({
                title: '🗑️ Local tasks cleared',
                description: 'All local tasks removed',
                duration: 2000,
              });
            }}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            <span className="text-lg">🗑️</span>
            Clear Local
          </Button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 p-4 bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search tasks..."
            value={taskSearch}
            onChange={(e) => setTaskSearch(e.target.value)}
            className="pl-10 pr-10"
          />
          {taskSearch && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTaskSearch('')}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'all', label: 'All', count: tasks.length },
            { key: 'high', label: 'High', count: tasks.filter(t => normalizeTask(t).priority === 'HIGH').length },
            { key: 'medium', label: 'Medium', count: tasks.filter(t => normalizeTask(t).priority === 'MEDIUM').length },
            { key: 'low', label: 'Low', count: tasks.filter(t => normalizeTask(t).priority === 'LOW').length },
            { key: 'completed', label: 'Done', count: tasks.filter(t => normalizeTask(t).completed).length },
            { key: 'pending', label: 'Pending', count: tasks.filter(t => !normalizeTask(t).completed).length }
          ].map(filter => (
            <Button
              key={filter.key}
              variant={taskFilter === filter.key ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTaskFilter(filter.key as any)}
              className="gap-2"
            >
              <Filter className="w-3 h-3" />
              {filter.label}
              <Badge variant="secondary" className="text-xs">
                {filter.count}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Energy Status Bar */}
      <div 
        className="relative overflow-hidden rounded-2xl p-6 md:p-8 text-white shadow-2xl"
        style={{ backgroundImage: 'linear-gradient(to bottom right, rgb(34 197 94), rgb(16 185 129), rgb(20 184 166))' }}
      >
        <div className="absolute inset-0 bg-black/10"></div>
        
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
              <Zap className="w-10 h-10" />
              Do — Pure Execution
            </h1>
            <p className="text-white/90 text-base md:text-lg mb-3">
              Your energy: {mockData.user.energy} {mockData.user.energyEmoji} • Perfect for {filteredPerfectTasks.length} tasks below
            </p>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <Trophy className="w-4 h-4" />
                <span className="font-semibold">{mockData.stats.pointsToday} pts today</span>
              </div>
              <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <CheckSquare className="w-4 h-4" />
                <span className="font-semibold">{mockData.stats.completed}/{mockData.stats.total} done</span>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={handleAddTask}
            className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-white/30 text-white text-base md:text-lg px-6 py-6 shadow-xl hover:shadow-2xl transition-all duration-300"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Tabs: Tasks vs Challenges */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-6">
        <TabsList className="grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="tasks" className="data-[state=active]:bg-green-500 data-[state=active]:text-white">
            <CheckSquare className="w-4 h-4 mr-2" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="challenges" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
            <Trophy className="w-4 h-4 mr-2" />
            Challenges ({mockChallenges.length})
          </TabsTrigger>
          <TabsTrigger value="ai" className="data-[state=active]:bg-purple-500 data-[state=active]:text-white">
            <Bot className="w-4 h-4 mr-2" />
            AI Assistant
          </TabsTrigger>
        </TabsList>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Tasks - Takes 3 columns */}
            <div className="lg:col-span-3 space-y-6">
          {/* Perfect For You Right Now */}
          <Card className="border-none shadow-xl bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader className="bg-gradient-to-r from-green-100 to-emerald-100 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <Flame className="w-6 h-6 text-green-600" />
                    Perfect For You Right Now
                  </CardTitle>
                  <CardDescription className="text-gray-700 font-medium">
                    {filteredPerfectTasks.length} tasks matched to your {mockData.user.energy} energy
                  </CardDescription>
                </div>
                <Badge className="bg-green-600 text-white px-3 py-1">
                  {mockData.user.equippedEmblem.emoji} +{mockData.user.equippedEmblem.bonus}% bonus
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {filteredPerfectTasks.map((task) => {
                  const normalized = normalizeTask(task);
                  return (
                  <div 
                    key={task.id}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer group ${
                      normalized.completed 
                        ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-60' 
                        : 'bg-white dark:bg-slate-800 border-green-300 dark:border-green-700 hover:border-green-500 hover:shadow-lg'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <Checkbox 
                        checked={normalized.completed}
                        onCheckedChange={() => handleTaskComplete(task.id)}
                        className="mt-1 h-5 w-5"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className={`font-semibold text-lg ${
                              normalized.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white group-hover:text-green-600'
                            }`}>
                              {task.title}
                            </h3>
                            {normalized.isBackendTask && (
                              <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs border border-green-300 dark:border-green-600">
                                Backend
                              </Badge>
                            )}
                            {task.isLocal && (
                              <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs border border-blue-300 dark:border-blue-600">
                                Local
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`${energyColors[normalized.energy]} border shrink-0`}>
                              {normalized.energy}
                            </Badge>
                            {typeof task.id === 'string' && (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditTask(task);
                                  }}
                                  className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                                >
                                  <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTask(task.id);
                                  }}
                                  className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/30"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {normalized.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{normalized.description}</p>
                        )}
                        
                        <div className="flex items-center gap-3 flex-wrap text-sm">
                          <div className="flex items-center gap-1.5 font-semibold text-green-600 dark:text-green-400">
                            <Trophy className="w-4 h-4" />
                            <span>{normalized.basePoints} pts</span>
                            {normalized.energyBonus > 0 && (
                              <span className="text-emerald-600 dark:text-emerald-400">+{normalized.energyBonus} energy bonus</span>
                            )}
                          </div>
                          
                          <Badge variant="outline" className={priorityColors[normalized.priority]}>
                            {normalized.priority}
                          </Badge>
                          
                          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="text-xs">{normalized.dueDate}</span>
                          </div>
                          
                          {normalized.tags.map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Other Tasks */}
          <Card className="border-none shadow-xl">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <Circle className="w-6 h-6 text-gray-600" />
                    All Other Tasks
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    {otherTasksFiltered.length} tasks • Not matched to current energy
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {filteredOtherTasks.map((task) => {
                  const normalized = normalizeTask(task);
                  return (
                  <div 
                    key={task.id}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      normalized.completed 
                        ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-60' 
                        : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-gray-700 hover:border-gray-300 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <Checkbox 
                        checked={normalized.completed}
                        onCheckedChange={() => handleTaskComplete(task.id)}
                        className="mt-1 h-5 w-5"
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className={`font-semibold ${
                              normalized.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'
                            }`}>
                              {task.title}
                            </h3>
                            {normalized.isBackendTask && (
                              <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs border border-green-300 dark:border-green-600">
                                Backend
                              </Badge>
                            )}
                            {task.isLocal && (
                              <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs border border-blue-300 dark:border-blue-600">
                                Local
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={`${energyColors[normalized.energy]} border shrink-0`}>
                              {normalized.energy}
                            </Badge>
                            {typeof task.id === 'string' && (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditTask(task);
                                  }}
                                  className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                                >
                                  <Edit className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteTask(task.id);
                                  }}
                                  className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/30"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {normalized.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{normalized.description}</p>
                        )}
                        
                        {task.warning && (
                          <div className="flex items-center gap-2 mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg border border-yellow-200 dark:border-yellow-700">
                            <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 shrink-0" />
                            <span className="text-sm text-yellow-700 dark:text-yellow-300">{task.warning}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-3 flex-wrap text-sm">
                          <div className="flex items-center gap-1.5 font-medium text-gray-600 dark:text-gray-400">
                            <Trophy className="w-4 h-4" />
                            <span>{normalized.basePoints} pts</span>
                          </div>
                          
                          <Badge variant="outline" className={priorityColors[normalized.priority]}>
                            {normalized.priority}
                          </Badge>
                          
                          <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                            <Clock className="w-3.5 h-3.5" />
                            <span className="text-xs">{normalized.dueDate}</span>
                          </div>
                          
                          {normalized.tags.map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Takes 1 column */}
        <div className="space-y-6">
          {/* Quick Scripts */}
          <Card className="border-none shadow-xl bg-gradient-to-br from-purple-50 to-pink-50">
            <CardHeader className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Target className="w-5 h-5 text-purple-600" />
                Quick Scripts
              </CardTitle>
              <CardDescription className="text-gray-600">
                One-tap workflows
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {mockData.scripts.map((script) => (
                  <Button
                    key={script.id}
                    onClick={() => handleRunScript(script.id)}
                    variant="outline"
                    className="w-full justify-start h-auto py-3 hover:bg-purple-50 hover:border-purple-300 transition-all"
                  >
                    <span className="text-2xl mr-3">{script.icon}</span>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-gray-900">{script.name}</div>
                      <div className="text-xs text-gray-500">{script.tasks} tasks</div>
                    </div>
                    <Play className="w-4 h-4 text-purple-600" />
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Today's Progress */}
          <Card className="border-none shadow-xl bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardHeader className="bg-gradient-to-r from-blue-100 to-cyan-100 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Trophy className="w-5 h-5 text-blue-600" />
                Today's Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="text-center p-4 bg-white rounded-lg">
                  <div className="text-4xl font-bold text-blue-600 mb-1">
                    {mockData.stats.pointsToday}
                  </div>
                  <div className="text-sm text-gray-600">Points Earned</div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Tasks Completed</span>
                    <span className="font-bold text-gray-900">
                      {mockData.stats.completed}/{mockData.stats.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-500"
                      style={{ width: `${(mockData.stats.completed / mockData.stats.total) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Achievements Progress */}
          <Card className="border-none shadow-xl bg-gradient-to-br from-amber-50 to-yellow-50">
            <CardHeader className="bg-gradient-to-r from-amber-100 to-yellow-100 rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-gray-900">
                <Flame className="w-5 h-5 text-amber-600" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {mockData.achievements.map((achievement, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-900 text-sm">
                          {achievement.title}
                        </div>
                        <div className="text-xs text-gray-600">
                          {achievement.description}
                        </div>
                      </div>
                      <div className="text-sm font-bold text-amber-600">
                        {achievement.progress}%
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full transition-all duration-500"
                        style={{ width: `${achievement.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TabsContent>

    {/* Challenges Tab */}
    <TabsContent value="challenges" className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockChallenges.map(challenge => (
          <DailyChallengeCard
            key={challenge.id}
            challenge={challenge}
            onClaim={handleClaimChallenge}
          />
        ))}
      </div>
      
      {mockChallenges.length === 0 && (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Trophy className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">All Challenges Completed!</h3>
            <p className="text-gray-600">Check back tomorrow for new challenges</p>
          </CardContent>
        </Card>
      )}
    </TabsContent>

    {/* AI Assistant Tab */}
    <TabsContent value="ai" className="space-y-6">
      <AITaskSuggestions onTaskCreated={handleAITaskCreated} />
    </TabsContent>
  </Tabs>

      {/* Task Creation Modal */}
      <Dialog open={showTaskModal} onOpenChange={setShowTaskModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-900 dark:text-white">
              {editingTask ? 'Edit Task' : 'Create New Task'}
            </DialogTitle>
            <DialogDescription className="text-gray-600 dark:text-gray-400">
              {editingTask 
                ? 'Update your task details. Changes are saved locally and synced to the backend when available.'
                : 'Add a new task to your productivity workflow. Tasks are saved locally and synced to the backend when available.'
              }
            </DialogDescription>
          </DialogHeader>
          <TaskCreationForm
            editingTask={editingTask}
            onSuccess={() => {
              setShowTaskModal(false);
              setEditingTask(null);
              // Refresh local tasks
              const saved = localStorage.getItem('syncscript-local-tasks');
              if (saved) {
                setLocalTasks(JSON.parse(saved));
              }
            }}
            onCancel={() => {
              setShowTaskModal(false);
              setEditingTask(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
