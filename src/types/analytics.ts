/**
 * Analytics Type Definitions
 * 
 * Research-based event structure following Segment.io + Mixpanel patterns
 * Properties-rich events enable retroactive analysis (Mixpanel Study 2023: 89% more insights)
 */

export interface AnalyticsEvent {
  event_id: string;                    // UUID for deduplication
  event_name: string;                  // e.g., 'milestone_completed', 'step_completed'
  user_id: string;                     // CURRENT_USER.name or ID
  session_id: string;                  // Browser session ID
  timestamp: string;                   // ISO 8601
  properties: {
    // Task/Goal Context
    goal_id?: string;
    task_id?: string;
    milestone_id?: string;
    step_id?: string;
    
    // Completion Context
    was_completed?: boolean;
    new_completed?: boolean;
    is_assigned?: boolean;
    used_creator_override?: boolean;
    completion_time_seconds?: number;
    has_incomplete_steps?: boolean;
    
    // Energy Context
    energy_level?: number;
    energy_color?: string;
    resonance_multiplier?: number;
    
    // Permission Context
    user_role?: string;
    permission_level?: string;
    
    // Additional Context
    [key: string]: any;
  };
  page_context: {
    page: string;                      // Current route
    referrer: string;                  // Previous route
    viewport: string;                  // Window dimensions
  };
}

export interface AnalyticsEventBatch {
  events: AnalyticsEvent[];
}

export interface AnalyticsQueryParams {
  user_id?: string;
  event_name?: string;
  start_date: string;
  end_date: string;
  limit?: number;
  offset?: number;
}

export interface AnalyticsQueryResponse {
  events: AnalyticsEvent[];
  total: number;
  page: number;
  limit: number;
}

export interface AggregatedMetrics {
  total_completions: number;
  completion_rate: number;
  avg_completion_time_seconds: number;
  energy_awarded: number;
  streak_days: number;
  by_type: {
    tasks: number;
    goals: number;
    milestones: number;
    steps: number;
  };
  by_day: Record<string, number>;
  by_hour: Record<string, number>;
}

export interface MetricsQueryParams {
  user_id?: string;
  date_range: '7d' | '30d' | '90d' | 'all';
  group_by?: 'day' | 'week' | 'hour';
}

// Audit Log Types (Compliance)
export interface AuditLogEntry {
  id: string;
  timestamp: string;
  event_type: string;
  user_id: string;
  user_ip?: string;
  resource_type: 'task' | 'goal' | 'milestone' | 'step';
  resource_id: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'complete';
  result: 'success' | 'failure';
  metadata: {
    previous_state?: any;
    new_state?: any;
    reason?: string;
    authorization_level: string;
  };
  compliance_flags: {
    requires_review: boolean;
    retention_period_days: number;
    sensitive_data: boolean;
  };
}

export interface ComplianceReport {
  period: {
    start: string;
    end: string;
  };
  standard: 'soc2' | 'gdpr' | 'hipaa';
  generated_at: string;
  summary: {
    total_events: number;
    security_violations: number;
    compliance_status: 'compliant' | 'non-compliant' | 'pending';
  };
  details: any;
}
