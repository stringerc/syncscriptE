import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  Zap, 
  Clock, 
  TrendingUp, 
  Target, 
  Coffee, 
  Moon, 
  Sun,
  Activity,
  Lightbulb,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { analytics } from '@/services/analytics';

interface EnergyLevel {
  level: number;
  timestamp: Date;
  activity: string;
}

interface EnergyInsight {
  type: 'tip' | 'warning' | 'achievement';
  title: string;
  description: string;
  action?: string;
}

const AIEnergyCoach: React.FC = () => {
  const [currentEnergy, setCurrentEnergy] = useState(75);
  const [energyHistory, setEnergyHistory] = useState<EnergyLevel[]>([]);
  const [insights, setInsights] = useState<EnergyInsight[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening'>('morning');

  useEffect(() => {
    // Determine time of day
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay('morning');
    else if (hour < 18) setTimeOfDay('afternoon');
    else setTimeOfDay('evening');

    // Generate mock energy history
    const mockHistory: EnergyLevel[] = [
      { level: 85, timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), activity: 'Morning workout' },
      { level: 70, timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), activity: 'Deep work session' },
      { level: 60, timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), activity: 'Team meeting' },
      { level: 75, timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), activity: 'Lunch break' },
    ];
    setEnergyHistory(mockHistory);

    // Generate AI insights
    const mockInsights: EnergyInsight[] = [
      {
        type: 'tip',
        title: 'Peak Energy Window',
        description: 'Your energy typically peaks between 9-11 AM. Schedule your most demanding tasks during this time.',
        action: 'Schedule important tasks'
      },
      {
        type: 'warning',
        title: 'Energy Dip Detected',
        description: 'You usually experience an energy dip around 2 PM. Consider a 15-minute break or light snack.',
        action: 'Take a break'
      },
      {
        type: 'achievement',
        title: 'Consistent Energy',
        description: 'Great job! You\'ve maintained consistent energy levels for 3 days in a row.',
        action: 'Keep it up!'
      }
    ];
    setInsights(mockInsights);

    // Track feature usage
    analytics.trackFeatureUsage('ai_energy_coach', 'viewed');
  }, []);

  const analyzeEnergyPatterns = async () => {
    setIsAnalyzing(true);
    analytics.trackFeatureUsage('ai_energy_coach', 'analyze_patterns');
    
    // Simulate AI analysis
    setTimeout(() => {
      const newInsights: EnergyInsight[] = [
        {
          type: 'tip',
          title: 'Optimal Break Timing',
          description: 'Based on your patterns, taking a 10-minute break every 90 minutes increases your productivity by 23%.',
          action: 'Set break reminders'
        },
        {
          type: 'tip',
          title: 'Energy-Boosting Activities',
          description: 'Short walks and hydration breaks are most effective for you. Try a 5-minute walk every 2 hours.',
          action: 'Schedule walks'
        }
      ];
      setInsights(prev => [...newInsights, ...prev]);
      setIsAnalyzing(false);
    }, 2000);
  };

  const getEnergyColor = (level: number) => {
    if (level >= 80) return 'text-green-600';
    if (level >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEnergyIcon = (level: number) => {
    if (level >= 80) return <Sun className="w-5 h-5 text-yellow-500" />;
    if (level >= 60) return <Activity className="w-5 h-5 text-orange-500" />;
    return <Moon className="w-5 h-5 text-blue-500" />;
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'tip': return <Lightbulb className="w-5 h-5 text-blue-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'achievement': return <CheckCircle className="w-5 h-5 text-green-500" />;
      default: return <Brain className="w-5 h-5 text-purple-500" />;
    }
  };

  const getInsightBadgeColor = (type: string) => {
    switch (type) {
      case 'tip': return 'bg-blue-100 text-blue-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'achievement': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Energy Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            AI Energy Coach
          </CardTitle>
          <CardDescription>
            Your personal AI assistant for optimizing energy and productivity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {/* Current Energy Level */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                {getEnergyIcon(currentEnergy)}
                <span className={`ml-2 text-2xl font-bold ${getEnergyColor(currentEnergy)}`}>
                  {currentEnergy}%
                </span>
              </div>
              <p className="text-sm text-gray-600">Current Energy</p>
              <Progress value={currentEnergy} className="mt-2" />
            </div>

            {/* Time of Day */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                {timeOfDay === 'morning' ? <Sun className="w-5 h-5 text-yellow-500" /> :
                 timeOfDay === 'afternoon' ? <Activity className="w-5 h-5 text-orange-500" /> :
                 <Moon className="w-5 h-5 text-blue-500" />}
                <span className="ml-2 text-lg font-semibold capitalize">{timeOfDay}</span>
              </div>
              <p className="text-sm text-gray-600">Optimal Time</p>
              <Badge variant="outline" className="mt-2">
                {timeOfDay === 'morning' ? 'Peak Performance' :
                 timeOfDay === 'afternoon' ? 'Steady Focus' : 'Wind Down'}
              </Badge>
            </div>

            {/* Today's Trend */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                <span className="ml-2 text-lg font-semibold text-green-600">+12%</span>
              </div>
              <p className="text-sm text-gray-600">vs Yesterday</p>
              <Badge variant="outline" className="mt-2 bg-green-50 text-green-700">
                Improving
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            AI Insights & Recommendations
          </CardTitle>
          <CardDescription>
            Personalized tips based on your energy patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  {getInsightIcon(insight.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">{insight.title}</h4>
                    <Badge className={getInsightBadgeColor(insight.type)}>
                      {insight.type}
                    </Badge>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{insight.description}</p>
                  {insight.action && (
                    <Button size="sm" variant="outline" className="text-xs">
                      {insight.action}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 text-center">
            <Button 
              onClick={analyzeEnergyPatterns}
              disabled={isAnalyzing}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {isAnalyzing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  Analyze Energy Patterns
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Energy History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-500" />
            Energy History
          </CardTitle>
          <CardDescription>
            Track your energy levels throughout the day
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {energyHistory.map((entry, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {getEnergyIcon(entry.level)}
                  <div>
                    <p className="font-medium text-gray-900">{entry.activity}</p>
                    <p className="text-sm text-gray-600">
                      {entry.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`font-semibold ${getEnergyColor(entry.level)}`}>
                    {entry.level}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIEnergyCoach;
