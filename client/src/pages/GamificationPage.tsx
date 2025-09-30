import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Trophy, Star, Zap, Target, Calendar, Award, TrendingUp, Users, Crown, Medal, Flame, Clock, CheckCircle, Eye, EyeOff, Battery } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Switch } from '@/components/ui/switch'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { useAchievements } from '@/contexts/AchievementsContext'
import DailyChallenges from '@/components/DailyChallenges'
import EnhancedAchievements from '@/components/EnhancedAchievements'
import EnergyEngine from '@/components/EnergyEngine'

const GamificationPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const { showAchievements, setShowAchievements } = useAchievements()

  // Fetch gamification data
  const { data: gamificationData, isLoading, error } = useQuery({
    queryKey: ['gamification'],
    queryFn: async () => {
      const response = await api.get('/gamification')
      return response.data.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Fetch leaderboard
  const { data: leaderboard } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: async () => {
      const response = await api.get('/gamification/leaderboard')
      return response.data.data
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
  })

  // Fetch daily challenges
  const { data: dailyChallenges, isLoading: challengesLoading } = useQuery({
    queryKey: ['daily-challenges'],
    queryFn: async () => {
      const response = await api.get('/gamification/challenges')
      return response.data.data
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading gamification data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <p className="text-red-600">Failed to load gamification data</p>
        </div>
      </div>
    )
  }

  const { stats, achievements, badges, streaks, levelProgress } = gamificationData || {}

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800'
      case 'rare': return 'bg-blue-100 text-blue-800'
      case 'epic': return 'bg-purple-100 text-purple-800'
      case 'legendary': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getLevelIcon = (level: number) => {
    if (level >= 50) return <Crown className="h-5 w-5 text-yellow-600" />
    if (level >= 25) return <Medal className="h-5 w-5 text-purple-600" />
    if (level >= 10) return <Award className="h-5 w-5 text-blue-600" />
    return <Star className="h-5 w-5 text-green-600" />
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Trophy className="h-8 w-8 text-yellow-600" />
          <div>
            <h1 className="text-3xl font-bold">Gamification</h1>
            <p className="text-gray-600">
              Track your progress, earn achievements, and level up!
            </p>
          </div>
        </div>
        
        {/* Achievements Toggle */}
        <Card className="w-80">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                Achievements Display
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  {showAchievements ? 'Visible' : 'Hidden'}
                </span>
                <div className="flex items-center gap-2">
                  {showAchievements ? (
                    <Eye className="h-4 w-4 text-green-600" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-red-600" />
                  )}
                  <Switch
                    checked={showAchievements}
                    onCheckedChange={setShowAchievements}
                    className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-red-500"
                  />
                </div>
              </div>
            </CardTitle>
            <CardDescription className="text-sm">
              Toggle to show or hide points and achievements throughout the app. Achievements will still be earned in the background.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Level Progress */}
      {levelProgress && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {getLevelIcon(levelProgress.currentLevel)}
              Level {levelProgress.currentLevel}
            </CardTitle>
            <CardDescription>
              Progress to Level {levelProgress.nextLevel}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{levelProgress.currentXP} XP</span>
                <span>{levelProgress.requiredXP} XP</span>
              </div>
              <Progress value={levelProgress.progress} className="h-3" />
              <p className="text-xs text-gray-600">
                {Math.round(levelProgress.progress)}% complete
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.tasksCompleted}</p>
                  <p className="text-sm text-gray-600">Tasks Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Zap className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.totalPoints}</p>
                  <p className="text-sm text-gray-600">Total Points</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.currentStreak}</p>
                  <p className="text-sm text-gray-600">Day Streak</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Award className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.achievementsUnlocked}</p>
                  <p className="text-sm text-gray-600">Achievements</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="challenges">Daily Challenges</TabsTrigger>
          <TabsTrigger value="energy">Energy Engine</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="enhanced-achievements">Enhanced</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 min-h-[400px]">
          {/* Recent Achievements */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Achievements</CardTitle>
              <CardDescription>Your latest accomplishments</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-64">
                <div className="space-y-3">
                  {achievements?.slice(0, 5).map((achievement: any) => (
                    <div key={achievement.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="text-2xl">{achievement.icon || '🏆'}</div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-base">{achievement.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          +{achievement.points} points • {new Date(achievement.unlockedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!achievements || achievements.length === 0) && (
                    <p className="text-center text-gray-500 py-8">No achievements yet. Complete tasks to earn your first achievement!</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Current Streaks */}
          <Card>
            <CardHeader>
              <CardTitle>Current Streaks</CardTitle>
              <CardDescription>Keep the momentum going!</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {streaks?.map((streak: any) => (
                  <div key={streak.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">🔥</div>
                      <div>
                        <h4 className="font-medium capitalize text-gray-900">{streak.type.replace('_', ' ')}</h4>
                        <p className="text-sm text-gray-700">{streak.count} days</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{streak.count} days</Badge>
                  </div>
                ))}
                {(!streaks || streaks.length === 0) && (
                  <p className="text-center text-gray-600 py-8">No active streaks. Complete tasks daily to start building streaks!</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6 min-h-[400px]">
          <Card>
            <CardHeader>
              <CardTitle>All Achievements</CardTitle>
              <CardDescription>Track your progress towards unlocking achievements</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="grid gap-3">
                  {achievements?.map((achievement: any) => (
                    <div key={achievement.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="text-3xl">{achievement.icon || '🏆'}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{achievement.title}</h4>
                          <Badge className={getRarityColor(achievement.rarity || 'common')}>
                            {achievement.rarity || 'common'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>+{achievement.points} points</span>
                          <span>Unlocked: {new Date(achievement.unlockedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!achievements || achievements.length === 0) && (
                    <p className="text-center text-gray-500 py-12">No achievements unlocked yet. Complete tasks to start earning achievements!</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="badges" className="space-y-6 min-h-[400px]">
          <Card>
            <CardHeader>
              <CardTitle>Badges</CardTitle>
              <CardDescription>Special recognition for your accomplishments</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="grid gap-3">
                  {badges?.map((badge: any) => (
                    <div key={badge.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="text-3xl">{badge.icon}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{badge.title}</h4>
                          <Badge className={getRarityColor(badge.rarity)}>
                            {badge.rarity}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{badge.description}</p>
                        <p className="text-xs text-gray-500">
                          Earned: {new Date(badge.earnedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!badges || badges.length === 0) && (
                    <p className="text-center text-gray-500 py-12">No badges earned yet. Keep completing tasks to earn badges!</p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="enhanced-achievements" className="space-y-6 min-h-[400px]">
          <EnhancedAchievements />
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-6 min-h-[400px]">
          <Card>
            <CardHeader>
              <CardTitle>Friends Leaderboard</CardTitle>
              <CardDescription>See how you rank against your friends</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-3">
                  {leaderboard?.map((user: any, index: number) => (
                    <div key={user.userId} className={cn(
                      "flex items-center gap-4 p-4 rounded-lg border",
                      index === 0 ? "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700" :
                      index === 1 ? "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700" :
                      index === 2 ? "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-700" :
                      "bg-white dark:bg-gray-800/30 border-gray-200 dark:border-gray-700"
                    )}>
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-sm font-bold text-gray-900 dark:text-gray-100">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-base">{user.name}</h4>
                          {index < 3 && (
                            <div className="text-lg">
                              {index === 0 && '👑'}
                              {index === 1 && '🥈'}
                              {index === 2 && '🥉'}
                            </div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600">
                          Level {user.currentLevel} • {user.tasksCompleted} tasks
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">{user.totalPoints}</p>
                        <p className="text-xs text-gray-500">points</p>
                      </div>
                    </div>
                  ))}
                  {(!leaderboard || leaderboard.length === 0) && (
                    <div className="text-center text-gray-500 py-12">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="font-medium">No friends on leaderboard yet</p>
                      <p className="text-sm mt-2">Add friends to see how you compare!</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="challenges" className="space-y-6 min-h-[400px]">
          <DailyChallenges />
        </TabsContent>

        <TabsContent value="energy" className="space-y-6 min-h-[400px]">
          <EnergyEngine />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default GamificationPage
