/**
 * Stripe Payment & Subscription Routes
 * 
 * Production-ready Stripe integration for SyncScript subscription management.
 * 
 * Features:
 * - Subscription creation and management
 * - Multiple pricing tiers (Starter, Professional, Enterprise)
 * - Webhook handling for subscription events
 * - Customer portal access
 * - Usage-based billing support
 * - Trial period management
 * - Payment method management
 * 
 * Security:
 * - All operations server-side only
 * - Webhook signature verification
 * - User authentication required
 * - PCI compliance (Stripe handles card data)
 */

import { Hono } from 'npm:hono';
import Stripe from 'npm:stripe@14.11.0';
import * as kv from './kv_store.tsx';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
});

const stripeRoutes = new Hono();

// ============================================================================
// PRICING CONFIGURATION
// ============================================================================

export const PRICING_PLANS = {
  starter: {
    name: 'Starter',
    price_id: 'price_starter_monthly', // Replace with actual Stripe Price ID
    amount: 1900, // $19.00
    interval: 'month',
    features: [
      'Up to 50 tasks per month',
      'Basic calendar integration',
      'Email support',
      '2 team members',
      'Mobile app access',
      'Basic analytics'
    ]
  },
  professional: {
    name: 'Professional',
    price_id: 'price_professional_monthly', // Replace with actual Stripe Price ID
    amount: 4900, // $49.00
    interval: 'month',
    features: [
      'Unlimited tasks',
      'Advanced calendar integration',
      'Priority support',
      'Up to 10 team members',
      'Advanced analytics',
      'AI-powered insights',
      'Custom workflows',
      'API access'
    ]
  },
  enterprise: {
    name: 'Enterprise',
    price_id: 'price_enterprise_monthly', // Replace with actual Stripe Price ID
    amount: 9900, // $99.00
    interval: 'month',
    features: [
      'Everything in Professional',
      'Unlimited team members',
      'Dedicated support',
      'SSO/SAML',
      'Advanced security',
      'Custom integrations',
      'SLA guarantee',
      'Onboarding assistance'
    ]
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get or create Stripe customer for user
 */
async function getOrCreateCustomer(userId: string, email: string, name?: string): Promise<string> {
  // Check if customer already exists in KV store
  const existingCustomerId = await kv.get(`stripe_customer:${userId}`);
  
  if (existingCustomerId) {
    return existingCustomerId as string;
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      user_id: userId
    }
  });

  // Store customer ID
  await kv.set(`stripe_customer:${userId}`, customer.id);
  
  return customer.id;
}

/**
 * Get user's subscription status
 */
async function getUserSubscription(userId: string) {
  const subscriptionData = await kv.get(`subscription:${userId}`);
  return subscriptionData || null;
}

/**
 * Store subscription data
 */
async function storeSubscription(userId: string, subscription: any) {
  await kv.set(`subscription:${userId}`, {
    id: subscription.id,
    customer: subscription.customer,
    status: subscription.status,
    plan: subscription.items.data[0].price.id,
    current_period_start: subscription.current_period_start,
    current_period_end: subscription.current_period_end,
    cancel_at_period_end: subscription.cancel_at_period_end,
    trial_end: subscription.trial_end,
    created_at: new Date().toISOString()
  });
}

// ============================================================================
// ROUTES
// ============================================================================

/**
 * GET /make-server-57781ad9/stripe/pricing
 * Get available pricing plans
 */
stripeRoutes.get('/pricing', async (c) => {
  try {
    return c.json({
      plans: PRICING_PLANS,
      currency: 'usd'
    });
  } catch (error) {
    console.error('Error fetching pricing:', error);
    return c.json({ error: 'Failed to fetch pricing plans' }, 500);
  }
});

/**
 * POST /make-server-57781ad9/stripe/create-checkout-session
 * Create Stripe Checkout session for subscription
 */
stripeRoutes.post('/create-checkout-session', async (c) => {
  try {
    const body = await c.req.json();
    const { plan_id, user_id, email, success_url, cancel_url } = body;

    if (!plan_id || !user_id || !email) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Get or create customer
    const customerId = await getOrCreateCustomer(user_id, email);

    // Get plan details
    const plan = PRICING_PLANS[plan_id as keyof typeof PRICING_PLANS];
    if (!plan) {
      return c.json({ error: 'Invalid plan ID' }, 400);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.price_id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: success_url || `${Deno.env.get('APP_URL')}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancel_url || `${Deno.env.get('APP_URL')}/pricing`,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      metadata: {
        user_id,
        plan_id
      },
      subscription_data: {
        trial_period_days: 14, // 14-day free trial
        metadata: {
          user_id,
          plan_id
        }
      }
    });

    return c.json({
      session_id: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return c.json({ error: 'Failed to create checkout session' }, 500);
  }
});

/**
 * GET /make-server-57781ad9/stripe/subscription/:userId
 * Get user's current subscription status
 */
stripeRoutes.get('/subscription/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    
    const subscription = await getUserSubscription(userId);
    
    if (!subscription) {
      return c.json({ subscription: null, status: 'none' });
    }

    // Fetch latest from Stripe to ensure accuracy
    try {
      const stripeSubscription = await stripe.subscriptions.retrieve(subscription.id);
      
      // Update local cache
      await storeSubscription(userId, stripeSubscription);
      
      return c.json({
        subscription: {
          id: stripeSubscription.id,
          status: stripeSubscription.status,
          plan: stripeSubscription.items.data[0].price.id,
          current_period_end: stripeSubscription.current_period_end,
          cancel_at_period_end: stripeSubscription.cancel_at_period_end,
          trial_end: stripeSubscription.trial_end
        }
      });
    } catch (err) {
      // If Stripe fetch fails, return cached data
      return c.json({ subscription });
    }
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return c.json({ error: 'Failed to fetch subscription' }, 500);
  }
});

/**
 * POST /make-server-57781ad9/stripe/cancel-subscription
 * Cancel user's subscription at period end
 */
stripeRoutes.post('/cancel-subscription', async (c) => {
  try {
    const body = await c.req.json();
    const { user_id } = body;

    if (!user_id) {
      return c.json({ error: 'User ID required' }, 400);
    }

    const subscription = await getUserSubscription(user_id);
    
    if (!subscription) {
      return c.json({ error: 'No active subscription found' }, 404);
    }

    // Cancel at period end (don't cancel immediately)
    const updatedSubscription = await stripe.subscriptions.update(
      subscription.id,
      { cancel_at_period_end: true }
    );

    // Update local cache
    await storeSubscription(user_id, updatedSubscription);

    return c.json({
      success: true,
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        cancel_at_period_end: true,
        current_period_end: updatedSubscription.current_period_end
      }
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return c.json({ error: 'Failed to cancel subscription' }, 500);
  }
});

/**
 * POST /make-server-57781ad9/stripe/reactivate-subscription
 * Reactivate a canceled subscription
 */
stripeRoutes.post('/reactivate-subscription', async (c) => {
  try {
    const body = await c.req.json();
    const { user_id } = body;

    if (!user_id) {
      return c.json({ error: 'User ID required' }, 400);
    }

    const subscription = await getUserSubscription(user_id);
    
    if (!subscription) {
      return c.json({ error: 'No subscription found' }, 404);
    }

    // Reactivate subscription
    const updatedSubscription = await stripe.subscriptions.update(
      subscription.id,
      { cancel_at_period_end: false }
    );

    // Update local cache
    await storeSubscription(user_id, updatedSubscription);

    return c.json({
      success: true,
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        cancel_at_period_end: false
      }
    });
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    return c.json({ error: 'Failed to reactivate subscription' }, 500);
  }
});

/**
 * POST /make-server-57781ad9/stripe/update-subscription
 * Update user's subscription plan
 */
stripeRoutes.post('/update-subscription', async (c) => {
  try {
    const body = await c.req.json();
    const { user_id, new_plan_id } = body;

    if (!user_id || !new_plan_id) {
      return c.json({ error: 'User ID and new plan ID required' }, 400);
    }

    const subscription = await getUserSubscription(user_id);
    
    if (!subscription) {
      return c.json({ error: 'No active subscription found' }, 404);
    }

    // Get new plan details
    const newPlan = PRICING_PLANS[new_plan_id as keyof typeof PRICING_PLANS];
    if (!newPlan) {
      return c.json({ error: 'Invalid plan ID' }, 400);
    }

    // Update subscription
    const updatedSubscription = await stripe.subscriptions.update(
      subscription.id,
      {
        items: [{
          id: subscription.items?.data?.[0]?.id,
          price: newPlan.price_id,
        }],
        proration_behavior: 'create_prorations', // Prorate the cost
      }
    );

    // Update local cache
    await storeSubscription(user_id, updatedSubscription);

    return c.json({
      success: true,
      subscription: {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        plan: newPlan.name
      }
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return c.json({ error: 'Failed to update subscription' }, 500);
  }
});

/**
 * POST /make-server-57781ad9/stripe/create-portal-session
 * Create customer portal session for managing subscription
 */
stripeRoutes.post('/create-portal-session', async (c) => {
  try {
    const body = await c.req.json();
    const { user_id, return_url } = body;

    if (!user_id) {
      return c.json({ error: 'User ID required' }, 400);
    }

    // Get customer ID
    const customerId = await kv.get(`stripe_customer:${user_id}`);
    
    if (!customerId) {
      return c.json({ error: 'No customer found' }, 404);
    }

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId as string,
      return_url: return_url || `${Deno.env.get('APP_URL')}/settings/billing`,
    });

    return c.json({
      url: session.url
    });
  } catch (error) {
    console.error('Error creating portal session:', error);
    return c.json({ error: 'Failed to create portal session' }, 500);
  }
});

/**
 * GET /make-server-57781ad9/stripe/payment-methods/:userId
 * Get user's payment methods
 */
stripeRoutes.get('/payment-methods/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    
    const customerId = await kv.get(`stripe_customer:${userId}`);
    
    if (!customerId) {
      return c.json({ payment_methods: [] });
    }

    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId as string,
      type: 'card',
    });

    return c.json({
      payment_methods: paymentMethods.data.map(pm => ({
        id: pm.id,
        brand: pm.card?.brand,
        last4: pm.card?.last4,
        exp_month: pm.card?.exp_month,
        exp_year: pm.card?.exp_year
      }))
    });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return c.json({ error: 'Failed to fetch payment methods' }, 500);
  }
});

/**
 * POST /make-server-57781ad9/stripe/webhook
 * Handle Stripe webhook events
 */
stripeRoutes.post('/webhook', async (c) => {
  try {
    const body = await c.req.text();
    const signature = c.req.header('stripe-signature');

    if (!signature) {
      return c.json({ error: 'No signature' }, 400);
    }

    // Verify webhook signature
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        Deno.env.get('STRIPE_WEBHOOK_SECRET')!
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return c.json({ error: 'Invalid signature' }, 400);
    }

    console.log(`Received webhook: ${event.type}`);

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const userId = subscription.metadata.user_id;
        
        if (userId) {
          await storeSubscription(userId, subscription);
          console.log(`Subscription ${subscription.id} updated for user ${userId}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const userId = subscription.metadata.user_id;
        
        if (userId) {
          await kv.del(`subscription:${userId}`);
          console.log(`Subscription ${subscription.id} deleted for user ${userId}`);
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        console.log(`Payment succeeded for invoice ${invoice.id}`);
        
        // You could send a receipt email here
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        console.log(`Payment failed for invoice ${invoice.id}`);
        
        // You could send a payment failure notification here
        break;
      }

      case 'customer.subscription.trial_will_end': {
        const subscription = event.data.object;
        console.log(`Trial ending soon for subscription ${subscription.id}`);
        
        // Send trial ending reminder email
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return c.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return c.json({ error: 'Webhook processing failed' }, 500);
  }
});

/**
 * GET /make-server-57781ad9/stripe/usage/:userId
 * Get user's current usage for the billing period
 */
stripeRoutes.get('/usage/:userId', async (c) => {
  try {
    const userId = c.req.param('userId');
    
    // Get usage data from KV store
    const usageKey = `usage:${userId}:${new Date().toISOString().slice(0, 7)}`; // YYYY-MM
    const usage = await kv.get(usageKey) || {
      tasks_created: 0,
      api_calls: 0,
      storage_mb: 0
    };

    // Get subscription to check limits
    const subscription = await getUserSubscription(userId);
    
    let limits = {
      tasks: 50,
      api_calls: 1000,
      storage_mb: 100
    };

    if (subscription) {
      // Adjust limits based on plan
      if (subscription.plan.includes('professional')) {
        limits = { tasks: 999999, api_calls: 10000, storage_mb: 1000 };
      } else if (subscription.plan.includes('enterprise')) {
        limits = { tasks: 999999, api_calls: 999999, storage_mb: 10000 };
      }
    }

    return c.json({
      usage,
      limits,
      subscription_status: subscription?.status || 'none'
    });
  } catch (error) {
    console.error('Error fetching usage:', error);
    return c.json({ error: 'Failed to fetch usage' }, 500);
  }
});

export default stripeRoutes;
