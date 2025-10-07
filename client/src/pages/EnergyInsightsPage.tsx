import React from 'react';
import { EnergyInsightsDashboard } from '@/components/energy/EnergyInsightsDashboard';
import { ProductivityTrendChart } from '@/components/analytics/ProductivityTrendChart';
import { AIEnergyPredictions } from '@/components/analytics/AIEnergyPredictions';
import { mockWeekData, mockTodayData } from '@/data/mockEnergyData';
import { TrendingUp, Clock, Target, Zap, Calendar, Brain } from 'lucide-react';

const mockInsights = [
  {
    icon: <TrendingUp className="w-5 h-5 text-green-600" />,
    title: 'Strong Morning Performance',
    description: 'You consistently reach PEAK energy between 9am-11am. Schedule your most important tasks during this window for maximum productivity.',
    type: 'positive' as const,
  },
  {
    icon: <Clock className="w-5 h-5 text-blue-600" />,
    title: 'Post-Lunch Dip Pattern',
    description: 'Your energy drops 25% after lunch (1-3pm). Consider a 15-minute walk or light snack to maintain momentum.',
    type: 'neutral' as const,
  },
  {
    icon: <Target className="w-5 h-5 text-orange-600" />,
    title: 'Weekend Energy Recovery',
    description: 'Your weekend energy is 15% lower than weekdays. Try to maintain consistent sleep schedules to improve recovery.',
    type: 'warning' as const,
  },
  {
    icon: <Zap className="w-5 h-5 text-green-600" />,
    title: 'Improving Trend',
    description: 'Your average energy increased by 12% this week compared to last week. Keep up the good work!',
    type: 'positive' as const,
  },
  {
    icon: <Calendar className="w-5 h-5 text-blue-600" />,
    title: 'Optimal Task Scheduling',
    description: 'Based on your patterns, schedule creative work for mornings and administrative tasks for afternoons.',
    type: 'neutral' as const,
  },
  {
    icon: <Brain className="w-5 h-5 text-green-600" />,
    title: 'Energy-Task Alignment',
    description: 'You completed 80% of tasks when your energy matched the task difficulty. Continue using energy-aware scheduling!',
    type: 'positive' as const,
  },
];

export function EnergyInsightsPage() {
  React.useEffect(() => {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      console.log(`📊 Energy Insights Page loaded in ${Math.round(endTime - startTime)}ms`);
    };
  }, []);

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
          Energy Insights
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Understand your energy patterns and optimize your productivity
        </p>
      </div>

      {/* Insights Dashboard */}
      <EnergyInsightsDashboard 
        weekData={mockWeekData}
        todayData={mockTodayData}
        insights={mockInsights}
      />
      
      {/* Productivity Trends */}
      <ProductivityTrendChart />
      
      {/* AI Predictions & Recommendations */}
      <AIEnergyPredictions />
    </div>
  );
}

