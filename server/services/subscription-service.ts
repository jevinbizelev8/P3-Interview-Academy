import { stripe, SUBSCRIPTION_TIERS, STRIPE_URLS, getOrCreateStripeCustomer, getTierFromPriceId } from '../config/stripe.js';
import { db } from '../db';
import { users, subscriptions } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import Stripe from 'stripe';

export class SubscriptionService {
  /**
   * Create a Stripe Checkout session for subscription tier upgrade
   */
  async createCheckoutSession(
    userId: string,
    tier: 'PRO' | 'ADVANCED'
  ): Promise<{ sessionId: string; url: string }> {
    try {
      // Get user from database
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        throw new Error('User not found');
      }

      // Get tier configuration
      const tierConfig = SUBSCRIPTION_TIERS[tier];
      if (!tierConfig.stripePriceId) {
        throw new Error(`Stripe Price ID not configured for ${tier} tier`);
      }

      // Get or create Stripe customer
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        if (!user.email) {
          throw new Error('User is missing email');
        }
        stripeCustomerId = await getOrCreateStripeCustomer(
          user.id,
          user.email,
          `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
        );

        // Update user with Stripe customer ID
        await db
          .update(users)
          .set({ stripeCustomerId })
          .where(eq(users.id, userId));
      }

      // Create Checkout session
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        mode: 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: tierConfig.stripePriceId,
            quantity: 1,
          },
        ],
        success_url: STRIPE_URLS.SUCCESS + '&session_id={CHECKOUT_SESSION_ID}',
        cancel_url: STRIPE_URLS.CANCEL,
        metadata: {
          userId: user.id,
          tier,
          creditAllocation: tierConfig.credits.toString(),
        },
        subscription_data: {
          metadata: {
            userId: user.id,
            tier,
          },
        },
      });

      console.log(`✅ Created checkout session for user ${user.email}: ${session.id}`);

      return {
        sessionId: session.id,
        url: session.url!,
      };
    } catch (error) {
      console.error('❌ Error creating checkout session:', error);
      throw error;
    }
  }

  /**
   * Handle successful subscription creation from webhook
   */
  async handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
    try {
      const userId = subscription.metadata.userId;
      const tier = subscription.metadata.tier as 'PRO' | 'ADVANCED';

      if (!userId || !tier) {
        console.error('❌ Missing userId or tier in subscription metadata:', subscription.metadata);
        return;
      }

      // Get tier configuration
      const tierConfig = SUBSCRIPTION_TIERS[tier];

      // Update user with subscription info
      await db
        .update(users)
        .set({
          planType: tier,
          subscriptionStatus: subscription.status,
          stripeSubscriptionId: subscription.id,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          monthlyCreditAllocation: tierConfig.credits,
          creditBalance: tierConfig.credits, // Reset credits to tier default
        })
        .where(eq(users.id, userId));

      // Create subscription record
      await db.insert(subscriptions).values({
        id: randomUUID(),
        userId,
        planType: tier,
        billingCycle: 'monthly',
        monthlyCredits: tierConfig.credits,
        pricePerMonth: tierConfig.pricePerMonth.toString(),
        status: subscription.status,
        nextRenewalDate: new Date(subscription.current_period_end * 1000),
        autoRenew: !subscription.cancel_at_period_end,
      });

      console.log(`✅ Subscription created for user ${userId}: ${tier} tier, ${tierConfig.credits} credits`);
    } catch (error) {
      console.error('❌ Error handling subscription created:', error);
      throw error;
    }
  }

  /**
   * Handle subscription update from webhook
   */
  async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    try {
      const userId = subscription.metadata.userId;

      if (!userId) {
        console.error('❌ Missing userId in subscription metadata');
        return;
      }

      // Determine new tier from price ID
      const priceId = subscription.items.data[0].price.id;
      const newTier = getTierFromPriceId(priceId);

      if (!newTier) {
        console.error('❌ Could not determine tier from price ID:', priceId);
        return;
      }

      const tierConfig = SUBSCRIPTION_TIERS[newTier];

      // Update user
      await db
        .update(users)
        .set({
          planType: newTier,
          subscriptionStatus: subscription.status,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          monthlyCreditAllocation: tierConfig.credits,
          creditBalance: tierConfig.credits, // Reset credits on tier change
        })
        .where(eq(users.id, userId));

      // Update subscription record
      await db
        .update(subscriptions)
        .set({
          planType: newTier,
          monthlyCredits: tierConfig.credits,
          pricePerMonth: tierConfig.pricePerMonth.toString(),
          status: subscription.status,
          nextRenewalDate: new Date(subscription.current_period_end * 1000),
          autoRenew: !subscription.cancel_at_period_end,
        })
        .where(eq(subscriptions.userId, userId));

      console.log(`✅ Subscription updated for user ${userId}: ${newTier} tier, ${tierConfig.credits} credits`);
    } catch (error) {
      console.error('❌ Error handling subscription updated:', error);
      throw error;
    }
  }

  /**
   * Handle subscription deletion/cancellation from webhook
   */
  async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    try {
      const userId = subscription.metadata.userId;

      if (!userId) {
        console.error('❌ Missing userId in subscription metadata');
        return;
      }

      // Downgrade user to FREE tier
      const freeTierConfig = SUBSCRIPTION_TIERS.FREE;

      await db
        .update(users)
        .set({
          planType: 'FREE',
          subscriptionStatus: 'canceled',
          stripeSubscriptionId: null,
          currentPeriodEnd: null,
          monthlyCreditAllocation: freeTierConfig.credits,
          creditBalance: freeTierConfig.credits, // Reset to free tier credits
        })
        .where(eq(users.id, userId));

      // Update subscription record
      await db
        .update(subscriptions)
        .set({
          status: 'canceled',
          autoRenew: false,
        })
        .where(eq(subscriptions.userId, userId));

      console.log(`✅ Subscription canceled for user ${userId}: downgraded to FREE tier`);
    } catch (error) {
      console.error('❌ Error handling subscription deleted:', error);
      throw error;
    }
  }

  /**
   * Create a Stripe Customer Portal session for self-service subscription management
   */
  async createCustomerPortalSession(userId: string): Promise<{ url: string }> {
    try {
      // Get user from database
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        throw new Error('User not found');
      }

      // Ensure Stripe customer exists for this user (create if missing)
      if (!user.stripeCustomerId) {
        if (!user.email) {
          throw new Error('User does not have a Stripe customer ID and is missing email');
        }
        const stripeCustomerId = await getOrCreateStripeCustomer(
          user.id,
          user.email,
          `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
        );
        await db
          .update(users)
          .set({ stripeCustomerId })
          .where(eq(users.id, userId));
        user.stripeCustomerId = stripeCustomerId as any;
      }

      // Create portal session
      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: STRIPE_URLS.SUCCESS,
      });

      console.log(`✅ Created customer portal session for user ${user.email}`);

      return { url: session.url };
    } catch (error) {
      console.error('❌ Error creating customer portal session:', error);
      throw error;
    }
  }

  /**
   * Get current subscription status for a user
   */
  async getSubscriptionStatus(userId: string) {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        throw new Error('User not found');
      }

      // Get active subscription if exists
      let subscriptionData = null;
      if (user.stripeSubscriptionId) {
        const [subscription] = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.userId, userId))
          .limit(1);

        subscriptionData = subscription ?? null;
      }

      return {
        planType: user.planType,
        subscriptionStatus: user.subscriptionStatus,
        currentPeriodEnd: user.currentPeriodEnd,
        monthlyCredits: user.monthlyCreditAllocation,
        creditBalance: user.creditBalance,
        topUpCredits: user.topUpCredits,
        stripeCustomerId: user.stripeCustomerId,
        stripeSubscriptionId: user.stripeSubscriptionId,
        subscription: subscriptionData,
      };
    } catch (error) {
      console.error('❌ Error getting subscription status:', error);
      throw error;
    }
  }

  /**
   * Reset monthly credits for all active subscribers (called by cron or on renewal)
   */
  async resetMonthlyCredits(): Promise<void> {
    try {
      // Get all users with active subscriptions
      const activeUsers = await db
        .select()
        .from(users)
        .where(eq(users.subscriptionStatus, 'active'));

      for (const user of activeUsers) {
        const tier = user.planType as 'FREE' | 'PRO' | 'ADVANCED';
        const tierConfig = SUBSCRIPTION_TIERS[tier];

        // Reset monthly credits, preserve top-up credits
        await db
          .update(users)
          .set({
            monthlyCreditAllocation: tierConfig.credits,
            creditBalance: tierConfig.credits + (user.topUpCredits || 0),
          })
          .where(eq(users.id, user.id));

        console.log(`✅ Reset monthly credits for user ${user.email}: ${tierConfig.credits} credits`);
      }

      console.log(`✅ Monthly credits reset for ${activeUsers.length} active subscribers`);
    } catch (error) {
      console.error('❌ Error resetting monthly credits:', error);
      throw error;
    }
  }

  /**
   * Handle successful invoice payment (monthly renewal)
   */
  async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    try {
      const subscriptionId = invoice.subscription as string;
      if (!subscriptionId) {
        console.log('Invoice not related to subscription, skipping');
        return;
      }

      // Get subscription to find user
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const userId = subscription.metadata.userId;

      if (!userId) {
        console.error('❌ Missing userId in subscription metadata');
        return;
      }

      // Get user and tier
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        console.error('❌ User not found:', userId);
        return;
      }

      const tier = user.planType as 'PRO' | 'ADVANCED';
      const tierConfig = SUBSCRIPTION_TIERS[tier];

      // Reset monthly credits
      await db
        .update(users)
        .set({
          monthlyCreditAllocation: tierConfig.credits,
          creditBalance: tierConfig.credits + (user.topUpCredits || 0),
        })
        .where(eq(users.id, userId));

      console.log(`✅ Invoice paid for user ${user.email}: monthly credits reset to ${tierConfig.credits}`);
    } catch (error) {
      console.error('❌ Error handling invoice payment succeeded:', error);
      throw error;
    }
  }

  /**
   * Handle failed invoice payment
   */
  async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    try {
      const subscriptionId = invoice.subscription as string;
      if (!subscriptionId) {
        console.log('Invoice not related to subscription, skipping');
        return;
      }

      // Get subscription to find user
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const userId = subscription.metadata.userId;

      if (!userId) {
        console.error('❌ Missing userId in subscription metadata');
        return;
      }

      // Update subscription status to 'past_due'
      await db
        .update(users)
        .set({
          subscriptionStatus: 'past_due',
        })
        .where(eq(users.id, userId));

      // TODO: Send email notification to user about failed payment

      console.log(`⚠️  Payment failed for user ${userId}: subscription marked as past_due`);
    } catch (error) {
      console.error('❌ Error handling invoice payment failed:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const subscriptionService = new SubscriptionService();
