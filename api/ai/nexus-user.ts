import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getAuthenticatedSupabaseUser, validateAuth } from '../_lib/auth';
import { callAI, isAIConfigured, type AIMessage, type ChatCompletionMessage } from '../_lib/ai-service';
import { runNexusToolLoop } from '../_lib/nexus-tool-loop';
import { NEXUS_TOOLS_APPEND, NEXUS_VOICE_TOOLS_APPEND } from '../_lib/nexus-tool-prompts';
import { sanitizePrivateContext, serializePromptContext } from './_lib/nexus-context-firewall';
import { loadNexusBrain } from './_lib/nexus-brain/load-brain';
import { emitNexusTrace, newNexusRequestId } from './_lib/nexus-brain/telemetry';

const MAX_INPUT_MESSAGES = 12;

function buildPrivateSystemPrompt(privateContextBlock: string): string {
  const brain = loadNexusBrain();
  return `You are Nexus, SyncScript's authenticated in-app AI assistant.

ROLE:
- You can help with tasks, scheduling, productivity planning, and resonance-aware recommendations.
- Base your recommendations on the provided private user context when available.

BOUNDARY:
- This is the private signed-in Nexus surface.
- Never claim access to data that is not present in PRIVATE CONTEXT.
- If data is missing, ask a concise follow-up question.

BRAIN POLICY (${brain.signedInPolicyId}):
${brain.signedInAppendix}

RESPONSE STYLE:
- Be concise, practical, and action-oriented.
- Prefer clear numbered plans when giving recommendations.
- Keep responses grounded in the provided context and avoid speculation.

PRIVATE CONTEXT:
${privateContextBlock || 'No private context provided.'}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const requestId = newNexusRequestId();
  const t0 = Date.now();
  const brain = loadNexusBrain();
  res.setHeader('X-Nexus-Brain-Version', brain.manifest.version);
  res.setHeader('X-Nexus-Request-Id', requestId);

  const isAuthed = await validateAuth(req, res);
  if (!isAuthed) return;

  if (!isAIConfigured()) {
    emitNexusTrace({
      surface: 'user',
      requestId,
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
        content: buildPrivateSystemPrompt(serializePromptContext(privateContextResult.context)),
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

    if (enableTools) {
      const user = await getAuthenticatedSupabaseUser(req);
      if (!user) {
        emitNexusTrace({
          surface: 'user',
          requestId,
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
          : buildPrivateSystemPrompt(serializePromptContext(privateContextResult.context));

      const tail = `${NEXUS_TOOLS_APPEND}${voiceMode ? NEXUS_VOICE_TOOLS_APPEND : ''}`;
      const augmentedSystem = `${systemContent}\n\n${tail}`;

      const conv: ChatCompletionMessage[] = [
        { role: 'system', content: augmentedSystem },
        ...chatMessages
          .filter((m) => m.role !== 'system')
          .map((m) => ({ role: m.role, content: m.content }) as ChatCompletionMessage),
      ];

      const { content, toolTrace, provider, model, toolRepairNudged } = await runNexusToolLoop({
        messages: conv,
        actor: { kind: 'jwt', user },
        meta: { surface: voiceMode ? 'voice' : 'text', requestId },
        maxTokens: voiceMode ? 320 : 700,
        temperature: voiceMode ? 0.25 : 0.35,
      });

      emitNexusTrace({
        surface: 'user',
        requestId,
        outcome: 'ok',
        pathway: toolTrace.length ? 'tools' : 'llm',
        brainVersion: brain.manifest.version,
        latencyMs: Date.now() - t0,
        privateContextBytes,
        provider,
        model,
        httpStatus: 200,
        responseChars: content.length,
      });

      return res.status(200).json({
        content,
        source: 'nexus-user',
        toolTrace,
        model,
        provider,
        toolRepairNudged: Boolean(toolRepairNudged),
      });
    }

    const result = await callAI(chatMessages, {
      maxTokens: 500,
      temperature: 0.4,
    });

    emitNexusTrace({
      surface: 'user',
      requestId,
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
