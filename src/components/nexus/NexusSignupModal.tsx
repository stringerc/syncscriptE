import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router';

interface NexusSignupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Signup modal that Nexus can surface during a voice/text conversation.
 * Minimized friction: Google OAuth as primary (one tap), email as secondary.
 * Designed to feel like a continuation of the Nexus conversation, not an interruption.
 */
export function NexusSignupModal({ isOpen, onClose }: NexusSignupModalProps) {
  const { signInWithGoogle, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'choose' | 'email'>('choose');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGoogleSignup() {
    setLoading(true);
    setError('');
    const result = await signInWithGoogle();
    if (!result.success) {
      setError(result.error || 'Google sign-in failed. Try email instead.');
      setLoading(false);
    }
    // On success, Supabase redirects to /auth/callback then /dashboard
  }

  async function handleEmailSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password || !name) return;
    setLoading(true);
    setError('');
    const result = await signUp(email, password, name);
    if (result.success) {
      navigate('/onboarding');
      onClose();
    } else {
      setError(result.error || 'Sign up failed. Please try again.');
    }
    setLoading(false);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
          >
            <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-gradient-to-b from-[#0f1620] to-[#0a0e18] shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Join SyncScript</p>
                    <p className="text-[10px] text-white/40">Free to start — no credit card</p>
                  </div>
                </div>
                <button onClick={onClose} className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors">
                  <X className="w-4 h-4 text-white/50" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5">
                {error && (
                  <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-300">
                    {error}
                  </div>
                )}

                {mode === 'choose' ? (
                  <div className="space-y-3">
                    {/* Google OAuth — primary, lowest friction */}
                    <button
                      onClick={handleGoogleSignup}
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 text-gray-900 px-4 py-3 rounded-xl font-medium text-sm transition-all disabled:opacity-50 shadow-sm"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                      )}
                      Continue with Google
                    </button>

                    {/* Divider */}
                    <div className="flex items-center gap-3 text-[10px] text-white/20">
                      <div className="flex-1 h-px bg-white/[0.06]" />
                      or
                      <div className="flex-1 h-px bg-white/[0.06]" />
                    </div>

                    {/* Email signup link */}
                    <button
                      onClick={() => setMode('email')}
                      className="w-full flex items-center justify-center gap-2 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-indigo-500/30 text-white px-4 py-3 rounded-xl font-medium text-sm transition-all"
                    >
                      <Mail className="w-4 h-4 text-white/50" />
                      Sign up with email
                    </button>

                    {/* Terms */}
                    <p className="text-center text-[10px] text-white/25 leading-relaxed pt-1">
                      By signing up you agree to our{' '}
                      <a href="/terms" className="underline hover:text-white/40">Terms</a> and{' '}
                      <a href="/privacy" className="underline hover:text-white/40">Privacy Policy</a>
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleEmailSignup} className="space-y-3">
                    <div>
                      <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1">Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your name"
                          required
                          className="w-full bg-white/[0.04] border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-indigo-500/40 transition-colors"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          required
                          className="w-full bg-white/[0.04] border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-indigo-500/40 transition-colors"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] text-white/40 uppercase tracking-wider mb-1">Password</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="6+ characters"
                          required
                          minLength={6}
                          className="w-full bg-white/[0.04] border border-white/10 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-indigo-500/40 transition-colors"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-4 py-3 rounded-xl font-medium text-sm transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          Create Account
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setMode('choose')}
                      className="w-full text-center text-xs text-white/30 hover:text-white/50 transition-colors"
                    >
                      ← Back
                    </button>
                  </form>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
