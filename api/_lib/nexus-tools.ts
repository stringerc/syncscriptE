/**
 * Allowlisted Nexus tools (signed-in only). Schemas are OpenAI function format.
 */
export const NEXUS_TOOL_DEFINITIONS = [
  {
    type: 'function' as const,
    function: {
      name: 'create_task',
      description:
        'Create a task in the user\'s SyncScript task list. Call this function whenever the user wants to save, add, create, or remember a task/todo/reminder — this is the only way to persist a task.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string', description: 'Short task title' },
          description: { type: 'string', description: 'Optional extra detail' },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'urgent'],
            description: 'Default medium if unsure',
          },
          due_date_iso: {
            type: 'string',
            description: 'Optional ISO 8601 datetime for due date',
          },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'add_note',
      description:
        'Save a free-form note as a lightweight item in the user\'s task list (tagged as a note). Use for thoughts, parking ideas, or context they want kept.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string', description: 'One-line label for the note' },
          body: { type: 'string', description: 'Note contents' },
        },
        required: ['title', 'body'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'propose_calendar_hold',
      description:
        'Propose a calendar time block. Does NOT write to the calendar — it returns a structured proposal the app can confirm. Use when the user wants to block or schedule time.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string', description: 'What the block is for' },
          start_iso: { type: 'string', description: 'Start time ISO 8601' },
          duration_minutes: { type: 'number', description: 'Length in minutes', minimum: 15, maximum: 480 },
        },
        required: ['title', 'start_iso', 'duration_minutes'],
      },
    },
  },
];

export type NexusToolName = 'create_task' | 'add_note' | 'propose_calendar_hold';

export interface NexusToolTraceEntry {
  tool: string;
  ok: boolean;
  detail?: Record<string, unknown>;
  error?: string;
}

/** Appended to phone system prompt when using canonical Nexus tools (Twilio). */
export const NEXUS_PHONE_TOOLS_APPEND = `
TOOL USE (phone call, user is authenticated by SyncScript user id):
- You may call: create_task, add_note, propose_calendar_hold.
- create_task is the ONLY way to persist a to-do, reminder, or "wake me at 8" style item in their task list. Use create_task with title and optional due_date_iso for time-specific reminders.
- add_note saves a free-form note as a task-shaped item.
- propose_calendar_hold does NOT create a task — only a proposal. If they want something to appear in Tasks, use create_task.
- Never say you added or saved something unless the tool result JSON says ok: true. If ok is false, apologize briefly and suggest adding it in the app.
- Keep spoken replies short (1–3 sentences). No markdown.`;
