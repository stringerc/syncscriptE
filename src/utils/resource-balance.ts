/**
 * Resource Balance Calculation
 * 
 * Multi-dimensional balance analysis across:
 * - Time: Schedule density, distribution, overload
 * - Energy: Alignment between task requirements and available energy
 * - Budget: Financial health relative to goals
 * 
 * Inspired by Figure 4 of Resonance Calculus framework:
 * "Resonance balance view across multiple resource dimensions"
 */

import { Task } from '../types/task';
import { Event } from '../utils/event-task-types';
import { getCircadianCurve } from './resonance-calculus';

// ============================================================================
// TYPES
// ============================================================================

export interface ResourceBalance {
  time: number;           // 0-1: How well is time distributed?
  energy: number;         // 0-1: Task-energy alignment quality
  budget: number;         // 0-1: Financial health
  focus: number;          // 0-1: Deep work vs interruptions (optional)
  overall: number;        // 0-1: Weighted average
}

export interface DimensionAnalysis {
  score: number;          // 0-1
  status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  insights: string[];     // What's working / what's not
  recommendations: string[]; // Specific actions to improve
  trend: 'improving' | 'stable' | 'declining';
}

export interface BalanceReport {
  balance: ResourceBalance;
  dimensions: {
    time: DimensionAnalysis;
    energy: DimensionAnalysis;
    budget: DimensionAnalysis;
    focus: DimensionAnalysis;
  };
  topIssues: string[];    // Top 3 problems to address
  topWins: string[];      // Top 3 things working well
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  timestamp: Date;
}

export interface BudgetData {
  monthlyBudget: number;
  currentSpending: number;
  daysInMonth: number;
  dayOfMonth: number;
  savingsGoal?: number;
  currentSavings?: number;
}

// ============================================================================
// TIME DIMENSION
// ============================================================================

/**
 * Calculate time balance score
 * Analyzes schedule density, distribution, and overload
 */
export function calculateTimeBalance(
  schedule: Event[],
  tasks: Task[],
  currentDate: Date = new Date()
): DimensionAnalysis {
  const insights: string[] = [];
  const recommendations: string[] = [];
  let score = 0.0;
  
  // 1. Schedule density (30%)
  const activeTasks = tasks.filter(t => !t.completed);
  const upcomingEvents = schedule.filter(e => {
    const eventDate = new Date(e.startTime);
    return eventDate > currentDate;
  });
  
  const taskLoad = activeTasks.length;
  const eventLoad = upcomingEvents.length;
  
  // Ideal: 5-8 active tasks, 3-6 events per day
  let densityScore = 0.5;
  if (taskLoad >= 5 && taskLoad <= 8) {
    densityScore += 0.25;
    insights.push(`✅ Task load is optimal (${taskLoad} active tasks)`);
  } else if (taskLoad > 12) {
    densityScore -= 0.15;
    insights.push(`⚠️ Task overload detected (${taskLoad} active tasks)`);
    recommendations.push('Defer or delegate low-priority tasks to reduce cognitive load');
  } else if (taskLoad < 3) {
    densityScore += 0.10;
    insights.push(`📊 Light task load (${taskLoad} tasks) - capacity available`);
    recommendations.push('Consider taking on strategic initiatives or learning goals');
  }
  
  if (eventLoad >= 3 && eventLoad <= 6) {
    densityScore += 0.25;
  } else if (eventLoad > 8) {
    densityScore -= 0.20;
    insights.push(`⚠️ Meeting overload (${eventLoad} upcoming events)`);
    recommendations.push('Block focus time between meetings for task completion');
  }
  
  score += Math.max(0, Math.min(1, densityScore)) * 0.30;
  
  // 2. Time distribution (30%)
  // Check if work is spread across the day or concentrated
  const eventsByHour = new Map<number, number>();
  schedule.forEach(event => {
    const hour = new Date(event.startTime).getHours();
    eventsByHour.set(hour, (eventsByHour.get(hour) || 0) + 1);
  });
  
  const maxEventsInHour = Math.max(0, ...Array.from(eventsByHour.values()));
  const distributionScore = maxEventsInHour <= 2 ? 1.0 : 
                           maxEventsInHour === 3 ? 0.7 :
                           0.4;
  
  if (distributionScore >= 0.9) {
    insights.push('✅ Events well-distributed throughout day');
  } else if (distributionScore < 0.6) {
    insights.push('⚠️ Events clustered - consider spreading out');
    recommendations.push('Reschedule back-to-back meetings to create buffer time');
  }
  
  score += distributionScore * 0.30;
  
  // 3. Buffer time adequacy (25%)
  // Calculate average gap between events
  const sortedEvents = [...schedule].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
  
  let totalGaps = 0;
  let gapCount = 0;
  
  for (let i = 0; i < sortedEvents.length - 1; i++) {
    const end = new Date(sortedEvents[i].endTime);
    const nextStart = new Date(sortedEvents[i + 1].startTime);
    const gapMinutes = (nextStart.getTime() - end.getTime()) / 60000;
    
    if (gapMinutes >= 0 && gapMinutes < 180) { // Only count gaps < 3 hours
      totalGaps += gapMinutes;
      gapCount++;
    }
  }
  
  const avgBuffer = gapCount > 0 ? totalGaps / gapCount : 30;
  
  // Ideal buffer: 15-20 minutes (cognitive switch time)
  let bufferScore = 0.5;
  if (avgBuffer >= 15 && avgBuffer <= 25) {
    bufferScore = 1.0;
    insights.push(`✅ Excellent buffer time (avg ${Math.round(avgBuffer)} min)`);
  } else if (avgBuffer < 10) {
    bufferScore = 0.3;
    insights.push(`⚠️ Insufficient buffer time (avg ${Math.round(avgBuffer)} min)`);
    recommendations.push('Add 15-20 min buffers between meetings for mental reset');
  } else if (avgBuffer > 45) {
    bufferScore = 0.7;
    insights.push(`📊 Large gaps between events (avg ${Math.round(avgBuffer)} min)`);
  }
  
  score += bufferScore * 0.25;
  
  // 4. Deadline pressure (15%)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const weekFromNow = new Date(today);
  weekFromNow.setDate(weekFromNow.getDate() + 7);
  
  const dueSoon = activeTasks.filter(t => {
    if (!t.dueDate) return false;
    const dueDate = new Date(t.dueDate);
    return dueDate <= weekFromNow;
  });
  
  const dueToday = dueSoon.filter(t => {
    const dueDate = new Date(t.dueDate!);
    return dueDate <= tomorrow;
  });
  
  let pressureScore = 0.8;
  if (dueToday.length > 3) {
    pressureScore = 0.3;
    insights.push(`⚠️ High deadline pressure (${dueToday.length} tasks due today)`);
    recommendations.push('Focus on highest-priority items; defer non-urgent work');
  } else if (dueToday.length > 0) {
    pressureScore = 0.6;
    insights.push(`📊 ${dueToday.length} task(s) due today`);
  } else if (dueSoon.length === 0) {
    pressureScore = 1.0;
    insights.push('✅ No immediate deadline pressure');
  }
  
  score += pressureScore * 0.15;
  
  // Overall status
  let status: DimensionAnalysis['status'];
  if (score >= 0.85) status = 'excellent';
  else if (score >= 0.70) status = 'good';
  else if (score >= 0.50) status = 'fair';
  else if (score >= 0.30) status = 'poor';
  else status = 'critical';
  
  return {
    score: Math.max(0, Math.min(1, score)),
    status,
    insights: insights.slice(0, 4), // Top 4 insights
    recommendations: recommendations.slice(0, 3), // Top 3 recommendations
    trend: 'stable', // Would calculate from historical data
  };
}

// ============================================================================
// ENERGY DIMENSION
// ============================================================================

/**
 * Calculate energy balance score
 * How well do tasks align with natural energy patterns?
 */
export function calculateEnergyBalance(
  schedule: Event[],
  tasks: Task[]
): DimensionAnalysis {
  const insights: string[] = [];
  const recommendations: string[] = [];
  let score = 0.0;
  
  // 1. Task-time alignment (40%)
  // Count high-energy tasks scheduled in high-energy slots
  let alignedTasks = 0;
  let misalignedTasks = 0;
  let totalScheduledTasks = 0;
  
  schedule.forEach(event => {
    // Find corresponding task
    const task = tasks.find(t => 
      event.title.toLowerCase().includes(t.title.toLowerCase()) ||
      t.title.toLowerCase().includes(event.title.toLowerCase())
    );
    
    if (!task || task.completed) return;
    
    totalScheduledTasks++;
    const hour = new Date(event.startTime).getHours();
    const circadian = getCircadianCurve(hour);
    
    // High energy task
    if (task.energyLevel === 'high') {
      if (circadian >= 0.85) {
        alignedTasks++;
      } else if (circadian < 0.70) {
        misalignedTasks++;
      }
    }
    // Low energy task
    else if (task.energyLevel === 'low') {
      if (circadian <= 0.70) {
        alignedTasks++;
      } else if (circadian >= 0.90) {
        misalignedTasks++;
      }
    }
    // Medium energy - always acceptable
    else {
      alignedTasks++;
    }
  });
  
  const alignmentRatio = totalScheduledTasks > 0 
    ? alignedTasks / totalScheduledTasks 
    : 0.7;
  
  score += alignmentRatio * 0.40;
  
  if (alignmentRatio >= 0.80) {
    insights.push('✅ Excellent task-energy alignment');
  } else if (alignmentRatio < 0.50) {
    insights.push(`⚠️ ${misalignedTasks} tasks poorly timed for energy levels`);
    recommendations.push('Move high-energy tasks to 9-11 AM or 3-5 PM slots');
  }
  
  // 2. Peak time utilization (30%)
  // Are peak hours (9-11 AM) used for high-value work?
  const peakEvents = schedule.filter(event => {
    const hour = new Date(event.startTime).getHours();
    return hour >= 9 && hour < 11;
  });
  
  const highValuePeakWork = peakEvents.filter(event => {
    const task = tasks.find(t => 
      event.title.toLowerCase().includes(t.title.toLowerCase())
    );
    return task && (task.priority === 'high' || task.energyLevel === 'high');
  });
  
  const peakUtilization = peakEvents.length > 0
    ? highValuePeakWork.length / peakEvents.length
    : 0.5;
  
  score += peakUtilization * 0.30;
  
  if (peakUtilization >= 0.75) {
    insights.push('✅ Peak hours used for high-priority work');
  } else if (peakUtilization < 0.40) {
    insights.push('⚠️ Peak morning hours underutilized');
    recommendations.push('Schedule deep work or critical tasks for 9-11 AM');
  }
  
  // 3. Energy recovery (20%)
  // Check for breaks and low-energy periods
  const hasLunchBreak = schedule.some(event => {
    const hour = new Date(event.startTime).getHours();
    return hour >= 12 && hour < 13 && 
           (event.title.toLowerCase().includes('lunch') ||
            event.title.toLowerCase().includes('break'));
  });
  
  let recoveryScore = 0.5;
  if (hasLunchBreak) {
    recoveryScore = 1.0;
    insights.push('✅ Lunch break scheduled');
  } else {
    insights.push('⚠️ No lunch break detected');
    recommendations.push('Schedule 30-60 min lunch break for energy recovery');
  }
  
  score += recoveryScore * 0.20;
  
  // 4. Unscheduled high-energy tasks (10%)
  const unscheduledHighEnergy = tasks.filter(t => 
    !t.completed && 
    t.energyLevel === 'high' &&
    !schedule.some(e => 
      e.title.toLowerCase().includes(t.title.toLowerCase())
    )
  );
  
  if (unscheduledHighEnergy.length > 0) {
    insights.push(`📊 ${unscheduledHighEnergy.length} high-energy task(s) not scheduled`);
    recommendations.push('Schedule high-energy tasks in morning peak windows');
    score += 0.05; // Partial credit
  } else {
    score += 0.10;
  }
  
  // Overall status
  let status: DimensionAnalysis['status'];
  if (score >= 0.85) status = 'excellent';
  else if (score >= 0.70) status = 'good';
  else if (score >= 0.50) status = 'fair';
  else if (score >= 0.30) status = 'poor';
  else status = 'critical';
  
  return {
    score: Math.max(0, Math.min(1, score)),
    status,
    insights: insights.slice(0, 4),
    recommendations: recommendations.slice(0, 3),
    trend: 'stable',
  };
}

// ============================================================================
// BUDGET DIMENSION
// ============================================================================

/**
 * Calculate budget balance score
 * Financial health relative to goals and spending patterns
 */
export function calculateBudgetBalance(
  budgetData: BudgetData
): DimensionAnalysis {
  const insights: string[] = [];
  const recommendations: string[] = [];
  let score = 0.0;
  
  const {
    monthlyBudget,
    currentSpending,
    daysInMonth,
    dayOfMonth,
    savingsGoal,
    currentSavings,
  } = budgetData;
  
  // 1. Spending pace (40%)
  const expectedSpending = (monthlyBudget * dayOfMonth) / daysInMonth;
  const spendingRatio = currentSpending / expectedSpending;
  
  let paceScore = 0.5;
  if (spendingRatio <= 0.95) {
    paceScore = 1.0;
    insights.push(`✅ Under budget (${Math.round((1 - spendingRatio) * 100)}% below pace)`);
  } else if (spendingRatio <= 1.05) {
    paceScore = 0.85;
    insights.push('✅ On track with budget');
  } else if (spendingRatio <= 1.15) {
    paceScore = 0.60;
    insights.push(`⚠️ Slightly over budget (${Math.round((spendingRatio - 1) * 100)}% over pace)`);
    recommendations.push('Review discretionary spending; reduce non-essentials');
  } else {
    paceScore = 0.30;
    insights.push(`⚠️ Significantly over budget (${Math.round((spendingRatio - 1) * 100)}% over pace)`);
    recommendations.push('Immediate action needed: freeze non-essential spending');
  }
  
  score += paceScore * 0.40;
  
  // 2. Budget headroom (30%)
  const remaining = monthlyBudget - currentSpending;
  const daysRemaining = daysInMonth - dayOfMonth;
  const dailyBudget = remaining / Math.max(1, daysRemaining);
  
  const headroomScore = dailyBudget >= 50 ? 1.0 :
                       dailyBudget >= 30 ? 0.75 :
                       dailyBudget >= 15 ? 0.50 :
                       0.25;
  
  if (dailyBudget >= 50) {
    insights.push(`✅ Healthy headroom ($${Math.round(dailyBudget)}/day remaining)`);
  } else if (dailyBudget < 20) {
    insights.push(`⚠️ Low headroom ($${Math.round(dailyBudget)}/day for ${daysRemaining} days)`);
    recommendations.push('Minimize spending for remainder of month');
  }
  
  score += headroomScore * 0.30;
  
  // 3. Savings progress (20% if goal exists)
  if (savingsGoal && currentSavings !== undefined) {
    const savingsRatio = currentSavings / savingsGoal;
    const savingsScore = Math.min(1.0, savingsRatio);
    
    score += savingsScore * 0.20;
    
    if (savingsRatio >= 1.0) {
      insights.push('✅ Savings goal achieved!');
    } else if (savingsRatio >= 0.75) {
      insights.push(`✅ ${Math.round(savingsRatio * 100)}% of savings goal reached`);
    } else if (savingsRatio < 0.50) {
      insights.push(`📊 ${Math.round(savingsRatio * 100)}% of savings goal reached`);
      recommendations.push('Increase automatic savings transfers to meet goal');
    }
  } else {
    // No savings goal - give neutral score
    score += 0.15;
  }
  
  // 4. Overall financial health (10%)
  const healthScore = (monthlyBudget - currentSpending) > 0 ? 1.0 : 0.0;
  score += healthScore * 0.10;
  
  if (currentSpending > monthlyBudget) {
    insights.push('⚠️ Budget exceeded this month');
    recommendations.push('Review spending categories; identify areas to cut');
  }
  
  // Overall status
  let status: DimensionAnalysis['status'];
  if (score >= 0.85) status = 'excellent';
  else if (score >= 0.70) status = 'good';
  else if (score >= 0.50) status = 'fair';
  else if (score >= 0.30) status = 'poor';
  else status = 'critical';
  
  return {
    score: Math.max(0, Math.min(1, score)),
    status,
    insights: insights.slice(0, 4),
    recommendations: recommendations.slice(0, 3),
    trend: 'stable',
  };
}

// ============================================================================
// FOCUS DIMENSION (Optional)
// ============================================================================

/**
 * Calculate focus balance score
 * Deep work vs interruptions, context switching
 */
export function calculateFocusBalance(
  schedule: Event[],
  tasks: Task[]
): DimensionAnalysis {
  const insights: string[] = [];
  const recommendations: string[] = [];
  let score = 0.0;
  
  // 1. Deep work blocks (40%)
  const deepWorkBlocks = schedule.filter(event => {
    const duration = (new Date(event.endTime).getTime() - 
                     new Date(event.startTime).getTime()) / 60000;
    return duration >= 90 && (
      event.title.toLowerCase().includes('focus') ||
      event.title.toLowerCase().includes('deep work') ||
      event.category === 'focus'
    );
  });
  
  const deepWorkScore = Math.min(1.0, deepWorkBlocks.length / 2); // Ideal: 2 blocks/day
  score += deepWorkScore * 0.40;
  
  if (deepWorkBlocks.length >= 2) {
    insights.push(`✅ ${deepWorkBlocks.length} deep work blocks scheduled`);
  } else if (deepWorkBlocks.length === 0) {
    insights.push('⚠️ No deep work blocks scheduled');
    recommendations.push('Block 90-120 min for uninterrupted focus work');
  }
  
  // 2. Meeting density (30%)
  const meetings = schedule.filter(event => 
    event.category === 'meeting' || 
    event.title.toLowerCase().includes('meeting')
  );
  
  const meetingRatio = schedule.length > 0 ? meetings.length / schedule.length : 0;
  const meetingScore = meetingRatio <= 0.40 ? 1.0 :
                      meetingRatio <= 0.60 ? 0.65 :
                      0.35;
  
  score += meetingScore * 0.30;
  
  if (meetingRatio > 0.60) {
    insights.push(`⚠️ ${Math.round(meetingRatio * 100)}% of time in meetings`);
    recommendations.push('Decline optional meetings; suggest async alternatives');
  } else if (meetingRatio <= 0.30) {
    insights.push('✅ Good meeting balance');
  }
  
  // 3. Context switching (30%)
  // Estimate based on variety of categories
  const categories = new Set(schedule.map(e => e.category));
  const switchScore = categories.size <= 4 ? 1.0 :
                     categories.size <= 6 ? 0.70 :
                     0.40;
  
  score += switchScore * 0.30;
  
  if (categories.size > 6) {
    insights.push(`⚠️ High context diversity (${categories.size} different types)`);
    recommendations.push('Batch similar tasks together to reduce switching cost');
  }
  
  // Overall status
  let status: DimensionAnalysis['status'];
  if (score >= 0.85) status = 'excellent';
  else if (score >= 0.70) status = 'good';
  else if (score >= 0.50) status = 'fair';
  else if (score >= 0.30) status = 'poor';
  else status = 'critical';
  
  return {
    score: Math.max(0, Math.min(1, score)),
    status,
    insights: insights.slice(0, 4),
    recommendations: recommendations.slice(0, 3),
    trend: 'stable',
  };
}

// ============================================================================
// OVERALL BALANCE CALCULATION
// ============================================================================

/**
 * Calculate complete resource balance report
 */
export function calculateResourceBalance(
  schedule: Event[],
  tasks: Task[],
  budgetData: BudgetData
): BalanceReport {
  // Calculate each dimension
  const timeAnalysis = calculateTimeBalance(schedule, tasks);
  const energyAnalysis = calculateEnergyBalance(schedule, tasks);
  const budgetAnalysis = calculateBudgetBalance(budgetData);
  const focusAnalysis = calculateFocusBalance(schedule, tasks);
  
  // Create balance object
  const balance: ResourceBalance = {
    time: timeAnalysis.score,
    energy: energyAnalysis.score,
    budget: budgetAnalysis.score,
    focus: focusAnalysis.score,
    overall: (
      timeAnalysis.score * 0.30 +
      energyAnalysis.score * 0.30 +
      budgetAnalysis.score * 0.25 +
      focusAnalysis.score * 0.15
    ),
  };
  
  // Identify top issues (lowest scoring dimensions)
  const dimensionScores = [
    { name: 'Time Management', score: timeAnalysis.score, analysis: timeAnalysis },
    { name: 'Energy Alignment', score: energyAnalysis.score, analysis: energyAnalysis },
    { name: 'Budget Health', score: budgetAnalysis.score, analysis: budgetAnalysis },
    { name: 'Focus Quality', score: focusAnalysis.score, analysis: focusAnalysis },
  ];
  
  const sortedByScore = [...dimensionScores].sort((a, b) => a.score - b.score);
  const topIssues = sortedByScore
    .filter(d => d.score < 0.70)
    .slice(0, 3)
    .flatMap(d => d.analysis.recommendations);
  
  // Identify top wins (highest scoring dimensions)
  const topWins = sortedByScore
    .reverse()
    .filter(d => d.score >= 0.80)
    .slice(0, 3)
    .flatMap(d => d.analysis.insights.filter(i => i.includes('✅')));
  
  // Overall health status
  let overallHealth: BalanceReport['overallHealth'];
  if (balance.overall >= 0.85) overallHealth = 'excellent';
  else if (balance.overall >= 0.70) overallHealth = 'good';
  else if (balance.overall >= 0.50) overallHealth = 'fair';
  else if (balance.overall >= 0.30) overallHealth = 'poor';
  else overallHealth = 'critical';
  
  return {
    balance,
    dimensions: {
      time: timeAnalysis,
      energy: energyAnalysis,
      budget: budgetAnalysis,
      focus: focusAnalysis,
    },
    topIssues: topIssues.slice(0, 3),
    topWins: topWins.slice(0, 3),
    overallHealth,
    timestamp: new Date(),
  };
}

/**
 * Get color for dimension score
 */
export function getDimensionColor(score: number): string {
  if (score >= 0.85) return '#10b981'; // Green
  if (score >= 0.70) return '#14b8a6'; // Teal
  if (score >= 0.50) return '#f59e0b'; // Orange
  if (score >= 0.30) return '#ef4444'; // Red
  return '#991b1b'; // Dark Red
}

/**
 * Get status emoji
 */
export function getStatusEmoji(status: DimensionAnalysis['status']): string {
  switch (status) {
    case 'excellent': return '🟢';
    case 'good': return '🟡';
    case 'fair': return '🟠';
    case 'poor': return '🔴';
    case 'critical': return '⛔';
  }
}
