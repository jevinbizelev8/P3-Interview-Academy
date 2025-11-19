import { db } from "../db";
import {
  referrals,
  users,
  type Referral,
  type InsertReferral,
} from "@shared/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import crypto from "crypto";
import { CreditService } from "./credit-service";

/**
 * Referral Service
 *
 * Handles referral code generation and tracking including:
 * - Unique referral code generation
 * - Referral application with credit rewards
 * - Referral statistics and tracking
 * - Reward distribution for successful referrals
 */
export class ReferralService {
  /**
   * Generate a unique referral code for a user
   */
  static async generateReferralCode(userId: string): Promise<string> {
    try {
      // Check if user already has a referral code
      const [user] = await db
        .select({ referralCode: users.referralCode })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user?.referralCode) {
        console.log(`✅ User ${userId} already has referral code: ${user.referralCode}`);
        return user.referralCode;
      }

      // Generate unique code (8 characters, alphanumeric uppercase)
      let referralCode: string;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!isUnique && attempts < maxAttempts) {
        referralCode = this.generateRandomCode();

        // Check if code already exists
        const [existing] = await db
          .select()
          .from(users)
          .where(eq(users.referralCode, referralCode))
          .limit(1);

        if (!existing) {
          isUnique = true;

          // Update user with new referral code
          await db
            .update(users)
            .set({
              referralCode,
              updatedAt: new Date(),
            })
            .where(eq(users.id, userId));

          console.log(`✅ Generated referral code for user ${userId}: ${referralCode}`);
          return referralCode!;
        }

        attempts++;
      }

      throw new Error("Failed to generate unique referral code after multiple attempts");
    } catch (error) {
      console.error("❌ Error generating referral code:", error);
      throw new Error(`Failed to generate referral code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get user's referral code (generate if doesn't exist)
   */
  static async getUserReferralCode(userId: string): Promise<{
    code: string;
    referralUrl: string;
  }> {
    try {
      const [user] = await db
        .select({ referralCode: users.referralCode })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      let code = user?.referralCode;

      // Generate if doesn't exist
      if (!code) {
        code = await this.generateReferralCode(userId);
      }

      const baseUrl = process.env.APP_URL_PROD || process.env.APP_URL_DEV || "http://localhost:5000";
      const referralUrl = `${baseUrl}/signup?ref=${code}`;

      return {
        code,
        referralUrl,
      };
    } catch (error) {
      console.error("❌ Error getting referral code:", error);
      throw new Error(`Failed to get referral code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Apply a referral code (when a new user signs up with a referral)
   */
  static async applyReferralCode(
    referralCode: string,
    referredEmail: string,
    referredUserId?: string
  ): Promise<Referral> {
    try {
      // Find the referrer by code
      const [referrer] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.referralCode, referralCode))
        .limit(1);

      if (!referrer) {
        throw new Error("Invalid referral code");
      }

      // Prevent self-referral
      if (referredUserId && referrer.id === referredUserId) {
        throw new Error("Cannot use your own referral code");
      }

      // Check if referral already exists for this email
      const [existingReferral] = await db
        .select()
        .from(referrals)
        .where(
          and(
            eq(referrals.referrerId, referrer.id),
            eq(referrals.referredEmail, referredEmail)
          )
        )
        .limit(1);

      if (existingReferral) {
        console.log(`⚠️  Referral already exists for ${referredEmail}`);
        return existingReferral;
      }

      // Create referral record
      const referralData: InsertReferral = {
        referrerId: referrer.id,
        referralCode,
        referredEmail,
        referredUserId: referredUserId || null,
        status: referredUserId ? "completed" : "pending",
        rewardType: "credits",
        rewardValue: 10, // 10 credits for both parties
        rewardGiven: false,
        signedUpAt: referredUserId ? new Date() : null,
      };

      const [referral] = await db
        .insert(referrals)
        .values(referralData)
        .returning();

      console.log(
        `✅ Created referral: ${referredEmail} referred by user ${referrer.id}`
      );

      // Award credits if referred user has signed up
      if (referredUserId && !referral.rewardGiven) {
        await this.awardReferralCredits(referral.id);
      }

      return referral;
    } catch (error) {
      console.error("❌ Error applying referral code:", error);
      throw new Error(`Failed to apply referral code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Award credits to both referrer and referred user
   */
  static async awardReferralCredits(referralId: string): Promise<void> {
    try {
      const [referral] = await db
        .select()
        .from(referrals)
        .where(eq(referrals.id, referralId))
        .limit(1);

      if (!referral) {
        throw new Error("Referral not found");
      }

      if (referral.rewardGiven) {
        console.log(`⚠️  Rewards already given for referral ${referralId}`);
        return;
      }

      if (!referral.referredUserId) {
        throw new Error("Cannot award credits: referred user hasn't signed up yet");
      }

      const rewardAmount = referral.rewardValue || 10;

      // Award credits to referrer
      await CreditService.addCredits(
        referral.referrerId,
        rewardAmount,
        'top-up',
        `Referral reward for referring ${referral.referredEmail}`
      );

      // Award credits to referred user
      await CreditService.addCredits(
        referral.referredUserId,
        rewardAmount,
        'top-up',
        `Welcome bonus for using referral code ${referral.referralCode}`
      );

      // Mark rewards as given
      await db
        .update(referrals)
        .set({
          rewardGiven: true,
          rewardGivenAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(referrals.id, referralId));

      console.log(
        `✅ Awarded ${rewardAmount} credits to both referrer and referee for referral ${referralId}`
      );
    } catch (error) {
      console.error("❌ Error awarding referral credits:", error);
      throw new Error(`Failed to award referral credits: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get referral statistics for a user
   */
  static async getReferralStats(userId: string): Promise<{
    totalReferrals: number;
    completedReferrals: number;
    pendingReferrals: number;
    totalCreditsEarned: number;
    referralCode: string;
    referralUrl: string;
  }> {
    try {
      // Get user's referral code
      const { code, referralUrl } = await this.getUserReferralCode(userId);

      // Get all referrals by this user
      const userReferrals = await db
        .select()
        .from(referrals)
        .where(eq(referrals.referrerId, userId));

      const totalReferrals = userReferrals.length;
      const completedReferrals = userReferrals.filter(
        (r) => r.status === "completed"
      ).length;
      const pendingReferrals = userReferrals.filter(
        (r) => r.status === "pending"
      ).length;

      // Calculate total credits earned (only from completed referrals where reward was given)
      const totalCreditsEarned = userReferrals
        .filter((r) => r.rewardGiven)
        .reduce((sum, r) => sum + (r.rewardValue || 0), 0);

      console.log(
        `✅ Retrieved referral stats for user ${userId}: ${totalReferrals} total, ${completedReferrals} completed`
      );

      return {
        totalReferrals,
        completedReferrals,
        pendingReferrals,
        totalCreditsEarned,
        referralCode: code,
        referralUrl,
      };
    } catch (error) {
      console.error("❌ Error getting referral stats:", error);
      throw new Error(`Failed to get referral stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get list of user's referrals
   */
  static async getUserReferrals(
    userId: string,
    limit: number = 50
  ): Promise<Referral[]> {
    try {
      const userReferrals = await db
        .select()
        .from(referrals)
        .where(eq(referrals.referrerId, userId))
        .orderBy(desc(referrals.createdAt))
        .limit(limit);

      console.log(
        `✅ Retrieved ${userReferrals.length} referral(s) for user ${userId}`
      );
      return userReferrals;
    } catch (error) {
      console.error("❌ Error getting user referrals:", error);
      throw new Error(`Failed to get user referrals: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate a random alphanumeric code
   */
  private static generateRandomCode(): string {
    // Generate 8-character uppercase alphanumeric code
    const bytes = crypto.randomBytes(6);
    const code = bytes.toString("base64")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase()
      .substring(0, 8);

    // Ensure we have exactly 8 characters (pad if needed)
    return code.padEnd(8, "A");
  }
}
