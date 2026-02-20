/**
 * PaywallGate
 * 
 * Wraps protected content with soft gating for free users.
 * Free users see the app with upgrade banners. Hard paywall only
 * when access is fully revoked (e.g. expired trial, no free tier).
 * 
 * All trials go through Stripe Checkout with credit card collection.
 * Stripe automatically charges the card when the 14-day trial ends.
 */

import { useState, ReactNode } from 'react';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router';
import { Loader2, Lock, Zap, Check, Clock, Crown, Shield, Sparkles, ArrowUp, Home, Phone, Mic } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';
import { PLANS, getPlanById, PLAN_IDS, formatPrice } from '../config/pricing';

interface PaywallGateProps {
  children: ReactNode;
}

export function PaywallGate({ children }: PaywallGateProps) {
  const { access, loading, createCheckout } = useSubscription();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Checking access...</p>
        </div>
      </div>
    );
  }

  if (access.hasAccess) {
    return (
      <>
        {/* Reverse Trial banner — full Professional access, countdown */}
        {access.accessType === 'reverse_trial' && access.daysRemaining !== undefined && (
          <div className={`border-b px-4 py-2 flex items-center justify-center gap-3 text-sm ${
            access.daysRemaining <= 3
              ? 'bg-gradient-to-r from-red-500/20 to-orange-500/20 border-red-500/30'
              : access.daysRemaining <= 7
              ? 'bg-gradient-to-r from-amber-500/15 to-orange-500/15 border-amber-500/20'
              : 'bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-indigo-500/20'
          }`}>
            {access.daysRemaining <= 3 ? (
              <Clock className="w-4 h-4 text-red-400" />
            ) : (
              <Sparkles className="w-4 h-4 text-indigo-400" />
            )}
            <span className={access.daysRemaining <= 3 ? 'text-red-200' : 'text-indigo-200'}>
              {access.daysRemaining > 0
                ? `Professional trial — ${access.daysRemaining} day${access.daysRemaining === 1 ? '' : 's'} left with full access`
                : 'Your Professional trial has ended'}
            </span>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className={`font-semibold underline underline-offset-2 flex items-center gap-1 ${
                access.daysRemaining <= 3 ? 'text-red-300 hover:text-red-200' : 'text-indigo-400 hover:text-indigo-300'
              }`}
            >
              <ArrowUp className="w-3.5 h-3.5" />
              {access.daysRemaining <= 3 ? 'Keep all features' : 'Upgrade now'}
            </button>
          </div>
        )}

        {/* Lite free tier banner — post-trial downgrade */}
        {access.accessType === 'free_lite' && (
          <div className="bg-gradient-to-r from-orange-500/15 to-red-500/15 border-b border-orange-500/20 px-4 py-2 flex items-center justify-center gap-3 text-sm">
            <Zap className="w-4 h-4 text-orange-400" />
            <span className="text-orange-200 font-medium">
              Lite plan active — You're at 4/5 tasks today (80% quota used)
            </span>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="text-orange-400 hover:text-orange-300 font-semibold underline underline-offset-2 flex items-center gap-1 bg-orange-500/10 hover:bg-orange-500/20 px-3 py-1 rounded-lg transition-all"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              Get unlimited for <strong>$19/month</strong>
            </button>
          </div>
        )}

        {/* Legacy free tier upgrade banner */}
        {access.accessType === 'free' && (
          <div className="bg-gradient-to-r from-indigo-500/15 to-purple-500/15 border-b border-indigo-500/20 px-4 py-2 flex items-center justify-center gap-3 text-sm">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-indigo-200">
              Free plan — limited features
            </span>
            <button
              onClick={() => setShowUpgradeModal(true)}
              className="text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-2 flex items-center gap-1"
            >
              <ArrowUp className="w-3.5 h-3.5" />
              Upgrade for unlimited
            </button>
          </div>
        )}

        {/* Trial countdown banner (legacy/standard trial) */}
        {(access.accessType === 'free_trial' || access.accessType === 'trial') && access.daysRemaining !== undefined && access.daysRemaining <= 7 && (
          <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-b border-amber-500/30 px-4 py-2 flex items-center justify-center gap-3 text-sm">
            <Clock className="w-4 h-4 text-amber-400" />
            <span className="text-amber-200">
              {access.daysRemaining > 0
                ? `Free trial ends in ${access.daysRemaining} day${access.daysRemaining === 1 ? '' : 's'}`
                : 'Your free trial has ended'}
            </span>
            <button
              onClick={async () => {
                const url = await createCheckout('starter');
                if (url) window.location.href = url;
              }}
              className="text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2"
            >
              Upgrade now
            </button>
          </div>
        )}

        {/* Beta access banner */}
        {access.accessType === 'beta' && (
          <div className="bg-gradient-to-r from-cyan-500/10 to-teal-500/10 border-b border-cyan-500/20 px-4 py-1.5 flex items-center justify-center gap-2 text-xs">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-cyan-300">Beta Tester #{access.memberNumber} — Full access + lifetime 50% off at launch</span>
          </div>
        )}

        {children}

        {/* Upgrade Modal Overlay */}
        {showUpgradeModal && <UpgradeModal onClose={() => setShowUpgradeModal(false)} />}
      </>
    );
  }

  // No access at all — show paywall
  return <PaywallScreen />;
}

function UpgradeModal({ onClose }: { onClose: () => void }) {
  const { createCheckout } = useSubscription();
  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null);

  const handleCheckout = async (planId: string) => {
    setIsCheckingOut(planId);
    toast.loading('Preparing checkout...');
    const url = await createCheckout(planId);
    if (url) {
      window.location.href = url;
    } else {
      toast.dismiss();
      toast.error('Could not create checkout. Please try again.');
      setIsCheckingOut(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Crown className="w-6 h-6 text-amber-400" />
            Upgrade Your Plan
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl">&times;</button>
        </div>

        {/* Free Trial CTA — goes through Stripe Checkout with card collection */}
        <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-xl p-5 mb-6 text-center">
          <p className="text-white font-semibold mb-1">Try everything free for 14 days</p>
          <p className="text-slate-300 text-sm mb-3">Credit card required. You won't be charged until the trial ends. Cancel anytime.</p>
          <Button
            onClick={() => handleCheckout('professional')}
            disabled={isCheckingOut === 'professional'}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold px-6 h-10"
          >
            {isCheckingOut === 'professional' ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Redirecting...</> : 'Start 14-Day Free Trial'}
          </Button>
        </div>

        {/* Plan Cards */}
        <div className="grid sm:grid-cols-3 gap-3 mb-4">
          {PLANS.filter(p => p.id !== PLAN_IDS.FREE).map((plan) => (
            <div key={plan.id} className={`rounded-lg p-4 relative ${
              plan.popular 
                ? 'bg-gradient-to-b from-indigo-500/10 to-purple-500/10 border-2 border-indigo-500/50'
                : 'bg-slate-800/50 border border-slate-700'
            }`}>
              {plan.popular && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">POPULAR</div>
              )}
              <h3 className="font-bold text-white">{plan.name}</h3>
              <p className="text-2xl font-bold text-white mt-1">{formatPrice(plan)}<span className="text-sm text-slate-400 font-normal">/mo</span></p>
              <ul className="text-xs text-slate-200 space-y-1 mt-3 mb-4">
                {plan.features.filter(f => f.included).slice(0, 4).map((f) => (
                  <li key={f.text} className="flex items-center gap-1.5">
                    {f.highlight ? (
                      <Mic className="w-3 h-3 text-purple-400 shrink-0" />
                    ) : (
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                    )}
                    <span className={f.highlight ? 'text-purple-300 font-medium' : ''}>{f.text}</span>
                  </li>
                ))}
              </ul>
              <Button 
                onClick={() => handleCheckout(plan.id)} 
                disabled={!!isCheckingOut} 
                variant={plan.popular ? 'default' : 'outline'} 
                size="sm" 
                className={`w-full text-xs font-medium ${
                  plan.popular 
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white' 
                    : 'border-slate-500 text-white hover:bg-white/10'
                }`}
              >
                {isCheckingOut === plan.id ? <Loader2 className="w-3 h-3 animate-spin" /> : plan.cta}
              </Button>
            </div>
          ))}
        </div>

        <p className="text-center text-slate-400 text-xs">All plans include a 14-day free trial with credit card. Cancel anytime before trial ends.</p>
      </div>
    </div>
  );
}

function PaywallScreen() {
  const { redeemBetaCode, createCheckout } = useSubscription();
  const { user } = useAuth();
  const [betaCode, setBetaCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null);
  const [showBetaInput, setShowBetaInput] = useState(false);

  const handleRedeemCode = async () => {
    if (!betaCode.trim()) return;
    setIsRedeeming(true);
    const result = await redeemBetaCode(betaCode);
    setIsRedeeming(false);

    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
    }
  };

  const handleCheckout = async (planId: string) => {
    if (!user?.id) {
      toast.error('Please sign in first to start your trial.', {
        action: { label: 'Sign In', onClick: () => window.location.href = '/login' },
      });
      return;
    }
    setIsCheckingOut(planId);
    toast.loading('Preparing secure checkout...');
    const url = await createCheckout(planId);
    toast.dismiss();
    if (url) {
      window.location.href = url;
    } else {
      toast.error('Could not create checkout session. Please try again or contact support.');
      setIsCheckingOut(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col">
      {/* Top navigation bar — escape route */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <a href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">SyncScript</span>
        </a>
        <a
          href="/"
          className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </a>
      </nav>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="max-w-4xl w-full">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-3">Try Everything Free for 14 Days</h1>
            <p className="text-slate-300 text-lg max-w-lg mx-auto">
              Get full Professional access — AI insights, voice calls, scripts marketplace, and more.
              No credit card needed to start. Downgrade to free Lite plan anytime.
            </p>
          </div>

          {/* Reverse Trial CTA — instant full access, no card required */}
          <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-2xl p-6 mb-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span className="text-lg font-semibold text-white">Start Your 14-Day Professional Trial</span>
            </div>
            <p className="text-slate-200 mb-1">Full access to all features — AI, voice calls, scripts, everything.</p>
            <p className="text-slate-400 text-sm mb-4">No credit card required. After 14 days, you'll keep a free Lite plan forever.</p>
            <Button
              onClick={() => {
                if (!user?.id) {
                  toast.info('Create a free account to start your trial.', {
                    action: { label: 'Sign Up', onClick: () => window.location.href = '/signup' },
                  });
                  return;
                }
                handleCheckout('professional');
              }}
              disabled={isCheckingOut === 'professional'}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold px-8 h-12 text-base"
            >
              {isCheckingOut === 'professional' ? (
                <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Starting trial...</>
              ) : (
                'Start Free — No Credit Card'
              )}
            </Button>
          </div>

          {/* Or pick a plan with credit card for guaranteed access */}
          <p className="text-center text-slate-400 text-sm mb-4">Or pick a paid plan to lock in your rate:</p>

          {/* Pricing Plans */}
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {/* Starter */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-1">Starter</h3>
              <div className="flex items-end gap-1 mb-4">
                <span className="text-3xl font-bold text-white">$19</span>
                <span className="text-slate-400 mb-1">/mo</span>
              </div>
              <ul className="space-y-2.5 mb-6 text-sm text-white">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" />50 tasks/month</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" />Basic calendar sync</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" />Email support</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" />2 team members</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" />Basic analytics</li>
              </ul>
              <Button
                onClick={() => handleCheckout('starter')}
                disabled={!!isCheckingOut}
                variant="outline"
                className="w-full border-slate-500 text-white hover:bg-white/10 hover:border-slate-400 font-semibold"
              >
                {isCheckingOut === 'starter' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Get Started'}
              </Button>
            </div>

            {/* Professional — MOST POPULAR */}
            <div className="bg-gradient-to-b from-indigo-500/10 to-purple-500/10 border-2 border-indigo-500/50 rounded-xl p-6 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                MOST POPULAR
              </div>
              <h3 className="text-lg font-bold text-white mb-1">Professional</h3>
              <div className="flex items-end gap-1 mb-2">
                <span className="text-3xl font-bold text-white">$39</span>
                <span className="text-slate-400 mb-1">/mo</span>
              </div>
              <p className="text-xs text-green-400 font-medium mb-2">Save $240/year vs monthly</p>
              <ul className="space-y-2.5 mb-6 text-sm text-white">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" />Unlimited tasks & AI insights</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" />40% productivity boost guaranteed</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" />Priority support & onboarding</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" />8+ hours saved weekly</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" />10 team member seats</li>
                <li className="flex items-center gap-2 bg-purple-500/15 -mx-2 px-2 py-1 rounded-lg border border-purple-500/20">
                  <Mic className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="font-semibold text-purple-200">Voice AI Assistant</span>
                </li>
              </ul>
              <Button
                onClick={() => handleCheckout('professional')}
                disabled={!!isCheckingOut}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold"
              >
                {isCheckingOut === 'professional' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Get Professional'}
              </Button>
            </div>

            {/* Enterprise */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-1">Enterprise</h3>
              <div className="flex items-end gap-1 mb-4">
                <span className="text-3xl font-bold text-white">$99</span>
                <span className="text-slate-400 mb-1">/mo</span>
              </div>
              <ul className="space-y-2.5 mb-6 text-sm text-white">
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" />Everything in Pro</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" />Unlimited team</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" />SSO/SAML</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" />Dedicated support</li>
                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-400 shrink-0" />SLA guarantee</li>
                <li className="flex items-center gap-2 bg-amber-500/10 -mx-2 px-2 py-1 rounded-lg border border-amber-500/20">
                  <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-semibold text-amber-200">Priority Voice + Phone Calls</span>
                </li>
              </ul>
              <Button
                onClick={() => handleCheckout('enterprise')}
                disabled={!!isCheckingOut}
                variant="outline"
                className="w-full border-slate-500 text-white hover:bg-white/10 hover:border-slate-400 font-semibold"
              >
                {isCheckingOut === 'enterprise' ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Contact Sales'}
              </Button>
            </div>
          </div>

          {/* Bottom info */}
          <p className="text-center text-slate-300 text-sm mb-6">
            All plans include a 14-day free trial with credit card. Cancel anytime before trial ends — no charge.
          </p>

          {/* Beta Code Section */}
          <div className="text-center">
            {!showBetaInput ? (
              <button
                onClick={() => setShowBetaInput(true)}
                className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                Have a beta code? <span className="underline">Enter it here</span>
              </button>
            ) : (
              <div className="max-w-sm mx-auto bg-slate-800/50 border border-slate-700 rounded-xl p-4">
                <p className="text-sm text-slate-200 mb-3 font-medium">Enter your beta tester code:</p>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="BETA-XXXX-XXXX"
                    value={betaCode}
                    onChange={(e) => setBetaCode(e.target.value.toUpperCase())}
                    className="bg-slate-900 border-slate-600 text-white font-mono text-center tracking-wider placeholder:text-slate-600"
                    maxLength={14}
                  />
                  <Button
                    onClick={handleRedeemCode}
                    disabled={isRedeeming || betaCode.length < 10}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white shrink-0"
                  >
                    {isRedeeming ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Redeem'}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
