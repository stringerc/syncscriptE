import { Task } from '../types/task';
import { CalendarEvent } from '../data/calendar-mock';
import { getCurrentDate, getStartOfToday, getEndOfToday } from './app-date';

/**
 * Resonance Optimizer Utilities
 * 
 * Algorithms for:
 * 1. Generating Quick Wins (immediate improvements)
 * 2. Finding Next Best Slot (optimal unscheduled task placement)
 * 3. Analyzing schedule resonance
 * 
 * Research-backed approach:
 * - Energy matching: High-energy tasks during high-energy times
 * - Context switching minimization
 * - Break scheduling (Pomodoro research)
 */

export interface QuickWin {
  id: string;
  taskId: string;
  taskTitle: string;
  currentTime: string;
  optimalTime: string;
  lift: number;
  type: 'task' | 'meeting' | 'break';
}

export interface NextBestSlot {
  taskId?: string;
  taskTitle?: string;
  time: string;
  duration: string;
  peakIn: string;
  resonanceScore: number;
  suitableFor: string[];
}

export interface CalendarGap {
  start: Date;
  end: Date;
  duration: number; // milliseconds
  energy: number; // 0-1
}

/**
 * Calculate energy level for a given hour (0-23)
 * Based on circadian rhythm research
 */
export function getEnergyForHour(hour: number): number {
  // Research-based energy curve:
  // - Peak: 9-11 AM (0.9-1.0)
  // - High: 2-4 PM (0.7-0.8)
  // - Low: 1-2 PM (0.5) - post-lunch dip
  // - Very Low: 3-5 AM (0.2-0.3)
  
  if (hour >= 9 && hour <= 11) return 0.9 + (Math.random() * 0.1); // Peak morning
  if (hour >= 14 && hour <= 16) return 0.7 + (Math.random() * 0.1); // Afternoon high
  if (hour >= 7 && hour <= 8) return 0.75; // Early morning
  if (hour >= 12 && hour <= 13) return 0.5; // Post-lunch dip
  if (hour >= 17 && hour <= 19) return 0.6; // Early evening
  if (hour >= 20 || hour <= 6) return 0.3; // Night/early morning
  
  return 0.6; // Default moderate energy
}

/**
 * Convert Task.energyLevel to numeric value
 */
export function energyLevelToNumber(level: 'high' | 'medium' | 'low'): number {
  switch (level) {
    case 'high': return 0.9;
    case 'medium': return 0.6;
    case 'low': return 0.3;
  }
}

/**
 * Format ISO datetime to readable time
 */
export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  // Always include minutes for consistent parsing (10:00 AM, not 10 AM)
  const displayMinutes = `:${minutes.toString().padStart(2, '0')}`;
  
  return `${displayHours}${displayMinutes} ${ampm}`;
}

/**
 * Format duration in milliseconds to readable string
 */
export function formatDuration(ms: number): string {
  const hours = ms / (1000 * 60 * 60);
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  
  if (wholeHours === 0) return `${minutes}m`;
  if (minutes === 0) return `${wholeHours}h`;
  return `${wholeHours}h ${minutes}m`;
}

/**
 * Calculate time until a future datetime
 */
export function calculateTimeUntil(futureDate: Date): string {
  const now = new Date();
  const diff = futureDate.getTime() - now.getTime();
  
  if (diff < 0) return 'Now';
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours === 0) return `${minutes}m`;
  return `${hours}h ${minutes}m`;
}

/**
 * Find gaps in calendar where tasks can be scheduled
 * FIXED: Now looks at next 7 days instead of just today
 */
export function findCalendarGaps(events: CalendarEvent[]): CalendarGap[] {
  const gaps: CalendarGap[] = [];
  
  // Get today as base date
  const baseDate = getCurrentDate();
  
  // Look ahead 7 days to find available slots
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const currentDay = new Date(baseDate);
    currentDay.setDate(currentDay.getDate() + dayOffset);
    currentDay.setHours(0, 0, 0, 0);
    
    const workStart = new Date(currentDay);
    workStart.setHours(8, 0, 0, 0);
    
    const workEnd = new Date(currentDay);
    workEnd.setHours(18, 0, 0, 0);
    
    // Filter events for this specific day
    const dayEvents = events.filter(e => {
      const eventDate = new Date(e.start);
      return eventDate.getFullYear() === currentDay.getFullYear() &&
             eventDate.getMonth() === currentDay.getMonth() &&
             eventDate.getDate() === currentDay.getDate();
    });
    
    // Sort events by start time
    const sortedEvents = [...dayEvents].sort((a, b) => 
      new Date(a.start).getTime() - new Date(b.start).getTime()
    );
    
    // Find first gap (from work start to first event)
    if (sortedEvents.length > 0) {
      const firstEventStart = new Date(sortedEvents[0].start);
      if (firstEventStart > workStart) {
        const duration = firstEventStart.getTime() - workStart.getTime();
        if (duration >= 30 * 60 * 1000) { // At least 30 minutes
          gaps.push({
            start: workStart,
            end: firstEventStart,
            duration,
            energy: getEnergyForHour(workStart.getHours()),
          });
        }
      }
    }
    
    // Find gaps between events
    for (let i = 0; i < sortedEvents.length - 1; i++) {
      const currentEventEnd = new Date(sortedEvents[i].end);
      const nextEventStart = new Date(sortedEvents[i + 1].start);
      
      const duration = nextEventStart.getTime() - currentEventEnd.getTime();
      
      // Only include gaps of 30+ minutes
      if (duration >= 30 * 60 * 1000) {
        gaps.push({
          start: currentEventEnd,
          end: nextEventStart,
          duration,
          energy: getEnergyForHour(currentEventEnd.getHours()),
        });
      }
    }
    
    // Find last gap (from last event to work end)
    if (sortedEvents.length > 0) {
      const lastEventEnd = new Date(sortedEvents[sortedEvents.length - 1].end);
      if (lastEventEnd < workEnd) {
        const duration = workEnd.getTime() - lastEventEnd.getTime();
        if (duration >= 30 * 60 * 1000) {
          gaps.push({
            start: lastEventEnd,
            end: workEnd,
            duration,
            energy: getEnergyForHour(lastEventEnd.getHours()),
          });
        }
      }
    }
    
    // If no events for this day, entire work day is available
    if (sortedEvents.length === 0) {
      gaps.push({
        start: workStart,
        end: workEnd,
        duration: workEnd.getTime() - workStart.getTime(),
        energy: 0.8, // Assume good overall energy
      });
    }
  }
  
  return gaps;
}

/**
 * Find optimal time slot for a specific task
 */
export function findOptimalSlotForTask(
  task: Task,
  gaps: CalendarGap[]
): { time: Date; energy: number; resonance: number } | null {
  const taskEnergy = energyLevelToNumber(task.energyLevel);
  const estimatedMinutes = parseEstimatedTime(task.estimatedTime);
  const requiredDuration = estimatedMinutes * 60 * 1000; // milliseconds
  
  // Find gaps that fit the task duration
  const fittingGaps = gaps.filter(gap => gap.duration >= requiredDuration);
  
  if (fittingGaps.length === 0) return null;
  
  // Score each gap based on energy match
  const scoredGaps = fittingGaps.map(gap => {
    const energyMatch = 1 - Math.abs(gap.energy - taskEnergy);
    const resonance = energyMatch * gap.energy; // Higher is better
    
    return {
      gap,
      resonance,
    };
  });
  
  // Sort by resonance (best match first)
  scoredGaps.sort((a, b) => b.resonance - a.resonance);
  
  const bestGap = scoredGaps[0];
  
  return {
    time: bestGap.gap.start,
    energy: bestGap.gap.energy,
    resonance: bestGap.resonance,
  };
}

/**
 * Parse estimated time string (e.g., "2h 30m") to minutes
 */
export function parseEstimatedTime(timeStr: string): number {
  const hourMatch = timeStr.match(/(\d+)h/);
  const minuteMatch = timeStr.match(/(\d+)m/);
  
  const hours = hourMatch ? parseInt(hourMatch[1]) : 0;
  const minutes = minuteMatch ? parseInt(minuteMatch[1]) : 0;
  
  return hours * 60 + minutes;
}

/**
 * Generate Quick Wins - immediate actionable improvements
 */
export function generateQuickWins(
  tasks: Task[],
  events: CalendarEvent[]
): QuickWin[] {
  const wins: QuickWin[] = [];
  
  // Get calendar gaps
  const gaps = findCalendarGaps(events);
  
  console.log('🔍 Quick Wins Analysis:', {
    totalTasks: tasks.length,
    events: events.length,
    gaps: gaps.length,
    gapDetails: gaps.map(g => ({
      start: g.start.toLocaleTimeString(),
      end: g.end.toLocaleTimeString(),
      duration: `${Math.round(g.duration / (1000 * 60))}min`,
      energy: g.energy.toFixed(2),
    }))
  });
  
  // Find mismatched scheduled tasks (high energy task in low energy slot)
  const scheduledTasks = tasks.filter(t => t.scheduledTime && !t.completed);
  
  console.log(`📋 Found ${scheduledTasks.length} scheduled tasks:`, scheduledTasks.map(t => ({
    title: t.title,
    scheduledTime: t.scheduledTime,
    energyLevel: t.energyLevel,
  })));
  
  for (const task of scheduledTasks) {
    const currentTime = new Date(task.scheduledTime!);
    const currentHour = currentTime.getHours();
    const currentEnergy = getEnergyForHour(currentHour);
    const taskEnergy = energyLevelToNumber(task.energyLevel);
    
    console.log(`⚡ Task "${task.title}":`, {
      scheduledHour: currentHour,
      currentEnergy: currentEnergy.toFixed(2),
      taskEnergy: taskEnergy.toFixed(2),
      mismatch: (taskEnergy - currentEnergy).toFixed(2),
      needsOptimization: taskEnergy - currentEnergy > 0.3,
    });
    
    // If task requires significantly more energy than current time provides
    if (taskEnergy - currentEnergy > 0.3) {
      const optimalSlot = findOptimalSlotForTask(task, gaps);
      
      console.log(`  → Found optimal slot:`, optimalSlot);
      
      if (optimalSlot && optimalSlot.time.getTime() !== currentTime.getTime()) {
        const lift = Math.round(((optimalSlot.resonance - (taskEnergy * currentEnergy)) / (taskEnergy * currentEnergy)) * 100);
        
        wins.push({
          id: `qw-${task.id}`,
          taskId: task.id,
          taskTitle: task.title,
          currentTime: formatTime(task.scheduledTime!),
          optimalTime: formatTime(optimalSlot.time.toISOString()),
          lift: Math.max(lift, 10), // At least 10% improvement
          type: 'task',
        });
      }
    }
  }
  
  // Find missing breaks (3+ hours without break)
  const breakWin = findMissingBreak(events);
  if (breakWin) {
    wins.push(breakWin);
  }
  
  // Find meetings during peak focus hours (9-11 AM)
  const meetingWin = findPeakHourMeeting(events, gaps);
  if (meetingWin) {
    wins.push(meetingWin);
  }
  
  // Sort by lift (highest impact first) and return top 3
  wins.sort((a, b) => b.lift - a.lift);
  
  return wins.slice(0, 3);
}

/**
 * Find if there's a missing break (3+ hours without rest)
 */
function findMissingBreak(events: CalendarEvent[]): QuickWin | null {
  // Sort events by start time
  const sortedEvents = [...events].sort((a, b) => 
    new Date(a.start).getTime() - new Date(b.start).getTime()
  );
  
  // Check for gaps larger than 3 hours without a break
  for (let i = 0; i < sortedEvents.length - 1; i++) {
    const currentEnd = new Date(sortedEvents[i].end);
    const nextStart = new Date(sortedEvents[i + 1].start);
    
    const gap = nextStart.getTime() - currentEnd.getTime();
    const gapHours = gap / (1000 * 60 * 60);
    
    // If gap is 3+ hours and no break event exists
    if (gapHours >= 3) {
      const hasBreak = sortedEvents.some(e => 
        e.type === 'break' && 
        new Date(e.start) >= currentEnd && 
        new Date(e.end) <= nextStart
      );
      
      if (!hasBreak) {
        // Suggest break at post-lunch time (1 PM) or midpoint
        const suggestedBreakTime = new Date(currentEnd);
        suggestedBreakTime.setHours(13, 0, 0, 0); // 1 PM
        
        return {
          id: 'qw-break',
          taskId: 'break-suggestion',
          taskTitle: 'Add 15-minute break during low energy',
          currentTime: 'No break scheduled',
          optimalTime: formatTime(suggestedBreakTime.toISOString()),
          lift: 12,
          type: 'break',
        };
      }
    }
  }
  
  return null;
}

/**
 * Find meetings scheduled during peak focus hours
 */
function findPeakHourMeeting(events: CalendarEvent[], gaps: CalendarGap[]): QuickWin | null {
  const peakHours = [9, 10, 11]; // 9-11 AM
  
  for (const event of events) {
    if (event.type === 'meeting') {
      const hour = new Date(event.start).getHours();
      
      if (peakHours.includes(hour)) {
        // Find afternoon slot for this meeting
        const afternoonSlot = gaps.find(gap => {
          const gapHour = gap.start.getHours();
          return gapHour >= 14 && gapHour <= 16; // 2-4 PM
        });
        
        if (afternoonSlot) {
          return {
            id: `qw-${event.id}`,
            taskId: event.id,
            taskTitle: `Move "${event.title}" to afternoon`,
            currentTime: formatTime(event.start),
            optimalTime: formatTime(afternoonSlot.start.toISOString()),
            lift: 18,
            type: 'meeting',
          };
        }
      }
    }
  }
  
  return null;
}

/**
 * Find Next Best Slot - optimal time for highest priority unscheduled task
 */
export function findNextBestSlot(
  tasks: Task[],
  events: CalendarEvent[]
): NextBestSlot | null {
  // Get unscheduled tasks
  const unscheduledTasks = tasks.filter(t => !t.scheduledTime && !t.completed);
  
  if (unscheduledTasks.length === 0) {
    return null;
  }
  
  // Sort by priority (urgent > high > medium > low)
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  unscheduledTasks.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  // Get the highest priority task
  const topTask = unscheduledTasks[0];
  
  // Find calendar gaps
  const gaps = findCalendarGaps(events);
  
  if (gaps.length === 0) {
    return null;
  }
  
  // Find optimal slot for this task
  const optimalSlot = findOptimalSlotForTask(topTask, gaps);
  
  if (!optimalSlot) {
    // If no perfect match, use the longest high-energy gap
    gaps.sort((a, b) => {
      const scoreA = a.energy * a.duration;
      const scoreB = b.energy * b.duration;
      return scoreB - scoreA;
    });
    
    const bestGap = gaps[0];
    
    return {
      taskId: topTask.id,
      taskTitle: topTask.title,
      time: formatTime(bestGap.start.toISOString()),
      duration: formatDuration(bestGap.duration),
      peakIn: calculateTimeUntil(bestGap.start),
      resonanceScore: bestGap.energy,
      suitableFor: getSuitableTaskTypes(bestGap.energy),
    };
  }
  
  // Calculate gap duration
  const matchingGap = gaps.find(g => g.start.getTime() === optimalSlot.time.getTime());
  const duration = matchingGap ? matchingGap.duration : 2 * 60 * 60 * 1000; // Default 2 hours
  
  return {
    taskId: topTask.id,
    taskTitle: topTask.title,
    time: formatTime(optimalSlot.time.toISOString()),
    duration: formatDuration(duration),
    peakIn: calculateTimeUntil(optimalSlot.time),
    resonanceScore: optimalSlot.resonance,
    suitableFor: getSuitableTaskTypes(optimalSlot.energy),
  };
}

/**
 * Get suitable task types for an energy level
 */
export function getSuitableTaskTypes(energy: number): string[] {
  if (energy >= 0.8) {
    return ['Deep work', 'Code review', 'Creative tasks', 'Problem solving'];
  } else if (energy >= 0.6) {
    return ['Meetings', 'Collaboration', 'Planning', 'Email'];
  } else {
    return ['Admin tasks', 'Light reading', 'Organizing', 'Breaks'];
  }
}

/**
 * Calculate overall resonance score based on schedule
 */
export function calculateResonanceScore(
  tasks: Task[],
  events: CalendarEvent[]
): number {
  const scheduledTasks = tasks.filter(t => t.scheduledTime && !t.completed);
  
  if (scheduledTasks.length === 0 && events.length === 0) {
    return 0.5; // Neutral if no schedule
  }
  
  let totalResonance = 0;
  let count = 0;
  
  // Calculate resonance for each scheduled task
  for (const task of scheduledTasks) {
    const hour = new Date(task.scheduledTime!).getHours();
    const timeEnergy = getEnergyForHour(hour);
    const taskEnergy = energyLevelToNumber(task.energyLevel);
    
    // Resonance = how well time energy matches task energy
    const match = 1 - Math.abs(timeEnergy - taskEnergy);
    totalResonance += match;
    count++;
  }
  
  // Calculate resonance for events (assume medium energy requirement)
  for (const event of events) {
    const hour = new Date(event.start).getHours();
    const timeEnergy = getEnergyForHour(hour);
    
    // Meetings during peak hours = lower resonance
    if (event.type === 'meeting' && hour >= 9 && hour <= 11) {
      totalResonance += 0.6;
    } else {
      totalResonance += 0.8;
    }
    count++;
  }
  
  return count > 0 ? totalResonance / count : 0.5;
}