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
  {
    type: 'function' as const,
    function: {
      name: 'create_document',
      description:
        'Generate a document for the user (letter, report, proposal, invoice, resume, spreadsheet, contract, or any formal document). Returns the document content which opens in an editable canvas where the user can edit and export to PDF/DOCX/XLSX. Use this whenever the user asks you to write, draft, create, or generate a document, letter, report, invoice, resume, or similar.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string', description: 'Document title' },
          content: { type: 'string', description: 'Full document content in Markdown format. Use headings (#, ##, ###), bold (**text**), italic (*text*), lists (- item), horizontal rules (---), and tables (| col | col |) for structure.' },
          format: {
            type: 'string',
            enum: ['document', 'spreadsheet', 'invoice'],
            description: 'document for letters/reports/proposals/resumes, spreadsheet for tabular data, invoice for invoices',
          },
        },
        required: ['title', 'content'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'update_document',
      description:
        'Replace the document currently open in the user\'s canvas with revised Markdown content. Use when the user asks to edit, shorten, expand, translate, restructure, or change a document you already created (or that is open). Pass the FULL replacement content — same rules as create_document.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string', description: 'New document title (optional if unchanged)' },
          content: { type: 'string', description: 'Complete replacement document in Markdown (headings, lists, tables, etc.)' },
          format: {
            type: 'string',
            enum: ['document', 'spreadsheet', 'invoice'],
            description: 'Optional; defaults to current or document',
          },
        },
        required: ['content'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'send_invoice',
      description:
        'Create a professional invoice and send it via email to the specified recipient. Use when the user wants to invoice someone — this generates a beautifully formatted invoice email and sends it immediately.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          to_email: { type: 'string', description: 'Recipient email address' },
          to_name: { type: 'string', description: 'Recipient name or company (optional)' },
          items: {
            type: 'array',
            description: 'Line items on the invoice',
            items: {
              type: 'object',
              properties: {
                description: { type: 'string', description: 'Item description' },
                quantity: { type: 'number', description: 'Quantity (default 1)' },
                unit_price: { type: 'number', description: 'Price per unit in USD' },
              },
              required: ['description', 'unit_price'],
            },
          },
          tax_percent: { type: 'number', description: 'Tax rate as a percentage (e.g. 7.5 for 7.5%). Georgia is ~7.5%, California ~8.5%, etc.' },
          notes: { type: 'string', description: 'Optional payment terms, notes, or memo' },
          due_date: { type: 'string', description: 'Optional due date (e.g. "April 25, 2026" or ISO date)' },
        },
        required: ['to_email', 'items'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'send_document_for_signature',
      description:
        'Send a document for e-signature via Firma. Use after drafting with create_document when the user wants a contract or agreement signed. Requires signer email and document body text.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title: { type: 'string', description: 'Document title' },
          content: { type: 'string', description: 'Full text of the document to sign' },
          signer_email: { type: 'string', description: 'Signer email' },
          signer_name: { type: 'string', description: 'Signer full name' },
        },
        required: ['title', 'content', 'signer_email'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'enqueue_playbook',
      description:
        'Start a concierge playbook run (automation DAG: tasks, email waits, scripted third-party calls). Returns run_id and correlation_id for tracking. Use when the user wants scripted workflows beyond a single tool call.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          slug: { type: 'string', description: 'Playbook slug from the Scripts / playbooks catalog (e.g. concierge_demo_v1).' },
          context: {
            type: 'object',
            description: 'Inputs for the playbook (e.g. venue_phone E.164 for tier-3 demo).',
          },
        },
        required: ['slug'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_playbook_status',
      description: 'Read status for a playbook run the user started (run_id from enqueue_playbook).',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          run_id: { type: 'string', description: 'UUID of the playbook run' },
        },
        required: ['run_id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'cancel_playbook_run',
      description: 'Cancel a running or waiting playbook run.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          run_id: { type: 'string', description: 'UUID of the playbook run' },
        },
        required: ['run_id'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'search_places',
      description: 'Search for live places, restaurants, or locations in the world. Use this whenever the user asks to find a restaurant, shop, or venue near a specific location.',
      parameters: {
        type: 'object',
        additionalProperties: false,
        properties: {
          query: { type: 'string', description: 'What to search for, e.g. "Italian restaurants in New York City" or "coffee shops in Miami"' },
        },
        required: ['query'],
      },
    },
  },
];

export type NexusToolName =
  | 'create_task'
  | 'add_note'
  | 'propose_calendar_hold'
  | 'create_document'
  | 'update_document'
  | 'send_invoice'
  | 'send_document_for_signature'
  | 'enqueue_playbook'
  | 'get_playbook_status'
  | 'cancel_playbook_run'
  | 'search_places';

export interface NexusToolTraceEntry {
  tool: string;
  ok: boolean;
  detail?: Record<string, unknown>;
  error?: string;
}

/** Appended to phone system prompt when using canonical Nexus tools (Twilio). */
export const NEXUS_PHONE_TOOLS_APPEND = `
TOOL USE (phone call, user is authenticated by SyncScript user id):
- You may call: create_task, add_note, propose_calendar_hold, send_invoice, send_document_for_signature, search_places.
- Playbook tools (enqueue_playbook, get_playbook_status, cancel_playbook_run) require a signed-in JWT and are not available on the phone path; if asked, say they can start playbooks in the app chat.
- search_places fetches real-world data like restaurants or venues. It allows you to find physical locations.
- create_task is the ONLY way to persist a to-do, reminder, or "wake me at 8" style item in their task list. Use create_task with title and optional due_date_iso for time-specific reminders.
- add_note saves a free-form note as a task-shaped item.
- propose_calendar_hold saves a calendar event on the phone (it will appear in their tasks and schedule). Use it when the user wants to add, schedule, or block time for something. Provide title, start_iso, and duration_minutes.
- send_invoice creates and SENDS a professional invoice email. Use it when the user says "send an invoice to [email]" or "invoice [person]". Provide to_email, items (description + unit_price), and tax_percent if they mention a state. Default quantity to 1 if not specified.
- Never say you added or saved something unless the tool result JSON says ok: true. If ok is false, apologize briefly and suggest adding it in the app.
- Keep spoken replies short (1–3 sentences). No markdown.
- After confirming a tool action, always ask what's next. Example: "Done! What else you got?" or "Saved it. Anything else?"`;
