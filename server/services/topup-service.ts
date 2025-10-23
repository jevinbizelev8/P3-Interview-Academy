import { stripe, TOPUP_PACKAGES, STRIPE_URLS, getOrCreateStripeCustomer, getTopUpFromPriceId } from '../config/stripe.js';
import { db } from '../db/index.js';
import { users, creditTransactions } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';
import { creditService } from './credit-service.js';
import Stripe from 'stripe';

export class TopUpService {
  /**
   * Create a Stripe Checkout session for credit top-up purchase
   */
  async createTopUpCheckout(
    userId: string,
    packageType: 'SMALL' | 'POPULAR' | 'BULK'
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

      // Get package configuration
      const packageConfig = TOPUP_PACKAGES[packageType];
      if (!packageConfig.stripePriceId) {
        throw new Error(`Stripe Price ID not configured for ${packageType} top-up package`);
      }

      // Get or create Stripe customer
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        stripeCustomerId = await getOrCreateStripeCustomer(
          user.id,
          user.email,
          `${user.firstName} ${user.lastName}`
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
        mode: 'payment', // One-time payment
        payment_method_types: ['card'],
        line_items: [
          {
            price: packageConfig.stripePriceId,
            quantity: 1,
          },
        ],
        success_url: STRIPE_URLS.SUCCESS + '&session_id={CHECKOUT_SESSION_ID}',
        cancel_url: STRIPE_URLS.CANCEL,
        metadata: {
          userId: user.id,
          topUpCredits: packageConfig.credits.toString(),
          packageType,
        },
      });

      console.log(`✅ Created top-up checkout session for user ${user.email}: ${packageConfig.credits} credits for $${packageConfig.price}`);

      return {
        sessionId: session.id,
        url: session.url!,
      };
    } catch (error) {
      console.error('❌ Error creating top-up checkout session:', error);
      throw error;
    }
  }

  /**
   * Process top-up payment and add credits to user account
   * Called from webhook after successful checkout
   */
  async processTopUpPayment(session: Stripe.Checkout.Session): Promise<void> {
    try {
      const userId = session.metadata?.userId;
      const creditsToAdd = parseInt(session.metadata?.topUpCredits || '0');
      const packageType = session.metadata?.packageType;

      if (!userId || !creditsToAdd) {
        console.error('❌ Missing userId or creditsToAdd in session metadata:', session.metadata);
        return;
      }

      // Get user
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        console.error('❌ User not found:', userId);
        return;
      }

      // Add credits using credit service
      await creditService.allocateCredits(
        userId,
        creditsToAdd,
        'topup',
        `Top-up purchase: ${creditsToAdd} credits ($${session.amount_total! / 100})`,
        {
          stripeSessionId: session.id,
          packageType,
        }
      );

      console.log(`✅ Top-up processed for user ${user.email}: ${creditsToAdd} credits added`);
    } catch (error) {
      console.error('❌ Error processing top-up payment:', error);
      throw error;
    }
  }

  /**
   * Get available top-up packages
   */
  getTopUpPackages() {
    return Object.entries(TOPUP_PACKAGES).map(([key, config]) => ({
      id: key,
      credits: config.credits,
      price: config.price,
      pricePerCredit: config.price / config.credits,
      savings: config.savings || 0,
      stripePriceId: config.stripePriceId,
    }));
  }

  /**
   * Get top-up purchase history for a user
   */
  async getTopUpHistory(userId: string, limit: number = 50) {
    try {
      const transactions = await db
        .select()
        .from(creditTransactions)
        .where(eq(creditTransactions.userId, userId))
        .orderBy(creditTransactions.createdAt)
        .limit(limit);

      // Filter for top-up transactions
      const topUpTransactions = transactions.filter(
        (t) => t.transactionType === 'topup'
      );

      return topUpTransactions.map((t) => ({
        id: t.id,
        credits: t.creditsAmount,
        description: t.description,
        date: t.createdAt,
        balanceAfter: t.balanceAfter,
        metadata: t.metadata,
      }));
    } catch (error) {
      console.error('❌ Error getting top-up history:', error);
      throw error;
    }
  }

  /**
   * Validate top-up package type
   */
  validatePackageType(packageType: string): packageType is 'SMALL' | 'POPULAR' | 'BULK' {
    return packageType === 'SMALL' || packageType === 'POPULAR' || packageType === 'BULK';
  }
}

// Export singleton instance
export const topUpService = new TopUpService();
