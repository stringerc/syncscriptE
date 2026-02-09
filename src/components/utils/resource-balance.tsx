/**
 * Resource Balance Utilities
 * 
 * Multi-dimensional resource balance analysis inspired by Resonance Calculus
 * Evaluates Time, Energy, Budget, and Focus dimensions
 */

// Types
export interface ResourceBalance {
  time: number;      // 0-1 score
  energy: number;    // 0-1 score
  budget: number;    // 0-1 score
  focus: number;     // 0-1 score
  overall: number;   // 0-1 score (average)
}

export interface DimensionAnalysis {
  score: number;     // 0-1 score
  insights: string[];
  recommendations: string[];
}

export interface ResourceBalanceResult {
  balance: ResourceBalance;
  overallHealth: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  dimensions: {
    time: DimensionAnalysis;
    energy: DimensionAnalysis;
    budget: DimensionAnalysis;
    focus: DimensionAnalysis;
  };
  topIssues: string[];
  topWins: string[];
}

export interface BudgetConfig {
  monthlyBudget: number;
  currentSpending: number;
  daysInMonth: number;
  dayOfMonth: number;
  savingsGoal?: number;
  currentSavings?: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date | string;
  end: Date | string;
  type?: string;
  energyLevel?: 'high' | 'medium' | 'low';
}

export interface Task {
  id: string;
  name: string;
  status?: string;
  priority?: 'high' | 'medium' | 'low';
  estimatedDuration?: number;
  dueDate?: Date | string;
  type?: string;
}

/**
 * Calculate multi-dimensional resource balance
 */
export function calculateResourceBalance(
  events: CalendarEvent[],
  tasks: Task[],
  budgetConfig: BudgetConfig
): ResourceBalanceResult {
  // Defensive null checks
  const safeEvents = events || [];
  const safeTasks = tasks || [];
  
  // Calculate each dimension
  const timeScore = calculateTimeBalance(safeEvents, safeTasks);
  const energyScore = calculateEnergyBalance(safeEvents);
  const budgetScore = calculateBudgetBalance(budgetConfig);
  const focusScore = calculateFocusBalance(safeEvents, safeTasks);

  // Overall balance (average of all dimensions)
  const overallScore = (timeScore.score + energyScore.score + budgetScore.score + focusScore.score) / 4;

  // Determine overall health status
  const overallHealth = getHealthStatus(overallScore);

  // Identify top issues and wins
  const topIssues = identifyTopIssues(timeScore, energyScore, budgetScore, focusScore);
  const topWins = identifyTopWins(timeScore, energyScore, budgetScore, focusScore);

  return {
    balance: {
      time: timeScore.score,
      energy: energyScore.score,
      budget: budgetScore.score,
      focus: focusScore.score,
      overall: overallScore,
    },
    overallHealth,
    dimensions: {
      time: timeScore,
      energy: energyScore,
      budget: budgetScore,
      focus: focusScore,
    },
    topIssues,
    topWins,
  };
}

/**
 * Calculate time dimension balance
 */
function calculateTimeBalance(events: CalendarEvent[], tasks: Task[]): DimensionAnalysis {
  const insights: string[] = [];
  const recommendations: string[] = [];

  // Count scheduled vs unscheduled time
  const totalHoursInDay = 24;
  const workingHours = 8;
  const scheduledHours = events.reduce((total, event) => {
    const start = new Date(event.start);
    const end = new Date(event.end);
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return total + duration;
  }, 0);

  const utilizationRate = Math.min(scheduledHours / workingHours, 1);
  
  // Calculate buffer time (ideal is 20-30% unscheduled)
  const bufferRate = 1 - utilizationRate;
  
  let score = 0;
  if (utilizationRate > 0.9) {
    score = 0.5; // Over-scheduled
    insights.push(`${Math.round(scheduledHours)} hours scheduled - very full day`);
    recommendations.push('Consider leaving buffer time for unexpected tasks');
  } else if (utilizationRate > 0.7 && utilizationRate <= 0.9) {
    score = 0.85; // Good utilization
    insights.push(`${Math.round(scheduledHours)} hours scheduled - healthy pace`);
    recommendations.push('Good time allocation');
  } else if (utilizationRate >= 0.5) {
    score = 0.75; // Moderate
    insights.push(`${Math.round(scheduledHours)} hours scheduled - room for more`);
  } else {
    score = 0.6; // Under-utilized
    insights.push(`Only ${Math.round(scheduledHours)} hours scheduled`);
    recommendations.push('Consider scheduling priority tasks');
  }

  // Check for unscheduled high-priority tasks
  const urgentTasks = tasks.filter(t => 
    t.priority === 'high' && (t.status !== 'completed' && t.status !== 'done')
  ).length;
  
  if (urgentTasks > 0) {
    insights.push(`${urgentTasks} high-priority task${urgentTasks > 1 ? 's' : ''} need scheduling`);
    score *= 0.85; // Reduce score
  }

  return {
    score: Math.max(0, Math.min(1, score)),
    insights,
    recommendations,
  };
}

/**
 * Calculate energy dimension balance
 */
function calculateEnergyBalance(events: CalendarEvent[]): DimensionAnalysis {
  const insights: string[] = [];
  const recommendations: string[] = [];

  // Analyze energy distribution across the day
  const highEnergyEvents = events.filter(e => e.energyLevel === 'high').length;
  const mediumEnergyEvents = events.filter(e => e.energyLevel === 'medium').length;
  const lowEnergyEvents = events.filter(e => e.energyLevel === 'low').length;
  const totalEvents = events.length;

  // Calculate balance score
  let score = 0.7; // Default

  if (totalEvents === 0) {
    score = 0.5;
    insights.push('No events scheduled to analyze energy levels');
  } else {
    const highRatio = highEnergyEvents / totalEvents;
    const lowRatio = lowEnergyEvents / totalEvents;

    // Ideal: 30-40% high energy, 40-50% medium, 10-20% low
    if (highRatio > 0.6) {
      score = 0.55;
      insights.push(`${highEnergyEvents} high-energy events - may lead to burnout`);
      recommendations.push('Balance with lighter tasks to prevent fatigue');
    } else if (highRatio >= 0.3 && highRatio <= 0.5) {
      score = 0.9;
      insights.push('Well-balanced energy distribution');
      recommendations.push('Maintain this sustainable pace');
    } else if (highRatio < 0.2) {
      score = 0.65;
      insights.push('Limited challenging work scheduled');
      recommendations.push('Consider adding meaningful deep work sessions');
    }

    // Check for recovery time
    if (lowRatio < 0.1) {
      insights.push('Consider adding breaks or light activities');
      score *= 0.9;
    }
  }

  return {
    score: Math.max(0, Math.min(1, score)),
    insights,
    recommendations,
  };
}

/**
 * Calculate budget dimension balance
 */
function calculateBudgetBalance(config: BudgetConfig): DimensionAnalysis {
  const insights: string[] = [];
  const recommendations: string[] = [];

  const {
    monthlyBudget,
    currentSpending,
    daysInMonth,
    dayOfMonth,
    savingsGoal,
    currentSavings,
  } = config;

  // Calculate expected vs actual spending
  const expectedSpending = (monthlyBudget / daysInMonth) * dayOfMonth;
  const spendingRatio = currentSpending / expectedSpending;

  let score = 0.7; // Default

  if (spendingRatio <= 0.9) {
    score = 0.95;
    insights.push(`Under budget by $${Math.round(expectedSpending - currentSpending)}`);
    recommendations.push('Great spending discipline!');
  } else if (spendingRatio <= 1.0) {
    score = 0.85;
    insights.push('Spending on track with budget');
  } else if (spendingRatio <= 1.1) {
    score = 0.65;
    insights.push(`$${Math.round(currentSpending - expectedSpending)} over expected spending`);
    recommendations.push('Monitor discretionary expenses');
  } else {
    score = 0.45;
    insights.push(`$${Math.round(currentSpending - expectedSpending)} over budget`);
    recommendations.push('Review and cut non-essential expenses');
  }

  // Check savings progress
  if (savingsGoal && currentSavings !== undefined) {
    const savingsProgress = currentSavings / savingsGoal;
    if (savingsProgress >= 0.75) {
      insights.push(`${Math.round(savingsProgress * 100)}% towards savings goal`);
    } else if (savingsProgress < 0.5) {
      recommendations.push('Increase savings contributions if possible');
      score *= 0.95;
    }
  }

  return {
    score: Math.max(0, Math.min(1, score)),
    insights,
    recommendations,
  };
}

/**
 * Calculate focus dimension balance
 */
function calculateFocusBalance(events: CalendarEvent[], tasks: Task[]): DimensionAnalysis {
  const insights: string[] = [];
  const recommendations: string[] = [];

  // Analyze context switching and fragmentation
  const meetings = events.filter(e => 
    e.type?.toLowerCase().includes('meeting') || 
    e.title?.toLowerCase().includes('meeting')
  ).length;

  const deepWorkBlocks = events.filter(e => 
    e.type?.toLowerCase().includes('deep') || 
    e.type?.toLowerCase().includes('focus')
  ).length;

  let score = 0.7; // Default

  // Calculate fragmentation (meetings break up deep work)
  const fragmentationRatio = meetings / Math.max(events.length, 1);

  if (fragmentationRatio > 0.5) {
    score = 0.55;
    insights.push(`${meetings} meetings may fragment your day`);
    recommendations.push('Try batching meetings to preserve focus blocks');
  } else if (fragmentationRatio >= 0.2 && fragmentationRatio <= 0.35) {
    score = 0.85;
    insights.push('Good balance of meetings and focus time');
  } else if (fragmentationRatio < 0.2) {
    score = 0.75;
    insights.push('Plenty of uninterrupted time available');
  }

  // Check for deep work blocks
  if (deepWorkBlocks >= 2) {
    insights.push(`${deepWorkBlocks} deep work sessions scheduled`);
    score = Math.min(1, score * 1.15); // Boost score
  } else if (deepWorkBlocks === 0) {
    recommendations.push('Schedule at least one 90-min deep work block');
    score *= 0.9;
  }

  // Check task variety (too many types = context switching)
  const taskTypes = new Set(tasks.map(t => t.type || 'general')).size;
  if (taskTypes > 5) {
    insights.push(`${taskTypes} different task types - high context switching`);
    score *= 0.9;
  }

  return {
    score: Math.max(0, Math.min(1, score)),
    insights,
    recommendations,
  };
}

/**
 * Get health status from score
 */
function getHealthStatus(score: number): 'Excellent' | 'Good' | 'Fair' | 'Poor' {
  if (score >= 0.8) return 'Excellent';
  if (score >= 0.7) return 'Good';
  if (score >= 0.5) return 'Fair';
  return 'Poor';
}

/**
 * Identify top issues across dimensions
 */
function identifyTopIssues(
  time: DimensionAnalysis,
  energy: DimensionAnalysis,
  budget: DimensionAnalysis,
  focus: DimensionAnalysis
): string[] {
  const issues: Array<{ issue: string; score: number }> = [];

  // Collect issues from each dimension
  if (time.score < 0.7) {
    time.recommendations.forEach(rec => {
      issues.push({ issue: `Time: ${rec}`, score: time.score });
    });
  }
  if (energy.score < 0.7) {
    energy.recommendations.forEach(rec => {
      issues.push({ issue: `Energy: ${rec}`, score: energy.score });
    });
  }
  if (budget.score < 0.7) {
    budget.recommendations.forEach(rec => {
      issues.push({ issue: `Budget: ${rec}`, score: budget.score });
    });
  }
  if (focus.score < 0.7) {
    focus.recommendations.forEach(rec => {
      issues.push({ issue: `Focus: ${rec}`, score: focus.score });
    });
  }

  // Sort by severity (lowest score first) and return top 3
  return issues
    .sort((a, b) => a.score - b.score)
    .slice(0, 3)
    .map(i => i.issue);
}

/**
 * Identify top wins across dimensions
 */
function identifyTopWins(
  time: DimensionAnalysis,
  energy: DimensionAnalysis,
  budget: DimensionAnalysis,
  focus: DimensionAnalysis
): string[] {
  const wins: Array<{ win: string; score: number }> = [];

  // Collect wins from high-performing dimensions
  const dimensions = [
    { name: 'Time', analysis: time },
    { name: 'Energy', analysis: energy },
    { name: 'Budget', analysis: budget },
    { name: 'Focus', analysis: focus },
  ];

  dimensions.forEach(({ name, analysis }) => {
    if (analysis.score >= 0.8) {
      analysis.insights.forEach(insight => {
        if (!insight.includes('need') && !insight.includes('consider')) {
          wins.push({ win: `${name}: ${insight}`, score: analysis.score });
        }
      });
    }
  });

  // Sort by score (highest first) and return top 3
  return wins
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(w => w.win);
}

/**
 * Get color based on dimension score
 */
export function getDimensionColor(score: number): string {
  if (score >= 0.8) return '#10b981'; // green-500
  if (score >= 0.7) return '#3b82f6'; // blue-500
  if (score >= 0.5) return '#f59e0b'; // amber-500
  return '#ef4444'; // red-500
}

/**
 * Get emoji based on health status
 */
export function getStatusEmoji(status: string): string {
  switch (status) {
    case 'Excellent': return '🌟';
    case 'Good': return '✅';
    case 'Fair': return '⚠️';
    case 'Poor': return '🔴';
    default: return '•';
  }
}