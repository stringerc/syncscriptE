import { motion } from 'motion/react';
import { ArrowLeft, Search, BookOpen, Zap, Calendar, Plug, Users, Code, HelpCircle } from 'lucide-react';
import { useNavigate } from 'react-router';

const categories = [
  { icon: BookOpen, title: 'Getting Started', desc: 'Set up your account and connect your first calendar.', href: '#' },
  { icon: Zap, title: 'Energy Tracking', desc: 'Track focus levels and optimize your schedule.', href: '#' },
  { icon: Calendar, title: 'AI Scheduling', desc: 'Let AI suggest blocks and reschedule tasks.', href: '#' },
  { icon: Plug, title: 'Integrations', desc: 'Google Calendar, Make, webhooks, and more.', href: '#' },
  { icon: Users, title: 'Team Features', desc: 'Shared calendars, scripts, and collaboration.', href: '#' },
  { icon: Code, title: 'API Reference', desc: 'REST API, webhooks, and SDKs.', href: '#' },
];

const steps = [
  { n: 1, title: 'Create Account', desc: 'Sign up at syncscript.app and verify your email.' },
  { n: 2, title: 'Connect Calendar', desc: 'Link Google Calendar or other supported calendars.' },
  { n: 3, title: 'Start Scheduling', desc: 'Add tasks and let AI suggest optimal time blocks.' },
];

export function DocsPage() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-[#0a0e1a] via-[#0f1420] to-[#0a0e1a] text-white"
      style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
    >
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
          <p className="text-white/70 text-lg">Everything you need to get started with SyncScript</p>
        </motion.div>

        <motion.div
          className="relative mb-14"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
          <input
            type="search"
            placeholder="Search documentation..."
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition"
          />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.title}
              className="group relative rounded-2xl p-6 bg-white/5 border border-white/10 backdrop-blur-sm hover:border-white/20 transition-all overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 * i }}
              whileHover={{ y: -2 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <cat.icon className="w-8 h-8 text-emerald-400 mb-3 relative" />
              <h3 className="text-lg font-semibold mb-1 relative">{cat.title}</h3>
              <p className="text-sm text-white/60 mb-4 relative">{cat.desc}</p>
              <button
                type="button"
                className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors relative"
                onClick={() => {}}
              >
                Explore →
              </button>
            </motion.div>
          ))}
        </div>

        <motion.section
          className="mb-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl font-bold mb-6">Quick start</h2>
          <div className="space-y-4">
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
              <h3 className="font-semibold">Need help?</h3>
              <p className="text-sm text-white/70">Visit our Help Center for guides and FAQs.</p>
            </div>
          </div>
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium transition-colors"
            onClick={() => navigate('/help')}
          >
            Go to Help Center
          </button>
        </motion.div>
      </div>
    </div>
  );
}
