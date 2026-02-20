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

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Mic, MicOff, Volume2, VolumeX, Phone, PhoneOff,
  Brain, Sparkles, Activity, MessageSquare, X, Minimize2,
  Maximize2, Settings, Zap, Heart, ChevronDown, Send,
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
  buildVoiceSystemPrompt,
  formatAIResponseForVoice,
  generateGreeting,
  buildDeepContextPrompt,
  generateDeepInsights,
} from '../utils/voice-context-builder';
import { voiceMemory } from '../utils/voice-memory';
import { getTTSConfig } from '../utils/tts-router';
import { evaluateCheckIns, shouldNotify, markNotified } from '../utils/proactive-checkins';
import { PhoneCallPanel } from './PhoneCallPanel';
import type {
  VoiceMessage,
  VoiceSession,
  EmotionState,
  VoiceEngineStatus,
} from '../types/voice-engine';

// ============================================================================
// PROPS
// ============================================================================

interface VoiceConversationEngineProps {
  mode?: 'panel' | 'fullscreen' | 'compact';
  onClose?: () => void;
  onMinimize?: () => void;
  userName?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function VoiceConversationEngine({
  mode = 'panel',
  onClose,
  onMinimize,
  userName,
}: VoiceConversationEngineProps) {
  // Session state
  const [session, setSession] = useState<VoiceSession | null>(null);
  const [messages, setMessages] = useState<VoiceMessage[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);
  const [textInput, setTextInput] = useState('');
  const [showTextInput, setShowTextInput] = useState(false);
  const [showPhonePanel, setShowPhonePanel] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pendingUserTextRef = useRef('');

  // Hooks
  const { tasks } = useTasks();
  const { events } = useCalendarEvents();
  const { sendMessage: sendOpenClawMessage } = useOpenClaw();
  const {
    currentEmotion, detectFromText, getEmotionColor, getEmotionEmoji,
    startAudioAnalysis, stopAudioAnalysis, getEmotionTrend,
  } = useEmotionDetection();

  // Full-duplex: track if user is interrupting (barge-in)
  const bargeInDetectedRef = useRef(false);
  const speakingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const voiceStream = useVoiceStream({
    continuous: true,
    interimResults: true,
    onTranscript: (result) => {
      if (result.isFinal && result.text.trim()) {
        pendingUserTextRef.current += (pendingUserTextRef.current ? ' ' : '') + result.text.trim();
        
        // Full-duplex barge-in: if AI is speaking and user starts talking,
        // stop the AI mid-sentence to let the user take over
        if (voiceStream.isSpeaking) {
          bargeInDetectedRef.current = true;
          voiceStream.stopSpeaking();
        }
      }
    },
    onStatusChange: (status) => {
      // Auto-process when user stops speaking
      if (status === 'idle' && pendingUserTextRef.current && isActive) {
        // Small delay to allow for natural pauses
        if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
        speakingTimeoutRef.current = setTimeout(() => {
          if (pendingUserTextRef.current) {
            handleUserMessage(pendingUserTextRef.current);
            pendingUserTextRef.current = '';
          }
        }, 800); // 800ms silence = user is done speaking
      }
    },
    onSpeechEnd: () => {
      if (pendingUserTextRef.current && isActive) {
        if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
        speakingTimeoutRef.current = setTimeout(() => {
          if (pendingUserTextRef.current) {
            handleUserMessage(pendingUserTextRef.current);
            pendingUserTextRef.current = '';
          }
        }, 600);
      }
    },
  });

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

  // Cleanup all resources on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      voiceStream.stopListening();
      voiceStream.stopSpeaking();
      stopAudioAnalysis();
      if (speakingTimeoutRef.current) {
        clearTimeout(speakingTimeoutRef.current);
        speakingTimeoutRef.current = null;
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
    setIsActive(true);

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
      greeting = generateGreeting(voiceContext);
    }

    const greetingMessage: VoiceMessage = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      text: greeting,
      timestamp: Date.now(),
    };

    setMessages([greetingMessage]);
    
    // Speak the greeting with circadian-aware TTS
    const ttsConfig = getTTSConfig({ text: greeting, emotion: currentEmotion }, voiceContext.circadianPhase);
    voiceStream.speak({
      text: greeting,
      config: { model: ttsConfig.model, speed: ttsConfig.speed, pitch: ttsConfig.pitch },
    }).then(() => {
      // Start listening after greeting finishes
      voiceStream.startListening();
    });

    toast.success('Voice session started', { description: 'Speak naturally -- I\'m listening.' });
  }, [voiceContext, currentEmotion, voiceStream, startAudioAnalysis]);

  const endSession = useCallback(() => {
    voiceStream.stopListening();
    voiceStream.stopSpeaking();
    stopAudioAnalysis();
    setIsActive(false);
    if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);

    if (session) {
      const finalSession: VoiceSession = {
        ...session,
        endedAt: Date.now(),
        messages,
        emotionTimeline: [],
      };
      voiceMemory.saveSession(finalSession);
    }

    toast.info('Voice session ended');
  }, [session, messages, voiceStream, stopAudioAnalysis]);

  // ==========================================================================
  // MESSAGE HANDLING
  // ==========================================================================

  const handleUserMessage = useCallback(async (text: string) => {
    if (!text.trim() || isProcessingAI) return;

    // Stop listening while processing
    voiceStream.stopListening();

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

    setMessages(prev => [...prev, userMessage]);
    setIsProcessingAI(true);

    try {
      // Build deep context with memory and proactive insights
      const memoryContext = voiceMemory.getMemoryContext(text);
      const deepContext = buildDeepContextPrompt(voiceContext);
      const systemPrompt = buildVoiceSystemPrompt(voiceContext, emotion) + deepContext + memoryContext;

      // Send to AI with full SyncScript context
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
          temperature: 0.7,
          maxTokens: 400,
        },
      });

      const aiText = formatAIResponseForVoice(
        response?.message?.content || 'I heard you, but I\'m having trouble formulating a response right now. Could you try again?'
      );

      // Add AI response
      const aiMessage: VoiceMessage = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        text: aiText,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, aiMessage]);

      // Speak with circadian-aware and emotion-adaptive TTS
      const ttsConfig = getTTSConfig({ text: aiText, emotion }, voiceContext.circadianPhase);
      await voiceStream.speak({
        text: aiText,
        emotion,
        config: { model: ttsConfig.model, speed: ttsConfig.speed, pitch: ttsConfig.pitch },
      });

    } catch (error) {
      // Fallback response when API is unavailable
      const fallbackText = getFallbackResponse(text, voiceContext, emotion);
      const fallbackMessage: VoiceMessage = {
        id: `msg-${Date.now()}-ai-fallback`,
        role: 'assistant',
        text: fallbackText,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, fallbackMessage]);

      const ttsConfig = getTTSConfig({ text: fallbackText, emotion }, voiceContext.circadianPhase);
      await voiceStream.speak({
        text: fallbackText,
        emotion,
        config: { model: ttsConfig.model, speed: ttsConfig.speed, pitch: ttsConfig.pitch },
      });
    } finally {
      setIsProcessingAI(false);
      // Resume listening
      if (isActive) {
        voiceStream.startListening();
      }
    }
  }, [isProcessingAI, voiceStream, detectFromText, voiceContext, sendOpenClawMessage, isActive]);

  const handleTextSubmit = useCallback(() => {
    if (textInput.trim()) {
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
    if (isProcessingAI) return { label: 'Thinking...', color: 'text-amber-400', pulse: true, icon: Brain };
    switch (voiceStream.status) {
      case 'listening': return { label: 'Listening', color: 'text-green-400', pulse: true, icon: Mic };
      case 'speaking': return { label: 'Speaking', color: 'text-blue-400', pulse: true, icon: Volume2 };
      case 'processing': return { label: 'Processing', color: 'text-amber-400', pulse: true, icon: Activity };
      default: return { label: 'Ready', color: 'text-slate-400', pulse: false, icon: Sparkles };
    }
  }, [voiceStream.status, isProcessingAI]);

  const StatusIcon = statusConfig.icon;

  // ==========================================================================
  // RENDER
  // ==========================================================================

  const isCompact = mode === 'compact';

  return (
    <div className={`flex flex-col bg-gradient-to-b from-slate-900/95 to-slate-950/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl ${
      mode === 'fullscreen' ? 'fixed inset-4 z-50' : 
      mode === 'panel' ? 'w-full h-full min-h-[500px]' : 
      'w-80 h-[420px]'
    }`}>
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />
          <div>
            <h3 className="text-sm font-semibold text-white">Voice Resonance Engine</h3>
            <div className="flex items-center gap-1.5">
              <StatusIcon className={`w-3 h-3 ${statusConfig.color}`} />
              <span className={`text-xs ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
              {currentEmotion.primary !== 'neutral' && (
                <span className="text-xs ml-1">
                  {getEmotionEmoji(currentEmotion.primary)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {voiceMemory.getSessionCount() > 0 && (
            <Badge variant="outline" className="text-[10px] border-purple-500/30 text-purple-400 px-1.5">
              <Brain className="w-3 h-3 mr-1" />
              {voiceMemory.getSessionCount()} sessions
            </Badge>
          )}
          {onMinimize && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white" onClick={onMinimize} aria-label="Minimize">
              <Minimize2 className="w-3.5 h-3.5" />
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white" onClick={() => { endSession(); onClose(); }} aria-label="Close">
              <X className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Waveform Area */}
        <div className="px-4 py-4 flex flex-col items-center justify-center">
          {/* Context Dashboard */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
              <Zap className="w-3 h-3 text-amber-400" />
              <span className="text-xs text-slate-300">Resonance</span>
              <span className="text-xs font-bold text-amber-400">{voiceContext.resonanceScore}%</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
              <Activity className="w-3 h-3 text-cyan-400" />
              <span className="text-xs text-slate-300">Energy</span>
              <span className="text-xs font-bold text-cyan-400">{voiceContext.energyLevel}%</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10">
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span className="text-xs text-slate-300 capitalize">{voiceContext.circadianPhase.replace(/-/g, ' ')}</span>
            </div>
          </div>

          {/* Proactive Insight Ticker */}
          {(() => {
            const insights = generateDeepInsights(voiceContext);
            const topInsight = insights[0];
            if (!topInsight || isActive) return null;
            return (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mb-2 px-3 py-1.5 rounded-lg text-[11px] max-w-[360px] text-center ${
                  topInsight.priority === 'high' 
                    ? 'bg-amber-500/10 border border-amber-500/20 text-amber-300'
                    : 'bg-white/5 border border-white/10 text-slate-400'
                }`}
              >
                {topInsight.message}
              </motion.div>
            );
          })()}

          {/* Waveform */}
          <WaveformVisualizer 
            active={voiceStream.isListening || voiceStream.isSpeaking} 
            color={voiceStream.isSpeaking ? '#60a5fa' : voiceStream.isListening ? '#4ade80' : '#475569'} 
          />

          {/* Interim Transcript */}
          <AnimatePresence>
            {voiceStream.interimText && (
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 0.7, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-sm text-slate-400 italic text-center mt-2 max-w-[300px] truncate"
              >
                {voiceStream.interimText}...
              </motion.p>
            )}
          </AnimatePresence>

          {/* Emotion Indicator with Trend */}
          {currentEmotion.primary !== 'neutral' && currentEmotion.confidence > 0.5 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-2 mt-2"
            >
              <div
                className="flex items-center gap-1.5 px-2 py-0.5 rounded-full"
                style={{ backgroundColor: getEmotionColor(currentEmotion.primary) + '20', borderColor: getEmotionColor(currentEmotion.primary) + '40', borderWidth: 1 }}
              >
                <Heart className="w-3 h-3" style={{ color: getEmotionColor(currentEmotion.primary) }} />
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
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ color: trendColors[trend], backgroundColor: trendColors[trend] + '15' }}>
                    {trendLabels[trend]}
                  </span>
                );
              })()}
            </motion.div>
          )}
        </div>

        {/* Conversation Transcript */}
        {showTranscript && (
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
                    <span className="text-xs text-slate-400">Thinking...</span>
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
        {showTextInput && (
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
        {showPhonePanel && (
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

      {/* Controls */}
      <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between">
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

        {/* Main Action Button */}
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
    </div>
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
