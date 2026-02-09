/**
 * Smart Break Suggestions
 * 
 * PHASE 4: Time Optimization Features
 * Analyzes calendar and suggests optimal break times
 * Based on meeting density, energy levels, and focus block duration
 */

import { Coffee, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Event } from '../types/calendar';

interface BreakSuggestion {
  time: Date;
  duration: number; // minutes
  reason: string;
  priority: 'high' | 'medium' | 'low';
  type: 'energy' | 'focus' | 'meeting-density';
}

interface SmartBreakSuggestionsProps {
  events: Event[];
  currentDate: Date;
  onScheduleBreak?: (time: Date, duration: number) => void;
  onDismiss?: () => void;
}

export function SmartBreakSuggestions({
  events,
  currentDate,
  onScheduleBreak,
  onDismiss,
}: SmartBreakSuggestionsProps) {
  // Analyze calendar and generate break suggestions
  const suggestions = generateBreakSuggestions(events, currentDate);

  if (suggestions.length === 0) return null;

  const topSuggestion = suggestions[0];

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  const priorityConfig = {
    high: {
      icon: AlertCircle,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/20',
      borderColor: 'border-orange-500/30',
    },
    medium: {
      icon: Coffee,
      color: 'text-teal-400',
      bgColor: 'bg-teal-500/20',
      borderColor: 'border-teal-500/30',
    },
    low: {
      icon: CheckCircle,
      color: 'text-gray-400',
      bgColor: 'bg-gray-500/20',
      borderColor: 'border-gray-500/30',
    },
  };

  const config = priorityConfig[topSuggestion.priority];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className={`${config.bgColor} ${config.borderColor} border rounded-lg p-4 ${config.color}`}
      >
        <div className="flex items-start gap-3">
          <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <p className="font-medium">Suggested Break</p>
              <span className="text-xs opacity-70">{topSuggestion.duration} min</span>
            </div>
            <p className="text-sm opacity-80 mb-2">{topSuggestion.reason}</p>
            <div className="flex items-center gap-2 text-xs">
              <Clock className="w-3 h-3" />
              <span>{formatTime(topSuggestion.time)}</span>
            </div>
            {onScheduleBreak && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => onScheduleBreak(topSuggestion.time, topSuggestion.duration)}
                  className="flex-1 bg-teal-600 hover:bg-teal-500 text-white px-3 py-1.5 rounded text-sm transition-colors"
                >
                  Schedule Break
                </button>
                {onDismiss && (
                  <button
                    onClick={onDismiss}
                    className="px-3 py-1.5 rounded text-sm opacity-70 hover:opacity-100 transition-opacity"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        {suggestions.length > 1 && (
          <p className="text-xs opacity-60 mt-3">
            +{suggestions.length - 1} more suggestion{suggestions.length > 2 ? 's' : ''}
          </p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * Algorithm to generate smart break suggestions
 */
function generateBreakSuggestions(events: Event[], currentDate: Date): BreakSuggestion[] {
  const suggestions: BreakSuggestion[] = [];
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  // Check for long stretches without breaks (3+ hours)
  for (let i = 0; i < sortedEvents.length - 1; i++) {
    const currentEvent = sortedEvents[i];
    const nextEvent = sortedEvents[i + 1];
    const endTime = new Date(currentEvent.endTime);
    const nextStart = new Date(nextEvent.startTime);
    const gap = (nextStart.getTime() - endTime.getTime()) / (1000 * 60); // minutes

    // Check if there's a large gap where a break could fit
    if (gap >= 30 && gap < 90) {
      const breakTime = new Date(endTime.getTime() + 5 * 60 * 1000); // 5 min after event
      suggestions.push({
        time: breakTime,
        duration: Math.min(15, Math.floor(gap / 2)),
        reason: `Natural gap between "${currentEvent.title}" and "${nextEvent.title}"`,
        priority: 'medium',
        type: 'meeting-density',
      });
    }

    // Check for back-to-back meetings (less than 5 min gap)
    if (gap < 5 && gap > 0) {
      suggestions.push({
        time: endTime,
        duration: 10,
        reason: 'Back-to-back meetings detected - you need a breather',
        priority: 'high',
        type: 'meeting-density',
      });
    }
  }

  // Check for post-lunch energy dip (1-2 PM)
  const lunchHour = currentDate.getHours() === 13; // 1 PM
  if (lunchHour) {
    const hasEventAt1PM = sortedEvents.some(e => {
      const hour = new Date(e.startTime).getHours();
      return hour === 13;
    });
    
    if (!hasEventAt1PM) {
      const breakTime = new Date(currentDate);
      breakTime.setHours(13, 30, 0, 0);
      suggestions.push({
        time: breakTime,
        duration: 15,
        reason: 'Post-lunch energy dip - take a quick walk or coffee break',
        priority: 'high',
        type: 'energy',
      });
    }
  }

  // Check for long focus blocks (90+ minutes)
  for (const event of sortedEvents) {
    const duration = (new Date(event.endTime).getTime() - new Date(event.startTime).getTime()) / (1000 * 60);
    if (duration >= 90) {
      const midPoint = new Date(
        new Date(event.startTime).getTime() + (duration / 2) * 60 * 1000
      );
      suggestions.push({
        time: midPoint,
        duration: 5,
        reason: `Long ${duration}min block - brief pause recommended`,
        priority: 'medium',
        type: 'focus',
      });
    }
  }

  // Sort by priority and time
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return suggestions.sort((a, b) => {
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return a.time.getTime() - b.time.getTime();
  });
}
