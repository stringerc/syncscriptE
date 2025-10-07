import React from 'react';
import { Check, Star, Zap, Crown, Users, Brain, Calendar, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SyncScriptLogo } from '@/components/ui/SyncScriptLogo';

const PricingPage: React.FC = () => {
  const plans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for getting started with productivity',
      icon: <Zap className="w-6 h-6" />,
      color: 'border-gray-200',
      buttonText: 'Get Started Free',
      buttonVariant: 'outline' as const,
      features: [
        'Unlimited tasks and events',
        'Basic calendar sync',
        'AI assistant (5 queries/day)',
        'Energy tracking',
        'Basic templates',
        'Mobile app access',
        'Community support'
      ],
      limitations: [
        'Limited AI queries',
        'Basic analytics',
        'No team collaboration'
      ]
    },
    {
      name: 'Pro',
      price: '$12',
      period: 'per month',
      description: 'For power users who want advanced features',
      icon: <Brain className="w-6 h-6" />,
      color: 'border-blue-500',
      buttonText: 'Start Pro Trial',
      buttonVariant: 'default' as const,
      popular: true,
      features: [
        'Everything in Free',
        'Unlimited AI assistant',
        'Advanced energy analytics',
        'Smart scheduling',
        'Premium templates',
        'Voice commands',
        'Advanced integrations',
        'Priority support',
        'Data export'
      ]
    },
    {
      name: 'Team',
      price: '$25',
      period: 'per user/month',
      description: 'For teams that need collaboration',
      icon: <Users className="w-6 h-6" />,
      color: 'border-purple-500',
      buttonText: 'Start Team Trial',
      buttonVariant: 'default' as const,
      features: [
        'Everything in Pro',
        'Team collaboration',
        'Shared projects',
        'Admin controls',
        'Team analytics',
        'Custom integrations',
        'SSO authentication',
        'Dedicated support',
        'Custom onboarding'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 animate-fade-in">
      {/* Hero Header with Gradient */}
      <div className="container mx-auto px-4 py-12">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-12 text-white shadow-2xl mb-12">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10 text-center">
            <div className="flex justify-center mb-6">
              <SyncScriptLogo size="xl" showText={true} />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              Choose Your
              <span className="block mt-2 bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300 bg-clip-text text-transparent">
              {' '}Productivity{' '}
            </span>
            Plan
          </h1>
          <p className="text-xl text-white/90 max-w-3xl mx-auto">
            Transform your productivity with AI-powered task management, energy optimization, and smart scheduling. 
            Start free, upgrade when you're ready.
          </p>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => (
            <Card 
              key={plan.name} 
              className={`relative ${plan.color} ${plan.popular ? 'ring-2 ring-blue-500 shadow-xl scale-105' : 'shadow-lg'}`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-green-600 text-white">
                  <Star className="w-3 h-3 mr-1" />
                  Most Popular
                </Badge>
              )}
              
              <CardHeader className="text-center pb-8">
                <div className="flex justify-center mb-4">
                  <div className={`p-3 rounded-full ${plan.popular ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}>
                    {plan.icon}
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-gray-600">{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600 ml-2">/{plan.period}</span>
                </div>
              </CardHeader>

              <CardContent>
                <Button 
                  className={`w-full mb-6 ${plan.popular ? 'bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700' : ''}`}
                  variant={plan.buttonVariant}
                  size="lg"
                >
                  {plan.buttonText}
                </Button>

                <ul className="space-y-3">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                {plan.limitations && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Limitations:</h4>
                    <ul className="space-y-2">
                      {plan.limitations.map((limitation, limitIndex) => (
                        <li key={limitIndex} className="text-sm text-gray-500">
                          • {limitation}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Can I change plans anytime?
              </h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Is there a free trial?
              </h3>
              <p className="text-gray-600">
                Pro and Team plans come with a 14-day free trial. No credit card required to start.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                What happens to my data if I cancel?
              </h3>
              <p className="text-gray-600">
                Your data is always yours. You can export everything before canceling, and we'll keep it for 30 days.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Do you offer student discounts?
              </h3>
              <p className="text-gray-600">
                Yes! Students get 50% off Pro plans. Contact support with your student email for verification.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center">
          <div className="bg-gradient-to-r from-blue-600 via-green-600 to-orange-600 rounded-2xl p-8 text-white">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Transform Your Productivity?
            </h2>
            <p className="text-xl mb-6 opacity-90">
              Join thousands of users who've already optimized their workflow with SyncScript.
            </p>
            <Button size="lg" variant="secondary" className="bg-white text-gray-900 hover:bg-gray-100">
              Start Your Free Trial
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
