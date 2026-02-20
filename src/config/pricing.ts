export interface PlanFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
}

export interface PricingPlan {
  id: string;
  name: string;
  subtitle: string;
  price: number | 'custom';
  priceAnnual?: number;
  period: string;
  stripePriceId?: string;
  popular?: boolean;
  features: PlanFeature[];
  cta: string;
  ctaAction: 'signup' | 'checkout' | 'contact';
  gradient: string;
}

export const PLAN_IDS = {
  FREE: 'free',
  STARTER: 'starter',
  PROFESSIONAL: 'professional',
  ENTERPRISE: 'enterprise',
} as const;

export const PLANS: PricingPlan[] = [
  {
    id: PLAN_IDS.FREE,
    name: 'Free',
    subtitle: 'For individuals getting started',
    price: 0,
    period: 'forever',
    features: [
      { text: 'Up to 10 tasks per day', included: true },
      { text: 'Basic energy tracking', included: true },
      { text: '1 calendar integration', included: true },
      { text: 'Daily resonance insights', included: true },
      { text: 'Mobile app access', included: true },
      { text: 'AI assistant (limited)', included: true },
      { text: 'Community access', included: true },
      { text: 'Advanced analytics', included: false },
      { text: 'Team collaboration', included: false },
      { text: 'Priority support', included: false },
    ],
    cta: 'Start Free',
    ctaAction: 'signup',
    gradient: 'from-slate-600 to-slate-700',
  },
  {
    id: PLAN_IDS.STARTER,
    name: 'Starter',
    subtitle: 'For productive individuals',
    price: 19,
    priceAnnual: 15,
    period: 'per month',
    stripePriceId: 'price_1T1HooGnuF7uNW2kruooQTXk',
    features: [
      { text: 'Up to 50 tasks per month', included: true },
      { text: 'Basic calendar integration', included: true },
      { text: 'Email support', included: true },
      { text: '2 team members', included: true },
      { text: 'Mobile app access', included: true },
      { text: 'Basic analytics', included: true },
      { text: 'Energy & focus tracking', included: true },
      { text: 'Scripts & templates', included: true },
      { text: 'Advanced AI features', included: false },
      { text: 'Custom workflows', included: false },
    ],
    cta: 'Get Started',
    ctaAction: 'checkout',
    gradient: 'from-cyan-600 to-teal-600',
  },
  {
    id: PLAN_IDS.PROFESSIONAL,
    name: 'Professional',
    subtitle: 'For power users and professionals',
    price: 49,
    priceAnnual: 39,
    period: 'per month',
    stripePriceId: 'price_1T1HooGnuF7uNW2k6qyoLrKA',
    popular: true,
    features: [
      { text: 'Unlimited tasks', included: true },
      { text: 'Advanced calendar integration', included: true },
      { text: 'Priority support', included: true },
      { text: 'Up to 10 team members', included: true },
      { text: 'Advanced analytics & AI insights', included: true },
      { text: 'Custom workflows', included: true },
      { text: 'Mobile Voice Chat AI', included: true, highlight: true },
      { text: 'API access', included: true },
      { text: 'All integrations (50+)', included: true },
      { text: 'Custom resonance tuning', included: true },
    ],
    cta: 'Start Free Trial',
    ctaAction: 'checkout',
    gradient: 'from-purple-600 to-pink-600',
  },
  {
    id: PLAN_IDS.ENTERPRISE,
    name: 'Enterprise',
    subtitle: 'For large organizations',
    price: 99,
    priceAnnual: 79,
    period: 'per month',
    stripePriceId: 'price_1T1HooGnuF7uNW2kMMCzi43w',
    features: [
      { text: 'Everything in Professional', included: true },
      { text: 'Unlimited team members', included: true },
      { text: 'Dedicated support', included: true },
      { text: 'SSO / SAML', included: true },
      { text: 'Advanced security', included: true },
      { text: 'Custom integrations', included: true },
      { text: 'Priority Voice + Phone', included: true, highlight: true },
      { text: 'SLA guarantee', included: true },
      { text: 'Onboarding assistance', included: true },
      { text: 'Advanced compliance (SOC 2, HIPAA)', included: true },
    ],
    cta: 'Contact Sales',
    ctaAction: 'contact',
    gradient: 'from-amber-600 to-orange-600',
  },
];

export function getPlanById(id: string): PricingPlan | undefined {
  return PLANS.find((p) => p.id === id);
}

export function getPlanDisplayName(planString: string): string {
  if (planString.includes('professional')) return 'Professional';
  if (planString.includes('starter')) return 'Starter';
  if (planString.includes('enterprise')) return 'Enterprise';
  if (planString.includes('free')) return 'Free';
  return 'Unknown';
}

export function formatPrice(plan: PricingPlan, annual = false): string {
  if (plan.price === 'custom') return 'Custom';
  if (plan.price === 0) return '$0';
  const p = annual && plan.priceAnnual ? plan.priceAnnual : plan.price;
  return `$${p}`;
}
