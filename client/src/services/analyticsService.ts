// Analytics Service for SyncScript
// Provides advanced analytics, charts, and performance insights

export interface ProductivityMetric {
  date: string;
  tasksCompleted: number;
  pointsEarned: number;
  energyLevel: number;
  focusTime: number; // in minutes
  breaksTaken: number;
}

export interface GoalProgress {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  deadline: Date;
  category: 'tasks' | 'points' | 'streak' | 'energy' | 'events';
  progress: number; // 0-100
  status: 'on-track' | 'behind' | 'ahead' | 'completed';
}

export interface PerformanceInsight {
  id: string;
  type: 'tip' | 'warning' | 'achievement' | 'recommendation';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  category: 'productivity' | 'energy' | 'time-management' | 'wellness';
  actionable: boolean;
  actionText?: string;
  actionUrl?: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    tension?: number;
  }[];
}

class AnalyticsService {
  // Get productivity metrics for the last 30 days
  async getProductivityMetrics(days: number = 30): Promise<ProductivityMetric[]> {
    console.log('📊 Analytics: Fetching productivity metrics for', days, 'days');
    
    const metrics: ProductivityMetric[] = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Generate realistic mock data with some variation
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      metrics.push({
        date: date.toISOString().split('T')[0],
        tasksCompleted: isWeekend ? Math.floor(Math.random() * 3) : Math.floor(Math.random() * 8) + 2,
        pointsEarned: isWeekend ? Math.floor(Math.random() * 150) : Math.floor(Math.random() * 400) + 100,
        energyLevel: 5 + Math.random() * 4, // 5-9 range
        focusTime: isWeekend ? Math.floor(Math.random() * 120) : Math.floor(Math.random() * 300) + 120,
        breaksTaken: Math.floor(Math.random() * 5) + 1
      });
    }
    
    await new Promise(resolve => setTimeout(resolve, 500));
    if (import.meta.env.MODE === 'development') {
      console.log('📊 Analytics: Productivity metrics generated');
    }
    return metrics;
  }

  // Get current goal progress
  async getGoalProgress(): Promise<GoalProgress[]> {
    if (import.meta.env.MODE === 'development') {
      console.log('📊 Analytics: Fetching goal progress');
    }
    
    const goals: GoalProgress[] = [
      {
        id: 'goal-1',
        title: 'Complete 50 Tasks This Month',
        description: 'Maintain consistent task completion',
        target: 50,
        current: 32,
        unit: 'tasks',
        deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        category: 'tasks',
        progress: 64,
        status: 'on-track'
      },
      {
        id: 'goal-2',
        title: 'Earn 2000 Points',
        description: 'Accumulate points through task completion',
        target: 2000,
        current: 1450,
        unit: 'points',
        deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        category: 'points',
        progress: 72.5,
        status: 'ahead'
      },
      {
        id: 'goal-3',
        title: 'Maintain 30-Day Streak',
        description: 'Complete at least one task every day',
        target: 30,
        current: 18,
        unit: 'days',
        deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
        category: 'streak',
        progress: 60,
        status: 'on-track'
      },
      {
        id: 'goal-4',
        title: 'Average 8+ Energy Level',
        description: 'Maintain high energy throughout the month',
        target: 8,
        current: 7.2,
        unit: 'energy',
        deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        category: 'energy',
        progress: 90,
        status: 'behind'
      }
    ];
    
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log('📊 Analytics: Goal progress generated');
    return goals;
  }

  // Get performance insights and recommendations
  async getPerformanceInsights(): Promise<PerformanceInsight[]> {
    console.log('📊 Analytics: Generating performance insights');
    
    const insights: PerformanceInsight[] = [
      {
        id: 'insight-1',
        type: 'tip',
        title: 'Peak Productivity Window',
        description: 'You\'re most productive between 9-11 AM. Schedule your most important tasks during this time.',
        impact: 'high',
        category: 'productivity',
        actionable: true,
        actionText: 'Schedule High Priority Tasks',
        actionUrl: '/do'
      },
      {
        id: 'insight-2',
        type: 'recommendation',
        title: 'Energy Dip Detected',
        description: 'Your energy typically drops at 2 PM. Consider taking a break or switching to low-energy tasks.',
        impact: 'medium',
        category: 'energy',
        actionable: true,
        actionText: 'Plan Break Time',
        actionUrl: '/plan'
      },
      {
        id: 'insight-3',
        type: 'achievement',
        title: 'Consistency Champion',
        description: 'You\'ve completed tasks for 18 consecutive days! You\'re on track for your streak goal.',
        impact: 'high',
        category: 'productivity',
        actionable: false
      },
      {
        id: 'insight-4',
        type: 'warning',
        title: 'Weekend Productivity Drop',
        description: 'Your task completion drops significantly on weekends. Consider adjusting your weekend routine.',
        impact: 'medium',
        category: 'time-management',
        actionable: true,
        actionText: 'Optimize Weekend Schedule',
        actionUrl: '/plan'
      }
    ];
    
    await new Promise(resolve => setTimeout(resolve, 400));
    console.log('📊 Analytics: Performance insights generated');
    return insights;
  }

  // Generate chart data for productivity trends
  async getProductivityChartData(days: number = 7): Promise<ChartData> {
    console.log('📊 Analytics: Generating productivity chart data');
    
    const metrics = await this.getProductivityMetrics(days);
    
    const chartData: ChartData = {
      labels: metrics.map(m => new Date(m.date).toLocaleDateString('en-US', { weekday: 'short' })),
      datasets: [
        {
          label: 'Tasks Completed',
          data: metrics.map(m => m.tasksCompleted),
          backgroundColor: 'rgba(34, 197, 94, 0.2)',
          borderColor: 'rgba(34, 197, 94, 1)',
          tension: 0.4
        },
        {
          label: 'Points Earned',
          data: metrics.map(m => m.pointsEarned / 50), // Scale down for chart
          backgroundColor: 'rgba(168, 85, 247, 0.2)',
          borderColor: 'rgba(168, 85, 247, 1)',
          tension: 0.4
        },
        {
          label: 'Energy Level',
          data: metrics.map(m => m.energyLevel),
          backgroundColor: 'rgba(236, 72, 153, 0.2)',
          borderColor: 'rgba(236, 72, 153, 1)',
          tension: 0.4
        }
      ]
    };
    
    await new Promise(resolve => setTimeout(resolve, 200));
    console.log('📊 Analytics: Chart data generated');
    return chartData;
  }

  // Get summary statistics
  async getSummaryStats(): Promise<{
    totalTasks: number;
    totalPoints: number;
    currentStreak: number;
    averageEnergy: number;
    productivityScore: number;
    weeklyGrowth: number;
  }> {
    console.log('📊 Analytics: Calculating summary statistics');
    
    const metrics = await this.getProductivityMetrics(30);
    
    const stats = {
      totalTasks: metrics.reduce((sum, m) => sum + m.tasksCompleted, 0),
      totalPoints: metrics.reduce((sum, m) => sum + m.pointsEarned, 0),
      currentStreak: 18, // Mock current streak
      averageEnergy: metrics.reduce((sum, m) => sum + m.energyLevel, 0) / metrics.length,
      productivityScore: Math.round((metrics.reduce((sum, m) => sum + m.tasksCompleted, 0) / 30) * 10),
      weeklyGrowth: 12.5 // Mock growth percentage
    };
    
    await new Promise(resolve => setTimeout(resolve, 300));
    console.log('📊 Analytics: Summary statistics calculated');
    return stats;
  }
}

export const analyticsService = new AnalyticsService();
