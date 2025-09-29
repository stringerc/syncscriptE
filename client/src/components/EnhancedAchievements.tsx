import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Zap, Target, Award, Crown, Medal, Flame, CheckCircle, Lock, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface Achievement {
  id: string;
  type: string;
  title: string;
  description: string;
  points: number;
  criteria: string;
  progress: number;
  target: number;
  isUnlocked: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: string;
  domain?: string;
  icon: string;
  unlockedAt?: string;
}

interface AchievementTemplate {
  id: string;
  type: string;
  title: string;
  description: string;
  criteria: any;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: string;
  domain?: string;
  icon: string;
}

const EnhancedAchievements: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const queryClient = useQueryClient();

  // Fetch user achievements
  const { data: achievements, isLoading: achievementsLoading } = useQuery<Achievement[]>({
    queryKey: ['enhanced-achievements'],
    queryFn: async () => {
      const response = await api.get('/achievements');
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch achievement templates
  const { data: templates } = useQuery<AchievementTemplate[]>({
    queryKey: ['achievement-templates'],
    queryFn: async () => {
      const response = await api.get('/achievements/templates');
      return response.data.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Fetch categories
  const { data: categories } = useQuery<string[]>({
    queryKey: ['achievement-categories'],
    queryFn: async () => {
      const response = await api.get('/achievements/categories');
      return response.data.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Check achievements mutation
  const checkAchievementsMutation = useMutation({
    mutationFn: async () => {
      const response = await api.post('/achievements/check');
      return response.data;
    },
    onSuccess: (data) => {
      if (data.data.unlocked.length > 0) {
        toast({
          title: "Achievements Unlocked! 🎉",
          description: `You've unlocked ${data.data.unlocked.length} new achievement(s)!`,
        });
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['enhanced-achievements'] });
        queryClient.invalidateQueries({ queryKey: ['gamification'] });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to check achievements",
        variant: "destructive"
      });
    }
  });

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-200 text-gray-800';
      case 'rare': return 'bg-blue-200 text-blue-800';
      case 'epic': return 'bg-purple-200 text-purple-800';
      case 'legendary': return 'bg-yellow-200 text-yellow-800';
      default: return 'bg-gray-200 text-gray-800';
    }
  };

  const getRarityIcon = (rarity: string) => {
    switch (rarity) {
      case 'common': return <Star className="h-4 w-4" />;
      case 'rare': return <Award className="h-4 w-4" />;
      case 'epic': return <Crown className="h-4 w-4" />;
      case 'legendary': return <Medal className="h-4 w-4" />;
      default: return <Star className="h-4 w-4" />;
    }
  };

  const filteredAchievements = achievements?.filter(achievement => {
    const categoryMatch = selectedCategory === 'all' || achievement.category === selectedCategory;
    const rarityMatch = selectedRarity === 'all' || achievement.rarity === selectedRarity;
    return categoryMatch && rarityMatch;
  }) || [];

  const unlockedCount = achievements?.filter(a => a.isUnlocked).length || 0;
  const totalCount = achievements?.length || 0;

  if (achievementsLoading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading achievements...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy className="h-8 w-8 text-yellow-600" />
          <div>
            <h1 className="text-3xl font-bold">Enhanced Achievements</h1>
            <p className="text-gray-600">
              Track your progress and unlock new achievements
            </p>
          </div>
        </div>

        <Button
          onClick={() => checkAchievementsMutation.mutate()}
          disabled={checkAchievementsMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {checkAchievementsMutation.isPending ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Checking...
            </>
          ) : (
            <>
              <Target className="h-4 w-4 mr-2" />
              Check Achievements
            </>
          )}
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{unlockedCount}</p>
                <p className="text-sm text-gray-600">Unlocked</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalCount}</p>
                <p className="text-sm text-gray-600">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Trophy className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0}%
                </p>
                <p className="text-sm text-gray-600">Completion</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-black">Filter Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-white">Category:</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1 border rounded-md text-sm text-black"
              >
                <option value="all">All Categories</option>
                {categories?.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Rarity Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-white">Rarity:</label>
              <select
                value={selectedRarity}
                onChange={(e) => setSelectedRarity(e.target.value)}
                className="px-3 py-1 border rounded-md text-sm text-black"
              >
                <option value="all">All Rarities</option>
                <option value="common">Common</option>
                <option value="rare">Rare</option>
                <option value="epic">Epic</option>
                <option value="legendary">Legendary</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence>
          {filteredAchievements.map((achievement) => (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <AchievementCard
                achievement={achievement}
                getRarityColor={getRarityColor}
                getRarityIcon={getRarityIcon}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredAchievements.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No achievements found</h3>
            <p className="text-gray-500">
              Try adjusting your filters or complete some tasks to unlock achievements!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

interface AchievementCardProps {
  achievement: Achievement;
  getRarityColor: (rarity: string) => string;
  getRarityIcon: (rarity: string) => React.ReactNode;
}

const AchievementCard: React.FC<AchievementCardProps> = ({
  achievement,
  getRarityColor,
  getRarityIcon
}) => {
  const progressPercentage = achievement.target > 0 ? (achievement.progress / achievement.target) * 100 : 0;
  const isCompleted = achievement.isUnlocked;

  return (
    <Card className={`transition-all duration-200 ${isCompleted ? 'ring-2 ring-green-200' : 'hover:shadow-md'}`}>
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="text-2xl">{achievement.icon}</div>
              <div>
                <h3 className="font-semibold text-white">{achievement.title}</h3>
                <Badge className={getRarityColor(achievement.rarity)}>
                  {getRarityIcon(achievement.rarity)}
                  <span className="ml-1 capitalize">{achievement.rarity}</span>
                </Badge>
              </div>
            </div>
            
            {isCompleted ? (
              <div className="flex items-center gap-1 text-green-600">
                <CheckCircle className="h-5 w-5" />
              </div>
            ) : (
              <div className="flex items-center gap-1 text-gray-400">
                <Lock className="h-5 w-5" />
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600">{achievement.description}</p>

          {/* Progress */}
          {!isCompleted && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span>Progress</span>
                <span>{achievement.progress}/{achievement.target}</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          )}

          {/* Points */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-yellow-600">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">{achievement.points} points</span>
            </div>
            
            {isCompleted && achievement.unlockedAt && (
              <span className="text-xs text-gray-500">
                {new Date(achievement.unlockedAt).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EnhancedAchievements;
