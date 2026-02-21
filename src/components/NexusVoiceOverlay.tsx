import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { PhoneOff, Mic, MicOff, Bot } from 'lucide-react';
import { useNexusVoiceCall } from '../contexts/NexusVoiceCallContext';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function WaveformBars({ active }: { active: boolean }) {
  return (
    <div className="flex items-center gap-[2px] h-5">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="w-[2px] rounded-full bg-emerald-400/80"
          style={{
            height: active ? undefined : '4px',
            animation: active
              ? `nexusWave 0.8s ease-in-out ${i * 0.06}s infinite alternate`
              : 'none',
            transition: 'height 0.3s ease',
          }}
        />
      ))}
    </div>
  );
}

export function NexusVoiceOverlay() {
  const {
    isCallActive,
    callStatus,
    callDuration,
    isSpeaking,
    isListening,
    endCall,
  } = useNexusVoiceCall();

  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!isCallActive) {
      setPortalContainer(null);
      return;
    }
    let el = document.getElementById('nexus-voice-overlay-root');
    if (!el) {
      el = document.createElement('div');
      el.id = 'nexus-voice-overlay-root';
      document.body.appendChild(el);
    }
    setPortalContainer(el);

    return () => {
      // Don't remove — may still be needed if call continues across navigations
    };
  }, [isCallActive]);

  // Inject keyframes once
  useEffect(() => {
    const styleId = 'nexus-wave-keyframes';
    if (document.getElementById(styleId)) return;
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes nexusWave {
        0% { height: 4px; }
        100% { height: 18px; }
      }
      @keyframes nexusPulseGlow {
        0%, 100% { opacity: 0.06; }
        50% { opacity: 0.12; }
      }
      @keyframes nexusBorderGlow {
        0%, 100% { opacity: 0.15; }
        50% { opacity: 0.4; }
      }
    `;
    document.head.appendChild(style);
  }, []);

  if (!isCallActive || !portalContainer) return null;

  const overlay = (
    <>
      {/* Full-screen green tint overlay — pointer-events: none so users can scroll/click */}
      <div
        className="fixed inset-0 z-[9998] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(16,185,129,0.06) 0%, rgba(16,185,129,0.03) 60%, transparent 100%)',
          animation: 'nexusPulseGlow 3s ease-in-out infinite',
        }}
      />

      {/* Edge glow borders */}
      <div
        className="fixed inset-0 z-[9998] pointer-events-none"
        style={{
          boxShadow: 'inset 0 0 80px rgba(16,185,129,0.08), inset 0 0 200px rgba(16,185,129,0.04)',
          animation: 'nexusBorderGlow 4s ease-in-out infinite',
        }}
      />

      {/* Floating controls bar — bottom of screen */}
      <div className="fixed bottom-0 left-0 right-0 z-[9999] pointer-events-none">
        <div className="flex justify-center pb-4 px-4">
          <div
            className="pointer-events-auto flex items-center gap-4 bg-[#0d1117]/95 backdrop-blur-xl border border-emerald-500/30 rounded-2xl px-5 py-3 shadow-2xl shadow-emerald-500/10"
            style={{ minWidth: '320px', maxWidth: '480px' }}
          >
            {/* Nexus avatar + status */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                  <Bot className="w-4.5 h-4.5 text-white" />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0d1117] animate-pulse" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-emerald-400 truncate">Connected to Nexus</p>
                <p className="text-[10px] text-white/40">
                  {isSpeaking ? 'Speaking...' : isListening ? 'Listening...' : callStatus === 'connecting' ? 'Connecting...' : 'Active'}
                </p>
              </div>
            </div>

            {/* Waveform */}
            <WaveformBars active={isSpeaking || isListening} />

            {/* Timer */}
            <span className="text-sm font-mono text-white/60 tabular-nums shrink-0">
              {formatTime(callDuration)}
            </span>

            {/* Mic indicator */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
              isListening ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/30'
            }`}>
              {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
            </div>

            {/* End call button */}
            <button
              onClick={endCall}
              className="w-9 h-9 bg-red-500/90 hover:bg-red-500 rounded-full flex items-center justify-center shrink-0 transition-all hover:scale-105 active:scale-95"
              aria-label="End voice call"
            >
              <PhoneOff className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(overlay, portalContainer);
}
