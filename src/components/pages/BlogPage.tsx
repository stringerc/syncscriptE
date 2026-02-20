import { useNavigate } from 'react-router';
import { ArrowLeft, Clock, Mail, Send } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';

const CATEGORIES = ['All', 'Productivity', 'Engineering', 'AI', 'Company News', 'Tips', 'Research'] as const;
const CATEGORY_GRADIENTS: Record<string, string> = {
  Productivity: 'from-cyan-500/20 to-teal-500/20 border-cyan-500/40',
  Engineering: 'from-indigo-500/20 to-purple-500/20 border-indigo-500/40',
  AI: 'from-violet-500/20 to-fuchsia-500/20 border-violet-500/40',
  'Company News': 'from-teal-500/20 to-cyan-500/20 border-teal-500/40',
  Tips: 'from-amber-500/20 to-orange-500/20 border-amber-500/40',
  Research: 'from-emerald-500/20 to-cyan-500/20 border-emerald-500/40',
};

const FEATURED = {
  title: 'The Science Behind Energy-Based Scheduling',
  date: 'Feb 15, 2025',
  readTime: '8 min read',
  category: 'Research',
  excerpt: 'How circadian rhythms and cognitive load research inform SyncScript\'s scheduling engine—and why timing matters more than task count.',
};

const POSTS = [
  { title: 'Why Deep Work Blocks Beat Back-to-Back Meetings', date: 'Feb 12, 2025', category: 'Productivity', excerpt: 'Batch your focus time and protect it. We share how teams use SyncScript to enforce flow state.' },
  { title: 'Building the SyncScript Calendar Engine', date: 'Feb 8, 2025', category: 'Engineering', excerpt: 'Under the hood: how we merge external calendars with energy-based slots without double-booking.' },
  { title: 'AI That Schedules Around Your Energy, Not Just Time', date: 'Feb 5, 2025', category: 'AI', excerpt: 'Our approach to predictive energy modeling and why we don\'t treat all hours as equal.' },
  { title: 'SyncScript Raises Seed Round to Scale Energy-First Scheduling', date: 'Feb 1, 2025', category: 'Company News', excerpt: 'Announcing our seed funding and plans to bring energy-aware scheduling to more teams.' },
  { title: '5 Habits That Actually Improve Your Peak Hours', date: 'Jan 28, 2025', category: 'Tips', excerpt: 'Sleep, movement, and context-switching—small changes that compound into better peak performance.' },
  { title: 'The State of Workplace Energy in 2025', date: 'Jan 22, 2025', category: 'Research', excerpt: 'Findings from our survey of 2,000 knowledge workers on when and how they do their best work.' },
];

export function BlogPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [email, setEmail] = useState('');

  const filteredPosts = activeCategory === 'All'
    ? POSTS
    : POSTS.filter((p) => p.category === activeCategory);

  return (
    <div
      className="min-h-screen bg-gradient-to-b from-[#0a0e1a] via-[#0f1420] to-[#0a0e1a] text-white"
      style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
    >
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
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
          className="mb-10 text-center"
        >
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">SyncScript Blog</h1>
          <p className="mt-3 text-lg text-white/70">
            Insights on productivity, energy management, and the future of work
          </p>
        </motion.header>

        <div className="mb-8 flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((cat) => (
            <motion.button
              key={cat}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeCategory === cat
                  ? 'bg-cyan-500/30 text-white ring-1 ring-cyan-400/50'
                  : 'bg-white/5 text-white/80 ring-1 ring-white/10 hover:bg-white/10'
              }`}
            >
              {cat}
            </motion.button>
          ))}
        </div>

        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="mb-12 overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm"
        >
          <div className="grid gap-6 p-6 sm:grid-cols-2 sm:p-8">
            <div>
              <span className="inline-block rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-medium text-cyan-300">
                {FEATURED.category}
              </span>
              <h2 className="mt-3 text-2xl font-bold sm:text-3xl">{FEATURED.title}</h2>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-white/60">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {FEATURED.date}
                </span>
                <span>{FEATURED.readTime}</span>
              </div>
              <p className="mt-4 text-white/80">{FEATURED.excerpt}</p>
              <button
                onClick={() => {}}
                className="mt-4 inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
              >
                Read More
                <Send className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/10 to-teal-500/10" />
          </div>
        </motion.article>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {filteredPosts.map((post, i) => (
            <motion.div
              key={post.title}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 * i }}
              whileHover={{ y: -4 }}
              className={`overflow-hidden rounded-xl border bg-white/5 backdrop-blur-sm transition hover:bg-white/[0.07] ${CATEGORY_GRADIENTS[post.category] || 'from-white/10 to-white/5 border-white/10'}`}
            >
              <div className="p-5">
                <span className="inline-block rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-white/80">
                  {post.category}
                </span>
                <h3 className="mt-2 font-semibold">{post.title}</h3>
                <p className="mt-1 text-xs text-white/60">{post.date}</p>
                <p className="mt-2 line-clamp-2 text-sm text-white/70">{post.excerpt}</p>
                <button
                  onClick={() => {}}
                  className="mt-3 text-sm text-cyan-400 hover:text-cyan-300"
                >
                  Read More →
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mt-16 rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm sm:p-10"
        >
          <div className="mx-auto max-w-xl text-center">
            <h3 className="text-xl font-semibold">Stay in the loop</h3>
            <p className="mt-2 text-white/70">Join 5,000+ readers. Get the best of the blog in your inbox.</p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/50 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/50"
              />
              <button
                type="button"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-5 py-3 font-medium text-white transition hover:bg-cyan-600"
              >
                <Mail className="h-4 w-4" />
                Subscribe
              </button>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
