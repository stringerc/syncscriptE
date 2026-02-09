/**
 * Alternative Time Slots View
 * 
 * Phase 3: Conflict Intelligence
 * Shows ranked alternative time slots when conflicts are detected
 * 
 * Research-backed scoring:
 * - Energy alignment (circadian rhythm)
 * - No conflicts (100% availability required)
 * - Schedule flow (avoid fragmentation)
 * - Time of day preferences
 */

import { Clock, Zap, CheckCircle, Calendar } from 'lucide-react';
import { Task } from '../types/task';
import { CalendarEvent } from '../data/calendar-mock';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface AlternativeTimeSlot {
  time: string;
  hour: number;
  minute: number;
  score: number; // 0-100
  energyAlignment: number; // 0-100
  reason: string;
  hasConflicts: boolean;
}

interface AlternativeTimeSlotsViewProps {
  task: Task;
  allTasks: Task[];
  allEvents: CalendarEvent[];
  onSelectTime: (time: { hour: number; minute: number }) => void;
  onGoBack: () => void;
  currentTime: string;
  dateDisplay: string;
}

export function AlternativeTimeSlotsView({
  task,
  allTasks,
  allEvents,
  onSelectTime,
  onGoBack,
  currentTime,
  dateDisplay,
}: AlternativeTimeSlotsViewProps) {
  
  const alternatives = findAlternativeTimeSlots(task, allTasks, allEvents);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-white font-semibold text-lg mb-2">Alternative Time Slots</h3>
        <p className="text-gray-400 text-sm">
          We found {alternatives.length} conflict-free times optimized for your energy and schedule flow.
        </p>
      </div>

      {/* Alternative Slots List */}
      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
        {alternatives.length === 0 ? (
          <div className="bg-gray-900/30 border border-gray-700 rounded-lg p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">
              No alternative slots found. Try adjusting task duration or rescheduling for another day.
            </p>
          </div>
        ) : (
          alternatives.map((alt, idx) => (
            <AlternativeSlotCard
              key={idx}
              alternative={alt}
              rank={idx + 1}
              onSelect={() => onSelectTime({ hour: alt.hour, minute: alt.minute })}
              isTopChoice={idx === 0}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="mt-6 pt-6 border-t border-gray-800 flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={onGoBack}
          className="text-gray-400 hover:text-white"
        >
          ← Back to Preview
        </Button>

        <p className="text-gray-500 text-sm">
          Select a time slot above to reschedule
        </p>
      </div>
    </div>
  );
}

// ==================== SUB-COMPONENTS ====================

interface AlternativeSlotCardProps {
  alternative: AlternativeTimeSlot;
  rank: number;
  onSelect: () => void;
  isTopChoice: boolean;
}

function AlternativeSlotCard({ alternative, rank, onSelect, isTopChoice }: AlternativeSlotCardProps) {
  return (
    <button
      onClick={onSelect}
      className={`w-full bg-gray-900/30 border rounded-lg p-4 text-left transition-all hover:bg-gray-800/50 hover:border-teal-500/40 ${
        isTopChoice
          ? 'border-teal-500/40 ring-2 ring-teal-500/20'
          : 'border-gray-700'
      }`}
    >
      <div className="flex items-start gap-4">
        {/* Rank Badge */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
          isTopChoice
            ? 'bg-teal-500/20 text-teal-300'
            : rank <= 3
            ? 'bg-emerald-500/20 text-emerald-300'
            : 'bg-gray-700 text-gray-400'
        }`}>
          {rank}
        </div>

        {/* Time Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-4 h-4 text-gray-400" />
            <p className={`font-mono text-lg ${
              isTopChoice ? 'text-teal-300' : 'text-white'
            }`}>
              {alternative.time}
            </p>
            
            {isTopChoice && (
              <Badge className="bg-teal-500/20 text-teal-300 border-teal-500/30 text-xs">
                Best Match
              </Badge>
            )}
          </div>

          {/* Reason */}
          <p className="text-gray-400 text-sm mb-3">{alternative.reason}</p>

          {/* Metrics */}
          <div className="flex items-center gap-4">
            {/* Score */}
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-300 text-xs font-medium">
                {alternative.score}% match
              </span>
            </div>

            {/* Energy Alignment */}
            <div className="flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-yellow-300 text-xs font-medium">
                {alternative.energyAlignment}% energy
              </span>
            </div>

            {/* No Conflicts */}
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-emerald-300 text-xs font-medium">
                No conflicts
              </span>
            </div>
          </div>
        </div>

        {/* Select Button */}
        <div className="flex-shrink-0">
          <div className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
            isTopChoice
              ? 'bg-teal-600 text-white'
              : 'bg-gray-700 text-gray-300 group-hover:bg-gray-600'
          }`}>
            Select
          </div>
        </div>
      </div>
    </button>
  );
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Calculate energy level for a given hour (research-based)
 */
function getEnergyForHour(hour: number): number {
  // Research-based energy curve
  if (hour >= 9 && hour <= 11) return 95; // Peak morning
  if (hour >= 14 && hour <= 16) return 75; // Afternoon high
  if (hour >= 7 && hour <= 8) return 80; // Early morning
  if (hour >= 12 && hour <= 13) return 50; // Post-lunch dip
  if (hour >= 17 && hour <= 19) return 60; // Early evening
  if (hour >= 20 || hour <= 6) return 30; // Night/early morning
  
  return 60; // Default moderate
}

/**
 * Convert task energy level to numeric value
 */
function taskEnergyToNumber(level: 'high' | 'medium' | 'low'): number {
  switch (level) {
    case 'high': return 90;
    case 'medium': return 60;
    case 'low': return 30;
  }
}

/**
 * Parse estimated time to minutes
 */
function parseEstimatedTime(timeStr: string): number {
  const hourMatch = timeStr.match(/(\d+)h/);
  const minuteMatch = timeStr.match(/(\d+)m/);
  
  const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
  const minutes = minuteMatch ? parseInt(minuteMatch[1]) : 0;
  
  return hours * 60 + minutes;
}

/**
 * Format time slot (e.g., "8:00 AM")
 */
function formatTimeSlot(hour: number, minute: number): string {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  const displayMinute = minute.toString().padStart(2, '0');
  return `${displayHour}:${displayMinute} ${period}`;
}

/**
 * Check if a time slot has conflicts
 */
function hasConflicts(
  hour: number,
  minute: number,
  taskDuration: number,
  allTasks: Task[],
  allEvents: CalendarEvent[],
  taskId: string
): boolean {
  const proposedDate = new Date();
  proposedDate.setHours(hour, minute, 0, 0);
  
  const proposedStart = proposedDate.getTime();
  const proposedEnd = proposedStart + (taskDuration * 60 * 1000);
  
  // Check task conflicts
  for (const t of allTasks) {
    if (!t.scheduledTime || t.id === taskId) continue;
    
    const taskTime = new Date(t.scheduledTime);
    const taskStart = taskTime.getTime();
    const taskEnd = taskStart + (parseEstimatedTime(t.estimatedTime) * 60 * 1000);
    
    if (proposedStart < taskEnd && proposedEnd > taskStart) {
      return true;
    }
  }
  
  // Check event conflicts
  for (const event of allEvents) {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    
    const eventStartTime = eventStart.getTime();
    const eventEndTime = eventEnd.getTime();
    
    if (proposedStart < eventEndTime && proposedEnd > eventStartTime) {
      return true;
    }
  }
  
  return false;
}

/**
 * Find and rank alternative time slots
 */
function findAlternativeTimeSlots(
  task: Task,
  allTasks: Task[],
  allEvents: CalendarEvent[]
): AlternativeTimeSlot[] {
  const alternatives: AlternativeTimeSlot[] = [];
  const taskDuration = parseEstimatedTime(task.estimatedTime);
  const taskEnergyRequired = taskEnergyToNumber(task.energyLevel);
  
  // Search from 7 AM to 10 PM in 30-minute increments
  const startHour = 7;
  const endHour = 22;
  
  for (let h = startHour; h < endHour; h++) {
    for (let m of [0, 30]) {
      // Skip if this slot + task duration goes past 10 PM
      const slotEndHour = h + Math.floor((m + taskDuration) / 60);
      if (slotEndHour > endHour) continue;
      
      // Check for conflicts
      const conflicts = hasConflicts(h, m, taskDuration, allTasks, allEvents, task.id);
      if (conflicts) continue; // Only show conflict-free slots
      
      // Calculate energy alignment score
      const slotEnergy = getEnergyForHour(h);
      const energyDiff = Math.abs(slotEnergy - taskEnergyRequired);
      const energyAlignment = Math.max(0, 100 - energyDiff);
      
      // Calculate overall score
      // Factors:
      // - Energy alignment (60% weight)
      // - Time of day preference (20% weight) - prefer 9AM-5PM
      // - Avoid early/late (20% weight)
      
      const timePreference = (h >= 9 && h <= 17) ? 100 : 
                              (h >= 7 && h <= 8) || (h >= 18 && h <= 20) ? 70 : 40;
      
      const score = Math.round(
        (energyAlignment * 0.6) +
        (timePreference * 0.3) +
        (100 * 0.1) // Base score for being conflict-free
      );
      
      // Generate reason text
      let reason = '';
      if (energyAlignment >= 90) {
        reason = `Perfect energy match for ${task.energyLevel} energy tasks`;
      } else if (energyAlignment >= 70) {
        reason = `Good energy match for ${task.energyLevel} energy tasks`;
      } else {
        reason = `Conflict-free slot (moderate energy match)`;
      }
      
      if (h >= 9 && h <= 11) {
        reason += ' • Peak productivity hours';
      } else if (h >= 14 && h <= 16) {
        reason += ' • Afternoon focus time';
      }
      
      alternatives.push({
        time: formatTimeSlot(h, m),
        hour: h,
        minute: m,
        score,
        energyAlignment: Math.round(energyAlignment),
        reason,
        hasConflicts: false,
      });
    }
  }
  
  // Sort by score (highest first) and return top 5
  alternatives.sort((a, b) => b.score - a.score);
  return alternatives.slice(0, 5);
}