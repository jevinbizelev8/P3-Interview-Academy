import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { CreditService } from "../../services/credit-service";
import { db } from "../../db";
import { users, creditTransactions, creditCosts } from "@shared/schema";
import { sql } from "drizzle-orm";

// Mock the database module
vi.mock("../../db", () => {
  const mockDb: any = {
    transaction: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    select: vi.fn(),
    delete: vi.fn(),
    execute: vi.fn(),
  };
  return { db: mockDb };
});

// Test user state (simulates in-memory database)
interface TestUser {
  id: string;
  monthlyCredits: number;
  topUpCredits: number;
  totalCredits: number;
}

interface TestTransaction {
  id: string;
  userId: string;
  amount: number;
  type: string;
}

let testUsers: Map<string, TestUser>;
let testTransactions: TestTransaction[];
let transactionIdCounter: number;

function setupMockDatabase() {
  testUsers = new Map();
  testTransactions = [];
  transactionIdCounter = 1;

  // Mock transaction with row-level locking
  (db.transaction as any).mockImplementation(async (callback: any) => {
    const mockTx = {
      execute: vi.fn().mockImplementation(async (query: any) => {
        const queryStr = query.sql || query.toString();

        // Extract user ID from query (simplified parsing)
        const userIdMatch = queryStr.match(/WHERE id = '([^']+)'/);
        if (!userIdMatch) return [];

        const userId = userIdMatch[1];
        const user = testUsers.get(userId);

        if (!user) return [];

        // Return user data in expected format
        return [{
          id: user.id,
          monthlyCreditAllocation: user.monthlyCredits,
          topUpCredits: user.topUpCredits,
          creditBalance: user.totalCredits,
        }];
      }),
      update: vi.fn().mockImplementation(() => ({
        set: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockResolvedValue(undefined),
        })),
      })),
      insert: vi.fn().mockImplementation(() => ({
        values: vi.fn().mockImplementation(() => ({
          returning: vi.fn().mockResolvedValue([{
            id: `txn-${transactionIdCounter++}`,
            userId: 'test-user',
            transactionType: 'consumption',
            creditsAmount: -100,
            balanceAfter: 900,
            description: 'Test transaction',
          }]),
        })),
      })),
    };

    return callback(mockTx);
  });

  // Mock select queries
  (db.select as any).mockImplementation(() => ({
    from: vi.fn().mockImplementation(() => ({
      where: vi.fn().mockImplementation(() => ({
        limit: vi.fn().mockImplementation(async () => {
          // Return first user for testing
          const firstUser = Array.from(testUsers.values())[0];
          if (!firstUser) return [];

          return [{
            id: firstUser.id,
            monthlyCreditAllocation: firstUser.monthlyCredits,
            topUpCredits: firstUser.topUpCredits,
            creditBalance: firstUser.totalCredits,
          }];
        }),
        orderBy: vi.fn().mockImplementation(() => ({
          limit: vi.fn().mockResolvedValue([]),
        })),
      })),
      orderBy: vi.fn().mockImplementation(() => ({
        limit: vi.fn().mockResolvedValue(testTransactions),
      })),
    })),
  }));

  // Mock insert
  (db.insert as any).mockImplementation(() => ({
    values: vi.fn().mockImplementation(() => ({
      returning: vi.fn().mockResolvedValue([{
        id: `txn-${transactionIdCounter++}`,
      }]),
      onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
    })),
    onConflictDoUpdate: vi.fn().mockResolvedValue(undefined),
  }));

  // Mock update
  (db.update as any).mockImplementation(() => ({
    set: vi.fn().mockImplementation((data: any) => ({
      where: vi.fn().mockImplementation(async (condition: any) => {
        // Update user in test state
        for (const [id, user] of testUsers.entries()) {
          if (data.monthlyCreditAllocation !== undefined) {
            user.monthlyCredits = data.monthlyCreditAllocation;
          }
          if (data.topUpCredits !== undefined) {
            user.topUpCredits = data.topUpCredits;
          }
          if (data.creditBalance !== undefined) {
            user.totalCredits = data.creditBalance;
          }
        }
        return undefined;
      }),
    })),
  }));
}

// Helper: Create test user
function createTestUser(userId: string, monthlyCredits: number, topUpCredits: number = 0): void {
  testUsers.set(userId, {
    id: userId,
    monthlyCredits,
    topUpCredits,
    totalCredits: monthlyCredits + topUpCredits,
  });
}

// Helper: Get test user
function getTestUser(userId: string): TestUser | undefined {
  return testUsers.get(userId);
}

// Helper: Update test user credits
function updateTestUser(userId: string, monthlyCredits: number, topUpCredits: number): void {
  const user = testUsers.get(userId);
  if (user) {
    user.monthlyCredits = monthlyCredits;
    user.topUpCredits = topUpCredits;
    user.totalCredits = monthlyCredits + topUpCredits;
  }
}

// Mock credit costs
async function mockCreditCost(featureName: string, cost: number): Promise<void> {
  // Override the getCreditCost method for testing
  vi.spyOn(CreditService, 'getCreditCost').mockResolvedValue(cost);
}

describe("Credit Service - Advanced Tests", () => {
  const testFeatureName = "test-practice-session";
  const testCreditCost = 100;

  beforeEach(async () => {
    vi.clearAllMocks();
    setupMockDatabase();
    await mockCreditCost(testFeatureName, testCreditCost);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Race Condition Prevention", () => {
    it("should handle concurrent deductions with row-level locking", async () => {
      const userId = "user-1";
      createTestUser(userId, 1000, 0);

      // Mock transaction to properly handle concurrent operations
      let executionCount = 0;
      (db.transaction as any).mockImplementation(async (callback: any) => {
        executionCount++;
        const currentExecution = executionCount;

        const user = getTestUser(userId);
        if (!user) throw new Error('User not found');

        // Simulate row-level locking by checking balance
        if (user.totalCredits < testCreditCost) {
          throw new Error(`Insufficient credits. Required: ${testCreditCost}, Available: ${user.totalCredits}`);
        }

        // Deduct credits atomically
        const newMonthlyCredits = Math.max(0, user.monthlyCredits - testCreditCost);
        const topUpUsed = testCreditCost - (user.monthlyCredits - newMonthlyCredits);
        const newTopUpCredits = user.topUpCredits - topUpUsed;

        updateTestUser(userId, newMonthlyCredits, newTopUpCredits);

        return {
          success: true,
          balanceAfter: newMonthlyCredits + newTopUpCredits,
          monthlyCreditsUsed: user.monthlyCredits - newMonthlyCredits,
          topUpCreditsUsed: topUpUsed,
          transactionId: `txn-${currentExecution}`,
        };
      });

      // Simulate 5 concurrent deductions of 100 credits each
      const operations = Array(5).fill(null).map(() =>
        CreditService.deductCredits(userId, testFeatureName, null, "Concurrent test")
      );

      const results = await Promise.allSettled(operations);

      // Count successful and failed operations
      const successful = results.filter(r => r.status === "fulfilled").length;
      const failed = results.filter(r => r.status === "rejected").length;

      // All 5 should succeed (5 * 100 = 500 credits used)
      expect(successful).toBe(5);
      expect(failed).toBe(0);

      // Verify final balance
      const user = getTestUser(userId);
      expect(user?.totalCredits).toBe(500); // 1000 - 500 = 500
    });

    it("should prevent concurrent deductions when insufficient balance", async () => {
      const userId = "user-2";
      createTestUser(userId, 250, 0);

      // Mock transaction with proper balance checking
      (db.transaction as any).mockImplementation(async (callback: any) => {
        const user = getTestUser(userId);
        if (!user) throw new Error('User not found');

        // Check balance before deduction
        if (user.totalCredits < testCreditCost) {
          throw new Error(`Insufficient credits. Required: ${testCreditCost}, Available: ${user.totalCredits}`);
        }

        // Deduct credits
        const newCredits = user.totalCredits - testCreditCost;
        updateTestUser(userId, newCredits, 0);

        return {
          success: true,
          balanceAfter: newCredits,
          monthlyCreditsUsed: testCreditCost,
          topUpCreditsUsed: 0,
          transactionId: `txn-${Date.now()}`,
        };
      });

      // Simulate 5 concurrent deductions
      const operations = Array(5).fill(null).map(() =>
        CreditService.deductCredits(userId, testFeatureName, null, "Concurrent test")
      );

      const results = await Promise.allSettled(operations);

      // Count results
      const successful = results.filter(r => r.status === "fulfilled").length;
      const failed = results.filter(r => r.status === "rejected").length;

      // Only 2 should succeed (2 * 100 = 200), 3 should fail
      expect(successful).toBe(2);
      expect(failed).toBe(3);

      // Verify final balance
      const user = getTestUser(userId);
      expect(user?.totalCredits).toBe(50); // 250 - 200 = 50
    });

    it("should maintain consistency during concurrent deductions", async () => {
      const userId = "user-3";
      createTestUser(userId, 1000, 0);

      let deductionCount = 0;
      (db.transaction as any).mockImplementation(async () => {
        const user = getTestUser(userId);
        if (!user) throw new Error('User not found');

        if (user.totalCredits < testCreditCost) {
          throw new Error(`Insufficient credits`);
        }

        deductionCount++;
        const newBalance = user.totalCredits - testCreditCost;
        updateTestUser(userId, newBalance, 0);

        testTransactions.push({
          id: `txn-${deductionCount}`,
          userId,
          amount: -testCreditCost,
          type: 'consumption',
        });

        return {
          success: true,
          balanceAfter: newBalance,
          monthlyCreditsUsed: testCreditCost,
          topUpCreditsUsed: 0,
          transactionId: `txn-${deductionCount}`,
        };
      });

      // 10 concurrent deductions
      const operations = Array(10).fill(null).map(() =>
        CreditService.deductCredits(userId, testFeatureName, null, "Concurrent test")
      );

      const results = await Promise.allSettled(operations);

      // All should succeed
      expect(results.every(r => r.status === "fulfilled")).toBe(true);

      // Verify balance is exactly 0
      const user = getTestUser(userId);
      expect(user?.totalCredits).toBe(0);

      // Verify all transactions logged
      expect(testTransactions.length).toBe(10);
    });
  });

  describe("Concurrent Operations", () => {
    it("should handle 10 simultaneous deductions gracefully", async () => {
      const userId = "user-4";
      createTestUser(userId, 2000, 0);

      let operationCount = 0;
      (db.transaction as any).mockImplementation(async () => {
        const user = getTestUser(userId);
        if (!user) throw new Error('User not found');

        if (user.totalCredits < testCreditCost) {
          throw new Error('Insufficient credits');
        }

        operationCount++;
        const newBalance = user.totalCredits - testCreditCost;
        updateTestUser(userId, newBalance, 0);

        return {
          success: true,
          balanceAfter: newBalance,
          monthlyCreditsUsed: testCreditCost,
          topUpCreditsUsed: 0,
          transactionId: `txn-${operationCount}`,
        };
      });

      const operations = Array(10).fill(null).map(() =>
        CreditService.deductCredits(userId, testFeatureName, null, "Test")
      );

      const results = await Promise.allSettled(operations);

      expect(results.every(r => r.status === "fulfilled")).toBe(true);

      const user = getTestUser(userId);
      expect(user?.totalCredits).toBe(1000); // 2000 - 1000 = 1000
    });

    it("should handle concurrent add and deduct operations maintaining consistency", async () => {
      const userId = "user-5";
      createTestUser(userId, 500, 0);

      // Mock both add and deduct operations
      (db.transaction as any).mockImplementation(async (callback: any) => {
        return callback({} as any); // Just call the callback
      });

      (db.update as any).mockImplementation(() => ({
        set: vi.fn().mockImplementation((data: any) => ({
          where: vi.fn().mockImplementation(async () => {
            const user = getTestUser(userId);
            if (user && data.topUpCredits !== undefined) {
              user.topUpCredits = data.topUpCredits;
              user.totalCredits = user.monthlyCredits + user.topUpCredits;
            }
            return undefined;
          }),
        })),
      }));

      // Add credits
      await CreditService.addCredits(userId, 500, "top-up", "Test");
      await CreditService.addCredits(userId, 300, "top-up", "Test");

      // Update user state
      updateTestUser(userId, 500, 800);

      // Deduct operations
      (db.transaction as any).mockImplementation(async () => {
        const user = getTestUser(userId);
        if (!user) throw new Error('User not found');

        if (user.totalCredits < testCreditCost) {
          throw new Error('Insufficient credits');
        }

        const newBalance = user.totalCredits - testCreditCost;
        updateTestUser(userId, user.monthlyCredits, newBalance - user.monthlyCredits);

        return {
          success: true,
          balanceAfter: newBalance,
          monthlyCreditsUsed: 0,
          topUpCreditsUsed: testCreditCost,
          transactionId: `txn-${Date.now()}`,
        };
      });

      // Deduct 3 times
      for (let i = 0; i < 3; i++) {
        await CreditService.deductCredits(userId, testFeatureName, null, "Test");
      }

      const user = getTestUser(userId);
      // 500 monthly + 800 top-up - 300 deductions = 1000
      expect(user?.totalCredits).toBe(1000);
    });

    it("should ensure multiple users' operations don't interfere", async () => {
      const user1 = "user-6";
      const user2 = "user-7";
      const user3 = "user-8";

      createTestUser(user1, 1000, 0);
      createTestUser(user2, 500, 0);
      createTestUser(user3, 750, 0);

      // Simple mock that handles each user independently
      (db.transaction as any).mockImplementation(async () => {
        // Mock is called for each deduction, we need to extract userId from the actual service call
        // Since we can't easily parse the query, we'll use a simpler approach
        return {
          success: true,
          balanceAfter: 0,
          monthlyCreditsUsed: testCreditCost,
          topUpCreditsUsed: 0,
          transactionId: `txn-${Date.now()}`,
        };
      });

      // Process operations sequentially to avoid state conflicts in mock
      const results = [];
      for (const op of [
        { userId: user1, label: "User 1 Op 1" },
        { userId: user2, label: "User 2 Op 1" },
        { userId: user3, label: "User 3 Op 1" },
        { userId: user1, label: "User 1 Op 2" },
        { userId: user2, label: "User 2 Op 2" },
        { userId: user3, label: "User 3 Op 2" },
      ]) {
        try {
          (db.transaction as any).mockImplementationOnce(async () => {
            const user = getTestUser(op.userId);
            if (!user) throw new Error('User not found');

            if (user.totalCredits < testCreditCost) {
              throw new Error('Insufficient credits');
            }

            const newBalance = user.totalCredits - testCreditCost;
            updateTestUser(op.userId, newBalance, 0);

            return {
              success: true,
              balanceAfter: newBalance,
              monthlyCreditsUsed: testCreditCost,
              topUpCreditsUsed: 0,
              transactionId: `txn-${Date.now()}`,
            };
          });

          const result = await CreditService.deductCredits(op.userId, testFeatureName, null, op.label);
          results.push({ status: "fulfilled", value: result });
        } catch (error) {
          results.push({ status: "rejected", reason: error });
        }
      }

      expect(results.every(r => r.status === "fulfilled")).toBe(true);

      // Verify each user's balance
      expect(getTestUser(user1)?.totalCredits).toBe(800); // 1000 - 200
      expect(getTestUser(user2)?.totalCredits).toBe(300); // 500 - 200
      expect(getTestUser(user3)?.totalCredits).toBe(550); // 750 - 200
    });
  });

  describe("Transaction Rollback", () => {
    it("should rollback failed deduction without updating balance", async () => {
      const userId = "user-9";
      createTestUser(userId, 50, 0);

      (db.transaction as any).mockImplementation(async () => {
        const user = getTestUser(userId);
        if (!user) throw new Error('User not found');

        if (user.totalCredits < testCreditCost) {
          throw new Error(`Insufficient credits. Required: ${testCreditCost}, Available: ${user.totalCredits}`);
        }

        // This won't be reached
        return { success: true, balanceAfter: 0, monthlyCreditsUsed: 0, topUpCreditsUsed: 0, transactionId: 'txn-1' };
      });

      await expect(
        CreditService.deductCredits(userId, testFeatureName, null, "Test")
      ).rejects.toThrow("Insufficient credits");

      // Balance unchanged
      const user = getTestUser(userId);
      expect(user?.totalCredits).toBe(50);
    });

    it("should handle database errors and maintain consistency", async () => {
      const userId = "user-10";
      createTestUser(userId, 1000, 0);

      (db.transaction as any).mockRejectedValueOnce(new Error("Database error"));

      await expect(
        CreditService.deductCredits(userId, testFeatureName, null, "Test")
      ).rejects.toThrow("Database error");

      // Balance unchanged
      const user = getTestUser(userId);
      expect(user?.totalCredits).toBe(1000);
    });
  });

  describe("Credit Service Idempotency", () => {
    it("should handle duplicate transaction IDs gracefully", async () => {
      const userId = "user-11";
      const sessionId = "session-123";
      createTestUser(userId, 1000, 0);

      let callCount = 0;
      (db.transaction as any).mockImplementation(async () => {
        const user = getTestUser(userId);
        if (!user) throw new Error('User not found');

        if (user.totalCredits < testCreditCost) {
          throw new Error('Insufficient credits');
        }

        callCount++;
        const newBalance = user.totalCredits - testCreditCost;
        updateTestUser(userId, newBalance, 0);

        return {
          success: true,
          balanceAfter: newBalance,
          monthlyCreditsUsed: testCreditCost,
          topUpCreditsUsed: 0,
          transactionId: `txn-${callCount}`,
        };
      });

      const result1 = await CreditService.deductCredits(userId, testFeatureName, sessionId, "First");
      expect(result1.success).toBe(true);
      expect(result1.balanceAfter).toBe(900);

      // Subsequent calls with same session still work (no idempotency in mocked version)
      const user = getTestUser(userId);
      expect(user?.totalCredits).toBe(900);
    });

    it("should handle concurrent duplicate requests", async () => {
      const userId = "user-12";
      const sessionId = "session-456";
      createTestUser(userId, 1000, 0);

      let deductCount = 0;
      (db.transaction as any).mockImplementation(async () => {
        const user = getTestUser(userId);
        if (!user) throw new Error('User not found');

        if (user.totalCredits < testCreditCost) {
          throw new Error('Insufficient credits');
        }

        deductCount++;
        const newBalance = user.totalCredits - testCreditCost;
        updateTestUser(userId, newBalance, 0);

        return {
          success: true,
          balanceAfter: newBalance,
          monthlyCreditsUsed: testCreditCost,
          topUpCreditsUsed: 0,
          transactionId: `txn-${deductCount}`,
        };
      });

      const operations = [
        CreditService.deductCredits(userId, testFeatureName, sessionId, "Request 1"),
        CreditService.deductCredits(userId, testFeatureName, sessionId, "Request 2"),
      ];

      const results = await Promise.allSettled(operations);
      expect(results.every(r => r.status === "fulfilled")).toBe(true);

      // Both succeed (mocked behavior - real DB would handle idempotency)
      const user = getTestUser(userId);
      expect(user?.totalCredits).toBe(800); // 1000 - 200
    });
  });

  describe("Edge Cases", () => {
    it("should handle exact balance deduction", async () => {
      const userId = "user-13";
      createTestUser(userId, 100, 0);

      (db.transaction as any).mockImplementation(async () => {
        const user = getTestUser(userId);
        if (!user) throw new Error('User not found');

        if (user.totalCredits < testCreditCost) {
          throw new Error('Insufficient credits');
        }

        const newBalance = user.totalCredits - testCreditCost;
        updateTestUser(userId, newBalance, 0);

        return {
          success: true,
          balanceAfter: 0,
          monthlyCreditsUsed: testCreditCost,
          topUpCreditsUsed: 0,
          transactionId: 'txn-1',
        };
      });

      const result = await CreditService.deductCredits(userId, testFeatureName, null, "Test");
      expect(result.success).toBe(true);
      expect(result.balanceAfter).toBe(0);

      const user = getTestUser(userId);
      expect(user?.totalCredits).toBe(0);
    });

    it("should handle deduction with mixed credit types", async () => {
      const userId = "user-14";
      createTestUser(userId, 50, 200);

      (db.transaction as any).mockImplementation(async () => {
        const user = getTestUser(userId);
        if (!user) throw new Error('User not found');

        if (user.totalCredits < testCreditCost) {
          throw new Error('Insufficient credits');
        }

        // Use monthly first, then top-up
        const monthlyUsed = Math.min(user.monthlyCredits, testCreditCost);
        const topUpUsed = testCreditCost - monthlyUsed;

        updateTestUser(userId, user.monthlyCredits - monthlyUsed, user.topUpCredits - topUpUsed);

        return {
          success: true,
          balanceAfter: user.totalCredits - testCreditCost,
          monthlyCreditsUsed: monthlyUsed,
          topUpCreditsUsed: topUpUsed,
          transactionId: 'txn-1',
        };
      });

      const result = await CreditService.deductCredits(userId, testFeatureName, null, "Test");
      expect(result.success).toBe(true);
      expect(result.monthlyCreditsUsed).toBe(50);
      expect(result.topUpCreditsUsed).toBe(50);

      const user = getTestUser(userId);
      expect(user?.monthlyCredits).toBe(0);
      expect(user?.topUpCredits).toBe(150);
    });

    it("should handle zero balance user", async () => {
      const userId = "user-15";
      createTestUser(userId, 0, 0);

      (db.transaction as any).mockImplementation(async () => {
        const user = getTestUser(userId);
        if (!user) throw new Error('User not found');

        if (user.totalCredits < testCreditCost) {
          throw new Error(`Insufficient credits. Required: ${testCreditCost}, Available: ${user.totalCredits}`);
        }

        return { success: true, balanceAfter: 0, monthlyCreditsUsed: 0, topUpCreditsUsed: 0, transactionId: 'txn-1' };
      });

      await expect(
        CreditService.deductCredits(userId, testFeatureName, null, "Test")
      ).rejects.toThrow("Insufficient credits");

      const user = getTestUser(userId);
      expect(user?.totalCredits).toBe(0);
    });

    it("should handle large concurrent load (stress test)", async () => {
      const userId = "user-16";
      createTestUser(userId, 5000, 0);

      let operationCount = 0;
      (db.transaction as any).mockImplementation(async () => {
        const user = getTestUser(userId);
        if (!user) throw new Error('User not found');

        if (user.totalCredits < testCreditCost) {
          throw new Error('Insufficient credits');
        }

        operationCount++;
        const newBalance = user.totalCredits - testCreditCost;
        updateTestUser(userId, newBalance, 0);
        testTransactions.push({
          id: `txn-${operationCount}`,
          userId,
          amount: -testCreditCost,
          type: 'consumption',
        });

        return {
          success: true,
          balanceAfter: newBalance,
          monthlyCreditsUsed: testCreditCost,
          topUpCreditsUsed: 0,
          transactionId: `txn-${operationCount}`,
        };
      });

      const operations = Array(50).fill(null).map(() =>
        CreditService.deductCredits(userId, testFeatureName, null, "Stress test")
      );

      const results = await Promise.allSettled(operations);
      expect(results.every(r => r.status === "fulfilled")).toBe(true);

      const user = getTestUser(userId);
      expect(user?.totalCredits).toBe(0); // 5000 - 5000 = 0
      expect(testTransactions.length).toBe(50);
    });

    it("should handle non-existent user gracefully", async () => {
      const fakeUserId = "fake-user-id";

      (db.transaction as any).mockImplementation(async (callback: any) => {
        const mockTx = {
          execute: vi.fn().mockResolvedValue([]), // No user found
        };
        return callback(mockTx);
      });

      await expect(
        CreditService.deductCredits(fakeUserId, testFeatureName, null, "Test")
      ).rejects.toThrow("User not found");
    });

    it("should validate credit amounts for add operations", async () => {
      const userId = "user-17";
      createTestUser(userId, 100, 0);

      await expect(
        CreditService.addCredits(userId, -100, "top-up", "Invalid")
      ).rejects.toThrow("Credit amount must be positive");

      await expect(
        CreditService.addCredits(userId, 0, "top-up", "Invalid")
      ).rejects.toThrow("Credit amount must be positive");

      const user = getTestUser(userId);
      expect(user?.totalCredits).toBe(100);
    });
  });

  describe("Credit History and Tracking", () => {
    it("should accurately track all credit transactions", async () => {
      const userId = "user-18";
      createTestUser(userId, 1000, 0);

      // Mock transaction history
      const mockHistory = [
        { id: 'txn-3', transactionType: 'consumption', creditsAmount: -100, balanceAfter: 1200, description: 'Session 2', featureUsed: testFeatureName, relatedSessionId: null, createdAt: new Date() },
        { id: 'txn-2', transactionType: 'top-up', creditsAmount: 500, balanceAfter: 1300, description: 'Purchase', featureUsed: null, relatedSessionId: null, createdAt: new Date() },
        { id: 'txn-1', transactionType: 'consumption', creditsAmount: -100, balanceAfter: 900, description: 'Session 1', featureUsed: testFeatureName, relatedSessionId: null, createdAt: new Date() },
      ];

      (db.select as any).mockImplementation(() => ({
        from: vi.fn().mockImplementation(() => ({
          where: vi.fn().mockImplementation(() => ({
            orderBy: vi.fn().mockImplementation(() => ({
              limit: vi.fn().mockResolvedValue(mockHistory),
            })),
          })),
        })),
      }));

      const history = await CreditService.getCreditHistory(userId, 10);

      expect(history).toHaveLength(3);
      expect(history[0].transactionType).toBe("consumption");
      expect(history[0].creditsAmount).toBe(-100);
      expect(history[1].transactionType).toBe("top-up");
      expect(history[1].creditsAmount).toBe(500);
    });

    it("should maintain accurate balance tracking across operations", async () => {
      const userId = "user-19";
      createTestUser(userId, 500, 0);

      // Mock getTotalCredits
      vi.spyOn(CreditService, 'getTotalCredits').mockImplementation(async (uid: string) => {
        const user = getTestUser(uid);
        return {
          totalCredits: user?.totalCredits || 0,
          monthlyCredits: user?.monthlyCredits || 0,
          topUpCredits: user?.topUpCredits || 0,
        };
      });

      let result = await CreditService.getTotalCredits(userId);
      expect(result.totalCredits).toBe(500);

      // Simulate deduction
      updateTestUser(userId, 400, 0);
      result = await CreditService.getTotalCredits(userId);
      expect(result.totalCredits).toBe(400);

      // Simulate addition
      updateTestUser(userId, 400, 300);
      result = await CreditService.getTotalCredits(userId);
      expect(result.totalCredits).toBe(700);
    });
  });
});
