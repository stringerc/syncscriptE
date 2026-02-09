/**
 * Rich Text Content
 * Structured rich text for comments
 */
export interface RichTextContent {
  type: 'paragraph' | 'heading' | 'list' | 'code' | 'quote';
  content?: string;
  children?: RichTextContent[];
  
  // Formatting
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  
  // Links and mentions
  link?: string;
  mention?: {
    userId: string;
    userName: string;
  };
}

// ==================== PHASE 5: TASK AUTOMATION & SMART FEATURES ====================

/**
 * Recurrence Pattern
 * How often a task repeats
 */
export type RecurrencePattern = 
  | 'daily'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'yearly'
  | 'custom';

/**
 * Recurrence End Condition
 * When recurring task stops
 */
export interface RecurrenceEnd {
  type: 'never' | 'after_occurrences' | 'on_date';
  occurrences?: number;        // For 'after_occurrences'
  endDate?: string;            // For 'on_date' - ISO date
}

/**
 * Recurring Task Configuration
 * Settings for repeating tasks
 */
export interface RecurringTaskConfig {
  id: string;
  taskTemplateId: string;      // Template to create from
  enabled: boolean;
  
  // Recurrence pattern
  pattern: RecurrencePattern;
  interval: number;            // Every N days/weeks/months
  daysOfWeek?: number[];       // 0-6 for Sunday-Saturday (weekly)
  dayOfMonth?: number;         // 1-31 (monthly)
  monthOfYear?: number;        // 1-12 (yearly)
  
  // Timing
  startDate: string;           // ISO date
  endCondition: RecurrenceEnd;
  
  // Auto-creation settings
  createInAdvanceDays: number; // Create N days before due
  autoAssign: boolean;
  autoAssignees?: string[];    // User IDs
  
  // Metadata
  createdBy: string;
  createdAt: string;
  lastOccurrenceDate?: string; // Last created instance
  nextOccurrenceDate?: string; // Next scheduled instance
  totalOccurrences: number;    // Count of instances created
}

/**
 * Automation Rule Trigger
 * What triggers an automation
 */
export type AutomationTrigger =
  | 'task_created'
  | 'task_updated'
  | 'task_completed'
  | 'task_assigned'
  | 'due_date_approaching'
  | 'task_overdue'
  | 'comment_added'
  | 'milestone_completed'
  | 'dependency_completed'
  | 'tag_added'
  | 'priority_changed';

/**
 * Automation Rule Condition
 * Conditions that must be met
 */
export interface AutomationCondition {
  field: 'priority' | 'assignee' | 'tags' | 'dueDate' | 'title' | 'description';
  operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan';
  value: any;
}

/**
 * Automation Rule Action
 * What happens when rule triggers
 */
export interface AutomationAction {
  type: 
    | 'assign_user'
    | 'set_priority'
    | 'add_tag'
    | 'set_due_date'
    | 'add_watcher'
    | 'send_notification'
    | 'create_subtask'
    | 'move_to_milestone'
    | 'add_comment'
    | 'duplicate_task';
  
  params: Record<string, any>; // Action-specific parameters
}

/**
 * Automation Rule
 * Complete automation workflow
 */
export interface AutomationRule {
  id: string;
  name: string;
  description?: string;
  enabled: boolean;
  
  // Rule definition
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  
  // Scope
  teamId?: string;             // Apply to specific team
  applyToNewTasks: boolean;
  applyToExistingTasks: boolean;
  
  // Metadata
  createdBy: string;
  createdAt: string;
  updatedAt?: string;
  lastTriggeredAt?: string;
  triggerCount: number;        // How many times executed
}

/**
 * Smart Suggestion Type
 */
export type SuggestionType =
  | 'auto_assign'
  | 'due_date'
  | 'priority'
  | 'tags'
  | 'dependencies'
  | 'milestones'
  | 'similar_tasks'
  | 'resource_optimization'
  | 'workload_balance';

/**
 * Smart Task Suggestion
 * AI-generated recommendations
 */
export interface SmartSuggestion {
  id: string;
  type: SuggestionType;
  taskId?: string;             // Task this applies to (or null for general)
  
  // Suggestion content
  title: string;
  description: string;
  confidence: number;          // 0-100 confidence score
  reasoning: string;           // Why this suggestion
  
  // Suggested changes
  suggestedAction: AutomationAction;
  
  // Metadata
  createdAt: string;
  applied: boolean;
  appliedAt?: string;
  dismissed: boolean;
  dismissedAt?: string;
}

/**
 * Task Prediction
 * ML-based predictions
 */
export interface TaskPrediction {
  taskId: string;
  
  // Completion predictions
  predictedCompletionDate: string;    // ISO date
  completionProbability: number;      // 0-100
  riskLevel: 'low' | 'medium' | 'high';
  
  // Time predictions
  estimatedHours: number;
  confidenceInterval: {
    min: number;
    max: number;
  };
  
  // Based on historical data
  similarTasksCompleted: number;
  averageCompletionTime: number;      // Days
  
  // Risk factors
  riskFactors: Array<{
    factor: string;
    impact: 'low' | 'medium' | 'high';
    description: string;
  }>;
  
  generatedAt: string;
}

/**
 * Workload Analysis
 * Team member workload insights
 */
export interface WorkloadAnalysis {
  userId: string;
  userName: string;
  
  // Current workload
  activeTasks: number;
  totalEstimatedHours: number;
  utilizationPercentage: number;      // 0-100+
  
  // Capacity
  availableHours: number;
  overloaded: boolean;
  
  // Upcoming
  dueSoon: number;                    // Tasks due in next 7 days
  overdue: number;
  
  // Recommendations
  canTakeMore: boolean;
  suggestedCapacity: number;          // How many more tasks
  
  generatedAt: string;
}

/**
 * Auto-Assignment Strategy
 * How to auto-assign tasks
 */
export type AssignmentStrategy =
  | 'round_robin'              // Rotate through team members
  | 'least_busy'               // Assign to member with fewest tasks
  | 'skill_match'              // Match based on tags/keywords
  | 'workload_balance'         // Balance estimated hours
  | 'previous_similar';        // Assign to who did similar tasks

/**
 * Auto-Assignment Configuration
 */
export interface AutoAssignmentConfig {
  id: string;
  enabled: boolean;
  teamId: string;
  
  // Strategy
  strategy: AssignmentStrategy;
  fallbackStrategy?: AssignmentStrategy;
  
  // Filters
  applyToTags?: string[];
  applyToPriorities?: Priority[];
  excludeMembers?: string[];
  
  // Skill matching (for skill_match strategy)
  skillKeywords?: Record<string, string[]>; // userId -> keywords
  
  // Limits
  maxTasksPerMember?: number;
  maxHoursPerMember?: number;
  
  // Metadata
  createdBy: string;
  createdAt: string;
  assignmentCount: number;
}

/**
 * Task Template (Enhanced)
 * Reusable task structure for automation
 */
export interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  
  // Template content
  titleTemplate: string;         // Can include {{variables}}
  descriptionTemplate: string;
  priority: Priority;
  estimatedHours?: number;
  tags?: string[];
  
  // Structure
  milestones: Array<{
    title: string;
    steps: Array<{ title: string }>;
  }>;
  
  // Automation
  autoAssign?: boolean;
  defaultAssignees?: string[];
  dueDateOffset?: number;        // Days from creation
  
  // Usage stats
  usageCount: number;
  createdBy: string;
  createdAt: string;
  isPublic: boolean;
}

/**
 * Workflow Template
 * Pre-configured automation workflow
 */
export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'development' | 'marketing' | 'sales' | 'hr' | 'finance' | 'general';
  icon: string;
  
  // Workflow steps
  rules: Omit<AutomationRule, 'id' | 'createdBy' | 'createdAt'>[];
  
  // Suggested settings
  recommendedFor: string[];      // Team types
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  
  // Metadata
  usageCount: number;
  rating?: number;
  isOfficial: boolean;           // From SyncScript team
}

/**
 * Smart Notification
 * Context-aware notification
 */
export interface SmartNotification {
  id: string;
  userId: string;
  
  // Notification content
  type: 'suggestion' | 'alert' | 'reminder' | 'insight';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  title: string;
  message: string;
  actionLabel?: string;
  actionUrl?: string;
  
  // Context
  taskId?: string;
  relatedItems?: Array<{
    type: 'task' | 'comment' | 'activity';
    id: string;
  }>;
  
  // Smart timing
  deliveryTime?: string;         // ISO datetime - when to show
  expiresAt?: string;            // Auto-dismiss after
  
  // State
  read: boolean;
  readAt?: string;
  dismissed: boolean;
  dismissedAt?: string;
  actionTaken: boolean;
  
  createdAt: string;
}

/**
 * Automation Execution Log
 * Track automation runs
 */
export interface AutomationLog {
  id: string;
  ruleId: string;
  ruleName: string;
  
  // Execution
  triggeredAt: string;
  triggeredBy?: string;          // User who triggered (or 'system')
  taskId?: string;
  
  // Result
  status: 'success' | 'failed' | 'partial';
  actionsExecuted: number;
  actionsFailed: number;
  
  // Details
  conditions: Array<{
    field: string;
    passed: boolean;
  }>;
  
  actions: Array<{
    type: string;
    status: 'success' | 'failed';
    error?: string;
  }>;
  
  errorMessage?: string;
}