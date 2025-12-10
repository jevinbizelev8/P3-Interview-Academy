import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { db } from '../../db';
import { users, creditTransactions } from '@shared/schema';
import { eq, sql } from 'drizzle-orm';
import { CreditService } from '../../services/credit-service';

/**
 * Bulk Operations Performance Test Suite
 *
 * Tests performance characteristics of bulk credit operations at scale.
 * Validates that bulk operations complete within acceptable time limits
 * and stay within memory constraints.
 *
 * Performance Targets:
 * - 100 users: < 5 seconds, < 100MB memory increase
 * - 500 users: < 20 seconds, < 250MB memory increase
 * - 1000 users: < 45 seconds, < 500MB memory increase
 *
 * Total Tests: 10
 */

describe('Bulk Operations Performance Tests', () => {
  let testUserIds: string[] = [];
  const TEST_EMAIL_PREFIX = 'perf_test_';

  /**
   * Helper function to create test users in database
   */
  async function createTestUsers(count: number, prefix: string): Promise<string[]> {
    const userIds: string[] = [];
    const batchSize = 50; // Insert in batches to avoid overwhelming the database

    for (let i = 0; i < count; i += batchSize) {
      const batch = Math.min(batchSize, count - i);

      // Build SQL values for batch insert
      const values = Array.from({ length: batch }, (_, j) => {
        const email = `${prefix}${i + j}@perftest.com`;
        const passwordHash = `test_hash_${i + j}`;
        const firstName = 'Perf';
        const lastName = `Test${i + j}`;
        return `('${email}', '${passwordHash}', '${firstName}', '${lastName}', 'FREE', 'active', 50, 0, 50)`;
      }).join(',');

      // Use raw SQL to avoid schema mismatch issues
      const result = await db.execute(sql.raw(`
        INSERT INTO users (email, password_hash, first_name, last_name, plan_type, subscription_status, monthly_credit_allocation, top_up_credits, credit_balance)
        VALUES ${values}
        RETURNING id
      `));

      // Extract user IDs from result - handle Neon serverless response format
      if (result && typeof result === 'object') {
        // Neon serverless returns { rows: [...], rowCount: n }
        const rows = (result as any).rows || [];
        userIds.push(...rows.map((row: any) => row.id));
      }
    }

    return userIds;
  }

  /**
   * Helper function to clean up test users
   */
  async function cleanupTestUsers(userIds: string[]): Promise<void> {
    if (userIds.length === 0) return;

    // Delete in batches to avoid overwhelming the database
    const batchSize = 100;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      // Use raw SQL with proper array formatting for PostgreSQL
      const idsArray = `{${batch.map(id => `"${id}"`).join(',')}}`;
      await db.execute(sql.raw(`DELETE FROM users WHERE id = ANY('${idsArray}'::uuid[])`));
    }
  }

  /**
   * Helper function to measure memory usage
   */
  function getMemoryUsageMB(): number {
    return process.memoryUsage().heapUsed / 1024 / 1024;
  }

  /**
   * Helper function to trigger garbage collection if available
   */
  function forceGC(): void {
    if (global.gc) {
      global.gc();
    }
  }

  afterAll(async () => {
    // Final cleanup of any remaining test users
    await cleanupTestUsers(testUserIds);

    // Also clean up by email pattern as a safety measure
    await db.execute(sql.raw(`DELETE FROM users WHERE email LIKE '${TEST_EMAIL_PREFIX}%'`));
  });

  describe('100 Users Bulk Update', () => {
    beforeEach(async () => {
      // Clean up before each test
      await cleanupTestUsers(testUserIds);
      testUserIds = [];
    });

    it('should complete bulk credit addition in < 5 seconds', async () => {
      // Create 100 test users
      testUserIds = await createTestUsers(100, `${TEST_EMAIL_PREFIX}100_time_`);
      expect(testUserIds).toHaveLength(100);

      // Measure bulk operation time
      const startTime = Date.now();

      // Perform bulk credit addition
      const results = await Promise.all(
        testUserIds.map(userId =>
          CreditService.addCredits(
            userId,
            100,
            'admin-adjustment',
            'Performance test bulk operation'
          )
        )
      );

      const duration = Date.now() - startTime;

      // Validate results
      expect(results).toHaveLength(100);
      expect(results.every(r => r.success)).toBe(true);
      expect(results.every(r => r.balanceAfter === 150)).toBe(true); // 50 initial + 100 added

      // Performance assertion
      expect(duration).toBeLessThan(5000); // < 5 seconds

      console.log(`✅ 100 users bulk update completed in ${duration}ms`);
    }, 10000); // 10s timeout for safety

    it('should stay under 100MB memory during operation', async () => {
      // Create 100 test users
      testUserIds = await createTestUsers(100, `${TEST_EMAIL_PREFIX}100_mem_`);
      expect(testUserIds).toHaveLength(100);

      // Force GC before measuring
      forceGC();
      await new Promise(resolve => setTimeout(resolve, 100));

      const initialMemory = getMemoryUsageMB();

      // Perform bulk credit addition
      await Promise.all(
        testUserIds.map(userId =>
          CreditService.addCredits(
            userId,
            50,
            'admin-adjustment',
            'Memory test'
          )
        )
      );

      const peakMemory = getMemoryUsageMB();
      const memoryIncrease = peakMemory - initialMemory;

      // Memory assertion
      expect(memoryIncrease).toBeLessThan(100); // < 100MB increase

      console.log(`✅ 100 users operation used ${memoryIncrease.toFixed(2)}MB`);
    }, 10000);
  });

  describe('500 Users Bulk Update', () => {
    beforeEach(async () => {
      // Clean up before each test
      await cleanupTestUsers(testUserIds);
      testUserIds = [];
    });

    it('should complete bulk credit addition in < 20 seconds', async () => {
      // Create 500 test users
      testUserIds = await createTestUsers(500, `${TEST_EMAIL_PREFIX}500_time_`);
      expect(testUserIds).toHaveLength(500);

      // Measure bulk operation time
      const startTime = Date.now();

      // Perform bulk credit addition in batches for better performance
      const batchSize = 50;
      const results = [];

      for (let i = 0; i < testUserIds.length; i += batchSize) {
        const batch = testUserIds.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(userId =>
            CreditService.addCredits(
              userId,
              200,
              'admin-adjustment',
              'Performance test bulk operation'
            )
          )
        );
        results.push(...batchResults);
      }

      const duration = Date.now() - startTime;

      // Validate results
      expect(results).toHaveLength(500);
      expect(results.every(r => r.success)).toBe(true);
      expect(results.every(r => r.balanceAfter === 250)).toBe(true); // 50 initial + 200 added

      // Performance assertion
      expect(duration).toBeLessThan(20000); // < 20 seconds

      console.log(`✅ 500 users bulk update completed in ${duration}ms`);
    }, 30000); // 30s timeout for safety

    it('should stay under 250MB memory during operation', async () => {
      // Create 500 test users
      testUserIds = await createTestUsers(500, `${TEST_EMAIL_PREFIX}500_mem_`);
      expect(testUserIds).toHaveLength(500);

      // Force GC before measuring
      forceGC();
      await new Promise(resolve => setTimeout(resolve, 100));

      const initialMemory = getMemoryUsageMB();

      // Perform bulk credit addition in batches
      const batchSize = 50;
      for (let i = 0; i < testUserIds.length; i += batchSize) {
        const batch = testUserIds.slice(i, i + batchSize);
        await Promise.all(
          batch.map(userId =>
            CreditService.addCredits(
              userId,
              75,
              'admin-adjustment',
              'Memory test'
            )
          )
        );
      }

      const peakMemory = getMemoryUsageMB();
      const memoryIncrease = peakMemory - initialMemory;

      // Memory assertion
      expect(memoryIncrease).toBeLessThan(250); // < 250MB increase

      console.log(`✅ 500 users operation used ${memoryIncrease.toFixed(2)}MB`);
    }, 30000);
  });

  describe('1000 Users Bulk Update', () => {
    beforeEach(async () => {
      // Clean up before each test
      await cleanupTestUsers(testUserIds);
      testUserIds = [];
    });

    it('should complete bulk credit addition in < 45 seconds', async () => {
      // Create 1000 test users
      testUserIds = await createTestUsers(1000, `${TEST_EMAIL_PREFIX}1000_time_`);
      expect(testUserIds).toHaveLength(1000);

      // Measure bulk operation time
      const startTime = Date.now();

      // Perform bulk credit addition in batches for better performance
      const batchSize = 50;
      const results = [];

      for (let i = 0; i < testUserIds.length; i += batchSize) {
        const batch = testUserIds.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(userId =>
            CreditService.addCredits(
              userId,
              300,
              'admin-adjustment',
              'Performance test bulk operation'
            )
          )
        );
        results.push(...batchResults);
      }

      const duration = Date.now() - startTime;

      // Validate results
      expect(results).toHaveLength(1000);
      expect(results.every(r => r.success)).toBe(true);
      expect(results.every(r => r.balanceAfter === 350)).toBe(true); // 50 initial + 300 added

      // Performance assertion
      expect(duration).toBeLessThan(45000); // < 45 seconds

      console.log(`✅ 1000 users bulk update completed in ${duration}ms`);
    }, 60000); // 60s timeout for safety

    it('should stay under 500MB memory during operation', async () => {
      // Create 1000 test users
      testUserIds = await createTestUsers(1000, `${TEST_EMAIL_PREFIX}1000_mem_`);
      expect(testUserIds).toHaveLength(1000);

      // Force GC before measuring
      forceGC();
      await new Promise(resolve => setTimeout(resolve, 100));

      const initialMemory = getMemoryUsageMB();

      // Perform bulk credit addition in batches
      const batchSize = 50;
      for (let i = 0; i < testUserIds.length; i += batchSize) {
        const batch = testUserIds.slice(i, i + batchSize);
        await Promise.all(
          batch.map(userId =>
            CreditService.addCredits(
              userId,
              100,
              'admin-adjustment',
              'Memory test'
            )
          )
        );
      }

      const peakMemory = getMemoryUsageMB();
      const memoryIncrease = peakMemory - initialMemory;

      // Memory assertion
      expect(memoryIncrease).toBeLessThan(500); // < 500MB increase

      console.log(`✅ 1000 users operation used ${memoryIncrease.toFixed(2)}MB`);
    }, 60000);
  });

  describe('Memory Usage Validation', () => {
    beforeEach(async () => {
      // Clean up before each test
      await cleanupTestUsers(testUserIds);
      testUserIds = [];
    });

    it('should not leak memory after bulk operations (GC reclaims memory)', async () => {
      // Create test users
      testUserIds = await createTestUsers(200, `${TEST_EMAIL_PREFIX}gc_`);

      // Force GC and measure baseline
      forceGC();
      await new Promise(resolve => setTimeout(resolve, 100));
      const baselineMemory = getMemoryUsageMB();

      // Perform multiple bulk operations
      for (let round = 0; round < 3; round++) {
        await Promise.all(
          testUserIds.map(userId =>
            CreditService.addCredits(
              userId,
              10,
              'admin-adjustment',
              `Memory leak test round ${round}`
            )
          )
        );

        // Force GC after each round
        forceGC();
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Measure final memory after GC
      const finalMemory = getMemoryUsageMB();
      const memoryRetained = finalMemory - baselineMemory;

      // Should not retain more than 50MB after GC
      expect(memoryRetained).toBeLessThan(50);

      console.log(`✅ Memory retained after 3 rounds: ${memoryRetained.toFixed(2)}MB`);
    }, 30000);

    it('should handle concurrent bulk operations without OOM errors', async () => {
      // Create test users
      testUserIds = await createTestUsers(150, `${TEST_EMAIL_PREFIX}concurrent_`);

      // Force GC before test
      forceGC();
      await new Promise(resolve => setTimeout(resolve, 100));
      const initialMemory = getMemoryUsageMB();

      // Run 3 concurrent bulk operations
      const operations = [
        Promise.all(testUserIds.map(userId =>
          CreditService.addCredits(userId, 25, 'admin-adjustment', 'Concurrent test 1')
        )),
        Promise.all(testUserIds.map(userId =>
          CreditService.addCredits(userId, 25, 'admin-adjustment', 'Concurrent test 2')
        )),
        Promise.all(testUserIds.map(userId =>
          CreditService.addCredits(userId, 25, 'admin-adjustment', 'Concurrent test 3')
        )),
      ];

      // All operations should complete without errors
      const results = await Promise.all(operations);

      // Validate results
      expect(results).toHaveLength(3);
      expect(results.every(batch => batch.length === 150)).toBe(true);
      expect(results.every(batch => batch.every(r => r.success))).toBe(true);

      // Check memory didn't explode
      const peakMemory = getMemoryUsageMB();
      const memoryIncrease = peakMemory - initialMemory;
      expect(memoryIncrease).toBeLessThan(300); // Should handle concurrent ops efficiently

      console.log(`✅ Concurrent operations completed, memory increase: ${memoryIncrease.toFixed(2)}MB`);
    }, 30000);
  });

  describe('Timeout Handling', () => {
    beforeEach(async () => {
      // Clean up before each test
      await cleanupTestUsers(testUserIds);
      testUserIds = [];
    });

    it('should handle graceful degradation when operation times out', async () => {
      // Create test users
      testUserIds = await createTestUsers(100, `${TEST_EMAIL_PREFIX}timeout_`);

      // Simulate timeout by racing against a timer
      const timeoutMs = 1000; // 1 second timeout for testing
      const results = [];
      const errors = [];

      const operationPromise = (async () => {
        for (const userId of testUserIds) {
          try {
            const result = await CreditService.addCredits(
              userId,
              50,
              'admin-adjustment',
              'Timeout test'
            );
            results.push({ userId, success: true, result });
          } catch (error) {
            errors.push({ userId, error: error instanceof Error ? error.message : 'Unknown error' });
          }
        }
      })();

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Operation timeout')), timeoutMs)
      );

      // Race between operation and timeout
      try {
        await Promise.race([operationPromise, timeoutPromise]);
      } catch (error) {
        // Timeout occurred - this is expected for this test
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Operation timeout');
      }

      // Should have partial completion
      const totalProcessed = results.length + errors.length;
      console.log(`✅ Graceful degradation: processed ${results.length}/${testUserIds.length} before timeout`);

      // At least some operations should have completed
      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThan(testUserIds.length);
    }, 10000);

    it('should track partial completion for resume capability', async () => {
      // Create test users
      testUserIds = await createTestUsers(100, `${TEST_EMAIL_PREFIX}resume_`);

      // Process first batch
      const batchSize = 30;
      const batch1 = testUserIds.slice(0, batchSize);
      const results1 = await Promise.all(
        batch1.map(userId =>
          CreditService.addCredits(userId, 100, 'admin-adjustment', 'Batch 1')
        )
      );

      expect(results1).toHaveLength(batchSize);
      expect(results1.every(r => r.success)).toBe(true);

      // Verify transactions were created
      const idsArray1 = `{${batch1.map(id => `"${id}"`).join(',')}}`;
      const transactions1Result = await db.execute(sql.raw(`
        SELECT * FROM credit_transactions
        WHERE user_id = ANY('${idsArray1}'::uuid[])
        ORDER BY created_at
      `));
      const transactions1 = (transactions1Result as any).rows || [];

      expect(transactions1.length).toBeGreaterThanOrEqual(batchSize);

      // Simulate "resume" by processing remaining users
      const batch2 = testUserIds.slice(batchSize);
      const results2 = await Promise.all(
        batch2.map(userId =>
          CreditService.addCredits(userId, 100, 'admin-adjustment', 'Batch 2 (resumed)')
        )
      );

      expect(results2).toHaveLength(testUserIds.length - batchSize);
      expect(results2.every(r => r.success)).toBe(true);

      // Verify all users were eventually processed
      const idsArrayAll = `{${testUserIds.map(id => `"${id}"`).join(',')}}`;
      const allTransactionsResult = await db.execute(sql.raw(`
        SELECT * FROM credit_transactions
        WHERE user_id = ANY('${idsArrayAll}'::uuid[])
      `));
      const allTransactions = (allTransactionsResult as any).rows || [];

      // Should have at least one transaction per user
      const uniqueUserIds = new Set(allTransactions.map((t: any) => t.user_id));
      expect(uniqueUserIds.size).toBe(testUserIds.length);

      console.log(`✅ Resume capability: processed ${batch1.length} + ${batch2.length} = ${testUserIds.length} total`);
    }, 20000);
  });
});
