import cron from 'node-cron';
import { db } from '../db/index.js';
import { users, creditTransactions } from '@shared/schema';
import { eq, lt } from 'drizzle-orm';
import { sendCreditResetEmail } from './email-service.js';

/**
 * Credit Reset Cron Service
 *
 * Purpose: Automatically reset monthly subscription credits at the start of each billing cycle
 *
 * Features:
 * - Runs daily at midnight UTC (0 0 * * *)
 * - Resets monthly credits based on user's plan tier
 * - Preserves top-up credits (they never expire)
 * - Logs all resets to credit_transactions table
 * - Sends email notifications to users
 * - Error handling and logging for reliability
 *
 * Credit Allocation by Tier:
 * - FREE: 50 credits/month
 * - PRO: 100 credits/month
 * - ADVANCED: 280 credits/month
 */

const TIER_CREDITS = {
  FREE: 50,
  PRO: 100,
  ADVANCED: 280,
} as const;

/**
 * Reset credits for users whose billing cycle has ended
 */
export async function resetExpiredCredits(): Promise<{
  success: number;
  failed: number;
  total: number;
}> {
  const startTime = Date.now();
  console.log('[credit-reset] Starting credit reset job at', new Date().toISOString());

  let successCount = 0;
  let failedCount = 0;

  try {
    // Find all users whose current period has ended
    const now = new Date();
    const usersToReset = await db
      .select()
      .from(users)
      .where(lt(users.currentPeriodEnd, now));

    console.log(`[credit-reset] Found ${usersToReset.length} users with expired billing cycles`);

    if (usersToReset.length === 0) {
      console.log('[credit-reset] No users to reset. Job complete.');
      return { success: 0, failed: 0, total: 0 };
    }

    // Process each user
    for (const user of usersToReset) {
      try {
        await resetUserCredits(user);
        successCount++;
      } catch (error: any) {
        console.error(`[credit-reset] Failed to reset credits for user ${user.id}:`, error.message);
        failedCount++;
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[credit-reset] Job complete in ${duration}ms: ${successCount} success, ${failedCount} failed`);

    return { success: successCount, failed: failedCount, total: usersToReset.length };
  } catch (error: any) {
    console.error('[credit-reset] Fatal error in credit reset job:', error);
    throw error;
  }
}

/**
 * Reset credits for a single user
 */
async function resetUserCredits(user: any): Promise<void> {
  const userId = user.id;
  const planType = user.planType || 'FREE';
  const newMonthlyCredits = TIER_CREDITS[planType as keyof typeof TIER_CREDITS] || TIER_CREDITS.FREE;

  // Preserve top-up credits (they never expire)
  const topUpCredits = user.topUpCredits || 0;
  const newTotalCredits = newMonthlyCredits + topUpCredits;

  // Calculate next billing period end (1 month from now)
  const nextPeriodEnd = new Date();
  nextPeriodEnd.setMonth(nextPeriodEnd.getMonth() + 1);

  console.log(`[credit-reset] Resetting user ${userId}: ${planType} tier, ${newMonthlyCredits} monthly credits, ${topUpCredits} top-up credits preserved`);

  // Update user credits
  await db
    .update(users)
    .set({
      monthlyCreditAllocation: newMonthlyCredits,
      creditBalance: newTotalCredits,
      currentPeriodEnd: nextPeriodEnd,
    })
    .where(eq(users.id, userId));

  // Log transaction
  await db.insert(creditTransactions).values({
    userId,
    transactionType: 'allocation',
    creditsAmount: newMonthlyCredits,
    balanceAfter: newTotalCredits,
    description: `Monthly credits reset: ${planType} tier (${newMonthlyCredits} credits). Top-up credits preserved: ${topUpCredits}`,
    featureUsed: null,
    relatedSessionId: null,
  });

  // Send email notification
  try {
    await sendCreditResetEmail(
      user.email,
      user.username || user.email.split('@')[0],
      newMonthlyCredits,
      topUpCredits,
      planType,
      nextPeriodEnd
    );
    console.log(`[credit-reset] Email sent to ${user.email}`);
  } catch (emailError: any) {
    // Don't fail the reset if email fails
    console.error(`[credit-reset] Failed to send email to ${user.email}:`, emailError.message);
  }
}

/**
 * Startup credit reset fallback
 * Checks and resets credits for any users who missed the cron job
 * (e.g., if server was down during scheduled run)
 */
export async function runStartupCreditReset(): Promise<void> {
  console.log('[credit-reset] Running startup credit reset fallback...');

  try {
    const result = await resetExpiredCredits();

    if (result.total > 0) {
      console.log(`[credit-reset] Startup fallback completed: ${result.success}/${result.total} users reset`);
    } else {
      console.log('[credit-reset] Startup fallback: No users needed reset');
    }
  } catch (error: any) {
    console.error('[credit-reset] Startup fallback failed:', error.message);
    // Don't throw - allow server to continue starting
  }
}

/**
 * Initialize and start the credit reset cron job
 * Runs daily at midnight UTC (0 0 * * *)
 */
export function initializeCreditResetCron(): void {
  console.log('[credit-reset] Initializing credit reset cron job');
  console.log('[credit-reset] Schedule: Daily at midnight UTC (0 0 * * *)');

  // Schedule cron job: Daily at midnight UTC
  const cronJob = cron.schedule('0 0 * * *', async () => {
    console.log('[credit-reset] Cron job triggered at', new Date().toISOString());

    try {
      await resetExpiredCredits();
    } catch (error: any) {
      console.error('[credit-reset] Cron job failed:', error);
      // Log to error monitoring service if available
    }
  }, {
    scheduled: true,
    timezone: 'UTC',
  });

  console.log('[credit-reset] Cron job initialized successfully');
  console.log('[credit-reset] Next run:', cronJob.nextDates(1).toString());

  // Return the cron job for potential management (stop/start)
  return cronJob;
}

/**
 * Manual trigger for testing
 * Can be called via admin API endpoint for manual credit reset
 */
export async function manualCreditReset(userId?: string): Promise<any> {
  console.log('[credit-reset] Manual credit reset triggered', userId ? `for user ${userId}` : 'for all expired users');

  if (userId) {
    // Reset specific user
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (user.length === 0) {
      throw new Error(`User not found: ${userId}`);
    }

    await resetUserCredits(user[0]);
    return { success: true, message: `Credits reset for user ${userId}` };
  } else {
    // Reset all expired users
    const result = await resetExpiredCredits();
    return {
      success: true,
      message: `Credit reset complete: ${result.success}/${result.total} users reset`,
      ...result,
    };
  }
}
