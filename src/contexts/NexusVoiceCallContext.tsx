import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { useVoiceStream } from '../hooks/useVoiceStream';
import type { STTResult, TTSRequest } from '../types/voice-engine';

export interface NexusMessage {
  id: string;
  role: 'user' | 'nexus';
  text: string;
  timestamp: number;
}

export type NexusCallStatus = 'idle' | 'connecting' | 'active' | 'ending';

interface NexusVoiceCallState {
  isCallActive: boolean;
  callStatus: NexusCallStatus;
  messages: NexusMessage[];
  callDuration: number;
  sessionId: string | null;
  interimText: string;
  isSpeaking: boolean;
  isListening: boolean;
}

interface NexusVoiceCallContextValue extends NexusVoiceCallState {
  startCall: () => Promise<void>;
  endCall: () => void;
}

const NexusVoiceCallContext = createContext<NexusVoiceCallContextValue | null>(null);

export function useNexusVoiceCall() {
  const ctx = useContext(NexusVoiceCallContext);
  if (!ctx) {
    throw new Error('useNexusVoiceCall must be used within NexusVoiceCallProvider');
  }
  return ctx;
}

const MAX_CALL_DURATION = 300; // 5 minutes
const SILENCE_TIMEOUT = 800; // ms before processing final transcript
const NEXUS_GUEST_API = '/api/ai/nexus-guest';

const GREETING = "Hi! I'm Nexus, SyncScript's AI assistant. What would you like to know about how SyncScript can help you?";
const GOODBYE = "Thanks for chatting! Feel free to sign up for a free trial anytime. Have a great day!";
const TIME_LIMIT_MSG = "We've reached the 5-minute demo limit. Thanks for trying Nexus! Sign up for a free trial to get unlimited access.";

/**
 * Build a TTS request for Nexus — the "Cortana from Halo" persona.
 * The voice preset 'nexus' maps to af_nicole (highest quality Kokoro voice,
 * Grade B-, most training data). The server-side proxy at /api/ai/tts
 * resolves this preset to the actual Kokoro voice blend.
 */
function nexusTTS(text: string): TTSRequest {
  return {
    text,
    emotion: { primary: 'calm', confidence: 0.9, valence: 0.7, arousal: 0.3 },
    config: {
      model: 'kokoro',
      voice: 'nexus',
      speed: 1.0,
      pitch: 1.0,
    },
  };
}

function generateId() {
  return `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function generateSessionId() {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function NexusVoiceCallProvider({ children }: { children: ReactNode }) {
  const [callStatus, setCallStatus] = useState<NexusCallStatus>('idle');
  const [messages, setMessages] = useState<NexusMessage[]>([]);
  const [callDuration, setCallDuration] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const processingRef = useRef(false);
  const activeRef = useRef(false);
  const messagesRef = useRef<NexusMessage[]>([]);

  // Keep messagesRef in sync
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const handleTranscript = useCallback((result: STTResult) => {
    if (!result.isFinal || !activeRef.current) return;

    // Clear any pending silence timer
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    const text = result.text.trim();
    if (!text) return;

    // Debounce: wait for silence before processing
    silenceTimerRef.current = setTimeout(() => {
      if (activeRef.current) {
        processUserMessage(text);
      }
    }, SILENCE_TIMEOUT);
  }, []);

  const voiceStream = useVoiceStream({
    continuous: true,
    interimResults: true,
    onTranscript: handleTranscript,
  });

  const addMessage = useCallback((role: 'user' | 'nexus', text: string) => {
    const msg: NexusMessage = {
      id: generateId(),
      role,
      text,
      timestamp: Date.now(),
    };
    setMessages(prev => [...prev, msg]);
    return msg;
  }, []);

  const fetchAIResponse = useCallback(async (userText: string, sid: string): Promise<string> => {
    const history = messagesRef.current
      .map(m => ({
        role: m.role === 'nexus' ? 'assistant' : 'user',
        content: m.text,
      }));

    // Add the new user message
    history.push({ role: 'user', content: userText });

    try {
      const res = await fetch(NEXUS_GUEST_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, sessionId: sid }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        if (res.status === 429) {
          return err.error || "We've reached the limit for this demo. Sign up for unlimited access!";
        }
        throw new Error(err.error || 'Request failed');
      }

      const data = await res.json();
      return data.content || "I'm sorry, I didn't catch that. Could you ask again?";
    } catch {
      return "I'm having a little trouble right now. You can always reach us at support@syncscript.app!";
    }
  }, []);

  const processUserMessage = useCallback(async (text: string) => {
    if (processingRef.current || !activeRef.current) return;

    // Detect "end call" commands
    const lowerText = text.toLowerCase().trim();
    if (
      lowerText === 'end call' ||
      lowerText === 'hang up' ||
      lowerText === 'goodbye' ||
      lowerText === 'bye' ||
      lowerText === 'end voice chat'
    ) {
      endCallInternal();
      return;
    }

    processingRef.current = true;

    // Stop listening while processing + stop any current TTS (barge-in)
    voiceStream.stopSpeaking();
    voiceStream.stopListening();
    voiceStream.clearTranscript();

    addMessage('user', text);

    const sid = sessionId || generateSessionId();
    const response = await fetchAIResponse(text, sid);

    if (!activeRef.current) {
      processingRef.current = false;
      return;
    }

    addMessage('nexus', response);

    await voiceStream.speak(nexusTTS(response));

    processingRef.current = false;

    if (activeRef.current) {
      voiceStream.clearTranscript();
      voiceStream.startListening();
    }
  }, [voiceStream, sessionId, addMessage, fetchAIResponse]);

  const endCallInternal = useCallback(async () => {
    if (!activeRef.current) return;
    activeRef.current = false;
    setCallStatus('ending');

    voiceStream.stopListening();
    voiceStream.stopSpeaking();

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    addMessage('nexus', GOODBYE);
    await voiceStream.speak(nexusTTS(GOODBYE));

    setCallStatus('idle');
    setMessages([]);
    setCallDuration(0);
    setSessionId(null);
    processingRef.current = false;
  }, [voiceStream, addMessage]);

  const startCall = useCallback(async () => {
    if (activeRef.current) return;

    setCallStatus('connecting');
    const sid = generateSessionId();
    setSessionId(sid);
    setMessages([]);
    setCallDuration(0);
    processingRef.current = false;

    // Speak the greeting
    const greetingMsg = addMessage('nexus', GREETING);
    activeRef.current = true;
    setCallStatus('active');

    // Start call timer
    timerRef.current = setInterval(() => {
      setCallDuration(prev => {
        const next = prev + 1;
        if (next >= MAX_CALL_DURATION) {
          // Auto-end on time limit
          setTimeout(() => {
            if (activeRef.current) {
              addMessage('nexus', TIME_LIMIT_MSG);
              voiceStream.speak(nexusTTS(TIME_LIMIT_MSG)).then(() => {
                endCallInternal();
              });
            }
          }, 0);
          if (timerRef.current) clearInterval(timerRef.current);
        }
        return next;
      });
    }, 1000);

    await voiceStream.speak(nexusTTS(GREETING));

    // Start listening after greeting
    if (activeRef.current) {
      voiceStream.clearTranscript();
      voiceStream.startListening();
    }
  }, [voiceStream, addMessage, endCallInternal]);

  const endCall = useCallback(() => {
    endCallInternal();
  }, [endCallInternal]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      activeRef.current = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      voiceStream.stopListening();
      voiceStream.stopSpeaking();
    };
  }, []);

  const value: NexusVoiceCallContextValue = {
    isCallActive: callStatus === 'active' || callStatus === 'connecting' || callStatus === 'ending',
    callStatus,
    messages,
    callDuration,
    sessionId,
    interimText: voiceStream.interimText,
    isSpeaking: voiceStream.isSpeaking,
    isListening: voiceStream.isListening,
    startCall,
    endCall,
  };

  return (
    <NexusVoiceCallContext.Provider value={value}>
      {children}
    </NexusVoiceCallContext.Provider>
  );
}
