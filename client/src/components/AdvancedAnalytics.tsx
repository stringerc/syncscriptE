import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Clock, 
  Zap, 
  Brain,
  Calendar,
  CheckSquare,
  Award,
  Activity,
  Users,
  DollarSign
} from 'lucide-react';
import { analytics } from '@/services/analytics';

interface AnalyticsData {
  productivity: {
    score: number;
    trend: 'up' | 'down' | 'stable';
    change: number;
  };
  tasks: {
    completed: number;
    created: number;
    completionRate: number;
  };
  energy: {
    average: number;
    peak: number;
    low: number;
    consistency: number;
  };
  time: {
    totalWorked: number;
    averageSession: number;
    breaks: number;
  };
  features: {
    mostUsed: string;
    adoption: Record<string, number>;
  };
}

const AdvancedAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAnalyticsData();
    analytics.trackFeatureUsage('advanced_analytics', 'viewed');
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      const mockData: AnalyticsData = {
        productivity: {
          score: 87,
          trend: 'up',
          change: 12
        },
        tasks: {
          completed: 45,
          created: 52,
          completionRate: 86.5
        },
        energy: {
          average: 78,
          peak: 95,
          low: 45,
          consistency: 82
        },
        time: {
          totalWorked: 42.5,
          averageSession: 2.3,
          breaks: 8
        },
        features: {
          mostUsed: 'Task Management',
          adoption: {
            'Task Management': 95,
            'Calendar Integration': 78,
            'AI Assistant': 65,
            'Energy Tracking': 45,
            'Voice Commands': 25
          }
        }
      };
      
      setAnalyticsData(mockData);
      setIsLoading(false);
    }, 1000);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-blue-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Advanced Analytics
          </CardTitle>
          <CardDescription>
            Loading your productivity insights...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!analyticsData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-500" />
            Advanced Analytics
          </CardTitle>
          <CardDescription>
            No analytics data available
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-muted-foreground">
              Start using SyncScript to see your analytics
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-500" />
                Advanced Analytics
              </CardTitle>
              <CardDescription>
                Deep insights into your productivity patterns
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {(['7d', '30d', '90d'] as const).map((range) => (
                <Button
                  key={range}
                  size="sm"
                  variant={timeRange === range ? 'default' : 'outline'}
                  onClick={() => setTimeRange(range)}
                >
                  {range}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productivity Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{analyticsData.productivity.score}</span>
              <div className="flex items-center gap-1">
                {getTrendIcon(analyticsData.productivity.trend)}
                <span className={`text-sm ${getTrendColor(analyticsData.productivity.trend)}`}>
                  +{analyticsData.productivity.change}%
                </span>
              </div>
            </div>
            <Progress value={analyticsData.productivity.score} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Task Completion</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.tasks.completionRate}%</div>
            <p className="text-xs text-muted-foreground">
              {analyticsData.tasks.completed} of {analyticsData.tasks.created} tasks
            </p>
            <Progress value={analyticsData.tasks.completionRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Energy Average</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.energy.average}%</div>
            <p className="text-xs text-muted-foreground">
              Peak: {analyticsData.energy.peak}% | Low: {analyticsData.energy.low}%
            </p>
            <Progress value={analyticsData.energy.average} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Worked</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData.time.totalWorked}h</div>
            <p className="text-xs text-muted-foreground">
              Avg session: {analyticsData.time.averageSession}h
            </p>
            <Progress value={(analyticsData.time.totalWorked / 50) * 100} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Feature Adoption */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-green-500" />
            Feature Adoption
          </CardTitle>
          <CardDescription>
            How you're using SyncScript features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(analyticsData.features.adoption).map(([feature, percentage]) => (
              <div key={feature} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{feature}</span>
                  <span className="text-sm text-muted-foreground">{percentage}%</span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights & Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            AI Insights
          </CardTitle>
          <CardDescription>
            Personalized recommendations based on your data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-green-800 dark:text-green-200">
                    Excellent Progress
                  </h4>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    Your productivity score has improved by 12% this month. Keep up the great work!
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-start gap-3">
                <Zap className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200">
                    Energy Optimization
                  </h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Your energy peaks at 10 AM. Schedule your most important tasks during this time.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <div className="flex items-start gap-3">
                <Award className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-orange-800 dark:text-orange-200">
                    Feature Opportunity
                  </h4>
                  <p className="text-sm text-orange-700 dark:text-orange-300">
                    Try using voice commands more often. Users who use them see 25% faster task creation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedAnalytics;
