/**
 * BillingModal Component
 * 
 * Shows upgrade options when users hit plan limits.
 */

import { Check, X, Zap, Users, Building2, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';

export type LimitType = 'files' | 'links' | 'tasks' | 'goals' | 'teams' | 'integrations' | 'storage' | 'members';

interface BillingModalProps {
  open: boolean;
  onClose: () => void;
  limitType: LimitType;
  currentCount?: number;
  limitCount?: number;
}

const limitMessages: Record<LimitType, { title: string; description: string }> = {
  files: {
    title: 'File Attachment Limit Reached',
    description: 'Upgrade to attach more files to your tasks and events',
  },
  links: {
    title: 'Link Attachment Limit Reached',
    description: 'Upgrade to add more links to your tasks and events',
  },
  tasks: {
    title: 'Task Limit Reached',
    description: 'Upgrade to create unlimited tasks',
  },
  goals: {
    title: 'Goal Limit Reached',
    description: 'Upgrade to create unlimited goals',
  },
  teams: {
    title: 'Team Limit Reached',
    description: 'Upgrade to create more teams and collaborate with more people',
  },
  integrations: {
    title: 'Integration Limit Reached',
    description: 'Upgrade to connect more productivity tools',
  },
  storage: {
    title: 'Storage Limit Reached',
    description: 'Upgrade to get more storage for your files',
  },
  members: {
    title: 'Team Member Limit Reached',
    description: 'Upgrade to add more team members',
  },
};

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: [
      '50 tasks per month',
      '10 goals',
      '3 file attachments per item',
      '2 integrations',
      '100 MB storage',
      'Basic energy tracking',
    ],
    current: true,
    cta: 'Current Plan',
    gradient: 'from-gray-600 to-gray-700',
  },
  {
    name: 'Pro',
    price: '$12',
    period: 'per month',
    features: [
      'Unlimited tasks',
      'Unlimited goals',
      '10 file attachments per item',
      '10 integrations',
      '10 GB storage',
      'Advanced energy & resonance',
      'AI-powered insights',
      'Priority support',
    ],
    recommended: true,
    cta: 'Upgrade to Pro',
    gradient: 'from-teal-600 to-blue-600',
    icon: Zap,
  },
  {
    name: 'Team',
    price: '$29',
    period: 'per month',
    features: [
      'Everything in Pro',
      'Up to 10 team members',
      'Unlimited file attachments',
      'Unlimited integrations',
      '100 GB shared storage',
      'Team analytics',
      'Advanced permissions',
      'Team resonance tuning',
    ],
    cta: 'Upgrade to Team',
    gradient: 'from-purple-600 to-pink-600',
    icon: Users,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: 'contact us',
    features: [
      'Everything in Team',
      'Unlimited team members',
      'Unlimited storage',
      'Custom integrations',
      'SSO & advanced security',
      'Dedicated support',
      'SLA guarantee',
      'Custom training',
    ],
    cta: 'Contact Sales',
    gradient: 'from-orange-600 to-red-600',
    icon: Building2,
  },
];

export function BillingModal({ 
  open, 
  onClose, 
  limitType,
  currentCount,
  limitCount,
}: BillingModalProps) {
  const limitInfo = limitMessages[limitType];

  const handleUpgrade = (planName: string) => {
    toast.success(`Upgrading to ${planName}`, {
      description: 'Redirecting to checkout...',
    });
    // In production, this would redirect to Stripe/payment processor
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-[#1e2128] border-gray-800 max-w-5xl">
        <DialogHeader>
          <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-br from-orange-600 to-red-600 rounded-full flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-center text-white text-2xl">
            {limitInfo.title}
          </DialogTitle>
          <DialogDescription className="text-center text-gray-400 text-base">
            {limitInfo.description}
          </DialogDescription>
          {currentCount !== undefined && limitCount !== undefined && (
            <div className="text-center mt-2">
              <Badge variant="outline" className="bg-orange-600/20 border-orange-600/50 text-orange-300">
                {currentCount} / {limitCount} used
              </Badge>
            </div>
          )}
        </DialogHeader>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            
            return (
              <div
                key={plan.name}
                className={`relative p-5 rounded-xl border ${
                  plan.recommended
                    ? 'border-teal-600 bg-teal-600/5'
                    : 'border-gray-700 bg-[#252830]'
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-teal-600 to-blue-600 text-white border-0">
                      Recommended
                    </Badge>
                  </div>
                )}

                <div className="text-center mb-4">
                  {Icon && (
                    <div className={`mx-auto mb-3 w-12 h-12 bg-gradient-to-br ${plan.gradient} rounded-lg flex items-center justify-center`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  )}
                  <h3 className="text-white text-xl font-semibold mb-1">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-2xl font-bold text-white">
                      {plan.price}
                    </span>
                    <span className="text-sm text-gray-400">
                      /{plan.period}
                    </span>
                  </div>
                </div>

                <ul className="space-y-2 mb-5">
                  {plan.features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-2 text-sm text-gray-300"
                    >
                      <Check className="w-4 h-4 text-teal-400 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`w-full ${
                    plan.current
                      ? 'bg-gray-600 cursor-not-allowed'
                      : `bg-gradient-to-r ${plan.gradient} hover:opacity-90`
                  }`}
                  disabled={plan.current}
                  onClick={() => handleUpgrade(plan.name)}
                >
                  {plan.cta}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            All plans include a 14-day free trial. Cancel anytime.
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Need help choosing? <a href="#" className="text-teal-400 hover:underline">Contact our team</a>
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
