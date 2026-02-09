/**
 * Calendar Intelligence Banner
 * 
 * TIER 1 FEATURE:
 * Shows daily calendar metrics and insights
 * - Meeting vs Focus time
 * - Buffer warnings
 * - Energy alignment score
 * - Quick recommendations
 */

import { motion } from 'motion/react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import {
  Clock,
  Zap,
  AlertTriangle,
  TrendingUp,
  Brain,
  Target,
  CheckCircle2,
} from 'lucide-react';
import { Event } from '../utils/event-task-types';
import { analyzeDayCalendar } from '../utils/calendar-intelligence';
import { toast } from 'sonner@2.0.3';
import { detectConflicts, ConflictGroup } from '../utils/calendar-conflict-detection';

interface CalendarIntelligenceBannerProps {
  events: Event[];
  currentDate: Date;
  conflicts?: ConflictGroup[]; // Optional: pass conflicts from parent
  onAutoLayout?: () => void; // Optional: auto-layout handler
}

export function CalendarIntelligenceBanner({ events, currentDate, conflicts, onAutoLayout }: CalendarIntelligenceBannerProps) {
  // Get events for the current date
  const todayEvents = events.filter(event => {
    const eventDate = new Date(event.startTime);
    return eventDate.toDateString() === currentDate.toDateString();
  });

  // Detect conflicts if not provided
  const todayConflicts = conflicts || detectConflicts(todayEvents);

  // Analyze the day
  const analysis = analyzeDayCalendar(todayEvents);
  
  const meetingHours = Math.round((analysis.totalMeetingTime || 0) / 60 * 10) / 10;
  const focusHours = Math.round((analysis.totalFocusTime || 0) / 60 * 10) / 10;
  const totalHours = meetingHours + focusHours;
  
  // Calculate health score (0-100)
  const focusTimeGoal = 4; // 4 hours recommended
  const focusScore = Math.min(100, ((analysis.totalFocusTime || 0) / (focusTimeGoal * 60)) * 100);
  const bufferScore = (analysis.bufferWarnings?.length || 0) === 0 ? 100 : Math.max(0, 100 - ((analysis.bufferWarnings?.length || 0) * 20));
  const fragmentationHealthScore = 100 - (analysis.fragmentationScore || 0);
  const overallHealth = Math.round((focusScore + bufferScore + fragmentationHealthScore) / 3) || 0;
  
  const getHealthColor = (score: number) => {
    if (score >= 80) return { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' };
    if (score >= 60) return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' };
    return { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' };
  };
  
  const healthColors = getHealthColor(overallHealth);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 border border-gray-700 rounded-lg p-4 mb-4"
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Calendar Health Score */}
        <div className="flex items-center gap-3">
          <div className={`w-16 h-16 rounded-full ${healthColors.bg} border-2 ${healthColors.border} flex items-center justify-center`}>
            <div className="text-center">
              <div className={`text-xl font-bold ${healthColors.text}`}>{overallHealth}</div>
              <div className="text-[10px] text-gray-400">Health</div>
            </div>
          </div>
          
          <div>
            <h3 className="text-white font-medium mb-1">Today's Calendar</h3>
            <div className="flex items-center gap-2 flex-wrap">
              {overallHealth >= 80 && (
                <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/30 text-xs">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Well Optimized
                </Badge>
              )}
              {analysis.bufferWarnings.length > 0 && (
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-400 border-yellow-500/30 text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {analysis.bufferWarnings.length} buffer warnings
                </Badge>
              )}
              {analysis.fragmentationScore > 70 && (
                <Badge variant="outline" className="bg-orange-500/10 text-orange-400 border-orange-500/30 text-xs">
                  High Fragmentation
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Time Breakdown */}
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="flex items-center gap-1 text-blue-400 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-2xl font-bold">{meetingHours}h</span>
            </div>
            <div className="text-xs text-gray-400">Meetings</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center gap-1 text-purple-400 mb-1">
              <Brain className="w-4 h-4" />
              <span className="text-2xl font-bold">{focusHours}h</span>
            </div>
            <div className="text-xs text-gray-400">Focus Time</div>
            {focusHours < focusTimeGoal && (
              <div className="text-[10px] text-orange-400 mt-1">
                Goal: {focusTimeGoal}h
              </div>
            )}
          </div>
          
          <div className="text-center">
            <div className="flex items-center gap-1 text-teal-400 mb-1">
              <Zap className="w-4 h-4" />
              <span className="text-2xl font-bold">{totalHours}h</span>
            </div>
            <div className="text-xs text-gray-400">Total</div>
          </div>
        </div>

        {/* AI Recommendations */}
        {analysis.recommendedChanges.length > 0 && (
          <div className="flex-1 min-w-[200px]">
            <div className="bg-teal-500/10 border border-teal-500/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <Brain className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-teal-300 font-medium mb-1">AI Recommendation</p>
                  <p className="text-xs text-gray-400 line-clamp-2">
                    {analysis.recommendedChanges[0]}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs text-teal-400 hover:bg-teal-500/20 shrink-0"
                  onClick={() => {
                    toast.info('AI Optimization', { 
                      description: analysis.recommendedChanges.join('. '),
                      duration: 5000,
                    });
                  }}
                >
                  View All
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}