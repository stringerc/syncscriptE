/**
 * Intelligent Task Selector - Research-Backed AI Priority System
 * 
 * Based on cognitive psychology and productivity research:
 * - Chronotype Studies: Match task complexity to circadian rhythms
 * - Deadline Psychology: Imminent deadlines trigger focus (Yerkes-Dodson Law)
 * - Context Switching: Minimize interruptions (40% efficiency loss)
 * - Flow State: Match task to current energy (3x completion rate)
 * - Momentum Effect: Partial completion = 2.8x finish rate
 */

import { Task, Priority, EnergyLevel } from '../types/task';

interface CurrentContext {
  currentHour: number; // 0-23
  currentMinute: number;
  dayOfWeek: number; // 0 = Sunday
}

interface TaskScore {
  task: Task;
  totalScore: number;
  reasoning: string;
  breakdown: {
    timeEnergy: number;
    deadlineUrgency: number;
    momentum: number;
    priority: number;
    dependencies: number;
  };
}

/**
 * Get current time context
 */
export function getCurrentContext(): CurrentContext {
  const now = new Date();
  return {
    currentHour: now.getHours(),
    currentMinute: now.getMinutes(),
    dayOfWeek: now.getDay(),
  };
}

/**
 * Calculate energy level based on time of day
 * Research: Most people peak 9-11am, dip 2-4pm, second peak 4-6pm
 */
export function getCurrentEnergyLevel(hour: number): 'high' | 'medium' | 'low' {
  if (hour >= 9 && hour < 12) return 'high'; // Morning peak
  if (hour >= 14 && hour < 16) return 'low'; // Afternoon dip
  if (hour >= 16 && hour < 18) return 'medium'; // Second wind
  if (hour >= 6 && hour < 9) return 'medium'; // Early morning
  return 'low'; // Evening/night
}

/**
 * Score task based on time-energy alignment
 * High energy tasks during peak hours = optimal
 */
function scoreTimeEnergyAlignment(task: Task, context: CurrentContext): number {
  const currentEnergy = getCurrentEnergyLevel(context.currentHour);
  const taskEnergy = task.energyLevel;
  
  // Perfect match: High energy task during high energy time
  if (currentEnergy === 'high' && taskEnergy === 'high') return 100;
  if (currentEnergy === 'medium' && taskEnergy === 'medium') return 90;
  if (currentEnergy === 'low' && taskEnergy === 'low') return 85;
  
  // Acceptable: Medium task during high energy
  if (currentEnergy === 'high' && taskEnergy === 'medium') return 70;
  if (currentEnergy === 'medium' && taskEnergy === 'low') return 60;
  
  // Suboptimal: High energy task during low energy time
  if (currentEnergy === 'low' && taskEnergy === 'high') return 20;
  if (currentEnergy === 'low' && taskEnergy === 'medium') return 40;
  
  return 50;
}

/**
 * Score based on deadline urgency
 * Yerkes-Dodson Law: Moderate urgency = peak performance
 */
function scoreDeadlineUrgency(task: Task): number {
  if (!task.dueDate) return 30; // No deadline = lower urgency
  
  const now = new Date();
  const dueDate = new Date(task.dueDate);
  const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  if (hoursUntilDue < 0) return 100; // Overdue - CRITICAL
  if (hoursUntilDue < 2) return 95; // Due within 2 hours - URGENT
  if (hoursUntilDue < 4) return 85; // Due within 4 hours - Very important
  if (hoursUntilDue < 8) return 75; // Due today - Important
  if (hoursUntilDue < 24) return 60; // Due tomorrow - Moderate
  if (hoursUntilDue < 48) return 45; // Due in 2 days
  
  return 30; // Further out
}

/**
 * Score based on momentum (partial completion)
 * Zeigarnik Effect: Unfinished tasks occupy mental space
 */
function scoreMomentum(task: Task): number {
  const progress = task.progress || 0;
  
  // Sweet spot: 20-80% complete (highest motivation to finish)
  if (progress >= 20 && progress <= 80) return 100;
  
  // Just started (10-20%) - some momentum
  if (progress >= 10 && progress < 20) return 70;
  
  // Almost done (80-95%) - finish strong
  if (progress > 80 && progress < 95) return 90;
  
  // Not started or nearly done
  if (progress < 10) return 30;
  if (progress >= 95) return 60;
  
  return 50;
}

/**
 * Score based on task priority
 */
function scorePriority(priority: Priority): number {
  switch (priority) {
    case 'urgent': return 100;
    case 'high': return 75;
    case 'medium': return 50;
    case 'low': return 25;
  }
}

/**
 * Score based on dependencies (blocking other tasks)
 * Note: This would need task relationship data - using subtasks as proxy
 */
function scoreDependencies(task: Task): number {
  const subtaskCount = task.subtasks?.length || 0;
  const incompleteSubtasks = task.subtasks?.filter(st => !st.completed).length || 0;
  
  // Has many incomplete subtasks = blocks progress
  if (incompleteSubtasks > 3) return 80;
  if (incompleteSubtasks > 1) return 60;
  if (subtaskCount > 0 && incompleteSubtasks === 0) return 40; // Ready to complete
  
  return 30;
}

/**
 * Generate human-readable reasoning for task selection
 */
function generateReasoning(task: Task, context: CurrentContext, scores: TaskScore['breakdown']): string {
  const reasons: string[] = [];
  const now = new Date();
  const dueDate = new Date(task.dueDate);
  const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  const currentEnergy = getCurrentEnergyLevel(context.currentHour);
  
  // Time-energy context
  if (scores.timeEnergy >= 90) {
    if (currentEnergy === 'high') {
      reasons.push('Morning energy peak - perfect for complex work');
    } else if (currentEnergy === 'medium') {
      reasons.push('Good energy match for focused work');
    }
  } else if (scores.timeEnergy < 50 && task.energyLevel === 'high') {
    reasons.push('High-energy task - consider scheduling for tomorrow morning');
  }
  
  // Deadline urgency
  if (hoursUntilDue < 0) {
    reasons.push('⚠️ OVERDUE - Needs immediate attention');
  } else if (hoursUntilDue < 2) {
    reasons.push(`Due in ${Math.round(hoursUntilDue)} hour${Math.round(hoursUntilDue) === 1 ? '' : 's'} - Time-sensitive`);
  } else if (hoursUntilDue < 4) {
    reasons.push('Due this afternoon - High priority');
  } else if (hoursUntilDue < 8) {
    reasons.push('Due today - Complete before end of day');
  }
  
  // Momentum
  const progress = task.progress || 0;
  if (progress >= 50 && progress < 95) {
    reasons.push(`${progress}% complete - Finish strong to maintain momentum`);
  } else if (progress >= 20 && progress < 50) {
    reasons.push('Good progress - Build on existing momentum');
  } else if (progress >= 95) {
    reasons.push('Almost done - Quick win available');
  }
  
  // Priority
  if (task.priority === 'urgent') {
    reasons.push('Urgent priority - Immediate action required');
  } else if (task.priority === 'high') {
    reasons.push('High priority - Critical for daily goals');
  }
  
  // Context: Check for collaborators (team dependency)
  if (task.collaborators && task.collaborators.length > 0) {
    reasons.push(`Team task - ${task.collaborators[0].name} is collaborating`);
  }
  
  // Subtasks (dependencies)
  const incompleteSubtasks = task.subtasks?.filter(st => !st.completed).length || 0;
  if (incompleteSubtasks > 2) {
    reasons.push(`Blocking ${incompleteSubtasks} subtasks - Clear the path`);
  }
  
  // Fallback
  if (reasons.length === 0) {
    reasons.push('Best fit for current time and energy level');
  }
  
  return reasons.slice(0, 2).join(' • '); // Max 2 reasons for clarity
}

/**
 * Select the #1 priority task RIGHT NOW — same ranking as "What should I be doing" (all open tasks).
 */
export function selectTopPriorityTask(tasks: Task[]): TaskScore | null {
  const ranked = getTopPriorityTasks(tasks, 1);
  return ranked[0] ?? null;
}

function scoreTaskForNow(task: Task, context: CurrentContext): TaskScore {
  const breakdown = {
    timeEnergy: scoreTimeEnergyAlignment(task, context),
    deadlineUrgency: scoreDeadlineUrgency(task),
    momentum: scoreMomentum(task),
    priority: scorePriority(task.priority),
    dependencies: scoreDependencies(task),
  };

  const totalScore =
    breakdown.timeEnergy * 0.25 +
    breakdown.deadlineUrgency * 0.3 +
    breakdown.momentum * 0.15 +
    breakdown.priority * 0.2 +
    breakdown.dependencies * 0.1;

  return {
    task,
    totalScore,
    reasoning: generateReasoning(task, context, breakdown),
    breakdown,
  };
}

/**
 * Get top N priority tasks for "What should I be doing right now" card.
 * Scores **all** incomplete tasks (same pool as Today's schedule). Collaboration is a small tie-breaker only,
 * so solo tasks are never excluded just because a team task exists elsewhere.
 */
export function getTopPriorityTasks(tasks: Task[], count: number = 2): TaskScore[] {
  const context = getCurrentContext();

  const incomplete = tasks.filter((task) => !task.completed);
  if (incomplete.length === 0) return [];

  const scoredTasks: TaskScore[] = incomplete.map((task) => {
    const base = scoreTaskForNow(task, context);
    const collabNudge =
      task.collaborators && task.collaborators.length > 0 ? 2 : 0;
    return {
      ...base,
      totalScore: base.totalScore + collabNudge,
    };
  });

  return scoredTasks
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, count);
}
