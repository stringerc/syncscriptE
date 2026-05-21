import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Search, UserPlus, Zap, Calendar, CreditCard, Users, Wrench, Mail, MessageCircle, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router';

const topics = [
  { icon: UserPlus, title: 'Account Setup', desc: 'Create and verify your account', keywords: 'account sign up register login verify email' },
  { icon: Zap, title: 'Energy Tracking', desc: 'Focus levels and scheduling', keywords: 'energy focus level circadian schedule peak' },
  { icon: Calendar, title: 'Calendar Sync', desc: 'Connect and sync calendars', keywords: 'calendar sync google outlook connect integrate' },
  { icon: CreditCard, title: 'Billing', desc: 'Subscriptions and payments', keywords: 'billing payment subscription cancel plan pricing' },
  { icon: Users, title: 'Team Management', desc: 'Invite and manage team members', keywords: 'team invite member manage role permission' },
  { icon: Wrench, title: 'Troubleshooting', desc: 'Fix common issues', keywords: 'troubleshoot fix bug error issue problem not working' },
];

const faqs: { q: string; a: string }[] = [
  { q: 'How do I connect my Google Calendar?', a: 'Go to Settings → Integrations, then click Connect next to Google Calendar. Authorize SyncScript in the popup and choose which calendars to sync.' },
  { q: 'Can I use SyncScript with multiple calendars?', a: 'Yes. You can connect multiple Google accounts and toggle which calendars are visible. Team calendars appear when you invite members.' },
  { q: 'How does AI scheduling work?', a: 'SyncScript uses your energy levels, existing events, and task priorities to suggest time blocks. You can accept, edit, or dismiss suggestions.' },
  { q: 'How do I cancel my subscription?', a: 'In Settings → Billing, click Manage subscription. You can cancel anytime; access continues until the end of the billing period.' },
  { q: 'Why are my events not syncing?', a: 'Check that the calendar is enabled in Integrations and that you\'ve granted the correct permissions. Try disconnecting and reconnecting the calendar.' },
  { q: 'What is energy-aware scheduling?', a: 'SyncScript tracks your cognitive energy throughout the day and suggests tasks when you\'re at peak focus. It learns your patterns over time to make better suggestions.' },
  { q: 'How do I add team members?', a: 'Go to the Team page, click Invite, and enter their email. They\'ll get a link to join your workspace with the role you assign.' },
  { q: 'Is my data secure?', a: 'Yes. We use end-to-end encryption for sensitive data, never sell your information, and you can export or delete your data at any time from Settings.' },
];

export function HelpCenterPage() {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [search, setSearch] = useState('');

  const query = search.toLowerCase().trim();

  const filteredTopics = useMemo(() => {
    if (!query) return topics;
    return topics.filter(t =>
      t.title.toLowerCase().includes(query) ||
      t.desc.toLowerCase().includes(query) ||
      t.keywords.includes(query)
    );
  }, [query]);

  const filteredFaqs = useMemo(() => {
    if (!query) return faqs;
    return faqs.filter(f =>
      f.q.toLowerCase().includes(query) ||
      f.a.toLowerCase().includes(query)
    );
  }, [query]);

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
          <h1 className="text-4xl font-bold tracking-tight mb-2">Help Center</h1>
          <p className="text-white/70 text-lg">Find answers to common questions</p>
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
            placeholder="Search help articles..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setOpenIndex(null); }}
            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white/20 transition"
          />
        </motion.div>

        {filteredTopics.length > 0 && (
          <>
            <h2 className="text-xl font-bold mb-4">Popular topics</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-16">
              {filteredTopics.map((t, i) => (
                <motion.div
                  key={t.title}
                  className="rounded-2xl p-5 bg-white/5 border border-white/10 backdrop-blur-sm hover:border-white/20 transition-all"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                >
                  <t.icon className="w-7 h-7 text-cyan-400 mb-2" />
                  <h3 className="font-semibold mb-1">{t.title}</h3>
                  <p className="text-sm text-white/60">{t.desc}</p>
                </motion.div>
              ))}
            </div>
          </>
        )}

        {filteredFaqs.length > 0 ? (
          <>
            <h2 className="text-xl font-bold mb-4">Frequently asked questions</h2>
            <div className="space-y-2 mb-16">
              {filteredFaqs.map((faq, i) => {
                const globalIndex = faqs.indexOf(faq);
                return (
                  <motion.div
                    key={faq.q}
                    className="rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm overflow-hidden"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                  >
                    <button
                      type="button"
                      className="w-full flex items-center justify-between gap-4 px-4 py-4 text-left font-medium hover:bg-white/5 transition-colors"
                      onClick={() => setOpenIndex(openIndex === globalIndex ? null : globalIndex)}
                    >
                      {faq.q}
                      <ChevronDown
                        className={`w-5 h-5 flex-shrink-0 transition-transform ${openIndex === globalIndex ? 'rotate-180' : ''}`}
                      />
                    </button>
                    <AnimatePresence>
                      {openIndex === globalIndex && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <p className="px-4 pb-4 pt-0 text-sm text-white/70 border-t border-white/10">{faq.a}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </>
        ) : (
          search && (
            <div className="text-center py-12 mb-16">
              <p className="text-white/50">No results for &ldquo;{search}&rdquo;</p>
              <p className="text-sm text-white/40 mt-2">Try different keywords or contact support below.</p>
            </div>
          )
        )}

        <motion.section
          className="rounded-2xl p-6 bg-white/5 border border-white/10 backdrop-blur-sm"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-xl font-bold mb-4">Contact support</h2>
          <p className="text-white/70 text-sm mb-4">We typically respond within 24 hours on business days.</p>
          <div className="flex flex-wrap gap-4">
            <a
              href="mailto:support@syncscript.app"
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <Mail className="w-4 h-4" /> support@syncscript.app
            </a>
            <a
              href="https://discord.gg/2rq38UJrDJ"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <MessageCircle className="w-4 h-4" /> Discord
            </a>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
