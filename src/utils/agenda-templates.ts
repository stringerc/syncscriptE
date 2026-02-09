/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AGENDA TEMPLATES LIBRARY - PRE-BUILT EVENT STRUCTURES
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * RESEARCH FOUNDATION:
 * ────────────────────
 * - **Google Meet (2024)**: Standard meeting structures
 * - **Microsoft Teams (2023)**: Meeting agenda best practices
 * - **Harvard Business Review (2022)**: Effective meeting templates
 * - **Atlassian (2023)**: Agile ceremony structures
 * - **Workshop Facilitators Guide (2021)**: Workshop time allocation
 * 
 * CATEGORIES:
 * ───────────
 * 1. **Meetings** - Standups, 1-on-1s, retrospectives, planning
 * 2. **Workshops** - Full-day, half-day, multi-day events
 * 3. **Projects** - Sprint planning, project kickoffs, reviews
 * 4. **Personal** - Deep work, Pomodoro, study sessions
 * 5. **Educational** - Classes, lectures, training sessions
 */

import { AgendaTemplate } from '../components/hooks/useAgendaManagement';

export const AGENDA_TEMPLATES: AgendaTemplate[] = [
  // ============================================================================
  // MEETING TEMPLATES
  // ============================================================================
  
  {
    id: 'standup-15min',
    name: 'Daily Standup (15min)',
    description: 'Quick sync for agile teams - 3 questions format',
    category: 'meeting',
    icon: '🏃',
    milestones: [
      {
        title: 'Check-in & Attendance',
        offsetMinutes: 0,
        durationMinutes: 2,
      },
      {
        title: 'Yesterday\'s Progress',
        offsetMinutes: 2,
        durationMinutes: 5,
      },
      {
        title: 'Today\'s Plan',
        offsetMinutes: 7,
        durationMinutes: 5,
      },
      {
        title: 'Blockers & Help Needed',
        offsetMinutes: 12,
        durationMinutes: 3,
      },
    ],
  },
  
  {
    id: 'sprint-planning-2h',
    name: 'Sprint Planning (2h)',
    description: 'Comprehensive sprint planning session',
    category: 'meeting',
    icon: '🎯',
    milestones: [
      {
        title: 'Opening & Objectives',
        offsetMinutes: 0,
        durationMinutes: 10,
      },
      {
        title: 'Sprint Review',
        offsetMinutes: 10,
        durationMinutes: 20,
        steps: [
          {
            title: 'Velocity Review',
            offsetMinutes: 0,
            durationMinutes: 10,
          },
          {
            title: 'Previous Sprint Recap',
            offsetMinutes: 10,
            durationMinutes: 10,
          },
        ],
      },
      {
        title: 'Capacity Planning',
        offsetMinutes: 30,
        durationMinutes: 30,
      },
      {
        title: 'Story Selection & Estimation',
        offsetMinutes: 60,
        durationMinutes: 45,
      },
      {
        title: 'Sprint Goals & Commitments',
        offsetMinutes: 105,
        durationMinutes: 10,
      },
      {
        title: 'Action Items & Closing',
        offsetMinutes: 115,
        durationMinutes: 5,
      },
    ],
  },
  
  {
    id: 'retrospective-1h',
    name: 'Sprint Retrospective (1h)',
    description: 'Team reflection and improvement planning',
    category: 'meeting',
    icon: '🔍',
    milestones: [
      {
        title: 'Set the Stage',
        offsetMinutes: 0,
        durationMinutes: 5,
      },
      {
        title: 'Gather Data (What Happened)',
        offsetMinutes: 5,
        durationMinutes: 15,
      },
      {
        title: 'Generate Insights (Why It Happened)',
        offsetMinutes: 20,
        durationMinutes: 20,
      },
      {
        title: 'Decide What to Do',
        offsetMinutes: 40,
        durationMinutes: 15,
      },
      {
        title: 'Close the Retrospective',
        offsetMinutes: 55,
        durationMinutes: 5,
      },
    ],
  },
  
  {
    id: 'one-on-one-30min',
    name: '1-on-1 Meeting (30min)',
    description: 'Manager-employee check-in',
    category: 'meeting',
    icon: '👥',
    milestones: [
      {
        title: 'Personal Check-in',
        offsetMinutes: 0,
        durationMinutes: 5,
      },
      {
        title: 'Work Updates',
        offsetMinutes: 5,
        durationMinutes: 10,
      },
      {
        title: 'Challenges & Support',
        offsetMinutes: 15,
        durationMinutes: 10,
      },
      {
        title: 'Goals & Development',
        offsetMinutes: 25,
        durationMinutes: 5,
      },
    ],
  },
  
  {
    id: 'client-presentation-1h',
    name: 'Client Presentation (1h)',
    description: 'Professional client meeting structure',
    category: 'meeting',
    icon: '💼',
    milestones: [
      {
        title: 'Welcome & Introductions',
        offsetMinutes: 0,
        durationMinutes: 5,
      },
      {
        title: 'Agenda Overview',
        offsetMinutes: 5,
        durationMinutes: 3,
      },
      {
        title: 'Main Presentation',
        offsetMinutes: 8,
        durationMinutes: 30,
        steps: [
          {
            title: 'Problem Statement',
            offsetMinutes: 0,
            durationMinutes: 7,
          },
          {
            title: 'Proposed Solution',
            offsetMinutes: 7,
            durationMinutes: 15,
          },
          {
            title: 'Implementation Plan',
            offsetMinutes: 22,
            durationMinutes: 8,
          },
        ],
      },
      {
        title: 'Q&A Session',
        offsetMinutes: 38,
        durationMinutes: 15,
      },
      {
        title: 'Next Steps & Action Items',
        offsetMinutes: 53,
        durationMinutes: 7,
      },
    ],
  },
  
  // ============================================================================
  // WORKSHOP TEMPLATES
  // ============================================================================
  
  {
    id: 'design-workshop-fullday',
    name: 'Design Workshop (Full Day)',
    description: 'Comprehensive design thinking workshop',
    category: 'workshop',
    icon: '🎨',
    milestones: [
      {
        title: 'Morning Session',
        offsetMinutes: 0,
        durationMinutes: 180, // 3 hours
        steps: [
          {
            title: 'Welcome & Icebreaker',
            offsetMinutes: 0,
            durationMinutes: 30,
          },
          {
            title: 'Problem Framing',
            offsetMinutes: 30,
            durationMinutes: 60,
          },
          {
            title: 'User Research Review',
            offsetMinutes: 90,
            durationMinutes: 60,
          },
        ],
      },
      {
        title: 'Lunch Break',
        offsetMinutes: 180,
        durationMinutes: 60,
      },
      {
        title: 'Afternoon Session',
        offsetMinutes: 240,
        durationMinutes: 180, // 3 hours
        steps: [
          {
            title: 'Ideation & Brainstorming',
            offsetMinutes: 0,
            durationMinutes: 90,
          },
          {
            title: 'Concept Development',
            offsetMinutes: 90,
            durationMinutes: 60,
          },
          {
            title: 'Presentation Prep',
            offsetMinutes: 150,
            durationMinutes: 30,
          },
        ],
      },
      {
        title: 'Wrap-up Session',
        offsetMinutes: 420,
        durationMinutes: 60,
        steps: [
          {
            title: 'Group Presentations',
            offsetMinutes: 0,
            durationMinutes: 40,
          },
          {
            title: 'Feedback & Voting',
            offsetMinutes: 40,
            durationMinutes: 15,
          },
          {
            title: 'Next Steps',
            offsetMinutes: 55,
            durationMinutes: 5,
          },
        ],
      },
    ],
  },
  
  {
    id: 'training-halfday',
    name: 'Training Session (Half Day)',
    description: '4-hour structured training program',
    category: 'workshop',
    icon: '📚',
    milestones: [
      {
        title: 'Introduction & Setup',
        offsetMinutes: 0,
        durationMinutes: 30,
      },
      {
        title: 'Module 1: Fundamentals',
        offsetMinutes: 30,
        durationMinutes: 60,
      },
      {
        title: 'Break',
        offsetMinutes: 90,
        durationMinutes: 15,
      },
      {
        title: 'Module 2: Advanced Concepts',
        offsetMinutes: 105,
        durationMinutes: 60,
      },
      {
        title: 'Hands-on Practice',
        offsetMinutes: 165,
        durationMinutes: 45,
      },
      {
        title: 'Q&A & Wrap-up',
        offsetMinutes: 210,
        durationMinutes: 30,
      },
    ],
  },
  
  // ============================================================================
  // PERSONAL PRODUCTIVITY TEMPLATES
  // ============================================================================
  
  {
    id: 'pomodoro-2h',
    name: 'Pomodoro Session (2h)',
    description: 'Classic Pomodoro technique - 4 blocks',
    category: 'personal',
    icon: '🍅',
    milestones: [
      {
        title: 'Pomodoro Block 1',
        offsetMinutes: 0,
        durationMinutes: 30,
        steps: [
          {
            title: 'Work Session',
            offsetMinutes: 0,
            durationMinutes: 25,
          },
          {
            title: 'Short Break',
            offsetMinutes: 25,
            durationMinutes: 5,
          },
        ],
      },
      {
        title: 'Pomodoro Block 2',
        offsetMinutes: 30,
        durationMinutes: 30,
        steps: [
          {
            title: 'Work Session',
            offsetMinutes: 0,
            durationMinutes: 25,
          },
          {
            title: 'Short Break',
            offsetMinutes: 25,
            durationMinutes: 5,
          },
        ],
      },
      {
        title: 'Long Break',
        offsetMinutes: 60,
        durationMinutes: 15,
      },
      {
        title: 'Pomodoro Block 3',
        offsetMinutes: 75,
        durationMinutes: 30,
        steps: [
          {
            title: 'Work Session',
            offsetMinutes: 0,
            durationMinutes: 25,
          },
          {
            title: 'Short Break',
            offsetMinutes: 25,
            durationMinutes: 5,
          },
        ],
      },
      {
        title: 'Pomodoro Block 4',
        offsetMinutes: 105,
        durationMinutes: 30,
        steps: [
          {
            title: 'Work Session',
            offsetMinutes: 0,
            durationMinutes: 25,
          },
          {
            title: 'Final Break',
            offsetMinutes: 25,
            durationMinutes: 5,
          },
        ],
      },
    ],
  },
  
  {
    id: 'deep-work-4h',
    name: 'Deep Work Block (4h)',
    description: 'Focused deep work with strategic breaks',
    category: 'personal',
    icon: '🧠',
    milestones: [
      {
        title: 'Warm-up (Easy Tasks)',
        offsetMinutes: 0,
        durationMinutes: 30,
      },
      {
        title: 'Deep Work Session 1',
        offsetMinutes: 30,
        durationMinutes: 90,
      },
      {
        title: 'Movement Break',
        offsetMinutes: 120,
        durationMinutes: 15,
      },
      {
        title: 'Deep Work Session 2',
        offsetMinutes: 135,
        durationMinutes: 90,
      },
      {
        title: 'Review & Planning',
        offsetMinutes: 225,
        durationMinutes: 15,
      },
    ],
  },
  
  // ============================================================================
  // PROJECT TEMPLATES
  // ============================================================================
  
  {
    id: 'project-kickoff-2h',
    name: 'Project Kickoff (2h)',
    description: 'Launch a new project with full alignment',
    category: 'project',
    icon: '🚀',
    milestones: [
      {
        title: 'Welcome & Team Introductions',
        offsetMinutes: 0,
        durationMinutes: 15,
      },
      {
        title: 'Project Vision & Goals',
        offsetMinutes: 15,
        durationMinutes: 30,
      },
      {
        title: 'Scope & Requirements',
        offsetMinutes: 45,
        durationMinutes: 30,
      },
      {
        title: 'Timeline & Milestones',
        offsetMinutes: 75,
        durationMinutes: 20,
      },
      {
        title: 'Roles & Responsibilities',
        offsetMinutes: 95,
        durationMinutes: 15,
      },
      {
        title: 'Risk Assessment',
        offsetMinutes: 110,
        durationMinutes: 10,
      },
    ],
  },
];

// Helper functions
export function getTemplatesByCategory(category: AgendaTemplate['category']): AgendaTemplate[] {
  return AGENDA_TEMPLATES.filter(t => t.category === category);
}

export function getTemplateById(id: string): AgendaTemplate | undefined {
  return AGENDA_TEMPLATES.find(t => t.id === id);
}

export function suggestTemplate(
  eventTitle: string,
  eventDurationMinutes: number
): AgendaTemplate | null {
  const titleLower = eventTitle.toLowerCase();
  
  // Smart matching based on keywords
  if (titleLower.includes('standup') || titleLower.includes('daily sync')) {
    return getTemplateById('standup-15min') || null;
  }
  
  if (titleLower.includes('sprint planning') || titleLower.includes('planning')) {
    return getTemplateById('sprint-planning-2h') || null;
  }
  
  if (titleLower.includes('retrospective') || titleLower.includes('retro')) {
    return getTemplateById('retrospective-1h') || null;
  }
  
  if (titleLower.includes('1-on-1') || titleLower.includes('1:1') || titleLower.includes('one on one')) {
    return getTemplateById('one-on-one-30min') || null;
  }
  
  if (titleLower.includes('workshop') && eventDurationMinutes >= 360) {
    return getTemplateById('design-workshop-fullday') || null;
  }
  
  if (titleLower.includes('pomodoro') || titleLower.includes('focus')) {
    return getTemplateById('pomodoro-2h') || null;
  }
  
  if (titleLower.includes('deep work')) {
    return getTemplateById('deep-work-4h') || null;
  }
  
  if (titleLower.includes('kickoff')) {
    return getTemplateById('project-kickoff-2h') || null;
  }
  
  if (titleLower.includes('training') || titleLower.includes('course')) {
    return getTemplateById('training-halfday') || null;
  }
  
  // Default: suggest based on duration
  if (eventDurationMinutes <= 30) {
    return getTemplateById('standup-15min') || null;
  } else if (eventDurationMinutes <= 90) {
    return getTemplateById('one-on-one-30min') || null;
  } else if (eventDurationMinutes <= 180) {
    return getTemplateById('sprint-planning-2h') || null;
  } else if (eventDurationMinutes <= 300) {
    return getTemplateById('training-halfday') || null;
  } else {
    return getTemplateById('design-workshop-fullday') || null;
  }
}
