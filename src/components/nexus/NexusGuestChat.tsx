import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {Send, Bot, User, Sparkles, ArrowRight, X} from 'lucide-react';
import { NEXUS_GUEST_CHAT_PATH } from '../../config/nexus-vercel-ai-routes';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_PROMPTS = [
  "How does energy scheduling work?",
  "Can Nexus manage my calendar?",
  "What's included in the free plan?",
];

const SIGNUP_CTA_MESSAGE = "If you'd like to try it yourself, I can get you set up in about sixty seconds. ";

/**
 * NexusGuestChat — lightweight text chat that connects to /api/ai/nexus-guest.
 *
 * Uses the Hooked UX model: the multi-turn conversation IS the variable reward.
 * After 3+ assistant turns, Nexus appends a soft signup suggestion.
 * After 5+ turns, the component surfaces a prominent signup card.
 * The signup card appears at the natural end of a response, not as an interruption.
 */
export function NexusGuestChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `gst_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`);
  const [showSignup, setShowSignup] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const assistantTurnCount = messages.filter(m => m.role === 'assistant').length;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Show signup card after 3+ assistant turns (Hook Model: Investment → next trigger)
  useEffect(() => {
    if (assistantTurnCount >= 3 && !showSignup) {
      setShowSignup(true);
    }
  }, [assistantTurnCount, showSignup]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = { role: 'user', content: text.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(NEXUS_GUEST_CHAT_PATH, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          sessionId,
          context: { surface: 'landing_guest_chat' },
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to get response' }));
        setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, I'm having trouble right now. Try again?` }]);
        setIsLoading(false);
        return;
      }

      const data = await res.json();
      const content = data.content || data.message || "I'm here — ask me anything about SyncScript.";

      // Append soft signup nudge after 3+ turns if the AI didn't already suggest it
      let finalContent = content;
      if (assistantTurnCount >= 2 && !content.toLowerCase().includes('sign up') && !content.toLowerCase().includes('create an account') && !content.toLowerCase().includes('try it yourself')) {
        finalContent = content + ' ' + SIGNUP_CTA_MESSAGE;
      }

      setMessages(prev => [...prev, { role: 'assistant', content: finalContent }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "I seem to be offline right now. Feel free to explore the page or try again in a moment." }]);
    }

    setIsLoading(false);
  }, [messages, isLoading, sessionId, assistantTurnCount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* Chat container */}
      <div className="relative rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white/90">Ask Nexus</p>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full inline-block animate-pulse" />
                Online
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <span className="text-[10px] text-white/30 tabular-nums">
              {messages.filter(m => m.role === 'assistant').length}/{15}
            </span>
          )}
        </div>

        {/* Messages area */}
        <div ref={scrollRef} className="px-4 py-3 space-y-3 min-h-[120px] max-h-[280px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {/* Empty state — suggested prompts */}
          {messages.length === 0 && !isLoading && (
            <div className="py-4 space-y-3">
              <p className="text-center text-white/40 text-xs mb-3">Try asking...</p>
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="w-full text-left text-xs text-white/60 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 hover:bg-white/[0.08] hover:border-cyan-500/20 hover:text-white/80 transition-all"
                >
                  <Sparkles className="w-3 h-3 inline mr-1.5 text-cyan-400/60" />
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Message bubbles */}
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500/40 to-purple-500/40 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-indigo-300" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-indigo-500/20 border border-indigo-500/30 text-white/90'
                      : 'bg-white/[0.04] border border-white/[0.06] text-white/70'
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-3.5 h-3.5 text-white/60" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-2 justify-start"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500/40 to-purple-500/40 flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5 text-indigo-300" />
              </div>
              <div className="bg-white/[0.04] border border-white/[0.06] rounded-2xl px-3.5 py-2.5">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Signup nudge — appears after 3+ turns (Hook Model investment → next trigger) */}
        <AnimatePresence>
          {showSignup && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4 }}
              className="px-4 pb-2"
            >
              <div className="rounded-xl bg-gradient-to-r from-indigo-500/[0.12] to-purple-500/[0.12] border border-indigo-500/30 px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-white/90">Keep this going — sign up free</p>
                  <p className="text-[10px] text-white/50 mt-0.5">Full Nexus, tasks, calendar, energy tracking</p>
                </div>
                <a
                  href="/signup"
                  className="shrink-0 inline-flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-medium px-3.5 py-2 rounded-lg transition-all shadow-lg shadow-indigo-500/20"
                >
                  Sign Up
                  <ArrowRight className="w-3 h-3" />
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input bar */}
        <form onSubmit={handleSubmit} className="flex items-center gap-2 px-3 py-2.5 border-t border-white/[0.06] bg-white/[0.02]">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about SyncScript..."
            disabled={isLoading}
            className="flex-1 bg-transparent text-xs text-white/90 placeholder-white/30 outline-none disabled:opacity-40"
            maxLength={500}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-8 h-8 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/40 border border-indigo-500/30 flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Send className="w-3.5 h-3.5 text-indigo-300" />
          </button>
        </form>
      </div>

      {/* Subtle trust signal */}
      <p className="text-center text-[10px] text-white/20 mt-2">
        No account needed · 15 messages free · <a href="/login?guest=true" className="underline hover:text-white/40 transition-colors">or try the full demo</a>
      </p>
    </div>
  );
}
