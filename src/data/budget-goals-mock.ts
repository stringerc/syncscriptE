/**
 * Mock Data for Budget Goals and Financial Conflict Alerts
 * Based on research from financial apps (Mint, YNAB, PocketGuard) and recommendation systems
 */

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  pricePerPlate: number;
  vibe: string[];
  location: string;
  rating: number;
  description: string;
  imageUrl?: string;
  matchScore?: number; // Similarity score to original choice (0-100)
}

export interface DiningReservation {
  id: string;
  restaurant: Restaurant;
  date: string;
  time: string;
  partySize: number;
  estimatedCost: number;
}

export interface BudgetGoal {
  id: string;
  type: 'budget';
  category: 'dining-out' | 'entertainment' | 'shopping' | 'travel' | 'general';
  title: string;
  description: string;
  budgetAmount: number; // Max amount to spend
  budgetPeriod: 'per-meal' | 'daily' | 'weekly' | 'monthly';
  currentSpend: number; // Already spent in this period
  projectedSpend: number; // Including planned expenses
  periodStart: string;
  periodEnd: string;
  upcomingExpenses: DiningReservation[];
  conflictingExpenses: DiningReservation[];
  status: 'on-track' | 'at-risk' | 'exceeded';
  progress: number; // Percentage of budget used
  createdAt: string;
  updatedAt: string;
}

// MOCK RESTAURANTS DATA
export const mockRestaurants: Restaurant[] = [
  // Original (expensive) reservation
  {
    id: 'rest-001',
    name: 'Le Bernardin',
    cuisine: 'French Fine Dining',
    pricePerPlate: 105,
    vibe: ['upscale', 'romantic', 'fine-dining', 'formal'],
    location: '155 W 51st St, Manhattan',
    rating: 4.8,
    description: 'Michelin-starred seafood restaurant with elegant French cuisine',
  },
  
  // Budget-friendly alternatives (within $60 budget)
  {
    id: 'rest-002',
    name: 'Bistro Vendôme',
    cuisine: 'French Bistro',
    pricePerPlate: 45,
    vibe: ['romantic', 'cozy', 'intimate', 'charming'],
    location: '405 E 58th St, Manhattan',
    rating: 4.6,
    description: 'Authentic French bistro with intimate atmosphere and classic dishes',
    matchScore: 92,
  },
  {
    id: 'rest-003',
    name: 'Chez Napoleon',
    cuisine: 'French Comfort Food',
    pricePerPlate: 38,
    vibe: ['cozy', 'casual', 'traditional', 'warm'],
    location: '365 W 50th St, Manhattan',
    rating: 4.5,
    description: 'Family-run French bistro serving homestyle classics in a warm setting',
    matchScore: 85,
  },
  {
    id: 'rest-004',
    name: 'La Sirene',
    cuisine: 'French Mediterranean',
    pricePerPlate: 52,
    vibe: ['romantic', 'upscale-casual', 'intimate', 'modern'],
    location: '558 Broome St, SoHo',
    rating: 4.7,
    description: 'Modern French-Mediterranean cuisine with a romantic candlelit ambiance',
    matchScore: 88,
  },
  {
    id: 'rest-005',
    name: 'Buvette',
    cuisine: 'French-Italian',
    pricePerPlate: 35,
    vibe: ['cozy', 'casual', 'charming', 'intimate'],
    location: '42 Grove St, West Village',
    rating: 4.4,
    description: 'Tiny French-Italian cafe with rustic charm and delicious small plates',
    matchScore: 78,
  },
  {
    id: 'rest-006',
    name: 'Marseille',
    cuisine: 'French-Mediterranean',
    pricePerPlate: 48,
    vibe: ['upscale-casual', 'lively', 'modern', 'sophisticated'],
    location: '630 9th Ave, Hell\'s Kitchen',
    rating: 4.5,
    description: 'Stylish brasserie with Mediterranean-influenced French cuisine',
    matchScore: 82,
  },
];

// MOCK DINING RESERVATION (Conflicting)
export const mockConflictingReservation: DiningReservation = {
  id: 'res-001',
  restaurant: mockRestaurants[0], // Le Bernardin
  date: '2026-01-12',
  time: '7:30 PM',
  partySize: 2,
  estimatedCost: 210, // 2 people × $105/plate
};

// MOCK BUDGET GOAL
export const mockDiningBudgetGoal: BudgetGoal = {
  id: 'goal-budget-001',
  type: 'budget',
  category: 'dining-out',
  title: 'Dining Out Budget - January',
  description: 'Keep dining expenses reasonable while still enjoying nice meals. Limit to $60 per person for dinner outings.',
  budgetAmount: 60, // Per meal per person
  budgetPeriod: 'per-meal',
  currentSpend: 0, // No spend yet this period
  projectedSpend: 105, // Le Bernardin reservation
  periodStart: '2026-01-01',
  periodEnd: '2026-01-31',
  upcomingExpenses: [mockConflictingReservation],
  conflictingExpenses: [mockConflictingReservation],
  status: 'at-risk',
  progress: 175, // 105/60 = 175% over budget
  createdAt: '2026-01-01T10:00:00Z',
  updatedAt: '2026-01-09T15:30:00Z',
};

// HELPER FUNCTIONS
export function getAlternativeRestaurants(
  originalRestaurant: Restaurant,
  maxBudget: number,
  limit: number = 5
): Restaurant[] {
  return mockRestaurants
    .filter(r => r.id !== originalRestaurant.id && r.pricePerPlate <= maxBudget)
    .sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0))
    .slice(0, limit);
}

export function calculateBudgetVariance(goal: BudgetGoal, expense: DiningReservation): {
  variance: number;
  percentageOver: number;
  isOverBudget: boolean;
} {
  const costPerPerson = expense.estimatedCost / expense.partySize;
  const variance = costPerPerson - goal.budgetAmount;
  const percentageOver = (variance / goal.budgetAmount) * 100;
  
  return {
    variance,
    percentageOver: Math.round(percentageOver),
    isOverBudget: variance > 0,
  };
}

export function getBudgetStatus(goal: BudgetGoal): {
  status: 'on-track' | 'at-risk' | 'exceeded';
  message: string;
  color: string;
} {
  if (goal.projectedSpend > goal.budgetAmount * 1.5) {
    return {
      status: 'exceeded',
      message: 'Significantly over budget',
      color: 'red',
    };
  } else if (goal.projectedSpend > goal.budgetAmount) {
    return {
      status: 'at-risk',
      message: 'Over budget',
      color: 'orange',
    };
  } else {
    return {
      status: 'on-track',
      message: 'On track',
      color: 'green',
    };
  }
}
