import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { db } from "../../db";
import { users, referrals, creditTransactions } from "@shared/schema";
import { eq, and } from "drizzle-orm";
import { ReferralService } from "../../services/referral-service";

/**
 * Referral Flow End-to-End Integration Test
 *
 * Tests the complete referral system flow:
 * 1. Referrer generates referral code
 * 2. New user signs up with referral code
 * 3. Credits awarded to both referrer and referee
 * 4. Referral stats tracking
 * 5. Referral history and conversion tracking
 *
 * This validates that the referral system works end-to-end
 * across multiple database tables and services.
 */

describe("Referral Flow E2E Integration", () => {
  let referrerId: string;
  let refereeId: string;
  let referralCode: string;

  beforeAll(async () => {
    // Create referrer (existing user)
    const [referrer] = await db
      .insert(users)
      .values({
        email: `referrer-${Date.now()}@test.dev`,
        passwordHash: "test-hash",
        firstName: "Referrer",
        lastName: "User",
        creditBalance: 50,
      })
      .returning();

    referrerId = referrer.id;
  });

  afterAll(async () => {
    // Cleanup test data
    if (refereeId) {
      await db.delete(creditTransactions).where(eq(creditTransactions.userId, refereeId));
      await db.delete(users).where(eq(users.id, refereeId));
    }
    if (referrerId) {
      await db.delete(referrals).where(eq(referrals.referrerId, referrerId));
      await db.delete(creditTransactions).where(eq(creditTransactions.userId, referrerId));
      await db.delete(users).where(eq(users.id, referrerId));
    }
  });

  beforeEach(async () => {
    // Reset referrer's credit balance
    await db
      .update(users)
      .set({ creditBalance: 50 })
      .where(eq(users.id, referrerId));

    // Clear referrals and transactions
    await db.delete(referrals).where(eq(referrals.referrerId, referrerId));
    await db.delete(creditTransactions).where(eq(creditTransactions.userId, referrerId));
  });

  it("generates unique referral code for user", async () => {
    // Step 1: Referrer generates referral code
    const code = await ReferralService.generateReferralCode(referrerId);

    expect(code).toBeDefined();
    expect(code).toHaveLength(8); // Standard format: ABC12345
    expect(code).toMatch(/^[A-Z0-9]+$/); // Alphanumeric uppercase

    // Verify code stored in database
    const [user] = await db
      .select({ referralCode: users.referralCode })
      .from(users)
      .where(eq(users.id, referrerId))
      .limit(1);

    expect(user.referralCode).toBe(code);

    // Store for later tests
    referralCode = code;
  });

  it("prevents duplicate referral code generation", async () => {
    // Generate initial code
    const code1 = await ReferralService.generateReferralCode(referrerId);

    // Attempt to generate again (should return existing)
    const code2 = await ReferralService.generateReferralCode(referrerId);

    expect(code1).toBe(code2);

    // Verify only one code exists
    const [user] = await db
      .select({ referralCode: users.referralCode })
      .from(users)
      .where(eq(users.id, referrerId))
      .limit(1);

    expect(user.referralCode).toBe(code1);
  });

  it("completes full referral flow: code generation → new user signup → credit rewards", async () => {
    // Step 1: Referrer generates code
    referralCode = await ReferralService.generateReferralCode(referrerId);
    expect(referralCode).toBeDefined();

    // Step 2: New user signs up with referral code
    const [referee] = await db
      .insert(users)
      .values({
        email: `referee-${Date.now()}@test.dev`,
        passwordHash: "test-hash",
        firstName: "Referee",
        lastName: "User",
        creditBalance: 0,
      })
      .returning();

    refereeId = referee.id;

    // Step 3: Apply referral code
    const result = await ReferralService.applyReferralCode(refereeId, referralCode);

    expect(result.success).toBe(true);
    expect(result.creditsAwarded.referrer).toBeGreaterThan(0); // e.g., 50 credits
    expect(result.creditsAwarded.referee).toBeGreaterThan(0); // e.g., 25 credits

    // Step 4: Verify referral record created
    const referralRecords = await db
      .select()
      .from(referrals)
      .where(
        and(
          eq(referrals.referrerId, referrerId),
          eq(referrals.refereeId, refereeId)
        )
      );

    expect(referralRecords).toHaveLength(1);
    expect(referralRecords[0].status).toBe("completed");

    // Step 5: Verify credits awarded to referrer
    const [referrer] = await db
      .select({ creditBalance: users.creditBalance })
      .from(users)
      .where(eq(users.id, referrerId))
      .limit(1);

    expect(referrer.creditBalance).toBeGreaterThan(50); // Initial 50 + referral bonus

    // Step 6: Verify credits awarded to referee
    const [updatedReferee] = await db
      .select({ creditBalance: users.creditBalance })
      .from(users)
      .where(eq(users.id, refereeId))
      .limit(1);

    expect(updatedReferee.creditBalance).toBeGreaterThan(0); // Referee bonus

    // Step 7: Verify credit transactions recorded
    const referrerTransactions = await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, referrerId));

    const refereeTransactions = await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, refereeId));

    expect(referrerTransactions.length).toBeGreaterThan(0);
    expect(refereeTransactions.length).toBeGreaterThan(0);

    // Verify transaction types
    const referrerReferralTx = referrerTransactions.find(
      (tx) => tx.type === "referral_reward"
    );
    const refereeReferralTx = refereeTransactions.find(
      (tx) => tx.type === "referral_reward"
    );

    expect(referrerReferralTx).toBeDefined();
    expect(refereeReferralTx).toBeDefined();
  });

  it("prevents applying same referral code twice", async () => {
    // Generate code
    referralCode = await ReferralService.generateReferralCode(referrerId);

    // Create referee
    const [referee] = await db
      .insert(users)
      .values({
        email: `referee-duplicate-${Date.now()}@test.dev`,
        passwordHash: "test-hash",
        firstName: "Referee",
        lastName: "Duplicate",
        creditBalance: 0,
      })
      .returning();

    refereeId = referee.id;

    // First application - should succeed
    const result1 = await ReferralService.applyReferralCode(refereeId, referralCode);
    expect(result1.success).toBe(true);

    // Second application - should fail
    await expect(
      ReferralService.applyReferralCode(refereeId, referralCode)
    ).rejects.toThrow();
  });

  it("rejects invalid referral code", async () => {
    // Create referee
    const [referee] = await db
      .insert(users)
      .values({
        email: `referee-invalid-${Date.now()}@test.dev`,
        passwordHash: "test-hash",
        firstName: "Referee",
        lastName: "Invalid",
        creditBalance: 0,
      })
      .returning();

    refereeId = referee.id;

    // Apply non-existent code
    await expect(
      ReferralService.applyReferralCode(refereeId, "INVALID99")
    ).rejects.toThrow();
  });

  it("prevents self-referral", async () => {
    // Generate code
    referralCode = await ReferralService.generateReferralCode(referrerId);

    // Attempt to apply own code
    await expect(
      ReferralService.applyReferralCode(referrerId, referralCode)
    ).rejects.toThrow();
  });

  it("tracks referral stats correctly", async () => {
    // Generate code
    referralCode = await ReferralService.generateReferralCode(referrerId);

    // Create and apply referrals for multiple referees
    const refereeCount = 3;
    const refereeIds: string[] = [];

    for (let i = 0; i < refereeCount; i++) {
      const [referee] = await db
        .insert(users)
        .values({
          email: `referee-stats-${i}-${Date.now()}@test.dev`,
          passwordHash: "test-hash",
          firstName: "Referee",
          lastName: `Stats${i}`,
          creditBalance: 0,
        })
        .returning();

      refereeIds.push(referee.id);
      await ReferralService.applyReferralCode(referee.id, referralCode);
    }

    // Get referral stats
    const stats = await ReferralService.getReferralStats(referrerId);

    expect(stats.totalReferrals).toBe(refereeCount);
    expect(stats.completedReferrals).toBe(refereeCount);
    expect(stats.pendingReferrals).toBe(0);
    expect(stats.totalCreditsEarned).toBeGreaterThan(0);

    // Cleanup
    for (const id of refereeIds) {
      await db.delete(creditTransactions).where(eq(creditTransactions.userId, id));
      await db.delete(users).where(eq(users.id, id));
    }
  });

  it("retrieves user's referral history", async () => {
    // Generate code and create referrals
    referralCode = await ReferralService.generateReferralCode(referrerId);

    const [referee1] = await db
      .insert(users)
      .values({
        email: `referee-history-1-${Date.now()}@test.dev`,
        passwordHash: "test-hash",
        firstName: "Referee",
        lastName: "History1",
        creditBalance: 0,
      })
      .returning();

    await ReferralService.applyReferralCode(referee1.id, referralCode);

    // Get referral history
    const history = await ReferralService.getUserReferrals(referrerId);

    expect(history.length).toBeGreaterThan(0);
    expect(history[0]).toHaveProperty("refereeEmail");
    expect(history[0]).toHaveProperty("status");
    expect(history[0]).toHaveProperty("createdAt");
    expect(history[0].status).toBe("completed");

    // Cleanup
    await db.delete(creditTransactions).where(eq(creditTransactions.userId, referee1.id));
    await db.delete(users).where(eq(users.id, referee1.id));
  });

  it("handles referral status transitions correctly", async () => {
    // Generate code
    referralCode = await ReferralService.generateReferralCode(referrerId);

    // Create referee
    const [referee] = await db
      .insert(users)
      .values({
        email: `referee-status-${Date.now()}@test.dev`,
        passwordHash: "test-hash",
        firstName: "Referee",
        lastName: "Status",
        creditBalance: 0,
      })
      .returning();

    refereeId = referee.id;

    // Apply referral code
    await ReferralService.applyReferralCode(refereeId, referralCode);

    // Verify status is "completed"
    const [referral] = await db
      .select()
      .from(referrals)
      .where(
        and(
          eq(referrals.referrerId, referrerId),
          eq(referrals.refereeId, refereeId)
        )
      );

    expect(referral.status).toBe("completed");
    expect(referral.rewardedAt).toBeDefined();
  });

  it("maintains accurate credit balance across multiple referrals", async () => {
    // Generate code
    referralCode = await ReferralService.generateReferralCode(referrerId);

    // Get initial balance
    const [initialUser] = await db
      .select({ creditBalance: users.creditBalance })
      .from(users)
      .where(eq(users.id, referrerId))
      .limit(1);

    const initialBalance = initialUser.creditBalance;

    // Create 2 referrals
    const refereeIds: string[] = [];
    const expectedReward = 50; // Assume 50 credits per referral

    for (let i = 0; i < 2; i++) {
      const [referee] = await db
        .insert(users)
        .values({
          email: `referee-balance-${i}-${Date.now()}@test.dev`,
          passwordHash: "test-hash",
          firstName: "Referee",
          lastName: `Balance${i}`,
          creditBalance: 0,
        })
        .returning();

      refereeIds.push(referee.id);
      await ReferralService.applyReferralCode(referee.id, referralCode);
    }

    // Verify final balance
    const [finalUser] = await db
      .select({ creditBalance: users.creditBalance })
      .from(users)
      .where(eq(users.id, referrerId))
      .limit(1);

    const expectedBalance = initialBalance + (expectedReward * 2);
    expect(finalUser.creditBalance).toBe(expectedBalance);

    // Cleanup
    for (const id of refereeIds) {
      await db.delete(creditTransactions).where(eq(creditTransactions.userId, id));
      await db.delete(users).where(eq(users.id, id));
    }
  });
});
