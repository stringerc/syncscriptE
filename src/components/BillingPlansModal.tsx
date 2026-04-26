import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Check, Zap, Users, Building2, Crown, ArrowRight,
  Shield, Headphones, Cloud, TrendingUp, Lock
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useUserProfile } from '../utils/user-profile';
import { useAuth } from '../contexts/AuthContext';
import { useStripe } from '../hooks/useStripe';
import { toast } from 'sonner@2.0.3';
import { PLANS, formatPrice } from '../config/pricing';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface BillingPlansModalProps {
  open: boolean;
  onClose: () => void;
}

const PLAN_ICONS: Record<string, typeof Zap> = {
  free: Zap,
  starter: Crown,
  professional: Crown,
  enterprise: Building2,
};

const STRIPE_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-57781ad9/stripe`;

export function BillingPlansModal({ open, onClose }: BillingPlansModalProps) {
  const { profile } = useUserProfile();
  const { user } = useAuth();
  const { subscription, openCustomerPortal } = useStripe(user?.id);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [busy, setBusy] = useState(false);

  /**
   * Tier 0 B fix: previously this called `updateProfile({ plan })` — a local
   * profile write that didn't touch Stripe. Now it routes plan changes through
   * the appropriate path:
   *   - User has an active Stripe subscription → Customer Portal (proration,
   *     cancellation, plan switching, payment-method updates all live there).
   *   - User has no subscription → Stripe Checkout flow.
   *
   * This is what Stripe / Linear / Vercel actually do. The Edge function side
   * was already implemented correctly; we just stopped lying to users about it.
   */
  const handleSelectPlan = async (planId: string) => {
    if (planId === 'enterprise') {
      toast.info('Enterprise Plan', {
        description: 'Contact our sales team for enterprise pricing.',
      });
      return;
    }
    if (planId === profile.plan) {
      toast.info('Current Plan', { description: `You're already on the ${planId} plan` });
      return;
    }
    if (!user?.id) {
      toast.error('Sign in required to change plans');
      return;
    }

    setBusy(true);
    try {
      // Existing subscriber → portal (handles upgrade/downgrade with proration)
      if (subscription?.status && ['active', 'trialing', 'past_due'].includes(subscription.status)) {
        await openCustomerPortal();
        // Customer Portal navigates the browser away; no further action.
        return;
      }

      // New subscriber → Stripe Checkout
      const res = await fetch(`${STRIPE_BASE}/create-checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({
          plan_id: planId,
          user_id: user.id,
          email: user.email,
          interval: billingCycle === 'yearly' ? 'year' : 'month',
          success_url: `${window.location.origin}/settings?tab=billing&checkout=success&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/settings?tab=billing`,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error || 'Could not start checkout');
      }
      const { url } = (await res.json()) as { url: string };
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('Checkout returned no URL');
      }
    } catch (err) {
      toast.error('Plan change failed', {
        description: err instanceof Error ? err.message : 'Try again in a moment.',
      });
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-[#1e2128] border border-gray-800 rounded-2xl w-full max-w-6xl my-8"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative px-6 py-8 border-b border-gray-800 bg-gradient-to-br from-purple-600/10 to-pink-600/10">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
            
            <div className="text-center">
              <h2 className="text-3xl text-white mb-2">Choose Your Plan</h2>
              <p className="text-gray-400 mb-4">
                Unlock the full potential of SyncScript
              </p>
              
              {/* Billing Cycle Toggle */}
              <div className="inline-flex items-center gap-2 bg-gray-800/50 p-1 rounded-lg">
                <button
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    billingCycle === 'monthly'
                      ? 'bg-teal-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-4 py-2 rounded-md transition-colors ${
                    billingCycle === 'yearly'
                      ? 'bg-teal-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Yearly
                  <Badge variant="outline" className="ml-2 border-green-500/50 text-green-400 text-xs">
                    Save 20%
                  </Badge>
                </button>
              </div>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 p-6">
            {PLANS.map((plan, index) => {
              const Icon = PLAN_ICONS[plan.id] || Zap;
              const isCurrentPlan = plan.id === profile.plan;
              const displayPrice = formatPrice(plan, billingCycle === 'yearly');
              
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`relative bg-[#252830] border rounded-xl p-6 flex flex-col ${
                    plan.popular
                      ? 'border-purple-600/50 shadow-lg shadow-purple-600/20'
                      : 'border-gray-700'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <div className="mb-4">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-3`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl text-white mb-1">{plan.name}</h3>
                    <p className="text-xs text-gray-400 mb-4">{plan.subtitle}</p>
                    <div className="mb-2">
                      <span className="text-3xl font-bold text-white">{displayPrice}</span>
                      {plan.price !== 0 && (
                        <span className="text-gray-400 text-sm ml-1">/{plan.period}</span>
                      )}
                    </div>
                    {plan.price === 0 && <p className="text-xs text-gray-500">Free forever</p>}
                    {billingCycle === 'yearly' && plan.priceAnnual && (
                      <p className="text-xs text-green-400">Save ~20% with annual billing</p>
                    )}
                  </div>

                  <div className="flex-1 space-y-3 mb-6">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-2">
                        {feature.included ? (
                          <Check className="w-4 h-4 text-teal-400 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-4 h-4 text-gray-600 flex-shrink-0 mt-0.5" />
                        )}
                        <span className={`text-sm ${feature.included ? 'text-gray-300' : 'text-gray-600'}`}>
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={isCurrentPlan || busy}
                    className={`w-full ${
                      plan.popular
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500'
                        : isCurrentPlan
                        ? 'bg-gray-700 cursor-not-allowed'
                        : 'bg-teal-600 hover:bg-teal-500'
                    }`}
                  >
                    {isCurrentPlan ? (
                      <>
                        <Check className="w-4 h-4 mr-2" />
                        Current Plan
                      </>
                    ) : busy ? (
                      <>Redirecting…</>
                    ) : (
                      <>
                        {plan.cta}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </motion.div>
              );
            })}
          </div>

          {/* Trust Signals */}
          <div className="border-t border-gray-800 px-6 py-4 bg-[#1a1c20]">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="flex flex-col items-center gap-2">
                <Shield className="w-5 h-5 text-teal-400" />
                <p className="text-xs text-gray-400">Secure Payments</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Headphones className="w-5 h-5 text-purple-400" />
                <p className="text-xs text-gray-400">24/7 Support</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Cloud className="w-5 h-5 text-blue-400" />
                <p className="text-xs text-gray-400">Cloud Sync</p>
              </div>
              <div className="flex flex-col items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <p className="text-xs text-gray-400">Cancel Anytime</p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}