import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, User, Chrome, Loader2, AlertCircle, Check, ArrowLeft, PartyPopper, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Alert, AlertDescription } from '../ui/alert';
import imgImageSyncScriptLogo from "figma:asset/914d5787f554946c037cbfbb2cf65fcc0de06278.png";

export function SignupPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signUp, signInWithGoogle, signInWithMicrosoft } = useAuth();

  const isCheckoutSuccess = searchParams.get('checkout') === 'success';
  const sessionId = searchParams.get('session_id');
  const checkoutEmail = searchParams.get('email') || '';

  const [name, setName] = useState('');
  const [email, setEmail] = useState(checkoutEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Password strength indicators
  const passwordLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!passwordLength || !hasNumber) {
      setError('Password must be at least 8 characters and contain a number');
      return;
    }

    setLoading(true);

    try {
      const result = await signUp(email, password, name);
      
      if (result.success) {
        // ✅ WORLD-CLASS UX: Show value immediately, skip multi-step wizard
        navigate('/dashboard');
      } else {
        setError(result.error || 'Sign up failed');
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError('');
    setLoading(true);

    try {
      const result = await signInWithGoogle();
      
      if (!result.success) {
        setError(result.error || 'Google sign in failed');
        setLoading(false);
      }
      // OAuth will redirect, so we don't stop loading
    } catch (err) {
      setError('Google sign in failed');
      setLoading(false);
    }
  }

  async function handleMicrosoftSignIn() {
    setError('');
    setLoading(true);

    try {
      const result = await signInWithMicrosoft();
      
      if (!result.success) {
        setError(result.error || 'Microsoft sign in failed');
        setLoading(false);
      }
      // OAuth will redirect, so we don't stop loading
    } catch (err) {
      setError('Microsoft sign in failed');
      setLoading(false);
    }
  }

  if (isCheckoutSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f1420] to-[#0a0e1a] flex items-center justify-center p-4">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-cyan-500 opacity-15 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-teal-500 opacity-15 rounded-full blur-3xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500 opacity-10 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
              className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/30 flex items-center justify-center"
            >
              <PartyPopper className="w-10 h-10 text-cyan-400" />
            </motion.div>
            <motion.img
              src={imgImageSyncScriptLogo}
              alt="SyncScript"
              className="h-10 mx-auto mb-6 opacity-60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 0.3 }}
            />
            <motion.h1
              className="text-3xl font-bold text-white mb-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              You're subscribed!
            </motion.h1>
            <motion.p
              className="text-slate-400 text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Set up your account to get started
            </motion.p>
          </div>

          <motion.div
            className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-cyan-500/20 p-8 shadow-2xl shadow-cyan-500/5"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center gap-3">
              <Check className="w-5 h-5 text-emerald-400 shrink-0" />
              <p className="text-sm text-emerald-300">Payment confirmed — your premium features are ready</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <Alert variant="destructive" className="bg-red-500/10 border-red-500/50">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                    required
                    readOnly={!!checkoutEmail}
                  />
                </div>
                {checkoutEmail && (
                  <p className="text-xs text-slate-500">Email from your purchase — this can't be changed</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Create a Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                    required
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {password && (
                  <div className="mt-2 space-y-1">
                    <div className={`flex items-center text-xs ${passwordLength ? 'text-emerald-400' : 'text-slate-500'}`}>
                      <Check className={`w-3 h-3 mr-1 ${passwordLength ? 'opacity-100' : 'opacity-30'}`} />
                      At least 8 characters
                    </div>
                    <div className={`flex items-center text-xs ${hasNumber ? 'text-emerald-400' : 'text-slate-500'}`}>
                      <Check className={`w-3 h-3 mr-1 ${hasNumber ? 'opacity-100' : 'opacity-30'}`} />
                      Contains a number
                    </div>
                  </div>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-medium h-12 text-base"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Setting up your account...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Activate my account
                  </>
                )}
              </Button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-slate-900 px-2 text-slate-500">Or sign up with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                variant="outline"
                className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-800 hover:border-slate-600"
              >
                <Chrome className="w-4 h-4 mr-2" />
                Google
              </Button>
              <Button
                type="button"
                onClick={handleMicrosoftSignIn}
                disabled={loading}
                variant="outline"
                className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-800 hover:border-slate-600"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z" />
                </svg>
                Microsoft
              </Button>
            </div>

            <p className="text-xs text-slate-500 text-center mt-5">
              By creating your account, you agree to our{' '}
              <a href="/terms" className="text-cyan-400/70 hover:text-cyan-300">Terms</a>{' '}and{' '}
              <a href="/privacy" className="text-cyan-400/70 hover:text-cyan-300">Privacy Policy</a>
            </p>
          </motion.div>

          <motion.div
            className="mt-6 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <p className="text-xs text-slate-500">
              Already have an account?{' '}
              <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium">Sign in</Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0e1a] via-[#0f1420] to-[#0a0e1a] flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500 opacity-15 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500 opacity-15 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <motion.button
          onClick={() => navigate('/')}
          className="group flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm font-medium"
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to SyncScript</span>
        </motion.button>

        <div className="text-center mb-8">
          <motion.img
            src={imgImageSyncScriptLogo}
            alt="SyncScript - Return to homepage"
            className="h-12 mx-auto mb-4 cursor-pointer transition-transform hover:scale-110"
            onClick={() => navigate('/')}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            title="Return to SyncScript homepage"
          />
          <h1 className="text-3xl font-bold text-white mb-2">Create your account</h1>
          <p className="text-slate-400">Start optimizing your productivity today</p>
        </div>

        {/* Signup Card */}
        <motion.div
          className="bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-800 p-8 shadow-2xl"
          initial={{ scale: 0.95 }}
          animate={{ scale: 1 }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Alert */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Alert variant="destructive" className="bg-red-500/10 border-red-500/50">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Name Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                  required
                />
              </div>
            </div>

            {/* Email Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Password Requirements */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className={`flex items-center text-xs ${passwordLength ? 'text-green-400' : 'text-slate-500'}`}>
                    <Check className={`w-3 h-3 mr-1 ${passwordLength ? 'opacity-100' : 'opacity-30'}`} />
                    At least 8 characters
                  </div>
                  <div className={`flex items-center text-xs ${hasNumber ? 'text-green-400' : 'text-slate-500'}`}>
                    <Check className={`w-3 h-3 mr-1 ${hasNumber ? 'opacity-100' : 'opacity-30'}`} />
                    Contains a number
                  </div>
                  <div className={`flex items-center text-xs ${hasSpecial ? 'text-green-400' : 'text-slate-500'}`}>
                    <Check className={`w-3 h-3 mr-1 ${hasSpecial ? 'opacity-100' : 'opacity-30'}`} />
                    Contains special character (recommended)
                  </div>
                </div>
              )}
            </div>

            {/* Sign Up Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-medium h-11"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create account'
              )}
            </Button>

            {/* Terms */}
            <p className="text-xs text-slate-500 text-center">
              By signing up, you agree to our{' '}
              <a href="/terms" className="text-cyan-400/70 hover:text-cyan-300">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-cyan-400/70 hover:text-cyan-300">
                Privacy Policy
              </a>
            </p>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900 px-2 text-slate-400">Or continue with</span>
            </div>
          </div>

          {/* OAuth Buttons */}
          <div className="space-y-3">
            <Button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              variant="outline"
              className="w-full bg-slate-800/50 border-slate-700 text-white hover:bg-slate-800 hover:border-slate-600"
            >
              <Chrome className="w-5 h-5 mr-2" />
              Continue with Google
            </Button>

            <Button
              type="button"
              onClick={handleMicrosoftSignIn}
              disabled={loading}
              variant="outline"
              className="w-full bg-slate-800/50 border-slate-700 text-white hover:bg-slate-800 hover:border-slate-600"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zm12.6 0H12.6V0H24v11.4z" />
              </svg>
              Continue with Microsoft
            </Button>
          </div>

          {/* Make.com Info */}
          <div className="mt-4 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
            <p className="text-xs text-cyan-300 text-center">
              OAuth powered by Make.com for seamless integration
            </p>
          </div>

          {/* Sign In Link */}
          <div className="mt-6 text-center text-sm">
            <span className="text-slate-400">Already have an account? </span>
            <Link
              to="/login"
              className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
            >
              Sign in
            </Link>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-slate-500">
          <p>Protected by bank-level encryption</p>
          <p className="mt-1">SOC 2 Type II Certified</p>
        </div>
      </motion.div>
    </div>
  );
}