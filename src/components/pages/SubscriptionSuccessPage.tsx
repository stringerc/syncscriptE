/**
 * Subscription Success Page
 * 
 * Displays after successful Stripe Checkout completion.
 * Shows trial information and next steps.
 */

import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { CheckCircle, Calendar, CreditCard, Zap, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { useStripe } from '../../hooks/useStripe';

interface SubscriptionSuccessPageProps {
  userId: string;
  onContinue?: () => void;
}

export function SubscriptionSuccessPage({ userId, onContinue }: SubscriptionSuccessPageProps) {
  const { subscription, loading } = useStripe(userId);
  const [trialDaysLeft, setTrialDaysLeft] = useState(14);

  useEffect(() => {
    if (subscription?.trial_end) {
      const now = Date.now();
      const trialEnd = subscription.trial_end * 1000; // Convert to ms
      const daysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
      setTrialDaysLeft(Math.max(0, daysLeft));
    }
  }, [subscription]);

  const nextSteps = [
    {
      icon: Zap,
      title: 'Start Creating Tasks',
      description: 'Begin organizing your workflow with unlimited task creation',
      action: 'Go to Dashboard'
    },
    {
      icon: Calendar,
      title: 'Connect Your Calendar',
      description: 'Sync with Google Calendar or Outlook for seamless planning',
      action: 'Connect Calendar'
    },
    {
      icon: Sparkles,
      title: 'Invite Your Team',
      description: 'Collaborate with team members and boost productivity together',
      action: 'Invite Team'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#1a1a2e] to-[#0a0a1a] flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Success Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.6 }}
          className="mb-8 flex justify-center"
        >
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-green-500/20" />
            <CheckCircle className="h-24 w-24 text-green-400" />
          </div>
        </motion.div>

        {/* Success Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 text-center"
        >
          <h1 className="mb-4 text-4xl font-bold text-white">
            Welcome to SyncScript! 🎉
          </h1>
          <p className="text-lg text-gray-300">
            Your subscription is now active. Let's get you started!
          </p>
        </motion.div>

        {/* Trial Info Card */}
        {subscription?.trial_end && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Calendar className="h-5 w-5 text-purple-400" />
                  Your Free Trial
                </CardTitle>
                <CardDescription className="text-gray-300">
                  {trialDaysLeft} days remaining
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-300">
                  <p>
                    ✨ You have <strong className="text-white">{trialDaysLeft} days</strong> of full access to all features
                  </p>
                  <p>
                    💳 Your first payment will be on{' '}
                    <strong className="text-white">
                      {new Date(subscription.trial_end * 1000).toLocaleDateString()}
                    </strong>
                  </p>
                  <p>
                    🔄 Cancel anytime before the trial ends with no charge
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <h2 className="mb-4 text-2xl font-bold text-white">
            Get Started in 3 Steps
          </h2>
          
          <div className="grid gap-4 md:grid-cols-3">
            {nextSteps.map((step, index) => {
              const Icon = step.icon;
              
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                >
                  <Card className="border-white/10 bg-gradient-to-br from-[#1a1a2e]/60 to-[#16213e]/60 backdrop-blur-xl hover:border-purple-500/30 transition-colors">
                    <CardHeader>
                      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500">
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <CardTitle className="text-lg text-white">
                        {step.title}
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        {step.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button variant="ghost" className="w-full text-purple-400 hover:text-purple-300">
                        {step.action}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <Button
            onClick={onContinue || (() => window.location.href = '/dashboard')}
            size="lg"
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 transition-opacity"
          >
            Continue to Dashboard
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>

        {/* Support Note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-center text-sm text-gray-400"
        >
          Need help? Contact us at{' '}
          <a href="mailto:support@syncscript.app" className="text-purple-400 hover:text-purple-300">
            support@syncscript.app
          </a>
        </motion.p>
      </div>
    </div>
  );
}
