import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check, X, ArrowRight, Sparkles, Shield, Clock, ChevronDown,
  Zap, Lock, HelpCircle, Loader2, Mail,
} from 'lucide-react';
import { PLANS as PRICING_PLANS, formatPrice, type PricingPlan } from '../../config/pricing';
import { projectId, publicAnonKey } from '../../utils/supabase/info';

const viewport = { once: true, amount: 0.2 };
const ease = [0.22, 1, 0.36, 1] as const;
const STRIPE_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/stripe`;

export function PricingPage() {
  const navigate = useNavigate();
  const [annual, setAnnual] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const [checkoutPlan, setCheckoutPlan] = useState<PricingPlan | null>(null);
  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (checkoutPlan && emailInputRef.current) {
      emailInputRef.current.focus();
    }
  }, [checkoutPlan]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutPlan || !checkoutEmail.trim()) return;

    setCheckoutLoading(true);
    setCheckoutError(null);

    try {
      const guestId = crypto.randomUUID();
      const res = await fetch(`${STRIPE_BASE}/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          plan_id: checkoutPlan.id,
          user_id: guestId,
          email: checkoutEmail.trim(),
          success_url: `${window.location.origin}/signup?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/pricing`,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Unable to start checkout. Please try again.');
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL returned.');
      }
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleCtaClick = (plan: PricingPlan) => {
    if (plan.ctaAction === 'contact') {
      navigate('/contact');
    } else if (plan.ctaAction === 'checkout') {
      setCheckoutPlan(plan);
      setCheckoutEmail('');
      setCheckoutError(null);
    } else {
      navigate('/signup');
    }
  };

  const faqs = [
    { q: 'What happens after the free trial?', a: 'After your 14-day free trial ends, you can continue on the Free plan or upgrade. No surprise charges.' },
    { q: 'Can I change plans later?', a: 'Yes! Upgrade or downgrade at any time. Changes are prorated automatically.' },
    { q: 'Is my payment information secure?', a: 'Absolutely. We use Stripe for payment processing — PCI DSS compliant and trusted by millions of businesses.' },
    { q: 'Do you offer refunds?', a: 'Yes. 30-day money-back guarantee, no questions asked.' },
    { q: 'What happens if I cancel?', a: "Your subscription stays active until the end of your billing period. After that you move to the Free plan — your data is always yours." },
  ];

  return (
    <div className="relative min-h-screen text-white">

      {/* ─── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative z-10 min-h-[60vh] flex flex-col justify-center pb-10 sm:pb-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease }}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-[-0.02em] leading-[1.08] mb-5">
              Simple, Transparent{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 bg-clip-text text-transparent">
                Pricing
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-white/60 font-light max-w-2xl mx-auto">
              Start free. Upgrade when you&apos;re ready. Cancel anytime.
            </p>
          </motion.div>

          {/* Billing toggle */}
          <motion.div
            className="mt-8 flex items-center justify-center gap-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15, ease }}
          >
            <span className={`text-sm font-medium transition-colors ${!annual ? 'text-white' : 'text-white/40'}`}>Monthly</span>
            <button
              onClick={() => setAnnual(!annual)}
              className="relative inline-flex h-8 w-14 shrink-0 items-center rounded-full bg-white/10 border border-white/15 transition-colors hover:border-white/25"
              aria-label="Toggle billing interval"
            >
              <motion.span
                className="absolute w-6 h-6 rounded-full bg-gradient-to-r from-cyan-400 to-teal-400 shadow-lg shadow-cyan-500/25"
                animate={{ x: annual ? 29 : 3 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </button>
            <span className={`text-sm font-medium transition-colors ${annual ? 'text-white' : 'text-white/40'}`}>
              Yearly
              <span className="ml-2 text-xs text-emerald-400/80">Save ~20%</span>
            </span>
          </motion.div>
        </div>
      </section>

      {/* ─── Pricing Cards ────────────────────────────────────────────────── */}
      <section className="relative z-10 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.08 } },
            }}
          >
            {PRICING_PLANS.map((plan) => (
              <motion.div
                key={plan.id}
                className={`backdrop-blur-sm rounded-2xl p-5 sm:p-7 relative flex flex-col ${
                  plan.popular
                    ? 'bg-gradient-to-br from-cyan-900/30 to-teal-900/30 border-2 border-cyan-500 transform lg:scale-105 shadow-2xl shadow-cyan-500/20'
                    : 'bg-white/5 border border-white/10 hover:bg-white/[0.07] hover:border-white/15 transition-colors'
                }`}
                variants={{
                  hidden: { opacity: 0, y: 20 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.5, ease }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-cyan-500 to-teal-500 text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                    MOST POPULAR
                  </div>
                )}

                <h3 className="text-xl font-semibold tracking-tight mb-1.5">{plan.name}</h3>
                <p className="text-xs text-white/45 font-light mb-4">{plan.subtitle}</p>

                <div className="mb-1">
                  <span className="text-3xl sm:text-4xl font-semibold tracking-tight">
                    {formatPrice(plan, annual)}
                  </span>
                  <span className="text-sm text-white/40 font-light ml-1">
                    /{plan.price === 0 ? 'forever' : 'mo'}
                  </span>
                </div>
                {annual && plan.priceAnnual && plan.price !== 0 && (
                  <p className="text-xs text-emerald-400/70 mb-4">
                    Save ${((plan.price as number) - plan.priceAnnual) * 12}/year
                  </p>
                )}
                {(!annual || !plan.priceAnnual || plan.price === 0) && <div className="mb-4" />}

                <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent mb-5" />

                <ul className="space-y-2.5 flex-1 mb-8">
                  {plan.features.map((f) => (
                    <li key={f.text} className="flex items-start gap-2.5">
                      {f.included ? (
                        <Check className={`w-4 h-4 mt-0.5 shrink-0 ${f.highlight ? 'text-emerald-400' : 'text-cyan-400/70'}`} strokeWidth={2} />
                      ) : (
                        <X className="w-4 h-4 mt-0.5 shrink-0 text-white/20" strokeWidth={2} />
                      )}
                      <span className={`text-sm font-light ${f.included ? 'text-white/70' : 'text-white/30'} ${f.highlight ? 'font-medium text-white/90' : ''}`}>
                        {f.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleCtaClick(plan)}
                  className={`w-full px-5 py-2.5 rounded-xl font-medium transition-all text-sm ${
                    plan.popular
                      ? 'bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white shadow-lg shadow-cyan-500/20'
                      : 'bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.12] hover:border-white/[0.2] text-white/80 hover:text-white'
                  }`}
                >
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Trust strip ──────────────────────────────────────────────────── */}
      <section className="relative z-10 py-14 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <motion.div
            className="flex flex-wrap items-center justify-center gap-8 sm:gap-14 text-sm text-white/50"
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.08 } },
            }}
          >
            {[
              { icon: Lock, label: 'PCI-compliant payments via Stripe' },
              { icon: Shield, label: '30-day money-back guarantee' },
              { icon: Clock, label: '14-day free trial on paid plans' },
            ].map(({ icon: Ic, label }) => (
              <motion.div
                key={label}
                className="flex items-center gap-2.5"
                variants={{
                  hidden: { opacity: 0, y: 8 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.4, ease }}
              >
                <Ic className="w-4 h-4 text-cyan-400/50" strokeWidth={1.8} />
                <span className="font-light">{label}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="relative z-10 py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.5, ease }}
          >
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.02em]">
              Questions?{' '}
              <span className="text-white/40">We&apos;ve got answers.</span>
            </h2>
          </motion.div>

          <motion.div
            className="space-y-3"
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.05 } },
            }}
          >
            {faqs.map((faq, i) => {
              const isOpen = openFaq === i;
              return (
                <motion.div
                  key={i}
                  className={`
                    rounded-xl border backdrop-blur-sm overflow-hidden transition-colors
                    bg-white/[0.03]
                    ${isOpen ? 'border-cyan-500/30 ring-1 ring-cyan-500/15' : 'border-white/[0.08] hover:border-white/[0.15]'}
                  `}
                  variants={{
                    hidden: { opacity: 0, y: 12 },
                    visible: { opacity: 1, y: 0 },
                  }}
                  transition={{ duration: 0.35, ease }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                  >
                    <span className="font-medium text-white/90 pr-4">{faq.q}</span>
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
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ─── Final CTA (hero-style centered section) ────────────────────── */}
      <section className="relative z-10 min-h-[60vh] flex flex-col justify-center">
        <div className="max-w-xs mx-auto mb-14 sm:mb-20">
          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />
        </div>
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewport}
            transition={{ duration: 0.6, ease }}
          >
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-[-0.02em]">
              Ready to work with your energy?
            </h2>
            <p className="mt-4 text-white/45 font-light text-sm sm:text-base">
              Free to start &middot; No credit card &middot; 90-second setup
            </p>
            <button
              type="button"
              onClick={() => {
                const proPlan = PRICING_PLANS.find(p => p.popular);
                if (proPlan) handleCtaClick(proPlan);
                else navigate('/signup');
              }}
              className="mt-8 inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-medium bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white shadow-lg shadow-cyan-500/20 transition-all"
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
            <div className="mt-4">
              <button
                type="button"
                onClick={() => navigate('/features')}
                className="text-sm text-white/35 hover:text-white/60 transition-colors"
              >
                or explore features
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Checkout Email Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {checkoutPlan && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !checkoutLoading && setCheckoutPlan(null)}
            />
            <motion.div
              className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#0f1420]/95 backdrop-blur-xl p-8 shadow-2xl shadow-cyan-500/10"
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.25, ease }}
            >
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-4">
                  <Mail className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-xl font-semibold tracking-tight">
                  Get started with {checkoutPlan.name}
                </h3>
                <p className="mt-1.5 text-sm text-white/50 font-light">
                  Enter your email to continue to secure checkout
                </p>
              </div>

              <form onSubmit={handleCheckout} className="space-y-4">
                <div>
                  <input
                    ref={emailInputRef}
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={checkoutEmail}
                    onChange={e => setCheckoutEmail(e.target.value)}
                    disabled={checkoutLoading}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/30 transition text-sm disabled:opacity-50"
                  />
                </div>

                {checkoutError && (
                  <p className="text-sm text-red-400 text-center">{checkoutError}</p>
                )}

                <button
                  type="submit"
                  disabled={checkoutLoading || !checkoutEmail.trim()}
                  className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-medium text-sm bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {checkoutLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Redirecting to Stripe…
                    </>
                  ) : (
                    <>
                      Continue to Checkout <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-5 flex items-center justify-center gap-4 text-xs text-white/35">
                <span className="flex items-center gap-1"><Lock className="w-3 h-3" /> Secure checkout</span>
                <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> 14-day free trial</span>
              </div>

              {!checkoutLoading && (
                <button
                  type="button"
                  onClick={() => setCheckoutPlan(null)}
                  className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
