import { callChatCompletion, type ChatCompletionMessage } from './ai-service';
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
  /\b(create|add|put|make|set\s+up|remind|schedule|save|capture|log).{0,48}(task|todo|reminder|action\s+item|item)\b/i;

/** Phrases like "wake up at 8" / "remind me to …" often omit the word "task" — still need create_task. */
function userSoundsLikeTheyWantATaskSaved(lastUser: string): boolean {
  const u = lastUser.trim();
  if (!u) return false;
  if (CREATE_TASK_INTENT_RE.test(u)) return true;
  if (/\bremind\s+me\s+to\b/i.test(u)) return true;
  if (/\b(wake|get)\s+up\s+at\b/i.test(u)) return true;
  if (/\badd\s+(?:a\s+)?(?:task|reminder|todo)\b/i.test(u)) return true;
  if (/\b(create|add)\s+(?:a\s+)?(?:task|reminder|todo)\b/i.test(u)) return true;
  return false;
}

function shouldNudgeToolCall(toolTrace: NexusToolTraceEntry[], lastUser: string, round: number): boolean {
  if (round !== 0) return false;
  if (!lastUser.trim()) return false;
  if (!userSoundsLikeTheyWantATaskSaved(lastUser)) return false;
  if (toolTrace.some((t) => t.tool === 'create_task' && t.ok)) return false;
  return true;
}

const TOOL_NUDGE_MESSAGE =
  'Required: call the create_task tool now with a title (and optional due_date_iso) to save this in the user\'s task list. Do not say the task was created until the tool result confirms it.';

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

  let lastProvider = '';
  let lastModel = '';
  let toolRepairNudged = false;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const { message, provider, model } = await callChatCompletion(working, {
      tools: NEXUS_TOOL_DEFINITIONS,
      tool_choice: 'auto',
      maxTokens: params.maxTokens ?? 600,
      temperature: round > 0 ? Math.min(0.2, (params.temperature ?? 0.35) * 0.5) : (params.temperature ?? 0.35),
    });

    lastProvider = provider;
    lastModel = model;

    const toolCalls = getToolCalls(message);
    const textContent = typeof message.content === 'string' ? message.content : '';

    if (!toolCalls.length) {
      const lastUser = getLastUserText(working);
      if (shouldNudgeToolCall(toolTrace, lastUser, round)) {
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
