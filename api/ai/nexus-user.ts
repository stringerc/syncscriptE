import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthenticatedSupabaseUser, validateAuth } from '../_lib/auth';
import { callAI, isAIConfigured, type AIMessage, type ChatCompletionMessage } from '../_lib/ai-service';
import { runNexusToolLoop } from '../_lib/nexus-tool-loop';
import { NEXUS_TOOLS_APPEND, NEXUS_VOICE_TOOLS_APPEND } from '../_lib/nexus-tool-prompts';
import { sanitizePrivateContext, serializePromptContext } from './_lib/nexus-context-firewall';
import { loadNexusBrain } from './_lib/nexus-brain/load-brain';
import { emitNexusTrace, newNexusRequestId } from './_lib/nexus-brain/telemetry';
import {
  getPrivateSystemPersonalityBlock,
  resolvePersonaMode,
  type NexusPersonaMode,
} from '../../integrations/nexus-persona/nexus-persona-halo-inspired';
import { userSoundsLikeDocumentEditIntent } from '../_lib/nexus-document-intent';

const MAX_INPUT_MESSAGES = 12;

function buildPrivateSystemPrompt(privateContextBlock: string, personaMode: NexusPersonaMode): string {
  const brain = loadNexusBrain();
  return `You are Nexus, SyncScript's authenticated in-app AI assistant.

${getPrivateSystemPersonalityBlock(personaMode)}

ROLE:
- You help with tasks, scheduling, productivity planning, and resonance-aware recommendations.
- You create documents, letters, reports, invoices, spreadsheets, and any written content the user asks for — using the create_document tool, which opens an editable canvas with PDF/DOCX/XLSX export. Use update_document when they ask to revise content already in the canvas.
- You create and manage tasks, notes, and calendar events using your tools.
- Base your recommendations on the provided private user context when available.

BOUNDARY:
- This is the private signed-in Nexus surface.
- Do not invent specific user data (tasks, events, account details) that is not present in PRIVATE CONTEXT.
- If user data is missing, ask a concise follow-up question.
- You DO have tools for creating documents, tasks, notes, and calendar events — use them when asked.

BRAIN POLICY (${brain.signedInPolicyId}):
${brain.signedInAppendix}

RESPONSE STYLE:
- Be concise, practical, and action-oriented.
- Prefer clear numbered plans when giving recommendations.
- When asked to create any document, letter, spreadsheet, CSV, template, or written content: use the create_document tool immediately. Do not describe what you would create — create it. When they want edits to an open document, use update_document with full replacement Markdown.

PRIVATE CONTEXT:
${privateContextBlock || 'No private context provided.'}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Nexus-Persona-Mode');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const requestId = newNexusRequestId();
  const t0 = Date.now();
  const brain = loadNexusBrain();
  res.setHeader('X-Nexus-Brain-Version', brain.manifest.version);
  res.setHeader('X-Nexus-Request-Id', requestId);

  const isAuthed = await validateAuth(req, res);
  if (!isAuthed) return;

  const rawBody =
    req.body && typeof req.body === 'object' ? (req.body as { personaMode?: string }) : {};
  const headerPersona =
    typeof req.headers['x-nexus-persona-mode'] === 'string'
      ? req.headers['x-nexus-persona-mode']
      : undefined;
  const personaMode = resolvePersonaMode(
    process.env.NEXUS_PERSONA_MODE,
    rawBody.personaMode ?? headerPersona,
  );

  if (!isAIConfigured()) {
    emitNexusTrace({
      surface: 'user',
      requestId,
      personaMode,
      outcome: 'ai_unconfigured',
      pathway: 'llm',
      brainVersion: brain.manifest.version,
      latencyMs: Date.now() - t0,
      httpStatus: 500,
      errorCode: 'ai_unconfigured',
    });
    return res.status(500).json({ error: 'AI service not configured' });
  }

  try {
    const { message, messages, privateContext } = req.body || {};

    const privateContextResult = sanitizePrivateContext(privateContext);
    if (!privateContextResult.valid) {
      emitNexusTrace({
        surface: 'user',
        requestId,
        personaMode,
        outcome: 'validation_error',
        pathway: 'llm',
        brainVersion: brain.manifest.version,
        latencyMs: Date.now() - t0,
        httpStatus: 400,
        errorCode: 'invalid_private_context',
      });
      return res.status(400).json({ error: privateContextResult.reason || 'Invalid private context payload' });
    }

    const trimmedMessages = Array.isArray(messages)
      ? messages
          .filter((m: any) => m.role === 'user' || m.role === 'assistant')
          .slice(-MAX_INPUT_MESSAGES)
      : [];

    const chatMessages: AIMessage[] = [
      {
        role: 'system',
        content: buildPrivateSystemPrompt(serializePromptContext(privateContextResult.context), personaMode),
      },
    ];

    if (trimmedMessages.length > 0) {
      chatMessages.push(
        ...trimmedMessages.map((m: any) => ({
          role: m.role,
          content: typeof m.content === 'string' ? m.content : '',
        })),
      );
    } else if (typeof message === 'string' && message.trim()) {
      chatMessages.push({ role: 'user', content: message.trim() });
    } else {
      emitNexusTrace({
        surface: 'user',
        requestId,
        personaMode,
        outcome: 'validation_error',
        pathway: 'llm',
        brainVersion: brain.manifest.version,
        latencyMs: Date.now() - t0,
        privateContextBytes: Buffer.byteLength(
          serializePromptContext(privateContextResult.context),
          'utf8',
        ),
        httpStatus: 400,
        errorCode: 'no_message',
      });
      return res.status(400).json({ error: 'No message provided' });
    }

    const privateContextBytes = Buffer.byteLength(
      serializePromptContext(privateContextResult.context),
      'utf8',
    );

    const body = req.body || {};
    const enableTools = Boolean(body.enableTools);
    const voiceMode = Boolean(body.voiceMode);
    const agentId = typeof body.agentId === 'string' ? body.agentId.trim() : '';
    const agentPersonaPrompt = typeof body.agentPersonaPrompt === 'string' ? body.agentPersonaPrompt.trim() : '';

    if (enableTools) {
      const user = await getAuthenticatedSupabaseUser(req);
      if (!user) {
        emitNexusTrace({
          surface: 'user',
          requestId,
          personaMode,
          outcome: 'validation_error',
          pathway: 'tools',
          brainVersion: brain.manifest.version,
          latencyMs: Date.now() - t0,
          privateContextBytes,
          httpStatus: 401,
          errorCode: 'tools_require_user',
        });
        return res.status(401).json({ error: 'Tools require a signed-in session' });
      }

      const systemContent =
        chatMessages[0]?.role === 'system'
          ? String(chatMessages[0].content || '')
          : buildPrivateSystemPrompt(serializePromptContext(privateContextResult.context), personaMode);

      const personaBlock = agentPersonaPrompt
        ? `\nAGENT PERSONA (you are responding as this specialist):\n${agentPersonaPrompt}\nRespond from this agent's perspective. Stay in character.\n`
        : '';
      const tail = `${NEXUS_TOOLS_APPEND}${voiceMode ? NEXUS_VOICE_TOOLS_APPEND : ''}`;
      const augmentedSystem = `${systemContent}${personaBlock}\n\n${tail}`;

      const userAndAssistantMsgs = chatMessages
        .filter((m) => m.role !== 'system')
        .map((m) => ({ role: m.role, content: m.content }) as ChatCompletionMessage);

      const lastUserTurn =
        [...userAndAssistantMsgs].reverse().find((m) => m.role === 'user')?.content;
      const lastUserString = typeof lastUserTurn === 'string' ? lastUserTurn.trim() : '';
      const userMsgCount = userAndAssistantMsgs.filter((m) => m.role === 'user').length;
      const docEditReminder =
        lastUserString &&
        userSoundsLikeDocumentEditIntent(lastUserString) &&
        userMsgCount >= 2
          ? ' If the user is revising a document you already created or that is open in the canvas, call update_document with the full replacement Markdown — do not put the full revision only in chat.'
          : '';

      const conv: ChatCompletionMessage[] = [
        { role: 'system', content: augmentedSystem },
        ...userAndAssistantMsgs,
        ...(userAndAssistantMsgs.length > 2
          ? [
              {
                role: 'system' as const,
                content: `REMINDER: You are ${agentId && agentId !== 'nexus' ? `responding as a specialist agent. Stay in your persona.` : 'Nexus.'} You already have the user's identity. NEVER ask for user ID or credentials. Your tools match the system prompt: tasks, notes, calendar, documents, invoice, e-sign, and concierge playbooks (enqueue_playbook, get_playbook_status, cancel_playbook_run). For any document/letter/report/spreadsheet/CSV/canvas request, call create_document immediately.${docEditReminder}`,
              },
            ]
          : []),
      ];

      const { content, toolTrace, provider, model, toolRepairNudged } = await runNexusToolLoop({
        messages: conv,
        actor: { kind: 'jwt', user },
        meta: { surface: voiceMode ? 'voice' : 'text', requestId },
        maxTokens: voiceMode ? 320 : 2048,
        temperature: voiceMode ? 0.25 : 0.35,
      });

      emitNexusTrace({
        surface: 'user',
        requestId,
        personaMode,
        outcome: 'ok',
        pathway: toolTrace.length ? 'tools' : 'llm',
        brainVersion: brain.manifest.version,
        latencyMs: Date.now() - t0,
        privateContextBytes,
        provider,
        model,
        httpStatus: 200,
        responseChars: content.length,
        toolTraceEntries: toolTrace.length,
        toolRepairNudged: Boolean(toolRepairNudged),
      });

      return res.status(200).json({
        content,
        source: 'nexus-user',
        toolTrace,
        model,
        provider,
        toolRepairNudged: Boolean(toolRepairNudged),
        ...(agentId ? { agentId } : {}),
      });
    }

    const result = await callAI(chatMessages, {
      maxTokens: 500,
      temperature: 0.4,
    });

    emitNexusTrace({
      surface: 'user',
      requestId,
      personaMode,
      outcome: 'ok',
      pathway: 'llm',
      brainVersion: brain.manifest.version,
      latencyMs: Date.now() - t0,
      privateContextBytes,
      provider: result.provider,
      model: result.model,
      httpStatus: 200,
      responseChars: result.content.length,
    });

    return res.status(200).json({
      content: result.content,
      source: 'nexus-user',
    });
  } catch (error: any) {
    console.error('Nexus user handler error:', error);
    emitNexusTrace({
      surface: 'user',
      requestId,
      personaMode,
      outcome: 'error',
      pathway: 'llm',
      brainVersion: brain.manifest.version,
      latencyMs: Date.now() - t0,
      httpStatus: 500,
      errorCode: 'llm_failed',
    });
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}
