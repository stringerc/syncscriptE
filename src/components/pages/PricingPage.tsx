/**
 * Pricing Page Component
 * 
 * Beautiful, modern pricing page with Stripe integration.
 * Features:
 * - 3 pricing tiers (Starter, Professional, Enterprise)
 * - 14-day free trial
 * - Secure Stripe checkout
 * - Responsive design
 * - Feature comparison
 * - FAQ section
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Check, Zap, Shield, Users, TrendingUp, Crown,
  ArrowRight, Sparkles, Lock, HelpCircle
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { useStripe } from '../../hooks/useStripe';
import { toast } from 'sonner@2.0.3';

interface PricingPageProps {
  userId: string;
  userEmail: string;
}

export function PricingPage({ userId, userEmail }: PricingPageProps) {
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  
  const { createCheckoutSession, loading, error } = useStripe(userId);

  const handleSelectPlan = async (planId: string) => {
    setLoadingPlan(planId);
    
    try {
      const successUrl = `${window.location.origin}/subscription/success`;
      const cancelUrl = `${window.location.origin}/pricing`;
      
      const checkoutUrl = await createCheckoutSession(
        planId,
        userEmail,
        successUrl,
        cancelUrl
      );
      
      // Redirect to Stripe Checkout
      window.location.href = checkoutUrl;
    } catch (err) {
      toast.error('Failed to start checkout');
      console.error(err);
      setLoadingPlan(null);
    }
  };

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      description: 'Perfect for individuals getting started',
      icon: Zap,
      color: 'from-blue-500 to-cyan-500',
      price: {
        month: 19,
        year: 190 // ~$16/mo with annual billing
      },
      features: [
        'Up to 50 tasks per month',
        'Basic calendar integration',
        'Email support',
        '2 team members',
        'Mobile app access',
        'Basic analytics',
        '14-day free trial'
      ],
      cta: 'Start Free Trial',
      popular: false
    },
    {
      id: 'professional',
      name: 'Professional',
      description: 'For professionals and small teams',
      icon: TrendingUp,
      color: 'from-purple-500 to-pink-500',
      price: {
        month: 49,
        year: 490 // ~$41/mo with annual billing
      },
      features: [
        'Unlimited tasks',
        'Advanced calendar integration',
        'Priority support',
        'Up to 10 team members',
        'Advanced analytics',
        'AI-powered insights',
        'Custom workflows',
        'API access',
        '14-day free trial'
      ],
      cta: 'Start Free Trial',
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'For large teams and organizations',
      icon: Crown,
      color: 'from-orange-500 to-red-500',
      price: {
        month: 99,
        year: 990 // ~$83/mo with annual billing
      },
      features: [
        'Everything in Professional',
        'Unlimited team members',
        'Dedicated support',
        'SSO/SAML',
        'Advanced security',
        'Custom integrations',
        'SLA guarantee',
        'Onboarding assistance',
        'Custom contract'
      ],
      cta: 'Start Free Trial',
      popular: false
    }
  ];

  const faqs = [
    {
      question: 'What happens after the free trial?',
      answer: 'After your 14-day free trial ends, your card will be charged automatically. You can cancel anytime before the trial ends with no charge.'
    },
    {
      question: 'Can I change plans later?',
      answer: 'Yes! You can upgrade or downgrade your plan at any time. Changes are prorated automatically.'
    },
    {
      question: 'Is my payment information secure?',
      answer: 'Absolutely. We use Stripe for payment processing, which is PCI DSS compliant and trusted by millions of businesses worldwide.'
    },
    {
      question: 'What happens if I cancel?',
      answer: 'You can cancel anytime. Your subscription will remain active until the end of your billing period, then you\'ll be downgraded to the free plan.'
    },
    {
      question: 'Do you offer refunds?',
      answer: 'Yes, we offer a 30-day money-back guarantee. If you\'re not satisfied, contact us for a full refund.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#1a1a2e] to-[#0a0a1a]">
      {/* Header */}
      <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-12 lg:py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Badge className="mb-4 bg-purple-500/10 text-purple-400 border-purple-500/20">
            <Sparkles className="mr-1 h-3 w-3" />
            14-Day Free Trial
          </Badge>
          
          <h1 className="mb-4 text-3xl sm:text-4xl lg:text-5xl font-bold text-white">
            Choose Your Plan
          </h1>
          
          <p className="mx-auto max-w-2xl text-base sm:text-lg text-gray-400">
            Start with a 14-day free trial. No credit card required during trial. Cancel anytime.
          </p>
        </motion.div>

        {/* Billing Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 lg:mb-12 flex flex-wrap items-center justify-center gap-3 sm:gap-4"
        >
          <span className={`text-sm ${billingInterval === 'month' ? 'text-white font-semibold' : 'text-gray-400'}`}>
            Monthly
          </span>
          
          <button
            onClick={() => setBillingInterval(billingInterval === 'month' ? 'year' : 'month')}
            className="relative inline-flex h-6 w-11 items-center rounded-full bg-purple-600 transition-colors"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                billingInterval === 'year' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          
          <span className={`text-sm ${billingInterval === 'year' ? 'text-white font-semibold' : 'text-gray-400'}`}>
            Yearly
            <Badge className="ml-2 bg-green-500/10 text-green-400 border-green-500/20">
              Save 17%
            </Badge>
          </span>
        </motion.div>
      </div>

      {/* Pricing Cards */}
      <div className="container mx-auto px-4 sm:px-6 pb-10 lg:pb-16">
        <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const price = plan.price[billingInterval];
            const isLoading = loadingPlan === plan.id;
            
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card 
                  className={`relative overflow-hidden border-white/10 bg-gradient-to-br from-[#1a1a2e]/60 to-[#16213e]/60 backdrop-blur-xl ${
                    plan.popular ? 'ring-2 ring-purple-500' : ''
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
                  )}
                  
                  {plan.popular && (
                    <Badge className="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 border-0">
                      <Sparkles className="mr-1 h-3 w-3" />
                      Most Popular
                    </Badge>
                  )}

                  <CardHeader>
                    <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${plan.color}`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    
                    <CardTitle className="text-2xl text-white">
                      {plan.name}
                    </CardTitle>
                    
                    <CardDescription className="text-gray-400">
                      {plan.description}
                    </CardDescription>

                    <div className="mt-4 flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-white">
                        ${price}
                      </span>
                      <span className="text-gray-400">
                        /{billingInterval === 'month' ? 'month' : 'year'}
                      </span>
                    </div>
                    
                    {billingInterval === 'year' && (
                      <p className="text-sm text-green-400">
                        Save ${(plan.price.month * 12) - plan.price.year} per year
                      </p>
                    )}
                  </CardHeader>

                  <CardContent>
                    <ul className="space-y-3">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-400" />
                          <span className="text-sm text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter>
                    <Button
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={isLoading}
                      className={`w-full bg-gradient-to-r ${plan.color} hover:opacity-90 transition-opacity`}
                    >
                      {isLoading ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Processing...
                        </>
                      ) : (
                        <>
                          {plan.cta}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Trust Badges */}
      <div className="container mx-auto px-4 pb-16">
        <div className="mx-auto max-w-4xl rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a1a2e]/60 to-[#16213e]/60 p-8 backdrop-blur-xl">
          <div className="grid gap-8 md:grid-cols-3 text-center">
            <div>
              <Lock className="mx-auto mb-3 h-8 w-8 text-green-400" />
              <h3 className="mb-2 font-semibold text-white">Secure Payments</h3>
              <p className="text-sm text-gray-400">
                PCI DSS compliant via Stripe
              </p>
            </div>
            <div>
              <Shield className="mx-auto mb-3 h-8 w-8 text-blue-400" />
              <h3 className="mb-2 font-semibold text-white">Money-Back Guarantee</h3>
              <p className="text-sm text-gray-400">
                30-day full refund policy
              </p>
            </div>
            <div>
              <Users className="mx-auto mb-3 h-8 w-8 text-purple-400" />
              <h3 className="mb-2 font-semibold text-white">Trusted by 10,000+ Users</h3>
              <p className="text-sm text-gray-400">
                Join our growing community
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="container mx-auto px-4 sm:px-6 pb-10 lg:pb-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-6 sm:mb-8 text-center text-2xl sm:text-3xl font-bold text-white">
            Frequently Asked Questions
          </h2>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-white/10 bg-gradient-to-br from-[#1a1a2e]/60 to-[#16213e]/60 backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="flex items-start gap-3 text-lg text-white">
                      <HelpCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-purple-400" />
                      {faq.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-400">{faq.answer}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="container mx-auto px-4 sm:px-6 pb-12 sm:pb-16 lg:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto max-w-3xl text-center rounded-2xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-6 sm:p-8 lg:p-12 backdrop-blur-xl"
        >
          <h2 className="mb-4 text-2xl sm:text-3xl font-bold text-white">
            Ready to Transform Your Productivity?
          </h2>
          <p className="mb-6 sm:mb-8 text-base sm:text-lg text-gray-300">
            Start your 14-day free trial today. No credit card required.
          </p>
          <Button
            onClick={() => handleSelectPlan('professional')}
            size="lg"
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 transition-opacity"
          >
            Start Free Trial
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
