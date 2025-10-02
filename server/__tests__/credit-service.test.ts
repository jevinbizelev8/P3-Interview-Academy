import { beforeEach, describe, expect, it, vi } from "vitest";

const storageMocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  updateUserBillingCycle: vi.fn(),
  adjustUserCredits: vi.fn(),
  recordCreditLedger: vi.fn(),
  recordUsageEvent: vi.fn(),
  getUserUsageSummary: vi.fn(),
  getRecentCreditLedger: vi.fn(),
  getRecentUsageEvents: vi.fn(),
}));

vi.mock("../storage.js", () => ({
  storage: storageMocks,
}));

describe("credit service", () => {
  beforeEach(async () => {
    Object.values(storageMocks).forEach(mockFn => mockFn.mockReset?.());
    await vi.resetModules();
  });

  it("guards against concurrent credit deductions dropping balance below zero", async () => {
    const { creditService, InsufficientCreditsError } = await import("../services/credit-service.js");

    const cycleStart = new Date("2025-01-01T00:00:00Z");
    const cycleEnd = new Date("2025-02-01T00:00:00Z");

    storageMocks.getUser
      .mockResolvedValueOnce({
        id: "user-1",
        accountTier: "paid",
        creditBalance: 5,
        monthlyCreditAllocation: 100,
        billingCycleStart: cycleStart,
        billingCycleEnd: cycleEnd,
      })
      .mockResolvedValueOnce({
        id: "user-1",
        accountTier: "paid",
        creditBalance: 3,
        monthlyCreditAllocation: 100,
        billingCycleStart: cycleStart,
        billingCycleEnd: cycleEnd,
      });

    storageMocks.adjustUserCredits.mockResolvedValueOnce(undefined);

    let thrown: unknown;
    try {
      await creditService.consumeCredits("user-1", "practice", 5);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(InsufficientCreditsError);
    expect(storageMocks.adjustUserCredits).toHaveBeenCalledWith("user-1", -5, { preventNegative: true });
    expect(storageMocks.recordCreditLedger).not.toHaveBeenCalled();
    expect(storageMocks.recordUsageEvent).not.toHaveBeenCalled();

    if (thrown instanceof InsufficientCreditsError) {
      expect(thrown.required).toBe(5);
      expect(thrown.available).toBe(3);
    }
  });
});
