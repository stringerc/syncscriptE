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

export async function executeSyncScriptTool({ userId, name, argumentsJson }) {
  if (!SUPABASE_URL || !SECRET) throw new Error('SUPABASE_URL or NEXUS_PHONE_EDGE_SECRET missing');
  const url = `${SUPABASE_URL.replace(/\/$/, '')}/functions/v1/make-server-57781ad9/phone/nexus-execute`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-nexus-internal-secret': SECRET,
    },
    body: JSON.stringify({
      userId,
      name,
      args: argumentsJson || '{}',
      surface: 'agent',
    }),
    signal: AbortSignal.timeout(30_000),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { ok: false, raw: text.slice(0, 200) }; }
  if (!res.ok) return { ok: false, status: res.status, error: json?.error || text.slice(0, 200) };
  return json;
}
