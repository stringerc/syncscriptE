import { motion } from 'motion/react';
import { useState } from 'react';
import { 
  TrendingUp, TrendingDown, Clock, Target, Zap, 
  Brain, AlertCircle, CheckCircle, XCircle, Bell, BellOff,
  ThumbsUp, ThumbsDown, ChevronDown, ChevronUp, Info,
  Calendar, Activity, Sparkles, BarChart3
} from 'lucide-react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './ui/collapsible';

interface InsightCard {
  id: string;
  title: string;
  description: string;
  action: string;
  confidence: number;
  lift: string;
  drivers: { label: string; value: string }[];
  timeWindow?: string;
  snoozed: boolean;
  userFeedback?: 'helpful' | 'not-helpful' | null;
}

export function ResonanceAIInsights() {
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);
  const [insights, setInsights] = useState<InsightCard[]>([
    {
      id: 'insight-1',
      title: 'Start "Code Review" in next 30 min',
      description: 'You have a 78% chance of finishing this task on time if started within the next 30 minutes.',
      action: 'Start Code Review',
      confidence: 78,
      lift: '+15% completion rate',
      drivers: [
        { label: 'CPU usage', value: 'Low (23%)' },
        { label: 'Calendar gap', value: '45 min available' },
      ],
      timeWindow: '2:00 - 2:45 PM',
      snoozed: false,
      userFeedback: null,
    },
    {
      id: 'insight-2',
      title: 'Reschedule "Team Standup"',
      description: 'Moving this meeting out of the current window reduces interference with your deep work block.',
      action: 'Move to 3:30 PM',
      confidence: 82,
      lift: '+22% focus quality',
      drivers: [
        { label: 'High interference', value: 'With Deep Work (-0.4)' },
        { label: 'Alternative slot', value: '3:30 PM available' },
      ],
      timeWindow: 'Current: 2:15 PM',
      snoozed: false,
      userFeedback: null,
    },
    {
      id: 'insight-3',
      title: 'Take a break before next task',
      description: 'Your cognitive load has been high for 2.5 hours. A 15-minute break will improve performance on the next task by 18%.',
      action: 'Start Break Timer',
      confidence: 85,
      lift: '+18% next task performance',
      drivers: [
        { label: 'Cognitive load', value: 'High (2.5h active)' },
        { label: 'Next peak window', value: 'In 15 minutes' },
      ],
      snoozed: false,
      userFeedback: null,
    },
    {
      id: 'insight-4',
      title: 'Batch email responses at 4:00 PM',
      description: 'Processing emails during the upcoming low-energy window maximizes your productive time usage.',
      action: 'Schedule Email Block',
      confidence: 73,
      lift: '+12% time efficiency',
      drivers: [
        { label: 'Energy prediction', value: 'Low at 4:00 PM' },
        { label: 'Task type match', value: 'Optimal for admin work' },
      ],
      timeWindow: '4:00 - 4:30 PM',
      snoozed: false,
      userFeedback: null,
    },
  ]);

  const handleAccept = (insight: InsightCard) => {
    toast.success(`Scheduled: ${insight.action}`, {
      description: `Expected ${insight.lift}`,
    });
  };

  const handleSnooze = (insightId: string) => {
    setInsights(insights.map(i => 
      i.id === insightId ? { ...i, snoozed: true } : i
    ));
    toast.info('Suggestion snoozed for 24 hours');
  };

  const handleFeedback = (insightId: string, feedback: 'helpful' | 'not-helpful') => {
    setInsights(insights.map(i => 
      i.id === insightId ? { ...i, userFeedback: feedback } : i
    ));
    toast.success(
      feedback === 'helpful' ? 'Thanks for the feedback!' : 'We\'ll improve our suggestions',
      { description: 'Your feedback helps us learn your preferences' }
    );
  };

  const visibleInsights = insights.filter(i => !i.snoozed);

  // KPI Summary data
  const kpis = [
    {
      label: 'Resonance Score',
      value: '0.87',
      delta: '+0.12',
      trend: 'up' as const,
      period: 'Last 7 days',
      confidence: '92%',
    },
    {
      label: 'Avg Task Start Delay',
      value: '8 min',
      delta: '-4 min',
      trend: 'down' as const,
      period: 'Last 7 days',
      confidence: '88%',
    },
    {
      label: 'Constructive Window Usage',
      value: '73%',
      delta: '+8%',
      trend: 'up' as const,
      period: 'Last 7 days',
      confidence: '85%',
    },
  ];

  // Timeline data (next 24 hours in 2-hour blocks)
  const timelineBlocks = Array.from({ length: 12 }, (_, i) => {
    const hour = (new Date().getHours() + i * 2) % 24;
    const resonance = 0.5 + 0.4 * Math.sin((hour / 24) * Math.PI * 2 - Math.PI / 2);
    return {
      hour,
      resonance,
      isConstructive: resonance > 0.65,
      predictedLift: Math.round(resonance * 100 - 50),
    };
  });

  return (
    <div className="space-y-6">
      {/* Top-Panel KPI Summary */}
      <Card className="bg-gradient-to-br from-indigo-950/40 to-purple-950/40 border-indigo-800/30 p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-indigo-400" />
          <h2 className="text-white text-xl">Performance Overview</h2>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {kpis.map((kpi, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-black/30 rounded-lg p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-gray-400 text-xs mb-1">{kpi.label}</p>
                  <p className="text-white text-2xl font-semibold">{kpi.value}</p>
                </div>
                <div className="flex items-center gap-1">
                  {kpi.trend === 'up' ? (
                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-emerald-400" />
                  )}
                  <span className="text-emerald-400 text-sm">{kpi.delta}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">{kpi.period}</span>
                <span className="text-gray-500">Confidence: {kpi.confidence}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Actionable Insight Cards */}
      <Card className="bg-gradient-to-br from-teal-950/40 to-cyan-950/40 border-teal-800/30 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-teal-400" />
          <h2 className="text-white text-xl">Smart Suggestions</h2>
        </div>

        <div className="space-y-3">
          {visibleInsights.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <p className="text-gray-400">All caught up! No new suggestions right now.</p>
            </div>
          ) : (
            visibleInsights.map((insight, i) => (
              <motion.div
                key={insight.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-black/40 rounded-lg p-4 border border-teal-900/30 hover:border-teal-700/50 transition-colors"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-white font-medium mb-1">{insight.title}</h3>
                    <p className="text-gray-400 text-sm">{insight.description}</p>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={`ml-2 ${
                      insight.confidence >= 80 
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                        : insight.confidence >= 70
                        ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                        : 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                    }`}
                  >
                    {insight.confidence}%
                  </Badge>
                </div>

                {/* Key Drivers */}
                <div className="mb-3 space-y-1">
                  {insight.drivers.map((driver, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">{driver.label}</span>
                      <span className="text-gray-300">{driver.value}</span>
                    </div>
                  ))}
                </div>

                {/* Lift Badge */}
                {insight.timeWindow && (
                  <div className="flex items-center gap-2 mb-3 text-xs">
                    <Clock className="w-3 h-3 text-blue-400" />
                    <span className="text-blue-300">{insight.timeWindow}</span>
                    <span className="text-gray-500">•</span>
                    <span className="text-emerald-300">{insight.lift}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-teal-600 hover:bg-teal-700"
                    onClick={() => handleAccept(insight)}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {insight.action}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleSnooze(insight.id)}
                  >
                    <BellOff className="w-4 h-4" />
                  </Button>
                  <Collapsible open={expandedInsight === insight.id}>
                    <CollapsibleTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setExpandedInsight(
                          expandedInsight === insight.id ? null : insight.id
                        )}
                      >
                        <Info className="w-4 h-4" />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 pt-3 border-t border-gray-700">
                      <div className="space-y-2">
                        <p className="text-xs text-gray-400">
                          <strong className="text-gray-300">Why this suggestion?</strong><br />
                          Based on your current schedule and historical performance patterns, 
                          we predict optimal conditions for this task.
                        </p>
                        <p className="text-xs text-gray-400">
                          <strong className="text-gray-300">Counterfactual:</strong><br />
                          If you delay this task by 45 minutes, expected performance drops by 7%.
                        </p>
                        <div className="flex items-center gap-2 pt-2">
                          <span className="text-xs text-gray-500">Was this helpful?</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`h-7 ${insight.userFeedback === 'helpful' ? 'bg-emerald-500/20' : ''}`}
                            onClick={() => handleFeedback(insight.id, 'helpful')}
                          >
                            <ThumbsUp className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`h-7 ${insight.userFeedback === 'not-helpful' ? 'bg-red-500/20' : ''}`}
                            onClick={() => handleFeedback(insight.id, 'not-helpful')}
                          >
                            <ThumbsDown className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </Card>

      {/* Visual Timeline/Window View */}
      <Card className="bg-gradient-to-br from-violet-950/40 to-fuchsia-950/40 border-violet-800/30 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-violet-400" />
          <h2 className="text-white text-xl">Next 24 Hours</h2>
        </div>

        <p className="text-gray-400 text-sm mb-4">
          Predicted optimal (green) vs sub-optimal (red) windows for task performance
        </p>

        {/* Timeline Visualization */}
        <div className="space-y-2">
          {timelineBlocks.map((block, i) => {
            const hourLabel = block.hour === 0 ? '12 AM' : 
              block.hour < 12 ? `${block.hour} AM` : 
              block.hour === 12 ? '12 PM' : 
              `${block.hour - 12} PM`;
            
            return (
              <div key={i} className="group relative">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-16">{hourLabel}</span>
                  <div className="flex-1 relative">
                    <div 
                      className={`h-8 rounded-lg transition-all cursor-pointer ${
                        block.isConstructive 
                          ? 'bg-emerald-500/40 hover:bg-emerald-500/60' 
                          : 'bg-red-500/40 hover:bg-red-500/60'
                      }`}
                      style={{ 
                        width: `${block.resonance * 100}%`,
                        minWidth: '20%' 
                      }}
                      title={`Resonance: ${block.resonance.toFixed(2)}`}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white text-xs font-medium">
                          {block.isConstructive ? '+' : ''}{block.predictedLift}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Hover Tooltip */}
                <div className="absolute left-20 top-10 bg-gray-900 border border-gray-700 rounded-lg p-2 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  <p><strong>Resonance:</strong> {block.resonance.toFixed(2)}</p>
                  <p><strong>Predicted lift:</strong> {block.predictedLift}%</p>
                  <p className="text-gray-400 text-[10px] mt-1">
                    {block.isConstructive ? 'Optimal for focused work' : 'Better for light tasks'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded" />
            <span className="text-gray-400">Constructive Window</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded" />
            <span className="text-gray-400">Destructive Window</span>
          </div>
        </div>
      </Card>

      {/* Impact Tracking */}
      <Card className="bg-gradient-to-br from-amber-950/40 to-orange-950/40 border-amber-800/30 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-5 h-5 text-amber-400" />
          <h2 className="text-white text-xl">Impact Achieved</h2>
        </div>

        <div className="space-y-3">
          <div className="bg-black/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Today's accepted suggestions</span>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                3/4 acted upon
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-white">+18% average performance lift</span>
            </div>
          </div>

          <div className="bg-black/30 rounded-lg p-4">
            <p className="text-gray-400 text-sm mb-2">This Week</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Suggestions followed</span>
                <span className="text-white">12/15</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Avg confidence</span>
                <span className="text-white">82%</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-300">Time saved</span>
                <span className="text-emerald-300">2.4 hours</span>
              </div>
            </div>
          </div>

          <div className="bg-amber-950/30 border border-amber-500/20 rounded-lg p-3">
            <p className="text-amber-200 text-xs">
              <Info className="w-3 h-3 inline mr-1" />
              Your feedback helps us improve suggestion accuracy. Keep it up!
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
