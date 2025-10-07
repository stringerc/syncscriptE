import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Zap, Brain, Clock, Target, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnergyDataPoint {
  time: string;
  level: number; // 0-100
  label: 'LOW' | 'MEDIUM' | 'HIGH' | 'PEAK';
}

interface EnergyInsight {
  icon: React.ReactNode;
  title: string;
  description: string;
  type: 'positive' | 'neutral' | 'warning';
}

interface EnergyInsightsDashboardProps {
  weekData: EnergyDataPoint[];
  todayData: EnergyDataPoint[];
  insights: EnergyInsight[];
}

export function EnergyInsightsDashboard({ weekData, todayData, insights }: EnergyInsightsDashboardProps) {
  // Calculate average energy for the week
  const averageEnergy = weekData.reduce((sum, d) => sum + d.level, 0) / weekData.length;
  
  // Find peak time
  const peakTime = [...todayData].sort((a, b) => b.level - a.level)[0];
  
  // Calculate trend (comparing first half vs second half of week)
  const firstHalf = weekData.slice(0, Math.floor(weekData.length / 2));
  const secondHalf = weekData.slice(Math.floor(weekData.length / 2));
  const firstAvg = firstHalf.reduce((sum, d) => sum + d.level, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, d) => sum + d.level, 0) / secondHalf.length;
  const trend = secondAvg - firstAvg;
  const trendPercent = ((trend / firstAvg) * 100).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Average Energy */}
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Average Energy</p>
                <p className="text-3xl font-bold text-purple-900">
                  {averageEnergy.toFixed(0)}
                  <span className="text-lg text-purple-600">/100</span>
                </p>
                <p className="text-xs text-purple-600 mt-1">This week</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                <Zap className="w-8 h-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Peak Time */}
        <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Peak Time</p>
                <p className="text-3xl font-bold text-orange-900">{peakTime?.time || '10:00'}</p>
                <p className="text-xs text-orange-600 mt-1">Most productive</p>
              </div>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                <Clock className="w-8 h-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Trend */}
        <Card className={cn(
          "border-2",
          trend > 0 
            ? "bg-gradient-to-br from-green-50 to-emerald-50 border-green-200" 
            : "bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-200"
        )}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={cn(
                  "text-sm font-medium",
                  trend > 0 ? "text-green-700" : "text-yellow-700"
                )}>Weekly Trend</p>
                <p className={cn(
                  "text-3xl font-bold flex items-center gap-2",
                  trend > 0 ? "text-green-900" : "text-yellow-900"
                )}>
                  {trend > 0 ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                  {Math.abs(Number(trendPercent))}%
                </p>
                <p className={cn(
                  "text-xs mt-1",
                  trend > 0 ? "text-green-600" : "text-yellow-600"
                )}>
                  {trend > 0 ? 'Improving!' : 'Needs attention'}
                </p>
              </div>
              <div className={cn(
                "w-16 h-16 rounded-full flex items-center justify-center",
                trend > 0 
                  ? "bg-gradient-to-br from-green-400 to-emerald-500" 
                  : "bg-gradient-to-br from-yellow-400 to-amber-500"
              )}>
                <Target className="w-8 h-8 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Energy Chart - Week View */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Energy Patterns This Week
          </CardTitle>
          <CardDescription>Your energy levels over the past 7 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative py-4">
            {/* Background grid lines */}
            <div className="absolute left-0 right-0 h-64 flex flex-col justify-between pointer-events-none">
              {[100, 75, 50, 25, 0].map((value) => (
                <div key={value} className="flex items-center w-full border-t border-gray-200">
                  <span className="text-xs text-gray-400 -ml-10 w-8 text-right">{value}</span>
                </div>
              ))}
            </div>
            
            {/* Simple bar chart - FIXED HEIGHT CONTAINER */}
            <div className="flex items-end justify-between h-64 gap-2 px-4">
              {weekData.map((point, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  {/* Bar */}
                  <div className="w-full h-64 flex items-end justify-center relative group">
                    <div 
                      className="w-12 rounded-t-lg transition-all duration-300 hover:scale-110 cursor-pointer shadow-lg"
                      style={{ 
                        height: `${(point.level / 100) * 256}px`, // 256px = h-64
                        minHeight: '40px',
                        backgroundImage: point.label === 'PEAK' 
                          ? 'linear-gradient(to top, rgb(168 85 247), rgb(236 72 153))'
                          : point.label === 'HIGH'
                          ? 'linear-gradient(to top, rgb(34 197 94), rgb(16 185 129))'
                          : point.label === 'MEDIUM'
                          ? 'linear-gradient(to top, rgb(234 179 8), rgb(245 158 11))'
                          : 'linear-gradient(to top, rgb(239 68 68), rgb(249 115 22))'
                      }}
                    >
                      {/* Tooltip on hover */}
                      <div className="absolute -top-14 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl z-10">
                        <div className="font-bold">{point.label}</div>
                        <div className="text-gray-300">{point.level}% energy</div>
                      </div>
                      
                      {/* Energy emoji on top of bar */}
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xl opacity-0 group-hover:opacity-100 transition-opacity">
                        {point.label === 'PEAK' ? '🔥' : point.label === 'HIGH' ? '⚡' : point.label === 'MEDIUM' ? '😐' : '😴'}
                      </div>
                    </div>
                  </div>
                  {/* Label */}
                  <div className="text-sm text-gray-700 font-semibold">{point.time}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-blue-600" />
            AI-Powered Insights
          </CardTitle>
          <CardDescription className="text-blue-700">
            Personalized recommendations based on your patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {insights.map((insight, index) => (
              <div 
                key={index}
                className={cn(
                  "p-4 rounded-lg border-l-4 bg-white/60 backdrop-blur-sm",
                  insight.type === 'positive' && "border-l-green-500",
                  insight.type === 'neutral' && "border-l-blue-500",
                  insight.type === 'warning' && "border-l-orange-500"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                    insight.type === 'positive' && "bg-green-100",
                    insight.type === 'neutral' && "bg-blue-100",
                    insight.type === 'warning' && "bg-orange-100"
                  )}>
                    {insight.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{insight.title}</h4>
                    <p className="text-sm text-gray-700">{insight.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

