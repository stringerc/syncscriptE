/**
 * Budgeting Domain - Public API
 * 
 * This package contains the budgeting and financial domain logic:
 * - Budget creation and management
 * - Transaction tracking
 * - Financial analytics
 * - Budget alerts and monitoring
 */

import { BaseEntity, UserContext, DomainError } from '@syncscript/shared-kernel'

// Budget domain
export interface Budget extends BaseEntity {
  name: string
  description?: string
  totalAmount: number
  spentAmount: number
  remainingAmount: number
  startDate: Date
  endDate: Date
  category: string
  userId: string
  isActive: boolean
  lineItems: BudgetLineItem[]
}

export interface BudgetLineItem extends BaseEntity {
  budgetId: string
  name: string
  description?: string
  allocatedAmount: number
  spentAmount: number
  remainingAmount: number
  category: string
  priority: 'low' | 'medium' | 'high'
}

export interface CreateBudgetRequest {
  name: string
  description?: string
  totalAmount: number
  startDate: Date
  endDate: Date
  category: string
  lineItems: CreateBudgetLineItemRequest[]
}

export interface CreateBudgetLineItemRequest {
  name: string
  description?: string
  allocatedAmount: number
  category: string
  priority?: 'low' | 'medium' | 'high'
}

export interface UpdateBudgetRequest {
  name?: string
  description?: string
  totalAmount?: number
  endDate?: Date
  isActive?: boolean
}

// Transaction domain
export interface Transaction extends BaseEntity {
  amount: number
  description: string
  category: string
  date: Date
  type: 'income' | 'expense'
  budgetId?: string
  budgetLineItemId?: string
  userId: string
  tags: string[]
  recurring?: RecurringTransaction
}

export interface RecurringTransaction {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  interval: number
  endDate?: Date
  nextDueDate: Date
}

export interface CreateTransactionRequest {
  amount: number
  description: string
  category: string
  date: Date
  type: 'income' | 'expense'
  budgetId?: string
  budgetLineItemId?: string
  tags?: string[]
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
    interval: number
    endDate?: Date
  }
}

export interface UpdateTransactionRequest {
  amount?: number
  description?: string
  category?: string
  date?: Date
  type?: 'income' | 'expense'
  budgetId?: string
  budgetLineItemId?: string
  tags?: string[]
}

// Financial analytics
export interface FinancialAnalytics {
  period: {
    startDate: Date
    endDate: Date
  }
  summary: {
    totalIncome: number
    totalExpenses: number
    netIncome: number
    budgetUtilization: number
  }
  categoryBreakdown: CategoryBreakdown[]
  trends: {
    income: TrendData[]
    expenses: TrendData[]
    netIncome: TrendData[]
  }
  budgetPerformance: BudgetPerformance[]
}

export interface CategoryBreakdown {
  category: string
  amount: number
  percentage: number
  transactionCount: number
  averageAmount: number
}

export interface TrendData {
  date: Date
  amount: number
  change: number
  changePercentage: number
}

export interface BudgetPerformance {
  budgetId: string
  budgetName: string
  allocatedAmount: number
  spentAmount: number
  remainingAmount: number
  utilizationPercentage: number
  status: 'on-track' | 'over-budget' | 'under-budget'
  projectedOverspend?: number
}

// Budget alerts
export interface BudgetAlert extends BaseEntity {
  budgetId: string
  userId: string
  type: 'threshold' | 'overspend' | 'underspend' | 'deadline'
  threshold?: number
  message: string
  isActive: boolean
  triggeredAt?: Date
  acknowledgedAt?: Date
}

export interface CreateBudgetAlertRequest {
  budgetId: string
  type: 'threshold' | 'overspend' | 'underspend' | 'deadline'
  threshold?: number
  message: string
}

// Savings goals
export interface SavingsGoal extends BaseEntity {
  name: string
  description?: string
  targetAmount: number
  currentAmount: number
  targetDate: Date
  userId: string
  isActive: boolean
  contributions: SavingsContribution[]
}

export interface SavingsContribution extends BaseEntity {
  goalId: string
  amount: number
  date: Date
  source: string
  description?: string
}

// Domain services (interfaces only - implementations in server)
export interface BudgetService {
  createBudget(userId: string, request: CreateBudgetRequest): Promise<Budget>
  updateBudget(userId: string, budgetId: string, request: UpdateBudgetRequest): Promise<Budget>
  deleteBudget(userId: string, budgetId: string): Promise<void>
  getBudgets(userId: string, filters?: { isActive?: boolean; category?: string }): Promise<Budget[]>
  getBudget(userId: string, budgetId: string): Promise<Budget>
  addLineItem(userId: string, budgetId: string, request: CreateBudgetLineItemRequest): Promise<BudgetLineItem>
  updateLineItem(userId: string, budgetId: string, lineItemId: string, request: Partial<CreateBudgetLineItemRequest>): Promise<BudgetLineItem>
  deleteLineItem(userId: string, budgetId: string, lineItemId: string): Promise<void>
}

export interface TransactionService {
  createTransaction(userId: string, request: CreateTransactionRequest): Promise<Transaction>
  updateTransaction(userId: string, transactionId: string, request: UpdateTransactionRequest): Promise<Transaction>
  deleteTransaction(userId: string, transactionId: string): Promise<void>
  getTransactions(userId: string, filters?: { startDate?: Date; endDate?: Date; category?: string; type?: string }): Promise<Transaction[]>
  getTransaction(userId: string, transactionId: string): Promise<Transaction>
  categorizeTransaction(userId: string, transactionId: string, category: string): Promise<Transaction>
}

export interface FinancialAnalyticsService {
  getAnalytics(userId: string, period: { startDate: Date; endDate: Date }): Promise<FinancialAnalytics>
  getCategoryBreakdown(userId: string, period: { startDate: Date; endDate: Date }): Promise<CategoryBreakdown[]>
  getTrends(userId: string, period: { startDate: Date; endDate: Date }): Promise<{ income: TrendData[]; expenses: TrendData[]; netIncome: TrendData[] }>
  getBudgetPerformance(userId: string, period: { startDate: Date; endDate: Date }): Promise<BudgetPerformance[]>
}

export interface BudgetAlertService {
  createAlert(userId: string, request: CreateBudgetAlertRequest): Promise<BudgetAlert>
  updateAlert(userId: string, alertId: string, isActive: boolean): Promise<BudgetAlert>
  deleteAlert(userId: string, alertId: string): Promise<void>
  getAlerts(userId: string, filters?: { isActive?: boolean; type?: string }): Promise<BudgetAlert[]>
  acknowledgeAlert(userId: string, alertId: string): Promise<BudgetAlert>
  checkBudgetThresholds(userId: string): Promise<BudgetAlert[]>
}

export interface SavingsGoalService {
  createGoal(userId: string, request: { name: string; description?: string; targetAmount: number; targetDate: Date }): Promise<SavingsGoal>
  updateGoal(userId: string, goalId: string, request: { name?: string; description?: string; targetAmount?: number; targetDate?: Date }): Promise<SavingsGoal>
  deleteGoal(userId: string, goalId: string): Promise<void>
  getGoals(userId: string, filters?: { isActive?: boolean }): Promise<SavingsGoal[]>
  getGoal(userId: string, goalId: string): Promise<SavingsGoal>
  addContribution(userId: string, goalId: string, request: { amount: number; source: string; description?: string }): Promise<SavingsContribution>
}

// Domain errors
export class BudgetNotFoundError extends DomainError {
  constructor(budgetId: string) {
    super(`Budget with id ${budgetId} not found`, 'BUDGET_NOT_FOUND', { budgetId })
  }
}

export class TransactionNotFoundError extends DomainError {
  constructor(transactionId: string) {
    super(`Transaction with id ${transactionId} not found`, 'TRANSACTION_NOT_FOUND', { transactionId })
  }
}

export class BudgetOverspendError extends DomainError {
  constructor(budgetId: string, overspendAmount: number) {
    super(`Budget overspend by ${overspendAmount}`, 'BUDGET_OVERSPEND', { budgetId, overspendAmount })
  }
}

export class SavingsGoalNotFoundError extends DomainError {
  constructor(goalId: string) {
    super(`Savings goal with id ${goalId} not found`, 'SAVINGS_GOAL_NOT_FOUND', { goalId })
  }
}
