import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { analyticsService, GoalProgress, PerformanceInsight } from '@/services/analyticsService';
import { 
  TrendingUp, 
  Target, 
  Lightbulb, 
  BarChart3,
  Calendar,
  Zap,
  Trophy,
  Clock,
  AlertTriangle,
  CheckCircle,
  Info,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react';

interface AdvancedAnalyticsProps {
  className?: string;
}

export function AdvancedAnalytics({ className }: AdvancedAnalyticsProps) {
  const { toast } = useToast();
  const [goals, setGoals] = useState<GoalProgress[]>([]);
  const [insights, setInsights] = useState<PerformanceInsight[]>([]);
  const [summaryStats, setSummaryStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const [goalsData, insightsData, statsData] = await Promise.all([
        analyticsService.getGoalProgress(),
        analyticsService.getPerformanceInsights(),
        analyticsService.getSummaryStats()
      ]);
      
      setGoals(goalsData);
      setInsights(insightsData);
      setSummaryStats(statsData);
      
      toast({
        title: '📊 Analytics Loaded!',
        description: 'Your productivity insights are ready',
        duration: 2000,
      });
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast({
        title: '❌ Analytics Error',
        description: 'Failed to load analytics data',
        duration: 3000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'on-track': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'ahead': return <ArrowUp className="w-4 h-4 text-blue-600" />;
      case 'behind': return <ArrowDown className="w-4 h-4 text-orange-600" />;
      case 'completed': return <Trophy className="w-4 h-4 text-purple-600" />;
      default: return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-track': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-300 dark:border-green-600';
      case 'ahead': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-600';
      case 'behind': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-300 dark:border-orange-600';
      case 'completed': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-600';
      default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'tip': return <Lightbulb className="w-5 h-5 text-yellow-600" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'achievement': return <Trophy className="w-5 h-5 text-purple-600" />;
      case 'recommendation': return <Target className="w-5 h-5 text-blue-600" />;
      default: return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300';
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300';
      case 'low': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300';
      default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <BarChart3 className="w-8 h-8 text-gray-400 animate-pulse" />
              <span className="ml-2 text-gray-600">Loading analytics...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Stats */}
      {summaryStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{summaryStats.totalTasks}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Points</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{summaryStats.totalPoints.toLocaleString()}</p>
                </div>
                <Trophy className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Current Streak</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{summaryStats.currentStreak} days</p>
                </div>
                <Zap className="w-8 h-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Energy</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{summaryStats.averageEnergy.toFixed(1)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Goals Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-6 h-6 text-blue-600" />
            Goal Progress
          </CardTitle>
          <CardDescription>
            Track your progress towards monthly goals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {goals.map((goal) => (
            <div key={goal.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white">{goal.title}</h4>
                  <Badge className={`text-xs border ${getStatusColor(goal.status)}`}>
                    {getStatusIcon(goal.status)}
                    <span className="ml-1 capitalize">{goal.status.replace('-', ' ')}</span>
                  </Badge>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {goal.current} / {goal.target} {goal.unit}
                </div>
              </div>
              
              <Progress value={goal.progress} className="mb-2" />
              
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>{goal.progress.toFixed(1)}% complete</span>
                <span>Due {goal.deadline.toLocaleDateString()}</span>
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{goal.description}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-yellow-600" />
            Performance Insights
          </CardTitle>
          <CardDescription>
            AI-powered recommendations to boost your productivity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {insights.map((insight) => (
            <div key={insight.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getInsightIcon(insight.type)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white">{insight.title}</h4>
                    <Badge className={`text-xs ${getImpactColor(insight.impact)}`}>
                      {insight.impact} impact
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {insight.category}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{insight.description}</p>
                  
                  {insight.actionable && insight.actionText && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      onClick={() => {
                        if (insight.actionUrl) {
                          window.location.href = insight.actionUrl;
                        }
                      }}
                    >
                      <Target className="w-3 h-3" />
                      {insight.actionText}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Refresh Button */}
      <div className="flex justify-center">
        <Button
          onClick={loadAnalytics}
          disabled={isLoading}
          className="gap-2"
        >
          <BarChart3 className="w-4 h-4" />
          Refresh Analytics
        </Button>
      </div>
    </div>
  );
}
