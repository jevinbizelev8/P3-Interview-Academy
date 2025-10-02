import { storage } from "../storage.js";
import {
  type UpsertUser,
  type User,
} from "../../shared/schema.js";
import type {
  CreditLedgerSnapshot,
  UsageEventSnapshot,
  UserCreditSummary,
} from "@shared/types";

const DEFAULT_ALLOCATIONS: Record<string, number> = {
  free: 20,
  paid: 100,
};

export class InsufficientCreditsError extends Error {
  constructor(public required: number, public available: number) {
    super(`Insufficient credits: required ${required}, available ${available}`);
    this.name = "InsufficientCreditsError";
  }
}

class CreditService {
  private addOneMonth(date: Date): Date {
    const result = new Date(date.getTime());
    result.setMonth(result.getMonth() + 1);
    return result;
  }

  private resolveAllocation(tier?: string | null, override?: number): number {
    if (typeof override === "number" && !Number.isNaN(override)) {
      return override;
    }

    if (!tier) {
      return DEFAULT_ALLOCATIONS.free;
    }

    const normalizedTier = tier.toLowerCase();
    return DEFAULT_ALLOCATIONS[normalizedTier] ?? DEFAULT_ALLOCATIONS.free;
  }

  async initializeUserAccount(
    userId: string,
    tier: string,
    monthlyCredits?: number,
  ): Promise<User> {
    const allocation = this.resolveAllocation(tier, monthlyCredits);
    const start = new Date();
    const end = this.addOneMonth(start);

    const updatedUser = await storage.updateUserBillingCycle(userId, {
      accountTier: tier,
      monthlyCreditAllocation: allocation,
      creditBalance: allocation,
      billingCycleStart: start,
      billingCycleEnd: end,
    });

    await storage.recordCreditLedger({
      userId,
      amount: allocation,
      balanceAfter: updatedUser.creditBalance ?? allocation,
      reason: "initial_allocation",
      metadata: { tier },
    });

    return updatedUser;
  }

  private async ensureBillingCycle(user: User): Promise<User> {
    const now = new Date();
    const allocation = this.resolveAllocation(user.accountTier, user.monthlyCreditAllocation ?? undefined);

    if (!user.billingCycleEnd || !user.billingCycleStart || now >= user.billingCycleEnd) {
      const start = now;
      const end = this.addOneMonth(start);

      const updatedUser = await storage.updateUserBillingCycle(user.id, {
        billingCycleStart: start,
        billingCycleEnd: end,
        monthlyCreditAllocation: allocation,
        creditBalance: allocation,
      });

      await storage.recordCreditLedger({
        userId: user.id,
        amount: allocation,
        balanceAfter: updatedUser.creditBalance ?? allocation,
        reason: user.billingCycleEnd ? "cycle_reset" : "cycle_init",
        metadata: { tier: updatedUser.accountTier },
      });

      return updatedUser;
    }

    return user;
  }

  async consumeCredits(
    userId: string,
    module: string,
    amount: number,
    sessionId?: string,
  ): Promise<User> {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    const refreshedUser = await this.ensureBillingCycle(user);
    const available = refreshedUser.creditBalance ?? 0;

    if (available < amount) {
      throw new InsufficientCreditsError(amount, available);
    }

    const updatedUser = await storage.adjustUserCredits(userId, -amount);

    await storage.recordCreditLedger({
      userId,
      amount: -amount,
      balanceAfter: updatedUser.creditBalance ?? available - amount,
      reason: "session_start",
      module,
      sessionId,
      metadata: { module, sessionId },
    });

    await storage.recordUsageEvent({
      userId,
      module,
      sessionId,
      creditsConsumed: amount,
      metadata: { module, sessionId },
    });

    return updatedUser;
  }

  async getUserSummary(userId: string): Promise<UserCreditSummary> {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    const refreshedUser = await this.ensureBillingCycle(user);

    const usageSummary = await storage.getUserUsageSummary(userId);
    const recentLedgerRaw = await storage.getRecentCreditLedger(userId, 10);
    const recentUsageRaw = await storage.getRecentUsageEvents(userId, 10);

    const recentLedger: CreditLedgerSnapshot[] = recentLedgerRaw.map((entry) => ({
      id: entry.id,
      amount: entry.amount,
      balanceAfter: entry.balanceAfter,
      reason: entry.reason,
      module: entry.module,
      sessionId: entry.sessionId,
      metadata: entry.metadata as Record<string, unknown> | null,
      createdAt: entry.createdAt ?? new Date(),
    }));

    const recentUsageEvents: UsageEventSnapshot[] = recentUsageRaw.map((event) => ({
      id: event.id,
      module: event.module,
      sessionId: event.sessionId,
      creditsConsumed: event.creditsConsumed,
      occurredAt: event.occurredAt ?? new Date(),
      metadata: event.metadata as Record<string, unknown> | null,
    }));

    return {
      userId,
      accountTier: refreshedUser.accountTier ?? "free",
      monthlyCreditAllocation: refreshedUser.monthlyCreditAllocation ?? this.resolveAllocation(refreshedUser.accountTier),
      creditBalance: refreshedUser.creditBalance ?? 0,
      billingCycleStart: refreshedUser.billingCycleStart ?? null,
      billingCycleEnd: refreshedUser.billingCycleEnd ?? null,
      totalCreditsConsumed: usageSummary.totalCreditsConsumed,
      breakdown: usageSummary.breakdown,
      recentLedger,
      recentUsageEvents,
    };
  }

  async adminAdjustUserCredits(
    userId: string,
    updates: {
      accountTier?: string;
      monthlyCredits?: number;
      creditBalance?: number;
      reason?: string;
    },
  ): Promise<UserCreditSummary> {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error(`User not found: ${userId}`);
    }

    const adminReason = updates.reason ?? null;
    const patch: Partial<UpsertUser> = {};

    const previousAllocation = user.monthlyCreditAllocation ?? this.resolveAllocation(user.accountTier);
    const previousBalance = user.creditBalance ?? 0;

    let effectiveTier = updates.accountTier ?? user.accountTier ?? "free";
    let allocationChanged = false;
    let newAllocationValue = previousAllocation;

    if (updates.accountTier) {
      patch.accountTier = updates.accountTier;
      effectiveTier = updates.accountTier;
      if (typeof updates.monthlyCredits === "undefined") {
        allocationChanged = true;
        newAllocationValue = this.resolveAllocation(effectiveTier);
        patch.monthlyCreditAllocation = newAllocationValue;
      }
    }

    if (typeof updates.monthlyCredits === "number" && !Number.isNaN(updates.monthlyCredits)) {
      allocationChanged = true;
      newAllocationValue = this.resolveAllocation(effectiveTier, updates.monthlyCredits);
      patch.monthlyCreditAllocation = newAllocationValue;
    }

    let balanceChanged = false;
    let newBalance = previousBalance;
    if (typeof updates.creditBalance === "number" && !Number.isNaN(updates.creditBalance)) {
      balanceChanged = true;
      newBalance = updates.creditBalance;
      patch.creditBalance = newBalance;
    }

    const updatedUser = Object.keys(patch).length > 0
      ? await storage.updateUser(userId, patch)
      : user;

    if (allocationChanged && newAllocationValue !== previousAllocation) {
      await storage.recordCreditLedger({
        userId,
        amount: 0,
        balanceAfter: updatedUser.creditBalance ?? newBalance,
        reason: "allocation_update",
        metadata: {
          previousAllocation,
          newAllocation: newAllocationValue,
          adminReason,
        },
      });
    }

    if (balanceChanged) {
      const delta = newBalance - previousBalance;
      if (delta !== 0) {
        await storage.recordCreditLedger({
          userId,
          amount: delta,
          balanceAfter: updatedUser.creditBalance ?? newBalance,
          reason: "manual_adjustment",
          metadata: {
            previousBalance,
            newBalance,
            adminReason,
          },
        });
      }
    }

    return this.getUserSummary(userId);
  }
}

export const creditService = new CreditService();
