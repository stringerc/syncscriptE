/**
 * SyncScript Skill for OpenClaw
 * 
 * Provides tools for OpenClaw agents to interact with SyncScript data.
 * Install this skill in your OpenClaw skills directory.
 * 
 * Setup:
 *   1. Copy this directory to your OpenClaw skills folder
 *   2. Set environment variables (see SKILL.md)
 *   3. Restart OpenClaw or run `openclaw skills reload`
 */

// ─── Configuration ───────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SYNCSCRIPT_SUPABASE_URL || 'https://kwhnrlzibgfedtxpkbgb.supabase.co';
const SUPABASE_KEY = process.env.SYNCSCRIPT_SUPABASE_KEY || '';
const API_BASE = process.env.SYNCSCRIPT_API_BASE || `${SUPABASE_URL}/functions/v1/make-server-57781ad9`;

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`SyncScript API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// ─── Tool Definitions ────────────────────────────────────────────────────────

export const tools = {
  syncscript_get_tasks: {
    description: 'Get tasks from SyncScript with optional filters for status and priority',
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['active', 'completed', 'pending'],
          description: 'Filter tasks by status',
        },
        priority: {
          type: 'string',
          enum: ['high', 'medium', 'low'],
          description: 'Filter tasks by priority',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of tasks to return (default: 10)',
          default: 10,
        },
      },
    },
    handler: async (args: { status?: string; priority?: string; limit?: number }) => {
      try {
        const params = new URLSearchParams();
        if (args.status) params.set('status', args.status);
        if (args.priority) params.set('priority', args.priority);
        if (args.limit) params.set('limit', String(args.limit));

        const data = await apiCall(`/tasks?${params.toString()}`);
        return {
          success: true,
          tasks: data.tasks || data,
          count: Array.isArray(data) ? data.length : data.tasks?.length ?? 0,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch tasks',
          fallback: {
            tasks: [
              { id: '1', title: 'Budget allocation analysis', priority: 'high', status: 'active' },
              { id: '2', title: 'Review team performance metrics', priority: 'medium', status: 'active' },
              { id: '3', title: 'Update project documentation', priority: 'low', status: 'pending' },
            ],
            note: 'Using sample data — API may not be configured yet',
          },
        };
      }
    },
  },

  syncscript_get_goals: {
    description: 'Get goals and progress from SyncScript',
    parameters: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Filter goals by category',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of goals to return (default: 5)',
          default: 5,
        },
      },
    },
    handler: async (args: { category?: string; limit?: number }) => {
      try {
        const data = await apiCall('/goals');
        let goals = data.goals || data;
        if (args.category) {
          goals = goals.filter((g: any) => g.category?.toLowerCase() === args.category?.toLowerCase());
        }
        if (args.limit) {
          goals = goals.slice(0, args.limit);
        }
        return { success: true, goals, count: goals.length };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch goals',
          fallback: {
            goals: [
              { id: '1', title: 'Launch Finance Dashboard', progress: 68, category: 'Product' },
              { id: '2', title: 'Health & Wellness', progress: 92, category: 'Personal' },
              { id: '3', title: 'Team Onboarding', progress: 45, category: 'Management' },
            ],
            note: 'Using sample data — API may not be configured yet',
          },
        };
      }
    },
  },

  syncscript_get_energy: {
    description: 'Get current energy level, forecast, and peak/low hour predictions',
    parameters: {
      type: 'object',
      properties: {},
    },
    handler: async () => {
      try {
        const data = await apiCall('/energy/current');
        return { success: true, energy: data };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch energy',
          fallback: {
            energy: {
              current: 85,
              peakHours: [9, 10, 11],
              lowHours: [13, 14],
              forecast: [
                { hour: 9, energy: 90 },
                { hour: 10, energy: 85 },
                { hour: 11, energy: 80 },
                { hour: 12, energy: 70 },
                { hour: 13, energy: 60 },
                { hour: 14, energy: 55 },
                { hour: 15, energy: 65 },
                { hour: 16, energy: 75 },
              ],
            },
            note: 'Using sample data — API may not be configured yet',
          },
        };
      }
    },
  },

  syncscript_get_calendar: {
    description: 'Get upcoming calendar events from SyncScript',
    parameters: {
      type: 'object',
      properties: {
        days: {
          type: 'number',
          description: 'Number of days ahead to look (default: 7)',
          default: 7,
        },
        type: {
          type: 'string',
          enum: ['meeting', 'task', 'break', 'focus'],
          description: 'Filter events by type',
        },
      },
    },
    handler: async (args: { days?: number; type?: string }) => {
      try {
        const data = await apiCall(`/calendar/events?days=${args.days || 7}`);
        let events = data.events || data;
        if (args.type) {
          events = events.filter((e: any) => e.type === args.type);
        }
        return { success: true, events, count: events.length };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to fetch calendar',
          fallback: {
            events: [
              { id: '1', title: 'Team Standup', type: 'meeting', start: new Date(Date.now() + 3600000).toISOString() },
              { id: '2', title: 'Deep Work Block', type: 'focus', start: new Date(Date.now() + 7200000).toISOString() },
            ],
            note: 'Using sample data — API may not be configured yet',
          },
        };
      }
    },
  },

  syncscript_create_task: {
    description: 'Create a new task in SyncScript',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Task title (required)',
        },
        description: {
          type: 'string',
          description: 'Task description',
        },
        priority: {
          type: 'string',
          enum: ['high', 'medium', 'low'],
          description: 'Task priority (default: medium)',
          default: 'medium',
        },
        dueDate: {
          type: 'string',
          description: 'Due date in ISO format (e.g., 2026-01-25)',
        },
      },
      required: ['title'],
    },
    handler: async (args: { title: string; description?: string; priority?: string; dueDate?: string }) => {
      try {
        const data = await apiCall('/make/task/create', {
          method: 'POST',
          body: JSON.stringify({
            title: args.title,
            description: args.description || '',
            priority: args.priority || 'medium',
            dueDate: args.dueDate,
            status: 'todo',
          }),
        });
        return { success: true, task: data, message: `Task "${args.title}" created successfully` };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to create task',
          message: `Could not create task "${args.title}" — the API may not be configured yet`,
        };
      }
    },
  },

  syncscript_get_summary: {
    description: 'Get a productivity summary for a time period',
    parameters: {
      type: 'object',
      properties: {
        period: {
          type: 'string',
          enum: ['today', 'week', 'month'],
          description: 'Time period for the summary (default: today)',
          default: 'today',
        },
      },
    },
    handler: async (args: { period?: string }) => {
      try {
        const [tasksData, goalsData, energyData] = await Promise.allSettled([
          apiCall('/tasks'),
          apiCall('/goals'),
          apiCall('/energy/current'),
        ]);

        const tasks = tasksData.status === 'fulfilled' ? (tasksData.value.tasks || tasksData.value) : [];
        const goals = goalsData.status === 'fulfilled' ? (goalsData.value.goals || goalsData.value) : [];
        const energy = energyData.status === 'fulfilled' ? energyData.value : { current: 0 };

        const activeTasks = tasks.filter((t: any) => t.status === 'active');
        const completedTasks = tasks.filter((t: any) => t.status === 'completed');
        const highPriority = tasks.filter((t: any) => t.priority === 'high' && t.status !== 'completed');
        const avgGoalProgress = goals.length > 0
          ? Math.round(goals.reduce((sum: number, g: any) => sum + (g.progress || 0), 0) / goals.length)
          : 0;

        return {
          success: true,
          summary: {
            period: args.period || 'today',
            tasks: {
              total: tasks.length,
              active: activeTasks.length,
              completed: completedTasks.length,
              highPriority: highPriority.length,
            },
            goals: {
              total: goals.length,
              avgProgress: avgGoalProgress,
            },
            energy: {
              current: energy.current || 0,
              peakHours: energy.peakHours || [],
            },
          },
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get summary',
        };
      }
    },
  },
};

// ─── Skill Export ─────────────────────────────────────────────────────────────

export default {
  name: 'syncscript',
  version: '1.0.0',
  description: 'SyncScript productivity platform integration',
  tools,
};
