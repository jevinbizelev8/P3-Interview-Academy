import { db } from "../db";
import { users, creditTransactions, creditCosts } from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";

/**
 * Credit Management Service
 *
 * Handles all credit-related operations including:
 * - Credit checking and deduction
 * - Credit allocation and top-ups
 * - Monthly credit resets
 * - Transaction history tracking
 * - Dynamic credit cost management
 */
export class CreditService {
  /**
   * Check if user has sufficient credits for a feature
   */
  static async checkCredits(userId: string, featureName: string): Promise<{
    hasEnoughCredits: boolean;
    currentBalance: number;
    creditsNeeded: number;
    monthlyCredits: number;
    topUpCredits: number;
  }> {
    try {
      // Get user's current credit balance
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        throw new Error('User not found');
      }

      // Get the credit cost for this feature
      const creditCost = await this.getCreditCost(featureName);

      const monthlyCredits = user.monthlyCreditAllocation || 0;
      const topUpCredits = user.topUpCredits || 0;
      const currentBalance = monthlyCredits + topUpCredits;

      return {
        hasEnoughCredits: currentBalance >= creditCost,
        currentBalance,
        creditsNeeded: creditCost,
        monthlyCredits,
        topUpCredits,
      };
    } catch (error) {
      console.error('Error checking credits:', error);
      throw error;
    }
  }

  /**
   * Deduct credits from user account with transaction logging
   * Priority: Monthly credits first, then top-up credits
   *
   * SECURITY FIX: Wrapped in database transaction with row-level locking
   * to prevent race conditions (double-spending) during concurrent requests
   */
  static async deductCredits(
    userId: string,
    featureName: string,
    sessionId: string | null = null,
    description?: string
  ): Promise<{
    success: boolean;
    balanceAfter: number;
    monthlyCreditsUsed: number;
    topUpCreditsUsed: number;
    transactionId: string;
  }> {
    try {
      // Get credit cost first (outside transaction for performance)
      const creditCost = await this.getCreditCost(featureName);

      // Execute entire operation in a transaction with row-level locking
      return await db.transaction(async (tx) => {
        // Lock user row to prevent concurrent modifications (SELECT FOR UPDATE)
        // This ensures no other transaction can modify this user until we commit
        const userRows = await tx.execute<{
          id: string;
          monthlyCreditAllocation: number;
          topUpCredits: number;
          creditBalance: number;
        }>(sql`
          SELECT id, monthly_credit_allocation, top_up_credits, credit_balance
          FROM users
          WHERE id = ${userId}
          FOR UPDATE
        `);

        if (!userRows || userRows.length === 0) {
          throw new Error('User not found');
        }

        const user = userRows[0];
        const monthlyAvailable = user.monthlyCreditAllocation || 0;
        const topUpAvailable = user.topUpCredits || 0;
        const currentBalance = monthlyAvailable + topUpAvailable;

        // Check if user has enough credits
        if (currentBalance < creditCost) {
          throw new Error(
            `Insufficient credits. Required: ${creditCost}, Available: ${currentBalance}`
          );
        }

        // Calculate deduction priority: monthly credits first, then top-ups
        let monthlyCreditsUsed = 0;
        let topUpCreditsUsed = 0;

        if (monthlyAvailable >= creditCost) {
          // Use only monthly credits
          monthlyCreditsUsed = creditCost;
        } else {
          // Use all monthly credits + some top-up credits
          monthlyCreditsUsed = monthlyAvailable;
          topUpCreditsUsed = creditCost - monthlyAvailable;
        }

        const newMonthlyCredits = monthlyAvailable - monthlyCreditsUsed;
        const newTopUpCredits = topUpAvailable - topUpCreditsUsed;
        const balanceAfter = newMonthlyCredits + newTopUpCredits;

        // Update user credits within transaction
        await tx
          .update(users)
          .set({
            monthlyCreditAllocation: newMonthlyCredits,
            topUpCredits: newTopUpCredits,
            creditBalance: balanceAfter, // Keep legacy field in sync
            updatedAt: new Date(),
          })
          .where(eq(users.id, userId));

        // Log the transaction within the same transaction
        const [transaction] = await tx
          .insert(creditTransactions)
          .values({
            userId,
            transactionType: 'consumption',
            creditsAmount: -creditCost,
            balanceAfter,
            description: description || `Credit deducted for ${featureName}`,
            featureUsed: featureName,
            relatedSessionId: sessionId,
          })
          .returning();

        console.log(
          `✅ Deducted ${creditCost} credits from user ${userId} ` +
          `(${monthlyCreditsUsed} monthly + ${topUpCreditsUsed} top-up). ` +
          `Balance: ${balanceAfter}`
        );

        return {
          success: true,
          balanceAfter,
          monthlyCreditsUsed,
          topUpCreditsUsed,
          transactionId: transaction.id,
        };
      });
    } catch (error) {
      console.error('Error deducting credits:', error);
      throw error;
    }
  }

  /**
   * Add credits to user account (for admin adjustments or top-ups)
   */
  static async addCredits(
    userId: string,
    amount: number,
    type: 'allocation' | 'top-up' | 'admin-adjustment',
    reason: string,
    adminUserId?: string
  ): Promise<{
    success: boolean;
    balanceAfter: number;
    transactionId: string;
  }> {
    try {
      if (amount <= 0) {
        throw new Error('Credit amount must be positive');
      }

      // Get current user credits
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        throw new Error('User not found');
      }

      const currentMonthly = user.monthlyCreditAllocation || 0;
      const currentTopUp = user.topUpCredits || 0;

      let newMonthlyCredits = currentMonthly;
      let newTopUpCredits = currentTopUp;

      // Determine which credit pool to add to
      if (type === 'top-up' || type === 'admin-adjustment') {
        // Add to top-up credits (never expire)
        newTopUpCredits = currentTopUp + amount;
      } else {
        // Add to monthly credits (reset each cycle)
        newMonthlyCredits = currentMonthly + amount;
      }

      const balanceAfter = newMonthlyCredits + newTopUpCredits;

      // Update user credits
      await db
        .update(users)
        .set({
          monthlyCreditAllocation: newMonthlyCredits,
          topUpCredits: newTopUpCredits,
          creditBalance: balanceAfter, // Keep legacy field in sync
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      // Log the transaction
      const [transaction] = await db
        .insert(creditTransactions)
        .values({
          userId,
          transactionType: type,
          creditsAmount: amount,
          balanceAfter,
          description: adminUserId
            ? `${reason} (by admin ${adminUserId})`
            : reason,
          featureUsed: null,
          relatedSessionId: null,
        })
        .returning();

      console.log(
        `✅ Added ${amount} credits to user ${userId} (${type}). Balance: ${balanceAfter}`
      );

      return {
        success: true,
        balanceAfter,
        transactionId: transaction.id,
      };
    } catch (error) {
      console.error('Error adding credits:', error);
      throw error;
    }
  }

  /**
   * Reset monthly credits for a user (preserves top-up credits)
   * Used during monthly billing cycle resets
   */
  static async resetMonthlyCredits(
    userId: string,
    newMonthlyAllocation: number = 50 // Default to FREE tier
  ): Promise<{
    success: boolean;
    balanceAfter: number;
  }> {
    try {
      // Get current user
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        throw new Error('User not found');
      }

      const topUpCredits = user.topUpCredits || 0;
      const balanceAfter = newMonthlyAllocation + topUpCredits;

      // Reset monthly credits, preserve top-up credits
      await db
        .update(users)
        .set({
          monthlyCreditAllocation: newMonthlyAllocation,
          creditBalance: balanceAfter, // Keep legacy field in sync
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      // Log the reset transaction
      await db
        .insert(creditTransactions)
        .values({
          userId,
          transactionType: 'allocation',
          creditsAmount: newMonthlyAllocation,
          balanceAfter,
          description: `Monthly credits reset to ${newMonthlyAllocation}`,
          featureUsed: null,
          relatedSessionId: null,
        });

      console.log(
        `✅ Reset monthly credits for user ${userId} to ${newMonthlyAllocation}. ` +
        `Total balance: ${balanceAfter} (${newMonthlyAllocation} monthly + ${topUpCredits} top-up)`
      );

      return {
        success: true,
        balanceAfter,
      };
    } catch (error) {
      console.error('Error resetting monthly credits:', error);
      throw error;
    }
  }

  /**
   * Get credit transaction history for a user
   */
  static async getCreditHistory(
    userId: string,
    limit: number = 50
  ): Promise<Array<{
    id: string;
    transactionType: string;
    creditsAmount: number;
    balanceAfter: number;
    description: string;
    featureUsed: string | null;
    relatedSessionId: string | null;
    createdAt: Date | null;
  }>> {
    try {
      const transactions = await db
        .select()
        .from(creditTransactions)
        .where(eq(creditTransactions.userId, userId))
        .orderBy(desc(creditTransactions.createdAt))
        .limit(limit);

      return transactions;
    } catch (error) {
      console.error('Error fetching credit history:', error);
      throw error;
    }
  }

  /**
   * Get credit cost for a specific feature from database
   */
  static async getCreditCost(featureName: string): Promise<number> {
    try {
      const [costConfig] = await db
        .select()
        .from(creditCosts)
        .where(eq(creditCosts.featureName, featureName))
        .limit(1);

      if (!costConfig) {
        console.warn(
          `No credit cost found for feature "${featureName}", defaulting to 1 credit`
        );
        return 1; // Default cost
      }

      if (!costConfig.isActive) {
        console.warn(
          `Credit cost for feature "${featureName}" is inactive, defaulting to 1 credit`
        );
        return 1;
      }

      return costConfig.creditCost;
    } catch (error) {
      console.error('Error fetching credit cost:', error);
      return 1; // Fallback to default cost
    }
  }

  /**
   * Get total credits for a user (monthly + top-up)
   */
  static async getTotalCredits(userId: string): Promise<{
    totalCredits: number;
    monthlyCredits: number;
    topUpCredits: number;
  }> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        throw new Error('User not found');
      }

      const monthlyCredits = user.monthlyCreditAllocation || 0;
      const topUpCredits = user.topUpCredits || 0;

      return {
        totalCredits: monthlyCredits + topUpCredits,
        monthlyCredits,
        topUpCredits,
      };
    } catch (error) {
      console.error('Error fetching total credits:', error);
      throw error;
    }
  }

  /**
   * Get all credit cost configurations
   */
  static async getAllCreditCosts(): Promise<Array<{
    id: string;
    featureName: string;
    creditCost: number;
    description: string | null;
    isActive: boolean | null;
    updatedBy: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
  }>> {
    try {
      const costs = await db
        .select()
        .from(creditCosts)
        .orderBy(creditCosts.featureName);

      return costs;
    } catch (error) {
      console.error('Error fetching all credit costs:', error);
      throw error;
    }
  }
}
