import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';

interface ProductivityData {
  day: string;
  tasksCompleted: number;
  pointsEarned: number;
  avgEnergy: number;
}

const mockProductivityData: ProductivityData[] = [
  { day: 'Mon', tasksCompleted: 8, pointsEarned: 850, avgEnergy: 75 },
  { day: 'Tue', tasksCompleted: 6, pointsEarned: 620, avgEnergy: 68 },
  { day: 'Wed', tasksCompleted: 10, pointsEarned: 1050, avgEnergy: 82 },
  { day: 'Thu', tasksCompleted: 7, pointsEarned: 720, avgEnergy: 70 },
  { day: 'Fri', tasksCompleted: 9, pointsEarned: 920, avgEnergy: 78 },
  { day: 'Sat', tasksCompleted: 4, pointsEarned: 380, avgEnergy: 60 },
  { day: 'Sun', tasksCompleted: 5, pointsEarned: 450, avgEnergy: 65 },
];

export function ProductivityTrendChart() {
  const maxTasks = Math.max(...mockProductivityData.map(d => d.tasksCompleted));
  const maxPoints = Math.max(...mockProductivityData.map(d => d.pointsEarned));
  const totalTasks = mockProductivityData.reduce((sum, d) => sum + d.tasksCompleted, 0);
  const totalPoints = mockProductivityData.reduce((sum, d) => sum + d.pointsEarned, 0);
  const avgEnergy = Math.round(mockProductivityData.reduce((sum, d) => sum + d.avgEnergy, 0) / mockProductivityData.length);
  
  // Calculate trend
  const recentAvg = (mockProductivityData[5].pointsEarned + mockProductivityData[6].pointsEarned) / 2;
  const previousAvg = (mockProductivityData[0].pointsEarned + mockProductivityData[1].pointsEarned) / 2;
  const trend = ((recentAvg - previousAvg) / previousAvg) * 100;
  const isPositiveTrend = trend > 0;

  return (
    <Card className="border-none shadow-xl">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              7-Day Productivity Trend
            </CardTitle>
            <CardDescription className="text-gray-700 dark:text-gray-300 font-medium mt-1">
              Tasks completed and points earned this week
            </CardDescription>
          </div>
          <Badge 
            className={`flex items-center gap-1 text-white font-semibold ${
              isPositiveTrend ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            {isPositiveTrend ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isPositiveTrend ? '+' : ''}{trend.toFixed(0)}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
            <div className="text-xs text-green-600 dark:text-green-400 font-medium mb-1">Total Tasks</div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">{totalTasks}</div>
          </div>
          <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-700">
            <div className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-1">Total Points</div>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{totalPoints.toLocaleString()}</div>
          </div>
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
            <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mb-1">Avg Energy</div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">{avgEnergy}%</div>
          </div>
        </div>

        {/* Chart */}
        <div>
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Daily Breakdown</div>
          <div className="space-y-3">
            {mockProductivityData.map((data, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-gray-700 dark:text-gray-300 w-12">{data.day}</span>
                  <div className="flex items-center gap-3 flex-1">
                    {/* Tasks bar */}
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-600 dark:text-gray-400">{data.tasksCompleted} tasks</span>
                        <span className="text-xs font-semibold text-green-600 dark:text-green-400">{data.pointsEarned} pts</span>
                      </div>
                      <div className="w-full h-8 bg-gray-100 dark:bg-slate-700 rounded-lg overflow-hidden relative">
                        {/* Tasks bar */}
                        <div 
                          className="absolute inset-y-0 left-0 rounded-lg transition-all duration-500"
                          style={{ 
                            width: `${(data.tasksCompleted / maxTasks) * 100}%`,
                            backgroundImage: 'linear-gradient(to right, rgb(34 197 94), rgb(16 185 129))'
                          }}
                        />
                        {/* Points overlay bar */}
                        <div 
                          className="absolute inset-y-0 left-0 rounded-lg transition-all duration-500 opacity-40"
                          style={{ 
                            width: `${(data.pointsEarned / maxPoints) * 100}%`,
                            backgroundImage: 'linear-gradient(to right, rgb(168 85 247), rgb(236 72 153))'
                          }}
                        />
                        {/* Energy indicator */}
                        <div 
                          className="absolute inset-y-0 right-0 w-1 bg-yellow-400"
                          style={{ 
                            height: `${data.avgEnergy}%`,
                            alignSelf: 'flex-end'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ backgroundImage: 'linear-gradient(to right, rgb(34 197 94), rgb(16 185 129))' }}></div>
              <span className="text-gray-600 dark:text-gray-400">Tasks Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded opacity-40" style={{ backgroundImage: 'linear-gradient(to right, rgb(168 85 247), rgb(236 72 153))' }}></div>
              <span className="text-gray-600 dark:text-gray-400">Points Earned</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-1 bg-yellow-400"></div>
              <span className="text-gray-600 dark:text-gray-400">Avg Energy</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

