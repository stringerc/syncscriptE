import { useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Briefcase,
  DollarSign,
  Home,
  BookOpen,
  Coffee,
  Globe,
  Heart,
  Mail,
  Sparkles,
} from 'lucide-react';

const benefits = [
  { icon: DollarSign, label: 'Competitive salary' },
  { icon: Sparkles, label: 'Equity' },
  { icon: Coffee, label: 'Unlimited PTO' },
  { icon: BookOpen, label: 'Learning budget' },
  { icon: Home, label: 'Home office stipend' },
  { icon: Globe, label: 'Flexible hours' },
];

const jobs = [
  { title: 'No open positions right now', dept: '', location: '', type: '', desc: 'We\'re a small team focused on building. When we\'re ready to grow, openings will appear here first.' },
];

export function CareersPage() {
  const navigate = useNavigate();
  const careersEmail = 'careers@syncscript.app';

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
            Join the SyncScript Team
          </h1>
          <p className="text-lg sm:text-xl text-white/70 max-w-2xl mx-auto">
            Build the future of productivity with us—remote-first, impact-focused, and human-centered.
          </p>
        </motion.section>

        {/* Culture */}
        <motion.section
          className="mb-16 sm:mb-24"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-2xl font-semibold mb-4 text-white">Our Culture</h2>
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 sm:p-8">
            <p className="text-white/80 leading-relaxed">
              We're <strong className="text-white">remote-first</strong> and believe in async communication so you can focus when it matters. We care about impact over hours—ship great work, then protect your time. We're building a place where talented people do their best work without burning out.
            </p>
          </div>
        </motion.section>

        {/* Benefits */}
        <motion.section
          className="mb-16 sm:mb-24"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-2xl font-semibold mb-8 text-white">Benefits</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {benefits.map((b, i) => (
              <motion.div
                key={b.label}
                className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 flex items-center gap-4 hover:bg-white/10 transition-colors"
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <b.icon className="w-8 h-8 text-indigo-400 shrink-0" />
                <span className="font-medium text-white">{b.label}</span>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Open positions */}
        <motion.section
          className="mb-16 sm:mb-24"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-2xl font-semibold mb-8 text-white">Open Positions</h2>
          <div className="space-y-4">
        {jobs.map((job, i) => (
          <motion.div
            key={job.title}
            className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm p-6"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.06 }}
          >
            <h3 className="font-semibold text-white text-lg">{job.title}</h3>
            <p className="text-white/70 mt-2">{job.desc}</p>
          </motion.div>
        ))}
          </div>
        </motion.section>

        {/* Don't see your role */}
        <motion.section
          className="text-center"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
        >
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-8 sm:p-12">
            <Heart className="w-10 h-10 mx-auto mb-4 text-indigo-400" />
            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2">Don't see your role?</h2>
            <p className="text-white/70 mb-6 max-w-md mx-auto">
              We're always looking for exceptional people. Send us your background and what you'd love to do.
            </p>
            <motion.a
              href={`mailto:${careersEmail}?subject=General application`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-medium transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Briefcase className="w-4 h-4" /> Apply generally
            </motion.a>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
