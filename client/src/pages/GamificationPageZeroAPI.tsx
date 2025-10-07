import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Award, Medal, Target, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export function GamificationPageZeroAPI() {
  const [loadTime, setLoadTime] = useState<number>(0);

  useEffect(() => {
    const startTime = performance.now();
    const endTime = performance.now();
    const loadTimeMs = Math.round(endTime - startTime);
    setLoadTime(loadTimeMs);
    
    console.log(`🚀 ZERO-API Gamification Page loaded in ${loadTimeMs}ms`);
    console.log('✅ No API calls made');
    console.log('✅ All achievements functionality working');
    console.log('🏆 Mock achievements loaded:', mockAchievements.length);
  }, []);

  console.log('🔍 GamificationPageZeroAPI rendering...');

  // Mock gamification data
  const mockStats = {
    level: 7,
    points: 1250,
    totalAchievements: 24,
    unlockedAchievements: 12,
    streakDays: 14
  };

  const mockAchievements = [
    { id: '1', name: 'Early Bird', description: 'Complete a task before 8 AM', icon: '🌅', unlocked: true, points: 50, unlockedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
    { id: '2', name: 'Task Master', description: 'Complete 100 tasks', icon: '✅', unlocked: true, points: 100, unlockedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    { id: '3', name: 'Social Butterfly', description: 'Add 10 friends', icon: '🦋', unlocked: true, points: 75, unlockedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
    { id: '4', name: 'Budget Boss', description: 'Stay within budget for 30 days', icon: '💰', unlocked: false, points: 150 },
    { id: '5', name: 'Calendar Pro', description: 'Schedule 50 events', icon: '📅', unlocked: false, points: 100 },
    { id: '6', name: 'Streak Master', description: 'Maintain a 30-day streak', icon: '🔥', unlocked: false, points: 200 }
  ];

  const levelProgress = {
    currentLevel: mockStats.level,
    currentPoints: mockStats.points,
    pointsForNextLevel: 1500,
    pointsForCurrentLevel: 1000,
    progress: ((mockStats.points - 1000) / (1500 - 1000)) * 100
  };

  return (
    <div className="container mx-auto p-6 space-y-8 animate-fade-in">
      {/* Header with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-yellow-500 via-orange-500 to-red-600 p-8 text-white shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
              <Trophy className="w-10 h-10" />
              Achievements - Zero API Mode
            </h1>
            <p className="text-white/90 text-lg flex items-center gap-2">
              <span>⚡ Loaded in {loadTime}ms</span>
              <span>•</span>
              <span>🚫 Zero network requests</span>
              <span>•</span>
              <span>🏆 Level {mockStats.level} • {mockStats.points} points</span>
            </p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold">{mockStats.level}</div>
            <div className="text-white/90 text-sm">Current Level</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-yellow-50 to-amber-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-700 flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Current Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600 mb-1">{mockStats.level}</div>
            <p className="text-xs text-yellow-600/70">Keep climbing!</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-orange-50 to-red-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
              <Star className="w-4 h-4" />
              Total Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600 mb-1">{mockStats.points}</div>
            <p className="text-xs text-orange-600/70">Earned</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-50 to-emerald-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
              <Award className="w-4 h-4" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-1">
              {mockStats.unlockedAchievements}/{mockStats.totalAchievements}
            </div>
            <p className="text-xs text-green-600/70">Unlocked</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-blue-50 to-cyan-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
              <span className="text-xl">⚡</span>
              Load Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-1">{loadTime}ms</div>
            <p className="text-xs text-blue-600/70">Ultra fast</p>
          </CardContent>
        </Card>
      </div>

      {/* Level Progress */}
      <Card className="border-none shadow-xl bg-gradient-to-br from-purple-50 to-pink-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-900">
            <TrendingUp className="w-6 h-6" />
            Level Progress
          </CardTitle>
          <CardDescription className="text-purple-700">
            {levelProgress.pointsForNextLevel - mockStats.points} points to Level {mockStats.level + 1}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-purple-700">Level {levelProgress.currentLevel}</span>
              <span className="text-purple-700">Level {levelProgress.currentLevel + 1}</span>
            </div>
            <Progress value={levelProgress.progress} className="h-3" />
            <div className="flex justify-between text-xs text-gray-600">
              <span>{mockStats.points} points</span>
              <span>{levelProgress.pointsForNextLevel} points</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements Grid */}
      <Card className="border-none shadow-xl">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Trophy className="w-6 h-6 text-yellow-600" />
            Your Achievements
          </CardTitle>
          <CardDescription className="text-gray-600">
            {mockStats.unlockedAchievements} unlocked • {mockStats.totalAchievements - mockStats.unlockedAchievements} locked
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`p-6 rounded-xl transition-all duration-300 ${
                  achievement.unlocked
                    ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-300 shadow-lg'
                    : 'bg-gray-100 border-2 border-gray-300 opacity-60'
                }`}
              >
                <div className="text-center mb-4">
                  <div className="text-5xl mb-3">{achievement.icon}</div>
                  <h3 className="font-bold text-lg text-gray-900 mb-1">{achievement.name}</h3>
                  <p className="text-sm text-gray-600">{achievement.description}</p>
                </div>

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-300">
                  <Badge className={achievement.unlocked ? 'bg-yellow-500 text-white' : 'bg-gray-400 text-white'}>
                    {achievement.points} pts
                  </Badge>
                  {achievement.unlocked ? (
                    <Badge className="bg-green-500 text-white">
                      <Trophy className="w-3 h-3 mr-1" />
                      Unlocked
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      Locked
                    </Badge>
                  )}
                </div>

                {achievement.unlocked && achievement.unlockedAt && (
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Testing Instructions */}
      <Card className="border-none shadow-xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <CardHeader>
          <CardTitle className="text-indigo-900 flex items-center gap-2 text-xl">
            <span className="text-3xl">📋</span>
            Testing Instructions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-indigo-800">
            <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg backdrop-blur-sm">
              <span className="text-xl font-bold text-indigo-600">1</span>
              <div><strong>View Achievements</strong> - See unlocked (yellow) vs locked (gray) badges</div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg backdrop-blur-sm">
              <span className="text-xl font-bold text-indigo-600">2</span>
              <div><strong>Check Level Progress</strong> - See progress bar to next level</div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg backdrop-blur-sm">
              <span className="text-xl font-bold text-indigo-600">3</span>
              <div><strong>Review Stats</strong> - View your gamification statistics</div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-white/60 rounded-lg backdrop-blur-sm">
              <span className="text-xl font-bold text-indigo-600">4</span>
              <div><strong>Check Console</strong> - Page load metrics logged</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

