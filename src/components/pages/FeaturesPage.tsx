import { useState } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ScrollSection } from '../scroll/ScrollSection';
import {
  cardCascade,
  waveGrid,
  timelineProgress,
  splitScreen,
  convergenceZoom,
  blurToSharp,
  staggerAlternate,
} from '../scroll/animations';
import {
  Zap,
  Bot,
  Users,
  Activity,
  Calendar,
  CalendarDays,
  BarChart3,
  Plug,
  LayoutTemplate,
  Radio,
  Trophy,
  Check,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Clock,
  Shield,
  Play,
  Mic,
  Brain,
  Target,
  Eye,
  Layers,
  Gauge,
  Sun,
  Moon,
  Coffee,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react';

const viewport = { once: true, amount: 0.2 };
const ease = [0.22, 1, 0.36, 1] as const;

// ═══════════════════════════════════════════════════════════════════
// Data
// ═══════════════════════════════════════════════════════════════════

const PILLARS = [
  {
    icon: Zap,
    title: 'Energy-Aware Scheduling',
    description: 'AI learns your circadian rhythm and schedules deep work, meetings, and breaks when you\'re at your best.',
    gradient: 'from-cyan-500/20 to-teal-500/20',
    iconBg: 'bg-cyan-500/15',
    iconColor: 'text-cyan-400',
    features: ['Personalized energy curves', 'Peak focus detection', 'Smart break timing', 'Fatigue prevention'],
  },
  {
    icon: Bot,
    title: 'Intelligent AI Assistant',
    description: 'Contextual help, insights, and automation that understand your goals, calendar, and energy.',
    gradient: 'from-teal-500/20 to-emerald-500/20',
    iconBg: 'bg-teal-500/15',
    iconColor: 'text-teal-400',
    features: ['Voice-first interaction', 'Contextual suggestions', 'Task automation', 'Natural language commands'],
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Shared workspaces, dashboards, and analytics so teams stay aligned without meeting overload.',
    gradient: 'from-emerald-500/20 to-cyan-500/20',
    iconBg: 'bg-emerald-500/15',
    iconColor: 'text-emerald-400',
    features: ['Shared workspaces', 'Team energy views', 'Async-first design', 'Meeting load balancing'],
  },
] as const;

interface FeatureTab {
  id: string;
  icon: LucideIcon;
  label: string;
  title: string;
  description: string;
  highlights: string[];
  accent: string;
  mockup: 'energy' | 'ai' | 'calendar' | 'team';
}

const FEATURE_TABS: FeatureTab[] = [
  {
    id: 'energy',
    icon: Activity,
    label: 'Energy',
    title: 'Your Biology Becomes Your Superpower',
    description: 'SyncScript tracks your energy patterns over time and builds a personalized profile. Deep work lands in your peak hours. Admin tasks fill your dips. Breaks appear before you crash.',
    highlights: [
      'Personalized energy curve that adapts weekly',
      'Peak focus windows auto-detected from behavior',
      'Smart break suggestions before cognitive fatigue',
      'Energy score visible on every calendar slot',
    ],
    accent: 'cyan',
    mockup: 'energy',
  },
  {
    id: 'ai',
    icon: Brain,
    label: 'AI Assistant',
    title: 'Nexus: Your Voice-First AI',
    description: 'Talk to Nexus like a colleague. Ask it to reschedule your afternoon, summarize your day, or find time for a new task. It understands context — your calendar, energy, and priorities.',
    highlights: [
      'Voice commands — "Move my 2pm to tomorrow"',
      'Morning briefings with your optimal plan',
      'Contextual intelligence across all your data',
      'Proactive suggestions when conflicts arise',
    ],
    accent: 'teal',
    mockup: 'ai',
  },
  {
    id: 'calendar',
    icon: Calendar,
    label: 'Calendar',
    title: 'Calendar Intelligence, Not Just a Grid',
    description: 'Your calendar becomes predictive. SyncScript detects conflicts before they happen, suggests prep time for meetings, and auto-blocks focus time when your schedule gets packed.',
    highlights: [
      'Conflict detection with resolution suggestions',
      'Auto-block focus time in open slots',
      'Meeting prep and follow-up reminders',
      'What-if scenarios for schedule changes',
    ],
    accent: 'emerald',
    mockup: 'calendar',
  },
  {
    id: 'team',
    icon: Users,
    label: 'Teams',
    title: 'Collaboration Without the Chaos',
    description: 'See your team\'s energy and capacity at a glance. Find the best time for meetings across time zones. Share workspaces and scripts without another tool.',
    highlights: [
      'Team energy heatmap across members',
      'Smart meeting time finder',
      'Shared templates and workflows',
      'Capacity planning with burnout alerts',
    ],
    accent: 'violet',
    mockup: 'team',
  },
];

const STATS = [
  { end: 90, suffix: 's', label: 'Average setup time', sublabel: 'Connect calendar → AI learns → done', icon: Clock },
  { end: 3, suffix: '', label: 'Steps to get started', sublabel: 'No onboarding calls needed', icon: TrendingUp },
  { end: 40, suffix: '%', label: 'More focused hours', sublabel: 'Reported by beta users in week 1', icon: Gauge },
  { end: 0, suffix: '', prefix: '$', label: 'To start — free forever', sublabel: 'No credit card required', icon: Shield },
];

const HOW_IT_WORKS = [
  {
    step: 1,
    icon: Plug,
    title: 'Connect Your Calendar',
    description: 'Link Google Calendar, Outlook, or any calendar you use. Takes 10 seconds. Two-way sync keeps everything current.',
    accent: 'bg-cyan-500/15 text-cyan-400',
  },
  {
    step: 2,
    icon: Activity,
    title: 'AI Learns Your Patterns',
    description: 'Our AI observes when you\'re most focused and builds your personal energy profile. Within 48 hours, it knows your rhythm.',
    accent: 'bg-teal-500/15 text-teal-400',
  },
  {
    step: 3,
    icon: Sparkles,
    title: 'Get an Optimized Schedule',
    description: 'Tasks auto-schedule to your peak energy. Meetings find the right gaps. Breaks prevent burnout. Zero manual effort.',
    accent: 'bg-emerald-500/15 text-emerald-400',
  },
];

const INTEGRATIONS_LIVE = [
  { name: 'Google Calendar', color: '#4285F4' },
  { name: 'Microsoft Outlook', color: '#0078D4' },
];

const INTEGRATIONS_SOON = [
  { name: 'Slack', color: '#E01E5A' },
  { name: 'Notion', color: '#FFFFFF' },
  { name: 'Asana', color: '#F06A6A' },
  { name: 'Linear', color: '#5E6AD2' },
  { name: 'Todoist', color: '#E44332' },
  { name: 'GitHub', color: '#FFFFFF' },
  { name: 'Jira', color: '#0052CC' },
  { name: 'Trello', color: '#0079BF' },
  { name: 'ClickUp', color: '#7B68EE' },
];

const BEFORE_AFTER = [
  { before: 'Generic to-do list with no context', after: 'Tasks scheduled to your peak energy windows', icon: Zap },
  { before: 'Manually dragging calendar blocks', after: 'AI auto-places tasks in optimal slots', icon: Calendar },
  { before: 'No idea when you\'re most focused', after: 'Personalized energy curve adapts weekly', icon: Activity },
  { before: 'Meetings scattered randomly', after: 'Meetings clustered in low-energy windows', icon: Users },
  { before: 'Burnout creep with no warning', after: 'Proactive alerts before fatigue hits', icon: Shield },
  { before: 'Context switching between 5 apps', after: 'One intelligent hub for everything', icon: Layers },
];

const BETA_PRINCIPLES = [
  {
    icon: Sparkles,
    title: 'Built in the Open',
    description: 'SyncScript is in open beta. Every feature is shaped by real feedback from real users — not focus groups or guesswork.',
    accent: 'text-cyan-400',
    bg: 'bg-cyan-500/15',
  },
  {
    icon: Users,
    title: 'Community-Driven Roadmap',
    description: 'Our Discord community votes on what gets built next. Bug reports become fixes within days, not quarters.',
    accent: 'text-teal-400',
    bg: 'bg-teal-500/15',
  },
  {
    icon: Shield,
    title: 'Transparent Progress',
    description: 'We publish a public changelog and roadmap. You can see exactly what shipped, what\'s in progress, and what\'s planned.',
    accent: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
  },
  {
    icon: TrendingUp,
    title: 'Improving Weekly',
    description: 'New features, refinements, and AI model improvements ship every week. Early adopters get free access and a lifetime discount.',
    accent: 'text-amber-400',
    bg: 'bg-amber-500/15',
  },
];

// ═══════════════════════════════════════════════════════════════════
// CSS Mockup Components
// ═══════════════════════════════════════════════════════════════════

function EnergyMockup() {
  const hours = ['6a', '8a', '10a', '12p', '2p', '4p', '6p', '8p'];
  const levels = [30, 55, 90, 85, 60, 45, 70, 40];
  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 h-full">
      <div className="flex items-center gap-2 mb-3">
        <Sun className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-xs text-white/50 font-medium">Today&apos;s Energy Profile</span>
        <span className="ml-auto text-[10px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">Live</span>
      </div>
      <div className="flex items-end gap-1.5 h-24">
        {levels.map((level, i) => (
          <motion.div
            key={hours[i]}
            className="flex-1 flex flex-col items-center gap-1"
            initial={{ height: 0 }}
            whileInView={{ height: 'auto' }}
            viewport={{ once: true }}
          >
            <motion.div
              className="w-full rounded-sm"
              style={{
                background: level > 75 ? 'linear-gradient(to top, #06b6d4, #22d3ee)' :
                  level > 50 ? 'linear-gradient(to top, #14b8a6, #2dd4bf)' :
                  'linear-gradient(to top, #64748b, #94a3b8)',
              }}
              initial={{ height: 0 }}
              whileInView={{ height: `${level}%` }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            />
            <span className="text-[9px] text-white/30">{hours[i]}</span>
          </motion.div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3 text-[10px] text-white/40">
        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-cyan-400" /> Peak</span>
        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-teal-400" /> Good</span>
        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-400" /> Low</span>
      </div>
    </div>
  );
}

function AIMockup() {
  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Mic className="w-3.5 h-3.5 text-teal-400" />
        <span className="text-xs text-white/50 font-medium">Nexus AI Assistant</span>
      </div>
      <div className="flex-1 space-y-2.5 text-xs">
        <div className="flex justify-end"><div className="bg-cyan-500/15 border border-cyan-500/20 rounded-lg px-3 py-1.5 text-white/70 max-w-[75%]">Move my 2pm meeting to tomorrow</div></div>
        <div className="flex justify-start"><div className="bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-1.5 text-white/60 max-w-[80%]">Done! I moved your design review to tomorrow at 2pm. Your afternoon is now free for deep work during your peak energy window.</div></div>
        <div className="flex justify-end"><div className="bg-cyan-500/15 border border-cyan-500/20 rounded-lg px-3 py-1.5 text-white/70 max-w-[75%]">What should I focus on next?</div></div>
        <div className="flex justify-start"><div className="bg-white/[0.05] border border-white/[0.08] rounded-lg px-3 py-1.5 text-white/60 max-w-[80%]">You&apos;re in a peak focus window right now. I&apos;d suggest the API docs — it&apos;s your highest priority and needs deep thinking.</div></div>
      </div>
      <div className="mt-3 flex items-center gap-1.5">
        {[1,2,3,4,5].map(i => (
          <motion.div key={i} className="w-0.5 bg-teal-400/60 rounded-full"
            animate={{ height: [4, 12, 4] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }}
          />
        ))}
        <span className="ml-2 text-[10px] text-white/30">Listening...</span>
      </div>
    </div>
  );
}

function CalendarMockup() {
  const slots = [
    { time: '9:00', label: 'Deep Work: API Docs', energy: 'peak', color: 'bg-cyan-500/20 border-cyan-500/30' },
    { time: '10:30', label: 'Break — Walk', energy: 'break', color: 'bg-emerald-500/10 border-emerald-500/20' },
    { time: '11:00', label: 'Team Standup', energy: 'good', color: 'bg-violet-500/15 border-violet-500/25' },
    { time: '12:00', label: 'Lunch', energy: 'break', color: 'bg-amber-500/10 border-amber-500/20' },
    { time: '1:30', label: 'Email & Admin', energy: 'low', color: 'bg-slate-500/10 border-slate-500/20' },
    { time: '3:00', label: 'Creative Review', energy: 'rising', color: 'bg-teal-500/15 border-teal-500/25' },
  ];
  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 h-full">
      <div className="flex items-center gap-2 mb-3">
        <Calendar className="w-3.5 h-3.5 text-emerald-400" />
        <span className="text-xs text-white/50 font-medium">Smart Calendar</span>
        <span className="ml-auto text-[10px] text-white/30">Today</span>
      </div>
      <div className="space-y-1.5">
        {slots.map((slot, i) => (
          <motion.div
            key={slot.time}
            className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg border ${slot.color}`}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
          >
            <span className="text-[10px] text-white/35 w-8 shrink-0 font-mono">{slot.time}</span>
            <span className="text-[11px] text-white/60 truncate">{slot.label}</span>
            <span className={`ml-auto text-[8px] uppercase tracking-wider font-medium shrink-0 ${
              slot.energy === 'peak' ? 'text-cyan-400' :
              slot.energy === 'good' ? 'text-violet-400' :
              slot.energy === 'rising' ? 'text-teal-400' :
              slot.energy === 'break' ? 'text-emerald-400' :
              'text-slate-400'
            }`}>{slot.energy}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function TeamMockup() {
  const members = [
    { name: 'You', energy: 92, status: 'Peak Focus' },
    { name: 'Sarah', energy: 68, status: 'Collaborative' },
    { name: 'Mike', energy: 45, status: 'Low Energy' },
    { name: 'Priya', energy: 81, status: 'Deep Work' },
  ];
  return (
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-4 h-full">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-3.5 h-3.5 text-violet-400" />
        <span className="text-xs text-white/50 font-medium">Team Energy</span>
        <span className="ml-auto text-[10px] text-white/30">Real-time</span>
      </div>
      <div className="space-y-2.5">
        {members.map((m, i) => (
          <motion.div
            key={m.name}
            className="flex items-center gap-3"
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
          >
            <div className="w-6 h-6 rounded-full bg-white/[0.08] flex items-center justify-center text-[9px] text-white/50 font-medium shrink-0">
              {m.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] text-white/60 truncate">{m.name}</span>
                <span className="text-[9px] text-white/30">{m.status}</span>
              </div>
              <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    background: m.energy > 75 ? 'linear-gradient(to right, #06b6d4, #22d3ee)' :
                      m.energy > 55 ? 'linear-gradient(to right, #8b5cf6, #a78bfa)' :
                      'linear-gradient(to right, #64748b, #94a3b8)',
                  }}
                  initial={{ width: 0 }}
                  whileInView={{ width: `${m.energy}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: i * 0.1 }}
                />
              </div>
            </div>
            <span className="text-[10px] text-white/40 font-mono w-6 text-right shrink-0">{m.energy}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

const MOCKUP_MAP: Record<string, () => React.JSX.Element> = {
  energy: EnergyMockup,
  ai: AIMockup,
  calendar: CalendarMockup,
  team: TeamMockup,
};

// ═══════════════════════════════════════════════════════════════════
// Animated counter
// ═══════════════════════════════════════════════════════════════════

function AnimatedCounter({ end, suffix = '', prefix = '', duration = 1.5 }: { end: number; suffix?: string; prefix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  return (
    <motion.span
      onViewportEnter={() => {
        if (started) return;
        setStarted(true);
        const startTime = performance.now();
        const animate = (now: number) => {
          const elapsed = now - startTime;
          const progress = Math.min(elapsed / (duration * 1000), 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.round(eased * end));
          if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
      }}
      viewport={{ once: true, amount: 0.5 }}
    >
      {prefix}{count}{suffix}
    </motion.span>
  );
}

// ═══════════════════════════════════════════════════════════════════
// Page
// ═══════════════════════════════════════════════════════════════════

export function FeaturesPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('energy');

  const currentFeature = FEATURE_TABS.find((t) => t.id === activeTab) || FEATURE_TABS[0];
  const MockupComponent = MOCKUP_MAP[currentFeature.mockup];

  return (
    <div data-marketing-root className="relative min-h-screen text-white">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <ScrollSection id="f-hero" snap>
      <section className="relative z-10 min-h-[60vh] flex flex-col justify-center pb-28 sm:pb-44">
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
          <motion.div
            className="absolute -top-40 left-1/4 w-[450px] sm:w-[650px] h-[450px] sm:h-[650px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.45) 0%, transparent 70%)', filter: 'blur(100px)' }}
            animate={{ x: [0, 80, 0], y: [0, 40, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -top-20 right-1/4 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.35) 0%, transparent 70%)', filter: 'blur(100px)' }}
            animate={{ x: [0, -60, 0], y: [0, 50, 0], scale: [1, 1.25, 1] }}
            transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-4xl mx-auto">
            <motion.h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold tracking-[-0.03em] leading-[1.08]"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1, ease }}
            >
              Everything you need to{' '}
              <motion.span
                className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent inline-block"
                animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                style={{ backgroundSize: '200% 200%' }}
              >
                work with your energy
              </motion.span>
            </motion.h1>

            <motion.p
              className="mt-7 sm:mt-8 text-lg sm:text-xl md:text-2xl text-white/55 font-light max-w-2xl mx-auto leading-relaxed"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25, ease }}
            >
              SyncScript turns your circadian rhythm and goals into a calendar that actually works. Schedule smarter, focus when it matters, let AI handle the rest.
            </motion.p>

            <motion.div
              className="mt-20 sm:mt-24 flex flex-col sm:flex-row items-center justify-center gap-4"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease }}
            >
              <button type="button" onClick={() => navigate('/signup')}
                className="group inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl font-medium bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white shadow-lg shadow-cyan-500/20 transition-all text-base">
                <Sparkles className="w-4.5 h-4.5" /> Get Started Free <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button type="button" onClick={() => navigate('/pricing')}
                className="group inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl font-medium border border-white/15 hover:border-white/25 bg-white/[0.04] hover:bg-white/[0.07] text-white/80 hover:text-white transition-all text-base">
                <Play className="w-4 h-4" /> View Pricing
              </button>
            </motion.div>

            <motion.div
              className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-5 sm:gap-8 text-xs sm:text-sm text-white/45"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.55, ease }}
            >
              <span className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400/70" />No credit card required</span>
              <span className="flex items-center gap-2"><Clock className="w-4 h-4 text-cyan-400/70" />Setup in 90 seconds</span>
              <span className="flex items-center gap-2"><Shield className="w-4 h-4 text-teal-400/70" />Bank-level security</span>
            </motion.div>
          </div>
        </div>
      </section>
      </ScrollSection>

      {/* ── Core Pillars (expanded with feature bullets) ──────── */}
      <ScrollSection id="f-pillars" animation={cardCascade}>
      <section className="relative z-10 py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div className="text-center mb-16 sm:mb-24"
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport} transition={{ duration: 0.5, ease }}>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.02em]">
              Three pillars. <span className="text-white/40">One platform.</span>
            </h2>
            <p className="mt-4 text-white/45 font-light max-w-xl mx-auto">
              Energy, intelligence, and collaboration — working together so you don&apos;t have to work harder.
            </p>
          </motion.div>

          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8"
            initial="hidden" whileInView="visible" viewport={viewport}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}>
            {PILLARS.map(({ icon: Icon, title, description, gradient, iconBg, iconColor, features }) => (
              <motion.div key={title}
                className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-5 sm:p-7 md:p-8 flex flex-col"
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.5, ease }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}>
                <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center ${iconColor} mb-5`}>
                  <Icon className="w-5.5 h-5.5" strokeWidth={1.8} />
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-white">{title}</h3>
                <p className="mt-3 text-white/50 font-light text-sm leading-relaxed">{description}</p>
                <ul className="mt-4 space-y-1.5 flex-1">
                  {features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-white/40">
                      <Check className="w-3 h-3 text-emerald-400/60 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className={`mt-5 h-px bg-gradient-to-r ${gradient} rounded-full`} aria-hidden />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      </ScrollSection>

      {/* ── Interactive Feature Explorer (NEW) ───────────────── */}
      <ScrollSection id="f-explorer" animation={splitScreen}>
      <section className="relative z-10 py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div className="text-center mb-12 sm:mb-16"
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport} transition={{ duration: 0.5, ease }}>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.02em]">
              See it in action
            </h2>
            <p className="mt-4 text-white/50 font-light max-w-xl mx-auto">
              Explore each core feature with live previews.
            </p>
          </motion.div>

          {/* Tabs */}
          <div className="flex justify-center gap-2 mb-10">
            {FEATURE_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = tab.id === activeTab;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'bg-white/[0.04] text-white/50 border border-white/[0.08] hover:bg-white/[0.08] hover:text-white/70'
                  }`}>
                  <Icon className="w-4 h-4" /> <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            <motion.div key={currentFeature.id}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease }}>

              {/* Text side */}
              <div>
                <h3 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white mb-4">
                  {currentFeature.title}
                </h3>
                <p className="text-white/55 font-light leading-relaxed mb-6">
                  {currentFeature.description}
                </p>
                <ul className="space-y-3">
                  {currentFeature.highlights.map((h, i) => (
                    <motion.li key={h} className="flex items-start gap-3"
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.08 }}>
                      <div className="w-5 h-5 rounded-full bg-cyan-500/15 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-cyan-400" />
                      </div>
                      <span className="text-sm text-white/60">{h}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Mockup side */}
              <div className="h-72 sm:h-80 lg:h-96">
                <MockupComponent />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
      </ScrollSection>

      {/* ── Stats (enriched with counters + sublabels) ────────── */}
      <ScrollSection id="f-stats" animation={timelineProgress}>
      <section className="relative z-10 py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div className="text-center mb-14"
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport} transition={{ duration: 0.5, ease }}>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.02em]">
              The numbers speak
            </h2>
          </motion.div>
          <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8"
            initial="hidden" whileInView="visible" viewport={viewport}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}>
            {STATS.map(({ end, suffix, prefix, label, sublabel, icon: Icon }) => (
              <motion.div key={label}
                className="text-center bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 sm:p-7"
                variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.5, ease }}>
                <Icon className="w-5 h-5 text-cyan-400/60 mx-auto mb-3" strokeWidth={1.8} />
                <div className="text-3xl sm:text-4xl font-semibold tracking-tight bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                  <AnimatedCounter end={end} suffix={suffix} prefix={prefix || ''} />
                </div>
                <div className="mt-1 text-sm text-white/60 font-medium">{label}</div>
                <div className="mt-1 text-xs text-white/30 font-light">{sublabel}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      </ScrollSection>

      {/* ── Before / After (NEW) ─────────────────────────────── */}
      <ScrollSection id="f-comparison" animation={blurToSharp}>
      <section className="relative z-10 py-24 sm:py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div className="text-center mb-14 sm:mb-20"
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport} transition={{ duration: 0.5, ease }}>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.02em]">
              See the difference
            </h2>
            <p className="mt-4 text-white/50 font-light max-w-xl mx-auto">
              What changes when your tools understand your energy.
            </p>
          </motion.div>

          <motion.div className="space-y-3"
            initial="hidden" whileInView="visible" viewport={viewport}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}>
            {/* Header */}
            <div className="grid grid-cols-[auto_1fr_auto_1fr] gap-3 sm:gap-4 items-center px-3 sm:px-4 text-xs font-semibold uppercase tracking-wider text-white/30">
              <div className="w-8" />
              <div>Without SyncScript</div>
              <div className="w-6" />
              <div className="text-emerald-400/60">With SyncScript</div>
            </div>
            {BEFORE_AFTER.map(({ before, after, icon: Icon }) => (
              <motion.div key={before}
                className="grid grid-cols-[auto_1fr_auto_1fr] gap-3 sm:gap-4 items-center bg-white/[0.03] border border-white/[0.07] rounded-xl px-3 sm:px-4 py-3"
                variants={{ hidden: { opacity: 0, x: -12 }, visible: { opacity: 1, x: 0 } }}
                transition={{ duration: 0.4, ease }}>
                <div className="w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-white/30" />
                </div>
                <span className="text-sm text-white/40 line-through decoration-white/20">{before}</span>
                <ChevronRight className="w-4 h-4 text-emerald-400/50 shrink-0" />
                <span className="text-sm text-white/70">{after}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      </ScrollSection>

      {/* ── How It Works ─────────────────────────────────────── */}
      <ScrollSection id="f-how" animation={staggerAlternate}>
      <section className="relative z-10 py-24 sm:py-32">
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[700px] h-[400px] sm:h-[500px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.35) 0%, transparent 70%)', filter: 'blur(120px)' }}
            animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div className="text-center mb-14 sm:mb-20"
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport} transition={{ duration: 0.5, ease }}>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.02em]">
              Up and running in <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">under two minutes</span>
            </h2>
            <p className="mt-4 text-white/55 font-light max-w-xl mx-auto">
              Three steps. No setup headaches. No onboarding calls.
            </p>
          </motion.div>

          <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 md:gap-12"
            initial="hidden" whileInView="visible" viewport={viewport}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}>
            {HOW_IT_WORKS.map(({ step, title, description, icon: Icon, accent }) => (
              <motion.div key={step} className="relative text-center px-2"
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.5, ease }}>
                <div className={`w-16 h-16 rounded-2xl ${accent} flex items-center justify-center mx-auto mb-6`}>
                  <Icon className="w-7 h-7" strokeWidth={1.8} />
                </div>
                <div className="text-xs font-semibold tracking-widest uppercase text-white/30 mb-3">Step {step}</div>
                <h3 className="text-xl font-semibold tracking-tight text-white mb-3">{title}</h3>
                <p className="text-sm text-white/50 font-light leading-relaxed max-w-xs mx-auto">{description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      </ScrollSection>

      {/* ── Integrations (real names, better design) ──────────── */}
      <ScrollSection id="f-integrations" animation={cardCascade}>
      <section className="relative z-10 py-24 sm:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-10">
          <motion.div className="text-center"
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={viewport}>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.02em]">
              Connects with your tools
            </h2>
            <p className="mt-3 text-sm text-white/45 font-light max-w-lg mx-auto">
              Two-way calendar sync live today. More integrations shipping during beta.
            </p>
          </motion.div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-10">
          <div className="flex flex-wrap items-center justify-center gap-4">
            {INTEGRATIONS_LIVE.map(({ name, color }) => (
              <motion.div key={name}
                className="flex items-center gap-3 px-5 py-3 rounded-xl bg-cyan-500/10 border border-cyan-500/25"
                whileHover={{ scale: 1.03 }} transition={{ duration: 0.15 }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold" style={{ backgroundColor: color + '20', color }}>
                  {name[0]}
                </div>
                <span className="text-white/80 font-medium text-sm">{name}</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">Live</span>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="relative mt-4">
          <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-16 md:w-24 bg-gradient-to-r from-[#0a0e1a] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-16 md:w-24 bg-gradient-to-l from-[#0a0e1a] to-transparent z-10 pointer-events-none" />
          <p className="text-center text-xs text-white/30 mb-4 tracking-wide uppercase font-medium">Coming soon</p>
          <div className="flex gap-10 sm:gap-14 animate-marquee whitespace-nowrap w-max">
            {[...INTEGRATIONS_SOON, ...INTEGRATIONS_SOON].map(({ name, color }, i) => (
              <div key={`${name}-${i}`}
                className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white/[0.04] border border-white/[0.07] shrink-0 opacity-60">
                <div className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: color + '15', color }}>
                  {name[0]}
                </div>
                <span className="text-white/50 font-medium text-sm">{name}</span>
              </div>
            ))}
          </div>
        </div>
        <style>{`
          @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
          .animate-marquee { animation: marquee 40s linear infinite; }
        `}</style>
      </section>
      </ScrollSection>

      {/* ── Built in the Open ─────────────────────────────────── */}
      <ScrollSection id="f-open" animation={convergenceZoom}>
      <section className="relative z-10 py-24 sm:py-32">
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-15">
          <motion.div
            className="absolute top-0 right-1/4 w-[400px] sm:w-[550px] h-[400px] sm:h-[550px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.4) 0%, transparent 70%)', filter: 'blur(110px)' }}
            animate={{ x: [0, -40, 0], y: [0, 30, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div className="text-center mb-14 sm:mb-16"
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport} transition={{ duration: 0.5, ease }}>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.02em]">
              Built in the open. <span className="text-white/40">Shaped by you.</span>
            </h2>
            <p className="mt-4 text-white/50 font-light max-w-xl mx-auto">
              SyncScript is in open beta — every feature is tested, refined, and shipped with real user input.
            </p>
          </motion.div>

          <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-7"
            initial="hidden" whileInView="visible" viewport={viewport}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}>
            {BETA_PRINCIPLES.map((item) => {
              const Icon = item.icon;
              return (
                <motion.div key={item.title}
                  className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 sm:p-7 md:p-8 flex flex-col hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300"
                  variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.4, ease }}>
                  <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center ${item.accent} mb-4`}>
                    <Icon className="w-5 h-5" strokeWidth={1.8} />
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-white/55 font-light leading-relaxed flex-1">{item.description}</p>
                </motion.div>
              );
            })}
          </motion.div>

          <motion.div className="mt-10 text-center"
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport} transition={{ duration: 0.5, delay: 0.3, ease }}>
            <button type="button" onClick={() => navigate('/signup')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white shadow-lg shadow-cyan-500/20 transition-all text-sm">
              <Sparkles className="w-4 h-4" /> Join the Beta <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </section>
      </ScrollSection>

      {/* ── Final CTA ─────────────────────────────────────────── */}
      <ScrollSection id="f-cta" animation={waveGrid}>
      <section className="relative z-10 py-24 sm:py-32">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport} transition={{ duration: 0.6, ease }}>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.02em] text-white">
              Ready to work with your energy?
            </h2>
            <p className="mt-4 text-white/45 font-light text-sm sm:text-base">
              Free to start &middot; No credit card &middot; 90-second setup
            </p>
            <button type="button" onClick={() => navigate('/signup')}
              className="mt-8 inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-medium bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white shadow-lg shadow-cyan-500/20 transition-all">
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
            <div className="mt-4">
              <button type="button" onClick={() => navigate('/pricing')}
                className="text-sm text-white/35 hover:text-white/60 transition-colors">
                or compare plans
              </button>
            </div>
          </motion.div>
        </div>
      </section>
      </ScrollSection>
    </div>
  );
}
