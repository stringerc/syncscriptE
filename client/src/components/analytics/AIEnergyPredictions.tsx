import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, Sparkles, Clock, TrendingUp, Target, Zap } from 'lucide-react';

interface Prediction {
  time: string;
  energyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'PEAK';
  confidence: number;
  recommendation: string;
}

const mockPredictions: Prediction[] = [
  { time: '9:00 AM', energyLevel: 'PEAK', confidence: 95, recommendation: 'Best time for strategic work' },
  { time: '10:30 AM', energyLevel: 'HIGH', confidence: 88, recommendation: 'Great for focused tasks' },
  { time: '1:00 PM', energyLevel: 'MEDIUM', confidence: 82, recommendation: 'Good for meetings' },
  { time: '3:00 PM', energyLevel: 'LOW', confidence: 79, recommendation: 'Handle admin tasks' },
  { time: '4:30 PM', energyLevel: 'MEDIUM', confidence: 85, recommendation: 'Light creative work' },
];

const aiRecommendations = [
  {
    icon: <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />,
    title: 'Optimal Task Placement',
    description: 'Move "Write Q4 Strategy" to tomorrow 9am (PEAK slot)',
    impact: 'high',
    color: 'purple'
  },
  {
    icon: <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
    title: 'Energy Block Reserved',
    description: 'I\'ve reserved 10-11:30am tomorrow for deep work',
    impact: 'medium',
    color: 'blue'
  },
  {
    icon: <Zap className="w-5 h-5 text-orange-600 dark:text-orange-400" />,
    title: 'Recovery Recommended',
    description: 'Take a 15-min break at 2pm to maintain afternoon energy',
    impact: 'medium',
    color: 'orange'
  },
];

export function AIEnergyPredictions() {
  const getEnergyColor = (level: string) => {
    switch (level) {
      case 'PEAK':
        return { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-300 dark:border-purple-600' };
      case 'HIGH':
        return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', border: 'border-green-300 dark:border-green-600' };
      case 'MEDIUM':
        return { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-300 dark:border-yellow-600' };
      case 'LOW':
        return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', border: 'border-red-300 dark:border-red-600' };
      default:
        return { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-300 dark:border-gray-600' };
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Tomorrow's Predictions */}
      <Card className="border-none shadow-xl">
        <CardHeader 
          className="rounded-t-lg"
          style={{ backgroundImage: 'linear-gradient(to right, rgb(139 92 246), rgb(236 72 153))' }}
        >
          <CardTitle className="flex items-center gap-2 text-white">
            <Brain className="w-5 h-5" />
            Tomorrow's Energy Forecast
          </CardTitle>
          <CardDescription className="text-white/90 font-medium">
            AI-predicted energy levels based on your patterns
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-3">
          {mockPredictions.map((pred, index) => {
            const colors = getEnergyColor(pred.energyLevel);
            return (
              <div 
                key={index}
                className={`p-3 rounded-lg border-2 ${colors.bg} ${colors.border} transition-all hover:shadow-md`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="font-semibold text-gray-900 dark:text-white">{pred.time}</span>
                  </div>
                  <Badge className={`${colors.bg} ${colors.text} ${colors.border} text-xs font-bold`}>
                    {pred.energyLevel}
                  </Badge>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 mb-1">{pred.recommendation}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                      style={{ width: `${pred.confidence}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">{pred.confidence}%</span>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* AI Recommendations */}
      <Card className="border-none shadow-xl">
        <CardHeader 
          className="rounded-t-lg"
          style={{ backgroundImage: 'linear-gradient(to right, rgb(236 72 153), rgb(249 115 22))' }}
        >
          <CardTitle className="flex items-center gap-2 text-white">
            <Sparkles className="w-5 h-5" />
            AI Recommendations
          </CardTitle>
          <CardDescription className="text-white/90 font-medium">
            Smart suggestions to optimize your productivity
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {aiRecommendations.map((rec, index) => (
            <div 
              key={index}
              className="p-4 bg-white dark:bg-slate-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  rec.color === 'purple' ? 'bg-purple-100 dark:bg-purple-900/30' :
                  rec.color === 'blue' ? 'bg-blue-100 dark:bg-blue-900/30' :
                  'bg-orange-100 dark:bg-orange-900/30'
                }`}>
                  {rec.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-1 text-sm">
                    {rec.title}
                  </h4>
                  <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">
                    {rec.description}
                  </p>
                  <Badge 
                    variant="outline"
                    className={`text-xs ${
                      rec.impact === 'high' 
                        ? 'border-red-300 dark:border-red-600 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20' 
                        : 'border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20'
                    }`}
                  >
                    {rec.impact === 'high' ? '🔥 High Impact' : '💡 Medium Impact'}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
          
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400 text-center">
              💡 AI learns from your patterns and updates recommendations daily
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

