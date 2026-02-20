import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Loader2, Mail, Sparkles, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { betaSignup, resendWelcomeEmail } from '../utils/betaApi';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface BetaSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BetaSignupModal({ isOpen, onClose }: BetaSignupModalProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [memberNumber, setMemberNumber] = useState<number | null>(null);
  const [alreadyRegistered, setAlreadyRegistered] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setAlreadyRegistered(false);

    try {
      // Use the betaSignup utility (handles API + fallback)
      const data = await betaSignup(email);

      setMemberNumber(data.memberNumber);
      
      // Check if already registered
      if (data.alreadyExists) {
        setAlreadyRegistered(true);
        setLoading(false);
        return;
      }
      
      // Also subscribe to email system (don't block on this)
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/email/subscribe`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
              email,
              segments: ['beta_user']
            })
          }
        );
        
        if (response.ok) {
          console.log('✅ Email subscription successful');
        }
      } catch (emailError) {
        // Don't fail signup if email subscription fails
        console.warn('⚠️ Email subscription failed:', emailError);
      }
      
      setSuccess(true);

      // Track signup event (optional)
      console.log('✅ Beta signup successful:', data);
    } catch (err) {
      console.error('❌ Beta signup error:', err);
      
      // Provide user-friendly error messages
      let errorMessage = 'Something went wrong. Please try again.';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  async function handleResendEmail() {
    setError('');
    setLoading(true);
    setResendSuccess(false);

    try {
      const result = await resendWelcomeEmail(email);
      setResendSuccess(true);
      console.log('✅ Welcome email resent:', result.message);
    } catch (err) {
      console.error('❌ Resend email error:', err);
      
      let errorMessage = 'Failed to resend email. Please try again.';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-6 sm:py-10 px-4"
            onClick={onClose}
          >
            <div
              className="relative w-full max-w-lg bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 sm:p-8 my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {!success ? (
                <>
                  {!alreadyRegistered ? (
                    <>
                      {/* Header */}
                      <div className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-2xl mb-4">
                          <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2">
                          🧪 Become a Beta Tester
                        </h2>
                        <p className="text-slate-400">
                          Help us build the best productivity tool ever made
                        </p>
                      </div>

                      {/* Benefits */}
                      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
                        <p className="text-slate-300 font-medium mb-4">What you get:</p>
                        <ul className="space-y-3">
                          <li className="flex items-start gap-3 text-slate-300">
                            <Check className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                            <span><strong className="text-white">FREE unlimited access</strong> to all features</span>
                          </li>
                          <li className="flex items-start gap-3 text-slate-300">
                            <Check className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                            <span><strong className="text-white">Direct line to founder</strong> (Discord + feedback widget)</span>
                          </li>
                          <li className="flex items-start gap-3 text-slate-300">
                            <Check className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                            <span><strong className="text-white">Shape the product</strong> - your feedback drives roadmap</span>
                          </li>
                          <li className="flex items-start gap-3 text-slate-300">
                            <Check className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                            <span><strong className="text-white">"Beta Tester" badge</strong> (permanent recognition)</span>
                          </li>
                          <li className="flex items-start gap-3 text-slate-300">
                            <Check className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                            <span><strong className="text-white">Lifetime 50% off</strong> when we launch (as thank you)</span>
                          </li>
                        </ul>
                      </div>

                      {/* What we ask */}
                      <div className="mb-6">
                        <p className="text-slate-300 font-medium mb-3">What we ask:</p>
                        <ul className="space-y-2 text-sm text-slate-400">
                          <li className="flex items-start gap-2">
                            <span className="text-slate-500">📝</span>
                            <span>Share feedback when you encounter bugs</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-slate-500">💡</span>
                            <span>Suggest improvements</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-slate-500">🎯</span>
                            <span>Test new features as we ship them</span>
                          </li>
                        </ul>
                      </div>

                      {/* Form */}
                      <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                            {error}
                          </div>
                        )}

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            Email Address
                          </label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <Input
                              type="email"
                              placeholder="you@example.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="pl-10 bg-slate-800/50 border-slate-600 text-white placeholder:text-slate-500"
                              required
                            />
                          </div>
                        </div>

                        <Button
                          type="submit"
                          disabled={loading}
                          className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-medium h-12 text-base"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Joining Beta...
                            </>
                          ) : (
                            'Become a Beta Tester'
                          )}
                        </Button>

                        <p className="text-xs text-slate-500 text-center">
                          No payment required • Cancel anytime • Free during beta
                        </p>
                      </form>

                      {/* Guest Option */}
                      <div className="mt-6 pt-6 border-t border-slate-700">
                        <button
                          onClick={() => window.location.href = '/login?guest=true'}
                          className="text-slate-400 hover:text-white transition-colors text-sm mx-auto block"
                        >
                          or <span className="underline">Try as Guest</span> →
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Already Registered State */}
                      <div className="text-center py-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full mb-6">
                          <Mail className="w-10 h-10 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-4">
                          Already Registered! 🎉
                        </h2>
                        <p className="text-lg text-slate-300 mb-2">
                          You're already a beta tester
                        </p>
                        <p className="text-2xl font-bold text-cyan-400 mb-6">
                          Beta Tester #{memberNumber}
                        </p>
                        
                        {resendSuccess ? (
                          <div className="bg-green-500/10 border border-green-500/50 text-green-400 px-4 py-3 rounded-lg text-sm mb-6">
                            ✅ Welcome email sent! Check your inbox.
                          </div>
                        ) : (
                          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6 text-left">
                            <p className="text-slate-300 mb-4">
                              <strong className="text-white">Didn't receive the welcome email?</strong>
                            </p>
                            <p className="text-slate-400 text-sm mb-4">
                              We can resend it to you. Check your spam folder first, then click the button below.
                            </p>
                            
                            {error && (
                              <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm mb-4">
                                {error}
                              </div>
                            )}
                            
                            <Button
                              onClick={handleResendEmail}
                              disabled={loading}
                              className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-400 hover:to-cyan-400 text-white font-medium h-12"
                            >
                              {loading ? (
                                <>
                                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                  Sending...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="w-5 h-5 mr-2" />
                                  Resend Welcome Email
                                </>
                              )}
                            </Button>
                          </div>
                        )}

                        <Button
                          onClick={onClose}
                          className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium h-12"
                        >
                          Close
                        </Button>
                      </div>
                    </>
                  )}
                </>
              ) : (
                <>
                  {/* Success State */}
                  <div className="text-center py-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full mb-6">
                      <Check className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-4">
                      You're In! 🎉
                    </h2>
                    <p className="text-lg text-slate-300 mb-2">
                      Welcome to the SyncScript beta community
                    </p>
                    <p className="text-2xl font-bold text-cyan-400 mb-6">
                      You're Beta Tester #{memberNumber}
                    </p>
                    
                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6 text-left">
                      <p className="text-slate-300 mb-4">
                        <strong className="text-white">What's next:</strong>
                      </p>
                      <ol className="space-y-3 text-slate-300">
                        <li className="flex items-start gap-3">
                          <span className="text-cyan-400 font-bold">1.</span>
                          <span>Check your email for welcome message</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-cyan-400 font-bold">2.</span>
                          <span>Join our Discord community (link in email)</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="text-cyan-400 font-bold">3.</span>
                          <span>We'll send your beta access link within 48 hours</span>
                        </li>
                      </ol>
                    </div>

                    <Button
                      onClick={onClose}
                      className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-white font-medium h-12"
                    >
                      Got it!
                    </Button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
