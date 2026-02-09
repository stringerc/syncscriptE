/**
 * useOpenClaw Hook
 * 
 * React hook for interacting with OpenClaw's AI gateway.
 * Manages chat state, streaming responses, and connection health.
 * 
 * Usage:
 *   const { sendMessage, messages, isStreaming, connectionStatus } = useOpenClaw();
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { OpenClawService, getOpenClawService, ChatMessage } from '../services/openclaw-service';
import { loadOpenClawConfig, isConfigValid, type OpenClawConfig } from '../config/openclaw';

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface OpenClawMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

interface UseOpenClawOptions {
  /** System prompt to prepend to all conversations */
  systemPrompt?: string;
  /** Auto-check connection on mount */
  autoConnect?: boolean;
  /** Custom config override (otherwise loaded from localStorage/env) */
  config?: OpenClawConfig;
}

interface UseOpenClawReturn {
  /** Send a message to OpenClaw and get a response */
  sendMessage: (content: string) => Promise<void>;
  /** All messages in the current conversation */
  messages: OpenClawMessage[];
  /** Whether OpenClaw is currently streaming a response */
  isStreaming: boolean;
  /** Connection status to the gateway */
  connectionStatus: ConnectionStatus;
  /** Latency of last health check in ms */
  latencyMs: number | null;
  /** Last error message */
  error: string | null;
  /** Clear conversation history */
  clearMessages: () => void;
  /** Check gateway connectivity */
  checkConnection: () => Promise<boolean>;
  /** Stop an in-progress stream */
  stopStreaming: () => void;
  /** Current configuration */
  config: OpenClawConfig;
  /** Whether OpenClaw is properly configured and available */
  isAvailable: boolean;
}

const SYNCSCRIPT_SYSTEM_PROMPT = `You are the SyncScript AI assistant — an intelligent productivity companion built into the SyncScript platform.

SyncScript is an AI-powered productivity system that works with the user's natural energy rhythms. Key features:
- Smart task management with energy-aware scheduling
- Goal tracking with milestones and progress
- Unified calendar with event management
- Energy tracking and prediction (peak hours, low hours)
- Team collaboration and resonance scoring
- Gamification with achievements and streaks

Your personality:
- Helpful, concise, and encouraging
- Data-driven — reference the user's actual tasks, goals, and energy when possible
- Proactive — suggest optimizations based on patterns
- Speak naturally, like a smart colleague

Keep responses focused and actionable. Use markdown formatting for readability.`;

export function useOpenClaw(options: UseOpenClawOptions = {}): UseOpenClawReturn {
  const {
    systemPrompt = SYNCSCRIPT_SYSTEM_PROMPT,
    autoConnect = true,
    config: configOverride,
  } = options;

  const [messages, setMessages] = useState<OpenClawMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<OpenClawConfig>(() => configOverride ?? loadOpenClawConfig());

  const serviceRef = useRef<OpenClawService | null>(null);
  const abortRef = useRef<(() => void) | null>(null);

  // Initialize/update service when config changes
  useEffect(() => {
    const currentConfig = configOverride ?? loadOpenClawConfig();
    setConfig(currentConfig);

    if (isConfigValid(currentConfig) && currentConfig.enabled) {
      serviceRef.current = getOpenClawService(currentConfig);
    } else {
      serviceRef.current = null;
    }
  }, [configOverride]);

  // Auto-check connection on mount
  useEffect(() => {
    if (autoConnect && serviceRef.current && config.enabled) {
      checkConnection();
    }
  }, [autoConnect, config.enabled]);

  const checkConnection = useCallback(async (): Promise<boolean> => {
    if (!serviceRef.current || !config.enabled) {
      setConnectionStatus('disconnected');
      return false;
    }

    setConnectionStatus('connecting');
    setError(null);

    try {
      const result = await serviceRef.current.healthCheck();
      setLatencyMs(result.latencyMs);

      if (result.ok) {
        setConnectionStatus('connected');
        console.log(`[OpenClaw] Connected (${result.latencyMs}ms)`);
        return true;
      } else {
        setConnectionStatus('error');
        setError(result.error ?? 'Health check failed');
        console.warn('[OpenClaw] Health check failed:', result.error);
        return false;
      }
    } catch (e) {
      setConnectionStatus('error');
      const msg = e instanceof Error ? e.message : 'Connection failed';
      setError(msg);
      console.error('[OpenClaw] Connection error:', msg);
      return false;
    }
  }, [config.enabled]);

  const sendMessage = useCallback(async (content: string): Promise<void> => {
    if (!serviceRef.current) {
      setError('OpenClaw is not configured');
      return;
    }

    const userMessage: OpenClawMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    // Add user message to state
    setMessages(prev => [...prev, userMessage]);
    setIsStreaming(true);
    setError(null);

    // Build the full message history for the API
    const apiMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content })),
      { role: 'user' as const, content },
    ];

    // Create a placeholder assistant message for streaming
    const assistantMsgId = `msg-${Date.now()}-assistant`;
    const assistantMessage: OpenClawMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      if (config.streaming) {
        // Streaming mode
        let accumulated = '';

        const abort = await serviceRef.current.chatStream(
          apiMessages,
          (chunk, done) => {
            if (done) {
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantMsgId
                    ? { ...m, content: accumulated, isStreaming: false }
                    : m
                )
              );
              setIsStreaming(false);
              return;
            }

            accumulated += chunk;
            setMessages(prev =>
              prev.map(m =>
                m.id === assistantMsgId
                  ? { ...m, content: accumulated }
                  : m
              )
            );
          }
        );

        abortRef.current = abort;
      } else {
        // Non-streaming mode
        const response = await serviceRef.current.chat(apiMessages);
        const assistantContent = response.choices?.[0]?.message?.content ?? 'No response from OpenClaw.';

        setMessages(prev =>
          prev.map(m =>
            m.id === assistantMsgId
              ? { ...m, content: assistantContent, isStreaming: false }
              : m
          )
        );
        setIsStreaming(false);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to get response';
      setError(msg);
      setIsStreaming(false);

      // Update the assistant message to show the error
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantMsgId
            ? { ...m, content: `⚠️ Error: ${msg}`, isStreaming: false }
            : m
        )
      );

      // If it's a connection error, update status
      if (msg.includes('fetch') || msg.includes('network') || msg.includes('timeout')) {
        setConnectionStatus('error');
      }
    }
  }, [messages, config.streaming, systemPrompt]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const stopStreaming = useCallback(() => {
    if (abortRef.current) {
      abortRef.current();
      abortRef.current = null;
    }
    setIsStreaming(false);
    // Mark any streaming messages as complete
    setMessages(prev =>
      prev.map(m => (m.isStreaming ? { ...m, isStreaming: false } : m))
    );
  }, []);

  const isAvailable = connectionStatus === 'connected' && config.enabled && isConfigValid(config);

  return {
    sendMessage,
    messages,
    isStreaming,
    connectionStatus,
    latencyMs,
    error,
    clearMessages,
    checkConnection,
    stopStreaming,
    config,
    isAvailable,
  };
}
