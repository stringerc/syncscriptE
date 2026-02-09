/**
 * Enhanced Budget Goals Mock Data
 * Integrates with new budget types and conflict detection system
 */

import { BudgetGoal } from '../types/budget-types';

export const budgetGoals: BudgetGoal[] = [
  // Primary budget goal - Dining Out (the one with the conflict)
  {
    id: 'goal_budget_dining_001',
    title: 'Mindful Dining Budget',
    description: 'Keep dining out expenses reasonable while still enjoying quality experiences. Limit to $60 per person for dinner outings to save for upcoming vacation.',
    type: 'budget',
    category: 'dining_out',
    budgetAmount: 60,
    budgetPeriod: 'per-event',
    currentSpending: 0,
    remainingBudget: 60,
    trackingStartDate: '2026-01-01',
    targetDate: '2026-12-31',
    autoConflictDetection: true,
    linkedEvents: ['event_dinner_001', 'event_dinner_002'],
    conflicts: ['conflict_001'],
    status: 'at-risk',
    progress: 0,
    priority: 'high',
    tags: ['dining', 'food', 'restaurants', 'budget'],
    notes: 'Want to enjoy dining but be mindful of spending. Saving $45 per meal = $180/month toward vacation fund.',
    createdDate: '2026-01-01T08:00:00Z',
    lastUpdated: '2026-01-08T14:35:00Z'
  },

  // Entertainment budget goal
  {
    id: 'goal_budget_entertainment_001',
    title: 'Entertainment & Culture',
    description: 'Monthly budget for movies, concerts, shows, and cultural experiences.',
    type: 'budget',
    category: 'entertainment',
    budgetAmount: 300,
    budgetPeriod: 'monthly',
    currentSpending: 107,
    remainingBudget: 193,
    trackingStartDate: '2026-01-01',
    targetDate: '2026-12-31',
    autoConflictDetection: true,
    linkedEvents: ['event_movie_001', 'event_concert_001'],
    conflicts: [],
    status: 'on-track',
    progress: 36, // 107/300 = 35.6%
    priority: 'medium',
    tags: ['entertainment', 'movies', 'concerts', 'culture'],
    notes: 'Already attended one concert this month ($75) and movie night ($32)',
    createdDate: '2026-01-01T08:00:00Z',
    lastUpdated: '2026-01-10T09:15:00Z'
  },

  // Fitness budget goal
  {
    id: 'goal_budget_fitness_001',
    title: 'Wellness & Fitness',
    description: 'Monthly budget for gym membership, fitness classes, and wellness activities.',
    type: 'budget',
    category: 'fitness',
    budgetAmount: 200,
    budgetPeriod: 'monthly',
    currentSpending: 120,
    remainingBudget: 80,
    trackingStartDate: '2026-01-01',
    targetDate: '2026-12-31',
    autoConflictDetection: true,
    linkedEvents: [],
    conflicts: [],
    status: 'on-track',
    progress: 60, // 120/200 = 60%
    priority: 'high',
    tags: ['fitness', 'health', 'wellness', 'gym'],
    notes: 'Gym membership ($80) + 2 yoga classes ($40)',
    createdDate: '2026-01-01T08:00:00Z',
    lastUpdated: '2026-01-08T10:00:00Z'
  },

  // Shopping budget goal
  {
    id: 'goal_budget_shopping_001',
    title: 'Shopping & Personal',
    description: 'Weekly budget for clothing, accessories, and personal items.',
    type: 'budget',
    category: 'shopping',
    budgetAmount: 150,
    budgetPeriod: 'weekly',
    currentSpending: 45,
    remainingBudget: 105,
    trackingStartDate: '2026-01-06',
    targetDate: '2026-12-31',
    autoConflictDetection: true,
    linkedEvents: [],
    conflicts: [],
    status: 'on-track',
    progress: 30, // 45/150 = 30%
    priority: 'low',
    tags: ['shopping', 'clothes', 'personal'],
    notes: 'Bought new work shoes this week',
    createdDate: '2026-01-01T08:00:00Z',
    lastUpdated: '2026-01-07T16:20:00Z'
  },

  // Groceries budget goal
  {
    id: 'goal_budget_groceries_001',
    title: 'Groceries & Home',
    description: 'Weekly grocery budget for healthy home-cooked meals.',
    type: 'budget',
    category: 'groceries',
    budgetAmount: 125,
    budgetPeriod: 'weekly',
    currentSpending: 88,
    remainingBudget: 37,
    trackingStartDate: '2026-01-06',
    targetDate: '2026-12-31',
    autoConflictDetection: true,
    linkedEvents: [],
    conflicts: [],
    status: 'on-track',
    progress: 70, // 88/125 = 70.4%
    priority: 'high',
    tags: ['groceries', 'food', 'home', 'cooking'],
    notes: 'Two grocery trips this week, staying on track',
    createdDate: '2026-01-01T08:00:00Z',
    lastUpdated: '2026-01-09T18:30:00Z'
  },

  // Travel savings goal (aspirational)
  {
    id: 'goal_budget_travel_001',
    title: 'Summer Vacation Fund',
    description: 'Saving for a dream summer vacation to Italy. Every dollar saved from dining budget goes here!',
    type: 'budget',
    category: 'travel',
    budgetAmount: 3000,
    budgetPeriod: 'monthly',
    currentSpending: 0,
    remainingBudget: 3000,
    trackingStartDate: '2026-01-01',
    targetDate: '2026-06-01',
    autoConflictDetection: false,
    linkedEvents: [],
    conflicts: [],
    status: 'on-track',
    progress: 15, // Already saved $450 of $3000
    priority: 'high',
    tags: ['travel', 'vacation', 'savings', 'italy'],
    notes: 'Goal: Save $3000 by June for 2-week Italy trip. Currently saved $450. Savings from mindful dining will accelerate this!',
    createdDate: '2025-12-15T10:00:00Z',
    lastUpdated: '2026-01-10T08:00:00Z'
  }
];

// Helper function to get budget goal by ID
export function getBudgetGoalById(id: string): BudgetGoal | undefined {
  return budgetGoals.find(goal => goal.id === id);
}

// Helper function to get budget goals by category
export function getBudgetGoalsByCategory(category: string): BudgetGoal[] {
  return budgetGoals.filter(goal => goal.category === category);
}

// Helper function to get budget goals with conflicts
export function getBudgetGoalsWithConflicts(): BudgetGoal[] {
  return budgetGoals.filter(goal => goal.conflicts.length > 0);
}

// Helper function to get budget goals by status
export function getBudgetGoalsByStatus(status: 'on-track' | 'at-risk' | 'over-budget' | 'completed'): BudgetGoal[] {
  return budgetGoals.filter(goal => goal.status === status);
}

// Helper function to calculate total budget across all goals
export function getTotalBudgetSummary() {
  // Only sum monthly budgets for fair comparison
  const monthlyGoals = budgetGoals.filter(g => g.budgetPeriod === 'monthly');
  
  const totalBudget = monthlyGoals.reduce((sum, goal) => sum + goal.budgetAmount, 0);
  const totalSpent = monthlyGoals.reduce((sum, goal) => sum + goal.currentSpending, 0);
  const totalRemaining = monthlyGoals.reduce((sum, goal) => sum + goal.remainingBudget, 0);
  
  return {
    totalBudget,
    totalSpent,
    totalRemaining,
    percentUsed: Math.round((totalSpent / totalBudget) * 100),
    activeConflicts: budgetGoals.reduce((sum, goal) => sum + goal.conflicts.length, 0)
  };
}

// Helper function to get spending by category
export function getSpendingByCategory() {
  const categories = budgetGoals.reduce((acc, goal) => {
    if (!acc[goal.category]) {
      acc[goal.category] = {
        budgeted: 0,
        spent: 0,
        remaining: 0
      };
    }
    acc[goal.category].budgeted += goal.budgetAmount;
    acc[goal.category].spent += goal.currentSpending;
    acc[goal.category].remaining += goal.remainingBudget;
    return acc;
  }, {} as Record<string, { budgeted: number; spent: number; remaining: number }>);
  
  return categories;
}

// Helper function to calculate potential savings
export function calculatePotentialSavings(goalId: string, eventCost: number): number {
  const goal = getBudgetGoalById(goalId);
  if (!goal) return 0;
  
  const savings = eventCost - goal.budgetAmount;
  return savings > 0 ? savings : 0;
}
