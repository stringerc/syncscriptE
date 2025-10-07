import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Target, 
  TrendingUp, 
  Trophy, 
  Flame,
  CheckSquare,
  Zap,
  Calendar,
  Award
} from 'lucide-react';

interface WeeklyGoal {
  id: string;
  title: string;
  target: number;
  current: number;
  icon: React.ReactNode;
  color: string;
  gradient: string;
}

const mockWeeklyGoals: WeeklyGoal[] = [
  {
    id: 'tasks',
    title: 'Tasks Completed',
    target: 40,
    current: 32,
    icon: <CheckSquare className="w-5 h-5" />,
    color: 'text-green-600 dark:text-green-400',
    gradient: 'linear-gradient(to right, rgb(34 197 94), rgb(16 185 129))'
  },
  {
    id: 'points',
    title: 'Points Earned',
    target: 5000,
    current: 4200,
    icon: <Trophy className="w-5 h-5" />,
    color: 'text-purple-600 dark:text-purple-400',
    gradient: 'linear-gradient(to right, rgb(147 51 234), rgb(236 72 153))'
  },
  {
    id: 'energy-logs',
    title: 'Energy Logged',
    target: 7,
    current: 5,
    icon: <Zap className="w-5 h-5" />,
    color: 'text-orange-600 dark:text-orange-400',
    gradient: 'linear-gradient(to right, rgb(249 115 22), rgb(234 88 12))'
  },
  {
    id: 'events',
    title: 'Events Attended',
    target: 15,
    current: 12,
    icon: <Calendar className="w-5 h-5" />,
    color: 'text-blue-600 dark:text-blue-400',
    gradient: 'linear-gradient(to right, rgb(37 99 235), rgb(59 130 246))'
  },
];

const weeklyStats = {
  totalPoints: 4200,
  tasksCompleted: 32,
  streakDays: 5,
  challengesCompleted: 2,
  averageEnergy: 78,
  peakDays: 3,
};

export function WeeklyProgressSummary() {
  const overallProgress = Math.round(
    mockWeeklyGoals.reduce((sum, goal) => sum + (goal.current / goal.target) * 100, 0) / mockWeeklyGoals.length
  );
  
  const completedGoals = mockWeeklyGoals.filter(g => g.current >= g.target).length;

  return (
    <Card className="border-none shadow-xl">
      <CardHeader 
        className="rounded-t-lg relative overflow-hidden"
        style={{ backgroundImage: 'linear-gradient(to right, rgb(99 102 241), rgb(168 85 247), rgb(236 72 153))' }}
      >
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <CardTitle className="flex items-center gap-2 text-white">
              <Target className="w-6 h-6" />
              Weekly Progress
            </CardTitle>
            <Badge className="bg-white/20 backdrop-blur-sm border-white/30 text-white font-bold text-sm px-3 py-1">
              {overallProgress}% Complete
            </Badge>
          </div>
          <CardDescription className="text-white/90 font-medium">
            {completedGoals} of {mockWeeklyGoals.length} goals achieved • Keep pushing!
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Goals Progress */}
        <div className="grid grid-cols-2 gap-4">
          {mockWeeklyGoals.map((goal) => {
            const progress = (goal.current / goal.target) * 100;
            const isComplete = goal.current >= goal.target;
            
            return (
              <div 
                key={goal.id}
                className="p-4 bg-white dark:bg-slate-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${goal.color}`}
                    style={{ 
                      backgroundImage: `${goal.gradient.replace('rgb', 'rgba').replace(')', ', 0.1)')}` 
                    }}
                  >
                    {goal.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-600 dark:text-gray-400">{goal.title}</div>
                    <div className="font-bold text-lg text-gray-900 dark:text-white">
                      {goal.current} / {goal.target}
                    </div>
                  </div>
                  {isComplete && (
                    <Award className="w-5 h-5 text-green-600 dark:text-green-400" />
                  )}
                </div>
                
                {/* Progress bar */}
                <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all duration-500 rounded-full"
                    style={{ 
                      width: `${Math.min(progress, 100)}%`,
                      backgroundImage: goal.gradient
                    }}
                  />
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                  {progress.toFixed(0)}%
                </div>
              </div>
            );
          })}
        </div>

        {/* Weekly Stats Summary */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Flame className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {weeklyStats.streakDays}
              </div>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Day Streak</div>
          </div>
          
          <div className="text-center border-l border-r border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Trophy className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {weeklyStats.challengesCompleted}
              </div>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Challenges Won</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {weeklyStats.averageEnergy}%
              </div>
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Avg Energy</div>
          </div>
        </div>

        {/* Motivational Message */}
        <div 
          className="p-4 rounded-lg text-center"
          style={{ backgroundImage: 'linear-gradient(to right, rgb(168 85 247), rgb(236 72 153))' }}
        >
          <p className="text-white font-semibold text-sm">
            🎯 {Math.round(100 - overallProgress)}% away from crushing all your weekly goals!
          </p>
          <p className="text-white/80 text-xs mt-1">
            Keep the momentum going - you're doing amazing!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

