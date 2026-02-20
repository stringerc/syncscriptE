/**
 * Billing Settings Component
 * 
 * Complete billing management dashboard for users.
 * Features:
 * - Current subscription display
 * - Usage tracking
 * - Plan upgrade/downgrade
 * - Cancel/reactivate subscription
 * - Access to Stripe Customer Portal
 * - Payment method management
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  CreditCard, Calendar, TrendingUp, AlertCircle, ExternalLink,
  CheckCircle, XCircle, RefreshCw, Zap, BarChart3, Shield
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Progress } from '../ui/progress';
import { getPlanDisplayName } from '../../config/pricing';
import { useStripe, type UsageData } from '../../hooks/useStripe';
import { toast } from 'sonner@2.0.3';

interface BillingSettingsProps {
  userId: string;
}

export function BillingSettings({ userId }: BillingSettingsProps) {
  const {
    subscription,
    loading,
    error,
    cancelSubscription,
    reactivateSubscription,
    openCustomerPortal
  } = useStripe(userId);

  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // Load usage data
  useEffect(() => {
    loadUsage();
  }, [userId]);

  const loadUsage = async () => {
    try {
      const { getUsage } = useStripe(userId);
      const data = await getUsage();
      setUsage(data);
    } catch (err) {
      console.error('Failed to load usage:', err);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You\'ll have access until the end of your billing period.')) {
      return;
    }

    setLoadingAction('cancel');
    try {
      await cancelSubscription();
      toast.success('Subscription canceled. You\'ll have access until the end of your billing period.');
    } catch (err) {
      toast.error('Failed to cancel subscription');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReactivate = async () => {
    setLoadingAction('reactivate');
    try {
      await reactivateSubscription();
      toast.success('Subscription reactivated!');
    } catch (err) {
      toast.error('Failed to reactivate subscription');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleOpenPortal = async () => {
    setLoadingAction('portal');
    try {
      await openCustomerPortal();
    } catch (err) {
      toast.error('Failed to open customer portal');
      setLoadingAction(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'trialing':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'canceled':
      case 'incomplete':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'trialing':
        return <Zap className="h-4 w-4" />;
      case 'canceled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  if (loading && !subscription) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Subscription */}
      <Card className="border-white/10 bg-gradient-to-br from-[#1a1a2e]/60 to-[#16213e]/60 backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-white">
                <CreditCard className="h-5 w-5" />
                Current Subscription
              </CardTitle>
              <CardDescription className="text-gray-400">
                Manage your billing and subscription
              </CardDescription>
            </div>
            {subscription && (
              <Badge className={getStatusColor(subscription.status)}>
                {getStatusIcon(subscription.status)}
                <span className="ml-1 capitalize">{subscription.status}</span>
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {subscription ? (
            <div className="space-y-4">
              {/* Subscription Details */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-gray-400">Plan</p>
                  <p className="text-lg font-semibold text-white">
                    {getPlanDisplayName(subscription.plan)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Renewal Date</p>
                  <p className="text-lg font-semibold text-white">
                    {new Date(subscription.current_period_end * 1000).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Trial Info */}
              {subscription.status === 'trialing' && subscription.trial_end && (
                <div className="rounded-lg bg-blue-500/10 p-4 border border-blue-500/20">
                  <div className="flex items-start gap-3">
                    <Zap className="mt-0.5 h-5 w-5 text-blue-400 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-blue-400">Free Trial Active</p>
                      <p className="mt-1 text-sm text-gray-300">
                        Your trial ends on{' '}
                        <strong>{new Date(subscription.trial_end * 1000).toLocaleDateString()}</strong>.
                        Your card will be charged automatically after the trial.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Cancellation Notice */}
              {subscription.cancel_at_period_end && (
                <div className="rounded-lg bg-yellow-500/10 p-4 border border-yellow-500/20">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 text-yellow-400 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-yellow-400">Subscription Ending</p>
                      <p className="mt-1 text-sm text-gray-300">
                        Your subscription will end on{' '}
                        <strong>{new Date(subscription.current_period_end * 1000).toLocaleDateString()}</strong>.
                        You'll be downgraded to the free plan.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Shield className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <p className="text-gray-400 mb-4">No active subscription</p>
              <Button
                onClick={() => window.location.href = '/pricing'}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90"
              >
                View Pricing Plans
              </Button>
            </div>
          )}
        </CardContent>
        {subscription && (
          <CardFooter className="flex gap-2">
            {subscription.cancel_at_period_end ? (
              <Button
                onClick={handleReactivate}
                disabled={loadingAction === 'reactivate'}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {loadingAction === 'reactivate' ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Reactivating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Reactivate Subscription
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleCancelSubscription}
                disabled={loadingAction === 'cancel'}
                variant="ghost"
                className="flex-1 text-red-400 hover:bg-red-500/10 hover:text-red-300"
              >
                {loadingAction === 'cancel' ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Canceling...
                  </>
                ) : (
                  'Cancel Subscription'
                )}
              </Button>
            )}
            <Button
              onClick={handleOpenPortal}
              disabled={loadingAction === 'portal'}
              variant="secondary"
              className="flex-1 hover:bg-white/10"
            >
              {loadingAction === 'portal' ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Opening...
                </>
              ) : (
                <>
                  Manage Billing
                  <ExternalLink className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Usage Statistics */}
      {usage && (
        <Card className="border-white/10 bg-gradient-to-br from-[#1a1a2e]/60 to-[#16213e]/60 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <BarChart3 className="h-5 w-5" />
              Usage This Month
            </CardTitle>
            <CardDescription className="text-gray-400">
              Track your current usage against plan limits
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Tasks */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-gray-400">Tasks Created</span>
                <span className="text-sm font-medium text-white">
                  {usage.usage.tasks_created} / {usage.limits.tasks === 999999 ? '∞' : usage.limits.tasks}
                </span>
              </div>
              <Progress 
                value={usage.limits.tasks === 999999 ? 0 : (usage.usage.tasks_created / usage.limits.tasks) * 100}
                className="h-2"
              />
            </div>

            {/* API Calls */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-gray-400">API Calls</span>
                <span className="text-sm font-medium text-white">
                  {usage.usage.api_calls} / {usage.limits.api_calls === 999999 ? '∞' : usage.limits.api_calls}
                </span>
              </div>
              <Progress 
                value={usage.limits.api_calls === 999999 ? 0 : (usage.usage.api_calls / usage.limits.api_calls) * 100}
                className="h-2"
              />
            </div>

            {/* Storage */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-gray-400">Storage Used</span>
                <span className="text-sm font-medium text-white">
                  {usage.usage.storage_mb}MB / {usage.limits.storage_mb === 10000 ? '∞' : `${usage.limits.storage_mb}MB`}
                </span>
              </div>
              <Progress 
                value={usage.limits.storage_mb === 10000 ? 0 : (usage.usage.storage_mb / usage.limits.storage_mb) * 100}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upgrade Prompt */}
      {subscription && subscription.plan.includes('starter') && (
        <Card className="border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingUp className="h-5 w-5" />
              Upgrade to Professional
            </CardTitle>
            <CardDescription className="text-gray-300">
              Get unlimited tasks, AI insights, and advanced features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-300">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                Unlimited tasks
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                AI-powered insights
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                Advanced analytics
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-400" />
                Up to 10 team members
              </li>
            </ul>
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => window.location.href = '/pricing'}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90"
            >
              Upgrade Now
            </Button>
          </CardFooter>
        </Card>
      )}

      {/* Help Section */}
      <Card className="border-white/10 bg-gradient-to-br from-[#1a1a2e]/60 to-[#16213e]/60 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Calendar className="h-5 w-5" />
            Need Help?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-gray-300">
          <p>
            <strong className="text-white">Billing Questions:</strong> Contact us at{' '}
            <a href="mailto:billing@syncscript.app" className="text-purple-400 hover:text-purple-300">
              billing@syncscript.app
            </a>
          </p>
          <p>
            <strong className="text-white">Support:</strong> Visit our{' '}
            <a href="/help" className="text-purple-400 hover:text-purple-300">
              Help Center
            </a>
          </p>
          <p>
            <strong className="text-white">Invoices:</strong> Access your billing history in the{' '}
            <button onClick={handleOpenPortal} className="text-purple-400 hover:text-purple-300">
              Customer Portal
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
