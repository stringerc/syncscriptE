import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ScrollSection } from '../scroll/ScrollSection';
import {
  textSplitReveal,
  staggerAlternate,
  blurToSharp,
  cardCascade,
} from '../scroll/animations';
import {
  ChevronDown, Search, MessageCircle, Mail, BookOpen, HelpCircle, Users,
  Sparkles, ArrowRight, Clock, Shield, Zap, Star, Check, Phone,
} from 'lucide-react';
import { convergenceZoom } from '../scroll/animations';

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
      'Google Calendar and Outlook/Microsoft 365 are fully supported today with two-way sync. Task and project integrations (Notion, Asana, Linear, and more) are on our public roadmap and shipping during the beta period. Check the Integrations page for the latest status.',
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
      'Slack and Microsoft Teams integrations are on our roadmap for Professional and Enterprise plans. When available, you\'ll be able to get reminders, log focus time, and sync status. Join our Discord for the latest integration updates.',
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
    <div data-marketing-root className="relative min-h-screen text-white">
      {/* Snap 1 — Hero */}
      <ScrollSection id="faq-hero" animation={textSplitReveal}>
      <section className="relative min-h-[60vh] flex flex-col justify-center pb-12 sm:pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-[-0.02em] text-white">
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
      </ScrollSection>

      {/* Snap 2 — Popular Questions */}
      <ScrollSection id="faq-popular" animation={cardCascade}>
      <section className="relative z-10 py-16 sm:py-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div className="text-center mb-10"
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300 font-medium mb-4">
              <Star className="w-3 h-3" /> Most asked
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.02em]">Quick answers to common questions</h2>
          </motion.div>

          <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}>
            {[
              { icon: Zap, q: 'What is SyncScript?', a: 'An energy-aware AI productivity app that schedules your tasks based on when you\'re at your best.' },
              { icon: Shield, q: 'Is it free to start?', a: 'Yes. The Free plan is free forever with core features. Paid plans include a 14-day free trial with no credit card required.' },
              { icon: Clock, q: 'How long does setup take?', a: 'Under 2 minutes. Connect your calendar, do a quick energy check-in, and you\'re live.' },
              { icon: Users, q: 'Does it work for teams?', a: 'Yes. Professional and Enterprise plans include shared workspaces, team analytics, and meeting optimization.' },
              { icon: Sparkles, q: 'What makes it different?', a: 'SyncScript is the only tool that schedules around your energy, not just your availability. AI that understands when you work best.' },
              { icon: Check, q: 'Can I cancel anytime?', a: 'Absolutely. Cancel from your account settings. You keep access until your billing period ends, then move to the Free plan.' },
            ].map(({ icon: Icon, q, a }) => (
              <motion.div key={q}
                className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-5 hover:bg-white/[0.07] hover:border-white/[0.15] transition-all duration-300"
                variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.4 }}>
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">{q}</h3>
                </div>
                <p className="text-xs text-white/50 font-light leading-relaxed">{a}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      </ScrollSection>

      {/* Snap 3 — FAQ Accordion (natural height for sticky tabs + variable content) */}
      <ScrollSection id="faq-list" animation={staggerAlternate} fullHeight={false}>
      {/* Category tabs */}
      <section className="sticky top-16 z-10 py-4 bg-[#0a0e1a]/80 backdrop-blur-md border-y border-white/5 -mt-2">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide scroll-smooth justify-center">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`
                  flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition
                  ${category === cat.id
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10 hover:text-white'
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
                            <div className="px-5 pb-4 pt-0 text-white/60 text-sm leading-relaxed font-light border-t border-white/5">
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
      </ScrollSection>

      {/* Contact CTA — Enhanced */}
      <ScrollSection id="faq-contact" animation={blurToSharp}>
      <section className="py-24 sm:py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div className="text-center mb-10"
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.02em] text-white">
              Still have questions?
            </h2>
            <p className="mt-3 text-white/50 font-light max-w-lg mx-auto">
              Our team is here to help. Pick the channel that works best for you.
            </p>
          </motion.div>

          <motion.div className="grid grid-cols-1 sm:grid-cols-3 gap-5"
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}>
            {[
              {
                icon: MessageCircle,
                title: 'Discord Community',
                desc: 'Get answers from the team and other users. Feature requests, bug reports, and beta chat.',
                response: 'Usually within minutes',
                link: 'https://discord.gg/2rq38UJrDJ',
                label: 'Join Discord',
                external: true,
                accent: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
              },
              {
                icon: Mail,
                title: 'Email Support',
                desc: 'For account issues, billing, or anything private. We read every email personally.',
                response: 'Within 24 hours',
                link: 'mailto:support@syncscript.app',
                label: 'support@syncscript.app',
                external: false,
                accent: 'bg-teal-500/10 border-teal-500/20 text-teal-400',
              },
              {
                icon: Phone,
                title: 'Talk to Nexus',
                desc: 'Our AI assistant can answer most questions instantly. Try the voice chat on our landing page.',
                response: 'Instant',
                link: '/',
                label: 'Try Voice Chat',
                external: false,
                accent: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
              },
            ].map(({ icon: Icon, title, desc, response, link, label, external, accent }) => (
              <motion.div key={title}
                className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-5 sm:p-6 flex flex-col"
                variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.4 }}>
                <div className={`w-11 h-11 rounded-xl ${accent.split(' ').slice(0, 2).join(' ')} flex items-center justify-center ${accent.split(' ').pop()} mb-4`}>
                  <Icon className="w-5 h-5" strokeWidth={1.8} />
                </div>
                <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
                <p className="text-xs text-white/50 font-light leading-relaxed flex-1 mb-3">{desc}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400/70 font-medium mb-4">
                  <Clock className="w-3 h-3" /> {response}
                </div>
                <a href={link} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white/[0.06] border border-white/[0.1] hover:bg-white/[0.1] text-white/70 hover:text-white transition-all">
                  {label} <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
      </ScrollSection>

      {/* Resources + CTA */}
      <ScrollSection id="faq-resources" animation={convergenceZoom}>
      <section className="py-24 sm:py-32">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div className="text-center mb-10"
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-[-0.02em]">Explore more</h2>
            <p className="mt-3 text-white/45 font-light text-sm">Dive deeper into how SyncScript works.</p>
          </motion.div>

          <motion.div className="grid sm:grid-cols-3 gap-5"
            initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}>
            {[
              {
                icon: BookOpen, title: 'Documentation',
                description: 'API reference, quickstart guides, webhooks, and code examples for developers and power users.',
                path: '/docs', color: 'text-cyan-400', bg: 'bg-cyan-500/10',
              },
              {
                icon: HelpCircle, title: 'Help Center',
                description: 'Step-by-step walkthroughs for every feature, troubleshooting, and account management.',
                path: '/help', color: 'text-teal-400', bg: 'bg-teal-500/10',
              },
              {
                icon: Users, title: 'Community',
                description: 'Join thousands of users on Discord. Share workflows, vote on features, and get real-time help.',
                path: '/community', color: 'text-emerald-400', bg: 'bg-emerald-500/10',
              },
            ].map((item) => (
              <motion.div key={item.path}
                className="group rounded-2xl bg-white/[0.03] border border-white/[0.07] p-5 sm:p-6 hover:border-white/[0.15] hover:bg-white/[0.06] transition-all duration-300 flex flex-col"
                variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
                transition={{ duration: 0.4 }}>
                <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center ${item.color} mb-4`}>
                  <item.icon className="w-5 h-5" strokeWidth={1.8} />
                </div>
                <h3 className="font-semibold text-white mb-1.5">{item.title}</h3>
                <p className="text-xs text-white/50 font-light leading-relaxed flex-1 mb-4">{item.description}</p>
                <button type="button" onClick={() => navigate(item.path)}
                  className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition flex items-center gap-1.5 group-hover:gap-2.5">
                  Learn more <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </motion.div>

          {/* Final CTA */}
          <motion.div className="mt-16 text-center"
            initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.2 }}>
            <h3 className="text-xl sm:text-2xl font-semibold text-white mb-3">Ready to work with your energy?</h3>
            <p className="text-sm text-white/45 font-light mb-6">Free to start. No credit card. 90-second setup.</p>
            <button type="button" onClick={() => navigate('/signup')}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-medium bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white shadow-lg shadow-cyan-500/20 transition-all">
              <Sparkles className="w-4 h-4" /> Get Started Free <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        </div>
      </section>
      </ScrollSection>
    </div>
  );
}
