import { Router, Request, Response } from 'express';
import { stripe, STRIPE_WEBHOOK_SECRET } from '../config/stripe.js';
import { subscriptionService } from '../services/subscription-service.js';
import { topUpService } from '../services/topup-service.js';
import Stripe from 'stripe';

const router = Router();

/**
 * Stripe Webhook Endpoint
 *
 * IMPORTANT: This endpoint must receive raw body (not parsed as JSON)
 * Express should be configured with: express.raw({ type: 'application/json' })
 * for the webhook route path.
 *
 * Stripe sends webhook events to notify about:
 * - Successful payments
 * - Subscription lifecycle events
 * - Invoice payments
 * - And more...
 */
router.post('/stripe', async (req: Request, res: Response) => {
  // Get the raw body and signature
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    console.error('❌ Missing Stripe signature header');
    return res.status(400).send('Missing signature');
  }

  if (!STRIPE_WEBHOOK_SECRET) {
    console.error('❌ Stripe webhook secret not configured');
    return res.status(500).send('Webhook secret not configured');
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    // Note: req.body should be raw buffer, not parsed JSON
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      STRIPE_WEBHOOK_SECRET
    );

    console.log(`✅ Webhook received: ${event.type} (ID: ${event.id})`);
  } catch (err) {
    const error = err as Error;
    console.error('❌ Webhook signature verification failed:', error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      // ====== CHECKOUT EVENTS ======
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(`📝 Checkout session completed: ${session.id}`);

        // Determine if this is a subscription or one-time payment
        if (session.mode === 'subscription') {
          console.log(`   → Subscription checkout completed (handled by customer.subscription.created)`);
          // Subscription will be handled by customer.subscription.created event
        } else if (session.mode === 'payment') {
          console.log(`   → One-time payment (top-up) checkout completed`);
          // This is a top-up purchase
          await topUpService.processTopUpPayment(session);
        }
        break;
      }

      // ====== SUBSCRIPTION LIFECYCLE EVENTS ======
      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`📝 Subscription created: ${subscription.id}`);
        await subscriptionService.handleSubscriptionCreated(subscription);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`📝 Subscription updated: ${subscription.id}`);
        await subscriptionService.handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`📝 Subscription deleted/canceled: ${subscription.id}`);
        await subscriptionService.handleSubscriptionDeleted(subscription);
        break;
      }

      // ====== INVOICE EVENTS (Recurring Payments) ======
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`📝 Invoice payment succeeded: ${invoice.id}`);
        await subscriptionService.handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        console.log(`📝 Invoice payment failed: ${invoice.id}`);
        await subscriptionService.handleInvoicePaymentFailed(invoice);
        break;
      }

      // ====== OTHER EVENTS (Log but don't handle) ======
      case 'payment_intent.succeeded':
        console.log(`   → Payment intent succeeded (handled by checkout.session.completed)`);
        break;

      case 'customer.created':
        console.log(`   → Customer created`);
        break;

      default:
        console.log(`   → Unhandled event type: ${event.type}`);
    }

    // Return 200 OK to acknowledge receipt
    res.json({ received: true });
  } catch (error) {
    console.error(`❌ Error processing webhook ${event.type}:`, error);

    // Return 500 error so Stripe retries the webhook
    res.status(500).json({
      error: 'Webhook processing failed',
      type: event.type,
    });
  }
});

export default router;
