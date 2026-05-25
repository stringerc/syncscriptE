/**
 * DailyOpsModal — The operating rhythm of a high-performance life.
 *
 * Three tabs tied to circadian cadence:
 * - Daily Brief: Strategic briefing (morning=reductive focus, midday=course correction)
 * - Thought Bubble: Living context — notes, links, ideas that Nexus can reference
 * - Debrief: Cognitive offload — wins, reflections, tomorrow's intentions
 *
 * The default tab shifts with time-of-day:
 * - 5AM-12PM → Daily Brief
 * - 12PM-5PM → Daily Brief (course correction mode)
 * - 5PM-11PM → Debrief (offload mode)
 *
 * Research:
 * - Huberman Lab: Circadian peak 9AM-1PM, valley 2-4PM
 * - Atomic Habits (Clear): Habit stacking + environment design
 * - Hooked (Eyal): Variable reward + investment = retention
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Sun, Sunset, Moon, Brain, NotepadText, CheckCircle2,
  RefreshCw, Volume2, Phone, Lightbulb, Link2, MessageSquare,
  ChevronRight, Sparkles, Calendar, TrendingUp, Target, AlertTriangle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

type Tab = 'brief' | 'notes' | 'debrief';
type Cadence = 'morning' | 'midday' | 'evening';

function getCadence(): Cadence {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'midday';
  return 'evening';
}

function getDefaultTab(): Tab {
  const cadence = getCadence();
  if (cadence === 'evening') return 'debrief';
  return 'brief';
}

const CADENCE_CONFIG: Record<Cadence, { icon: typeof Sun; label: string; color: string }> = {
  morning: { icon: Sun, label: 'Focus Blueprint', color: 'text-amber-400' },
  midday: { icon: TrendingUp, label: 'Course Correction', color: 'text-cyan-400' },
  evening: { icon: Moon, label: 'Cognitive Offload', color: 'text-indigo-400' },
};

interface DailyOpsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DailyOpsModal({ isOpen, onClose }: DailyOpsModalProps) {
  const { accessToken } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>(getDefaultTab());
  const [briefing, setBriefing] = useState<any>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [notes, setNotes] = useState<string[]>([]);
  const [noteInput, setNoteInput] = useState('');
  const [debriefWins, setDebriefWins] = useState<string[]>([]);
  const [debriefReflection, setDebriefReflection] = useState('');
  const [debriefTomorrow, setDebriefTomorrow] = useState('');
  const [winInput, setWinInput] = useState('');
  const [speaking, setSpeaking] = useState(false);

  const cadence = getCadence();
  const cadenceConfig = CADENCE_CONFIG[cadence];

  // Load notes and debrief from localStorage
  useEffect(() => {
    if (!isOpen) return;
    const today = new Date().toISOString().split('T')[0];
    try {
      const savedNotes = localStorage.getItem(`syncscript_notes_${today}`);
      if (savedNotes) setNotes(JSON.parse(savedNotes));
      const savedDebrief = localStorage.getItem(`syncscript_debrief_${today}`);
      if (savedDebrief) {
        const d = JSON.parse(savedDebrief);
        setDebriefWins(d.wins || []);
        setDebriefReflection(d.reflection || '');
        setDebriefTomorrow(d.tomorrow || '');
      }
    } catch {}
  }, [isOpen]);

  // Save notes
  const saveNotes = useCallback((updated: string[]) => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`syncscript_notes_${today}`, JSON.stringify(updated));
    // Also save to Supabase for Nexus context (fire and forget)
    if (accessToken) {
      fetch('/api/ai/insights?resource=context-capture', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'thought_bubble', notes: updated, date: today }),
      }).catch(() => {});
    }
  }, [accessToken]);

  // Save debrief
  const saveDebrief = useCallback((wins: string[], reflection: string, tomorrow: string) => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem(`syncscript_debrief_${today}`, JSON.stringify({ wins, reflection, tomorrow }));
    if (accessToken) {
      fetch('/api/ai/insights?resource=context-capture', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'debrief', wins, reflection, tomorrow, date: today }),
      }).catch(() => {});
    }
  }, [accessToken]);

  // Fetch briefing
  const fetchBriefing = useCallback(async (force = false) => {
    if (!accessToken) return;
    setBriefLoading(true);
    try {
      const res = await fetch(`/api/ai/insights?resource=harmony-brief&cadence=${cadence}`, {
        method: force ? 'POST' : 'GET',
        headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.brief) setBriefing(data.brief);
      }
    } catch (e) {
      console.error('[DailyOps] Brief fetch failed:', e);
    } finally {
      setBriefLoading(false);
    }
  }, [accessToken, cadence]);

  useEffect(() => {
    if (isOpen && activeTab === 'brief' && !briefing) fetchBriefing();
  }, [isOpen, activeTab, briefing, fetchBriefing]);

  const handleAddNote = () => {
    if (!noteInput.trim()) return;
    const updated = [...notes, noteInput.trim()];
    setNotes(updated);
    setNoteInput('');
    saveNotes(updated);
  };

  const handleRemoveNote = (idx: number) => {
    const updated = notes.filter((_, i) => i !== idx);
    setNotes(updated);
    saveNotes(updated);
  };

  const handleAddWin = () => {
    if (!winInput.trim()) return;
    const updated = [...debriefWins, winInput.trim()];
    setDebriefWins(updated);
    setWinInput('');
    setDebriefReflection(debriefReflection);
    setDebriefTomorrow(debriefTomorrow);
    saveDebrief(updated, debriefReflection, debriefTomorrow);
  };

  const handleRemoveWin = (idx: number) => {
    const updated = debriefWins.filter((_, i) => i !== idx);
    setDebriefWins(updated);
    saveDebrief(updated, debriefReflection, debriefTomorrow);
  };

  const handleDebriefChange = (field: 'reflection' | 'tomorrow', value: string) => {
    if (field === 'reflection') setDebriefReflection(value);
    else setDebriefTomorrow(value);
    saveDebrief(debriefWins, field === 'reflection' ? value : debriefReflection, field === 'tomorrow' ? value : debriefTomorrow);
  };

  const handleSpeak = () => {
    if (!briefing?.text) return;
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
    const utterance = new SpeechSynthesisUtterance(briefing.text);
    const voices = window.speechSynthesis.getVoices();
    const premium = voices.find(v => v.name.includes('Google') || v.name.includes('Natural'));
    if (premium) utterance.voice = premium;
    utterance.rate = 1.05;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleSaveOffload = () => {
    saveDebrief(debriefWins, debriefReflection, debriefTomorrow);
    toast.success('Offload saved — sleep clean tonight.');
  };

  const tabs: { key: Tab; label: string; icon: typeof Brain }[] = [
    { key: 'brief', label: 'Daily Brief', icon: Calendar },
    { key: 'notes', label: 'Thought Bubble', icon: Lightbulb },
    { key: 'debrief', label: 'Debrief', icon: Moon },
  ];

  const currentHour = new Date().getHours();
  const formatHour = (h: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${display}${period}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
          >
            <div className="w-full max-w-2xl max-h-[85vh] rounded-2xl border border-white/10 bg-gradient-to-b from-[#0f1620] to-[#0a0e18] shadow-2xl flex flex-col overflow-hidden">

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    cadence === 'morning' ? 'bg-amber-500/20' : cadence === 'midday' ? 'bg-cyan-500/20' : 'bg-indigo-500/20'
                  }`}>
                    <cadenceConfig.icon className={`w-4 h-4 ${cadenceConfig.color}`} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{cadenceConfig.label}</p>
                    <p className="text-[10px] text-white/40">{formatHour(currentHour)} — {cadence === 'morning' ? 'Peak focus ahead' : cadence === 'midday' ? 'Stay on track' : 'Wind down & offload'}</p>
                  </div>
                </div>
                <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                  <X className="w-4 h-4 text-white/50" />
                </button>
              </div>

              {/* Tab bar */}
              <div className="flex border-b border-white/[0.06] px-5">
                {tabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 px-4 py-3 text-xs font-medium transition-all border-b-2 ${
                      activeTab === tab.key
                        ? 'border-indigo-400 text-white'
                        : 'border-transparent text-white/40 hover:text-white/60'
                    }`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                    {tab.key === 'notes' && notes.length > 0 && (
                      <span className="ml-1 text-[9px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-full">{notes.length}</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                <AnimatePresence mode="wait">
                  {/* ── Daily Brief Tab ─────────────────────── */}
                  {activeTab === 'brief' && (
                    <motion.div key="brief" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                      {briefLoading ? (
                        <div className="py-12 flex flex-col items-center gap-3">
                          <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                          <p className="text-xs text-slate-400 animate-pulse">Synthesizing your {cadenceConfig.label.toLowerCase()}...</p>
                        </div>
                      ) : briefing ? (
                        <div className="space-y-4">
                          {/* Conflicts */}
                          {briefing.conflicts?.length > 0 && (
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-3">
                              <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-xs font-medium text-amber-300 mb-1">Schedule Conflicts</p>
                                {briefing.conflicts.map((c: string, i: number) => (
                                  <p key={i} className="text-[11px] text-amber-400/80">{c}</p>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Brief text */}
                          <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">{briefing.text}</p>

                          {/* Hourly Timeline */}
                          {briefing.hourlyPlan?.length > 0 && (
                            <div className="space-y-1 pt-2">
                              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Hour-by-Hour</p>
                              {briefing.hourlyPlan.filter((s: any) => s.events?.length > 0 || s.action || s.taskRecommendation).map((slot: any, i: number) => {
                                const isNow = slot.hour === currentHour;
                                const isPeak = slot.hour >= 9 && slot.hour <= 13;
                                return (
                                  <div key={i} className={`flex items-center gap-3 px-2 py-1.5 rounded-lg ${isNow ? 'bg-emerald-500/10' : ''}`}>
                                    <span className={`w-10 text-[11px] font-mono text-right ${isNow ? 'text-emerald-400 font-semibold' : 'text-slate-500'}`}>
                                      {slot.hour === 0 ? '12a' : slot.hour <= 12 ? `${slot.hour}a` : `${slot.hour-12}p`}
                                    </span>
                                    <div className={`w-1 h-5 rounded-full ${isPeak ? 'bg-cyan-500/40' : 'bg-slate-700/50'}`} />
                                    <span className="text-xs text-slate-300 flex-1">
                                      {slot.events?.join(', ') || slot.action || slot.taskRecommendation || '—'}
                                    </span>
                                    {isPeak && <span className="text-[9px] bg-cyan-500/10 text-cyan-400 px-1.5 rounded-full">Peak</span>}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          {/* Data freshness */}
                          {briefing.sources && (
                            <div className="flex flex-wrap gap-2 pt-2">
                              {Object.entries(briefing.sources).map(([key, val]: [string, any]) => (
                                <span key={key} className={`text-[9px] px-1.5 py-0.5 rounded-full font-mono ${val === 'live' ? 'bg-emerald-500/10 text-emerald-400' : val === 'cached' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-slate-700/30 text-slate-500'}`}>
                                  {key}: {val === 'live' ? '●' : val === 'cached' ? '◐' : '○'}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2 pt-2">
                            <button onClick={() => fetchBriefing(true)} className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-800 transition-colors">
                              <RefreshCw className="w-3 h-3" /> Refresh
                            </button>
                            <button onClick={handleSpeak} className={`text-[11px] flex items-center gap-1 px-2 py-1 rounded transition-colors ${speaking ? 'text-rose-400 bg-rose-500/10' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                              <Volume2 className="w-3 h-3" /> {speaking ? 'Stop' : 'Listen'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="py-8 text-center text-xs text-slate-500">
                          Briefing unavailable. Click refresh to retry.
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* ── Thought Bubble Tab ───────────────────── */}
                  {activeTab === 'notes' && (
                    <motion.div key="notes" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
                      <p className="text-xs text-slate-400">
                        Capture thoughts, links, and ideas. Nexus can reference these as context.
                      </p>

                      {/* Input */}
                      <div className="flex gap-2">
                        <input
                          value={noteInput}
                          onChange={(e) => setNoteInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                          placeholder="Type a thought, drop a link, paste an article..."
                          className="flex-1 bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-indigo-500/40 transition-colors"
                        />
                        <button
                          onClick={handleAddNote}
                          className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs text-white font-medium transition-colors"
                        >
                          Add
                        </button>
                      </div>

                      {/* Notes list */}
                      {notes.length === 0 ? (
                        <div className="py-8 text-center">
                          <Lightbulb className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                          <p className="text-xs text-slate-500">Your thought bubble is empty. Start capturing.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {notes.map((note, idx) => {
                            const isUrl = /^https?:\/\//.test(note);
                            return (
                              <div key={idx} className="flex items-start gap-2 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06] group">
                                {isUrl ? (
                                  <Link2 className="w-3.5 h-3.5 text-cyan-400 mt-0.5 flex-shrink-0" />
                                ) : (
                                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400 mt-0.5 flex-shrink-0" />
                                )}
                                <p className="text-xs text-slate-300 flex-1 break-all">{note}</p>
                                <button
                                  onClick={() => handleRemoveNote(idx)}
                                  className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all text-[10px]"
                                >
                                  remove
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {notes.length > 0 && (
                        <p className="text-[10px] text-slate-500 text-center">
                          {notes.length} thought{notes.length !== 1 ? 's' : ''} captured today — Nexus can reference these
                        </p>
                      )}
                    </motion.div>
                  )}

                  {/* ── Debrief Tab ─────────────────────────── */}
                  {activeTab === 'debrief' && (
                    <motion.div key="debrief" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-5">
                      {/* Wins */}
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-slate-300 flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          What I accomplished today
                        </p>
                        <div className="flex gap-2">
                          <input
                            value={winInput}
                            onChange={(e) => setWinInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddWin()}
                            placeholder="Add a win..."
                            className="flex-1 bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-emerald-500/40 transition-colors"
                          />
                          <button onClick={handleAddWin} className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-xs text-white font-medium transition-colors">+</button>
                        </div>
                        {debriefWins.map((win, idx) => (
                          <div key={idx} className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/10 group">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                            <p className="text-xs text-emerald-300 flex-1">{win}</p>
                            <button onClick={() => handleRemoveWin(idx)} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all text-[10px]">remove</button>
                          </div>
                        ))}
                      </div>

                      {/* Reflection */}
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-slate-300 flex items-center gap-2">
                          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                          How the day went — notes & reflections
                        </p>
                        <textarea
                          value={debriefReflection}
                          onChange={(e) => handleDebriefChange('reflection', e.target.value)}
                          placeholder="What worked? What didn't? How are you feeling?"
                          rows={3}
                          className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-violet-500/40 transition-colors resize-none"
                        />
                      </div>

                      {/* Tomorrow */}
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-slate-300 flex items-center gap-2">
                          <Target className="w-3.5 h-3.5 text-amber-400" />
                          What I want to accomplish tomorrow
                        </p>
                        <textarea
                          value={debriefTomorrow}
                          onChange={(e) => handleDebriefChange('tomorrow', e.target.value)}
                          placeholder="The One Thing that makes tomorrow a win. Plus anything else on your mind for tomorrow."
                          rows={3}
                          className="w-full bg-white/[0.04] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/25 outline-none focus:border-amber-500/40 transition-colors resize-none"
                        />
                      </div>

                      {/* Save */}
                      <button
                        onClick={handleSaveOffload}
                        className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl text-sm font-medium text-white transition-all shadow-lg shadow-indigo-500/20"
                      >
                        Save & Clear My Mind
                      </button>

                      <p className="text-[10px] text-slate-500 text-center">
                        Everything is captured. Sleep clean — Nexus has it all.
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
