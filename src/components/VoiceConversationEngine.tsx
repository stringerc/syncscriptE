/**
 * Voice Conversation Engine
 * 
 * Full-featured voice conversation UI for the SyncScript Voice Resonance Engine.
 * Supports real-time voice conversations with the AI assistant, including:
 * - Live speech-to-text transcription
 * - AI-powered contextual responses
 * - Text-to-speech output with emotion-adaptive parameters
 * - Waveform visualization
 * - Emotion detection and display
 * - Conversation transcript
 * - Voice memory integration
 */

import { useState, useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import {
  Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff,
  Brain, Sparkles, Activity, MessageSquare, X, Minimize2,
  Maximize2, Settings, Zap, Heart, ChevronDown, Send, Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { useVoiceStream } from '../hooks/useVoiceStream';
import { useEmotionDetection } from '../hooks/useEmotionDetection';
import { useTasks } from '../contexts/TasksContext';
import { useCalendarEvents } from '../hooks/useCalendarEvents';
import { useOpenClaw } from '../contexts/OpenClawContext';
import {
  buildVoiceContext,
  formatAIResponseForVoice,
  generateGreeting,
  generateImmersiveVoiceIntro,
  generateDeepInsights,
} from '../utils/voice-context-builder';
import { voiceMemory } from '../utils/voice-memory';
import { getTTSConfig } from '../utils/tts-router';
import { nexusLandingKokoroConfig } from '../utils/nexus-voice-tts';
import { evaluateCheckIns, shouldNotify, markNotified } from '../utils/proactive-checkins';
import { PhoneCallPanel } from './PhoneCallPanel';
import { DocumentCanvas } from './DocumentCanvas';
import { useAuth } from '../contexts/AuthContext';
import { useNexusPrivateContext } from '../hooks/useNexusPrivateContext';
import { getStoredNexusPersonaMode } from '../utils/nexus-persona-preference';
import { postNexusUserVoiceTurn } from '../utils/nexus-voice-user-client';
import { voiceLatencyMark, voiceLatencyMeasure, voiceLatencyLogNexusCorrelation } from '../utils/voice-latency-debug';
import {
  NexusVoiceArtifactRail,
  toolTraceToVoiceChips,
  type VoiceToolChip,
} from './nexus/NexusVoiceArtifactRail';
import { TaskDetailModal } from './TaskDetailModal';
import { EventModal } from './EventModal';
import { LinkedCalendarEventModal } from './calendar/LinkedCalendarEventModal';
import { buildPrimaryEventFromNexusCalendarHold } from '../utils/nexus-voice-calendar-event';
import { fetchCalendarSyncGroups, postCalendarHold } from '../lib/calendar-linked-api';
import { CURRENT_USER } from '../utils/user-constants';
import type { Event } from '../utils/event-task-types';
import {
  extractFirstMapUrl,
  parseLatLngFromMapUrl,
  shouldTryServerMapResolve,
} from '../utils/map-url-embed.mjs';
import { isPhoneServiceConfigured, registerCallerPhoneIndex } from '../utils/phone-service';
import type {
  VoiceMessage,
  VoiceSession,
  EmotionState,
  VoiceEngineStatus,
} from '../types/voice-engine';
import { NexusVoiceMinimalCircle } from './nexus/NexusVoiceMinimalCircle';
import type { NexusVoiceOrbPhase } from './nexus/nexus-voice-orb-types';

// ============================================================================
// PROPS
// ============================================================================

const LS_SAVED_PHONE = 'syncscript_phone_number';

interface VoiceConversationEngineProps {
  mode?: 'panel' | 'fullscreen' | 'compact';
  onClose?: () => void;
  onMinimize?: () => void;
  userName?: string;
  /** When true, fills a parent modal instead of using fixed viewport positioning. */
  embeddedInModal?: boolean;
  /** Sesame / ChatGPT-style hero orb + copy (Voice button on App AI). */
  immersiveArt?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function VoiceConversationEngine({
  mode = 'panel',
  onClose,
  onMinimize,
  userName,
  embeddedInModal = false,
  immersiveArt = false,
}: VoiceConversationEngineProps) {
  // Session state
  const [session, setSession] = useState<VoiceSession | null>(null);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  /** Immersive orb mode: hide transcript by default so the UI stays clean. */
  const [showTranscript, setShowTranscript] = useState(() => !immersiveArt);
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [showPhonePanel, setShowPhonePanel] = useState(false);
  /** Live canvas + confirmation chips (Nexus tools path). */
  const [voiceCanvasDoc, setVoiceCanvasDoc] = useState<{
    title: string;
    content: string;
    format?: 'document' | 'spreadsheet' | 'invoice';
  } | null>(null);
  const [voiceCanvasOpen, setVoiceCanvasOpen] = useState(false);
  const [artifactChips, setArtifactChips] = useState<VoiceToolChip[]>([]);
  const [mapUrlHint, setMapUrlHint] = useState<string | null>(null);
  const [mapResolvedCoords, setMapResolvedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [voiceTaskFocusId, setVoiceTaskFocusId] = useState<string | null>(null);
  const [voiceTaskSheetOpen, setVoiceTaskSheetOpen] = useState(false);
  /** Calendar tab–parity editor after `propose_calendar_hold` (local `addEvent` + EventModal). */
  const [voiceCalendarEvent, setVoiceCalendarEvent] = useState<Event | null>(null);
  const [voiceEventModalOpen, setVoiceEventModalOpen] = useState(false);
  const [voiceLinkedCalModalOpen, setVoiceLinkedCalModalOpen] = useState(false);
  const queryClient = useQueryClient();
  /** Bumps when canvas content is replaced so DocumentCanvas remounts with new Markdown. */
  const [voiceCanvasRenderKey, setVoiceCanvasRenderKey] = useState(0);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pendingUserTextRef = useRef('');
  const autoDialAttemptedRef = useRef(false);
  /**
   * `useVoiceStream` wires SpeechRecognition once on mount; `onStatusChange` / `onSpeechEnd` would
   * otherwise close over `isActive === false` from the first render and never call the AI path.
   */
  const isActiveRef = useRef(isActive);
  isActiveRef.current = isActive;
  const handleUserMessageRef = useRef<(text: string) => Promise<void>>(async () => {});
  /** After last final STT chunk, flush user text to the model (continuous mode often never fires `onend`). */
  const pendingUserTextFlushTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voiceStreamRef = useRef<ReturnType<typeof useVoiceStream> | null>(null);
  const isSpeakingRef = useRef(false);
  const sessionRef = useRef<VoiceSession | null>(null);
  const messagesRef = useRef<VoiceMessage[]>([]);
  const stopAudioAnalysisRef = useRef<() => void>(() => {});
  /** Set after Nexus creates a task; cleared when `tasks` includes it and TaskDetailModal opens. */
  const pendingVoiceTaskOpenRef = useRef<string | null>(null);
  sessionRef.current = session;
  messagesRef.current = messages;

  const schedulePendingUserTextFlush = (delayMs: number) => {
    if (pendingUserTextFlushTimerRef.current) {
      clearTimeout(pendingUserTextFlushTimerRef.current);
    }
    pendingUserTextFlushTimerRef.current = setTimeout(() => {
      pendingUserTextFlushTimerRef.current = null;
      const text = pendingUserTextRef.current.trim();
      if (!text || !isActiveRef.current) return;
      pendingUserTextRef.current = '';
      voiceLatencyMark('utterance_commit');
      void handleUserMessageRef.current(text);
    }, delayMs);
  };

  // Hooks
  const { tasks } = useTasks();
  const { events, addEvent, updateEvent, bulkUpdateEvents } = useCalendarEvents();
  const { user, accessToken } = useAuth();
  const nexusPrivateContext = useNexusPrivateContext();
  const { sendMessage: sendOpenClawMessage } = useOpenClaw();

  useEffect(() => {
    setShowTranscript(!immersiveArt);
  }, [immersiveArt]);

  useEffect(() => {
    const tid = pendingVoiceTaskOpenRef.current;
    if (!tid) return;
    if (tasks.some((t) => t.id === tid)) {
      setVoiceTaskFocusId(tid);
      setVoiceTaskSheetOpen(true);
      pendingVoiceTaskOpenRef.current = null;
    }
  }, [tasks]);

  useEffect(() => {
    if (!user?.id || !isPhoneServiceConfigured()) return;
    const saved = (typeof localStorage !== 'undefined' && localStorage.getItem(LS_SAVED_PHONE)?.trim()) || '';
    if (!saved) return;
    const t = setTimeout(() => registerCallerPhoneIndex(saved, user.id), 800);
    return () => clearTimeout(t);
  }, [user?.id]);

  const {
    currentEmotion, detectFromText, getEmotionColor, getEmotionEmoji,
    startAudioAnalysis, stopAudioAnalysis, getEmotionTrend, micInputLevel,
  } = useEmotionDetection();

  stopAudioAnalysisRef.current = stopAudioAnalysis;

  // Full-duplex: track if user is interrupting (barge-in)
  const bargeInDetectedRef = useRef(false);

  const voiceStream = useVoiceStream({
    continuous: true,
    interimResults: true,
    onTranscript: (result) => {
      if (result.isFinal && result.text.trim()) {
        pendingUserTextRef.current += (pendingUserTextRef.current ? ' ' : '') + result.text.trim();

        if (isSpeakingRef.current) {
          bargeInDetectedRef.current = true;
          voiceStreamRef.current?.stopSpeaking();
        }
        // Primary path: Web Speech `continuous` often never emits `onend` between phrases — flush after a short pause.
        schedulePendingUserTextFlush(320);
      }
    },
    onStatusChange: (status) => {
      if (status === 'idle' && pendingUserTextRef.current.trim() && isActiveRef.current) {
        schedulePendingUserTextFlush(100);
      }
    },
    onSpeechEnd: () => {
      if (pendingUserTextRef.current.trim() && isActiveRef.current) {
        schedulePendingUserTextFlush(80);
      }
    },
  });

  voiceStreamRef.current = voiceStream;
  isSpeakingRef.current = voiceStream.isSpeaking;

  // ==========================================================================
  // CONTEXT
  // ==========================================================================

  const voiceContext = useMemo(() => {
    return buildVoiceContext({
      tasks,
      events,
      userName,
    });
  }, [tasks, events, userName]);

  // ==========================================================================
  // AUTO-SCROLL
  // ==========================================================================

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Cleanup all resources on unmount (use refs — deps [] would otherwise freeze stale voiceStream).
  useEffect(() => {
    return () => {
      try {
        voiceStreamRef.current?.stopListening();
        voiceStreamRef.current?.stopSpeaking();
        stopAudioAnalysisRef.current();
        if (pendingUserTextFlushTimerRef.current) {
          clearTimeout(pendingUserTextFlushTimerRef.current);
          pendingUserTextFlushTimerRef.current = null;
        }
        const s = sessionRef.current;
        const msgs = messagesRef.current;
        if (s) {
          voiceMemory.saveSession({
            ...s,
            endedAt: Date.now(),
            messages: msgs,
            emotionTimeline: [],
          });
        }
      } catch {
        /* Never throw from unmount cleanup — avoids a stuck modal / black overlay */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ==========================================================================
  // SESSION MANAGEMENT
  // ==========================================================================

  const startSession = useCallback(() => {
    const newSession: VoiceSession = {
      id: `vs-${Date.now()}`,
      startedAt: Date.now(),
      mode: 'browser',
      messages: [],
      emotionTimeline: [],
      contextSnapshot: voiceContext,
    };

    setSession(newSession);
    setMessages([]);
    setArtifactChips([]);
    setMapUrlHint(null);
    setVoiceCanvasDoc(null);
    setVoiceCanvasOpen(false);
    setVoiceTaskFocusId(null);
    setVoiceTaskSheetOpen(false);
    pendingVoiceTaskOpenRef.current = null;
    setVoiceCalendarEvent(null);
    setVoiceEventModalOpen(false);
    setVoiceLinkedCalModalOpen(false);
    setVoiceCanvasRenderKey(0);
    setShowTranscript(!immersiveArt);
    setIsActive(true);
    if (pendingUserTextFlushTimerRef.current) {
      clearTimeout(pendingUserTextFlushTimerRef.current);
      pendingUserTextFlushTimerRef.current = null;
    }
    pendingUserTextRef.current = '';

    // Initialize audio analysis for voice emotion detection
    startAudioAnalysis();

    // Check if there's a proactive check-in to lead with
    const checkIns = evaluateCheckIns(voiceContext);
    const activeCheckIn = checkIns.find(c => shouldNotify(c));
    
    // Generate greeting -- use proactive check-in if available
    let greeting: string;
    if (activeCheckIn) {
      markNotified(activeCheckIn);
      greeting = activeCheckIn.message;
    } else {
      greeting = immersiveArt ? generateImmersiveVoiceIntro(voiceContext) : generateGreeting(voiceContext);
    }

    const greetingMessage: VoiceMessage = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      text: greeting,
      timestamp: Date.now(),
    };

    setMessages([greetingMessage]);
    
    // Speak the greeting — same Kokoro `cortana` + pacing as landing Nexus guest
    const ttsConfig = getTTSConfig({ text: greeting, emotion: currentEmotion }, voiceContext.circadianPhase);
    const kokoro = nexusLandingKokoroConfig(ttsConfig);
    voiceStream.speak({
      text: greeting,
      config: { model: kokoro.model, voice: kokoro.voice, speed: kokoro.speed, pitch: kokoro.pitch },
    }).then(() => {
      // Start listening after greeting finishes
      voiceStream.startListening();
    });

    if (!immersiveArt) {
      toast.success('Voice session started', { description: 'Speak naturally — I\'m listening.' });
    }
  }, [voiceContext, currentEmotion, voiceStream, startAudioAnalysis, immersiveArt]);

  useLayoutEffect(() => {
    if (!immersiveArt || autoDialAttemptedRef.current) return;
    autoDialAttemptedRef.current = true;
    startSession();
  }, [immersiveArt, startSession]);

  const endSession = useCallback(() => {
    voiceStream.stopListening();
    voiceStream.stopSpeaking();
    stopAudioAnalysis();
    setIsActive(false);
    if (pendingUserTextFlushTimerRef.current) {
      clearTimeout(pendingUserTextFlushTimerRef.current);
      pendingUserTextFlushTimerRef.current = null;
    }

    if (session) {
      const finalSession: VoiceSession = {
        ...session,
        endedAt: Date.now(),
        messages,
        emotionTimeline: [],
      };
      voiceMemory.saveSession(finalSession);
    }

    setVoiceCanvasOpen(false);
    setVoiceCanvasDoc(null);
    setArtifactChips([]);
    setMapUrlHint(null);
    setVoiceTaskFocusId(null);
    setVoiceTaskSheetOpen(false);
    pendingVoiceTaskOpenRef.current = null;
    setVoiceCalendarEvent(null);
    setVoiceEventModalOpen(false);
    setVoiceLinkedCalModalOpen(false);
    setVoiceCanvasRenderKey(0);
    toast.info('Voice session ended');
  }, [session, messages, voiceStream, stopAudioAnalysis]);

  const voiceCalendarEventResolved = useMemo(() => {
    if (!voiceCalendarEvent?.id) return null;
    return events.find((e) => e.id === voiceCalendarEvent.id) ?? voiceCalendarEvent;
  }, [events, voiceCalendarEvent]);

  const handleVoiceCalendarSave = useCallback((ev: Event) => {
    updateEvent(ev.id, ev as Partial<Event>);
    setVoiceCalendarEvent(ev);
  }, [updateEvent]);

  // ==========================================================================
  // MESSAGE HANDLING
  // ==========================================================================

  const handleUserMessage = useCallback(async (text: string) => {
    if (!text.trim() || isProcessingAI) return;

    voiceLatencyMark('handler_enter');
    voiceLatencyMeasure('stt_to_handler', 'utterance_commit', 'handler_enter');

    // Stop listening while processing — clear interim so immersive UI shows “thinking” instead of stale partial STT.
    voiceStream.stopListening();
    voiceStream.clearInterimTranscript();

    // Detect emotion from user text
    const emotion = detectFromText(text);

    // Add user message
    const userMessage: VoiceMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      text: text.trim(),
      timestamp: Date.now(),
      emotion,
    };

    const thread = [...messages, userMessage];
    setMessages(thread);
    setIsProcessingAI(true);

    try {
      let aiText: string;

      if (accessToken) {
        const apiMsgs = thread
          .filter((m) => m.role === 'user' || m.role === 'assistant')
          .slice(-14)
          .map((m) => ({
            role: (m.role === 'assistant' ? 'assistant' : 'user') as 'user' | 'assistant',
            content: m.text,
          }));

        const nexusRes = await postNexusUserVoiceTurn({
          accessToken,
          messages: apiMsgs,
          privateContext: nexusPrivateContext as unknown as Record<string, unknown>,
          personaMode: getStoredNexusPersonaMode(),
        });

        if (nexusRes.error) {
          throw new Error(nexusRes.error);
        }

        const trace = nexusRes.toolTrace;
        if (Array.isArray(trace) && trace.length > 0) {
          window.dispatchEvent(
            new CustomEvent('syncscript:nexus-tool-trace', { detail: { toolTrace: trace } }),
          );
        }

        const rawContent =
          nexusRes.content ||
          "I heard you, but I'm having trouble formulating a response right now. Could you try again?";
        aiText = formatAIResponseForVoice(rawContent);

        const mapMatch = extractFirstMapUrl(rawContent);
        setMapUrlHint(mapMatch);
        setArtifactChips(toolTraceToVoiceChips(trace, rawContent));

        const docTr = trace?.find(
          (t) => t && t.ok === true && t.tool === 'create_document' && t.detail && typeof t.detail === 'object',
        );
        if (docTr) {
          const d = docTr.detail as { title?: string; content?: string; format?: string };
          if (d.title && d.content) {
            setVoiceCanvasDoc({
              title: d.title,
              content: d.content,
              format: (d.format as 'document' | 'spreadsheet' | 'invoice') || 'document',
            });
            setVoiceCanvasRenderKey((k) => k + 1);
            setVoiceCanvasOpen(true);
          }
        }

        const updTr = trace?.find(
          (t) => t && t.ok === true && t.tool === 'update_document' && t.detail && typeof t.detail === 'object',
        );
        if (updTr) {
          const d = updTr.detail as { title?: string; content?: string; format?: string };
          const body = String(d.content || '').trim();
          if (body) {
            setVoiceCanvasDoc((prev) => ({
              title: (d.title && String(d.title).trim()) || prev?.title || 'Document',
              content: body,
              format: (d.format as 'document' | 'spreadsheet' | 'invoice') || prev?.format || 'document',
            }));
            setVoiceCanvasRenderKey((k) => k + 1);
            setVoiceCanvasOpen(true);
          }
        }

        const taskEntry = trace?.find(
          (t) =>
            t &&
            t.ok === true &&
            (t.tool === 'create_task' || t.tool === 'add_note') &&
            t.detail &&
            typeof t.detail === 'object' &&
            typeof (t.detail as { taskId?: string }).taskId === 'string',
        );
        if (taskEntry) {
          const tid = String((taskEntry.detail as { taskId: string }).taskId);
          pendingVoiceTaskOpenRef.current = tid;
          try {
            await refreshTasks();
          } catch {
            /* syncscript:nexus-tool-trace may still refresh tasks */
          }
          void refreshTasks();
        }

        const voiceCalHold = trace?.find(
          (t) => t && t.ok === true && t.tool === 'propose_calendar_hold',
        );
        if (voiceCalHold?.detail && typeof voiceCalHold.detail === 'object') {
          const d = voiceCalHold.detail as {
            taskId?: string;
            start_iso?: string;
            end_iso?: string;
            title?: string;
          };
          if (!d.taskId && d.start_iso && d.end_iso) {
            const newEvent = buildPrimaryEventFromNexusCalendarHold({
              title: d.title,
              start_iso: d.start_iso,
              end_iso: d.end_iso,
            });
            addEvent(newEvent);

            let merged: Event = newEvent;
            try {
              const holdRes = await postCalendarHold({
                title: newEvent.title,
                start_iso: d.start_iso,
                end_iso: d.end_iso,
                provider: 'auto',
              });
              if (holdRes.sync_group_id && Array.isArray(holdRes.results)) {
                const instances = holdRes.results
                  .filter((r) => r.success && r.data)
                  .map((r) => {
                    const data = r.data as { eventId?: string; htmlLink?: string | null; webLink?: string | null };
                    return {
                      provider: r.provider,
                      eventId: data?.eventId,
                      link: data?.htmlLink ?? data?.webLink ?? null,
                    };
                  });
                merged = {
                  ...newEvent,
                  syncGroupId: holdRes.sync_group_id,
                  linkedCalendarInstances: instances,
                };
                updateEvent(newEvent.id, merged as Partial<Event>);
              }
            } catch (e) {
              const code = (e as Error & { code?: string }).code;
              const msg = e instanceof Error ? e.message : '';
              if (code === 'NO_CALENDAR' || msg.includes('No calendar connected')) {
                toast.message(
                  'Saved on your SyncScript calendar — connect Google or Outlook under Settings → Integrations to sync.',
                  { duration: 6000 },
                );
              } else if (import.meta.env.DEV) {
                console.warn('[VoiceConversationEngine] calendar/hold', e);
              }
            }

            setVoiceCalendarEvent(merged);
            setVoiceEventModalOpen(true);
            toast.success('Calendar event added', {
              description: merged.syncGroupId
                ? 'Synced where your accounts are linked. Use “Connected calendars” in the event to adjust Google vs Outlook.'
                : 'Edit details in the event panel.',
            });
          }
        }
      } else {
        const response = await sendOpenClawMessage({
          message: text.trim(),
          context: {
            currentPage: 'voice-assistant',
            userPreferences: {
              voiceMode: true,
              circadianPhase: voiceContext.circadianPhase,
              resonanceScore: voiceContext.resonanceScore,
              energyLevel: voiceContext.energyLevel,
            },
          },
          options: {
            temperature: 0.65,
            maxTokens: 220,
          },
        });

        aiText = formatAIResponseForVoice(
          response?.message?.content ||
            "I heard you, but I'm having trouble formulating a response right now. Could you try again?",
        );
        setArtifactChips([]);
        setMapUrlHint(null);
      }

      const aiMessage: VoiceMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        text: aiText,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      voiceLatencyMark('llm_done');
      voiceLatencyMeasure('handler_to_llm', 'handler_enter', 'llm_done');

      const ttsConfig = getTTSConfig({ text: aiText, emotion }, voiceContext.circadianPhase);
      const kokoro = nexusLandingKokoroConfig(ttsConfig);
      voiceLatencyMark('tts_precall');
      voiceLatencyMeasure('llm_to_tts_precall', 'llm_done', 'tts_precall');
      await voiceStream.speak({
        text: aiText,
        emotion,
        config: { model: kokoro.model, voice: kokoro.voice, speed: kokoro.speed, pitch: kokoro.pitch },
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[VoiceConversationEngine] AI request failed — using offline fallback', error);
      }
      // Fallback response when API is unavailable
      const fallbackText = getFallbackResponse(text, voiceContext, emotion);
      const fallbackMessage: VoiceMessage = {
        id: `msg-${Date.now()}-ai-fallback`,
        role: 'assistant',
        text: fallbackText,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, fallbackMessage]);

      voiceLatencyMark('llm_done');
      voiceLatencyMeasure('handler_to_llm', 'handler_enter', 'llm_done');

      const ttsConfig = getTTSConfig({ text: fallbackText, emotion }, voiceContext.circadianPhase);
      const kokoro = nexusLandingKokoroConfig(ttsConfig);
      voiceLatencyMark('tts_precall');
      voiceLatencyMeasure('llm_to_tts_precall', 'llm_done', 'tts_precall');
      await voiceStream.speak({
        text: fallbackText,
        emotion,
        config: { model: kokoro.model, voice: kokoro.voice, speed: kokoro.speed, pitch: kokoro.pitch },
      });
    } finally {
      setIsProcessingAI(false);
      // Resume listening
      if (isActiveRef.current) {
        voiceStream.startListening();
      }
    }
  }, [
    isProcessingAI,
    voiceStream,
    detectFromText,
    voiceContext,
    sendOpenClawMessage,
    accessToken,
    nexusPrivateContext,
    messages,
    refreshTasks,
    addEvent,
    updateEvent,
  ]);

  handleUserMessageRef.current = handleUserMessage;

  const handleTextSubmit = useCallback(() => {
    if (textInput.trim()) {
      voiceLatencyMark('text_submit');
      handleUserMessage(textInput.trim());
      setTextInput('');
    }
  }, [textInput, handleUserMessage]);

  // ==========================================================================
  // WAVEFORM VISUALIZATION
  // ==========================================================================

  const WaveformVisualizer = useMemo(() => {
    return function Waveform({ active, color }: { active: boolean; color: string }) {
      return (
        <div className="flex items-center justify-center gap-[3px] h-16">
          {Array.from({ length: 24 }).map((_, i) => (
            <motion.div
              key={i}
              className="w-[3px] rounded-full"
              style={{ backgroundColor: color }}
              animate={active ? {
                height: [8, 12 + Math.random() * 44, 8],
                opacity: [0.4, 0.9, 0.4],
              } : {
                height: 4,
                opacity: 0.2,
              }}
              transition={{
                duration: 0.4 + Math.random() * 0.3,
                repeat: active ? Infinity : 0,
                delay: i * 0.03,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      );
    };
  }, []);

  // ==========================================================================
  // STATUS INDICATOR
  // ==========================================================================

  const statusConfig = useMemo(() => {
    if (isProcessingAI) return { label: 'Nexus is thinking…', color: 'text-amber-400', pulse: true, icon: Brain };
    switch (voiceStream.status) {
      case 'listening': return { label: 'Listening', color: 'text-green-400', pulse: true, icon: Mic };
      case 'speaking': return { label: 'Speaking', color: 'text-blue-400', pulse: true, icon: Volume2 };
      case 'processing': return { label: 'Processing', color: 'text-amber-400', pulse: true, icon: Activity };
      default: return { label: 'Ready', color: 'text-slate-400', pulse: false, icon: Sparkles };
    }
  }, [voiceStream.status, isProcessingAI]);

  const StatusIcon = statusConfig.icon;

  const orbPhase: NexusVoiceOrbPhase = useMemo(() => {
    if (isProcessingAI) return 'thinking';
    if (voiceStream.isSpeaking) return 'speaking';
    if (voiceStream.isListening) return 'listening';
    return 'idle';
  }, [isProcessingAI, voiceStream.isSpeaking, voiceStream.isListening]);

  useEffect(() => {
    if (!mapUrlHint) {
      setMapResolvedCoords(null);
      return;
    }
    if (parseLatLngFromMapUrl(mapUrlHint)) {
      setMapResolvedCoords(null);
      return;
    }
    if (!shouldTryServerMapResolve(mapUrlHint)) {
      setMapResolvedCoords(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const qs = new URLSearchParams({ url: mapUrlHint });
        const r = await fetch(`/api/map/resolve-map-url?${qs.toString()}`);
        if (!r.ok) {
          if (!cancelled) setMapResolvedCoords(null);
          return;
        }
        const j = (await r.json()) as { lat?: number; lng?: number };
        if (
          !cancelled &&
          typeof j.lat === 'number' &&
          typeof j.lng === 'number' &&
          !Number.isNaN(j.lat) &&
          !Number.isNaN(j.lng)
        ) {
          setMapResolvedCoords({ lat: j.lat, lng: j.lng });
        } else if (!cancelled) {
          setMapResolvedCoords(null);
        }
      } catch {
        if (!cancelled) setMapResolvedCoords(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mapUrlHint]);

  const mapEmbedCoords = useMemo(() => {
    if (!mapUrlHint) return null;
    const direct = parseLatLngFromMapUrl(mapUrlHint);
    if (direct) return direct;
    return mapResolvedCoords;
  }, [mapUrlHint, mapResolvedCoords]);

  // ==========================================================================
  // RENDER
  // ==========================================================================

  const isCompact = mode === 'compact';

  const shellPosition = embeddedInModal
    ? 'relative h-full min-h-0 w-full'
    : mode === 'fullscreen'
      ? 'fixed z-[410] top-4 right-4 bottom-4 left-4 md:left-[calc(1rem+3.5rem)] lg:left-[calc(1rem+100px)]'
      : mode === 'panel'
        ? 'w-full h-full min-h-[500px]'
        : 'w-80 h-[420px]';

  const shellSkin =
    immersiveArt && embeddedInModal
      ? 'border-0 bg-[#010101] shadow-none backdrop-blur-sm'
      : 'border border-white/10 bg-gradient-to-b from-slate-900/95 to-slate-950/95 shadow-2xl backdrop-blur-xl';

  const shellRadius = embeddedInModal ? 'rounded-none' : 'rounded-2xl';

  return (
    <>
    <div
      data-voice-ui-mode={immersiveArt ? 'immersive-nexus' : 'classic-waveform'}
      data-testid="voice-conversation-engine-root"
      className={`flex flex-col overflow-hidden ${shellSkin} ${shellRadius} ${shellPosition}`}
    >
      {/* Header — immersive mode: no chrome (close is over the canvas). */}
      {!immersiveArt ? (
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className={`h-2 w-2 rounded-full ${isActive ? 'animate-pulse bg-green-400' : 'bg-slate-500'}`} />
            <div>
              <h3 className="text-sm font-semibold text-white">Voice Resonance Engine</h3>
              <div className="flex items-center gap-1.5">
                <StatusIcon className={`h-3 w-3 ${statusConfig.color}`} />
                <span className={`text-xs ${statusConfig.color}`}>{statusConfig.label}</span>
                {currentEmotion.primary !== 'neutral' && (
                  <span className="ml-1 text-xs">{getEmotionEmoji(currentEmotion.primary)}</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {voiceMemory.getSessionCount() > 0 && (
              <Badge variant="outline" className="border-purple-500/30 px-1.5 text-[10px] text-purple-400">
                <Brain className="mr-1 h-3 w-3" />
                {voiceMemory.getSessionCount()} sessions
              </Badge>
            )}
            {onMinimize && (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white" onClick={onMinimize} aria-label="Minimize">
                <Minimize2 className="h-3.5 w-3.5" />
              </Button>
            )}
            {onClose && (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white" onClick={() => { endSession(); onClose(); }} aria-label="Close voice">
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      ) : null}

      {!accessToken && !immersiveArt && (
        <div
          role="status"
          className="flex shrink-0 items-start gap-2 border-b border-amber-400/25 bg-amber-500/[0.12] px-3 py-2.5 text-left"
        >
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-200/90" aria-hidden />
          <p className="text-[12px] leading-snug text-amber-50/95">
            <span className="font-semibold text-amber-100">Sign in</span> to use Nexus tools in voice (tasks, documents, maps, and live confirmations). Without an account, replies use the lighter assistant path and won’t show tool actions.
          </p>
        </div>
      )}

      {/* Main Content */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {immersiveArt ? (
          <div
            className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#030206]"
            data-testid="nexus-voice-immersive-main"
          >
            {onClose && (
              <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-end p-4 pt-[max(0.75rem,env(safe-area-inset-top))] pr-[max(0.75rem,env(safe-area-inset-right))]">
                <Button
                  variant="ghost"
                  size="icon"
                  className="pointer-events-auto h-11 w-11 rounded-full border border-white/15 bg-black/40 text-white/80 backdrop-blur-md hover:bg-white/10 hover:text-white"
                  onClick={() => {
                    endSession();
                    onClose();
                  }}
                  aria-label="Close voice"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            )}
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-12 overflow-y-auto px-4 pb-8 pt-14">
              <NexusVoiceMinimalCircle
                phase={orbPhase}
                ttsLevel={voiceStream.ttsOutputLevel}
                micLevel={micInputLevel}
                sessionActive={isActive}
                onTapToStart={startSession}
                sttReady={voiceStream.sttReady}
              />
              <div
                className="w-full max-w-[min(92vw,380px)] min-h-[1.25rem] px-2"
                aria-live="polite"
                aria-atomic="true"
              >
                <AnimatePresence mode="wait">
                  {isProcessingAI ? (
                    <motion.p
                      key="thinking"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 0.88, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className="text-center text-[14px] font-medium leading-relaxed tracking-tight text-amber-200/90 [text-shadow:0_1px_14px_rgba(0,0,0,0.45)]"
                    >
                      Nexus is thinking…
                    </motion.p>
                  ) : voiceStream.interimText ? (
                    <motion.p
                      key="interim"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 0.92, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      className="text-center text-[15px] font-normal leading-relaxed tracking-tight text-blue-200/95 [text-shadow:0_1px_18px_rgba(0,0,0,0.55)]"
                    >
                      {voiceStream.interimText}
                    </motion.p>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
            {isActive && (
              <div className="flex shrink-0 flex-col items-center gap-2 border-t border-white/[0.08] bg-black/80 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-5">
                <button
                  type="button"
                  onClick={endSession}
                  className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-[#e85d6a] text-white shadow-[0_12px_48px_-12px_rgba(232,93,106,0.75)] transition-transform hover:scale-[1.02] hover:bg-[#f06b78] active:scale-[0.98]"
                  aria-label="End voice session"
                >
                  <X className="h-9 w-9 stroke-[2.5]" />
                </button>
                <span className="text-[11px] font-medium text-white/40">End session</span>
              </div>
            )}
          </div>
        ) : (
          <div className="relative flex flex-col items-center justify-center px-4 py-4">
            {/* Context Dashboard */}
            <div className="mb-3 flex flex-wrap items-center justify-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                <Zap className="h-3 w-3 text-amber-400" />
                <span className="text-xs text-slate-300">Resonance</span>
                <span className="text-xs font-bold text-amber-400">{voiceContext.resonanceScore}%</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                <Activity className="h-3 w-3 text-cyan-400" />
                <span className="text-xs text-slate-300">Energy</span>
                <span className="text-xs font-bold text-cyan-400">{voiceContext.energyLevel}%</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1">
                <Sparkles className="h-3 w-3 text-purple-400" />
                <span className="text-xs capitalize text-slate-300">{voiceContext.circadianPhase.replace(/-/g, ' ')}</span>
              </div>
            </div>

            {(() => {
              const insights = generateDeepInsights(voiceContext);
              const topInsight = insights[0];
              if (!topInsight || isActive) return null;
              return (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`mb-2 max-w-[360px] rounded-lg px-3 py-1.5 text-center text-[11px] ${
                    topInsight.priority === 'high'
                      ? 'border border-amber-500/20 bg-amber-500/10 text-amber-300'
                      : 'border border-white/10 bg-white/5 text-slate-400'
                  }`}
                >
                  {topInsight.message}
                </motion.div>
              );
            })()}

            <WaveformVisualizer
              active={voiceStream.isListening || voiceStream.isSpeaking}
              color={
                voiceStream.isSpeaking ? '#60a5fa' : voiceStream.isListening ? '#4ade80' : '#475569'
              }
            />

            <AnimatePresence>
              {voiceStream.interimText && (
                <motion.p
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 0.7, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-2 max-w-[300px] truncate text-center text-sm italic text-slate-400"
                >
                  {voiceStream.interimText}...
                </motion.p>
              )}
            </AnimatePresence>

            {currentEmotion.primary !== 'neutral' && currentEmotion.confidence > 0.5 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-2 flex items-center gap-2"
              >
                <div
                  className="flex items-center gap-1.5 rounded-full px-2 py-0.5"
                  style={{
                    backgroundColor: getEmotionColor(currentEmotion.primary) + '20',
                    borderColor: getEmotionColor(currentEmotion.primary) + '40',
                    borderWidth: 1,
                  }}
                >
                  <Heart className="h-3 w-3" style={{ color: getEmotionColor(currentEmotion.primary) }} />
                  <span className="text-[10px] capitalize" style={{ color: getEmotionColor(currentEmotion.primary) }}>
                    {currentEmotion.primary} ({Math.round(currentEmotion.confidence * 100)}%)
                  </span>
                </div>
                {(() => {
                  const trend = getEmotionTrend();
                  if (trend === 'stable' || trend === 'neutral') return null;
                  const trendColors: Record<string, string> = {
                    improving: '#22c55e',
                    declining: '#f59e0b',
                    escalating: '#ef4444',
                  };
                  const trendLabels: Record<string, string> = {
                    improving: 'Mood improving',
                    declining: 'Energy dropping',
                    escalating: 'Stress rising',
                  };
                  return (
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[10px]"
                      style={{ color: trendColors[trend], backgroundColor: trendColors[trend] + '15' }}
                    >
                      {trendLabels[trend]}
                    </span>
                  );
                })()}
              </motion.div>
            )}
            <NexusVoiceArtifactRail
              immersive={false}
              chips={artifactChips}
              mapUrlHint={mapUrlHint}
              mapEmbedCoords={mapEmbedCoords}
              onOpenDocument={voiceCanvasDoc ? () => setVoiceCanvasOpen(true) : undefined}
              onOpenTaskPanel={voiceTaskFocusId ? () => setVoiceTaskSheetOpen(true) : undefined}
              className="mt-4 w-full"
            />
          </div>
        )}

        {/* Conversation Transcript */}
        {showTranscript && !immersiveArt && (
          <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-3 min-h-0">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600/30 border border-blue-500/20 text-blue-100'
                      : 'bg-white/5 border border-white/10 text-slate-200'
                  }`}>
                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-1 mb-1">
                        <Sparkles className="w-3 h-3 text-purple-400" />
                        <span className="text-[10px] text-purple-400 font-medium">SyncScript AI</span>
                      </div>
                    )}
                    <p className="leading-relaxed">{msg.text}</p>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isProcessingAI && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          className="w-2 h-2 rounded-full bg-purple-400"
                          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-slate-400">Nexus is thinking…</span>
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Text Input (toggle) */}
      <AnimatePresence>
        {showTextInput && !immersiveArt && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-3 pb-2"
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTextSubmit()}
                placeholder="Type a message..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50"
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 text-purple-400 hover:text-purple-300"
                onClick={handleTextSubmit}
                disabled={!textInput.trim()}
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phone Call Panel (Premium) */}
      <AnimatePresence>
        {showPhonePanel && !immersiveArt && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/5"
          >
            <PhoneCallPanel
              voiceContext={voiceContext}
              onClose={() => setShowPhonePanel(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls — classic mode only (immersive: tap circle to start; end control is under the hero). */}
      {!immersiveArt && (
        <div className="flex items-center justify-between border-t border-white/5 px-4 py-3">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-white"
              onClick={() => setShowTranscript(!showTranscript)}
              title="Toggle transcript"
              aria-label="Toggle transcript"
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-white"
              onClick={() => setShowTextInput(!showTextInput)}
              title="Toggle text input"
              aria-label="Toggle text input"
            >
              <Send className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-8 w-8 ${showPhonePanel ? 'text-green-400' : 'text-slate-400'} hover:text-white`}
              onClick={() => setShowPhonePanel(!showPhonePanel)}
              title="Phone calls (Premium)"
              aria-label="Phone calls"
            >
              <Phone className="w-4 h-4" />
            </Button>
          </div>

          {!isActive ? (
            <Button
              onClick={startSession}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-full px-6 gap-2 shadow-lg shadow-purple-500/20"
              disabled={!voiceStream.sttReady}
            >
              <Mic className="w-4 h-4" />
              Start Voice Chat
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              {voiceStream.isSpeaking && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-blue-400 hover:text-blue-300"
                  onClick={voiceStream.stopSpeaking}
                  aria-label="Stop speaking"
                >
                  <VolumeX className="w-4 h-4" />
                </Button>
              )}
              <Button
                onClick={endSession}
                className="bg-red-600/80 hover:bg-red-500 text-white rounded-full px-6 gap-2"
              >
                <PhoneOff className="w-4 h-4" />
                End Session
              </Button>
            </div>
          )}

          <div className="flex items-center gap-2">
            {isActive && (
              <div className="text-[10px] text-slate-500 font-mono">
                {Math.floor(((Date.now() - (session?.startedAt || Date.now())) / 1000 / 60))}m
              </div>
            )}
          </div>
        </div>
      )}
    </div>

    <TaskDetailModal
      task={voiceTaskFocusId ? tasks.find((t) => t.id === voiceTaskFocusId) ?? null : null}
      open={voiceTaskSheetOpen && Boolean(voiceTaskFocusId)}
      onOpenChange={(open) => {
        setVoiceTaskSheetOpen(open);
        if (!open) {
          setVoiceTaskFocusId(null);
          pendingVoiceTaskOpenRef.current = null;
        }
      }}
      stackAboveVoiceShell={embeddedInModal}
    />

    <EventModal
      open={voiceEventModalOpen && Boolean(voiceCalendarEventResolved)}
      onOpenChange={(open) => {
        setVoiceEventModalOpen(open);
        if (!open) {
          setVoiceCalendarEvent(null);
          setVoiceLinkedCalModalOpen(false);
        }
      }}
      event={voiceCalendarEventResolved}
      currentUserId={CURRENT_USER.name}
      onSave={handleVoiceCalendarSave}
      allEvents={events}
      onBulkUpdate={bulkUpdateEvents}
      onManageLinkedCalendars={
        voiceCalendarEventResolved?.syncGroupId
          ? () => setVoiceLinkedCalModalOpen(true)
          : undefined
      }
      stackAboveVoiceShell={embeddedInModal}
    />

    <LinkedCalendarEventModal
      open={voiceLinkedCalModalOpen}
      onOpenChange={setVoiceLinkedCalModalOpen}
      event={voiceCalendarEventResolved}
      stackAboveVoiceShell={embeddedInModal}
      onSaved={async () => {
        await queryClient.invalidateQueries({ queryKey: ['calendar-sync-groups'] });
        const ev = voiceCalendarEventResolved;
        if (!ev?.syncGroupId) return;
        try {
          const { groups } = await fetchCalendarSyncGroups();
          const g = groups.find((x) => x.id === ev.syncGroupId);
          if (g) {
            const linkedCalendarInstances = g.instances.map((i) => ({
              provider: i.provider,
              eventId: i.event_id,
              link: i.link ?? null,
            }));
            updateEvent(ev.id, { linkedCalendarInstances } as Partial<Event>);
            setVoiceCalendarEvent((p) =>
              p && p.id === ev.id ? { ...p, linkedCalendarInstances } : p,
            );
          }
        } catch {
          /* empty */
        }
      }}
    />

    {voiceCanvasDoc &&
      voiceCanvasOpen &&
      createPortal(
        <div className="fixed inset-0 z-[520] flex items-center justify-center bg-black/60 p-3 backdrop-blur-md">
          <div
            className="relative flex h-[min(90vh,860px)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-white/12 shadow-[0_32px_120px_-24px_rgba(0,0,0,0.85)]"
            role="dialog"
            aria-modal="true"
            aria-label="Document canvas"
          >
            <DocumentCanvas
              key={voiceCanvasRenderKey}
              title={voiceCanvasDoc.title}
              content={voiceCanvasDoc.content}
              format={voiceCanvasDoc.format}
              onClose={() => setVoiceCanvasOpen(false)}
            />
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

// ============================================================================
// FALLBACK RESPONSE GENERATOR
// ============================================================================

function getFallbackResponse(
  userText: string,
  context: ReturnType<typeof buildVoiceContext>,
  emotion?: EmotionState,
): string {
  const text = userText.toLowerCase();
  const pendingTasks = context.tasks.filter(t => t.status !== 'completed');
  const upcomingEvents = context.events.filter(e => e.isUpcoming);

  // Task-related queries
  if (text.includes('task') || text.includes('to do') || text.includes('what should i')) {
    if (pendingTasks.length === 0) {
      return 'You\'re all caught up! No pending tasks right now. Want to plan something new?';
    }
    const highPriority = pendingTasks.filter(t => t.priority === 'high' || t.priority === 'critical');
    if (highPriority.length > 0) {
      return `You have ${pendingTasks.length} tasks pending. I'd prioritize "${highPriority[0].title}" since it's high priority. Your energy level is ${context.energyLevel}% right now, which is ${context.energyLevel > 60 ? 'great for tackling it' : 'a bit low -- maybe start with something lighter'}.`;
    }
    return `You've got ${pendingTasks.length} tasks pending. Based on your current energy of ${context.energyLevel}%, I'd suggest starting with "${pendingTasks[0].title}".`;
  }

  // Schedule queries
  if (text.includes('schedule') || text.includes('calendar') || text.includes('meeting') || text.includes('event')) {
    if (upcomingEvents.length === 0) {
      return 'Your calendar is clear for the rest of the day. Perfect time for deep work or planning ahead.';
    }
    return `You have ${upcomingEvents.length} upcoming event${upcomingEvents.length === 1 ? '' : 's'}. Next up is "${upcomingEvents[0].title}". Want me to walk through your schedule?`;
  }

  // Energy queries
  if (text.includes('energy') || text.includes('tired') || text.includes('how am i')) {
    return `Your energy level is at ${context.energyLevel}% and your resonance score is ${context.resonanceScore}%. You're in the ${context.circadianPhase.replace(/-/g, ' ')} phase. ${context.energyLevel > 60 ? 'Good time to tackle complex tasks!' : 'Maybe a break or lighter tasks would be best right now.'}`;
  }

  // Greeting
  if (text.includes('hello') || text.includes('hi') || text.includes('hey')) {
    return generateGreeting(context);
  }

  // Emotion-aware generic response
  if (emotion?.primary === 'stressed') {
    return 'I can tell things feel heavy right now. Let\'s take it one step at a time. What\'s the most pressing thing on your mind?';
  }

  if (emotion?.primary === 'happy' || emotion?.primary === 'excited') {
    return 'Love the energy! What are you excited about? I\'m here to help make the most of it.';
  }

  // Generic fallback
  return `I hear you. You've got ${pendingTasks.length} tasks and ${upcomingEvents.length} events coming up, with a resonance score of ${context.resonanceScore}%. How can I help you make the most of your day?`;
}

export default VoiceConversationEngine;
