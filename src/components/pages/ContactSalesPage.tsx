import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send, ArrowLeft, Building2, Users, Shield, Clock, CheckCircle2,
  Loader2, Sparkles, Lock, Globe, HeadphonesIcon, Zap,
} from 'lucide-react';

const ease = [0.22, 1, 0.36, 1] as const;
const viewport = { once: true, amount: 0.2 };

const COMPANY_SIZES = [
  '1–10 employees',
  '11–50 employees',
  '51–200 employees',
  '201–500 employees',
  '500–1,000 employees',
  '1,000+ employees',
] as const;

const ENTERPRISE_HIGHLIGHTS = [
  { icon: Shield, label: 'SOC 2 & HIPAA Compliant' },
  { icon: Lock, label: 'SSO / SAML Authentication' },
  { icon: Users, label: 'Unlimited Team Members' },
  { icon: Clock, label: '< 1 Hour Priority Support' },
  { icon: Globe, label: 'Data Residency Options' },
  { icon: HeadphonesIcon, label: 'Dedicated Account Manager' },
];

export function ContactSalesPage() {
  const navigate = useNavigate();
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    companySize: '',
    role: '',
    message: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  const updateField = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim() || !form.message.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/sales/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }

      const data = await res.json();
      setAiResponse(data.response || '');
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="relative min-h-screen text-white overflow-x-hidden"
      style={{
        background: 'linear-gradient(to bottom, #0a0e1a, #0f1420, #0a0e1a)',
        fontFamily: "'Space Grotesk', system-ui, sans-serif",
      }}
    >
      {/* Top nav bar */}
      <nav className="relative z-20 py-5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between">
          <button
            onClick={() => navigate('/pricing')}
            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Pricing
          </button>
          <button
            onClick={() => navigate('/')}
            className="text-white/50 hover:text-white transition-colors text-sm"
          >
            SyncScript
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 min-h-[40vh] flex flex-col justify-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease }}
          >
            <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/25 rounded-full px-5 py-1.5 mb-6">
              <Building2 className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs font-medium text-violet-300">Enterprise Solutions</span>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-[-0.03em] leading-[1.08]">
              Let&apos;s build something{' '}
              <span className="bg-gradient-to-r from-violet-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
                together
              </span>
            </h1>
            <p className="mt-5 text-lg sm:text-xl text-white/50 font-light max-w-2xl mx-auto">
              Tell us about your team and what you&apos;re looking for.
              Our AI advisor will give you a detailed, personalized response instantly.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main content */}
      <section className="relative z-10 py-12 sm:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-5 gap-10 lg:gap-14">

            {/* Left: Highlights */}
            <motion.div
              className="lg:col-span-2 order-2 lg:order-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease }}
            >
              <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-6">
                Enterprise includes
              </h3>
              <div className="space-y-4">
                {ENTERPRISE_HIGHLIGHTS.map(({ icon: Ic, label }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/5 border border-white/[0.08]">
                      <Ic className="w-4 h-4 text-cyan-400/70" strokeWidth={1.8} />
                    </div>
                    <span className="text-sm text-white/70 font-light">{label}</span>
                  </div>
                ))}
              </div>

              <div className="mt-10 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-violet-400" />
                  <span className="text-sm font-medium text-white/80">AI-Powered Response</span>
                </div>
                <p className="text-xs text-white/40 font-light leading-relaxed">
                  Your inquiry is analyzed by our AI advisor who has deep knowledge of SyncScript&apos;s
                  enterprise capabilities, security features, and pricing. You&apos;ll receive a
                  detailed, personalized response within seconds — not a generic template.
                </p>
              </div>

              <div className="mt-6 p-5 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
                <h4 className="text-sm font-medium text-white/80 mb-2">Prefer to talk?</h4>
                <p className="text-xs text-white/40 font-light leading-relaxed mb-3">
                  Email us directly at{' '}
                  <a href="mailto:sales@syncscript.app" className="text-cyan-400 hover:underline">
                    sales@syncscript.app
                  </a>
                  {' '}and our team will respond within 24 hours.
                </p>
              </div>
            </motion.div>

            {/* Right: Form / Response */}
            <motion.div
              className="lg:col-span-3 order-1 lg:order-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1, ease }}
            >
              <AnimatePresence mode="wait">
                {!submitted ? (
                  <motion.form
                    key="form"
                    ref={formRef}
                    onSubmit={handleSubmit}
                    className="space-y-5 p-6 sm:p-8 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm"
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Name" required>
                        <input
                          ref={nameRef}
                          type="text"
                          required
                          value={form.name}
                          onChange={(e) => updateField('name', e.target.value)}
                          placeholder="Jane Smith"
                          disabled={submitting}
                          className="field-input"
                        />
                      </Field>
                      <Field label="Work Email" required>
                        <input
                          type="email"
                          required
                          value={form.email}
                          onChange={(e) => updateField('email', e.target.value)}
                          placeholder="jane@company.com"
                          disabled={submitting}
                          className="field-input"
                        />
                      </Field>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Company">
                        <input
                          type="text"
                          value={form.company}
                          onChange={(e) => updateField('company', e.target.value)}
                          placeholder="Acme Inc."
                          disabled={submitting}
                          className="field-input"
                        />
                      </Field>
                      <Field label="Company Size">
                        <select
                          value={form.companySize}
                          onChange={(e) => updateField('companySize', e.target.value)}
                          disabled={submitting}
                          className="field-input appearance-none"
                        >
                          <option value="">Select size...</option>
                          {COMPANY_SIZES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </Field>
                    </div>

                    <Field label="Your Role">
                      <input
                        type="text"
                        value={form.role}
                        onChange={(e) => updateField('role', e.target.value)}
                        placeholder="VP of Engineering, CTO, IT Director..."
                        disabled={submitting}
                        className="field-input"
                      />
                    </Field>

                    <Field label="How can we help?" required>
                      <textarea
                        required
                        rows={5}
                        value={form.message}
                        onChange={(e) => updateField('message', e.target.value)}
                        placeholder="Tell us about your team, what challenges you're facing, or any specific questions about SyncScript Enterprise..."
                        disabled={submitting}
                        className="field-input resize-none"
                      />
                    </Field>

                    {error && (
                      <p className="text-sm text-red-400 text-center">{error}</p>
                    )}

                    <button
                      type="submit"
                      disabled={submitting || !form.email.trim() || !form.message.trim()}
                      className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-medium text-sm bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-400 hover:to-cyan-400 text-white shadow-lg shadow-violet-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating your personalized response…
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Inquiry
                        </>
                      )}
                    </button>

                    <p className="text-center text-xs text-white/30 font-light">
                      You&apos;ll receive an AI-powered response instantly, plus a personal follow-up within 24h.
                    </p>
                  </motion.form>
                ) : (
                  <motion.div
                    key="response"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease }}
                    className="rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-sm overflow-hidden"
                  >
                    {/* Success header */}
                    <div className="px-6 sm:px-8 pt-6 sm:pt-8 pb-5 border-b border-white/[0.06]">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold tracking-tight">Response from SyncScript</h3>
                          <p className="text-xs text-white/40 font-light">
                            Personalized by our AI advisor &middot; Also sent to {form.email}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* AI response body */}
                    <div className="px-6 sm:px-8 py-6 sm:py-8">
                      <div
                        className="prose prose-invert prose-sm max-w-none text-white/75 font-light leading-relaxed
                          [&_strong]:text-white/90 [&_strong]:font-medium
                          [&_a]:text-cyan-400 [&_a]:no-underline [&_a:hover]:underline
                          [&_ul]:space-y-1.5 [&_li]:text-white/65"
                        dangerouslySetInnerHTML={{
                          __html: aiResponse
                            .replace(/\n/g, '<br>')
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/• /g, '&bull; ')
                            .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1">$1</a>'),
                        }}
                      />
                    </div>

                    {/* Actions */}
                    <div className="px-6 sm:px-8 pb-6 sm:pb-8 flex flex-col sm:flex-row gap-3">
                      <button
                        onClick={() => {
                          setSubmitted(false);
                          setAiResponse('');
                          setForm((f) => ({ ...f, message: '' }));
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-white/[0.07] hover:bg-white/[0.12] border border-white/[0.12] hover:border-white/[0.2] text-white/80 hover:text-white transition-all"
                      >
                        Ask Another Question
                      </button>
                      <button
                        onClick={() => navigate('/pricing')}
                        className="flex-1 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-violet-500 to-cyan-500 hover:from-violet-400 hover:to-cyan-400 text-white shadow-lg shadow-violet-500/20 transition-all"
                      >
                        <Zap className="w-4 h-4" />
                        View Plans
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Bottom trust strip */}
      <section className="relative z-10 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={viewport}
            transition={{ duration: 0.6, ease }}
          >
            <p className="text-xs text-white/25 font-light">
              Trusted by teams at companies of all sizes &middot; SOC 2 &middot; HIPAA &middot; GDPR &middot; 99.9% SLA
            </p>
          </motion.div>
        </div>
      </section>

      {/* Inline styles for form fields */}
      <style>{`
        .field-input {
          width: 100%;
          padding: 0.65rem 1rem;
          border-radius: 0.75rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          color: white;
          font-size: 0.875rem;
          transition: all 0.2s;
          outline: none;
        }
        .field-input::placeholder { color: rgba(255,255,255,0.25); }
        .field-input:focus {
          border-color: rgba(6,182,212,0.4);
          box-shadow: 0 0 0 3px rgba(6,182,212,0.1);
        }
        .field-input:disabled { opacity: 0.5; }
        .field-input option { background: #1a1f2e; color: white; }
      `}</style>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-white/50 font-medium mb-1.5 block">
        {label}{required && <span className="text-cyan-400 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}
