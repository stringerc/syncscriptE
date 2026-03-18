import { useMemo, useState } from 'react';
import { Bot, Mic, MicOff, PhoneOff, Sparkles, Send, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNexusVoiceCall } from '../contexts/useNexusVoiceCall';
import { useTasks } from '../hooks/useTasks';
import { useGoals } from '../hooks/useGoals';
import { useCalendarEvents } from '../hooks/useCalendarEvents';
import { toast } from 'sonner';

interface NexusPlannerModalProps {
  open: boolean;
  onClose: () => void;
}

const QUICK_PROMPTS = [
  'Plan my day around my energy peaks.',
  'Create a focused 90-minute deep work block.',
  'Help me prioritize today’s top 3 outcomes.',
  'Find a good time for my next important meeting.',
];

type PlannerActionType = 'task' | 'event' | 'goal';

interface PlannerActionCard {
  id: string;
  type: PlannerActionType;
  title: string;
  note: string;
}

function classifyActionType(text: string): PlannerActionType {
  const value = text.toLowerCase();
  if (/(meeting|calendar|event|call|schedule|appointment)/.test(value)) return 'event';
  if (/(goal|milestone|objective|target|outcome)/.test(value)) return 'goal';
  return 'task';
}

function extractActionCardsFromText(text: string): PlannerActionCard[] {
  if (!text.trim()) return [];
  const segments = text
    .split(/\n|(?<=[.!?])\s+/)
    .map((item) => item.replace(/^[-*0-9.)\s]+/, '').trim())
    .filter((item) => item.length >= 12)
    .slice(0, 12);

  const cards: PlannerActionCard[] = [];
  const seen = new Set<string>();
  for (const segment of segments) {
    const title = segment.replace(/\s+/g, ' ').trim();
    const dedupeKey = title.toLowerCase();
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    cards.push({
      id: `planner-action-${cards.length + 1}`,
      type: classifyActionType(title),
      title: title.length > 90 ? `${title.slice(0, 87)}...` : title,
      note: 'Suggested from latest Nexus plan',
    });
    if (cards.length >= 4) break;
  }
  return cards;
}

function formatStatus(params: {
  isListening: boolean;
  isSpeaking: boolean;
  callStatus: 'idle' | 'connecting' | 'active' | 'ending';
}) {
  if (params.isSpeaking) return 'Nexus is speaking';
  if (params.isListening) return 'Nexus is listening';
  if (params.callStatus === 'connecting') return 'Connecting voice';
  if (params.callStatus === 'active') return 'Voice session active';
  if (params.callStatus === 'ending') return 'Ending session';
  return 'Ready to plan';
}

export function NexusPlannerModal({ open, onClose }: NexusPlannerModalProps) {
  const {
    isCallActive,
    callStatus,
    isListening,
    isSpeaking,
    interimText,
    messages,
    startCall,
    endCall,
    sendTextMessage,
    isProcessing,
    voiceError,
  } = useNexusVoiceCall();

  const [draft, setDraft] = useState('');
  const [applyingActionId, setApplyingActionId] = useState<string | null>(null);
  const { createTask } = useTasks();
  const { createGoal } = useGoals();
  const { addEvent } = useCalendarEvents();

  const recentMessages = useMemo(() => messages.slice(-6), [messages]);
  const statusText = formatStatus({ isListening, isSpeaking, callStatus });
  const latestNexusText = useMemo(
    () => [...messages].reverse().find((msg) => msg.role === 'nexus')?.text ?? '',
    [messages],
  );
  const actionCards = useMemo(
    () => extractActionCardsFromText(latestNexusText),
    [latestNexusText],
  );

  const handleSend = () => {
    const text = draft.trim();
    if (!text) return;
    sendTextMessage(text);
    setDraft('');
  };

  const handleVoiceToggle = async () => {
    if (isCallActive) {
      endCall();
      return;
    }
    await startCall();
  };

  const handleApplyAction = async (card: PlannerActionCard) => {
    try {
      setApplyingActionId(card.id);
      if (card.type === 'task') {
        await createTask({
          title: card.title,
          description: 'Created from Nexus Planner',
          priority: 'medium',
          energyLevel: 'medium',
          estimatedTime: '1h',
          dueDate: new Date().toISOString(),
          tags: ['nexus', 'planner'],
        });
        toast.success('Task created from Nexus plan');
        return;
      }

      if (card.type === 'goal') {
        await createGoal({
          title: card.title,
          description: 'Created from Nexus Planner',
          category: 'Personal',
          deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'on-track',
        });
        toast.success('Goal created from Nexus plan');
        return;
      }

      const startTime = new Date(Date.now() + 60 * 60 * 1000);
      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
      addEvent({
        id: `event-${Date.now()}`,
        title: card.title,
        description: 'Created from Nexus Planner',
        startTime,
        endTime,
        completed: false,
        hierarchyType: 'primary',
        isPrimaryEvent: true,
        childEventIds: [],
        depth: 0,
        isScheduled: true,
        archived: false,
        autoArchiveChildren: false,
        inheritPermissions: false,
        tasks: [],
        hasScript: false,
        resources: [],
        linksNotes: [],
        teamMembers: [],
        createdBy: 'Nexus Planner',
        createdAt: new Date(),
        updatedAt: new Date(),
        allowTeamEdits: true,
      } as any);
      toast.success('Event drafted on calendar from Nexus plan');
    } catch (error) {
      console.error('[NexusPlannerModal] Failed to apply action:', error);
      toast.error('Could not apply this planner action');
    } finally {
      setApplyingActionId(null);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/55 backdrop-blur-[2px]"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4 md:p-8"
          >
            <div className="w-full max-w-4xl rounded-2xl border border-teal-500/30 bg-[#10151d]/95 shadow-[0_0_80px_rgba(45,212,191,0.12)]">
              <div className="flex items-center justify-between border-b border-teal-500/20 px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-teal-400 to-blue-500">
                    <Bot className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white">Nexus Voice Planner</p>
                    <p className="text-xs text-teal-300/80">{statusText}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-md p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
                  aria-label="Close Nexus planner"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid gap-4 p-5 md:grid-cols-[1.2fr_1fr]">
                <div className="rounded-xl border border-white/10 bg-[#0f141b] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-sm text-white/80">Conversation</p>
                    <button
                      onClick={handleVoiceToggle}
                      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs transition ${
                        isCallActive
                          ? 'bg-red-500/85 text-white hover:bg-red-500'
                          : 'bg-teal-500/90 text-black hover:bg-teal-400'
                      }`}
                    >
                      {isCallActive ? <PhoneOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
                      {isCallActive ? 'End voice' : 'Start voice'}
                    </button>
                  </div>

                  <div className="h-72 space-y-2 overflow-y-auto rounded-lg border border-white/10 bg-black/20 p-3">
                    {recentMessages.length === 0 ? (
                      <p className="text-sm text-white/50">
                        Start voice or send a planning prompt to begin.
                      </p>
                    ) : (
                      recentMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${
                            message.role === 'user'
                              ? 'ml-auto bg-teal-500/20 text-teal-50'
                              : 'bg-blue-500/18 text-blue-50'
                          }`}
                        >
                          {message.text}
                        </div>
                      ))
                    )}
                    {interimText && (
                      <div className="max-w-[90%] rounded-lg border border-blue-400/40 bg-blue-500/10 px-3 py-2 text-sm text-blue-200">
                        {interimText}
                      </div>
                    )}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Ask Nexus to plan tasks, events, or goals..."
                      className="flex-1 rounded-lg border border-white/15 bg-[#0b1016] px-3 py-2 text-sm text-white outline-none transition focus:border-teal-400"
                    />
                    <button
                      onClick={handleSend}
                      className="rounded-lg bg-teal-500/90 px-3 py-2 text-black transition hover:bg-teal-400"
                      aria-label="Send planning message"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                  {voiceError && <p className="mt-2 text-xs text-amber-300">{voiceError}</p>}
                </div>

                <div className="space-y-3">
                  <div className="rounded-xl border border-white/10 bg-[#0f141b] p-4">
                    <p className="mb-2 text-sm text-white/85">Quick plan starters</p>
                    <div className="space-y-2">
                      {QUICK_PROMPTS.map((prompt) => (
                        <button
                          key={prompt}
                          onClick={() => sendTextMessage(prompt)}
                          className="w-full rounded-lg border border-teal-500/20 bg-teal-500/10 px-3 py-2 text-left text-xs text-teal-100 transition hover:border-teal-400/40 hover:bg-teal-500/20"
                        >
                          {prompt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-[#0f141b] p-4">
                    <p className="mb-2 text-sm text-white/85">Apply Nexus plan</p>
                    {actionCards.length === 0 ? (
                      <p className="text-xs text-white/55">
                        Ask Nexus for a concrete plan and action cards will appear here.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {actionCards.map((card) => (
                          <div
                            key={card.id}
                            className="rounded-lg border border-white/10 bg-black/20 p-2.5"
                          >
                            <p className="text-xs text-white/90">{card.title}</p>
                            <div className="mt-2 flex items-center justify-between gap-2">
                              <span className="text-[11px] uppercase tracking-wide text-teal-300/85">
                                {card.type}
                              </span>
                              <button
                                onClick={() => handleApplyAction(card)}
                                disabled={Boolean(applyingActionId)}
                                className="rounded-md bg-teal-500/85 px-2 py-1 text-[11px] text-black transition hover:bg-teal-400 disabled:opacity-60"
                              >
                                {applyingActionId === card.id ? 'Applying...' : 'Apply'}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-xl border border-white/10 bg-[#0f141b] p-4">
                    <p className="mb-2 text-sm text-white/85">Voice state</p>
                    <div className="space-y-2 text-xs text-white/75">
                      <div className="flex items-center gap-2">
                        {isListening ? <Mic className="h-3.5 w-3.5 text-teal-300" /> : <MicOff className="h-3.5 w-3.5 text-white/50" />}
                        <span>{isListening ? 'Listening for your request' : 'Microphone idle'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-blue-300" />
                        <span>{isProcessing ? 'Generating plan response' : 'Ready to generate plan'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
