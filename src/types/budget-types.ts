/**
 * Budget & Financial Conflict System - Type Definitions
 * Research-based types for intelligent budget tracking and conflict detection
 */

// ============================================================================
// Budget Goal Types
// ============================================================================

export type BudgetCategory = 
  | 'dining_out' 
  | 'entertainment' 
  | 'shopping' 
  | 'groceries' 
  | 'travel'
  | 'fitness'
  | 'education'
  | 'hobbies';

export type BudgetPeriod = 'per-event' | 'daily' | 'weekly' | 'monthly';

export interface BudgetGoal {
  id: string;
  title: string;
  description: string;
  type: 'budget';
  category: BudgetCategory;
  budgetAmount: number;           // Dollar limit
  budgetPeriod: BudgetPeriod;
  currentSpending: number;        // Amount spent so far this period
  remainingBudget: number;        // Calculated: budgetAmount - currentSpending
  trackingStartDate: string;      // When tracking period started
  targetDate?: string;            // Optional end date for goal
  autoConflictDetection: boolean; // Enable smart alerts
  linkedEvents: string[];         // IDs of planned events
  conflicts: string[];            // IDs of active conflicts
  status: 'on-track' | 'at-risk' | 'over-budget' | 'completed';
  progress?: number;              // 0-100 percentage
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  notes?: string;
  createdDate: string;
  lastUpdated: string;
}

// ============================================================================
// Event & Reservation Types
// ============================================================================

export type EventType = 'dining' | 'entertainment' | 'shopping' | 'travel' | 'fitness' | 'education';

export type PriceRange = '$' | '$$' | '$$$' | '$$$$';

export type ConflictStatus = 'none' | 'minor' | 'moderate' | 'severe';

export interface Venue {
  name: string;
  address?: string;
  city?: string;
  cuisine?: string;              // For restaurants
  category?: string;             // For other venues
  priceRange: PriceRange;
  rating?: number;               // 1-5
  reviewCount?: number;
  phone?: string;
  website?: string;
}

export interface PlannedEvent {
  id: string;
  title: string;
  type: EventType;
  date: string;                  // ISO date string
  time?: string;                 // HH:MM format
  venue: Venue;
  estimatedCost: number;         // Total or per person
  costType: 'total' | 'per-person';
  numberOfPeople?: number;
  linkedBudgetGoalId?: string;   // Which budget this affects
  conflictStatus: ConflictStatus;
  overageAmount?: number;        // How much over budget
  notes?: string;
  confirmationNumber?: string;
  createdDate: string;
}

// ============================================================================
// Conflict Alert Types
// ============================================================================

export type ConflictSeverity = 'minor' | 'moderate' | 'severe';

export type AlertStatus = 'active' | 'resolved' | 'dismissed';

export type ResolutionAction = 
  | 'kept-original' 
  | 'chose-alternative' 
  | 'adjusted-budget'
  | 'cancelled-event';

export interface ConflictAlert {
  id: string;
  goalId: string;                // Budget goal being violated
  eventId: string;               // Event causing conflict
  severity: ConflictSeverity;
  overageAmount: number;         // How much over budget
  overagePercentage: number;     // Percentage over (e.g., 75 = 75% over)
  detectedDate: string;
  alternatives?: string[];       // IDs of suggested alternatives
  status: AlertStatus;
  resolutionAction?: ResolutionAction;
  resolvedDate?: string;
  dismissReason?: string;
  userNotes?: string;
}

// ============================================================================
// Restaurant Alternative Types
// ============================================================================

export interface RestaurantAlternative {
  id: string;
  name: string;
  cuisine: string;
  priceRange: PriceRange;
  averageCostPerPlate: number;
  address: string;
  city: string;
  distanceFromOriginal?: string; // "0.5 miles", "10 min walk"
  rating: number;                // 1-5
  reviewCount?: number;
  vibeMatch: number;             // 0-100 how similar to original
  matchReason: string;           // Why this matches
  budgetSavings: number;         // How much this saves vs original
  imageUrl?: string;
  whySuggested: string;          // Personalized explanation
  highlights: string[];          // ["Authentic Italian", "Intimate setting", "Great wine list"]
  dietaryOptions?: string[];     // ["Vegetarian", "Vegan", "Gluten-free"]
  reservationUrl?: string;
  phone?: string;
  hoursToday?: string;           // "5:00 PM - 10:00 PM"
  priceForTwo?: number;          // Estimated total for 2 people
}

// ============================================================================
// Alternative Comparison Types
// ============================================================================

export interface AlternativeComparison {
  original: PlannedEvent;
  budget: BudgetGoal;
  conflict: ConflictAlert;
  alternatives: RestaurantAlternative[];
  potentialSavings: number;      // Total savings if cheapest alternative chosen
  budgetImpact: {
    original: number;            // Cost of original
    budget: number;              // Budget amount
    overage: number;             // How much over
    percentOver: number;         // Percentage
  };
}

// ============================================================================
// Utility Types
// ============================================================================

export interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  percentUsed: number;
  activeConflicts: number;
  goalsByCategory: Record<BudgetCategory, number>;
}

export interface SpendingTrend {
  period: string;                // "Week 1", "January", etc.
  budgeted: number;
  actual: number;
  difference: number;
}
