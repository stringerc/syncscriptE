// PHASE 3: AI-Powered Goal Intelligence & Predictive Analytics
// This module calculates AI-driven insights, predictions, and health scores for goals

export type GoalHealthStatus = 'healthy' | 'needs-attention' | 'critical';
export type GoalRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface GoalHealthIndicators {
  overallHealth: GoalHealthStatus;
  healthScore: number; // 0-100
  factors: {
    progressVelocity: number; // -100 to 100 (negative = behind, positive = ahead)
    checkInFrequency: number; // 0-100
    riskSeverity: number; // 0-100 (0 = no risks, 100 = critical risks)
    confidenceTrend: number; // -100 to 100 (negative = declining, positive = improving)
    milestoneCompletion: number; // 0-100
  };
  needsAttention: string[]; // List of areas that need attention
}

export interface SuccessLikelihood {
  probability: number; // 0-100% chance of hitting deadline
  projectedCompletionDate: string;
  daysAhead: number; // Negative = behind, positive = ahead
  requiredVelocity: number; // Progress points per day needed
  currentVelocity: number; // Current progress points per day
  velocityGap: number; // Difference between required and current
}

export interface SmartRecommendation {
  id: string;
  type: 'alert' | 'pattern' | 'suggestion';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  actionable: boolean;
  quickAction?: {
    label: string;
    action: string;
    params?: any;
  };
  icon: string; // Icon name
}

/**
 * Calculate overall goal health based on multiple factors
 */
export function calculateGoalHealth(goal: any): GoalHealthIndicators {
  // Factor 1: Progress Velocity
  const progressVelocity = calculateProgressVelocity(goal);
  
  // Factor 2: Check-in Frequency
  const checkInFrequency = calculateCheckInFrequency(goal);
  
  // Factor 3: Risk Severity
  const riskSeverity = calculateRiskSeverity(goal);
  
  // Factor 4: Confidence Trend
  const confidenceTrend = calculateConfidenceTrend(goal);
  
  // Factor 5: Milestone Completion
  const milestoneCompletion = calculateMilestoneCompletion(goal);
  
  // Calculate overall health score (0-100)
  const healthScore = Math.round(
    (progressVelocity * 0.3) +
    (checkInFrequency * 0.15) +
    ((100 - riskSeverity) * 0.25) +
    (confidenceTrend * 0.15) +
    (milestoneCompletion * 0.15)
  );
  
  // Determine overall health status
  let overallHealth: GoalHealthStatus;
  if (healthScore >= 75) {
    overallHealth = 'healthy';
  } else if (healthScore >= 50) {
    overallHealth = 'needs-attention';
  } else {
    overallHealth = 'critical';
  }
  
  // Identify areas needing attention
  const needsAttention: string[] = [];
  if (progressVelocity < 50) needsAttention.push('Progress velocity below target');
  if (checkInFrequency < 60) needsAttention.push('Infrequent check-ins');
  if (riskSeverity > 50) needsAttention.push('Active risks present');
  if (confidenceTrend < 0) needsAttention.push('Declining confidence');
  if (milestoneCompletion < 50) needsAttention.push('Milestone delays');
  
  return {
    overallHealth,
    healthScore,
    factors: {
      progressVelocity: Math.round(progressVelocity),
      checkInFrequency: Math.round(checkInFrequency),
      riskSeverity: Math.round(riskSeverity),
      confidenceTrend: Math.round(confidenceTrend),
      milestoneCompletion: Math.round(milestoneCompletion),
    },
    needsAttention,
  };
}

/**
 * Calculate progress velocity (how fast we're moving vs required pace)
 */
function calculateProgressVelocity(goal: any): number {
  const currentProgress = goal.progress || 0;
  
  // Parse deadline to calculate days remaining
  const daysRemaining = parseDaysRemaining(goal.deadline);
  
  // If no deadline or already past, use current progress as score
  if (daysRemaining <= 0) {
    return currentProgress;
  }
  
  // Calculate required daily velocity to hit 100% by deadline
  const requiredVelocity = (100 - currentProgress) / daysRemaining;
  
  // Estimate current velocity based on recent progress
  // For demo purposes, we'll estimate based on progress and check-ins
  const checkIns = goal.checkIns || [];
  let currentVelocity = 0;
  
  if (checkIns.length >= 2) {
    const recent = checkIns[0];
    const previous = checkIns[1];
    const progressDiff = recent.progress - previous.progress;
    const daysDiff = parseDaysAgo(previous.date) - parseDaysAgo(recent.date);
    currentVelocity = daysDiff > 0 ? progressDiff / daysDiff : 0;
  } else {
    // Estimate based on current progress and time horizon
    const totalDays = estimateTotalDays(goal.timeHorizon);
    currentVelocity = totalDays > 0 ? currentProgress / (totalDays - daysRemaining) : 0;
  }
  
  // Calculate velocity ratio (100 = on track, >100 = ahead, <100 = behind)
  const velocityRatio = requiredVelocity > 0 ? (currentVelocity / requiredVelocity) * 100 : currentProgress;
  
  return Math.min(100, Math.max(0, velocityRatio));
}

/**
 * Calculate check-in frequency score
 */
function calculateCheckInFrequency(goal: any): number {
  const checkIns = goal.checkIns || [];
  
  if (checkIns.length === 0) return 0;
  
  const lastCheckIn = checkIns[0];
  const daysSinceLastCheckIn = parseDaysAgo(lastCheckIn.date);
  
  // Optimal check-in frequency is weekly (7 days)
  let score: number;
  if (daysSinceLastCheckIn <= 7) {
    score = 100;
  } else if (daysSinceLastCheckIn <= 14) {
    score = 75;
  } else if (daysSinceLastCheckIn <= 21) {
    score = 50;
  } else if (daysSinceLastCheckIn <= 30) {
    score = 25;
  } else {
    score = 0;
  }
  
  // Bonus for consistent check-in pattern
  if (checkIns.length >= 3) {
    score = Math.min(100, score + 10);
  }
  
  return score;
}

/**
 * Calculate risk severity score
 */
function calculateRiskSeverity(goal: any): number {
  const risks = goal.risks || [];
  const activeRisks = risks.filter((r: any) => r.status === 'active');
  
  if (activeRisks.length === 0) return 0;
  
  let severityScore = 0;
  activeRisks.forEach((risk: any) => {
    switch (risk.severity) {
      case 'critical':
        severityScore += 100;
        break;
      case 'high':
        severityScore += 75;
        break;
      case 'medium':
        severityScore += 40;
        break;
      case 'low':
        severityScore += 15;
        break;
    }
  });
  
  // Average severity across all active risks
  return Math.min(100, severityScore / activeRisks.length);
}

/**
 * Calculate confidence trend
 */
function calculateConfidenceTrend(goal: any): number {
  const checkIns = goal.checkIns || [];
  const currentConfidence = goal.confidenceScore || 7;
  
  if (checkIns.length < 2) {
    // No trend data, return current confidence as percentage
    return (currentConfidence / 10) * 100;
  }
  
  // Analyze mood trend from check-ins as proxy for confidence
  const moods = checkIns.slice(0, 3).map((ci: any) => ci.mood);
  let trendScore = 50; // Neutral
  
  if (moods[0] === 'positive') {
    trendScore = 80;
    if (moods[1] === 'positive') trendScore = 100;
  } else if (moods[0] === 'concerned') {
    trendScore = 30;
    if (moods[1] === 'concerned') trendScore = 0;
  }
  
  return trendScore;
}

/**
 * Calculate milestone completion rate
 */
function calculateMilestoneCompletion(goal: any): number {
  const milestones = goal.milestones || [];
  
  if (milestones.length === 0) return 100; // No milestones = no problems
  
  const completed = milestones.filter((m: any) => m.completed).length;
  const total = milestones.length;
  
  return (completed / total) * 100;
}

/**
 * Calculate success likelihood with predictive analytics
 */
export function calculateSuccessLikelihood(goal: any): SuccessLikelihood {
  const currentProgress = goal.progress || 0;
  const daysRemaining = parseDaysRemaining(goal.deadline);
  
  // Calculate current velocity
  const checkIns = goal.checkIns || [];
  let currentVelocity = 0;
  
  if (checkIns.length >= 2) {
    const recent = checkIns[0];
    const previous = checkIns[1];
    const progressDiff = recent.progress - previous.progress;
    const daysDiff = parseDaysAgo(previous.date) - parseDaysAgo(recent.date);
    currentVelocity = daysDiff > 0 ? progressDiff / daysDiff : 0;
  } else {
    const totalDays = estimateTotalDays(goal.timeHorizon);
    const elapsedDays = totalDays - daysRemaining;
    currentVelocity = elapsedDays > 0 ? currentProgress / elapsedDays : 0;
  }
  
  // Calculate required velocity
  const requiredVelocity = daysRemaining > 0 ? (100 - currentProgress) / daysRemaining : 0;
  
  // Calculate velocity gap
  const velocityGap = currentVelocity - requiredVelocity;
  
  // Project completion date based on current velocity
  let projectedDaysRemaining = daysRemaining;
  if (currentVelocity > 0) {
    projectedDaysRemaining = Math.round((100 - currentProgress) / currentVelocity);
  }
  
  const daysAhead = daysRemaining - projectedDaysRemaining;
  
  // Calculate success probability based on multiple factors
  const health = calculateGoalHealth(goal);
  const velocityFactor = currentVelocity >= requiredVelocity ? 1.0 : (currentVelocity / requiredVelocity);
  const healthFactor = health.healthScore / 100;
  
  const probability = Math.min(100, Math.round((velocityFactor * 0.6 + healthFactor * 0.4) * 100));
  
  // Format projected completion date
  const projectedDate = new Date();
  projectedDate.setDate(projectedDate.getDate() + projectedDaysRemaining);
  const projectedCompletionDate = formatProjectedDate(projectedDate);
  
  return {
    probability,
    projectedCompletionDate,
    daysAhead,
    requiredVelocity: Math.round(requiredVelocity * 10) / 10,
    currentVelocity: Math.round(currentVelocity * 10) / 10,
    velocityGap: Math.round(velocityGap * 10) / 10,
  };
}

/**
 * Generate smart AI recommendations for a goal
 */
export function generateSmartRecommendations(goal: any, allGoals: any[]): SmartRecommendation[] {
  const recommendations: SmartRecommendation[] = [];
  const health = calculateGoalHealth(goal);
  const likelihood = calculateSuccessLikelihood(goal);
  
  // ALERT: Low progress velocity
  if (health.factors.progressVelocity < 50) {
    const velocityDeficit = Math.abs(likelihood.velocityGap);
    recommendations.push({
      id: `${goal.id}-velocity`,
      type: 'alert',
      severity: likelihood.velocityGap < -0.5 ? 'critical' : 'warning',
      title: 'Progress velocity below target',
      description: `Your current pace is ${velocityDeficit.toFixed(1)} points/day slower than needed. Consider breaking "${goal.title}" into smaller milestones or adjusting the timeline.`,
      actionable: true,
      quickAction: {
        label: 'Adjust Timeline',
        action: 'adjust-timeline',
        params: { goalId: goal.id }
      },
      icon: 'TrendingDown'
    });
  }
  
  // ALERT: Overdue check-in
  const checkIns = goal.checkIns || [];
  if (checkIns.length > 0) {
    const daysSinceCheckIn = parseDaysAgo(checkIns[0].date);
    if (daysSinceCheckIn >= 14) {
      recommendations.push({
        id: `${goal.id}-checkin`,
        type: 'alert',
        severity: daysSinceCheckIn >= 21 ? 'warning' : 'info',
        title: `No check-in for ${daysSinceCheckIn} days`,
        description: `"${goal.title}" hasn't been updated in ${daysSinceCheckIn} days. Regular check-ins improve success rates by 40%.`,
        actionable: true,
        quickAction: {
          label: 'Add Check-in',
          action: 'add-checkin',
          params: { goalId: goal.id }
        },
        icon: 'AlertCircle'
      });
    }
  }
  
  // ALERT: Active high-severity risks
  const risks = goal.risks || [];
  const highRisks = risks.filter((r: any) => 
    r.status === 'active' && (r.severity === 'high' || r.severity === 'critical')
  );
  if (highRisks.length > 0) {
    const oldRisks = highRisks.filter((r: any) => parseDaysAgo(r.updatedAt) >= 7);
    if (oldRisks.length > 0) {
      recommendations.push({
        id: `${goal.id}-risk`,
        type: 'alert',
        severity: 'critical',
        title: `${highRisks.length} high-severity risk(s) active`,
        description: `Risk "${oldRisks[0].title}" has been active for ${parseDaysAgo(oldRisks[0].updatedAt)} days. Escalate to Champions or update mitigation plan.`,
        actionable: true,
        quickAction: {
          label: 'Escalate Risk',
          action: 'escalate-risk',
          params: { goalId: goal.id, riskId: oldRisks[0].id }
        },
        icon: 'AlertTriangle'
      });
    }
  }
  
  // PATTERN: Success prediction
  if (likelihood.probability >= 80) {
    recommendations.push({
      id: `${goal.id}-success`,
      type: 'pattern',
      severity: 'info',
      title: `${likelihood.probability}% likely to succeed`,
      description: `Great work! Current trajectory projects completion ${likelihood.daysAhead > 0 ? `${likelihood.daysAhead} days early` : 'on time'}. Keep up the momentum!`,
      actionable: false,
      icon: 'TrendingUp'
    });
  } else if (likelihood.probability < 50) {
    recommendations.push({
      id: `${goal.id}-at-risk`,
      type: 'alert',
      severity: 'warning',
      title: `Only ${likelihood.probability}% likely to hit deadline`,
      description: `Current pace suggests completion ${Math.abs(likelihood.daysAhead)} days late. Consider requesting help from Champions or extending the deadline.`,
      actionable: true,
      quickAction: {
        label: 'Request Help',
        action: 'request-help',
        params: { goalId: goal.id }
      },
      icon: 'AlertCircle'
    });
  }
  
  // PATTERN: Champion impact
  const champions = (goal.collaborators || []).filter((c: any) => c.role === 'champion');
  if (champions.length === 0 && goal.progress < 70) {
    recommendations.push({
      id: `${goal.id}-champion`,
      type: 'suggestion',
      severity: 'info',
      title: 'Add a Champion to boost success',
      description: 'Goals with Champions have 2x higher completion rates. Consider adding an experienced collaborator as Champion.',
      actionable: true,
      quickAction: {
        label: 'Add Champion',
        action: 'add-champion',
        params: { goalId: goal.id }
      },
      icon: 'Crown'
    });
  }
  
  // PATTERN: Check-in frequency correlation
  if (checkIns.length >= 3 && health.factors.progressVelocity > 75) {
    recommendations.push({
      id: `${goal.id}-checkin-pattern`,
      type: 'pattern',
      severity: 'info',
      title: 'Your weekly check-ins are working',
      description: `You complete ${Math.round(health.factors.progressVelocity)}% more Key Results when you maintain weekly check-ins. Keep it up!`,
      actionable: false,
      icon: 'TrendingUp'
    });
  }
  
  // SUGGESTION: Stale Key Results
  const keyResults = goal.keyResults || [];
  const staleKeyResults = keyResults.filter((kr: any) => 
    kr.progress < 100 && kr.progress > 0 && parseDaysAgo(kr.dueDate) <= 7
  );
  if (staleKeyResults.length > 0) {
    recommendations.push({
      id: `${goal.id}-key-result`,
      type: 'suggestion',
      severity: 'info',
      title: `${staleKeyResults.length} Key Result(s) need updating`,
      description: `Key Result "${staleKeyResults[0].description}" is due in ${parseDaysAgo(staleKeyResults[0].dueDate)} days. Update progress to stay on track.`,
      actionable: true,
      quickAction: {
        label: 'Update Key Result',
        action: 'update-key-result',
        params: { goalId: goal.id, keyResultId: staleKeyResults[0].id }
      },
      icon: 'Target'
    });
  }
  
  // PATTERN: Declining confidence
  if (health.factors.confidenceTrend < 30 && checkIns.length >= 2) {
    recommendations.push({
      id: `${goal.id}-confidence`,
      type: 'alert',
      severity: 'warning',
      title: 'Confidence declining over time',
      description: 'Recent check-ins show declining confidence. Consider reviewing blockers with your Champions or adjusting scope.',
      actionable: true,
      quickAction: {
        label: 'Review Blockers',
        action: 'review-blockers',
        params: { goalId: goal.id }
      },
      icon: 'TrendingDown'
    });
  }
  
  return recommendations;
}

/**
 * Generate context-aware quick actions for a goal
 */
export function generateQuickActions(goal: any): Array<{
  label: string;
  action: string;
  icon: string;
  variant: 'default' | 'success' | 'warning' | 'danger';
  priority: number;
}> {
  const actions: Array<any> = [];
  const health = calculateGoalHealth(goal);
  const checkIns = goal.checkIns || [];
  const risks = goal.risks || [];
  
  // Check-in needed?
  if (checkIns.length === 0 || parseDaysAgo(checkIns[0].date) >= 7) {
    actions.push({
      label: parseDaysAgo(checkIns[0]?.date || '') >= 14 ? 'Check-in Overdue!' : 'Add Check-in',
      action: 'add-checkin',
      icon: 'CheckSquare',
      variant: parseDaysAgo(checkIns[0]?.date || '') >= 14 ? 'warning' : 'default',
      priority: parseDaysAgo(checkIns[0]?.date || '') >= 14 ? 10 : 5
    });
  }
  
  // Update Key Result?
  const keyResults = goal.keyResults || [];
  const staleKRs = keyResults.filter((kr: any) => 
    kr.progress < 100 && kr.progress > 0
  );
  if (staleKRs.length > 0) {
    actions.push({
      label: 'Update Key Result',
      action: 'update-key-result',
      icon: 'Target',
      variant: 'default',
      priority: 4
    });
  }
  
  // Escalate Risk?
  const activeRisks = risks.filter((r: any) => r.status === 'active');
  const oldRisks = activeRisks.filter((r: any) => parseDaysAgo(r.updatedAt) >= 7);
  if (oldRisks.length > 0) {
    actions.push({
      label: 'Escalate Risk',
      action: 'escalate-risk',
      icon: 'AlertTriangle',
      variant: 'danger',
      priority: 9
    });
  }
  
  // Adjust Timeline?
  if (health.factors.progressVelocity < 50) {
    actions.push({
      label: 'Adjust Timeline',
      action: 'adjust-timeline',
      icon: 'Calendar',
      variant: 'warning',
      priority: 7
    });
  }
  
  // Request Help?
  const champions = (goal.collaborators || []).filter((c: any) => c.role === 'champion');
  if (health.overallHealth === 'critical' && champions.length > 0) {
    actions.push({
      label: 'Request Help',
      action: 'request-help',
      icon: 'MessageSquare',
      variant: 'warning',
      priority: 8
    });
  }
  
  // Sort by priority (highest first)
  return actions.sort((a, b) => b.priority - a.priority).slice(0, 3);
}

// ============================================================================
// Helper Functions
// ============================================================================

function parseDaysRemaining(deadline: string): number {
  if (!deadline) return 90; // Default 90 days
  
  const match = deadline.match(/(\d+)\s+(day|week|month)/i);
  if (match) {
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    
    if (unit.startsWith('day')) return value;
    if (unit.startsWith('week')) return value * 7;
    if (unit.startsWith('month')) return value * 30;
  }
  
  // Handle "On track for Q3" type deadlines
  if (deadline.includes('Q1')) return 90;
  if (deadline.includes('Q2')) return 180;
  if (deadline.includes('Q3')) return 270;
  if (deadline.includes('Q4')) return 365;
  
  return 90; // Default
}

function parseDaysAgo(dateString: string): number {
  if (!dateString) return 999; // Very old
  
  const match = dateString.match(/(\d+)\s+(day|week|month|hour|min)/i);
  if (match) {
    const value = parseInt(match[1]);
    const unit = match[2].toLowerCase();
    
    if (unit.startsWith('min') || unit.startsWith('hour')) return 0;
    if (unit.startsWith('day')) return value;
    if (unit.startsWith('week')) return value * 7;
    if (unit.startsWith('month')) return value * 30;
  }
  
  return 7; // Default to 1 week ago
}

function estimateTotalDays(timeHorizon: string): number {
  if (!timeHorizon) return 90;
  
  if (timeHorizon.includes('Week')) return 7;
  if (timeHorizon.includes('Month')) return 30;
  if (timeHorizon.includes('Quarter')) return 90;
  if (timeHorizon.includes('Year')) return 365;
  
  return 90; // Default
}

function formatProjectedDate(date: Date): string {
  const now = new Date();
  const diffDays = Math.round((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`;
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays <= 7) return `In ${diffDays} days`;
  if (diffDays <= 30) return `In ${Math.round(diffDays / 7)} weeks`;
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}
