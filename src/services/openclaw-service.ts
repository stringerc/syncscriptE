/**
 * OpenClaw Service
 * 
 * HTTP client for OpenClaw's OpenAI-compatible Chat Completions API.
 * Supports both streaming (SSE) and non-streaming responses.
 * 
 * API Reference: https://docs.clawd.bot/gateway/openai-http-api
 * Tools API:     https://docs.clawd.bot/gateway/tools-invoke-http-api
 */

import type { OpenClawConfig } from '../config/openclaw';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  model?: string;
  messages: ChatMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
  user?: string;
}

export interface ChatCompletionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: 'assistant';
      content: string;
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface StreamDelta {
  role?: string;
  content?: string;
}

export interface StreamChunk {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: StreamDelta;
    finish_reason: string | null;
  }>;
}

export interface ToolInvokeRequest {
  tool: string;
  action?: string;
  args?: Record<string, unknown>;
  sessionKey?: string;
  dryRun?: boolean;
}

export interface ToolInvokeResponse {
  ok: boolean;
  result?: unknown;
  error?: { type: string; message: string };
}

export type OnStreamChunk = (content: string, done: boolean) => void;

export interface OpenClawServiceError {
  type: 'network' | 'auth' | 'server' | 'timeout' | 'config';
  message: string;
  status?: number;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class OpenClawService {
  private config: OpenClawConfig;
  private abortController: AbortController | null = null;

  constructor(config: OpenClawConfig) {
    this.config = config;
  }

  /**
   * Update the service configuration
   */
  updateConfig(config: OpenClawConfig): void {
    this.config = config;
  }

  /**
   * Check if the OpenClaw gateway is reachable
   */
  async healthCheck(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
    const start = performance.now();
    try {
      const response = await fetch(`${this.config.gatewayUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model: `openclaw:${this.config.agentId}`,
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 5,
        }),
        signal: AbortSignal.timeout(8000),
      });

      const latencyMs = Math.round(performance.now() - start);

      if (response.ok) {
        return { ok: true, latencyMs };
      }

      if (response.status === 401) {
        return { ok: false, latencyMs, error: 'Authentication failed. Check your token.' };
      }

      return { ok: false, latencyMs, error: `Gateway returned ${response.status}` };
    } catch (e) {
      const latencyMs = Math.round(performance.now() - start);
      const message = e instanceof Error ? e.message : 'Unknown error';

      if (message.includes('timeout') || message.includes('AbortError')) {
        return { ok: false, latencyMs, error: 'Gateway timed out (8s). Is it running?' };
      }
      if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
        return { ok: false, latencyMs, error: 'Cannot reach gateway. Check URL and ensure CORS is enabled.' };
      }

      return { ok: false, latencyMs, error: message };
    }
  }

  /**
   * Send a non-streaming chat completion request
   */
  async chat(messages: ChatMessage[], options?: Partial<ChatCompletionRequest>): Promise<ChatCompletionResponse> {
    const response = await this.fetchCompletions({
      model: `openclaw:${this.config.agentId}`,
      messages,
      stream: false,
      user: this.config.sessionUser,
      ...options,
    });

    if (!response.ok) {
      throw this.createError(response);
    }

    return response.json();
  }

  /**
   * Send a streaming chat completion request
   * Returns a cleanup function to abort the stream
   */
  async chatStream(
    messages: ChatMessage[],
    onChunk: OnStreamChunk,
    options?: Partial<ChatCompletionRequest>
  ): Promise<() => void> {
    // Abort any existing stream
    this.abort();
    this.abortController = new AbortController();

    const response = await this.fetchCompletions(
      {
        model: `openclaw:${this.config.agentId}`,
        messages,
        stream: true,
        user: this.config.sessionUser,
        ...options,
      },
      this.abortController.signal
    );

    if (!response.ok) {
      throw this.createError(response);
    }

    // Parse SSE stream
    this.parseSSEStream(response, onChunk);

    return () => this.abort();
  }

  /**
   * Invoke a tool directly via the Tools Invoke HTTP API
   */
  async invokeTool(request: ToolInvokeRequest): Promise<ToolInvokeResponse> {
    const response = await fetch(`${this.config.gatewayUrl}/tools/invoke`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(request),
      signal: AbortSignal.timeout(30000),
    });

    if (!response.ok) {
      throw this.createError(response);
    }

    return response.json();
  }

  /**
   * Abort any in-flight streaming request
   */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  // ─── Private ───────────────────────────────────────────────────────────────

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.token) {
      headers['Authorization'] = `Bearer ${this.config.token}`;
    }

    if (this.config.agentId && this.config.agentId !== 'main') {
      headers['x-openclaw-agent-id'] = this.config.agentId;
    }

    return headers;
  }

  private async fetchCompletions(
    body: ChatCompletionRequest,
    signal?: AbortSignal
  ): Promise<Response> {
    return fetch(`${this.config.gatewayUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
      signal: signal ?? AbortSignal.timeout(60000),
    });
  }

  private async parseSSEStream(response: Response, onChunk: OnStreamChunk): Promise<void> {
    const reader = response.body?.getReader();
    if (!reader) {
      onChunk('', true);
      return;
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          onChunk('', true);
          break;
        }

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE events from buffer
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? ''; // Keep incomplete line in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue; // Skip empty lines and comments

          if (trimmed === 'data: [DONE]') {
            onChunk('', true);
            return;
          }

          if (trimmed.startsWith('data: ')) {
            try {
              const chunk: StreamChunk = JSON.parse(trimmed.slice(6));
              const content = chunk.choices?.[0]?.delta?.content;
              if (content) {
                onChunk(content, false);
              }
              if (chunk.choices?.[0]?.finish_reason === 'stop') {
                onChunk('', true);
                return;
              }
            } catch {
              // Skip malformed JSON chunks
              console.warn('[OpenClaw] Malformed SSE chunk:', trimmed);
            }
          }
        }
      }
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        // Stream was intentionally aborted
        onChunk('', true);
      } else {
        throw e;
      }
    } finally {
      reader.releaseLock();
    }
  }

  private async createError(response: Response): Promise<OpenClawServiceError> {
    let message = `Gateway error (${response.status})`;
    try {
      const body = await response.text();
      if (body) {
        const parsed = JSON.parse(body);
        message = parsed.error?.message || parsed.message || message;
      }
    } catch {
      // ignore parse errors
    }

    const type: OpenClawServiceError['type'] =
      response.status === 401 ? 'auth' :
      response.status >= 500 ? 'server' :
      'network';

    return { type, message, status: response.status };
  }
}

// ─── Singleton ───────────────────────────────────────────────────────────────

let serviceInstance: OpenClawService | null = null;

export function getOpenClawService(config: OpenClawConfig): OpenClawService {
  if (!serviceInstance) {
    serviceInstance = new OpenClawService(config);
  } else {
    serviceInstance.updateConfig(config);
  }
  return serviceInstance;
}
