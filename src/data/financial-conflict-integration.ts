/**
 * Financial Conflict System Integration
 * Combines budget goals, events, conflicts, and alternatives into a unified system
 */

import { budgetGoals, getBudgetGoalById } from './budget-goals-enhanced-mock';
import { plannedEvents, getEventById } from './planned-events-mock';
import { conflictAlerts, getActiveConflicts, getConflictById } from './conflict-alerts-mock';
import { restaurantAlternatives, getAlternativesForEvent } from './restaurant-alternatives-mock';
import { 
  BudgetGoal, 
  PlannedEvent, 
  ConflictAlert, 
  RestaurantAlternative,
  AlternativeComparison 
} from '../types/budget-types';

// ============================================================================
// Main Integration Functions
// ============================================================================

/**
 * Get the complete context for a conflict alert
 * This is what powers the dashboard card and modals
 */
export function getConflictContext(conflictId: string): {
  conflict: ConflictAlert;
  goal: BudgetGoal;
  event: PlannedEvent;
  alternatives: RestaurantAlternative[];
} | null {
  const conflict = getConflictById(conflictId);
  if (!conflict) return null;

  const goal = getBudgetGoalById(conflict.goalId);
  const event = getEventById(conflict.eventId);
  
  if (!goal || !event) return null;

  const alternatives = conflict.alternatives 
    ? restaurantAlternatives.filter(alt => conflict.alternatives?.includes(alt.id))
    : [];

  return {
    conflict,
    goal,
    event,
    alternatives
  };
}

/**
 * Get detailed comparison for alternatives modal
 */
export function getAlternativeComparison(conflictId: string): AlternativeComparison | null {
  const context = getConflictContext(conflictId);
  if (!context) return null;

  const { conflict, goal, event, alternatives } = context;

  const eventCost = event.costType === 'per-person' 
    ? event.estimatedCost 
    : event.estimatedCost / (event.numberOfPeople || 1);

  return {
    original: event,
    budget: goal,
    conflict: conflict,
    alternatives: alternatives,
    potentialSavings: Math.max(...alternatives.map(alt => alt.budgetSavings)),
    budgetImpact: {
      original: eventCost,
      budget: goal.budgetAmount,
      overage: conflict.overageAmount,
      percentOver: conflict.overagePercentage
    }
  };
}

/**
 * Get dashboard summary for financial conflicts
 */
export function getDashboardConflictSummary(): {
  hasActiveConflicts: boolean;
  primaryConflict: {
    id: string;
    title: string;
    overageAmount: number;
    severity: string;
    eventName: string;
    budgetName: string;
  } | null;
  totalConflicts: number;
  totalPotentialSavings: number;
} {
  const activeConflicts = getActiveConflicts();
  
  if (activeConflicts.length === 0) {
    return {
      hasActiveConflicts: false,
      primaryConflict: null,
      totalConflicts: 0,
      totalPotentialSavings: 0
    };
  }

  // Get the most severe conflict for dashboard display
  const primaryConflictAlert = activeConflicts.sort((a, b) => {
    const severityOrder = { severe: 3, moderate: 2, minor: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  })[0];

  const context = getConflictContext(primaryConflictAlert.id);
  
  return {
    hasActiveConflicts: true,
    primaryConflict: context ? {
      id: primaryConflictAlert.id,
      title: `${context.event.title} exceeds budget by $${primaryConflictAlert.overageAmount}`,
      overageAmount: primaryConflictAlert.overageAmount,
      severity: primaryConflictAlert.severity,
      eventName: context.event.title,
      budgetName: context.goal.title
    } : null,
    totalConflicts: activeConflicts.length,
    totalPotentialSavings: activeConflicts.reduce((sum, c) => sum + c.overageAmount, 0)
  };
}

/**
 * Get all data for a specific budget goal (for goal modal)
 */
export function getBudgetGoalFullContext(goalId: string): {
  goal: BudgetGoal;
  linkedEvents: PlannedEvent[];
  activeConflicts: ConflictAlert[];
  conflictContexts: ReturnType<typeof getConflictContext>[];
} | null {
  const goal = getBudgetGoalById(goalId);
  if (!goal) return null;

  const linkedEvents = plannedEvents.filter(event => 
    goal.linkedEvents.includes(event.id)
  );

  const activeConflicts = conflictAlerts.filter(conflict => 
    conflict.goalId === goalId && conflict.status === 'active'
  );

  const conflictContexts = activeConflicts
    .map(conflict => getConflictContext(conflict.id))
    .filter(context => context !== null);

  return {
    goal,
    linkedEvents,
    activeConflicts,
    conflictContexts
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

/**
 * Get severity color and styling
 */
export function getSeverityStyles(severity: 'minor' | 'moderate' | 'severe'): {
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
} {
  switch (severity) {
    case 'severe':
      return {
        color: 'text-red-300',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30',
        icon: '🚨'
      };
    case 'moderate':
      return {
        color: 'text-orange-300',
        bgColor: 'bg-orange-500/10',
        borderColor: 'border-orange-500/30',
        icon: '⚠️'
      };
    case 'minor':
      return {
        color: 'text-yellow-300',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30',
        icon: '💡'
      };
  }
}

/**
 * Calculate how much the user would save per month if they chose alternatives
 */
export function calculateMonthlySavingsImpact(perEventSavings: number, eventsPerMonth: number = 4): {
  monthlySavings: number;
  annualSavings: number;
  impactMessage: string;
} {
  const monthlySavings = perEventSavings * eventsPerMonth;
  const annualSavings = monthlySavings * 12;
  
  return {
    monthlySavings,
    annualSavings,
    impactMessage: `Choosing budget-friendly alternatives could save you ${formatCurrency(monthlySavings)}/month or ${formatCurrency(annualSavings)}/year!`
  };
}

// ============================================================================
// Export everything for easy import
// ============================================================================

export {
  budgetGoals,
  plannedEvents,
  conflictAlerts,
  restaurantAlternatives,
  getBudgetGoalById,
  getEventById,
  getConflictById,
  getActiveConflicts,
  getAlternativesForEvent
};

// Export the primary conflict context for dashboard
export const primaryConflictContext = getConflictContext('conflict_001');
export const dashboardSummary = getDashboardConflictSummary();
