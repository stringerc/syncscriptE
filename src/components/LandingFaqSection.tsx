import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { useParticleTransition } from './ParticleTransition';

const FAQ_ITEMS = [
  {
    question: "How does SyncScript work with my energy levels?",
    answer:
      "SyncScript uses circadian rhythm science and cognitive load theory to analyze when you're most focused. It automatically schedules complex tasks during your peak hours and lighter tasks when your energy dips.",
  },
  {
    question: "Can I try SyncScript for free?",
    answer:
      "Yes! We offer a 14-day free trial with full access to all features. No credit card required. Experience the difference before committing.",
  },
  {
    question: "How long does setup take?",
    answer:
      "Most users are fully set up in under 90 seconds. Just connect your calendar, and our AI starts learning your patterns immediately.",
  },
  {
    question: "Is my data secure?",
    answer:
      "Absolutely. We use bank-level encryption (AES-256), all data is encrypted at rest and in transit, and we never sell your data. Your productivity insights stay private.",
  },
  {
    question: "What integrations do you support?",
    answer:
      "SyncScript syncs with Google Calendar and Outlook today. Slack, Notion, Asana, Linear, and more are on our public roadmap - new integrations ship regularly during beta.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes, cancel with one click. No questions asked, no hidden fees. You'll keep access until the end of your billing period.",
  },
  {
    question: "Do you use quantum computing in production today?",
    answer:
      "SyncScript is quantum-ready and runs a pilot quantum-origin rail in advisory mode. Production decisions still use classical baseline + fallback until quality, latency, and replay benchmarks clear promotion gates.",
  },
];

export function LandingFaqSection() {
  const { navigateWithParticles } = useParticleTransition();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <section id="faq" className="py-20 sm:py-28 lg:py-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-4xl sm:text-5xl font-semibold mb-4 tracking-[-0.02em]">Frequently Asked Questions</h2>
          <p className="text-lg sm:text-xl text-white/60 font-light">Everything you need to know</p>
        </div>

        <div className="space-y-4">
          {FAQ_ITEMS.map((faq, index) => (
            <motion.div
              key={faq.question}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden hover:border-cyan-500/30 transition-all"
            >
              <button
                onClick={() => setExpandedFaq(expandedFaq === index ? null : index)}
                className="w-full flex items-center justify-between p-5 sm:p-6 text-left"
              >
                <span className="font-semibold text-base sm:text-lg pr-4">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-cyan-400 transition-transform shrink-0 ${
                    expandedFaq === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <AnimatePresence>
                {expandedFaq === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 sm:px-6 pb-5 sm:pb-6 text-white/70 text-sm sm:text-base leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        <div className="text-center mt-10">
          <button
            onClick={() => navigateWithParticles('/faq')}
            className="text-cyan-400 hover:text-cyan-300 text-sm font-medium transition-colors"
          >
            View all FAQs &rarr;
          </button>
        </div>
      </div>
    </section>
  );
}
