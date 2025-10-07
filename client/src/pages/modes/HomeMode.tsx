import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TrendingUp, Zap, Trophy, Clock, Bot, Target, Calendar, CheckSquare, Plus, ArrowRight, Flame, Sparkles, Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EnergySelector } from '@/components/energy/EnergySelector';
import { EmblemGalleryModal } from '@/components/emblems/EmblemGalleryModal';
import { DailyChallengeCard } from '@/components/challenges/DailyChallengeCard';
import { WeeklyProgressSummary } from '@/components/dashboard/WeeklyProgressSummary';
import { AdvancedAnalytics } from '@/components/analytics/AdvancedAnalytics';
import { api } from '@/lib/api';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { mockChallenges, getActiveChallenges } from '@/data/mockChallenges';
// Connected to real backend APIs

// Mock data (will connect to real API later)
const mockData = {
  user: {
    name: 'Test User',
    energy: 'HIGH',
    energyEmoji: '⚡',
    streak: 14,
    equippedEmblem: {
      name: 'Phoenix Flame',
      bonus: 25,
      emoji: '🔥'
    }
  },
  stats: {
    pointsToday: 850,
    energyBonus: 25,
    tasksCompleted: 5,
    tasksTotal: 8,
    streak: 14
  },
  tasks: {
    doNow: [
      { id: 1, title: 'Write Q4 Strategy', priority: 'high', points: 150, energy: 'PEAK' },
      { id: 2, title: 'Code Review Sprint', priority: 'medium', points: 100, energy: 'HIGH' },
      { id: 3, title: 'Budget Analysis', priority: 'high', points: 150, energy: 'HIGH' }
    ],
    doLater: [
      { id: 4, title: 'Respond to emails', priority: 'low', points: 20, energy: 'LOW' },
      { id: 5, title: 'File expenses', priority: 'low', points: 20, energy: 'LOW' }
    ]
  },
  insights: [
    {
      icon: '🎯',
      title: 'Peak Performance',
      message: 'You peak at 10am daily. Schedule hard work then.',
      type: 'success'
    },
    {
      icon: '🔥',
      title: 'Streak Power',
      message: '14-day streak! Keep logging energy to unlock Sunrise Keeper.',
      type: 'warning'
    },
    {
      icon: '📊',
      title: 'On Track',
      message: 'Budget 85% healthy. Great job this month!',
      type: 'info'
    }
  ],
  upcoming: [
    { time: '10:00 AM', title: 'Team Meeting', duration: '30 min', type: 'meeting' },
    { time: '11:00 AM', title: 'Focus Block - Write Proposal', duration: '90 min', type: 'focus' },
    { time: '12:30 PM', title: 'Lunch', duration: '30 min', type: 'break' }
  ],
  emblems: [
    { name: "Dragon's Breath", progress: 85, rarity: 'epic', emoji: '🐉' },
    { name: 'Sunrise Keeper', progress: 93, rarity: 'rare', emoji: '🌅' }
  ],
  challenge: {
    title: "Peak Performance",
    description: "Complete 3 tasks at PEAK or HIGH energy",
    progress: 80,
    reward: "Thunder Storm emblem (EPIC) 🌩️"
  }
};

// Mock emblems for gallery
const mockEmblems: any[] = [
  { id: '1', name: 'Genesis Spark', emoji: '💫', rarity: 'common', description: 'First energy log', bonusType: 'points_multiplier', bonusValue: 5, isUnlocked: true, isEquipped: false, progress: 100 },
  { id: '2', name: 'Phoenix Flame', emoji: '🔥', rarity: 'legendary', description: 'Complete 3 challenges in one day', bonusType: 'points_multiplier', bonusValue: 50, isUnlocked: true, isEquipped: true, progress: 100 },
  { id: '3', name: 'Dragon\'s Breath', emoji: '🐉', rarity: 'epic', description: '30-day streak', bonusType: 'points_multiplier', bonusValue: 40, isUnlocked: false, isEquipped: false, progress: 85 },
  { id: '4', name: 'Sunrise Keeper', emoji: '🌄', rarity: 'rare', description: 'Log energy at sunrise 14 days', bonusType: 'energy_boost', bonusValue: 15, isUnlocked: false, isEquipped: false, progress: 93 },
  { id: '5', name: 'Cosmic Nexus', emoji: '🌌', rarity: 'legendary', description: 'Reach Level 25', bonusType: 'points_multiplier', bonusValue: 60, isUnlocked: false, isEquipped: false, progress: 40 },
  { id: '6', name: 'Zen Master', emoji: '🧘', rarity: 'rare', description: 'Perfect balance across domains', bonusType: 'energy_boost', bonusValue: 20, isUnlocked: false, isEquipped: false, progress: 60 }
];

export function HomeMode() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [loadTime] = useState(performance.now());
  const [showEmblemGallery, setShowEmblemGallery] = useState(false);
  const [showEnergySelector, setShowEnergySelector] = useState(false);
  const [isSavingEnergy, setIsSavingEnergy] = useState(false);

  // Fetch dashboard data from backend with fallback to mock data
  const { data: backendDashboard, isLoading: dashboardLoading, error: dashboardError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      console.log('🏠 Fetching dashboard from backend...');
      try {
        const response = await Promise.race([
          api.get('/user/dashboard'),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Backend timeout')), 15000)
          )
        ]);
        console.log('✅ Backend dashboard response:', response);
        const dashboard = response.data?.data || response.data || {};
        console.log(`📦 Received dashboard data from backend`);
        return dashboard;
      } catch (err: any) {
        if (import.meta.env.MODE === 'development') {
          console.log('ℹ️ Dashboard: Using mock data (backend unavailable)');
        }
        throw err;
      }
    },
    retry: 1,
    staleTime: 30000, // 30 seconds
    enabled: true, // Enable backend queries for real data
  });

  // Fetch gamification data from backend with fallback to mock data
  const { data: backendGamification, isLoading: gamificationLoading, error: gamificationError } = useQuery({
    queryKey: ['gamification', 'summary'],
    queryFn: async () => {
      console.log('🎮 Fetching gamification from backend...');
      try {
        const response = await Promise.race([
          api.get('/gamification/summary'),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Backend timeout')), 15000)
          )
        ]);
        console.log('✅ Backend gamification response:', response);
        const gamification = response.data?.data || response.data || {};
        console.log(`📦 Received gamification data from backend`);
        return gamification;
      } catch (err: any) {
        if (import.meta.env.MODE === 'development') {
          console.log('ℹ️ Gamification: Using mock data (backend unavailable)');
        }
        throw err;
      }
    },
    retry: 1,
    staleTime: 30000, // 30 seconds
    enabled: true, // Enable backend queries for real data
  });

  // Use backend data if available, otherwise fall back to mock data
  const dashboardData = backendDashboard || mockData;
  const gamificationData = backendGamification || mockData;
  const emblemData = mockEmblems; // Keep emblems as mock for now
  const emblemLoading = false;
  const emblemError = null;
  const forceShowUI = true; // Always show UI immediately

  // Local state for emblems (for optimistic updates)
  const [emblems, setEmblems] = useState(mockEmblems);
  const [currentEnergy, setCurrentEnergy] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'PEAK'>(mockData.user.energy as any);

  // Update local state when API data loads
  useEffect(() => {
    if (emblemData) {
      setEmblems(emblemData);
    }
  }, [emblemData]);

  useEffect(() => {
    const endTime = performance.now();
    if (import.meta.env.MODE === 'development') {
      console.log(`🏠 HomeMode loaded in ${Math.round(endTime - loadTime)}ms`);
      console.log('📊 Query status:', {
        dashboardLoading,
        gamificationLoading,
        hasDashboardError: !!dashboardError,
        hasGamificationError: !!gamificationError,
        backendDashboardCount: backendDashboard ? 'present' : 'none',
        backendGamificationCount: backendGamification ? 'present' : 'none'
      });
      console.log(backendDashboard
        ? `✅ Using REAL dashboard data from backend`
        : '📋 Using mock dashboard data (no backend data)'
      );
      console.log(backendGamification
        ? `✅ Using REAL gamification data from backend`
        : '📋 Using mock gamification data (no backend data)'
      );
      if (dashboardError) {
        console.log('ℹ️ Dashboard backend unavailable - using mock data');
      }
      if (gamificationError) {
        console.log('ℹ️ Gamification backend unavailable - using mock data');
      }
    }
  }, [loadTime, dashboardLoading, gamificationLoading, dashboardError, gamificationError, backendDashboard, backendGamification]);

  // Transform backend data to match UI format
  const transformedData = dashboardData ? {
    user: {
      name: dashboardData.user?.name || 'User',
      energy: currentEnergy,
      energyEmoji: currentEnergy === 'PEAK' ? '🔥' : currentEnergy === 'HIGH' ? '⚡' : currentEnergy === 'MEDIUM' ? '😐' : '😴',
      streak: dashboardData.activeStreaks?.[0]?.count || 0,
      equippedEmblem: emblems.find(e => e.isEquipped) || null
    },
    stats: {
      pointsToday: dashboardData.stats?.totalPoints || 0,
      energyBonus: emblems.find(e => e.isEquipped)?.bonusValue || 0,
      tasksCompleted: dashboardData.stats?.completedTasks || 0,
      tasksTotal: dashboardData.stats?.totalTasks || 0,
      streak: dashboardData.activeStreaks?.[0]?.count || 0
    },
    tasks: {
      doNow: dashboardData.todayTasks?.slice(0, 3).map(t => ({
        id: t.id,
        title: t.title,
        priority: t.priority?.toLowerCase() || 'medium',
        points: t.priority === 'HIGH' ? 150 : t.priority === 'MEDIUM' ? 100 : 50,
        energy: 'HIGH' // TODO: Get from task metadata
      })) || [],
      doLater: dashboardData.todayTasks?.slice(3, 5).map(t => ({
        id: t.id,
        title: t.title,
        priority: t.priority?.toLowerCase() || 'low',
        points: 20,
        energy: 'LOW'
      })) || []
    },
    insights: mockData.insights, // TODO: Get from AI insights API
    upcoming: dashboardData.upcomingEvents?.map(e => ({
      time: new Date(e.startTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      title: e.title,
      duration: e.endTime ? `${Math.round((new Date(e.endTime).getTime() - new Date(e.startTime).getTime()) / 60000)} min` : '30 min',
      type: 'meeting'
    })) || [],
    emblems: mockData.emblems, // Using mock for now, will enhance later
    challenge: mockData.challenge // TODO: Get from challenges API
  } : mockData;

  // Use transformed data
  const data = transformedData;
  
  // Show loading ONLY on initial load (not on refetch) AND not forced
  const isInitialLoading = false; // Disabled for development - always show content immediately

  const handleTaskClick = (task: any) => {
    console.log('🎯 Task clicked:', task.title);
    navigate('/do');
  };

  const handleAddTask = () => {
    console.log('➕ Add Task clicked');
    navigate('/do');
  };

  const handleViewAllTasks = () => {
    console.log('📋 View All Tasks clicked');
    navigate('/do');
  };

  const handleViewCalendar = () => {
    console.log('📅 View Calendar clicked');
    navigate('/plan');
  };

  const handleViewEmblems = () => {
    console.log('🏆 View Emblems clicked');
    setShowEmblemGallery(true);
  };

  const handleViewEnergyInsights = () => {
    console.log('📊 View Energy Insights clicked');
    navigate('/energy-insights');
  };

  const handleEnergyChange = async (energy: 'LOW' | 'MEDIUM' | 'HIGH' | 'PEAK') => {
    console.log(`⚡ Energy changed to: ${energy}`);
    setCurrentEnergy(energy);
    setShowEnergySelector(false);

    const energyEmoji = energy === 'PEAK' ? '🔥' : energy === 'HIGH' ? '⚡' : energy === 'MEDIUM' ? '😐' : '😴';

    // 🍞 SHOW TOAST IMMEDIATELY (don't wait for API)
    console.log('🍞 Showing toast notification IMMEDIATELY...');
    toast({
      title: "Energy Updated! " + energyEmoji,
      description: `Your ${energy} energy has been set.`,
      duration: 3000,
    });
    console.log('🍞 Toast should be visible now!');

    // Make API call in background (don't block UI)
    setIsSavingEnergy(true);
    api.post('/energy/log', {
      energyLevel: energy,
      mood: energyEmoji
    })
      .then(response => {
        console.log('✅ Energy logged successfully:', response.data);
        queryClient.invalidateQueries({ queryKey: ['energy', 'history'] });
        queryClient.invalidateQueries({ queryKey: ['energy', 'insights'] });
      })
      .catch(error => {
        console.error('❌ Failed to log energy:', error.message);
      })
      .finally(() => {
        setIsSavingEnergy(false);
      });
  };

  const handleEquipEmblem = async (emblemId: string) => {
    const emblem = emblems.find(e => e.id === emblemId);
    console.log(`✅ Equip emblem: ${emblemId}`);
    
    // Update UI immediately (optimistic update)
    setEmblems(prev => prev.map(e => ({
      ...e,
      isEquipped: e.id === emblemId
    })));
    
    // 🍞 SHOW TOAST IMMEDIATELY (don't wait for API)
    console.log('🍞 Showing emblem equipped toast IMMEDIATELY...');
    toast({
      title: `${emblem?.emoji} Emblem Equipped!`,
      description: `${emblem?.name} is now active. +${emblem?.bonusValue}% ${emblem?.bonusType.replace('_', ' ')} bonus!`,
      duration: 4000,
    });
    console.log('🍞 Emblem toast should be visible now!');
    
    // Make API call in background
    api.post('/energy/emblems/equip', { emblemId })
      .then(response => {
        console.log('✅ Emblem equipped successfully:', response.data);
      })
      .catch(error => {
        console.error('❌ Failed to equip emblem:', error.message);
        // Revert on error
        setEmblems(mockEmblems);
      });
  };

  const handleUnequipEmblem = async (emblemId: string) => {
    console.log(`❌ Unequip emblem: ${emblemId}`);
    
    // Update UI immediately
    setEmblems(prev => prev.map(e => ({
      ...e,
      isEquipped: false
    })));
    
    // 🍞 SHOW TOAST IMMEDIATELY
    console.log('🍞 Showing emblem unequipped toast IMMEDIATELY...');
    toast({
      title: "Emblem Unequipped",
      description: "No emblem is currently active.",
      duration: 3000,
    });
    console.log('🍞 Unequip toast should be visible now!');
    
    // Make API call in background
    api.post('/energy/emblems/unequip', { emblemId })
      .then(response => {
        console.log('✅ Emblem unequipped successfully:', response.data);
      })
      .catch(error => {
        console.error('❌ Failed to unequip emblem:', error.message);
        // Revert on error
        setEmblems(mockEmblems);
      });
  };

  const handleClaimChallenge = (challengeId: string) => {
    console.log('🎉 Claiming challenge:', challengeId);
    
    // Find the challenge
    const challenge = mockChallenges.find(c => c.id === challengeId);
    if (!challenge) return;

    // Show celebration toast
    toast({
      title: `🎉 Challenge Complete!`,
      description: `+${challenge.reward.points} points${challenge.reward.emblem ? ` | ${challenge.reward.emblem.emoji} ${challenge.reward.emblem.name} unlocked!` : ''}`,
      duration: 5000,
    });

    // Mark challenge as claimed (remove from list by setting completed to false)
    // In real implementation, this would call the API and update state
    const challengeIndex = mockChallenges.findIndex(c => c.id === challengeId);
    if (challengeIndex !== -1) {
      // Remove from mock data (simulate claiming)
      mockChallenges.splice(challengeIndex, 1);
      // Force re-render
      setCurrentEnergy(prev => prev); // Trigger state update
    }

    // TODO: Make API call to claim rewards
    // api.post('/challenges/claim', { challengeId })
    //   .then(() => queryClient.invalidateQueries(['challenges']))
  };

  // Use current energy state (updates when user changes it)
  const userEnergy = currentEnergy;

  // Explicit gradient with inline styles (prevents CSS loading conflicts)
  const getEnergyStyles = () => {
    switch (userEnergy) {
      case 'PEAK':
        return { backgroundImage: 'linear-gradient(to bottom right, rgb(168 85 247), rgb(236 72 153), rgb(249 115 22))' };
      case 'HIGH':
        return { backgroundImage: 'linear-gradient(to bottom right, rgb(34 197 94), rgb(16 185 129), rgb(20 184 166))' };
      case 'MEDIUM':
        return { backgroundImage: 'linear-gradient(to bottom right, rgb(234 179 8), rgb(245 158 11), rgb(249 115 22))' };
      case 'LOW':
        return { backgroundImage: 'linear-gradient(to bottom right, rgb(239 68 68), rgb(249 115 22), rgb(234 179 8))' };
      default:
        return { backgroundImage: 'linear-gradient(to bottom right, rgb(34 197 94), rgb(16 185 129), rgb(20 184 166))' };
    }
  };

  // Show loading state ONLY on initial load
  if (isInitialLoading) {
    return (
      <div className="container mx-auto p-4 md:p-6 space-y-6 md:space-y-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-gray-600 text-lg">Loading your command center...</p>
            <p className="text-gray-400 text-sm">This should only take a moment...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 md:space-y-8 animate-fade-in">
      {/* Energy Hero Section */}
      <div 
        className="relative overflow-hidden rounded-2xl p-6 md:p-8 text-white shadow-2xl"
        style={getEnergyStyles()}
      >
        <div className="absolute inset-0 bg-black/10"></div>
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-white/80 text-sm mb-2">
                <Clock className="w-4 h-4" />
                <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
                <span className="text-5xl">
                  {userEnergy === 'PEAK' ? '🔥' : userEnergy === 'HIGH' ? '⚡' : userEnergy === 'MEDIUM' ? '😐' : '😴'}
                </span>
                Your Energy: {userEnergy}
              </h1>
              <div className="flex items-center gap-3 mb-4">
                <p className="text-white/90 text-base md:text-lg">
                  {(() => {
                    const equipped = emblems.find(e => e.isEquipped);
                    return equipped 
                      ? `Equipped: ${equipped.emoji} ${equipped.name} (+${equipped.bonusValue}% bonus)`
                      : 'No emblem equipped';
                  })()}
                </p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => setShowEnergySelector(true)}
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-white/30 text-white text-sm"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Change Energy
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleViewEnergyInsights}
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-white/30 text-white text-sm"
                  >
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Insights
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                  <Flame className="w-4 h-4" />
                  <span className="font-semibold">{data.user.streak} day streak</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                  <Trophy className="w-4 h-4" />
                  <span className="font-semibold">{data.stats.pointsToday} points today</span>
                </div>
              </div>
            </div>
            
            <Button 
              onClick={handleAddTask}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border-white/30 text-white text-base md:text-lg px-6 py-6 shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              <Plus className="w-5 h-5 mr-2" />
              Quick Add Task
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-emerald-50 cursor-pointer" onClick={() => navigate('/do')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs md:text-sm font-medium text-green-700 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Current Energy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-green-600 mb-1">{userEnergy} {userEnergy === 'PEAK' ? '🔥' : userEnergy === 'HIGH' ? '⚡' : userEnergy === 'MEDIUM' ? '😐' : '😴'}</div>
            <p className="text-xs text-green-600/70">Perfect for complex work</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-yellow-50 to-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs md:text-sm font-medium text-yellow-700 flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Points Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-yellow-600 mb-1">{data.stats.pointsToday}</div>
            <p className="text-xs text-yellow-600/70">+{data.stats.energyBonus}% energy bonus</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-cyan-50 cursor-pointer" onClick={() => navigate('/do')}>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs md:text-sm font-medium text-blue-700 flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              Tasks Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-1">{data.stats.tasksCompleted} / {data.stats.tasksTotal}</div>
            <p className="text-xs text-blue-600/70">{data.stats.tasksTotal - data.stats.tasksCompleted} remaining</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs md:text-sm font-medium text-purple-700 flex items-center gap-2">
              <Flame className="w-4 h-4" />
              Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-purple-600 mb-1">{data.stats.streak} days 🔥</div>
            <p className="text-xs text-purple-600/70">Keep it going!</p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Challenges */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-orange-600" />
            Today's Challenges
          </h2>
          <div className="flex gap-2 text-sm">
            <span className="text-gray-600">
              {getActiveChallenges().length} active
            </span>
            <span className="text-gray-400">•</span>
            <span className="text-green-600 font-semibold">
              {mockChallenges.filter(c => c.completed).length} completed
            </span>
          </div>
        </div>
        
        {/* Show completed challenges first (claimable) */}
        {mockChallenges.filter(c => c.completed && c.type === 'daily').length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-green-700 flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              Ready to Claim
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {mockChallenges
                .filter(c => c.completed && c.type === 'daily')
                .map(challenge => (
                  <DailyChallengeCard 
                    key={challenge.id} 
                    challenge={challenge}
                    onClaim={handleClaimChallenge}
                  />
                ))}
            </div>
          </div>
        )}
        
        {/* Then show active challenges */}
        {getActiveChallenges().filter(c => c.type === 'daily').length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Target className="w-4 h-4" />
              In Progress
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {getActiveChallenges()
                .filter(c => c.type === 'daily')
                .slice(0, 2)
                .map(challenge => (
                  <DailyChallengeCard 
                    key={challenge.id} 
                    challenge={challenge}
                    onClaim={handleClaimChallenge}
                  />
                ))}
            </div>
          </div>
        )}
        
        {mockChallenges.length > 3 && (
          <Button
            onClick={() => navigate('/do')}
            variant="outline"
            className="w-full"
          >
            View All {mockChallenges.length} Challenges
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
      
      {/* Weekly Progress Summary */}
      <WeeklyProgressSummary />

      {/* Advanced Analytics */}
      <AdvancedAnalytics />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Do Now */}
        <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Zap className="w-5 h-5 text-green-600" />
                  Do Now
                </CardTitle>
                <CardDescription className="text-gray-600">
                  Perfect for your {mockData.user.energy} energy
                </CardDescription>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleViewAllTasks}
                className="text-green-600 hover:text-green-700 hover:bg-green-100"
              >
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3">
              {data.tasks.doNow.map((task) => (
                <div 
                  key={task.id}
                  onClick={() => handleTaskClick(task)}
                  className="p-4 rounded-lg bg-white border-2 border-green-200 hover:border-green-400 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                    {task.title}
                  </div>
                  <div className="flex items-center gap-2 mt-2 text-sm text-gray-600">
                    <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                      {task.energy}
                    </span>
                    <span>•</span>
                    <span className="font-medium text-green-600">+{task.points} pts</span>
                    <span className="text-xs text-gray-500">+{Math.round(task.points * 0.25)} energy bonus</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card className="border-none shadow-xl bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-2xl transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-t-lg">
            <CardTitle className="flex items-center gap-2 text-gray-900">
              <Bot className="w-5 h-5 text-purple-600" />
              AI Insights
            </CardTitle>
            <CardDescription className="text-gray-600">
              Smart suggestions for you
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {mockData.insights.map((insight, index) => (
                <div 
                  key={index}
                  className="p-3 rounded-lg bg-white/60 backdrop-blur-sm hover:bg-white/80 transition-all cursor-pointer border border-purple-200/50 hover:border-purple-300"
                >
                  <div className="font-semibold text-purple-900 mb-1 flex items-center gap-2">
                    <span className="text-lg">{insight.icon}</span>
                    <span>{insight.title}</span>
                  </div>
                  <div className="text-sm text-purple-700">{insight.message}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming + Emblems */}
        <div className="space-y-4 md:space-y-6">
          {/* Upcoming */}
          <Card className="border-none shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <Calendar className="w-5 h-5 text-blue-600" />
                    Upcoming
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Next 4 hours
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleViewCalendar}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                >
                  Calendar
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {data.upcoming.map((event, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    <div className="text-sm font-semibold text-blue-600 min-w-[70px]">
                      {event.time}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{event.title}</div>
                      <div className="text-xs text-gray-500">{event.duration}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Emblem Progress */}
          <Card className="border-none shadow-xl bg-gradient-to-br from-amber-50 to-yellow-50 hover:shadow-2xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-amber-100 to-yellow-100 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-gray-900">
                    <Sparkles className="w-5 h-5 text-amber-600" />
                    Nearly Unlocked
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Your closest emblems
                  </CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleViewEmblems}
                  className="text-amber-600 hover:text-amber-700 hover:bg-amber-100"
                >
                  View All
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {mockData.emblems.map((emblem, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{emblem.emoji}</span>
                        <div>
                          <div className="font-semibold text-gray-900">{emblem.name}</div>
                          <div className="text-xs text-gray-500 uppercase">{emblem.rarity}</div>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-amber-600">{emblem.progress}%</div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full rounded-full"
                        style={{ 
                          width: `${emblem.progress}%`,
                          backgroundImage: emblem.rarity === 'epic' 
                            ? 'linear-gradient(to right, rgb(168 85 247), rgb(236 72 153))' 
                            : 'linear-gradient(to right, rgb(59 130 246), rgb(6 182 212))'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Energy Selector Dialog */}
      <Dialog open={showEnergySelector} onOpenChange={setShowEnergySelector}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-green-600" />
              Update Your Energy
            </DialogTitle>
            <DialogDescription>
              Let us know how you're feeling right now
            </DialogDescription>
          </DialogHeader>
          <EnergySelector 
            currentEnergy={userEnergy as any}
            onEnergyChange={handleEnergyChange}
          />
        </DialogContent>
      </Dialog>

      {/* Emblem Gallery Modal */}
      <EmblemGalleryModal
        open={showEmblemGallery}
        onClose={() => setShowEmblemGallery(false)}
        emblems={emblems}
        onEquip={handleEquipEmblem}
        onUnequip={handleUnequipEmblem}
      />
    </div>
  );
}
