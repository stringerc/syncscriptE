import { useNavigate } from 'react-router';
import { ArrowLeft, Download, Mail, Building2, Users, Calendar, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

const BRAND_COLORS = [
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Teal', hex: '#14b8a6' },
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Purple', hex: '#8b5cf6' },
];

const ASSETS = [
  { name: 'Primary Logo', desc: 'Full logo with wordmark' },
  { name: 'Wordmark', desc: 'SyncScript text only' },
  { name: 'Icon', desc: 'App icon / favicon' },
  { name: 'Brand Colors', desc: 'Palette and usage' },
];

const PRESS_RELEASES = [
  { date: 'Feb 1, 2025', title: 'SyncScript Raises Seed Round to Scale Energy-First Scheduling' },
  { date: 'Jan 15, 2025', title: 'SyncScript Launches AI-Powered Energy Scheduling for Teams' },
  { date: 'Dec 10, 2024', title: 'SyncScript Beta Opens to First 1,000 Teams' },
];

const BOILERPLATE = `SyncScript is an energy-first productivity platform that helps teams schedule work around when people do their best thinking—not just when a calendar is free. Founded in 2024, SyncScript combines calendar intelligence, AI suggestions, and energy tracking so individuals and teams can protect focus time and reduce context-switching.`;

export function PressKitPage() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-[#0a0e1a] via-[#0f1420] to-[#0a0e1a] text-white"
      style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
    >
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <motion.button
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => navigate('/')}
          className="mb-8 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/90 backdrop-blur-sm transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </motion.button>

        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-12 text-center"
        >
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Press & Media</h1>
          <p className="mt-3 text-lg text-white/70">
            Resources for journalists and media partners
          </p>
        </motion.header>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-12 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm sm:p-8"
        >
          <h2 className="text-xl font-semibold">Company Overview</h2>
          <p className="mt-3 text-white/80">
            SyncScript helps teams schedule work around energy and focus—not just availability. We combine calendar intelligence, AI, and energy awareness so individuals and teams can protect deep work and reduce burnout.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Calendar, label: 'Founded', value: '2024' },
              { icon: Building2, label: 'Headquarters', value: 'San Francisco' },
              { icon: Users, label: 'Team', value: 'Small & Growing' },
              { icon: TrendingUp, label: 'Stage', value: 'Open Beta' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <Icon className="h-5 w-5 text-cyan-400" />
                <p className="mt-2 text-xs font-medium text-white/60">{label}</p>
                <p className="text-lg font-semibold">{value}</p>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-12"
        >
          <h2 className="mb-6 text-xl font-semibold">Brand Assets</h2>
          <p className="mb-6 text-sm text-white/70">Logo usage guidelines: use on clear backgrounds; maintain minimum clear space; do not stretch or recolor.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {ASSETS.map((asset, i) => (
              <motion.div
                key={asset.name}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.05 * i }}
                whileHover={{ y: -2 }}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
              >
                <div>
                  <h3 className="font-semibold">{asset.name}</h3>
                  <p className="text-sm text-white/60">{asset.desc}</p>
                </div>
                <button className="inline-flex items-center gap-2 rounded-lg border border-cyan-500/50 bg-cyan-500/20 px-4 py-2 text-sm font-medium text-cyan-300 transition hover:bg-cyan-500/30">
                  <Download className="h-4 w-4" />
                  Download
                </button>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-12"
        >
          <h2 className="mb-4 text-xl font-semibold">Brand Colors</h2>
          <div className="flex flex-wrap gap-4">
            {BRAND_COLORS.map((c) => (
              <div
                key={c.hex}
                className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <div
                  className="h-16 w-16 rounded-lg ring-2 ring-white/20"
                  style={{ backgroundColor: c.hex }}
                />
                <span className="text-sm font-medium">{c.name}</span>
                <code className="text-xs text-white/60">{c.hex}</code>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-12"
        >
          <h2 className="mb-4 text-xl font-semibold">Press Releases</h2>
          <div className="space-y-3">
            {PRESS_RELEASES.map((pr) => (
              <div
                key={pr.title}
                className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
              >
                <p className="text-xs text-white/60">{pr.date}</p>
                <p className="font-medium">{pr.title}</p>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-12"
        >
          <h2 className="mb-4 text-xl font-semibold">Media Contact</h2>
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-6 backdrop-blur-sm">
            <Mail className="h-8 w-8 text-cyan-400" />
            <p className="mt-2 font-medium">press@syncscript.app</p>
            <p className="text-sm text-white/70">For press inquiries, interviews, and media kits.</p>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
        >
          <h2 className="text-xl font-semibold">Boilerplate</h2>
          <p className="mt-3 text-white/80 leading-relaxed">{BOILERPLATE}</p>
        </motion.section>
      </div>
    </div>
  );
}
