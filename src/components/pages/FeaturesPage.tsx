import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
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
  MessageCircle,
  Target,
  Check,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Clock,
  Shield,
  Play,
  type LucideIcon,
} from 'lucide-react';

const viewport = { once: true, amount: 0.2 };
const ease = [0.22, 1, 0.36, 1] as const;

const PILLARS = [
  {
    icon: Zap,
    title: 'Energy-Aware Scheduling',
    description:
      'AI learns your circadian rhythm and schedules deep work, meetings, and breaks when you\'re at your best.',
    gradient: 'from-cyan-500/20 to-teal-500/20',
    iconBg: 'bg-cyan-500/15',
    iconColor: 'text-cyan-400',
  },
  {
    icon: Bot,
    title: 'Intelligent AI Assistant',
    description:
      'Contextual help, insights, and automation that understand your goals, calendar, and energy.',
    gradient: 'from-teal-500/20 to-emerald-500/20',
    iconBg: 'bg-teal-500/15',
    iconColor: 'text-teal-400',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description:
      'Shared workspaces, dashboards, and analytics so teams stay aligned without meeting overload.',
    gradient: 'from-emerald-500/20 to-cyan-500/20',
    iconBg: 'bg-emerald-500/15',
    iconColor: 'text-emerald-400',
  },
] as const;

interface BentoFeature {
  icon: LucideIcon;
  title: string;
  description: string;
  span: 1 | 2;
  accent: string;
  iconBg: string;
}

const BENTO_FEATURES: BentoFeature[] = [
  {
    icon: Activity,
    title: 'Energy Tracking',
    description:
      'Personalized energy curves, smart break suggestions, and peak-focus windows — your biology becomes your superpower.',
    span: 2,
    accent: 'from-cyan-500/20 to-blue-500/20',
    iconBg: 'bg-cyan-500/15 text-cyan-400',
  },
  {
    icon: Calendar,
    title: 'Smart Scheduling',
    description:
      'Tasks auto-placed by priority, energy fit, and deadlines. Conflict detection and what-if scenarios built in.',
    span: 1,
    accent: 'from-teal-500/20 to-cyan-500/20',
    iconBg: 'bg-teal-500/15 text-teal-400',
  },
  {
    icon: CalendarDays,
    title: 'Calendar Intelligence',
    description:
      'Prep and follow-up surfaced for every event. Recurring patterns and overload detected automatically.',
    span: 1,
    accent: 'from-emerald-500/20 to-teal-500/20',
    iconBg: 'bg-emerald-500/15 text-emerald-400',
  },
  {
    icon: BarChart3,
    title: 'Team Analytics',
    description:
      'Team energy, capacity, and goal progress at a glance. Spot bottlenecks before they become blockers.',
    span: 1,
    accent: 'from-violet-500/20 to-indigo-500/20',
    iconBg: 'bg-violet-500/15 text-violet-400',
  },
  {
    icon: Radio,
    title: 'Resonance Engine',
    description:
      'Our unique layer aligns tasks and communication with your current state — recommendations that feel right for this moment.',
    span: 2,
    accent: 'from-amber-500/20 to-orange-500/20',
    iconBg: 'bg-amber-500/15 text-amber-400',
  },
  {
    icon: LayoutTemplate,
    title: 'Scripts & Templates',
    description:
      'Reusable workflows for weekly planning, launch checklists, and team rituals. Share and discover community templates.',
    span: 1,
    accent: 'from-pink-500/20 to-rose-500/20',
    iconBg: 'bg-pink-500/15 text-pink-400',
  },
  {
    icon: Trophy,
    title: 'Gamification & Streaks',
    description:
      'Daily streaks, badges, milestones, and optional team challenges — progress that feeds back into better scheduling.',
    span: 1,
    accent: 'from-yellow-500/20 to-amber-500/20',
    iconBg: 'bg-yellow-500/15 text-yellow-400',
  },
  {
    icon: Plug,
    title: '50+ Integrations',
    description:
      'Google Calendar, Outlook, Slack, Notion, Linear, and more. Two-way sync, unified search, webhooks, and API.',
    span: 2,
    accent: 'from-indigo-500/20 to-purple-500/20',
    iconBg: 'bg-indigo-500/15 text-indigo-400',
  },
];

const STATS = [
  { value: '40%', label: 'More tasks completed', icon: TrendingUp },
  { value: '8 hrs', label: 'Saved per week', icon: Clock },
  { value: '10,547+', label: 'Active users', icon: Users },
  { value: '99.9%', label: 'Uptime SLA', icon: Shield },
];

const HOW_IT_WORKS = [
  {
    step: 1,
    icon: Plug,
    title: 'Connect Your Calendar',
    description: 'Link Google Calendar, Outlook, or any calendar you use. Takes 10 seconds.',
    accent: 'bg-cyan-500/15 text-cyan-400',
  },
  {
    step: 2,
    icon: Activity,
    title: 'AI Learns Your Patterns',
    description: 'Our AI observes when you\'re most focused and builds your personal energy profile in 48 hours.',
    accent: 'bg-teal-500/15 text-teal-400',
  },
  {
    step: 3,
    icon: Sparkles,
    title: 'Get an Optimized Schedule',
    description: 'Tasks auto-schedule to your peak energy. Meetings find the right gaps. Zero manual effort.',
    accent: 'bg-emerald-500/15 text-emerald-400',
  },
];

const TESTIMONIALS = [
  {
    quote: 'After 2 weeks with SyncScript, I\'m finishing 40% more tasks without feeling drained. The AI actually knows when I\'m at my best.',
    name: 'Sarah Mitchell',
    role: 'Product Designer @ Stripe',
  },
  {
    quote: 'Our team\'s productivity jumped 60% in the first month. The energy tracking is a game-changer for remote work.',
    name: 'James Chen',
    role: 'Engineering Lead @ Notion',
  },
  {
    quote: 'I used to crash every afternoon. Now SyncScript schedules my hard tasks for mornings. Zero burnout in 3 months.',
    name: 'Aisha Patel',
    role: 'Founder @ StartupLab',
  },
  {
    quote: 'The Resonance Engine is unlike anything else. It doesn\'t just organize my day — it understands my day.',
    name: 'Marcus Rivera',
    role: 'VP Operations @ Acme Corp',
  },
];

const MARQUEE_ITEMS: { name: string; Icon: LucideIcon }[] = [
  { name: 'Google Calendar', Icon: Calendar },
  { name: 'Slack', Icon: MessageCircle },
  { name: 'Notion', Icon: Target },
  { name: 'Asana', Icon: Check },
  { name: 'Trello', Icon: Zap },
  { name: 'Outlook', Icon: CalendarDays },
  { name: 'Jira', Icon: TrendingUp },
  { name: 'Todoist', Icon: Check },
  { name: 'Linear', Icon: Target },
  { name: 'GitHub', Icon: Sparkles },
  { name: 'Figma', Icon: Target },
  { name: 'ClickUp', Icon: Bot },
];

export function FeaturesPage() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen text-white">

      {/* ─── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative z-10 min-h-[60vh] flex flex-col justify-center pb-28 sm:pb-44">
        {/* Ambient gradient glows */}
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

            {/* CTA buttons */}
            <motion.div
              className="mt-20 sm:mt-24 flex flex-col sm:flex-row items-center justify-center gap-4"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4, ease }}
            >
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="group inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl font-medium bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white shadow-lg shadow-cyan-500/20 transition-all text-base"
              >
                <Sparkles className="w-4.5 h-4.5" />
                Get Started Free
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                type="button"
                onClick={() => navigate('/pricing')}
                className="group inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl font-medium border border-white/15 hover:border-white/25 bg-white/[0.04] hover:bg-white/[0.07] text-white/80 hover:text-white transition-all text-base"
              >
                <Play className="w-4 h-4" />
                View Pricing
              </button>
            </motion.div>

            {/* Trust signals */}
            <motion.div
              className="mt-8 sm:mt-10 flex flex-wrap items-center justify-center gap-5 sm:gap-8 text-xs sm:text-sm text-white/45"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.55, ease }}
            >
              <span className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400/70" />
                No credit card required
              </span>
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-400/70" />
                Setup in 90 seconds
              </span>
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-teal-400/70" />
                Bank-level security
              </span>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Core Pillars ─────────────────────────────────────────────────── */}
      <section className="relative z-10 py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            className="text-center mb-16 sm:mb-24"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.5, ease }}
          >
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.02em]">
              Three pillars.{' '}
              <span className="text-white/40">One platform.</span>
            </h2>
            <p className="mt-4 text-white/45 font-light max-w-xl mx-auto">
              Energy, intelligence, and collaboration — working together so you don&apos;t have to work harder.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.1 } },
            }}
          >
            {PILLARS.map(({ icon: Icon, title, description, gradient, iconBg, iconColor }) => (
              <motion.div
                key={title}
                className="bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-5 sm:p-7 md:p-8 flex flex-col"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.5, ease }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
              >
                <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center ${iconColor} mb-5`}>
                  <Icon className="w-5.5 h-5.5" strokeWidth={1.8} />
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-white">{title}</h3>
                <p className="mt-3 text-white/50 font-light text-sm leading-relaxed flex-1">
                  {description}
                </p>
                <div className={`mt-5 h-px bg-gradient-to-r ${gradient} rounded-full`} aria-hidden />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Bento Feature Grid ───────────────────────────────────────────── */}
      <section className="relative z-10 pt-8 sm:pt-12 pb-16 sm:pb-24">
        {/* Section divider */}
        <div className="max-w-xs mx-auto mb-16 sm:mb-24">
          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            className="text-center mb-16 sm:mb-24"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.5, ease }}
          >
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.02em]">
              Built for how you{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                actually work
              </span>
            </h2>
            <p className="mt-4 text-white/55 font-light max-w-2xl mx-auto">
              Every feature is designed around energy, context, and clarity.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.06 } },
            }}
          >
            {BENTO_FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  className={`
                    group relative bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 sm:p-7 md:p-8
                    hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-300
                    ${feature.span === 2 ? 'md:col-span-2 lg:col-span-2' : ''}
                  `}
                  variants={{
                    hidden: { opacity: 0, y: 16 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  transition={{ duration: 0.4, ease }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.accent} rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                  <div className="relative">
                    <div className={`w-10 h-10 rounded-xl ${feature.iconBg} flex items-center justify-center mb-4`}>
                      <Icon className="w-5 h-5" strokeWidth={1.8} />
                    </div>
                    <h3 className="text-lg font-semibold tracking-tight text-white mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-white/55 font-light leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ─── Stats Strip ──────────────────────────────────────────────────── */}
      <section className="relative z-10 py-16 sm:py-20 border-y border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8 md:gap-12"
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.08 } },
            }}
          >
            {STATS.map(({ value, label, icon: Icon }) => (
              <motion.div
                key={label}
                className="text-center"
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.4, ease }}
              >
                <Icon className="w-5 h-5 text-cyan-400/60 mx-auto mb-3" strokeWidth={1.8} />
                <div className="text-3xl sm:text-4xl font-semibold tracking-tight bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                  {value}
                </div>
                <div className="mt-1 text-sm text-white/45 font-light">{label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Mid-page nudge ──────────────────────────────────────────────── */}
      <section className="relative z-10 py-10 sm:py-14">
        <motion.div
          className="text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={viewport}
          transition={{ duration: 0.5, ease }}
        >
          <button
            type="button"
            onClick={() => navigate('/signup')}
            className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-cyan-400 transition-colors group"
          >
            Ready to see it in action?
            <ArrowRight className="w-3.5 h-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
          </button>
        </motion.div>
      </section>

      {/* ─── How It Works ─────────────────────────────────────────────────── */}
      <section className="relative z-10 py-20 sm:py-32">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] sm:w-[700px] h-[400px] sm:h-[500px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.35) 0%, transparent 70%)', filter: 'blur(120px)' }}
            animate={{ scale: [1, 1.1, 1], opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            className="text-center mb-14 sm:mb-20"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.5, ease }}
          >
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.02em]">
              Up and running in{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                under two minutes
              </span>
            </h2>
            <p className="mt-4 text-white/55 font-light max-w-xl mx-auto">
              Three steps. No setup headaches. No onboarding calls.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 md:gap-12"
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.12 } },
            }}
          >
            {HOW_IT_WORKS.map(({ step, title, description, icon: Icon, accent }) => (
              <motion.div
                key={step}
                className="relative text-center px-2"
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.5, ease }}
              >
                <div className={`w-16 h-16 rounded-2xl ${accent} flex items-center justify-center mx-auto mb-6`}>
                  <Icon className="w-7 h-7" strokeWidth={1.8} />
                </div>
                <div className="text-xs font-semibold tracking-widest uppercase text-white/30 mb-3">
                  Step {step}
                </div>
                <h3 className="text-xl font-semibold tracking-tight text-white mb-3">
                  {title}
                </h3>
                <p className="text-sm text-white/50 font-light leading-relaxed max-w-xs mx-auto">
                  {description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Integration Marquee ───────────────────────────────────────────── */}
      <section className="relative z-10 py-16 sm:py-24 overflow-hidden border-y border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-10">
          <motion.h2
            className="text-2xl sm:text-3xl font-semibold tracking-[-0.02em] text-center"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
          >
            Works with the tools you already use
          </motion.h2>
        </div>
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-16 md:w-24 bg-gradient-to-r from-[#0a0e1a] to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-16 md:w-24 bg-gradient-to-l from-[#0a0e1a] to-transparent z-10 pointer-events-none" />
          <div className="flex gap-10 sm:gap-14 animate-marquee whitespace-nowrap w-max">
            {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map(({ name, Icon }, i) => (
              <div
                key={`${name}-${i}`}
                className="flex items-center gap-3 px-5 py-3 rounded-xl bg-white/[0.04] border border-white/[0.07] shrink-0"
              >
                <Icon className="w-5 h-5 text-cyan-400/70" strokeWidth={1.8} />
                <span className="text-white/70 font-medium text-sm">{name}</span>
              </div>
            ))}
          </div>
        </div>
        <style>{`
          @keyframes marquee {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
          .animate-marquee {
            animation: marquee 40s linear infinite;
          }
        `}</style>
      </section>

      {/* ─── Social Proof ─────────────────────────────────────────────────── */}
      <section className="relative z-10 py-20 sm:py-32">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-15">
          <motion.div
            className="absolute top-0 right-1/4 w-[400px] sm:w-[550px] h-[400px] sm:h-[550px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(20,184,166,0.4) 0%, transparent 70%)', filter: 'blur(110px)' }}
            animate={{ x: [0, -40, 0], y: [0, 30, 0] }}
            transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div
            className="text-center mb-14 sm:mb-16"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.5, ease }}
          >
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.02em]">
              Trusted by productive humans
            </h2>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-7"
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.1 } },
            }}
          >
            {TESTIMONIALS.map((t) => (
              <motion.blockquote
                key={t.name}
                className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 sm:p-7 md:p-8 flex flex-col"
                variants={{
                  hidden: { opacity: 0, y: 16 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.4, ease }}
              >
                <p className="text-white/75 font-light leading-relaxed text-sm flex-1">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500/30 to-teal-500/30 flex items-center justify-center text-white/60 text-xs font-semibold">
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{t.name}</div>
                    <div className="text-xs text-white/40">{t.role}</div>
                  </div>
                </div>
              </motion.blockquote>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Final CTA ──────────────────────────────────────────────────── */}
      <section className="relative z-10 pt-12 sm:pt-16 pb-48 sm:pb-64 mb-16 sm:mb-24">
        <div className="max-w-xs mx-auto mb-16 sm:mb-20">
          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
        </div>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.6, ease }}
          >
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.02em] text-white">
              Ready to work with your energy?
            </h2>
            <p className="mt-4 text-white/45 font-light text-sm sm:text-base">
              Free to start &middot; No credit card &middot; 90-second setup
            </p>
            <button
              type="button"
              onClick={() => navigate('/signup')}
              className="mt-8 inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-medium bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white shadow-lg shadow-cyan-500/20 transition-all"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => navigate('/pricing')}
                className="text-sm text-white/35 hover:text-white/60 transition-colors"
              >
                or compare plans
              </button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
