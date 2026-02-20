import { motion } from 'motion/react';
import {
  ArrowLeft,
  MessageCircle,
  Github,
  Twitter,
  FileText,
  Bug,
  Lightbulb,
  Code2,
  Users,
  Calendar,
  Star,
} from 'lucide-react';
import { useNavigate } from 'react-router';

const channels = [
  { icon: MessageCircle, title: 'Discord', desc: 'Chat, support, and announcements', href: 'https://discord.gg/2rq38UJrDJ' },
  { icon: Github, title: 'GitHub Discussions', desc: 'Q&A and feature ideas', href: '#' },
  { icon: Twitter, title: 'Twitter / X', desc: 'Updates and tips', href: '#' },
  { icon: FileText, title: 'Blog', desc: 'Product and engineering posts', href: '#' },
];

const contributions = [
  { icon: Bug, title: 'Report bugs', desc: 'Open an issue with steps to reproduce.' },
  { icon: Lightbulb, title: 'Suggest features', desc: 'Share ideas in GitHub Discussions or Discord.' },
  { icon: Code2, title: 'Write plugins', desc: 'Use our API to build integrations.' },
];

const spotlight = [
  { name: 'Alex R.', role: 'Power user', quote: 'SyncScript changed how I plan my week.' },
  { name: 'Jordan K.', role: 'Team lead', quote: 'We use it for team scheduling and love it.' },
  { name: 'Sam T.', role: 'Developer', quote: 'The API made our internal tools much easier.' },
];

export function CommunityPage() {
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
          <h1 className="text-4xl font-bold tracking-tight mb-2">Community</h1>
          <p className="text-white/70 text-lg">Connect with 10,000+ SyncScript users</p>
        </motion.div>

        <motion.div
          className="rounded-2xl p-6 mb-12 bg-gradient-to-br from-indigo-500/15 to-cyan-500/10 border border-white/10 backdrop-blur-sm"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-8 h-8 text-indigo-400" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold mb-1">Join us on Discord</h2>
              <p className="text-white/70 text-sm mb-3">Get help, share feedback, and meet other users. 10,000+ members.</p>
              <a
                href="https://discord.gg/2rq38UJrDJ"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/30 transition-colors font-medium"
              >
                Join Discord
              </a>
            </div>
          </div>
        </motion.div>

        <h2 className="text-xl font-bold mb-4">Community channels</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-14">
          {channels.map((ch, i) => (
            <motion.a
              key={ch.title}
              href={ch.href}
              target={ch.href.startsWith('http') ? '_blank' : undefined}
              rel={ch.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="rounded-2xl p-5 bg-white/5 border border-white/10 backdrop-blur-sm hover:border-white/20 transition-all flex items-start gap-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * (i + 1) }}
              whileHover={{ y: -2 }}
            >
              <ch.icon className="w-6 h-6 text-cyan-400 flex-shrink-0" />
              <div>
                <h3 className="font-semibold">{ch.title}</h3>
                <p className="text-sm text-white/60">{ch.desc}</p>
              </div>
            </motion.a>
          ))}
        </div>

        <motion.section
          className="mb-14"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-xl font-bold mb-4">How to contribute</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {contributions.map((c, i) => (
              <motion.div
                key={c.title}
                className="rounded-xl p-4 bg-white/5 border border-white/10 backdrop-blur-sm"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.05 * i }}
              >
                <c.icon className="w-6 h-6 text-emerald-400 mb-2" />
                <h3 className="font-semibold text-sm mb-1">{c.title}</h3>
                <p className="text-xs text-white/60">{c.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          className="mb-14"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400" /> Community spotlight
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {spotlight.map((s, i) => (
              <motion.div
                key={s.name}
                className="rounded-xl p-4 bg-white/5 border border-white/10 backdrop-blur-sm"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.05 * i }}
              >
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center mb-3">
                  <Users className="w-5 h-5 text-white/60" />
                </div>
                <p className="text-sm font-medium">{s.name}</p>
                <p className="text-xs text-white/50 mb-2">{s.role}</p>
                <p className="text-sm text-white/70 italic">&ldquo;{s.quote}&rdquo;</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          className="rounded-2xl p-6 bg-white/5 border border-white/10 backdrop-blur-sm"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-cyan-400" /> Upcoming events
          </h2>
          <p className="text-white/60 text-sm">Community calls and AMAs will be posted here and in Discord. Stay tuned.</p>
        </motion.section>
      </div>
    </div>
  );
}
