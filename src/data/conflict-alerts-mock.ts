/**
 * Conflict Alerts Mock Data
 * Active budget conflicts with intelligent detection and alternative suggestions
 */

import { ConflictAlert } from '../types/budget-types';

export const conflictAlerts: ConflictAlert[] = [
  // Primary conflict - Osteria Francescana dinner exceeds budget
  {
    id: 'conflict_001',
    goalId: 'goal_budget_dining_001',
    eventId: 'event_dinner_001',
    severity: 'moderate',
    overageAmount: 45,
    overagePercentage: 75, // 75% over the $60 budget
    detectedDate: '2026-01-08T14:35:00Z',
    alternatives: ['alt_rest_001', 'alt_rest_002', 'alt_rest_003'], // IDs from restaurant-alternatives-mock.ts
    status: 'active',
    // No resolution yet - user hasn't taken action
  },
  
  // Example of a resolved conflict (for reference/history)
  {
    id: 'conflict_002',
    goalId: 'goal_budget_dining_001',
    eventId: 'event_dinner_historical_001', // Historical event
    severity: 'minor',
    overageAmount: 8,
    overagePercentage: 13,
    detectedDate: '2026-01-02T09:15:00Z',
    alternatives: ['alt_rest_006', 'alt_rest_007'],
    status: 'resolved',
    resolutionAction: 'chose-alternative',
    resolvedDate: '2026-01-02T10:30:00Z',
    userNotes: 'Chose Locanda Verde instead, great decision!'
  },

  // Example of dismissed conflict
  {
    id: 'conflict_003',
    goalId: 'goal_budget_entertainment_001',
    eventId: 'event_concert_historical_001',
    severity: 'minor',
    overageAmount: 15,
    overagePercentage: 20,
    detectedDate: '2025-12-28T16:20:00Z',
    status: 'dismissed',
    dismissReason: 'Special occasion - willing to spend extra',
    resolvedDate: '2025-12-28T16:25:00Z'
  }
];

// Helper function to get active conflicts
export function getActiveConflicts(): ConflictAlert[] {
  return conflictAlerts.filter(conflict => conflict.status === 'active');
}

// Helper function to get conflict by ID
export function getConflictById(id: string): ConflictAlert | undefined {
  return conflictAlerts.find(conflict => conflict.id === id);
}

// Helper function to get conflicts by goal
export function getConflictsByGoal(goalId: string): ConflictAlert[] {
  return conflictAlerts.filter(conflict => conflict.goalId === goalId);
}

// Helper function to get conflicts by event
export function getConflictsByEvent(eventId: string): ConflictAlert[] {
  return conflictAlerts.filter(conflict => conflict.eventId === eventId);
}

// Helper function to get conflict severity counts
export function getConflictSeverityCounts(): { minor: number; moderate: number; severe: number } {
  const active = getActiveConflicts();
  return {
    minor: active.filter(c => c.severity === 'minor').length,
    moderate: active.filter(c => c.severity === 'moderate').length,
    severe: active.filter(c => c.severity === 'severe').length
  };
}

// Helper function to calculate total potential savings
export function getTotalPotentialSavings(): number {
  return getActiveConflicts().reduce((total, conflict) => total + conflict.overageAmount, 0);
}

// Helper function to resolve a conflict
export function resolveConflict(
  conflictId: string,
  action: 'kept-original' | 'chose-alternative' | 'adjusted-budget' | 'cancelled-event',
  notes?: string
): ConflictAlert | undefined {
  const conflict = conflictAlerts.find(c => c.id === conflictId);
  if (!conflict) return undefined;
  
  conflict.status = 'resolved';
  conflict.resolutionAction = action;
  conflict.resolvedDate = new Date().toISOString();
  if (notes) conflict.userNotes = notes;
  
  return conflict;
}

// Helper function to dismiss a conflict
export function dismissConflict(conflictId: string, reason: string): ConflictAlert | undefined {
  const conflict = conflictAlerts.find(c => c.id === conflictId);
  if (!conflict) return undefined;
  
  conflict.status = 'dismissed';
  conflict.dismissReason = reason;
  conflict.resolvedDate = new Date().toISOString();
  
  return conflict;
}
