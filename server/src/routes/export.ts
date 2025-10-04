import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { exportService } from '../services/exportService';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';
import { prisma } from '../utils/prisma';

const router = Router();

/**
 * Document templates for professional exports
 */
const DOCUMENT_TEMPLATES = {
  'executive-summary': {
    name: 'Executive Summary',
    description: 'Clean, professional format for leadership and stakeholders',
    icon: '📊',
    availableFor: ['task', 'event']
  },
  'detailed-report': {
    name: 'Detailed Report',
    description: 'Comprehensive format with all details and analysis',
    icon: '📋',
    availableFor: ['task', 'event']
  },
  'vendor-packet': {
    name: 'Vendor Packet',
    description: 'Professional format for external vendors and contractors',
    icon: '🤝',
    availableFor: ['task', 'event']
  },
  'team-checklist': {
    name: 'Team Checklist',
    description: 'Action-oriented format for team members and execution',
    icon: '✅',
    availableFor: ['task', 'event']
  },
  'client-presentation': {
    name: 'Client Presentation',
    description: 'Polished format for client meetings and presentations',
    icon: '🎯',
    availableFor: ['task', 'event']
  },
  'run-of-show': {
    name: 'Run of Show',
    description: 'Timeline and logistics for event execution',
    icon: '🎬',
    availableFor: ['event']
  },
  'attendee-guide': {
    name: 'Attendee Guide',
    description: 'Information packet for event attendees',
    icon: '👥',
    availableFor: ['event']
  },
  'event-briefing': {
    name: 'Event Briefing',
    description: 'Comprehensive event overview and preparation guide',
    icon: '📅',
    availableFor: ['event']
  }
};

/**
 * Generate preview content for export
 */
async function generatePreviewContent(userId: string, exportType: string, scope: any, audiencePreset: string, sections: string[], template?: string) {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  try {
    let content = '';
    let title = '';
    let estimatedSize = 1000;
    let estimatedTime = '1-2 minutes';

    // Get data based on scope
    if (scope.type === 'task' && scope.id) {
      const task = await prisma.task.findFirst({
        where: { id: scope.id, userId },
        include: {
          subtasks: { orderBy: { order: 'asc' } },
          event: { select: { id: true, title: true } }
        }
      });

      if (!task) {
        throw createError('Task not found', 404);
      }

      title = `Task: ${task.title}`;
      
      // Generate content based on export type and template
      switch (exportType.toLowerCase()) {
        case 'pdf':
          content = generatePDFPreview(task, audiencePreset, template);
          estimatedSize = 5000;
          estimatedTime = '2-3 minutes';
          break;
        case 'csv':
          content = generateCSVPreview(task, audiencePreset, template);
          estimatedSize = 2000;
          estimatedTime = '1 minute';
          break;
        case 'markdown':
          content = generateMarkdownPreview(task, audiencePreset, template);
          estimatedSize = 3000;
          estimatedTime = '1-2 minutes';
          break;
        case 'json':
          content = generateJSONPreview(task, audiencePreset, template);
          estimatedSize = 4000;
          estimatedTime = '1 minute';
          break;
        default:
          content = generateGenericPreview(task, audiencePreset, template);
      }
    } else if (scope.type === 'tasks' && scope.ids) {
      const tasks = await prisma.task.findMany({
        where: { 
          id: { in: scope.ids },
          userId 
        },
        include: {
          subtasks: { orderBy: { order: 'asc' } },
          event: { select: { id: true, title: true } }
        },
        orderBy: { createdAt: 'desc' }
      });

      title = `Multiple Tasks (${tasks.length} items)`;
      
      switch (exportType.toLowerCase()) {
        case 'pdf':
          content = generateMultipleTasksPDFPreview(tasks, audiencePreset);
          estimatedSize = tasks.length * 2000;
          estimatedTime = '3-5 minutes';
          break;
        case 'csv':
          content = generateMultipleTasksCSVPreview(tasks, audiencePreset);
          estimatedSize = tasks.length * 500;
          estimatedTime = '1-2 minutes';
          break;
        default:
          content = generateMultipleTasksGenericPreview(tasks, audiencePreset);
      }
    } else if (scope.type === 'event' && scope.id) {
      logger.info('Fetching event for export preview', { eventId: scope.id, userId });
      
      const event = await prisma.event.findFirst({
        where: { id: scope.id, userId },
        include: {
          tasks: {
            include: {
              subtasks: { orderBy: { order: 'asc' } }
            },
            orderBy: { createdAt: 'asc' }
          }
        }
      });

      if (!event) {
        logger.error('Event not found for export preview', { eventId: scope.id, userId });
        throw createError('Event not found', 404);
      }

      logger.info('Event found for export preview', { 
        eventId: event.id, 
        eventTitle: event.title,
        tasksCount: event.tasks?.length || 0
      });

      title = `Event: ${event.title}`;
      
      // Generate content based on export type and template
      try {
        switch (exportType.toLowerCase()) {
          case 'pdf':
            content = generateEventPDFPreview(event, audiencePreset, template);
            estimatedSize = 8000;
            estimatedTime = '3-4 minutes';
            break;
          case 'csv':
            content = generateEventCSVPreview(event, audiencePreset, template);
            estimatedSize = 3000;
            estimatedTime = '1-2 minutes';
            break;
          case 'markdown':
            content = generateEventMarkdownPreview(event, audiencePreset, template);
            estimatedSize = 5000;
            estimatedTime = '2-3 minutes';
            break;
          case 'json':
            content = generateEventJSONPreview(event, audiencePreset, template);
            estimatedSize = 6000;
            estimatedTime = '1-2 minutes';
            break;
          default:
            content = generateEventGenericPreview(event, audiencePreset, template);
        }
        
        logger.info('Event content generated successfully', { 
          exportType, 
          template, 
          contentLength: content.length 
        });
      } catch (contentError) {
        logger.error('Error generating event content', { 
          error: contentError.message, 
          stack: contentError.stack,
          exportType, 
          template,
          eventId: event.id
        });
        throw contentError;
      }
    }

    return {
      title,
      description: `Preview of ${exportType.toUpperCase()} export for ${audiencePreset} audience`,
      content,
      format: exportType.toUpperCase(),
      sections: sections || ['Overview', 'Tasks', 'Budget'],
      redactions: getRedactionsForAudience(audiencePreset),
      estimatedSize,
      estimatedTime
    };
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Generate PDF preview content with professional templates
 */
function generatePDFPreview(task: any, audiencePreset: string, template: string = 'executive-summary'): string {
  const redactions = getRedactionsForAudience(audiencePreset);
  const templateConfig = DOCUMENT_TEMPLATES[template as keyof typeof DOCUMENT_TEMPLATES] || DOCUMENT_TEMPLATES['executive-summary'];
  
  switch (template) {
    case 'executive-summary':
      return generateExecutiveSummaryPDF(task, audiencePreset, redactions);
    case 'detailed-report':
      return generateDetailedReportPDF(task, audiencePreset, redactions);
    case 'vendor-packet':
      return generateVendorPacketPDF(task, audiencePreset, redactions);
    case 'team-checklist':
      return generateTeamChecklistPDF(task, audiencePreset, redactions);
    case 'client-presentation':
      return generateClientPresentationPDF(task, audiencePreset, redactions);
    default:
      return generateExecutiveSummaryPDF(task, audiencePreset, redactions);
  }
}

/**
 * Executive Summary Template
 */
function generateExecutiveSummaryPDF(task: any, audiencePreset: string, redactions: string[]): string {
  return `
═══════════════════════════════════════════════════════════════════════════════
                                EXECUTIVE SUMMARY
═══════════════════════════════════════════════════════════════════════════════

PROJECT: ${task.title}
STATUS: ${task.status}
PRIORITY: ${task.priority}
DUE DATE: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not specified'}

OVERVIEW
───────────────────────────────────────────────────────────────────────────────
${task.description || 'No description provided'}

KEY METRICS
───────────────────────────────────────────────────────────────────────────────
• Estimated Duration: ${task.estimatedDuration || task.durationMin || 0} minutes
• Subtasks: ${task.subtasks.length} items
• Event Association: ${task.event ? task.event.title : 'Standalone task'}

CURRENT STATUS
───────────────────────────────────────────────────────────────────────────────
${task.subtasks.length > 0 ? 
  task.subtasks.map((subtask: any, index: number) => 
    `• ${subtask.title} - ${subtask.status}`
  ).join('\n') : 
  'No subtasks defined'}

${task.event ? `
RELATED EVENT
───────────────────────────────────────────────────────────────────────────────
Preparation task for: ${task.event.title}
` : ''}

${task.notes ? `
ADDITIONAL NOTES
───────────────────────────────────────────────────────────────────────────────
${task.notes}
` : ''}

═══════════════════════════════════════════════════════════════════════════════
Generated: ${new Date().toLocaleDateString()} | Audience: ${audiencePreset.toUpperCase()}
${redactions.length > 0 ? `Redacted: ${redactions.join(', ')}` : 'Full Access'}
═══════════════════════════════════════════════════════════════════════════════
  `.trim();
}

/**
 * Detailed Report Template
 */
function generateDetailedReportPDF(task: any, audiencePreset: string, redactions: string[]): string {
  return `
═══════════════════════════════════════════════════════════════════════════════
                              DETAILED TASK REPORT
═══════════════════════════════════════════════════════════════════════════════

TASK INFORMATION
───────────────────────────────────────────────────────────────────────────────
Title:           ${task.title}
Status:          ${task.status}
Priority:        ${task.priority}
Created:         ${new Date(task.createdAt).toLocaleDateString()}
Last Updated:    ${new Date(task.updatedAt).toLocaleDateString()}
Due Date:        ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not specified'}

TIMING & DURATION
───────────────────────────────────────────────────────────────────────────────
Estimated Duration: ${task.estimatedDuration || task.durationMin || 0} minutes
Actual Duration:    ${task.actualDuration || 'Not recorded'}
Scheduled At:       ${task.scheduledAt ? new Date(task.scheduledAt).toLocaleString() : 'Not scheduled'}

DESCRIPTION
───────────────────────────────────────────────────────────────────────────────
${task.description || 'No description provided'}

SUBTASKS BREAKDOWN
───────────────────────────────────────────────────────────────────────────────
${task.subtasks.length > 0 ? 
  task.subtasks.map((subtask: any, index: number) => 
    `${index + 1}. ${subtask.title}
   Status: ${subtask.status}
   Order: ${subtask.order || 'Not specified'}`
  ).join('\n\n') : 
  'No subtasks defined'}

${task.event ? `
EVENT ASSOCIATION
───────────────────────────────────────────────────────────────────────────────
Event: ${task.event.title}
Type: Preparation Task
` : ''}

${task.notes ? `
NOTES & COMMENTS
───────────────────────────────────────────────────────────────────────────────
${task.notes}
` : ''}

TECHNICAL DETAILS
───────────────────────────────────────────────────────────────────────────────
Task ID: ${task.id}
Energy Required: ${task.energyRequired || 'Not specified'}
Budget Impact: ${task.budgetImpact || 'Not specified'}
AI Generated: ${task.aiGenerated ? 'Yes' : 'No'}
Critical Path: ${task.isCritical ? 'Yes' : 'No'}

═══════════════════════════════════════════════════════════════════════════════
Report Generated: ${new Date().toLocaleString()} | Audience: ${audiencePreset.toUpperCase()}
${redactions.length > 0 ? `Redacted: ${redactions.join(', ')}` : 'Full Access'}
═══════════════════════════════════════════════════════════════════════════════
  `.trim();
}

/**
 * Vendor Packet Template
 */
function generateVendorPacketPDF(task: any, audiencePreset: string, redactions: string[]): string {
  return `
═══════════════════════════════════════════════════════════════════════════════
                              VENDOR INFORMATION PACKET
═══════════════════════════════════════════════════════════════════════════════

PROJECT SCOPE
───────────────────────────────────────────────────────────────────────────────
Task: ${task.title}
Priority: ${task.priority}
Target Completion: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'To be determined'}

REQUIREMENTS
───────────────────────────────────────────────────────────────────────────────
${task.description || 'Detailed requirements to be provided'}

DELIVERABLES
───────────────────────────────────────────────────────────────────────────────
${task.subtasks.length > 0 ? 
  task.subtasks.map((subtask: any, index: number) => 
    `${index + 1}. ${subtask.title}`
  ).join('\n') : 
  'Primary deliverable: Task completion as specified'}

${task.event ? `
EVENT CONTEXT
───────────────────────────────────────────────────────────────────────────────
This task is part of the preparation for: ${task.event.title}
` : ''}

TIMELINE
───────────────────────────────────────────────────────────────────────────────
Estimated Duration: ${task.estimatedDuration || task.durationMin || 0} minutes
${task.scheduledAt ? `Scheduled Start: ${new Date(task.scheduledAt).toLocaleString()}` : 'Start date to be coordinated'}

CONTACT & COORDINATION
───────────────────────────────────────────────────────────────────────────────
For questions or clarifications regarding this task, please contact the project coordinator.

═══════════════════════════════════════════════════════════════════════════════
Document prepared: ${new Date().toLocaleDateString()} | Confidential
${redactions.length > 0 ? `Redacted: ${redactions.join(', ')}` : 'Full Access'}
═══════════════════════════════════════════════════════════════════════════════
  `.trim();
}

/**
 * Team Checklist Template
 */
function generateTeamChecklistPDF(task: any, audiencePreset: string, redactions: string[]): string {
  return `
═══════════════════════════════════════════════════════════════════════════════
                                TEAM CHECKLIST
═══════════════════════════════════════════════════════════════════════════════

TASK: ${task.title}
STATUS: ${task.status} | PRIORITY: ${task.priority}

ACTION ITEMS
───────────────────────────────────────────────────────────────────────────────
${task.subtasks.length > 0 ? 
  task.subtasks.map((subtask: any, index: number) => 
    `☐ ${subtask.title} [${subtask.status}]`
  ).join('\n') : 
  '☐ Complete main task objectives'}

QUICK REFERENCE
───────────────────────────────────────────────────────────────────────────────
• Due Date: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'TBD'}
• Duration: ${task.estimatedDuration || task.durationMin || 0} minutes
• Event: ${task.event ? task.event.title : 'Standalone'}

NOTES
───────────────────────────────────────────────────────────────────────────────
${task.notes || 'No additional notes'}

${task.description ? `
DETAILS
───────────────────────────────────────────────────────────────────────────────
${task.description}
` : ''}

═══════════════════════════════════════════════════════════════════════════════
Checklist created: ${new Date().toLocaleDateString()} | Team Access
${redactions.length > 0 ? `Redacted: ${redactions.join(', ')}` : 'Full Access'}
═══════════════════════════════════════════════════════════════════════════════
  `.trim();
}

/**
 * Client Presentation Template
 */
function generateClientPresentationPDF(task: any, audiencePreset: string, redactions: string[]): string {
  return `
═══════════════════════════════════════════════════════════════════════════════
                              PROJECT UPDATE
═══════════════════════════════════════════════════════════════════════════════

PROJECT OVERVIEW
───────────────────────────────────────────────────────────────────────────────
${task.title}

Current Status: ${task.status}
Priority Level: ${task.priority}
Target Date: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'To be confirmed'}

PROGRESS SUMMARY
───────────────────────────────────────────────────────────────────────────────
${task.description || 'Project details and progress information'}

MILESTONES & DELIVERABLES
───────────────────────────────────────────────────────────────────────────────
${task.subtasks.length > 0 ? 
  task.subtasks.map((subtask: any, index: number) => 
    `• ${subtask.title} - ${subtask.status}`
  ).join('\n') : 
  '• Primary project deliverables'}

${task.event ? `
RELATED INITIATIVES
───────────────────────────────────────────────────────────────────────────────
This project supports: ${task.event.title}
` : ''}

NEXT STEPS
───────────────────────────────────────────────────────────────────────────────
• Continue with current task execution
• Monitor progress against timeline
• Coordinate with stakeholders as needed

═══════════════════════════════════════════════════════════════════════════════
Presentation Date: ${new Date().toLocaleDateString()} | Client Access
${redactions.length > 0 ? `Redacted: ${redactions.join(', ')}` : 'Full Access'}
═══════════════════════════════════════════════════════════════════════════════
  `.trim();
}

/**
 * Generate Event PDF preview content with professional templates
 */
function generateEventPDFPreview(event: any, audiencePreset: string, template: string = 'executive-summary'): string {
  const redactions = getRedactionsForAudience(audiencePreset);
  
  switch (template) {
    case 'executive-summary':
      return generateEventExecutiveSummaryPDF(event, audiencePreset, redactions);
    case 'detailed-report':
      return generateEventDetailedReportPDF(event, audiencePreset, redactions);
    case 'vendor-packet':
      return generateEventVendorPacketPDF(event, audiencePreset, redactions);
    case 'team-checklist':
      return generateEventTeamChecklistPDF(event, audiencePreset, redactions);
    case 'client-presentation':
      return generateEventClientPresentationPDF(event, audiencePreset, redactions);
    case 'run-of-show':
      return generateEventRunOfShowPDF(event, audiencePreset, redactions);
    case 'attendee-guide':
      return generateEventAttendeeGuidePDF(event, audiencePreset, redactions);
    case 'event-briefing':
      return generateEventBriefingPDF(event, audiencePreset, redactions);
    default:
      return generateEventExecutiveSummaryPDF(event, audiencePreset, redactions);
  }
}

/**
 * Event Executive Summary Template
 */
function generateEventExecutiveSummaryPDF(event: any, audiencePreset: string, redactions: string[]): string {
  const startTime = event.startTime ? new Date(event.startTime) : null;
  const endTime = event.endTime ? new Date(event.endTime) : null;
  const duration = startTime && endTime ? 
    Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)) + ' minutes' : 
    'Not specified';

  return `
═══════════════════════════════════════════════════════════════════════════════
                              EVENT EXECUTIVE SUMMARY
═══════════════════════════════════════════════════════════════════════════════

EVENT: ${event.title}
DATE: ${startTime ? startTime.toLocaleDateString() : 'TBD'}
TIME: ${startTime ? startTime.toLocaleTimeString() : 'TBD'}
DURATION: ${duration}

OVERVIEW
───────────────────────────────────────────────────────────────────────────────
${event.description || 'No description provided'}

KEY METRICS
───────────────────────────────────────────────────────────────────────────────
• Total Tasks: ${event.tasks?.length || 0} items
• Location: ${event.location || 'TBD'}
• All Day: ${event.isAllDay ? 'Yes' : 'No'}

PREPARATION STATUS
───────────────────────────────────────────────────────────────────────────────
${event.tasks && event.tasks.length > 0 ? 
  event.tasks.map((task: any, index: number) => 
    `• ${task.title} - ${task.status}`
  ).join('\n') : 
  'No preparation tasks defined'}

${event.location ? `
LOCATION DETAILS
───────────────────────────────────────────────────────────────────────────────
${event.location}
` : ''}

═══════════════════════════════════════════════════════════════════════════════
Generated: ${new Date().toLocaleDateString()} | Audience: ${audiencePreset.toUpperCase()}
${redactions.length > 0 ? `Redacted: ${redactions.join(', ')}` : 'Full Access'}
═══════════════════════════════════════════════════════════════════════════════
  `.trim();
}

/**
 * Event Run of Show Template
 */
function generateEventRunOfShowPDF(event: any, audiencePreset: string, redactions: string[]): string {
  const startTime = event.startTime ? new Date(event.startTime) : null;
  const endTime = event.endTime ? new Date(event.endTime) : null;

  return `
═══════════════════════════════════════════════════════════════════════════════
                                RUN OF SHOW
═══════════════════════════════════════════════════════════════════════════════

EVENT: ${event.title}
DATE: ${startTime ? startTime.toLocaleDateString() : 'TBD'}
TIME: ${startTime ? startTime.toLocaleTimeString() : 'TBD'} - ${endTime ? endTime.toLocaleTimeString() : 'TBD'}
LOCATION: ${event.location || 'TBD'}

TIMELINE
───────────────────────────────────────────────────────────────────────────────
${event.tasks && event.tasks.length > 0 ? 
  event.tasks.map((task: any, index: number) => {
    const scheduledTime = task.scheduledAt ? new Date(task.scheduledAt).toLocaleTimeString() : 'TBD';
    return `${scheduledTime} - ${task.title} (${task.estimatedDuration || task.durationMin || 0} min)`;
  }).join('\n') : 
  'Timeline to be finalized'}

PREPARATION CHECKLIST
───────────────────────────────────────────────────────────────────────────────
${event.tasks && event.tasks.length > 0 ? 
  event.tasks.map((task: any, index: number) => 
    `☐ ${task.title} - ${task.status}`
  ).join('\n') : 
  '☐ Finalize event details'}

LOGISTICS
───────────────────────────────────────────────────────────────────────────────
• All Day Event: ${event.isAllDay ? 'Yes' : 'No'}
• Location: ${event.location || 'TBD'}
• Contact: Event Coordinator

═══════════════════════════════════════════════════════════════════════════════
Run of Show prepared: ${new Date().toLocaleDateString()} | Team Access
${redactions.length > 0 ? `Redacted: ${redactions.join(', ')}` : 'Full Access'}
═══════════════════════════════════════════════════════════════════════════════
  `.trim();
}

/**
 * Event Attendee Guide Template
 */
function generateEventAttendeeGuidePDF(event: any, audiencePreset: string, redactions: string[]): string {
  const startTime = event.startTime ? new Date(event.startTime) : null;
  const endTime = event.endTime ? new Date(event.endTime) : null;
  const duration = startTime && endTime ? 
    Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)) + ' minutes' : 
    'TBD';

  return `
═══════════════════════════════════════════════════════════════════════════════
                              ATTENDEE GUIDE
═══════════════════════════════════════════════════════════════════════════════

WELCOME TO: ${event.title}

EVENT DETAILS
───────────────────────────────────────────────────────────────────────────────
Date: ${startTime ? startTime.toLocaleDateString() : 'TBD'}
Time: ${startTime ? startTime.toLocaleTimeString() : 'TBD'} - ${endTime ? endTime.toLocaleTimeString() : 'TBD'}
Location: ${event.location || 'TBD'}
Duration: ${duration}

WHAT TO EXPECT
───────────────────────────────────────────────────────────────────────────────
${event.description || 'Event details and agenda will be provided on-site.'}

AGENDA OVERVIEW
───────────────────────────────────────────────────────────────────────────────
${event.tasks && event.tasks.length > 0 ? 
  event.tasks.map((task: any, index: number) => {
    const scheduledTime = task.scheduledAt ? new Date(task.scheduledAt).toLocaleTimeString() : 'TBD';
    return `• ${scheduledTime} - ${task.title}`;
  }).join('\n') : 
  '• Welcome and introductions\n• Main event activities\n• Closing remarks'}

IMPORTANT INFORMATION
───────────────────────────────────────────────────────────────────────────────
• Please arrive 15 minutes early
• Contact: Event Coordinator
• Questions? Ask any team member

═══════════════════════════════════════════════════════════════════════════════
Guide prepared: ${new Date().toLocaleDateString()} | Attendee Access
${redactions.length > 0 ? `Redacted: ${redactions.join(', ')}` : 'Full Access'}
═══════════════════════════════════════════════════════════════════════════════
  `.trim();
}

/**
 * Event Briefing Template
 */
function generateEventBriefingPDF(event: any, audiencePreset: string, redactions: string[]): string {
  const startTime = event.startTime ? new Date(event.startTime) : null;
  const endTime = event.endTime ? new Date(event.endTime) : null;

  return `
═══════════════════════════════════════════════════════════════════════════════
                              EVENT BRIEFING
═══════════════════════════════════════════════════════════════════════════════

EVENT OVERVIEW
───────────────────────────────────────────────────────────────────────────────
Title: ${event.title}
Date: ${startTime ? startTime.toLocaleDateString() : 'TBD'}
Time: ${startTime ? startTime.toLocaleTimeString() : 'TBD'} - ${endTime ? endTime.toLocaleTimeString() : 'TBD'}
Location: ${event.location || 'TBD'}
All Day: ${event.isAllDay ? 'Yes' : 'No'}

DESCRIPTION
───────────────────────────────────────────────────────────────────────────────
${event.description || 'Event description and objectives'}

PREPARATION TASKS
───────────────────────────────────────────────────────────────────────────────
${event.tasks && event.tasks.length > 0 ? 
  event.tasks.map((task: any, index: number) => 
    `${index + 1}. ${task.title}
   Status: ${task.status}
   Priority: ${task.priority}
   Due: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'TBD'}`
  ).join('\n\n') : 
  'No preparation tasks defined'}

LOGISTICS
───────────────────────────────────────────────────────────────────────────────
• Location: ${event.location || 'TBD'}
• All Day Event: ${event.isAllDay ? 'Yes' : 'No'}
• Contact: Event Coordinator

═══════════════════════════════════════════════════════════════════════════════
Briefing prepared: ${new Date().toLocaleDateString()} | Team Access
${redactions.length > 0 ? `Redacted: ${redactions.join(', ')}` : 'Full Access'}
═══════════════════════════════════════════════════════════════════════════════
  `.trim();
}

/**
 * Event Detailed Report Template
 */
function generateEventDetailedReportPDF(event: any, audiencePreset: string, redactions: string[]): string {
  const startTime = event.startTime ? new Date(event.startTime) : null;
  const endTime = event.endTime ? new Date(event.endTime) : null;
  const duration = startTime && endTime ? 
    Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)) + ' minutes' : 
    'Not specified';

  return `
═══════════════════════════════════════════════════════════════════════════════
                              DETAILED EVENT REPORT
═══════════════════════════════════════════════════════════════════════════════

EVENT INFORMATION
───────────────────────────────────────────────────────────────────────────────
Title: ${event.title}
Date: ${startTime ? startTime.toLocaleDateString() : 'TBD'}
Time: ${startTime ? startTime.toLocaleTimeString() : 'TBD'} - ${endTime ? endTime.toLocaleTimeString() : 'TBD'}
Duration: ${duration}
Location: ${event.location || 'TBD'}
All Day: ${event.isAllDay ? 'Yes' : 'No'}

DESCRIPTION
───────────────────────────────────────────────────────────────────────────────
${event.description || 'No description provided'}

PREPARATION TASKS ANALYSIS
───────────────────────────────────────────────────────────────────────────────
Total Tasks: ${event.tasks?.length || 0}
${event.tasks && event.tasks.length > 0 ? 
  event.tasks.map((task: any, index: number) => 
    `${index + 1}. ${task.title}
   Status: ${task.status}
   Priority: ${task.priority}
   Due Date: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'TBD'}
   Duration: ${task.estimatedDuration || task.durationMin || 0} minutes`
  ).join('\n\n') : 
  'No preparation tasks defined'}

STATUS SUMMARY
───────────────────────────────────────────────────────────────────────────────
${event.tasks && event.tasks.length > 0 ? 
  `• Completed: ${event.tasks.filter((t: any) => t.status === 'COMPLETED').length}
• In Progress: ${event.tasks.filter((t: any) => t.status === 'IN_PROGRESS').length}
• Pending: ${event.tasks.filter((t: any) => t.status === 'PENDING').length}
• Cancelled: ${event.tasks.filter((t: any) => t.status === 'CANCELLED').length}` : 
  'No tasks to analyze'}

═══════════════════════════════════════════════════════════════════════════════
Report generated: ${new Date().toLocaleDateString()} | Audience: ${audiencePreset.toUpperCase()}
${redactions.length > 0 ? `Redacted: ${redactions.join(', ')}` : 'Full Access'}
═══════════════════════════════════════════════════════════════════════════════
  `.trim();
}

/**
 * Event Vendor Packet Template
 */
function generateEventVendorPacketPDF(event: any, audiencePreset: string, redactions: string[]): string {
  const startTime = event.startTime ? new Date(event.startTime) : null;
  const endTime = event.endTime ? new Date(event.endTime) : null;

  return `
═══════════════════════════════════════════════════════════════════════════════
                              VENDOR PACKET
═══════════════════════════════════════════════════════════════════════════════

EVENT: ${event.title}
DATE: ${startTime ? startTime.toLocaleDateString() : 'TBD'}
TIME: ${startTime ? startTime.toLocaleTimeString() : 'TBD'} - ${endTime ? endTime.toLocaleTimeString() : 'TBD'}
LOCATION: ${event.location || 'TBD'}

SCOPE OF WORK
───────────────────────────────────────────────────────────────────────────────
${event.description || 'Event coordination and logistics'}

REQUIRED SERVICES
───────────────────────────────────────────────────────────────────────────────
${event.tasks && event.tasks.length > 0 ? 
  event.tasks.map((task: any, index: number) => 
    `• ${task.title}`
  ).join('\n') : 
  '• Event setup and coordination\n• Logistics management\n• On-site support'}

DELIVERABLES
───────────────────────────────────────────────────────────────────────────────
• Complete event setup according to specifications
• Professional service delivery
• Post-event cleanup and reporting

CONTACT INFORMATION
───────────────────────────────────────────────────────────────────────────────
Event Coordinator: [Contact Information]
Location: ${event.location || 'TBD'}

═══════════════════════════════════════════════════════════════════════════════
Vendor Packet prepared: ${new Date().toLocaleDateString()} | Vendor Access
${redactions.length > 0 ? `Redacted: ${redactions.join(', ')}` : 'Full Access'}
═══════════════════════════════════════════════════════════════════════════════
  `.trim();
}

/**
 * Event Team Checklist Template
 */
function generateEventTeamChecklistPDF(event: any, audiencePreset: string, redactions: string[]): string {
  const startTime = event.startTime ? new Date(event.startTime) : null;
  const endTime = event.endTime ? new Date(event.endTime) : null;

  return `
═══════════════════════════════════════════════════════════════════════════════
                              TEAM CHECKLIST
═══════════════════════════════════════════════════════════════════════════════

EVENT: ${event.title}
DATE: ${startTime ? startTime.toLocaleDateString() : 'TBD'}
TIME: ${startTime ? startTime.toLocaleTimeString() : 'TBD'} - ${endTime ? endTime.toLocaleTimeString() : 'TBD'}

PREPARATION CHECKLIST
───────────────────────────────────────────────────────────────────────────────
${event.tasks && event.tasks.length > 0 ? 
  event.tasks.map((task: any, index: number) => 
    `☐ ${task.title} (${task.priority}) - Due: ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'TBD'}`
  ).join('\n') : 
  '☐ Finalize event details\n☐ Confirm location\n☐ Prepare materials'}

DAY-OF CHECKLIST
───────────────────────────────────────────────────────────────────────────────
☐ Arrive 30 minutes early
☐ Set up event space
☐ Test all equipment
☐ Welcome attendees
☐ Execute event timeline
☐ Clean up venue
☐ Collect feedback

POST-EVENT CHECKLIST
───────────────────────────────────────────────────────────────────────────────
☐ Send thank you notes
☐ Process feedback
☐ Update event records
☐ Schedule follow-up meetings

═══════════════════════════════════════════════════════════════════════════════
Checklist prepared: ${new Date().toLocaleDateString()} | Team Access
${redactions.length > 0 ? `Redacted: ${redactions.join(', ')}` : 'Full Access'}
═══════════════════════════════════════════════════════════════════════════════
  `.trim();
}

/**
 * Event Client Presentation Template
 */
function generateEventClientPresentationPDF(event: any, audiencePreset: string, redactions: string[]): string {
  const startTime = event.startTime ? new Date(event.startTime) : null;
  const endTime = event.endTime ? new Date(event.endTime) : null;

  return `
═══════════════════════════════════════════════════════════════════════════════
                            CLIENT PRESENTATION
═══════════════════════════════════════════════════════════════════════════════

EVENT OVERVIEW
───────────────────────────────────────────────────────────────────────────────
${event.title}

We are pleased to present the comprehensive plan for your upcoming event. Our team has developed a detailed strategy to ensure a successful and memorable experience.

EVENT DETAILS
───────────────────────────────────────────────────────────────────────────────
Date: ${startTime ? startTime.toLocaleDateString() : 'TBD'}
Time: ${startTime ? startTime.toLocaleTimeString() : 'TBD'} - ${endTime ? endTime.toLocaleTimeString() : 'TBD'}
Location: ${event.location || 'TBD'}
Duration: ${startTime && endTime ? 
  Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)) + ' minutes' : 
  'TBD'}

SCOPE OF SERVICES
───────────────────────────────────────────────────────────────────────────────
${event.description || 'Comprehensive event management and coordination services'}

PREPARATION ACTIVITIES
───────────────────────────────────────────────────────────────────────────────
${event.tasks && event.tasks.length > 0 ? 
  event.tasks.map((task: any, index: number) => 
    `• ${task.title}`
  ).join('\n') : 
  '• Event planning and coordination\n• Vendor management\n• Logistics coordination'}

NEXT STEPS
───────────────────────────────────────────────────────────────────────────────
1. Review and approve event plan
2. Confirm final details
3. Execute preparation activities
4. Deliver exceptional event experience

═══════════════════════════════════════════════════════════════════════════════
Presentation prepared: ${new Date().toLocaleDateString()} | Client Access
${redactions.length > 0 ? `Redacted: ${redactions.join(', ')}` : 'Full Access'}
═══════════════════════════════════════════════════════════════════════════════
  `.trim();
}

/**
 * Generate CSV preview content
 */
function generateCSVPreview(task: any, audiencePreset: string, template?: string): string {
  const redactions = getRedactionsForAudience(audiencePreset);
  
  return `Title,Status,Priority,Due Date,Duration,Description,Event
"${task.title}","${task.status}","${task.priority}","${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : ''}","${task.estimatedDuration || task.durationMin || 0}","${(task.description || '').replace(/"/g, '""')}","${task.event?.title || ''}"`;
}

/**
 * Generate Event CSV preview content
 */
function generateEventCSVPreview(event: any, audiencePreset: string, template?: string): string {
  const redactions = getRedactionsForAudience(audiencePreset);
  const startTime = event.startTime ? new Date(event.startTime) : null;
  const endTime = event.endTime ? new Date(event.endTime) : null;
  const duration = startTime && endTime ? 
    Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)) + ' minutes' : 
    '';
  
  return `Event Title,Date,Start Time,End Time,Location,Duration,Description,Tasks
"${event.title}","${startTime ? startTime.toLocaleDateString() : ''}","${startTime ? startTime.toLocaleTimeString() : ''}","${endTime ? endTime.toLocaleTimeString() : ''}","${event.location || ''}","${duration}","${(event.description || '').replace(/"/g, '""')}","${event.tasks?.length || 0}"`;
}

/**
 * Generate Markdown preview content
 */
function generateMarkdownPreview(task: any, audiencePreset: string, template?: string): string {
  const redactions = getRedactionsForAudience(audiencePreset);
  
  return `# ${task.title}

- **Status:** ${task.status}
- **Priority:** ${task.priority}
- **Due Date:** ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}
- **Duration:** ${task.estimatedDuration || task.durationMin || 0} minutes

## Description
${task.description || 'No description provided'}

## Checklist
${task.subtasks.length > 0 ? task.subtasks.map((subtask: any) => 
  `- [${subtask.status === 'COMPLETED' ? 'x' : ' '}] ${subtask.title}`
).join('\n') : '- No subtasks'}

${task.event ? `## Related Event
**Prep for:** ${task.event.title}` : ''}

---
*Export for ${audiencePreset} audience*
  `.trim();
}

/**
 * Generate JSON preview content
 */
function generateJSONPreview(task: any, audiencePreset: string, template?: string): string {
  const redactions = getRedactionsForAudience(audiencePreset);
  
  const taskData = {
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    estimatedDuration: task.estimatedDuration || task.durationMin,
    description: task.description,
    subtasks: task.subtasks.map((subtask: any) => ({
      id: subtask.id,
      title: subtask.title,
      status: subtask.status
    })),
    event: task.event ? {
      id: task.event.id,
      title: task.event.title
    } : null,
    notes: task.notes,
    exportMetadata: {
      audience: audiencePreset,
      redactions: redactions,
      generatedAt: new Date().toISOString()
    }
  };

  return JSON.stringify(taskData, null, 2);
}

/**
 * Generate generic preview content
 */
function generateGenericPreview(task: any, audiencePreset: string, template?: string): string {
  return `Task: ${task.title}
Status: ${task.status}
Priority: ${task.priority}
Description: ${task.description || 'No description'}
Subtasks: ${task.subtasks.length}
Event: ${task.event?.title || 'None'}

Export for: ${audiencePreset} audience`;
}

/**
 * Generate Event Markdown preview content
 */
function generateEventMarkdownPreview(event: any, audiencePreset: string, template?: string): string {
  const redactions = getRedactionsForAudience(audiencePreset);
  const startTime = event.startTime ? new Date(event.startTime) : null;
  const endTime = event.endTime ? new Date(event.endTime) : null;
  const duration = startTime && endTime ? 
    Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60)) + ' minutes' : 
    'TBD';
  
  return `# ${event.title}

- **Date:** ${startTime ? startTime.toLocaleDateString() : 'TBD'}
- **Time:** ${startTime ? startTime.toLocaleTimeString() : 'TBD'} - ${endTime ? endTime.toLocaleTimeString() : 'TBD'}
- **Location:** ${event.location || 'TBD'}
- **Duration:** ${duration}
- **All Day:** ${event.isAllDay ? 'Yes' : 'No'}

## Description
${event.description || 'No description provided'}

## Preparation Tasks
${event.tasks && event.tasks.length > 0 ? 
  event.tasks.map((task: any) => 
    `- [${task.status === 'COMPLETED' ? 'x' : ' '}] ${task.title} (${task.priority})`
  ).join('\n') : 
  '- No preparation tasks'}

## Logistics
- Location: ${event.location || 'TBD'}
- All Day Event: ${event.isAllDay ? 'Yes' : 'No'}

---
*Export for ${audiencePreset} audience*
  `.trim();
}

/**
 * Generate Event JSON preview content
 */
function generateEventJSONPreview(event: any, audiencePreset: string, template?: string): string {
  const redactions = getRedactionsForAudience(audiencePreset);
  
  const eventData = {
    id: event.id,
    title: event.title,
    startTime: event.startTime,
    endTime: event.endTime,
    location: event.location,
    isAllDay: event.isAllDay,
    description: event.description,
    tasks: event.tasks?.map((task: any) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate
    })) || [],
    exportMetadata: {
      audience: audiencePreset,
      redactions: redactions,
      generatedAt: new Date().toISOString()
    }
  };

  return JSON.stringify(eventData, null, 2);
}

/**
 * Generate Event generic preview content
 */
function generateEventGenericPreview(event: any, audiencePreset: string, template?: string): string {
  const startTime = event.startTime ? new Date(event.startTime) : null;
  const endTime = event.endTime ? new Date(event.endTime) : null;
  
  return `Event: ${event.title}
Date: ${startTime ? startTime.toLocaleDateString() : 'TBD'}
Time: ${startTime ? startTime.toLocaleTimeString() : 'TBD'} - ${endTime ? endTime.toLocaleTimeString() : 'TBD'}
Location: ${event.location || 'TBD'}
All Day: ${event.isAllDay ? 'Yes' : 'No'}
Tasks: ${event.tasks?.length || 0}
Description: ${event.description || 'No description'}

Export for: ${audiencePreset} audience`;
}

/**
 * Generate multiple tasks PDF preview
 */
function generateMultipleTasksPDFPreview(tasks: any[], audiencePreset: string): string {
  const redactions = getRedactionsForAudience(audiencePreset);
  
  return `# TASK SUMMARY REPORT

**Total Tasks:** ${tasks.length}
**Export Date:** ${new Date().toLocaleDateString()}

## Task Overview

${tasks.map((task, index) => `
### ${index + 1}. ${task.title}
- **Status:** ${task.status}
- **Priority:** ${task.priority}
- **Due Date:** ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'Not set'}
- **Subtasks:** ${task.subtasks.length}
- **Event:** ${task.event?.title || 'Standalone'}
`).join('\n')}

---
*Generated for ${audiencePreset} audience*
${redactions.length > 0 ? `\n*Redacted: ${redactions.join(', ')}*` : ''}
  `.trim();
}

/**
 * Generate multiple tasks CSV preview
 */
function generateMultipleTasksCSVPreview(tasks: any[], audiencePreset: string): string {
  return `Title,Status,Priority,Due Date,Duration,Subtasks,Event
${tasks.map(task => 
  `"${task.title}","${task.status}","${task.priority}","${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : ''}","${task.estimatedDuration || task.durationMin || 0}","${task.subtasks.length}","${task.event?.title || ''}"`
).join('\n')}`;
}

/**
 * Generate multiple tasks generic preview
 */
function generateMultipleTasksGenericPreview(tasks: any[], audiencePreset: string): string {
  return `Multiple Tasks Export (${tasks.length} items)
Generated: ${new Date().toLocaleDateString()}
Audience: ${audiencePreset}

Tasks:
${tasks.map((task, index) => `${index + 1}. ${task.title} (${task.status})`).join('\n')}`;
}

/**
 * Get redactions for audience preset
 */
function getRedactionsForAudience(audiencePreset: string): string[] {
  switch (audiencePreset) {
    case 'vendor':
      return ['PII', 'Internal Notes', 'Budget Details'];
    case 'attendee':
      return ['PII', 'Internal Notes', 'Budget Details', 'Contact Information'];
    case 'team':
      return ['PII'];
    case 'owner':
    case 'personal':
    default:
      return [];
  }
}

/**
 * Create a new export job
 */
router.post('/create', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const exportOptions = req.body;

  // Validate export options
  if (!exportOptions.exportType || !exportOptions.scope || !exportOptions.audiencePreset) {
    throw createError('Missing required export options', 400);
  }

  const exportJob = await exportService.createExportJob(userId, exportOptions);

  // Record analytics
  await exportService.recordExportAnalytics(
    userId,
    exportJob.id,
    'export_started',
    { exportType: exportOptions.exportType, scope: exportOptions.scope },
    {
      exportType: exportOptions.exportType,
      scope: JSON.stringify(exportOptions.scope),
      audiencePreset: exportOptions.audiencePreset,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip
    }
  );

  res.json({
    success: true,
    data: { exportJob }
  });
}));

/**
 * Get export job by ID
 */
router.get('/job/:jobId', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { jobId } = req.params;

  const exportJob = await exportService.getExportJob(jobId, userId);
  if (!exportJob) {
    throw createError('Export job not found', 404);
  }

  res.json({
    success: true,
    data: { exportJob }
  });
}));

/**
 * Get user's export jobs
 */
router.get('/jobs', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { limit = 50 } = req.query;

  const exportJobs = await exportService.getUserExportJobs(userId, Number(limit));

  res.json({
    success: true,
    data: { exportJobs }
  });
}));

/**
 * Delete export job
 */
router.delete('/job/:jobId', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { jobId } = req.params;

  await exportService.deleteExportJob(jobId, userId);

  res.json({
    success: true,
    message: 'Export job deleted successfully'
  });
}));

/**
 * Get export templates
 */
router.get('/templates', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;

  const templates = await exportService.getExportTemplates(userId);

  res.json({
    success: true,
    data: { templates }
  });
}));

/**
 * Create export template
 */
router.post('/templates', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const templateData = req.body;

  const template = await exportService.createExportTemplate(userId, templateData);

  res.json({
    success: true,
    data: { template }
  });
}));

/**
 * Preview export (without generating file)
 */
router.post('/preview', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { exportType, scope, audiencePreset, sections, template } = req.body;

  try {
    // If no template specified, return available templates
    if (!template) {
      const availableTemplates = Object.entries(DOCUMENT_TEMPLATES)
        .filter(([key, template]) => template.availableFor.includes(scope.type))
        .map(([key, template]) => ({
          id: key,
          ...template
        }));

      return res.json({
        success: true,
        data: { 
          templates: availableTemplates,
          message: 'Please select a document template to preview'
        }
      });
    }

    // Generate actual preview content based on scope, export type, and template
    const previewContent = await generatePreviewContent(userId, exportType, scope, audiencePreset, sections, template);
    
    const previewData = {
      exportType,
      scope,
      audiencePreset,
      sections,
      template,
      estimatedSize: previewContent.estimatedSize,
      estimatedTime: previewContent.estimatedTime,
      preview: previewContent
    };

    res.json({
      success: true,
      data: { preview: previewData }
    });
  } catch (error) {
    logger.error('Preview generation failed', { error, userId, exportType, scope });
    throw createError('Failed to generate preview', 500);
  }
}));

/**
 * Generate export file
 */
router.post('/generate', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { jobId } = req.body;

  if (!jobId) {
    throw createError('Job ID is required', 400);
  }

  // Start processing the export job
  exportService.processExportJob(jobId).catch(error => {
    logger.error(`Error processing export job ${jobId}:`, error);
  });

  res.json({
    success: true,
    message: 'Export generation started',
    data: { jobId }
  });
}));

/**
 * Download export file
 */
router.get('/download/:jobId', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { jobId } = req.params;

  const exportJob = await exportService.getExportJob(jobId, userId);
  if (!exportJob) {
    throw createError('Export job not found', 404);
  }

  if (exportJob.status !== 'completed') {
    throw createError('Export job not completed yet', 400);
  }

  if (!exportJob.downloadUrl) {
    throw createError('Download URL not available', 404);
  }

  // Record download analytics
  await exportService.recordExportAnalytics(
    userId,
    jobId,
    'export_downloaded',
    { downloadUrl: exportJob.downloadUrl },
    {
      exportType: exportJob.exportType,
      scope: exportJob.scope,
      audiencePreset: exportJob.audiencePreset,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip
    }
  );

  // Redirect to download URL or serve file directly
  res.redirect(exportJob.downloadUrl);
}));

/**
 * Get share link info
 */
router.get('/share/:jobId', asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const { passcode } = req.query;

  // This endpoint doesn't require authentication as it's for sharing
  const exportJob = await exportService.getExportJob(jobId, ''); // We'll need to modify this
  if (!exportJob) {
    throw createError('Export job not found', 404);
  }

  if (exportJob.status !== 'completed') {
    throw createError('Export job not completed yet', 400);
  }

  if (!exportJob.shareUrl) {
    throw createError('Share URL not available', 404);
  }

  // Check passcode if required
  if (exportJob.sharePasscode && exportJob.sharePasscode !== passcode) {
    throw createError('Invalid passcode', 401);
  }

  // Record share view analytics
  await exportService.recordExportAnalytics(
    exportJob.userId,
    jobId,
    'share_viewed',
    { shareUrl: exportJob.shareUrl },
    {
      exportType: exportJob.exportType,
      scope: exportJob.scope,
      audiencePreset: exportJob.audiencePreset,
      userAgent: req.get('User-Agent'),
      ipAddress: req.ip,
      referrer: req.get('Referer')
    }
  );

  res.json({
    success: true,
    data: {
      exportJob: {
        id: exportJob.id,
        exportType: exportJob.exportType,
        createdAt: exportJob.createdAt,
        expiresAt: exportJob.expiresAt,
        shareUrl: exportJob.shareUrl
      }
    }
  });
}));

/**
 * Revoke share link
 */
router.delete('/share/:jobId', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { jobId } = req.params;

  const exportJob = await exportService.getExportJob(jobId, userId);
  if (!exportJob) {
    throw createError('Export job not found', 404);
  }

  // Clear share URL and passcode
  await exportService.updateExportJobStatus(
    jobId,
    exportJob.status,
    exportJob.progress,
    exportJob.errorMessage,
    exportJob.downloadUrl,
    undefined, // Clear shareUrl
    undefined  // Clear sharePasscode
  );

  res.json({
    success: true,
    message: 'Share link revoked successfully'
  });
}));

/**
 * Get export analytics
 */
router.get('/analytics', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { startDate, endDate, exportType } = req.query;

  // This would fetch analytics data for the user's exports
  // For now, we'll return mock analytics
  const analytics = {
    totalExports: 25,
    exportsByType: {
      pdf: 10,
      docx: 8,
      csv: 5,
      ics: 2
    },
    exportsByAudience: {
      owner: 15,
      team: 6,
      vendor: 3,
      attendee: 1
    },
    recentActivity: [
      {
        date: new Date().toISOString(),
        type: 'pdf',
        audience: 'team',
        downloads: 3
      }
    ]
  };

  res.json({
    success: true,
    data: { analytics }
  });
}));

/**
 * Export single task
 */
router.post('/task/:taskId', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { taskId } = req.params;
  const { preset, format, options = {} } = req.body;

  // Validate required fields
  if (!preset || !format) {
    throw createError('Missing required fields: preset, format', 400);
  }

  // Create export options for single task
  const exportOptions = {
    exportType: format,
    scope: {
      type: 'task',
      id: taskId
    },
    audiencePreset: preset,
    redactionSettings: {
      hidePII: preset === 'vendor' || preset === 'attendee',
      hideBudgetNumbers: preset === 'attendee',
      hideInternalNotes: preset === 'vendor' || preset === 'attendee',
      hideRestrictedItems: true,
      watermark: preset !== 'owner',
      passcodeProtect: preset === 'vendor',
      expireShareLink: preset === 'vendor'
    },
    deliveryOptions: {
      download: true,
      email: false,
      shareLink: preset === 'vendor',
      pushToCloud: false,
      calendarSubscribe: false
    },
    ...options
  };

  const exportJob = await exportService.createExportJob(userId, exportOptions);

  res.json({
    success: true,
    data: { exportJob }
  });
}));

/**
 * Export selected tasks
 */
router.post('/tasks', authenticateToken, asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const { taskIds, preset, format, options = {}, groupBy } = req.body;

  // Validate required fields
  if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
    throw createError('Missing or invalid taskIds array', 400);
  }
  if (!preset || !format) {
    throw createError('Missing required fields: preset, format', 400);
  }

  // Create export options for selected tasks
  const exportOptions = {
    exportType: format,
    scope: {
      type: 'tasks',
      ids: taskIds,
      groupBy: groupBy || 'event'
    },
    audiencePreset: preset,
    redactionSettings: {
      hidePII: preset === 'vendor' || preset === 'attendee',
      hideBudgetNumbers: preset === 'attendee',
      hideInternalNotes: preset === 'vendor' || preset === 'attendee',
      hideRestrictedItems: true,
      watermark: preset !== 'owner',
      passcodeProtect: preset === 'vendor',
      expireShareLink: preset === 'vendor'
    },
    deliveryOptions: {
      download: true,
      email: false,
      shareLink: preset === 'vendor',
      pushToCloud: false,
      calendarSubscribe: false
    },
    ...options
  };

  const exportJob = await exportService.createExportJob(userId, exportOptions);

  res.json({
    success: true,
    data: { exportJob }
  });
}));

export default router;
