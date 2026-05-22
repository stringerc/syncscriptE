import { motion } from 'motion/react';
import { ArrowLeft, BookOpen, Zap, Calendar, Plug, Users, Code, HelpCircle, Brain, Mic, Target, BarChart3, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router';

const coreGuides = [
  {
    icon: BookOpen,
    title: 'Getting Started',
    desc: 'Sign up, connect your calendar, and create your first task in under 2 minutes.',
    href: '/help-center',
  },
  {
    icon: Zap,
    title: 'Energy Tracking',
    desc: 'Log your energy throughout the day. SyncScript learns your peaks and valleys to suggest better schedules.',
    href: '/help-center',
  },
  {
    icon: Calendar,
    title: 'AI Scheduling',
    desc: 'Let the dashboard reorder your tasks by energy band, or have Nexus propose calendar holds automatically.',
    href: '/help-center',
  },
  {
    icon: Mic,
    title: 'Nexus Voice',
    desc: 'Use voice to create tasks, schedule holds, and edit documents—same tools as chat, hands-free.',
    href: '/help-center',
  },
];

const integrationGuides = [
  {
    icon: Plug,
    title: 'Calendar Integrations',
    desc: 'Connect Google Calendar or Outlook. SyncScript reads free/busy and writes holds to linked providers.',
  },
  {
    icon: Code,
    title: 'API & MCP',
    desc: 'REST API with PAT-scoped access for tasks, calendar holds, and your library. Cursor MCP for IDE workflows.',
  },
  {
    icon: Users,
    title: 'Team Features',
    desc: 'Shared activity feed, PAT-scoped agent access, and team scripts. Collaborate without leaving the dashboard.',
  },
];

const concepts = [
  {
    icon: Brain,
    title: 'Resonance Engine',
    desc: 'Circadian-style curves model your capacity across the day. High-energy blocks get deep work; low-energy blocks get admin. Not a medical device—heuristic wellness UX that respects your actual state.',
  },
  {
    icon: Target,
    title: 'Energy-Aware Scheduling',
    desc: 'The core moat: SyncScript doesn\'t just list tasks by due date—it sequences them by when you\'re actually at your best for each type of work. Tasks are tagged high/medium/low energy and matched to your curve.',
  },
  {
    icon: MessageSquare,
    title: 'Nexus Parity',
    desc: 'Anything the web app allows, you can do via Nexus on voice, in-app chat, or phone where technically feasible. Tool traces and contract tests ensure parity stays honest.',
  },
  {
    icon: BarChart3,
    title: 'Activity Spine',
    desc: 'Every task completion, calendar hold, and goal progress writes to your activity feed. Your heatmap and weekly snapshot are always grounded in real work.',
  },
];

const steps = [
  { n: 1, title: 'Create account', desc: 'Sign up at syncscript.app with email or Google OAuth. Verify your email.' },
  { n: 2, title: 'Connect a calendar', desc: 'Link Google Calendar or Outlook so SyncScript can read your schedule and write holds.' },
  { n: 3, title: 'Add your first task', desc: 'Create a task and assign it an energy level. The dashboard will suggest where it fits your day.' },
  { n: 4, title: 'Check your energy', desc: 'Log your current energy in the sidebar. Over time, SyncScript builds your personal rhythm profile.' },
  { n: 5, title: 'Try Nexus', desc: 'Open App AI and say "Schedule my deep work for tomorrow morning." Nexus will propose a calendar hold.' },
];

export function DocsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0e1a] via-[#0f1420] to-[#0a0e1a] text-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <motion.a
          href="/"
          onClick={(e) => { e.preventDefault(); navigate('/'); }}
          className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors mb-8"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to home
        </motion.a>

        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-4xl font-bold tracking-tight mb-2">Documentation</h1>
          <p className="text-white/70 text-lg">Learn how SyncScript aligns your tasks, calendar, and energy</p>
        </motion.div>

        {/* Core guides */}
        <motion.section className="mb-14" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <h2 className="text-2xl font-bold mb-6">Core guides</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {coreGuides.map((cat, i) => (
              <motion.div
                key={cat.title}
                className="group relative rounded-2xl p-6 bg-white/5 border border-white/10 backdrop-blur-sm hover:border-white/20 transition-all overflow-hidden cursor-pointer"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.05 * i }}
                whileHover={{ y: -2 }}
                onClick={() => navigate(cat.href)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <cat.icon className="w-8 h-8 text-emerald-400 mb-3 relative" />
                <h3 className="text-lg font-semibold mb-1 relative">{cat.title}</h3>
                <p className="text-sm text-white/60 relative">{cat.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Key concepts */}
        <motion.section className="mb-14" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <h2 className="text-2xl font-bold mb-2">Key concepts</h2>
          <p className="text-white/50 mb-6 text-sm">The ideas that make SyncScript different from a generic task list.</p>
          <div className="space-y-4">
            {concepts.map((c, i) => (
              <motion.div
                key={c.title}
                className="flex gap-4 p-5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.05 * i }}
              >
                <c.icon className="w-6 h-6 text-cyan-400 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold mb-1">{c.title}</h3>
                  <p className="text-sm text-white/60 leading-relaxed">{c.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Integration & API guides */}
        <motion.section className="mb-14" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <h2 className="text-2xl font-bold mb-6">Integrations & API</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {integrationGuides.map((g, i) => (
              <motion.div
                key={g.title}
                className="rounded-2xl p-5 bg-white/5 border border-white/10 backdrop-blur-sm"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.05 * i }}
              >
                <g.icon className="w-6 h-6 text-purple-400 mb-3" />
                <h3 className="font-semibold mb-1">{g.title}</h3>
                <p className="text-sm text-white/60">{g.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Quick start */}
        <motion.section className="mb-14" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <h2 className="text-2xl font-bold mb-6">Quick start</h2>
          <div className="space-y-3">
            {steps.map((step, i) => (
              <motion.div
                key={step.n}
                className="flex gap-4 p-4 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.05 * i }}
              >
                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-semibold">
                  {step.n}
                </span>
                <div>
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-sm text-white/60">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.div
          className="rounded-2xl p-6 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-white/10 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-4"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="flex items-center gap-3">
            <HelpCircle className="w-8 h-8 text-emerald-400 flex-shrink-0" />
            <div>
              <h3 className="font-semibold">Need more help?</h3>
              <p className="text-sm text-white/70">Visit our Help Center for searchable guides and FAQs, or the API docs for technical reference.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium transition-colors" onClick={() => navigate('/help-center')}>
              Help Center
            </button>
            <button type="button" className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium transition-colors" onClick={() => navigate('/docs/api')}>
              API Docs
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
