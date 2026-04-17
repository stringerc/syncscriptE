import { callChatCompletion, type ChatCompletionMessage } from './ai-service';
import { userSoundsLikeDocumentEditIntent } from './nexus-document-intent';
import { executeNexusTool, type NexusActor, type NexusExecMeta } from './nexus-actions-executor';
import { NEXUS_TOOL_DEFINITIONS, type NexusToolTraceEntry } from './nexus-tools';

const MAX_TOOL_ROUNDS = 4;

/** Some providers return function.arguments as an object instead of a JSON string. */
function normalizeToolCallArguments(tc: any): { name: string; arguments: string } | null {
  const fn = tc?.function;
  if (!fn?.name) return null;
  let args = fn.arguments;
  if (args == null) args = '{}';
  if (typeof args === 'object') {
    try {
      args = JSON.stringify(args);
    } catch {
      args = '{}';
    }
  }
  if (typeof args !== 'string') args = String(args);
  return { name: String(fn.name), arguments: args };
}

function getToolCalls(message: Record<string, unknown>): Array<{
  id: string;
  type: string;
  function: { name: string; arguments: string };
}> {
  const raw = message.tool_calls;
  if (!Array.isArray(raw)) return [];
  const out: Array<{
    id: string;
    type: string;
    function: { name: string; arguments: string };
  }> = [];
  raw.forEach((tc: any, i: number) => {
    if (!tc || typeof tc !== 'object') return;
    const norm = normalizeToolCallArguments(tc);
    if (!norm) return;
    const id = typeof tc.id === 'string' && tc.id ? tc.id : `call_${Date.now()}_${i}`;
    out.push({
      id,
      type: typeof tc.type === 'string' ? tc.type : 'function',
      function: norm,
    });
  });
  return out;
}

function getLastUserText(messages: ChatCompletionMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const m = messages[i];
    if (m?.role === 'user' && typeof m.content === 'string') return m.content;
  }
  return '';
}

/** User asked to create/add a task but model may reply with prose only. */
const CREATE_TASK_INTENT_RE =
  /\b(create|add|put|make|set\s+up|remind|schedule|save|capture|log|track|write\s+down|jot\s+down|note\s+down|record).{0,48}(task|todo|reminder|action\s+item|item|to-do|to\s+do)\b/i;

/** Phrases like "wake up at 8" / "remind me to …" often omit the word "task" — still need create_task. */
export function phoneUserSoundsLikeTaskPersistIntent(lastUser: string): boolean {
  const u = lastUser.trim();
  if (!u) return false;
  if (CREATE_TASK_INTENT_RE.test(u)) return true;
  if (/\bremind\s+me\s+to\b/i.test(u)) return true;
  if (/\b(wake|get)\s+up\s+at\b/i.test(u)) return true;
  if (/\badd\s+(?:a\s+)?(?:task|reminder|todo|to-do)\b/i.test(u)) return true;
  if (/\b(create|add)\s+(?:a\s+)?(?:task|reminder|todo|to-do)\b/i.test(u)) return true;
  if (/\bput\b.{0,30}\b(on\s+my\s+(list|tasks|to-?do)|in\s+my\s+(tasks|list|to-?do))\b/i.test(u)) return true;
  if (/\bdon'?t\s+let\s+me\s+forget\b/i.test(u)) return true;
  if (/\bnote\s+(to\s+self|down)\b/i.test(u)) return true;
  if (/\b(write|jot)\s+down\b/i.test(u)) return true;
  if (/\btrack\s+(?:my\s+)?\w/i.test(u)) return true;
  if (/\bi\s+need\s+to\b.{2,60}$/i.test(u)) return true;
  if (/\bmake\s+sure\s+i\b/i.test(u)) return true;
  if (/\bcan\s+you\s+(save|add|create|remember|track)\b/i.test(u)) return true;
  if (/\b(save|remember)\s+(this|that)\b/i.test(u)) return true;
  return false;
}

/** Only nudge on early rounds; after this we stop retrying to avoid burning tokens. */
const MAX_TASK_PERSIST_NUDGE_ROUNDS = 3;

/**
 * Re-nudge when the model returns prose instead of create_task — previously we only nudged on round 0,
 * so one missed tool call produced a false "couldn't save from this call" on phone.
 * Intent must come from the original user utterance, not synthetic follow-ups (e.g. TOOL_NUDGE_MESSAGE).
 */
function shouldNudgeToolCall(
  toolTrace: NexusToolTraceEntry[],
  originalUserUtterance: string,
  round: number,
): boolean {
  if (round >= MAX_TASK_PERSIST_NUDGE_ROUNDS) return false;
  if (!originalUserUtterance.trim()) return false;
  if (!phoneUserSoundsLikeTaskPersistIntent(originalUserUtterance)) return false;
  if (toolTrace.some((t) => t.tool === 'create_task' && t.ok)) return false;
  return true;
}

const TOOL_NUDGE_MESSAGE =
  'Required: call the create_task tool now with a title (and optional due_date_iso) to save this in the user\'s task list. Do not say the task was created until the tool result confirms it.';

const UPDATE_DOC_NUDGE_MESSAGE =
  'Required: call the update_document tool now with the FULL replacement Markdown so the editable canvas updates. Do not put the full revision only in chat.';

const MAX_UPDATE_DOC_NUDGE_ROUNDS = 2;

function shouldNudgeUpdateDocument(
  toolTrace: NexusToolTraceEntry[],
  originalUserUtterance: string,
  round: number,
): boolean {
  if (round >= MAX_UPDATE_DOC_NUDGE_ROUNDS) return false;
  if (!originalUserUtterance.trim()) return false;
  if (!userSoundsLikeDocumentEditIntent(originalUserUtterance)) return false;
  if (toolTrace.some((t) => t.tool === 'update_document' && t.ok)) return false;
  if (!toolTrace.some((t) => t.tool === 'create_document' && t.ok)) return false;
  return true;
}

/**
 * Multi-round tool loop: assistant may call tools; we execute server-side and feed results back.
 */
export async function runNexusToolLoop(params: {
  messages: ChatCompletionMessage[];
  actor: NexusActor;
  meta: NexusExecMeta;
  maxTokens?: number;
  temperature?: number;
}): Promise<{
  content: string;
  toolTrace: NexusToolTraceEntry[];
  provider: string;
  model: string;
  toolRepairNudged?: boolean;
}> {
  const working: ChatCompletionMessage[] = [...params.messages];
  const toolTrace: NexusToolTraceEntry[] = [];
  const persistIntentSource = getLastUserText(params.messages);

  let lastProvider = '';
  let lastModel = '';
  let toolRepairNudged = false;

  const hasTaskIntent = phoneUserSoundsLikeTaskPersistIntent(persistIntentSource);
  const isPhone = params.meta.surface === 'phone';

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const alreadyCreated = toolTrace.some((t) => t.tool === 'create_task' && t.ok);
    const forceCreateTask = hasTaskIntent && !alreadyCreated && round <= 1 && !isPhone;
    const toolChoice: 'auto' | Record<string, unknown> = forceCreateTask
      ? { type: 'function', function: { name: 'create_task' } }
      : 'auto';

    const { message, provider, model } = await callChatCompletion(working, {
      tools: NEXUS_TOOL_DEFINITIONS,
      tool_choice: toolChoice,
      maxTokens: params.maxTokens ?? 600,
      temperature: round > 0 ? Math.min(0.2, (params.temperature ?? 0.35) * 0.5) : (params.temperature ?? 0.35),
    });

    lastProvider = provider;
    lastModel = model;

    const toolCalls = getToolCalls(message);
    const textContent = typeof message.content === 'string' ? message.content : '';

    if (!toolCalls.length) {
      if (shouldNudgeUpdateDocument(toolTrace, persistIntentSource, round)) {
        if (textContent.trim()) {
          working.push({ role: 'assistant', content: textContent });
        }
        working.push({ role: 'user', content: UPDATE_DOC_NUDGE_MESSAGE });
        toolRepairNudged = true;
        continue;
      }
      if (shouldNudgeToolCall(toolTrace, persistIntentSource, round)) {
        if (textContent.trim()) {
          working.push({ role: 'assistant', content: textContent });
        }
        working.push({ role: 'user', content: TOOL_NUDGE_MESSAGE });
        toolRepairNudged = true;
        continue;
      }
      return {
        content: textContent.trim() || 'Done.',
        toolTrace,
        provider: lastProvider,
        model: lastModel,
        toolRepairNudged,
      };
    }

    working.push({
      role: 'assistant',
      content: message.content ?? null,
      tool_calls: message.tool_calls,
    });

    for (const tc of toolCalls) {
      const { trace, toolMessage } = await executeNexusTool(
        tc.function.name,
        tc.function.arguments,
        params.actor,
        params.meta,
      );
      toolTrace.push(trace);
      working.push({
        role: 'tool',
        tool_call_id: tc.id,
        content: toolMessage,
      });
    }
  }

  const final = await callChatCompletion(working, {
    maxTokens: params.maxTokens ?? 400,
    temperature: params.temperature ?? 0.35,
  });

  const finalText =
    typeof final.message.content === 'string' ? final.message.content : '';

  return {
    content: finalText.trim() || 'Done.',
    toolTrace,
    provider: final.provider,
    model: final.model,
    toolRepairNudged,
  };
}
