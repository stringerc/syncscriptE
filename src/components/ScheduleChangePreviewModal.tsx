/**
 * Schedule Change Preview Modal
 * 
 * Research-backed approach to building user trust:
 * - Nielsen's Visibility Heuristic: Show before/after states
 * - Direct Manipulation: Visual representation of change
 * - Error Prevention: Conflict detection before applying
 * - Progressive Disclosure: Details on demand
 * 
 * Phase 1: Visual preview with conflict detection
 */

import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Calendar, Clock, AlertTriangle, CheckCircle, 
  ArrowRight, Sparkles, TrendingUp, Info, ArrowLeft, Zap
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Task } from '../types/task';
import { CalendarEvent } from '../data/calendar-mock';
import { QuickWin } from '../utils/resonance-optimizer';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from './ui/tooltip';
import { useState } from 'react';
import { AlternativeTimeSlotsView } from './AlternativeTimeSlotsView';
import { toast } from 'sonner@2.0.3';

interface ScheduleChangePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (selectedTime?: string) => void; // NEW: Pass selected time to parent
  quickWin: QuickWin;
  task: Task | undefined;
  allTasks: Task[];
  allEvents: CalendarEvent[];
}

interface TimeSlot {
  time: string;
  hour: number;
  minute: number;
  items: Array<{
    type: 'task' | 'event' | 'proposed';
    title: string;
    duration: number; // minutes
    color: string;
  }>;
}

export function ScheduleChangePreviewModal({
  isOpen,
  onClose,
  onConfirm,
  quickWin,
  task,
  allTasks,
  allEvents,
}: ScheduleChangePreviewModalProps) {
  
  if (!task) return null;

  // State to track if the user is in the "Find Better Time" phase
  const [isFindingBetterTime, setIsFindingBetterTime] = useState(false);
  
  // NEW: Track the selected time (defaults to proposed time)
  const [selectedTime, setSelectedTime] = useState<string>(quickWin.optimalTime);

  // Parse current and SELECTED times (not always proposed)
  const currentTime = parseTime(quickWin.currentTime);
  const displayTime = parseTime(selectedTime); // Use selected time for display
  
  // Get current date for timeline
  const today = new Date();
  const dateDisplay = formatDateDisplay(today);

  // Build timeline slots (30-minute increments, 2 hours before/after)
  const currentSlots = buildTimelineSlots(currentTime, task, allTasks, allEvents, 'current');
  const proposedSlots = buildTimelineSlots(displayTime, task, allTasks, allEvents, 'proposed'); // Use selected time

  // Detect conflicts based on SELECTED time
  const conflicts = detectConflicts(displayTime, task, allTasks, allEvents);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl max-h-[90vh] overflow-y-auto z-50"
          >
            <div className="bg-[#1a1d24] border border-gray-800 rounded-xl shadow-2xl">
              {/* Render either the preview or the alternatives view */}
              {!isFindingBetterTime ? (
                /* ========== ORIGINAL PREVIEW VIEW ========== */
                <>
                  {/* Header */}
                  <div className="border-b border-gray-800 p-6">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-teal-500/10 rounded-lg">
                          <Calendar className="w-5 h-5 text-teal-400" />
                        </div>
                        <div>
                          <h2 className="text-white text-2xl font-bold">Review Schedule Change</h2>
                          <p className="text-gray-400 text-sm mt-1">{dateDisplay}</p>
                        </div>
                      </div>
                      <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-800 rounded-lg"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Task Title */}
                    <div className="bg-gray-900/50 rounded-lg p-4 mt-4">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <h3 className="text-white font-semibold text-lg">{task.title}</h3>
                          <div className="flex items-center gap-3 mt-2 text-sm text-gray-400">
                            <span>Duration: {task.estimatedTime}</span>
                            <span>•</span>
                            <span>Energy: {task.energyLevel}</span>
                            <span>•</span>
                            <span>Priority: {task.priority}</span>
                          </div>
                        </div>
                        <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                          +{quickWin.lift}% performance
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Side-by-Side Comparison */}
                  <div className="p-6">
                    <div className="grid grid-cols-2 gap-6">
                      {/* Current Slot */}
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-2 h-2 rounded-full bg-gray-500" />
                          <h3 className="text-gray-300 font-semibold uppercase text-xs tracking-wide">
                            Current Schedule
                          </h3>
                        </div>
                        
                        <div className="bg-gray-900/30 border border-gray-700 rounded-lg p-4 mb-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <p className="text-white font-mono text-xl">{quickWin.currentTime}</p>
                          </div>
                          <p className="text-gray-500 text-sm">{dateDisplay}</p>
                        </div>

                        {/* Timeline */}
                        <div className="space-y-1">
                          {currentSlots.map((slot, idx) => (
                            <TimelineSlot 
                              key={idx} 
                              slot={slot} 
                              isCurrentTask={slot.items.some(item => item.type === 'proposed')}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Arrow */}
                      <div className="absolute left-1/2 -translate-x-1/2 top-[280px] z-10">
                        <div className="bg-[#1a1d24] border-2 border-teal-500 rounded-full p-3">
                          <ArrowRight className="w-6 h-6 text-teal-400" />
                        </div>
                      </div>

                      {/* Proposed Slot */}
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="w-2 h-2 rounded-full bg-teal-500" />
                          <h3 className="text-teal-300 font-semibold uppercase text-xs tracking-wide">
                            Proposed Schedule
                          </h3>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="w-3 h-3 text-gray-500 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs bg-gray-900 border-gray-700">
                                <p className="text-sm">
                                  AI-optimized time based on your energy patterns and schedule flow.
                                </p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                        
                        <div className="bg-teal-950/30 border border-teal-500/30 rounded-lg p-4 mb-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-teal-400" />
                            <p className="text-white font-mono text-xl">{selectedTime}</p>
                          </div>
                          <p className="text-gray-400 text-sm">{dateDisplay}</p>
                        </div>

                        {/* Timeline */}
                        <div className="space-y-1">
                          {proposedSlots.map((slot, idx) => (
                            <TimelineSlot 
                              key={idx} 
                              slot={slot} 
                              isProposedTask={slot.items.some(item => item.type === 'proposed')}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Conflict Warnings */}
                    {conflicts.length > 0 && (
                      <div className="mt-6 bg-red-950/30 border border-red-500/30 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="text-red-300 font-semibold mb-2">
                              {conflicts.length} Scheduling Conflict{conflicts.length > 1 ? 's' : ''} Detected
                            </h4>
                            <ul className="space-y-1">
                              {conflicts.map((conflict, idx) => (
                                <li key={idx} className="text-red-200 text-sm">
                                  • {conflict}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Benefits */}
                    {conflicts.length === 0 && (
                      <div className="mt-6 bg-emerald-950/30 border border-emerald-500/30 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="text-emerald-300 font-semibold mb-2">No Conflicts Found</h4>
                            <div className="space-y-1 text-sm text-gray-300">
                              <p>✓ Time slot is available</p>
                              <p>✓ Better energy alignment (+{quickWin.lift}% performance)</p>
                              <p>✓ Optimal time for {task.energyLevel} energy tasks</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Footer Actions */}
                  <div className="border-t border-gray-800 p-6 flex items-center justify-between">
                    <Button
                      variant="ghost"
                      onClick={onClose}
                      className="text-gray-400 hover:text-white"
                    >
                      Cancel
                    </Button>

                    <div className="flex items-center gap-3">
                      {conflicts.length > 0 && (
                        <Button
                          variant="outline"
                          className="border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/10"
                          onClick={() => {
                            // TODO: Find Better Time functionality (Phase 3)
                            setIsFindingBetterTime(true);
                          }}
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Find Better Time
                        </Button>
                      )}
                      
                      <Button
                        onClick={() => {
                          onConfirm(selectedTime);
                          onClose();
                        }}
                        className={`${
                          conflicts.length > 0
                            ? 'bg-yellow-600 hover:bg-yellow-700'
                            : 'bg-teal-600 hover:bg-teal-700'
                        }`}
                      >
                        {conflicts.length > 0 ? (
                          <>
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Reschedule Anyway
                          </>
                        ) : (
                          <>
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Confirm Reschedule
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                /* ========== ALTERNATIVE TIME SLOTS VIEW ========== */
                <AlternativeTimeSlotsView
                  task={task}
                  allTasks={allTasks}
                  allEvents={allEvents}
                  onSelectTime={(time) => {
                    // TODO: Update the proposed time and go back to preview
                    setIsFindingBetterTime(false);
                    // Note: We'd need to trigger a reschedule with the new time here
                    toast.success(`Rescheduling to ${time.hour}:${time.minute}`);
                    setSelectedTime(`${time.hour}:${time.minute} ${time.hour < 12 ? 'AM' : 'PM'}`);
                  }}
                  onGoBack={() => setIsFindingBetterTime(false)}
                  currentTime={quickWin.currentTime}
                  dateDisplay={dateDisplay}
                />
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ==================== HELPER COMPONENTS ====================

interface TimelineSlotProps {
  slot: TimeSlot;
  isCurrentTask?: boolean;
  isProposedTask?: boolean;
}

function TimelineSlot({ slot, isCurrentTask, isProposedTask }: TimelineSlotProps) {
  const hasItems = slot.items.length > 0;
  
  return (
    <div className={`flex items-start gap-2 py-2 px-3 rounded transition-colors ${
      isCurrentTask ? 'bg-gray-700/30 border border-gray-600' :
      isProposedTask ? 'bg-teal-500/20 border border-teal-500/40' :
      hasItems ? 'bg-gray-800/30' :
      'bg-transparent'
    }`}>
      {/* Time label */}
      <div className="w-16 flex-shrink-0">
        <p className={`text-xs font-mono ${
          isProposedTask ? 'text-teal-300 font-semibold' :
          isCurrentTask ? 'text-gray-300 font-semibold' :
          'text-gray-500'
        }`}>
          {slot.time}
        </p>
      </div>

      {/* Items */}
      <div className="flex-1 space-y-1">
        {slot.items.length === 0 ? (
          <div className="h-4 border-l-2 border-dashed border-gray-800" />
        ) : (
          slot.items.map((item, idx) => (
            <div 
              key={idx}
              className={`text-xs px-2 py-1 rounded border ${
                item.type === 'proposed' 
                  ? 'bg-teal-500/20 border-teal-500/40 text-teal-300 font-medium'
                  : item.type === 'task'
                  ? 'bg-blue-500/20 border-blue-500/40 text-blue-300'
                  : 'bg-purple-500/20 border-purple-500/40 text-purple-300'
              }`}
            >
              <div className="flex items-center gap-1">
                <div 
                  className={`w-1.5 h-1.5 rounded-full ${item.color}`}
                />
                <span className="truncate">{item.title}</span>
                {item.duration > 30 && (
                  <span className="text-[10px] opacity-70 ml-auto">
                    {item.duration}m
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Parse time string to hour/minute
 */
function parseTime(timeStr: string): { hour: number; minute: number } {
  const match = timeStr.match(/(\d+)(?::(\d+))?\s*(AM|PM)/i);
  if (!match) return { hour: 0, minute: 0 };

  let hour = parseInt(match[1]);
  const minute = parseInt(match[2] || '0');
  const period = match[3].toUpperCase();

  // Convert to 24-hour
  if (period === 'PM' && hour !== 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;

  return { hour, minute };
}

/**
 * Format date for display
 */
function formatDateDisplay(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const dateToCheck = new Date(date);
  dateToCheck.setHours(0, 0, 0, 0);
  
  if (dateToCheck.getTime() === today.getTime()) {
    return `Today, ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  } else if (dateToCheck.getTime() === tomorrow.getTime()) {
    return `Tomorrow, ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  } else {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  }
}

/**
 * Build timeline slots (30-min increments, 2 hours before/after)
 */
function buildTimelineSlots(
  centerTime: { hour: number; minute: number },
  task: Task,
  allTasks: Task[],
  allEvents: CalendarEvent[],
  mode: 'current' | 'proposed'
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  
  // Calculate range (2 hours before, 2 hours after)
  const startHour = Math.max(0, centerTime.hour - 2);
  const endHour = Math.min(23, centerTime.hour + 2);
  
  // Generate 30-minute slots
  for (let h = startHour; h <= endHour; h++) {
    for (let m of [0, 30]) {
      // Skip if past end time
      if (h === endHour && m > centerTime.minute) break;
      
      const slotTime = { hour: h, minute: m };
      const items: TimeSlot['items'] = [];
      
      // Check if this is the task's time slot
      if (h === centerTime.hour && m === centerTime.minute) {
        items.push({
          type: 'proposed',
          title: task.title,
          duration: parseEstimatedTime(task.estimatedTime),
          color: 'bg-teal-400',
        });
      }
      
      // Add other scheduled tasks at this time
      for (const t of allTasks) {
        if (!t.scheduledTime || t.id === task.id) continue;
        
        const taskTime = new Date(t.scheduledTime);
        const taskHour = taskTime.getHours();
        const taskMinute = taskTime.getMinutes();
        
        // Check if task starts at this slot
        if (taskHour === h && Math.floor(taskMinute / 30) * 30 === m) {
          items.push({
            type: 'task',
            title: t.title,
            duration: parseEstimatedTime(t.estimatedTime),
            color: 'bg-blue-400',
          });
        }
      }
      
      // Add calendar events at this time
      for (const event of allEvents) {
        const eventStart = new Date(event.start);
        const eventHour = eventStart.getHours();
        const eventMinute = eventStart.getMinutes();
        
        // Check if event starts at this slot
        if (eventHour === h && Math.floor(eventMinute / 30) * 30 === m) {
          items.push({
            type: 'event',
            title: event.title,
            duration: calculateEventDuration(event),
            color: 'bg-purple-400',
          });
        }
      }
      
      slots.push({
        time: formatTimeSlot(h, m),
        hour: h,
        minute: m,
        items,
      });
    }
  }
  
  return slots;
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
 * Calculate event duration in minutes
 */
function calculateEventDuration(event: CalendarEvent): number {
  const start = new Date(event.start);
  const end = new Date(event.end);
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
}

/**
 * Detect scheduling conflicts
 * Improved to check same-day conflicts properly
 */
function detectConflicts(
  proposedTime: { hour: number; minute: number },
  task: Task,
  allTasks: Task[],
  allEvents: CalendarEvent[]
): string[] {
  const conflicts: string[] = [];
  const taskDuration = parseEstimatedTime(task.estimatedTime);
  
  // Create proposed date for TODAY at the proposed time
  const proposedDate = new Date();
  proposedDate.setHours(proposedTime.hour, proposedTime.minute, 0, 0);
  
  // Create proposed time range
  const proposedStart = proposedDate.getTime();
  const proposedEnd = proposedStart + (taskDuration * 60 * 1000); // Convert minutes to ms
  
  // Check task conflicts (only check tasks scheduled for today)
  for (const t of allTasks) {
    if (!t.scheduledTime || t.id === task.id) continue;
    
    const taskTime = new Date(t.scheduledTime);
    const taskStart = taskTime.getTime();
    const taskEnd = taskStart + (parseEstimatedTime(t.estimatedTime) * 60 * 1000);
    
    // Only check conflicts if both tasks are on the same day
    if (isSameDay(proposedDate, taskTime)) {
      // Check for overlap
      if (proposedStart < taskEnd && proposedEnd > taskStart) {
        conflicts.push(`Overlaps with task: "${t.title}" at ${formatTimeSlot(taskTime.getHours(), taskTime.getMinutes())}`);
      }
    }
  }
  
  // Check event conflicts (including relative-time events like "1 hour from now")
  for (const event of allEvents) {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    
    // Check if event occurs today or within the next 24 hours
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Only check if event is today or tomorrow (to catch "N hours from now" events)
    if (eventStart <= tomorrow) {
      const eventStartTime = eventStart.getTime();
      const eventEndTime = eventEnd.getTime();
      
      // Check for overlap
      if (proposedStart < eventEndTime && proposedEnd > eventStartTime) {
        conflicts.push(`Overlaps with event: "${event.title}" at ${formatTimeSlot(eventStart.getHours(), eventStart.getMinutes())}`);
      }
    }
  }
  
  return conflicts;
}

/**
 * Check if two dates are on the same day
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

/**
 * Find alternative time slots
 */
function findAlternativeTimeSlots(task: Task, allTasks: Task[], allEvents: CalendarEvent[]): AlternativeTimeSlot[] {
  const alternatives: AlternativeTimeSlot[] = [];
  
  // Define a range of hours to check (e.g., 8 AM to 10 PM)
  const startHour = 8;
  const endHour = 22;
  
  // Generate 30-minute slots
  for (let h = startHour; h <= endHour; h++) {
    for (let m of [0, 30]) {
      const slotTime = { hour: h, minute: m };
      const items: TimeSlot['items'] = [];
      
      // Add other scheduled tasks at this time
      for (const t of allTasks) {
        if (!t.scheduledTime || t.id === task.id) continue;
        
        const taskTime = new Date(t.scheduledTime);
        const taskHour = taskTime.getHours();
        const taskMinute = taskTime.getMinutes();
        
        // Check if task starts at this slot
        if (taskHour === h && Math.floor(taskMinute / 30) * 30 === m) {
          items.push({
            type: 'task',
            title: t.title,
            duration: parseEstimatedTime(t.estimatedTime),
            color: 'bg-blue-400',
          });
        }
      }
      
      // Add calendar events at this time
      for (const event of allEvents) {
        const eventStart = new Date(event.start);
        const eventHour = eventStart.getHours();
        const eventMinute = eventStart.getMinutes();
        
        // Check if event starts at this slot
        if (eventHour === h && Math.floor(eventMinute / 30) * 30 === m) {
          items.push({
            type: 'event',
            title: event.title,
            duration: calculateEventDuration(event),
            color: 'bg-purple-400',
          });
        }
      }
      
      // Check if the slot is available
      if (items.length === 0) {
        alternatives.push({
          time: formatTimeSlot(h, m),
          hour: h,
          minute: m,
        });
      }
    }
  }
  
  return alternatives;
}

/**
 * Alternative Time Slot Interface
 */
interface AlternativeTimeSlot {
  time: string;
  hour: number;
  minute: number;
}