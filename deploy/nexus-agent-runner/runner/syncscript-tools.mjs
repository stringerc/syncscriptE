/**
 * Bridge from agent → existing SyncScript Nexus tools (executeNexusTool).
 * Calls the existing Edge route /make-server-57781ad9/phone/nexus-execute,
 * which is already gated by x-nexus-internal-secret + impersonates a user
 * via { kind: 'phone', userId }. Lets the agent reuse every tool Nexus
 * voice/chat already supports — same audit trail, same RLS path.
 */

const SUPABASE_URL = process.env.SUPABASE_URL;
const SECRET = process.env.NEXUS_PHONE_EDGE_SECRET;

export const SYNCSCRIPT_TOOL_SCHEMAS = [
  {
    type: 'function',
    function: {
      name: 'create_task',
      description: 'Create a SyncScript task for the user.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          priority: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
          due_date_iso: { type: 'string' },
        },
        required: ['title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_to_resource_library',
      description: 'Save a URL or note to the user\'s resource library.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string' },
          title: { type: 'string' },
          description: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
        },
        required: ['url', 'title'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_document',
      description: 'Create a Markdown document and open it in the user\'s canvas.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          content: { type: 'string', description: 'Full document content in Markdown' },
          format: { type: 'string', enum: ['document', 'spreadsheet', 'invoice'] },
        },
        required: ['title', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'add_note',
      description: 'Quick note to the user (saved as a low-priority task).',
      parameters: {
        type: 'object',
        properties: { title: { type: 'string' }, body: { type: 'string' } },
        required: ['title', 'body'],
      },
    },
  },
];

/**
 * Bridge to the Edge function. The /phone/nexus-execute endpoint currently
 * only handles task creation, so we adapt other tools by mapping them to
 * tasks with semantic prefixes/payloads. This gives the user a real saved
 * artifact for every tool the agent calls without needing new endpoints.
 *
 * Mapping table:
 *   create_task              → task as-is
 *   add_to_resource_library  → task title="[Bookmark] <title>", body has url+desc+tags
 *   add_note                 → task priority="low" with body
 *   create_document          → task title="[Doc] <title>", body has full content
 */
function tooltoTaskRequest(name, args) {
  switch (name) {
    case 'create_task':
      return {
        title: String(args.title || 'Untitled'),
        description: String(args.description || ''),
        priority: ['low', 'medium', 'high', 'urgent'].includes(String(args.priority)) ? args.priority : 'medium',
        ...(args.due_date_iso ? { dueDate: args.due_date_iso } : {}),
        source: 'agent',
      };
    case 'add_to_resource_library': {
      const tags = Array.isArray(args.tags) ? args.tags.join(', ') : '';
      const desc = [
        args.url ? `URL: ${args.url}` : '',
        args.description ? args.description : '',
        tags ? `Tags: ${tags}` : '',
      ].filter(Boolean).join('\n\n');
      return {
        title: `[Bookmark] ${String(args.title || args.url || 'Saved link')}`,
        description: desc || (args.url || ''),
        priority: 'low',
        source: 'agent_library',
      };
    }
    case 'add_note':
      return {
        title: String(args.title || 'Note'),
        description: String(args.body || ''),
        priority: 'low',
        source: 'agent_note',
      };
    case 'create_document':
      return {
        title: `[Doc] ${String(args.title || 'Untitled')}`,
        description: String(args.content || '').slice(0, 4000),
        priority: 'medium',
        source: 'agent_document',
      };
    default:
      return null;
  }
}

export async function executeSyncScriptTool({ userId, name, argumentsJson }) {
  if (!SUPABASE_URL || !SECRET) throw new Error('SUPABASE_URL or NEXUS_PHONE_EDGE_SECRET missing');

  let parsedArgs = {};
  try { parsedArgs = typeof argumentsJson === 'string' ? JSON.parse(argumentsJson) : (argumentsJson || {}); }
  catch { parsedArgs = {}; }

  const taskBody = tooltoTaskRequest(name, parsedArgs);
  if (!taskBody) return { ok: false, error: `unknown_tool:${name}` };

  const url = `${SUPABASE_URL.replace(/\/$/, '')}/functions/v1/make-server-57781ad9/phone/nexus-execute`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-nexus-internal-secret': SECRET,
    },
    body: JSON.stringify({ userId, task: taskBody }),
    signal: AbortSignal.timeout(30_000),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text.slice(0, 200) }; }
  if (!res.ok) return { ok: false, status: res.status, error: json?.error || text.slice(0, 200) };
  // /phone/nexus-execute returns the normalized task object directly. Wrap.
  return { ok: true, task_id: json?.id, title: json?.title, mapped_from: name };
}
