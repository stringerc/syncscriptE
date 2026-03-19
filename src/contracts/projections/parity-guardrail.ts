import type { TaskCalendarParityReport } from './task-calendar-parity';

export type ParityRiskLevel = 'healthy' | 'watch' | 'critical';

export interface ParityGuardrailResult {
  level: ParityRiskLevel;
  summary: string;
}

export function evaluateTaskCalendarParity(report: TaskCalendarParityReport): ParityGuardrailResult {
  if (report.orphanedEvents.length > 0) {
    return {
      level: 'critical',
      summary: `${report.orphanedEvents.length} orphaned event(s) require cleanup.`,
    };
  }
  if (report.scheduledTasks === 0) {
    return { level: 'healthy', summary: 'No scheduled tasks detected.' };
  }
  if (report.missingLinks.length > 0 || report.parityScore < 0.9) {
    return {
      level: 'watch',
      summary: `${report.missingLinks.length} scheduled task(s) are missing calendar links.`,
    };
  }
  return { level: 'healthy', summary: 'Task and calendar projections are aligned.' };
}
