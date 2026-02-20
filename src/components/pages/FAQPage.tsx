import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, Search, MessageCircle, Mail, BookOpen, HelpCircle, Users } from 'lucide-react';

type Category = 'all' | 'general' | 'features' | 'pricing' | 'security' | 'integrations' | 'account';

interface FAQItem {
  id: string;
  category: Category;
  question: string;
  answer: string;
}

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'general', label: 'General' },
  { id: 'features', label: 'Features' },
  { id: 'pricing', label: 'Pricing & Billing' },
  { id: 'security', label: 'Security' },
  { id: 'integrations', label: 'Integrations' },
  { id: 'account', label: 'Account' },
];

const FAQ_DATA: FAQItem[] = [
  // General
  {
    id: 'g1',
    category: 'general',
    question: 'What is SyncScript?',
    answer:
      'SyncScript is an energy-aware AI productivity app that helps you schedule tasks based on your circadian rhythms and cognitive energy levels. Instead of a rigid to-do list, SyncScript learns when you\'re at your best and suggests the right work at the right time—so you get more done with less burnout.',
  },
  {
    id: 'g2',
    category: 'general',
    question: 'How does SyncScript work with my energy levels?',
    answer:
      'SyncScript uses your self-reported energy check-ins, calendar patterns, and optional wearables data to build a model of your daily energy curve. The AI then schedules deep work during your peak hours and lighter tasks (email, admin) during lower-energy windows. You can adjust your energy profile anytime in settings.',
  },
  {
    id: 'g3',
    category: 'general',
    question: 'Can I try SyncScript for free?',
    answer:
      'Yes. We offer a Free plan with core scheduling and a limited number of AI suggestions. You can upgrade to Starter, Professional, or Enterprise anytime to unlock more features, integrations, and AI capacity.',
  },
  {
    id: 'g4',
    category: 'general',
    question: 'How long does setup take?',
    answer:
      'Most users are up and running in under 5 minutes. You\'ll connect your calendar, optionally add tasks or goals, and do a quick energy check-in. SyncScript starts suggesting better times for your work immediately and gets smarter as you use it.',
  },
  {
    id: 'g5',
    category: 'general',
    question: 'What devices and platforms are supported?',
    answer:
      'SyncScript runs in modern browsers on desktop and mobile (Chrome, Safari, Firefox, Edge). We\'re working on native iOS and Android apps. Your data syncs across devices so you can check in and reschedule from anywhere.',
  },
  // Features
  {
    id: 'f1',
    category: 'features',
    question: 'What is the Resonance Engine?',
    answer:
      'The Resonance Engine is SyncScript\'s core AI that matches tasks to your energy and context. It considers your calendar, priorities, deadlines, and energy curve to suggest when to do each task—and can auto-reschedule when something urgent comes up or your energy shifts.',
  },
  {
    id: 'f2',
    category: 'features',
    question: 'How does AI scheduling work?',
    answer:
      'AI scheduling analyzes your tasks, goals, deadlines, and energy profile to propose optimal time blocks. You can accept suggestions with one click, drag to adjust, or let SyncScript auto-schedule. The system learns from your acceptances and edits to improve over time.',
  },
  {
    id: 'f3',
    category: 'features',
    question: 'Can I customize my energy tracking?',
    answer:
      'Yes. You can set your typical peak hours, add manual energy check-ins, and (on paid plans) connect wearables for more accurate data. Energy sensitivity and reminder frequency are fully configurable in settings.',
  },
  {
    id: 'f4',
    category: 'features',
    question: 'What is the Scripts & Templates marketplace?',
    answer:
      'The marketplace lets you discover and use pre-built workflows and templates—e.g. "Deep work block," "Meeting prep," or "Weekly review." You can also create and share your own scripts with your team or the community.',
  },
  {
    id: 'f5',
    category: 'features',
    question: 'How does the gamification system work?',
    answer:
      'SyncScript uses light gamification—streaks, milestones, and optional challenges—to make consistency fun without feeling like a game. You earn points for check-ins, completed focus blocks, and hitting goals. You can turn elements on or off in settings.',
  },
  // Pricing & Billing
  {
    id: 'p1',
    category: 'pricing',
    question: 'What plans do you offer?',
    answer:
      'We offer Free (core features, limited AI), Starter at $19/month (more AI and integrations), Professional at $49/month (advanced scheduling, team features, API), and Enterprise at $99/month (SSO, dedicated support, custom SLAs). All paid plans include a free trial.',
  },
  {
    id: 'p2',
    category: 'pricing',
    question: 'Is there a free trial?',
    answer:
      'Yes. Paid plans (Starter, Professional, Enterprise) come with a free trial so you can try premium features before committing. No credit card is required to start the trial.',
  },
  {
    id: 'p3',
    category: 'pricing',
    question: 'Can I change plans anytime?',
    answer:
      'Yes. You can upgrade or downgrade from your account settings. Upgrades take effect immediately; downgrades apply at the end of your current billing period. Prorated credits or charges may apply.',
  },
  {
    id: 'p4',
    category: 'pricing',
    question: 'What payment methods do you accept?',
    answer:
      'We accept all major credit and debit cards (Visa, Mastercard, Amex) and, on Enterprise, invoicing. Payments are processed securely via Stripe.',
  },
  {
    id: 'p5',
    category: 'pricing',
    question: 'Do you offer refunds?',
    answer:
      'We offer a satisfaction guarantee within the first 14 days of a paid subscription. If you\'re not happy, contact support@syncscript.app and we\'ll process a full refund. After 14 days, we consider refunds on a case-by-case basis.',
  },
  {
    id: 'p6',
    category: 'pricing',
    question: 'Is there a discount for annual billing?',
    answer:
      'Yes. When you pay annually, you save about 20% compared to paying monthly. The exact discount is shown on the pricing page and at checkout.',
  },
  // Security
  {
    id: 's1',
    category: 'security',
    question: 'Is my data secure?',
    answer:
      'Yes. We use encryption in transit (TLS) and at rest (AES-256), follow security best practices, and run on infrastructure designed for compliance. We never use your data to train third-party models without your consent.',
  },
  {
    id: 's2',
    category: 'security',
    question: 'Are you SOC 2 certified?',
    answer:
      'We are working toward SOC 2 Type II certification. In the meantime, we adhere to SOC 2–aligned controls and can provide a security overview upon request for Enterprise customers.',
  },
  {
    id: 's3',
    category: 'security',
    question: 'Where is data stored?',
    answer:
      'Your data is stored in secure, geographically distributed data centers (via our cloud provider). We do not sell or share your data with third parties for marketing or advertising.',
  },
  {
    id: 's4',
    category: 'security',
    question: 'Can I export my data?',
    answer:
      'Yes. You can export your tasks, goals, and account data from your account settings. We provide standard formats (e.g. JSON/CSV) so you can move your data elsewhere or keep a backup.',
  },
  {
    id: 's5',
    category: 'security',
    question: 'Do you sell user data?',
    answer:
      'No, never. We do not sell, rent, or share your personal data with third parties for marketing or advertising. Your data is used only to provide and improve SyncScript. See our Privacy Policy for full details.',
  },
  // Integrations
  {
    id: 'i1',
    category: 'integrations',
    question: 'What integrations do you support?',
    answer:
      'We support Google Calendar, Outlook/Microsoft 365, and other calendar providers. Task and project integrations (e.g. Notion, Asana, Linear) are available on paid plans. Check the Integrations page in the app for the full list.',
  },
  {
    id: 'i2',
    category: 'integrations',
    question: 'Can I connect multiple calendars?',
    answer:
      'Yes. You can connect multiple calendars (e.g. work and personal). SyncScript merges them into a single view and respects busy/free times when scheduling. Limits may apply by plan.',
  },
  {
    id: 'i3',
    category: 'integrations',
    question: 'Do you integrate with Slack or Teams?',
    answer:
      'Slack and Microsoft Teams integrations are available on Professional and Enterprise plans. You can get reminders, log focus time, and (on Enterprise) sync status and availability.',
  },
  {
    id: 'i4',
    category: 'integrations',
    question: 'Can I use the API?',
    answer:
      'Yes. Our REST API is available on Professional and Enterprise plans. You can create tasks, read schedules, and build custom workflows. Documentation is at /docs and in the developer section of the app.',
  },
  // Account
  {
    id: 'a1',
    category: 'account',
    question: 'How do I cancel my subscription?',
    answer:
      'Go to Account or Billing in the app, then choose "Cancel subscription." Your access continues until the end of your current billing period; you won\'t be charged again. You can resubscribe anytime.',
  },
  {
    id: 'a2',
    category: 'account',
    question: 'Can I transfer my account?',
    answer:
      'Account transfer (e.g. changing the email or ownership) is supported for team and Enterprise accounts. Contact support@syncscript.app and we\'ll guide you through the process.',
  },
  {
    id: 'a3',
    category: 'account',
    question: 'What happens when I cancel?',
    answer:
      'You keep access until the end of your paid period. After that, your account moves to the Free plan. Your data is retained; you can export it anytime or delete your account from settings.',
  },
  {
    id: 'a4',
    category: 'account',
    question: 'How do I delete my account?',
    answer:
      'In Account settings, open "Data & privacy" and choose "Delete account." We\'ll ask you to confirm. Once deleted, your data is removed from our systems within 30 days per our data retention policy. This cannot be undone.',
  },
];

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function FAQPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category>('all');
  const [openId, setOpenId] = useState<string | null>(null);

  const filteredFaqs = useMemo(() => {
    let list = FAQ_DATA;
    if (category !== 'all') list = list.filter((f) => f.category === category);
    if (search.trim()) {
      const q = normalize(search);
      list = list.filter(
        (f) =>
          normalize(f.question).includes(q) || normalize(f.answer).includes(q)
      );
    }
    return list;
  }, [category, search]);

  return (
    <div className="relative min-h-screen text-white">
      {/* Hero */}
      <section className="relative pt-16 sm:pt-24 pb-12 sm:pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-white via-cyan-100 to-emerald-200 bg-clip-text text-transparent">
              Frequently Asked Questions
            </h1>
            <p className="mt-4 text-base sm:text-lg text-white/70 max-w-2xl mx-auto">
              Everything you need to know about SyncScript
            </p>
            <div className="mt-8 max-w-xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40 pointer-events-none" />
              <input
                type="text"
                placeholder="Search questions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/30 transition"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Category tabs */}
      <section className="sticky top-16 z-10 py-4 bg-[#0a0e1a]/80 backdrop-blur-md border-y border-white/5 -mt-2">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide scroll-smooth">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`
                  flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition
                  ${category === cat.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-white/5 text-white/80 border border-white/10 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          {filteredFaqs.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-white/60 py-12"
            >
              No questions match your search. Try a different term or category.
            </motion.p>
          ) : (
            <ul className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredFaqs.map((faq, index) => {
                  const isOpen = openId === faq.id;
                  return (
                    <motion.li
                      key={faq.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25, delay: index * 0.02 }}
                      className={`
                        rounded-xl border backdrop-blur-sm overflow-hidden transition-colors
                        bg-white/5 border-white/10
                        ${isOpen ? 'border-cyan-500/30 ring-1 ring-cyan-500/20' : 'hover:border-white/20'}
                      `}
                    >
                      <button
                        type="button"
                        onClick={() => setOpenId(isOpen ? null : faq.id)}
                        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                      >
                        <span className="font-medium text-white pr-4">
                          {faq.question}
                        </span>
                        <motion.span
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex-shrink-0 text-cyan-400"
                        >
                          <ChevronDown className="w-5 h-5" />
                        </motion.span>
                      </button>
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-4 pt-0 text-white/80 text-sm leading-relaxed border-t border-white/5">
                              {faq.answer}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>
          )}
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 sm:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div
            className="relative rounded-2xl overflow-hidden p-8 sm:p-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            style={{
              background:
                'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(16, 185, 129, 0.1) 50%, rgba(6, 182, 212, 0.08) 100%)',
              border: '1px solid rgba(6, 182, 212, 0.25)',
            }}
          >
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Still have questions?
            </h2>
            <p className="text-white/70 mb-6 max-w-xl">
              Join our Discord community or email us—we\'re happy to help.
            </p>
            <div className="flex flex-wrap gap-4">
              <a
                href="https://discord.gg/2rq38UJrDJ"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 transition"
              >
                <MessageCircle className="w-5 h-5" />
                Join Discord
              </a>
              <a
                href="mailto:support@syncscript.app"
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/5 text-white border border-white/10 hover:bg-white/10 transition"
              >
                <Mail className="w-5 h-5" />
                support@syncscript.app
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Related resources */}
      <section className="py-16 sm:py-24 border-t border-white/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.h2
            className="text-xl sm:text-2xl font-bold text-white mb-6 sm:mb-8"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            Related resources
          </motion.h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              {
                icon: BookOpen,
                title: 'Documentation',
                description: 'API reference, guides, and examples.',
                path: '/docs',
              },
              {
                icon: HelpCircle,
                title: 'Help Center',
                description: 'Step-by-step guides and troubleshooting.',
                path: '/help',
              },
              {
                icon: Users,
                title: 'Community',
                description: 'Connect with other SyncScript users.',
                path: '/community',
              },
            ].map((item, i) => (
              <motion.div
                key={item.path}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="group rounded-xl bg-white/5 border border-white/10 p-5 hover:border-cyan-500/30 hover:bg-white/[0.07] transition"
              >
                <item.icon className="w-8 h-8 text-cyan-400 mb-3" />
                <h3 className="font-semibold text-white mb-1">{item.title}</h3>
                <p className="text-sm text-white/60 mb-4">{item.description}</p>
                <button
                  type="button"
                  onClick={() => navigate(item.path)}
                  className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1"
                >
                  Learn more
                  <ChevronDown className="w-4 h-4 rotate-[-90deg]" />
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
