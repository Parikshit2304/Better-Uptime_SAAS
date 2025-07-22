const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth');
const Stripe = require('stripe');

const router = express.Router();
const prisma = new PrismaClient();

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'Your-stripe-key');

// Pricing plans configuration
const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    maxWebsites: 3,
    checkInterval: 300, // 5 minutes
    features: ['3 websites', '5-minute checks', 'Basic alerts', '7-day history'],
    stripeProductId: null
  },
  starter: {
    name: 'Starter',
    price: 9,
    maxWebsites: 10,
    checkInterval: 60, // 1 minute
    features: ['10 websites', '1-minute checks', 'Email alerts', '30-day history', 'Basic analytics'],
    stripeProductId: process.env.STRIPE_STARTER_PRODUCT_ID || 'prod_starter'
  },
  professional: {
    name: 'Professional',
    price: 29,
    maxWebsites: 50,
    checkInterval: 30, // 30 seconds
    features: ['50 websites', '30-second checks', 'SMS + Email alerts', '90-day history', 'Advanced analytics', 'API access'],
    stripeProductId: process.env.STRIPE_PROFESSIONAL_PRODUCT_ID || 'prod_professional'
  },
  enterprise: {
    name: 'Enterprise',
    price: 99,
    maxWebsites: 200,
    checkInterval: 15, // 15 seconds
    features: ['200 websites', '15-second checks', 'All alert types', 'Unlimited history', 'Full analytics', 'API access', 'Priority support'],
    stripeProductId: process.env.STRIPE_ENTERPRISE_PRODUCT_ID || 'prod_enterprise'
  }
};

// Get all plans
router.get('/plans', (req, res) => {
  res.json({ plans: PLANS });
});

// Get current subscription
router.get('/current', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        subscriptionStatus: true,
        planType: true,
        maxWebsites: true,
        maxCheckInterval: true,
        planStartDate: true,
        planEndDate: true,
        subscriptionId: true
      }
    });

    const currentPlan = PLANS[user.planType];
    
    // Get website count
    const websiteCount = await prisma.website.count({
      where: { userId: req.user.id }
    });
    
    res.json({
      subscription: {
        ...user,
        planDetails: currentPlan,
        websiteCount
      }
    });
  } catch (error) {
    console.error('Subscription fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

// Create Stripe checkout session
router.post('/create-checkout-session', authenticateToken, async (req, res) => {
  try {
    const { planType, duration = 'monthly' } = req.body;

    if (!PLANS[planType] || planType === 'free') {
      return res.status(400).json({ error: 'Invalid plan type' });
    }

    const plan = PLANS[planType];
    const isYearly = duration === 'yearly';
    const unitAmount = isYearly ? plan.price * 10 * 100 : plan.price * 100; // Convert to cents, 2 months free for yearly

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${plan.name} Plan`,
              description: plan.features.join(', '),
            },
            unit_amount: unitAmount,
            recurring: {
              interval: isYearly ? 'year' : 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: (process.env.FRONTEND_URL || 'http://localhost:3000') + '/dashboard?session_id={CHECKOUT_SESSION_ID}',
      //success_url: 'http://localhost:3000/dashboard?session_id={CHECKOUT_SESSION_ID}',
      //cancel_url: (process.env.FRONTEND_URL)+'/pricing',
      cancel_url: (process.env.FRONTEND_URL || 'http://localhost:3000')+'/pricing',
      client_reference_id: req.user.id,
      metadata: {
        planType,
        duration,
        userId: req.user.id
      }
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe session creation error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Handle successful payment
router.post('/handle-success', authenticateToken, async (req, res) => {
  try {
    const { sessionId } = req.body;

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.client_reference_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { planType, duration } = session.metadata;
    const plan = PLANS[planType];
    
    const durationMultiplier = duration === 'yearly' ? 12 : 1;
    const planEndDate = new Date();
    planEndDate.setMonth(planEndDate.getMonth() + durationMultiplier);

    // Update user subscription
    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        planType,
        subscriptionStatus: 'active',
        subscriptionId: session.subscription,
        maxWebsites: plan.maxWebsites,
        maxCheckInterval: plan.checkInterval,
        planStartDate: new Date(),
        planEndDate
      }
    });

    res.json({
      message: 'Subscription activated successfully',
      subscription: {
        planType: updatedUser.planType,
        subscriptionStatus: updatedUser.subscriptionStatus,
        maxWebsites: updatedUser.maxWebsites,
        maxCheckInterval: updatedUser.maxCheckInterval,
        planEndDate: updatedUser.planEndDate
      }
    });
  } catch (error) {
    console.error('Payment success handling error:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

// Upgrade/Change plan (for existing customers)
router.post('/upgrade', authenticateToken, async (req, res) => {
  try {
    const { planType, duration = 'monthly' } = req.body;

    if (!PLANS[planType]) {
      return res.status(400).json({ error: 'Invalid plan type' });
    }

    const plan = PLANS[planType];
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    // Handle downgrade to free plan
    if (planType === 'free') {
      // Check if user has more websites than allowed in free plan
      const websiteCount = await prisma.website.count({
        where: { userId: req.user.id }
      });

      if (websiteCount > plan.maxWebsites) {
        // Deactivate excess websites
        const websites = await prisma.website.findMany({
          where: { userId: req.user.id },
          orderBy: { createdAt: 'desc' },
          skip: plan.maxWebsites
        });

        await prisma.website.updateMany({
          where: {
            id: { in: websites.map(w => w.id) }
          },
          data: { isActive: false }
        });
      }

      // Cancel Stripe subscription if exists
      if (user.subscriptionId) {
        try {
          await stripe.subscriptions.cancel(user.subscriptionId);
        } catch (stripeError) {
          console.error('Error canceling Stripe subscription:', stripeError);
        }
      }

      const updatedUser = await prisma.user.update({
        where: { id: req.user.id },
        data: {
          planType: 'free',
          subscriptionStatus: 'cancelled',
          subscriptionId: null,
          maxWebsites: plan.maxWebsites,
          maxCheckInterval: plan.checkInterval,
          planEndDate: null
        }
      });

      return res.json({
        message: 'Downgraded to free plan successfully',
        subscription: {
          planType: updatedUser.planType,
          subscriptionStatus: updatedUser.subscriptionStatus,
          maxWebsites: updatedUser.maxWebsites,
          maxCheckInterval: updatedUser.maxCheckInterval,
          planEndDate: updatedUser.planEndDate
        }
      });
    }

    // For paid plans, redirect to Stripe checkout
    const isYearly = duration === 'yearly';
    const unitAmount = isYearly ? plan.price * 10 * 100 : plan.price * 100;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${plan.name} Plan`,
              description: plan.features.join(', '),
            },
            unit_amount: unitAmount,
            recurring: {
              interval: isYearly ? 'year' : 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pricing`,
      client_reference_id: req.user.id,
      metadata: {
        planType,
        duration,
        userId: req.user.id
      }
    });

    res.json({ 
      requiresPayment: true,
      sessionId: session.id, 
      url: session.url 
    });
  } catch (error) {
    console.error('Plan upgrade error:', error);
    res.status(500).json({ error: 'Failed to upgrade plan' });
  }
});

// Cancel subscription
router.post('/cancel', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (user.subscriptionId) {
      // Cancel the Stripe subscription
      await stripe.subscriptions.update(user.subscriptionId, {
        cancel_at_period_end: true
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        subscriptionStatus: 'cancelled'
      }
    });

    res.json({
      message: 'Subscription cancelled successfully. You can continue using your current plan until the end of the billing period.',
      subscription: {
        subscriptionStatus: updatedUser.subscriptionStatus,
        planEndDate: updatedUser.planEndDate
      }
    });
  } catch (error) {
    console.error('Subscription cancel error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

// Stripe webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        const userId = session.client_reference_id;
        const { planType, duration } = session.metadata;
        
        if (userId && planType) {
          const plan = PLANS[planType];
          const durationMultiplier = duration === 'yearly' ? 12 : 1;
          const planEndDate = new Date();
          planEndDate.setMonth(planEndDate.getMonth() + durationMultiplier);

          await prisma.user.update({
            where: { id: userId },
            data: {
              planType,
              subscriptionStatus: 'active',
              subscriptionId: session.subscription,
              maxWebsites: plan.maxWebsites,
              maxCheckInterval: plan.checkInterval,
              planStartDate: new Date(),
              planEndDate
            }
          });
        }
        break;

      case 'customer.subscription.deleted':
        const subscription = event.data.object;
        await prisma.user.updateMany({
          where: { subscriptionId: subscription.id },
          data: {
            subscriptionStatus: 'cancelled',
            planType: 'free',
            maxWebsites: 3,
            maxCheckInterval: 300,
            planEndDate: null
          }
        });
        break;

      case 'invoice.payment_failed':
        const invoice = event.data.object;
        await prisma.user.updateMany({
          where: { subscriptionId: invoice.subscription },
          data: {
            subscriptionStatus: 'past_due'
          }
        });
        break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook handling error:', error);
    res.status(500).json({ error: 'Webhook handling failed' });
  }
});

// Get usage statistics
router.get('/usage', authenticateToken, async (req, res) => {
  try {
    const websiteCount = await prisma.website.count({
      where: { userId: req.user.id }
    });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        maxWebsites: true,
        maxCheckInterval: true,
        planType: true
      }
    });

    res.json({
      usage: {
        websites: {
          current: websiteCount,
          limit: user.maxWebsites,
          percentage: Math.round((websiteCount / user.maxWebsites) * 100)
        },
        checkInterval: user.maxCheckInterval,
        planType: user.planType
      }
    });
  } catch (error) {
    console.error('Usage fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch usage' });
  }
});

module.exports = router;