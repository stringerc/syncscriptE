import { useEffect, useMemo, useRef, memo } from 'react';
import { motion } from 'motion/react';
import { Headphones, Zap, Calendar, Bot, PhoneOff, ArrowRight, Mic } from 'lucide-react';
import { ScrollSection } from '../scroll/ScrollSection';
import { splitScreen } from '../scroll/animations';
import { useNexusVoiceCall } from '../../contexts/useNexusVoiceCall';

export const LandingNexusSection = memo(function LandingNexusSection() {
  const nexusVoice = useNexusVoiceCall();
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const mockWaveHeights = useMemo(
    () => Array.from({ length: 24 }, () => Math.floor(Math.random() * 28 + 6)),
    [],
  );
  const mockWaveDurations = useMemo(
    () => Array.from({ length: 24 }, () => 0.8 + Math.random() * 0.6),
    [],
  );
  const liveWaveHeights = useMemo(
    () => Array.from({ length: 12 }, () => Math.floor(Math.random() * 22 + 10)),
    [],
  );
  const liveWaveDurations = useMemo(
    () => Array.from({ length: 12 }, () => 0.58 + Math.random() * 0.38),
    [],
  );
  const transcriptSignature = useMemo(() => {
    const last = nexusVoice.messages[nexusVoice.messages.length - 1];
    const lastTextLen = last?.text?.length || 0;
    const lastId = last?.id || 'none';
    return [
      nexusVoice.messages.length,
      lastId,
      lastTextLen,
      nexusVoice.interimText.length,
      nexusVoice.heardText.length,
      nexusVoice.isProcessing ? 1 : 0,
      nexusVoice.isVoiceLoading ? 1 : 0,
    ].join(':');
  }, [
    nexusVoice.messages,
    nexusVoice.interimText,
    nexusVoice.heardText,
    nexusVoice.isProcessing,
    nexusVoice.isVoiceLoading,
  ]);

  useEffect(() => {
    if (chatScrollRef.current && nexusVoice.isCallActive) {
      // Keep latest user/Nexus transcript visible while text streams in.
      requestAnimationFrame(() => {
        if (!chatScrollRef.current) return;
        chatScrollRef.current.scrollTo({
          top: chatScrollRef.current.scrollHeight,
          behavior: 'smooth',
        });
      });
    }
  }, [transcriptSignature, nexusVoice.isCallActive]);

  useEffect(() => {
    const root = document.querySelector<HTMLElement>('[data-marketing-root]');
    if (!root) return;
    root.setAttribute('data-voice-performance', nexusVoice.isCallActive ? 'on' : 'off');
    return () => {
      root.setAttribute('data-voice-performance', 'off');
    };
  }, [nexusVoice.isCallActive]);

  return (
    <ScrollSection id="nexus" animation={splitScreen}>
      <section id="voice-calling" className="py-20 sm:py-28 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <div>
                <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 rounded-full px-4 py-1.5 mb-6">
                  <Headphones className="w-4 h-4 text-indigo-400" />
                  <span className="text-indigo-400 font-medium text-xs sm:text-sm">Voice-First AI</span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold mb-4 sm:mb-6 tracking-[-0.02em]">
                  Ask Nexus.
                  <br />
                  <span className="text-indigo-300">Curious about SyncScript?</span>
                </h2>
                <p className="text-base sm:text-lg text-white/70 mb-8 leading-relaxed font-light">
                  Nexus is your AI scheduling assistant you can actually talk to. Get morning briefings,
                  reschedule tasks, and plan your week - all through a natural voice conversation,
                  no screen required.
                </p>
                <div className="space-y-4 mb-8">
                  {[
                    { icon: <Zap className="w-5 h-5" />, title: 'Morning Briefings', desc: 'Nexus calls you with a personalized rundown of your day, energy forecast, and top priorities.' },
                    { icon: <Calendar className="w-5 h-5" />, title: 'Voice Scheduling', desc: 'Say "Move my 2pm meeting to Thursday" and it happens. Natural language, zero friction.' },
                    { icon: <Bot className="w-5 h-5" />, title: 'Contextual Intelligence', desc: 'Nexus remembers your patterns, preferences, and past conversations - every call gets smarter.' },
                  ].map((item, i) => (
                    <motion.div
                      key={item.title}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className="flex gap-4"
                    >
                      <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center text-indigo-400 shrink-0">
                        {item.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold text-white mb-1">{item.title}</h4>
                        <p className="text-sm text-white/60 leading-relaxed">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
                {nexusVoice.isCallActive ? (
                  <button
                    onClick={nexusVoice.endCall}
                    className="group bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-8 py-3 rounded-lg font-medium shadow-lg shadow-red-500/20 inline-flex items-center gap-3 transition-colors duration-150 active:scale-[0.98]"
                  >
                    <PhoneOff className="w-5 h-5" />
                    End Voice Chat
                  </button>
                ) : (
                  <button
                    onClick={() => { void nexusVoice.startCall(); }}
                    className="group bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-8 py-3 rounded-lg font-medium shadow-lg shadow-indigo-500/20 inline-flex items-center gap-3 transition-colors duration-150 active:scale-[0.98]"
                  >
                    <Headphones className="w-5 h-5" />
                    Try Asking Nexus
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                )}
              </div>
            </div>

            <div className="relative nexus-voice-essential">
              <div className={`rounded-2xl p-6 sm:p-8 relative overflow-hidden border transition-all duration-500 ${
                nexusVoice.isCallActive
                  ? 'bg-gradient-to-br from-emerald-900/30 to-teal-900/30 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                  : 'bg-gradient-to-br from-indigo-900/30 to-purple-900/30 border-indigo-500/30'
              }`}>
                <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl transition-colors duration-500 ${
                  nexusVoice.isCallActive ? 'bg-emerald-500/10' : 'bg-indigo-500/10'
                }`} />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                        nexusVoice.isCallActive
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-500'
                          : 'bg-gradient-to-br from-indigo-500 to-purple-500'
                      }`}>
                        <Bot className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white">Nexus AI</h4>
                        <div className="flex items-center gap-1.5">
                          {nexusVoice.isCallActive ? (
                            <>
                              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                              <span className="text-xs text-emerald-400">
                                {nexusVoice.isVoiceLoading
                                  ? 'Preparing voice...'
                                  : nexusVoice.isSpeaking
                                    ? 'Speaking'
                                    : nexusVoice.voiceError
                                      ? 'Mic attention needed'
                                      : nexusVoice.isListening
                                        ? 'Listening'
                                        : 'Connected'}
                              </span>
                            </>
                          ) : (
                            <>
                              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                              <span className="text-xs text-green-400">Connected</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-sm text-white/40 font-mono tabular-nums">
                      {nexusVoice.isCallActive
                        ? `${Math.floor(nexusVoice.callDuration / 60)}:${(nexusVoice.callDuration % 60).toString().padStart(2, '0')}`
                        : '2:47'}
                    </span>
                  </div>

                  <div
                    ref={chatScrollRef}
                    className="ambient-scrollbar space-y-3 overflow-y-auto pr-1"
                    style={{ height: '240px', minHeight: '240px', maxHeight: '240px', scrollBehavior: 'smooth' }}
                  >
                    {nexusVoice.isCallActive ? (
                      <>
                        {nexusVoice.messages.map((msg) => {
                          const isEmptyNexusBubble = msg.role === 'nexus' && !msg.text.trim();

                          return (
                            <div
                              key={msg.id}
                              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                                msg.role === 'user'
                                  ? 'bg-emerald-500/20 border border-emerald-500/30 text-white/90'
                                  : 'bg-white/5 border border-white/10 text-white/80'
                              }`}>
                                {isEmptyNexusBubble ? (
                                  <div className="flex items-center gap-1.5">
                                    <div className="nexus-ios-dot w-2 h-2 bg-emerald-300 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]" style={{ animationDelay: '0ms' }} />
                                    <div className="nexus-ios-dot w-2 h-2 bg-emerald-300 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]" style={{ animationDelay: '160ms' }} />
                                    <div className="nexus-ios-dot w-2 h-2 bg-emerald-300 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.6)]" style={{ animationDelay: '320ms' }} />
                                  </div>
                                ) : (
                                  msg.text
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {(nexusVoice.interimText || nexusVoice.heardText) && (
                          <div className="flex justify-end">
                            <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed bg-indigo-500/14 border border-indigo-300/40 text-indigo-100 shadow-[0_0_0_1px_rgba(99,102,241,0.15)]">
                              <span className="text-[10px] uppercase tracking-wider text-indigo-300/80 block mb-1">
                                Live transcript
                              </span>
                              <span className="italic">
                                {nexusVoice.interimText || nexusVoice.heardText}
                                {nexusVoice.interimText ? '...' : ''}
                              </span>
                            </div>
                          </div>
                        )}
                        {nexusVoice.isListening && !nexusVoice.interimText && !nexusVoice.heardText && !nexusVoice.isProcessing && !nexusVoice.isSpeaking && (
                          <div className="flex justify-end">
                            <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm bg-indigo-500/12 border border-indigo-400/30 text-indigo-200/90">
                              <div className="flex items-center gap-2.5">
                                <div className="flex items-end gap-1 h-4">
                                  <span className="w-1 rounded-full bg-indigo-300/95 transition-[height] duration-100" style={{ height: `${6 + Math.round(nexusVoice.micLevel * 11)}px` }} />
                                  <span className="w-1 rounded-full bg-cyan-300/95 transition-[height] duration-100" style={{ height: `${7 + Math.round(nexusVoice.micLevel * 15)}px` }} />
                                  <span className="w-1 rounded-full bg-indigo-300/95 transition-[height] duration-100" style={{ height: `${6 + Math.round(nexusVoice.micLevel * 12)}px` }} />
                                </div>
                                <span className="italic tracking-wide">Transcribing...</span>
                              </div>
                            </div>
                          </div>
                        )}
                        {nexusVoice.isVoiceLoading && !nexusVoice.messages.some((msg) => msg.role === 'nexus') && (
                          <div className="flex justify-start">
                            <div className="bg-white/5 border border-emerald-500/30 rounded-2xl px-4 py-3 flex items-center gap-1.5">
                              <div className="nexus-ios-dot w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.75)]" style={{ animationDelay: '0ms' }} />
                              <div className="nexus-ios-dot w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.75)]" style={{ animationDelay: '180ms' }} />
                              <div className="nexus-ios-dot w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.75)]" style={{ animationDelay: '360ms' }} />
                            </div>
                          </div>
                        )}
                        {nexusVoice.isProcessing && !nexusVoice.isVoiceLoading && !nexusVoice.messages.some((msg) => msg.role === 'nexus') && (
                          <div className="flex justify-start">
                            <div className="bg-white/5 border border-emerald-500/30 rounded-2xl px-4 py-3 flex items-center gap-1.5">
                              <div className="nexus-ios-dot w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.75)]" style={{ animationDelay: '0ms' }} />
                              <div className="nexus-ios-dot w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.75)]" style={{ animationDelay: '180ms' }} />
                              <div className="nexus-ios-dot w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.75)]" style={{ animationDelay: '360ms' }} />
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      [
                        {
                          speaker: 'nexus',
                          text: "Good morning! I see you have 6 tasks today. Your peak focus window is 9-11am - I've moved your deep work there.",
                        },
                        {
                          speaker: 'user',
                          text: 'Can you push my 2pm meeting to Thursday?',
                        },
                        {
                          speaker: 'nexus',
                          text: "Done. I've rescheduled your 2pm with the design team to Thursday at the same time. I also freed up a 45-minute focus block in its place.",
                        },
                      ].map((msg, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.4 + i * 0.2 }}
                          className={`flex ${msg.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                            msg.speaker === 'user'
                              ? 'bg-indigo-500/20 border border-indigo-500/30 text-white/90'
                              : 'bg-white/5 border border-white/10 text-white/80'
                          }`}>
                            {msg.text}
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>

                  {nexusVoice.isCallActive && nexusVoice.callStatus === 'active' && !nexusVoice.isProcessing && nexusVoice.messages.filter(m => m.role === 'user').length < 2 && (
                    <div className="flex flex-wrap gap-2 py-2">
                      {['How does AI scheduling work?', "What's the pricing?", 'How is this different from Notion?'].map((chip) => (
                        <button
                          key={chip}
                          onClick={() => nexusVoice.sendTextMessage(chip)}
                          className="text-xs bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 hover:border-emerald-400/50 text-emerald-300 rounded-full px-3 py-1.5 transition-all hover:scale-[1.03] active:scale-95"
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-1 justify-center h-10">
                    {nexusVoice.isCallActive ? (
                      <>
                        {nexusVoice.isListening && (
                          <div className="flex items-center gap-2 mr-3">
                            <Mic className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                            <span className="text-[10px] text-emerald-400/70 uppercase tracking-wider">Listening</span>
                          </div>
                        )}
                        {Array.from({ length: 12 }).map((_, i) => {
                          // Animate bars from user mic activity only.
                          const userTalking =
                            nexusVoice.micLevel > 0.03 || (!!nexusVoice.interimText && nexusVoice.isListening);
                          const shouldAnimate = userTalking;
                          const energy = Math.min(1, Math.max(0, nexusVoice.micLevel));
                          const targetHeight = Math.max(
                            7,
                            Math.round(8 + liveWaveHeights[i] * (0.55 + energy * 0.9)),
                          );

                          return (
                          <motion.div
                            key={i}
                            className={`w-1 rounded-full transition-all ${
                              nexusVoice.isCallActive
                                ? 'bg-gradient-to-t from-emerald-500 to-teal-400'
                                : 'bg-gradient-to-t from-indigo-500 to-purple-400'
                            }`}
                            animate={
                              shouldAnimate
                                ? { height: [4, targetHeight, 4] }
                                : { height: 4 }
                            }
                            transition={
                              shouldAnimate
                                ? {
                                    duration: liveWaveDurations[i],
                                    repeat: Infinity,
                                    delay: i * 0.035,
                                    ease: 'easeInOut',
                                  }
                                : { duration: 0.14, ease: 'easeOut' }
                            }
                          />
                          );
                        })}
                      </>
                    ) : (
                      Array.from({ length: 24 }).map((_, i) => (
                        <motion.div
                          key={i}
                          className="w-1 bg-gradient-to-t from-indigo-500 to-purple-400 rounded-full"
                          animate={{
                            height: [4, mockWaveHeights[i], 4],
                          }}
                          transition={{
                            duration: mockWaveDurations[i],
                            repeat: Infinity,
                            delay: i * 0.04,
                            ease: 'easeInOut',
                          }}
                        />
                      ))
                    )}
                  </div>

                  {nexusVoice.isCallActive && nexusVoice.voiceError && (
                    <div className="mt-3 rounded-lg border border-amber-500/35 bg-amber-500/10 px-3 py-2">
                      <p className="text-[11px] text-amber-200">
                        {nexusVoice.voiceError}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </ScrollSection>
  );
});
