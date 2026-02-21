import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Beaker,
  Heart,
  Shield,
  Sparkles,
  Target,
  Users,
  TrendingUp,
  Zap,
  Clock,
} from 'lucide-react';

const values = [
  { icon: Beaker, label: 'Science-Backed', desc: 'Built on circadian rhythm and cognitive load research.' },
  { icon: Heart, label: 'User-First', desc: 'Every decision starts with what helps you actually get more done.' },
  { icon: Shield, label: 'Privacy-Obsessed', desc: 'Your data stays yours. We never sell or share it.' },
  { icon: Sparkles, label: 'Relentlessly Simple', desc: 'Powerful features without the complexity.' },
];

const team = [
  { role: 'CEO', name: 'Founding team' },
  { role: 'CTO', name: 'Founding team' },
  { role: 'Head of Design', name: 'Founding team' },
  { role: 'Head of AI', name: 'Founding team' },
];

const stats = [
  { value: 'Open', label: 'Beta status', icon: Users },
  { value: '2024', label: 'Founded', icon: Zap },
  { value: 'Weekly', label: 'Feature releases', icon: TrendingUp },
];

export function AboutPage() {
  const navigate = useNavigate();

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-[#0a0e1a] via-[#0f1420] to-[#0a0e1a] text-white overflow-x-hidden"
      style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Back to home */}
        <motion.a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            navigate('/');
          }}
          className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm mb-8 transition-colors"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ArrowLeft className="w-4 h-4" /> Back to home
        </motion.a>

        {/* Hero */}
        <motion.section
          className="text-center mb-16 sm:mb-24"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent mb-4">
            About SyncScript
          </h1>
          <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto">
            AI-powered productivity that works with your energy—not against it.
          </p>
        </motion.section>

        {/* Our Story */}
        <motion.section
          className="mb-16 sm:mb-24"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-semibold mb-4 text-white">Our Story</h2>
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 sm:p-8 shadow-xl">
            <p className="text-white/80 leading-relaxed">
              SyncScript was founded in 2024 from a simple frustration: productivity tools kept ignoring human biology. We were tired of one-size-fits-all task lists and calendars that didn't care when we were actually focused. We built SyncScript to align work with your circadian rhythm and cognitive energy—so you can do more without burning out.
            </p>
          </div>
        </motion.section>

        {/* Mission / Vision */}
        <motion.section
          className="mb-16 sm:mb-24 text-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
        >
          <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-sm p-8 sm:p-12">
            <Target className="w-10 h-10 mx-auto mb-4 text-indigo-400" />
            <p className="text-xl sm:text-2xl font-medium text-white/95 max-w-xl mx-auto">
              We believe productivity should feel natural.
            </p>
            <p className="text-white/70 mt-2">
              Our vision is a world where tools adapt to you—not the other way around.
            </p>
          </div>
        </motion.section>

        {/* Core Values */}
        <motion.section
          className="mb-16 sm:mb-24"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-2xl font-semibold mb-8 text-white">Core Values</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {values.map((v, i) => (
              <motion.div
                key={v.label}
                className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 hover:bg-white/10 transition-colors"
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <v.icon className="w-8 h-8 text-indigo-400 mb-3" />
                <h3 className="font-semibold text-white mb-1">{v.label}</h3>
                <p className="text-sm text-white/70">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Team */}
        <motion.section
          className="mb-16 sm:mb-24"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-semibold mb-8 text-white">Our Team</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {team.map((t, i) => (
              <motion.div
                key={t.role}
                className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 text-center"
                initial={{ opacity: 0, scale: 0.96 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
              >
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-white/70" />
                </div>
                <h3 className="font-semibold text-white">{t.role}</h3>
                <p className="text-sm text-white/60">{t.name}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Stats */}
        <motion.section
          className="mb-16 sm:mb-24"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
        >
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 sm:p-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
              {stats.map((s, i) => (
                <div key={s.label} className="text-center">
                  <s.icon className="w-8 h-8 mx-auto mb-2 text-indigo-400" />
                  <div className="text-2xl sm:text-3xl font-bold text-white">{s.value}</div>
                  <div className="text-sm text-white/60">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.section>

        {/* CTA */}
        <motion.section
          className="text-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
        >
          <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-sm p-8 sm:p-12">
            <Clock className="w-10 h-10 mx-auto mb-4 text-indigo-400" />
            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2">Join the beta</h2>
            <p className="text-white/70 mb-6 max-w-md mx-auto">
              Be among the first to experience productivity that adapts to you.
            </p>
            <motion.button
              onClick={() => navigate('/')}
              className="px-6 py-3 rounded-lg bg-white text-indigo-600 font-medium hover:bg-white/90 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Get early access
            </motion.button>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
