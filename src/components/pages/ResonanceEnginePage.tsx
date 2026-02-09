import React, { useState, useMemo } from 'react';
import { Brain, TrendingUp, Zap, Target, DollarSign, Clock, Calendar, ChevronDown, ChevronUp, Sparkles, RotateCcw, CheckCircle, ArrowRight, Info, Gauge, AlertCircle, Settings, Waves } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner@2.0.3';
import { DashboardLayout } from '../layout/DashboardLayout';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Badge } from '../ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { useTasks } from '../../hooks/useTasks';
import { ScheduleChangePreviewModal } from '../ScheduleChangePreviewModal';
import { RescheduleSuccessModal } from '../RescheduleSuccessModal';
import { ResonanceBadge } from '../ResonanceBadge';
import { ResonanceAIInsights } from '../ResonanceAIInsights';
import { ResourceBalanceChart } from '../ResourceBalanceChart';
import { ResonanceWaveGraph } from '../ResonanceWaveGraph';
import { ResponsiveContainer, AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ReferenceLine } from 'recharts';
import { calculateOverallResonance, getEnergyLevelForHour, getCircadianCurve, calculateResonanceScore, type TimeSlot, type UserContext } from '../../utils/resonance-calculus';
import { calculateResourceBalance } from '../../utils/resource-balance';
import { generateQuickWins, findNextBestSlot, type QuickWin } from '../../utils/resonance-optimizer';
import { useCalendarEvents } from '../../hooks/useCalendarEvents'; // Use real calendar events
import { getCurrentDate } from '../../utils/app-date'; // CRITICAL: Use app date for consistency

// Helper component for dimension cards
function DimensionCard({ 
  label, 
  score, 
  icon, 
  insights 
}: { 
  label: string; 
  score: number; 
  icon: React.ReactNode; 
  insights: string[];
}) {
  const color = getDimensionColor(score);
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="bg-black/40 rounded-lg p-4 border border-gray-800 hover:border-gray-700 transition-colors cursor-help">
            <div className="flex items-center gap-2 mb-2">
              {icon}
              <span className="text-sm text-gray-400">{label}</span>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-2xl font-bold text-white">{score.toFixed(2)}</span>
              <div 
                className="w-2 h-2 rounded-full mb-1.5"
                style={{ backgroundColor: color }}
              />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs bg-gray-900 border-gray-700">
          <div className="space-y-1">
            {insights.map((insight, i) => (
              <p key={i} className="text-sm text-gray-300">• {insight}</p>
            ))}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// Helper function to get color based on score
function getDimensionColor(score: number): string {
  if (score >= 0.8) return '#10b981'; // green
  if (score >= 0.6) return '#f59e0b'; // amber
  if (score >= 0.4) return '#f97316'; // orange
  return '#ef4444'; // red
}

// Helper function to get status emoji
function getStatusEmoji(status: string): string {
  if (status.includes('Excellent') || status.includes('Strong')) return '🎯';
  if (status.includes('Good') || status.includes('Healthy')) return '✅';
  if (status.includes('Moderate')) return '⚠️';
  return '🔴';
}

interface ResonanceEnginePageProps {
  onNavigateToCalendar?: (taskId?: string) => void; // Pass task ID for highlighting
}

export function ResonanceEnginePage({ onNavigateToCalendar }: ResonanceEnginePageProps) {
  const [showAdvancedMetrics, setShowAdvancedMetrics] = useState(false);
  const [showResourceBalance, setShowResourceBalance] = useState(false);
  
  // ========== PHASE 1: PREVIEW MODAL STATE ==========
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [selectedQuickWin, setSelectedQuickWin] = useState<QuickWin | null>(null);
  
  // ========== PHASE 3: SUCCESS MODAL STATE ==========
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [rescheduledTask, setRescheduledTask] = useState<{ taskId: string; title: string; time: string; date: string } | null>(null);
  
  // ========== PHASE 4: UNDO FUNCTIONALITY ==========
  const [undoStack, setUndoStack] = useState<Array<{
    taskId: string;
    previousTime: string | null;
    newTime: string;
    timestamp: number;
  }>>([]);
  
  // Undo last reschedule
  const handleUndo = async (taskId: string, previousTime: string | null) => {
    try {
      if (previousTime) {
        await scheduleTask(taskId, previousTime);
        toast.success('Task reverted to original time', {
          description: `Restored previous schedule`,
        });
      } else {
        await unscheduleTask(taskId);
        toast.success('Task unscheduled', {
          description: 'Removed from calendar',
        });
      }
      
      // Remove from undo stack
      setUndoStack(prev => prev.filter(item => item.taskId !== taskId));
    } catch (error) {
      toast.error('Failed to undo', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };
  
  // ========== SPRINT 1: REAL DATA INTEGRATION ==========
  // Get real tasks from centralized store (SPRINT 2: Added updateTask, scheduleTask)
  const { tasks: realTasks, updateTask, scheduleTask, unscheduleTask } = useTasks();
  
  // Get real calendar events from shared hook (syncs with Calendar page)
  const { events: realEvents, addEvent, updateEvent } = useCalendarEvents();
  
  // Calculate resource balance (using real tasks and events)
  const resourceBalance = calculateResourceBalance(
    realEvents, // NOW USING REAL EVENTS
    realTasks,
    {
      monthlyBudget: 2500,
      currentSpending: 1850,
      daysInMonth: 30,
      dayOfMonth: 18,
      savingsGoal: 5000,
      currentSavings: 3750,
    }
  );
  
  // Calculate REAL resonance score from actual schedule
  const currentResonance = calculateOverallResonance(realTasks, realEvents); // NOW USING REAL EVENTS
  const resonanceStatus = currentResonance >= 0.85 ? 'Excellent sync' : 
                         currentResonance >= 0.70 ? 'Good alignment' : 
                         'Needs optimization';

  // Three core resonance metrics (for advanced view) - CALCULATED FROM REAL DATA
  const advancedMetrics = useMemo(() => {
    // 1. TASK HARMONY: How well tasks align with energy patterns
    const scheduledTasks = realTasks.filter(t => t.scheduledTime && !t.completed);
    if (scheduledTasks.length === 0) {
      return { taskHarmony: 0.75, scheduleFlow: 0.70, deepWorkReady: 0.80 };
    }
    
    const energyAlignmentScores = scheduledTasks.map(task => {
      const taskTime = new Date(task.scheduledTime!);
      const hour = taskTime.getHours();
      const circadianEnergy = getCircadianCurve(hour);
      
      // Map task energy to numeric
      const taskEnergyMap = { high: 1.0, medium: 0.65, low: 0.35 };
      const taskEnergyLevel = taskEnergyMap[task.energyLevel];
      
      // Perfect alignment = 1.0, complete mismatch = 0.0
      return 1.0 - Math.abs(circadianEnergy - taskEnergyLevel);
    });
    
    const taskHarmony = energyAlignmentScores.reduce((sum, s) => sum + s, 0) / energyAlignmentScores.length;
    
    // 2. SCHEDULE FLOW: Context switching and buffer analysis
    const sortedTasks = [...scheduledTasks].sort((a, b) => 
      new Date(a.scheduledTime!).getTime() - new Date(b.scheduledTime!).getTime()
    );
    
    let flowScore = 0.7; // Base score
    let contextSwitchPenalty = 0;
    
    for (let i = 0; i < sortedTasks.length - 1; i++) {
      const currentTask = sortedTasks[i];
      const nextTask = sortedTasks[i + 1];
      
      // Check energy level context switch
      if (currentTask.energyLevel !== nextTask.energyLevel) {
        contextSwitchPenalty += 0.05;
      }
      
      // Check time buffer between tasks
      const currentEnd = new Date(currentTask.scheduledTime!);
      const estimatedDuration = parseInt(currentTask.estimatedTime?.replace(/[^\d]/g, '') || '60');
      currentEnd.setMinutes(currentEnd.getMinutes() + estimatedDuration);
      
      const nextStart = new Date(nextTask.scheduledTime!);
      const bufferMinutes = (nextStart.getTime() - currentEnd.getTime()) / (1000 * 60);
      
      if (bufferMinutes < 15) {
        contextSwitchPenalty += 0.08; // Tight schedule
      } else if (bufferMinutes >= 30) {
        flowScore += 0.05; // Good buffer
      }
    }
    
    const scheduleFlow = Math.max(0, Math.min(1, flowScore - contextSwitchPenalty));
    
    // 3. DEEP WORK READY: Uninterrupted blocks available
    const currentAppDate = getCurrentDate();
    const currentHour = currentAppDate.getHours();
    
    // Check for 2+ hour uninterrupted blocks in peak hours (9-11 AM, 3-5 PM)
    const peakHours = [9, 10, 15, 16];
    let deepWorkBlocks = 0;
    
    peakHours.forEach(hour => {
      const hasTaskAt = scheduledTasks.some(t => {
        const taskHour = new Date(t.scheduledTime!).getHours();
        return taskHour === hour;
      });
      
      if (!hasTaskAt) deepWorkBlocks++;
    });
    
    const deepWorkReady = Math.min(1, 0.5 + (deepWorkBlocks * 0.15));
    
    return { taskHarmony, scheduleFlow, deepWorkReady };
  }, [realTasks]);
  
  // ========== GENERATE REAL QUICK WINS ==========
  // Analyze schedule and find actionable improvements
  const allQuickWins: QuickWin[] = generateQuickWins(realTasks, realEvents); // NOW USING REAL EVENTS
  
  // FILTER: Only show Quick Wins for actual tasks (not calendar events)
  // Calendar events need different handling (updateEvent instead of scheduleTask)
  const quickWins = allQuickWins.filter(win => {
    // Check if this Quick Win references a real task
    const taskExists = realTasks.some(t => t.id === win.taskId);
    
    if (!taskExists) {
      console.log(`⚠️ Skipping Quick Win "${win.taskTitle}" - references calendar event, not task`);
    }
    
    return taskExists;
  });
  
  // Debug logging
  console.log('🎯 Resonance Engine - Quick Wins Analysis:', {
    totalTasks: realTasks.length,
    scheduledTasks: realTasks.filter(t => t.scheduledTime).length,
    totalEvents: realEvents.length, // NEW: Log real events count
    allQuickWinsGenerated: allQuickWins.length,
    taskQuickWinsFiltered: quickWins.length,
    quickWins: quickWins,
  });

  // ========== FIND REAL NEXT BEST SLOT ==========
  // Find optimal time for highest priority unscheduled task
  const nextBestSlotData = findNextBestSlot(realTasks, realEvents); // NOW USING REAL EVENTS
  
  // Fallback if no unscheduled tasks
  const nextBestSlot = nextBestSlotData || {
    time: 'No slots available',
    duration: '0h',
    peakIn: 'N/A',
    resonanceScore: 0,
    suitableFor: ['All tasks scheduled'],
  };

  // ========== SPRINT 2: FUNCTIONAL BUTTON HANDLERS ==========
  
  /**
   * Apply all Quick Wins at once
   */
  const handleOptimizeSchedule = async () => {
    if (quickWins.length === 0) {
      toast.info('Schedule already optimized', {
        description: 'No improvements needed at this time',
      });
      return;
    }

    toast.promise(
      async () => {
        // Apply all quick wins in sequence
        for (const win of quickWins) {
          await handleApplyQuickWin(win, true); // Silent mode
        }
      },
      {
        loading: 'Optimizing your schedule...',
        success: `Applied ${quickWins.length} improvements! 🎉`,
        error: 'Failed to optimize schedule',
      }
    );
  };

  /**
   * Apply a single Quick Win (reschedule a task)
   * CRITICAL FIX: Also create/update calendar event so it appears on the calendar
   */
  const handleApplyQuickWin = async (win: QuickWin, silent = false, selectedTime?: string) => {
    try {
      // Find the task
      const task = realTasks.find(t => t.id === win.taskId);
      if (!task) {
        throw new Error(`Task not found: ${win.taskId}`);
      }
      
      // Use selected time if provided, otherwise use the proposed time from Quick Win
      const timeToSchedule = selectedTime || win.optimalTime;
      
      // Parse the time to create ISO datetime
      // Handles both "10:30 AM" and "10 AM" formats
      const optimalTimeMatch = timeToSchedule.match(/(\d+)(?::(\d+))?\s*(AM|PM)/i);
      
      if (!optimalTimeMatch) {
        throw new Error(`Invalid time format: ${timeToSchedule}`);
      }

      let hours = parseInt(optimalTimeMatch[1]);
      const minutes = parseInt(optimalTimeMatch[2] || '0'); // Default to 0 if no minutes
      const period = optimalTimeMatch[3].toUpperCase();

      // Convert to 24-hour format
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;

      // CRITICAL FIX: Use app date (Jan 10, 2026 in demo mode) instead of real current date
      const scheduledDateTime = getCurrentDate(); // This returns Jan 10, 2026 in demo mode
      scheduledDateTime.setHours(hours, minutes, 0, 0);

      // Calculate end time based on task's estimated time
      const endDateTime = new Date(scheduledDateTime);
      // Parse estimated time (e.g., "2h", "30m", "1h 30m")
      const estimatedTime = task.estimatedTime || '1h';
      const hourMatch = estimatedTime.match(/(\d+)h/);
      const minuteMatch = estimatedTime.match(/(\d+)m/);
      const estimatedHours = hourMatch ? parseInt(hourMatch[1]) : 0;
      const estimatedMinutes = minuteMatch ? parseInt(minuteMatch[1]) : 0;
      endDateTime.setHours(endDateTime.getHours() + estimatedHours);
      endDateTime.setMinutes(endDateTime.getMinutes() + estimatedMinutes);

      // Update the task with new scheduled time
      await scheduleTask(win.taskId, scheduledDateTime.toISOString());

      // CREATE/UPDATE CALENDAR EVENT (THIS IS THE FIX!)
      // Check if there's already an event for this task
      const existingEvent = realEvents.find(e => e.createdFromTaskId === task.id);
      
      if (existingEvent) {
        // Update existing event
        console.log(`📅 Updating existing calendar event for task "${task.title}"`);
        updateEvent(existingEvent.id, {
          startTime: scheduledDateTime,
          endTime: endDateTime,
          updatedAt: new Date(),
        });
      } else {
        // Create new calendar event
        console.log(`📅 Creating new calendar event for task "${task.title}"`);
        addEvent({
          id: `event-from-task-${task.id}-${Date.now()}`,
          title: task.title,
          description: task.description || '',
          startTime: scheduledDateTime,
          endTime: endDateTime,
          tasks: task.subtasks || [],
          hasScript: false,
          resources: task.resources || [],
          linksNotes: task.linksNotes || [],
          teamMembers: task.assignedTo ? [task.assignedTo] : [],
          createdBy: task.createdBy || 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
          allowTeamEdits: true,
          createdFromTaskId: task.id, // Link back to original task
          parentEventId: task.prepForEventId,
        });
      }

      // CLOSE PREVIEW MODAL
      setPreviewModalOpen(false);
      setSelectedQuickWin(null);

      // Add to undo stack
      setUndoStack(prev => [
        ...prev,
        {
          taskId: win.taskId,
          previousTime: win.currentTime,
          newTime: timeToSchedule, // Use the actual scheduled time
          timestamp: Date.now(),
        }
      ]);

      if (!silent) {
        // Create undo button in toast
        const currentTaskId = win.taskId;
        const currentPreviousTime = win.currentTime;
        
        toast.success(`"${win.taskTitle}" rescheduled`, {
          description: `Moved to ${timeToSchedule} • Expected +${win.lift}% performance`,
          duration: 10000, // 10 seconds to undo
          action: {
            label: 'Undo',
            onClick: () => handleUndo(currentTaskId, currentPreviousTime),
          },
        });
      }

      // Open success modal
      setRescheduledTask({
        taskId: win.taskId,
        title: win.taskTitle,
        time: timeToSchedule, // Show the actual scheduled time
        date: scheduledDateTime.toLocaleDateString(),
      });
      setSuccessModalOpen(true);
    } catch (error) {
      if (!silent) {
        toast.error('Failed to reschedule task', {
          description: error instanceof Error ? error.message : 'Unknown error',
        });
      }
      throw error; // Re-throw for promise handler
    }
  };

  /**
   * Schedule task in the Next Best Slot
   * CRITICAL FIX: Also create calendar event so it appears on the calendar
   */
  const handleScheduleTask = async () => {
    if (!nextBestSlotData || !nextBestSlotData.taskId) {
      toast.info('No unscheduled tasks', {
        description: 'All your tasks are already scheduled',
      });
      return;
    }

    try {
      // Find the task
      const task = realTasks.find(t => t.id === nextBestSlotData.taskId);
      if (!task) {
        throw new Error(`Task not found: ${nextBestSlotData.taskId}`);
      }
      
      // Parse the time from Next Best Slot
      // Handles both "10:30 AM" and "10 AM" formats
      const timeMatch = nextBestSlot.time.match(/(\d+)(?::(\d+))?\s*(AM|PM)/i);
      
      if (!timeMatch) {
        throw new Error(`Invalid time format: ${nextBestSlot.time}`);
      }

      let hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2] || '0'); // Default to 0 if no minutes
      const period = timeMatch[3].toUpperCase();

      // Convert to 24-hour format
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;

      // CRITICAL FIX: Use app date (Jan 10, 2026 in demo mode) instead of real current date
      const scheduledDateTime = getCurrentDate(); // This returns Jan 10, 2026 in demo mode
      scheduledDateTime.setHours(hours, minutes, 0, 0);

      // Calculate end time based on task's estimated time
      const endDateTime = new Date(scheduledDateTime);
      const estimatedTime = task.estimatedTime || '1h';
      const hourMatch = estimatedTime.match(/(\d+)h/);
      const minuteMatch = estimatedTime.match(/(\d+)m/);
      const estimatedHours = hourMatch ? parseInt(hourMatch[1]) : 0;
      const estimatedMinutes = minuteMatch ? parseInt(minuteMatch[1]) : 0;
      endDateTime.setHours(endDateTime.getHours() + estimatedHours);
      endDateTime.setMinutes(endDateTime.getMinutes() + estimatedMinutes);

      // Schedule the task
      await scheduleTask(nextBestSlotData.taskId, scheduledDateTime.toISOString());

      // CREATE CALENDAR EVENT (THIS IS THE FIX!)
      console.log(`📅 Creating calendar event for task "${task.title}"`);
      addEvent({
        id: `event-from-task-${task.id}-${Date.now()}`,
        title: task.title,
        description: task.description || '',
        startTime: scheduledDateTime,
        endTime: endDateTime,
        tasks: task.subtasks || [],
        hasScript: false,
        resources: task.resources || [],
        linksNotes: task.linksNotes || [],
        teamMembers: task.assignedTo ? [task.assignedTo] : [],
        createdBy: task.createdBy || 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        allowTeamEdits: true,
        createdFromTaskId: task.id,
        parentEventId: task.prepForEventId,
      });

      // Add to undo stack
      setUndoStack(prev => [
        ...prev,
        {
          taskId: nextBestSlotData.taskId,
          previousTime: null,
          newTime: nextBestSlot.time,
          timestamp: Date.now(),
        }
      ]);

      toast.success('Task scheduled in optimal window! 🎯', {
        description: `"${nextBestSlotData.taskTitle}" placed at ${nextBestSlot.time} • Resonance: ${nextBestSlot.resonanceScore.toFixed(2)}`,
        duration: 5000,
      });
    } catch (error) {
      toast.error('Failed to schedule task', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  // ========== WAVE TIMELINE DATA (Updated with Real Schedule) ==========
  // Generate 24-hour resonance visualization based on real schedule
  const waveTimelineData = useMemo(() => {
    const currentAppDate = getCurrentDate(); // Jan 10, 2026 in demo mode
    const startOfDay = new Date(currentAppDate.getFullYear(), currentAppDate.getMonth(), currentAppDate.getDate(), 0, 0, 0, 0);
    
    // Step 1: Calculate raw resonance for each hour
    const rawData = Array.from({ length: 24 }, (_, i) => {
      const hour = i;
      const hourStart = new Date(startOfDay);
      hourStart.setHours(hour);
      const hourEnd = new Date(hourStart);
      hourEnd.setHours(hour + 1);
      
      // Get tasks scheduled in this hour
      const tasksInHour = realTasks.filter(task => {
        if (!task.scheduledTime || task.completed) return false;
        const taskTime = new Date(task.scheduledTime);
        return taskTime >= hourStart && taskTime < hourEnd;
      });
      
      // Get events scheduled in this hour
      const eventsInHour = realEvents.filter(event => {
        const eventStart = new Date(event.startTime);
        return eventStart >= hourStart && eventStart < hourEnd;
      });
      
      // Calculate actual resonance for this hour
      let actualResonance: number;
      
      if (tasksInHour.length > 0 || eventsInHour.length > 0) {
        // Hour has scheduled items - calculate REALISTIC resonance
        
        // Research-based: Different activity types have different cognitive values
        const activityResonances: number[] = [];
        const circadianPotential = getCircadianCurve(hour); // What you COULD achieve
        
        // Process tasks
        tasksInHour.forEach(task => {
          const timeSlot: TimeSlot = {
            startTime: hourStart,
            endTime: hourEnd,
            hour,
            duration: 60,
            naturalEnergy: getEnergyLevelForHour(hour),
          };
          
          const context: UserContext = {
            currentTime: getCurrentDate(),
            dayStart: startOfDay,
            schedule: realEvents,
            completedTasksToday: realTasks.filter(t => t.completed).length,
            recentTaskSwitches: 0,
            cognitiveLoad: 0,
          };
          
          const score = calculateResonanceScore(task, timeSlot, context);
          
          // REALISTIC ADJUSTMENT: Task-hour mismatch penalty
          // Research: Doing low-value work during peak hours WASTES potential
          let adjustedScore = score.overall;
          
          // Peak time waste (9-11 AM doing low-energy tasks)
          if (hour >= 9 && hour < 11 && task.energyLevel === 'low') {
            adjustedScore *= 0.65; // Wasting 35% of peak potential
          }
          
          // Good use of peak time (high-energy task at peak hour)
          if (hour >= 9 && hour < 11 && task.energyLevel === 'high') {
            adjustedScore *= 1.05; // Slight bonus for good scheduling
          }
          
          // Afternoon slump with high-energy task (realistic struggle)
          if (hour >= 13 && hour < 15 && task.energyLevel === 'high') {
            adjustedScore *= 0.75; // Swimming upstream
          }
          
          activityResonances.push(adjustedScore);
        });
        
        // Process events (meetings, calls, etc.)
        eventsInHour.forEach(event => {
          // Research: Meetings are typically LOW cognitive value but MEDIUM energy drain
          // Peak time meeting = major waste (Mark et al., 2016)
          let meetingResonance = circadianPotential * 0.60; // Base: meetings use 60% of potential
          
          // Peak time meeting waste (9-11 AM)
          if (hour >= 9 && hour < 11) {
            meetingResonance = circadianPotential * 0.55; // Only capturing 55% of peak potential
          }
          
          // Post-lunch meeting (already low energy, meeting makes it worse)
          if (hour >= 13 && hour < 15) {
            meetingResonance = circadianPotential * 0.70; // Less waste since time already suboptimal
          }
          
          // Afternoon meetings (decent time for collaborative work)
          if (hour >= 15 && hour < 17) {
            meetingResonance = circadianPotential * 0.75; // Better fit
          }
          
          activityResonances.push(meetingResonance);
        });
        
        // Calculate average for the hour
        if (activityResonances.length > 0) {
          actualResonance = activityResonances.reduce((sum, r) => sum + r, 0) / activityResonances.length;
          
          // OVER-SCHEDULING PENALTY (Research: Back-to-back reduces performance)
          // Perlow (1999): No breaks = 20-30% performance degradation
          if (tasksInHour.length + eventsInHour.length > 2) {
            actualResonance *= 0.80; // 20% penalty for packed schedule
          }
        } else {
          actualResonance = circadianPotential;
        }
      } else {
        // No scheduled items - show POTENTIAL (what you could achieve)
        // This creates aspiration gap vs. recommended line
        actualResonance = getCircadianCurve(hour) * 0.85; // Show 85% of potential when empty
      }
      
      return {
        hour,
        rawResonance: actualResonance,
        rawRecommended: getCircadianCurve(hour), // Raw circadian curve
        taskCount: tasksInHour.length,
        eventCount: eventsInHour.length,
      };
    });
    
    // Step 2: Apply 3-point weighted moving average for BOTH curves
    // Research-based: Gaussian weighting [0.25, 0.5, 0.25] preserves peaks while smoothing
    const smoothData = rawData.map((point, i) => {
      const prev = rawData[i - 1] || rawData[i]; // Handle edges
      const curr = rawData[i];
      const next = rawData[i + 1] || rawData[i]; // Handle edges
      
      // Smooth YOUR resonance: 25% previous + 50% current + 25% next
      const smoothedResonance = (prev.rawResonance * 0.25) + (curr.rawResonance * 0.5) + (next.rawResonance * 0.25);
      
      // Smooth RECOMMENDED resonance (circadian curve) - SAME ALGORITHM
      const smoothedRecommended = (prev.rawRecommended * 0.25) + (curr.rawRecommended * 0.5) + (next.rawRecommended * 0.25);
      
      const threshold = 0.65; // The "in sync" threshold
      
      // For area fills - split based on threshold
      const yourAbove = smoothedResonance > threshold ? smoothedResonance : threshold;
      const yourBelow = smoothedResonance < threshold ? smoothedResonance : threshold;
      
      return {
        hour: point.hour,
        hourLabel: point.hour === 0 ? '12AM' : 
                   point.hour < 12 ? `${point.hour}AM` : 
                   point.hour === 12 ? '12PM' : 
                   `${point.hour - 12}PM`,
        yourResonance: smoothedResonance, // Smoothed version
        recommended: smoothedRecommended, // NOW SMOOTHED!
        yourAbove,
        yourBelow,
        threshold,
        isInSync: smoothedResonance > threshold,
        gap: Math.abs(smoothedResonance - smoothedRecommended),
        taskCount: point.taskCount,
        eventCount: point.eventCount,
      };
    });
    
    return smoothData;
  }, [realTasks, realEvents]); // Recalculate when tasks or events change

  // Calculate alignment percentage
  const inSyncCount = waveTimelineData.filter(d => d.isInSync).length;
  const alignmentPercentage = Math.round((inSyncCount / waveTimelineData.length) * 100);

  return (
    <DashboardLayout
      aiInsightsContent={{
        mode: 'custom',
        customContent: <ResonanceAIInsights />,
      }}
    >
      <motion.div
        className="space-y-6 pb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* ========== TIER 1: HERO CHART ========== */}
        {/* Research: F-pattern, Progressive Disclosure, Peak-End Rule */}
        <Card className="bg-gradient-to-br from-slate-950/50 via-teal-950/30 to-purple-950/30 border-teal-800/30 p-6">
          {/* Header with current score */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-teal-500/10 rounded-lg">
                  <Waves className="w-6 h-6 text-teal-400" />
                </div>
                <div>
                  <h1 className="text-white text-3xl font-bold">Resonance Engine</h1>
                  <p className="text-gray-400 text-sm">Your schedule synced with your natural rhythm</p>
                </div>
              </div>
            </div>
            
            {/* Current Status Badge - Overlay on chart area */}
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-3 bg-black/40 border border-teal-500/30 rounded-xl px-4 py-3 cursor-help">
                    <div className="text-right">
                      <p className="text-gray-400 text-xs mb-1">Current Sync</p>
                      <p className="text-white text-2xl font-bold">{currentResonance.toFixed(2)}</p>
                      <p className="text-teal-300 text-xs">{resonanceStatus}</p>
                    </div>
                    <ResonanceBadge score={currentResonance} size="lg" />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs bg-gray-900 border-gray-700">
                  <p className="text-sm">
                    <strong>Resonance Score:</strong> How well your schedule aligns with your optimal energy patterns.
                    <br/><br/>
                    • 0.85+ = Excellent sync<br/>
                    • 0.70-0.84 = Good alignment<br/>
                    • Below 0.70 = Needs optimization
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* The Chart - Dynamic Green/Red Zones - NOW USING SHARED COMPONENT */}
          <ResonanceWaveGraph 
            tasks={realTasks}
            events={realEvents}
            height={380}
            showLegend={true}
            compact={false}
          />

          {/* Alignment percentage */}
          <div className="mt-4 flex items-center justify-center md:justify-end">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${
              alignmentPercentage >= 70 
                ? 'bg-green-500/20 border border-green-500/30' 
                : alignmentPercentage >= 50
                ? 'bg-yellow-500/20 border border-yellow-500/30'
                : 'bg-red-500/20 border border-red-500/30'
              }`}>
                <Gauge className={`w-4 h-4 ${
                  alignmentPercentage >= 70 ? 'text-green-400' :
                  alignmentPercentage >= 50 ? 'text-yellow-400' : 'text-red-400'
                }`} />
                <span className={`text-sm font-medium ${
                  alignmentPercentage >= 70 ? 'text-green-400' :
                  alignmentPercentage >= 50 ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {alignmentPercentage}% in-sync throughout your day
                </span>
            </div>
          </div>

          {/* Interpretation cards */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-xs text-green-400 font-medium">Above the Line (Green)</span>
              </div>
              <p className="text-xs text-gray-400">
                Schedule aligned with optimal energy - perfect for deep work and challenging tasks
              </p>
            </div>
            
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                <span className="text-xs text-red-400 font-medium">Below the Line (Red)</span>
              </div>
              <p className="text-xs text-gray-400">
                Schedule needs adjustment - move tasks to green zones or schedule breaks
              </p>
            </div>
          </div>

          {/* Primary Action */}
          <div className="flex items-center gap-3">
            <Button 
              size="lg"
              className="flex-1 bg-teal-600 hover:bg-teal-700 h-14 text-base font-semibold"
              onClick={handleOptimizeSchedule}
            >
              <Sparkles className="w-5 h-5 mr-2" />
              Optimize My Schedule
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="h-14 px-6"
              onClick={() => {
                toast.info('Advanced tuning options', {
                  description: 'Adjust sensitivity, thresholds, and preferences',
                });
              }}
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </Card>

        {/* ========== TIER 2: TACTICAL INSIGHTS ========== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Quick Wins - Top Priority Actions */}
          <Card className="bg-[#1e2128] border-gray-800 p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              <h2 className="text-white text-xl font-bold">Quick Wins</h2>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-xs">
                Top 3 improvements
              </Badge>
            </div>
            
            <p className="text-gray-400 text-sm mb-4">
              Simple changes for immediate performance boost
            </p>

            <div className="space-y-3">
              {quickWins.length === 0 ? (
                <div className="bg-black/40 rounded-lg p-8 border border-gray-800 text-center">
                  <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <h3 className="text-white font-medium mb-2">Your schedule is already optimized!</h3>
                  <p className="text-gray-400 text-sm">
                    No immediate improvements found. Your tasks are well-aligned with your energy patterns.
                  </p>
                </div>
              ) : (
                quickWins.map((win, index) => (
                  <motion.div
                    key={win.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-black/40 rounded-lg p-4 border border-gray-800 hover:border-emerald-700/50 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-white font-medium">{win.taskTitle}</h3>
                          <Badge 
                            variant="outline" 
                            className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-xs"
                          >
                            +{win.lift}%
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Clock className="w-3 h-3" />
                          <span className="line-through">{win.currentTime}</span>
                          <ArrowRight className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-300">{win.optimalTime}</span>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      size="sm"
                      className="w-full bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => {
                        setSelectedQuickWin(win);
                        setPreviewModalOpen(true);
                      }}
                    >
                      <CheckCircle className="w-3 h-3 mr-2" />
                      Review Change
                    </Button>
                  </motion.div>
                ))
              )}
            </div>
          </Card>

          {/* Next Best Slot */}
          <Card className="bg-gradient-to-br from-purple-950/30 to-blue-950/30 border-purple-800/30 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Target className="w-5 h-5 text-purple-400" />
              <h2 className="text-white text-xl font-bold">Next Best Window</h2>
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs">
                Recommended
              </Badge>
            </div>

            <div className="bg-black/40 rounded-lg p-5 mb-4">
              <div className="flex items-end gap-4 mb-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Optimal Time</p>
                  <p className="text-white text-4xl font-bold">{nextBestSlot.time}</p>
                </div>
                <div className="pb-2">
                  <p className="text-gray-400 text-xs">Duration</p>
                  <p className="text-white text-xl">{nextBestSlot.duration}</p>
                </div>
                <div className="pb-2 ml-auto">
                  <p className="text-gray-400 text-xs">Resonance</p>
                  <div className="flex items-center gap-2">
                    <p className="text-white text-xl">{nextBestSlot.resonanceScore.toFixed(2)}</p>
                    <ResonanceBadge score={nextBestSlot.resonanceScore} size="xs" />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm mb-4">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-blue-300">Peak window in {nextBestSlot.peakIn}</span>
              </div>

              <div className="bg-purple-950/30 border border-purple-500/20 rounded p-3">
                <p className="text-gray-400 text-xs mb-2">Perfect for:</p>
                <div className="flex flex-wrap gap-2">
                  {nextBestSlot.suitableFor.map((type, i) => (
                    <Badge 
                      key={i} 
                      variant="outline" 
                      className="bg-purple-500/10 text-purple-300 border-purple-500/30 text-xs"
                    >
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <Button 
              size="lg"
              className="w-full bg-purple-600 hover:bg-purple-700 h-14 text-base font-semibold"
              onClick={handleScheduleTask}
            >
              <Calendar className="w-5 h-5 mr-2" />
              Schedule Task Here
            </Button>
          </Card>
        </div>

        {/* ========== TIER 3: ADVANCED METRICS (Collapsible) ========== */}
        <Collapsible open={showAdvancedMetrics} onOpenChange={setShowAdvancedMetrics}>
          <Card className="bg-[#1e2128] border-gray-800">
            <CollapsibleTrigger className="w-full p-6 flex items-center justify-between hover:bg-gray-900/30 transition-colors">
              <div className="flex items-center gap-3">
                <Brain className="w-5 h-5 text-blue-400" />
                <div className="text-left">
                  <h2 className="text-white text-xl font-bold">Advanced Metrics</h2>
                  <p className="text-gray-400 text-sm">Detailed performance breakdown</p>
                </div>
              </div>
              {showAdvancedMetrics ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="px-6 pb-6 pt-2">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Task Harmony */}
                  <div className="bg-black/30 rounded-lg p-5 border border-gray-800">
                    <div className="flex items-center gap-2 mb-3">
                      <Brain className="w-4 h-4 text-purple-400" />
                      <h3 className="text-white text-sm font-medium">Task Harmony</h3>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-3 h-3 text-gray-500 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs bg-gray-900 border-gray-700">
                            <p className="text-sm">
                              How well your tasks align with your natural energy patterns throughout the day.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-white text-3xl font-bold mb-1">{advancedMetrics.taskHarmony.toFixed(2)}</p>
                        <ResonanceBadge score={advancedMetrics.taskHarmony} size="sm" />
                      </div>
                    </div>
                  </div>

                  {/* Schedule Flow */}
                  <div className="bg-black/30 rounded-lg p-5 border border-gray-800">
                    <div className="flex items-center gap-2 mb-3">
                      <Waves className="w-4 h-4 text-blue-400" />
                      <h3 className="text-white text-sm font-medium">Schedule Flow</h3>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-3 h-3 text-gray-500 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs bg-gray-900 border-gray-700">
                            <p className="text-sm">
                              Measures how smoothly tasks transition with minimal context switching.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-white text-3xl font-bold mb-1">{advancedMetrics.scheduleFlow.toFixed(2)}</p>
                        <ResonanceBadge score={advancedMetrics.scheduleFlow} size="sm" />
                      </div>
                    </div>
                  </div>

                  {/* Deep Work Ready */}
                  <div className="bg-black/30 rounded-lg p-5 border border-gray-800">
                    <div className="flex items-center gap-2 mb-3">
                      <Target className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-white text-sm font-medium">Deep Work Ready</h3>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-3 h-3 text-gray-500 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs bg-gray-900 border-gray-700">
                            <p className="text-sm">
                              Your current capacity for focused, uninterrupted work based on cognitive load.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-white text-3xl font-bold mb-1">{advancedMetrics.deepWorkReady.toFixed(2)}</p>
                        <ResonanceBadge score={advancedMetrics.deepWorkReady} size="sm" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Resource Balance (Separate Collapsible) */}
        <Collapsible open={showResourceBalance} onOpenChange={setShowResourceBalance}>
          <Card className="bg-[#1e2128] border-gray-800">
            <CollapsibleTrigger className="w-full p-6 flex items-center justify-between hover:bg-gray-900/30 transition-colors">
              <div className="flex items-center gap-3">
                <Gauge className="w-5 h-5 text-indigo-400" />
                <div className="text-left">
                  <h2 className="text-white text-xl font-bold">Resource Balance</h2>
                  <p className="text-gray-400 text-sm">Multi-dimensional view across time, energy, budget, and focus</p>
                </div>
                <Badge 
                  className="text-xs ml-2"
                  style={{
                    backgroundColor: getDimensionColor(resourceBalance.balance.overall) + '20',
                    borderColor: getDimensionColor(resourceBalance.balance.overall) + '30',
                    color: getDimensionColor(resourceBalance.balance.overall),
                  }}
                >
                  {getStatusEmoji(resourceBalance.overallHealth)} {resourceBalance.overallHealth}
                </Badge>
              </div>
              {showResourceBalance ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="px-6 pb-6 pt-2">
                {/* Radar Chart */}
                <div className="mb-6">
                  <ResourceBalanceChart balance={resourceBalance.balance} height={350} />
                </div>

                {/* Dimension Cards Grid */}
                <div className="grid grid-cols-4 gap-3 mb-6">
                  <DimensionCard 
                    label="Time" 
                    score={resourceBalance.balance.time}
                    icon={<Clock className="w-4 h-4 text-blue-400" />}
                    insights={resourceBalance.dimensions.time.insights}
                  />
                  <DimensionCard 
                    label="Energy" 
                    score={resourceBalance.balance.energy}
                    icon={<Zap className="w-4 h-4 text-amber-400" />}
                    insights={resourceBalance.dimensions.energy.insights}
                  />
                  <DimensionCard 
                    label="Budget" 
                    score={resourceBalance.balance.budget}
                    icon={<Target className="w-4 h-4 text-emerald-400" />}
                    insights={resourceBalance.dimensions.budget.insights}
                  />
                  <DimensionCard 
                    label="Focus" 
                    score={resourceBalance.balance.focus}
                    icon={<Brain className="w-4 h-4 text-purple-400" />}
                    insights={resourceBalance.dimensions.focus.insights}
                  />
                </div>

                {/* Top Issues & Wins */}
                <div className="grid grid-cols-2 gap-4">
                  {resourceBalance.topIssues.length > 0 && (
                    <div className="bg-red-950/20 border border-red-500/20 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="w-4 h-4 text-red-400" />
                        <h3 className="text-red-300 font-medium">Priority Actions</h3>
                      </div>
                      <div className="space-y-2">
                        {resourceBalance.topIssues.map((issue, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm">
                            <div className="w-1 h-1 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                            <p className="text-gray-300">{issue}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {resourceBalance.topWins.length > 0 && (
                    <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-emerald-300 font-medium">What's Working</h3>
                      </div>
                      <div className="space-y-2">
                        {resourceBalance.topWins.map((win, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-sm">
                            <div className="w-1 h-1 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                            <p className="text-gray-300">{win}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </motion.div>
      
      {/* ========== PHASE 1: SCHEDULE CHANGE PREVIEW MODAL ========== */}
      {selectedQuickWin && (
        <ScheduleChangePreviewModal
          isOpen={previewModalOpen}
          onClose={() => {
            setPreviewModalOpen(false);
            setSelectedQuickWin(null);
          }}
          onConfirm={(selectedTime) => handleApplyQuickWin(selectedQuickWin, false, selectedTime)}
          quickWin={selectedQuickWin}
          task={realTasks.find(t => t.id === selectedQuickWin.taskId)}
          allTasks={realTasks}
          allEvents={realEvents}
        />
      )}

      {/* ========== PHASE 3: RESCHEDULE SUCCESS MODAL ========== */}
      {rescheduledTask && (
        <RescheduleSuccessModal
          isOpen={successModalOpen}
          onClose={() => {
            setSuccessModalOpen(false);
            setRescheduledTask(null);
          }}
          onViewCalendar={onNavigateToCalendar}
          taskId={rescheduledTask.taskId}
          taskTitle={rescheduledTask.title}
          newTime={rescheduledTask.time}
          dateDisplay={rescheduledTask.date}
        />
      )}
    </DashboardLayout>
  );
}