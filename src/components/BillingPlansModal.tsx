import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Check, Zap, Users, Building2, Crown, ArrowRight,
  Shield, Headphones, Cloud, TrendingUp, Lock
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useUserProfile } from '../utils/user-profile';
import { toast } from 'sonner@2.0.3';

interface BillingPlansModalProps {
  open: boolean;
  onClose: () => void;
}

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: 'free' | 'pro' | 'team' | 'enterprise';
  name: string;
  subtitle: string;
  price: string;
  period: string;
  icon: typeof Zap;
  color: string;
  popular?: boolean;
  comingSoon?: boolean;
  features: PlanFeature[];
  cta: string;
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Personal',
    subtitle: 'For individuals getting started',
    price: 'Free',
    period: 'Forever',
    icon: Zap,
    color: 'from-gray-600 to-gray-700',
    cta: 'Current Plan',
    features: [
      { text: 'Up to 50 tasks', included: true },
      { text: 'Basic calendar integration', included: true },
      { text: 'Energy & focus tracking', included: true },
      { text: 'Daily resonance insights', included: true },
      { text: 'Mobile app access', included: true },
      { text: 'AI assistant (limited)', included: true },
      { text: 'Advanced analytics', included: false },
      { text: 'Team collaboration', included: false },
      { text: 'Custom integrations', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    subtitle: 'For power users and professionals',
    price: '$12',
    period: 'per month',
    icon: Crown,
    color: 'from-purple-600 to-pink-600',
    popular: true,
    cta: 'Upgrade to Pro',
    features: [
      { text: 'Unlimited tasks & goals', included: true },
      { text: 'Advanced calendar features', included: true },
      { text: 'Full AI assistant access', included: true },
      { text: 'Advanced analytics & insights', included: true },
      { text: 'Custom resonance tuning', included: true },
      { text: 'Priority support', included: true },
      { text: 'Scripts & templates marketplace', included: true },
      { text: 'Export & backup data', included: true },
      { text: 'Team features (up to 5)', included: true },
    ],
  },
  {
    id: 'team',
    name: 'Team',
    subtitle: 'For small teams and growing businesses',
    price: '$29',
    period: 'per user/month',
    icon: Users,
    color: 'from-teal-600 to-cyan-600',
    cta: 'Upgrade to Team',
    features: [
      { text: 'Everything in Pro', included: true },
      { text: 'Unlimited team members', included: true },
      { text: 'Team analytics dashboard', included: true },
      { text: 'Shared workspaces', included: true },
      { text: 'Team chat & collaboration', included: true },
      { text: 'Admin controls & permissions', included: true },
      { text: 'Advanced integrations', included: true },
      { text: 'Custom branding', included: true },
      { text: '24/7 priority support', included: true },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    subtitle: 'For large organizations',
    price: 'Custom',
    period: 'Contact sales',
    icon: Building2,
    color: 'from-amber-600 to-orange-600',
    comingSoon: true,
    cta: 'Contact Sales',
    features: [
      { text: 'Everything in Team', included: true },
      { text: 'Dedicated account manager', included: true },
      { text: 'Custom integrations & API', included: true },
      { text: 'SSO & advanced security', included: true },
      { text: 'On-premise deployment option', included: true },
      { text: 'SLA guarantees', included: true },
      { text: 'Custom training & onboarding', included: true },
      { text: 'Advanced compliance (SOC 2, HIPAA)', included: true },
      { text: 'Unlimited everything', included: true },
    ],
  },
];

export function BillingPlansModal({ open, onClose }: BillingPlansModalProps) {
  const { profile, updateProfile } = useUserProfile();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const handleSelectPlan = (planId: typeof profile.plan) => {
    if (planId === 'enterprise') {
      toast.info('Enterprise Plan', { 
        description: 'Coming Soon! Contact our sales team for early access.' 
      });
      return;
    }
    
    if (planId === profile.plan) {
      toast.info('Current Plan', { description: `You're already on the ${planId} plan` });
      return;
    }

    updateProfile({ plan: planId });
    toast.success('Plan updated', { 
      description: `Successfully upgraded to ${planId} plan` 
    });
    onClose();
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
              const Icon = plan.icon;
              const isCurrentPlan = plan.id === profile.plan;
              
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
                  
                  {plan.comingSoon && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge variant="outline" className="border-amber-500/50 text-amber-400">
                        Coming Soon
                      </Badge>
                    </div>
                  )}

                  {/* Plan Header */}
                  <div className="mb-4">
                    <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${plan.color} flex items-center justify-center mb-3`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-xl text-white mb-1">{plan.name}</h3>
                    <p className="text-xs text-gray-400 mb-4">{plan.subtitle}</p>
                    <div className="mb-2">
                      <span className="text-3xl font-bold text-white">{plan.price}</span>
                      {plan.period !== 'Forever' && plan.period !== 'Contact sales' && (
                        <span className="text-gray-400 text-sm ml-1">/{plan.period}</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{plan.period}</p>
                  </div>

                  {/* Features */}
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

                  {/* CTA Button */}
                  <Button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={isCurrentPlan}
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