/**
 * Database Test Helpers
 *
 * Comprehensive utilities for database testing:
 * - Database cleanup and reset functions
 * - Test data seeding
 * - Transaction management for isolated tests
 * - Credit balance management
 * - Table truncation utilities
 *
 * @module database-helpers
 */

import { db } from "../../db";
import {
  users,
  creditTransactions,
  practiceSessions,
  preparationSessions,
  interviewSessions,
  subscriptions,
  creditCosts,
} from "@shared/schema";
import { sql, eq } from "drizzle-orm";
import { createTestUser } from "./auth-helpers";

/**
 * Clean up all test users from the database
 * Removes users with emails ending in @test.com
 *
 * @returns Promise resolving when cleanup is complete
 *
 * @example
 * await cleanupTestUsers();
 */
export async function cleanupTestUsers(): Promise<void> {
  await db.execute(sql`
    DELETE FROM ${users}
    WHERE email LIKE '%@test.com'
  `);
}

/**
 * Clean up all test data from multiple tables
 * Useful for resetting test environment between test suites
 *
 * @returns Promise resolving when cleanup is complete
 *
 * @example
 * await cleanupAllTestData();
 */
export async function cleanupAllTestData(): Promise<void> {
  await db.execute(sql`
    DELETE FROM ${creditTransactions}
    WHERE user_id IN (SELECT id FROM ${users} WHERE email LIKE '%@test.com')
  `);

  await db.execute(sql`
    DELETE FROM ${practiceSessions}
    WHERE user_id IN (SELECT id FROM ${users} WHERE email LIKE '%@test.com')
  `);

  await db.execute(sql`
    DELETE FROM ${preparationSessions}
    WHERE user_id IN (SELECT id FROM ${users} WHERE email LIKE '%@test.com')
  `);

  await db.execute(sql`
    DELETE FROM ${interviewSessions}
    WHERE user_id IN (SELECT id FROM ${users} WHERE email LIKE '%@test.com')
  `);

  await cleanupTestUsers();
}

/**
 * Seed standard test data
 * Creates a set of default test users for testing
 *
 * @returns Promise resolving to object with created users
 *
 * @example
 * const { regularUser, adminUser, premiumUser } = await seedTestData();
 */
export async function seedTestData(): Promise<{
  regularUser: { id: string; email: string; role: string };
  adminUser: { id: string; email: string; role: string };
  premiumUser: { id: string; email: string; role: string };
}> {
  const regularUser = await createTestUser('user1@test.com', 'user', 'Test123!@#', 100);
  const adminUser = await createTestUser('admin@test.com', 'admin', 'Admin123!@#', 1000);
  const premiumUser = await createTestUser('premium@test.com', 'user', 'Premium123!@#', 5000);

  return {
    regularUser,
    adminUser,
    premiumUser,
  };
}

/**
 * Reset user credits to a specific amount
 * Updates both credit balance and monthly allocation
 *
 * @param userId - User ID to update
 * @param amount - New credit amount
 * @param topUpCredits - Top-up credits (default: 0)
 * @returns Promise resolving when update is complete
 *
 * @example
 * await resetUserCredits('user-123', 500, 200);
 */
export async function resetUserCredits(
  userId: string,
  amount: number,
  topUpCredits: number = 0
): Promise<void> {
  await db
    .update(users)
    .set({
      creditBalance: amount + topUpCredits,
      monthlyCreditAllocation: amount,
      topUpCredits,
    })
    .where(eq(users.id, userId));
}

/**
 * Get user credit balance
 *
 * @param userId - User ID to query
 * @returns Promise resolving to credit balance details
 *
 * @example
 * const credits = await getUserCredits('user-123');
 * console.log(credits.total); // 500
 */
export async function getUserCredits(userId: string): Promise<{
  total: number;
  monthly: number;
  topUp: number;
}> {
  const [user] = await db
    .select({
      creditBalance: users.creditBalance,
      monthlyCreditAllocation: users.monthlyCreditAllocation,
      topUpCredits: users.topUpCredits,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new Error(`User ${userId} not found`);
  }

  return {
    total: user.creditBalance,
    monthly: user.monthlyCreditAllocation,
    topUp: user.topUpCredits,
  };
}

/**
 * Execute a callback within a database transaction
 * Useful for isolating test operations
 *
 * @param callback - Function to execute within transaction
 * @returns Promise resolving to callback result
 *
 * @example
 * const result = await withTransaction(async (tx) => {
 *   // Perform database operations
 *   return { success: true };
 * });
 */
export async function withTransaction<T>(
  callback: (tx: typeof db) => Promise<T>
): Promise<T> {
  return await db.transaction(callback);
}

/**
 * Truncate a table (clear all data)
 * Use with caution - this deletes all data from the table
 *
 * @param tableName - Name of the table to truncate
 * @param cascade - Whether to cascade to related tables (default: false)
 * @returns Promise resolving when truncation is complete
 *
 * @example
 * await truncateTable('credit_transactions', true);
 */
export async function truncateTable(
  tableName: string,
  cascade: boolean = false
): Promise<void> {
  const cascadeClause = cascade ? 'CASCADE' : '';
  await db.execute(
    sql.raw(`TRUNCATE TABLE ${tableName} ${cascadeClause}`)
  );
}

/**
 * Truncate multiple tables at once
 *
 * @param tableNames - Array of table names to truncate
 * @param cascade - Whether to cascade to related tables (default: false)
 * @returns Promise resolving when truncation is complete
 *
 * @example
 * await truncateTables(['credit_transactions', 'practice_sessions'], true);
 */
export async function truncateTables(
  tableNames: string[],
  cascade: boolean = false
): Promise<void> {
  for (const tableName of tableNames) {
    await truncateTable(tableName, cascade);
  }
}

/**
 * Create a test credit transaction
 *
 * @param userId - User ID for the transaction
 * @param amount - Credit amount (negative for deduction, positive for addition)
 * @param type - Transaction type ('consumption' | 'top-up' | 'monthly-allocation' | 'refund')
 * @param description - Transaction description
 * @returns Promise resolving to created transaction
 *
 * @example
 * const transaction = await createTestTransaction('user-123', -100, 'consumption', 'Practice session');
 */
export async function createTestTransaction(
  userId: string,
  amount: number,
  type: 'consumption' | 'top-up' | 'monthly-allocation' | 'refund',
  description: string
): Promise<{
  id: string;
  userId: string;
  creditsAmount: number;
  transactionType: string;
  description: string;
}> {
  const [transaction] = await db
    .insert(creditTransactions)
    .values({
      userId,
      creditsAmount: amount,
      transactionType: type,
      balanceAfter: 0, // This would be calculated in production
      description,
      featureUsed: type === 'consumption' ? 'test-feature' : null,
    })
    .returning();

  return transaction;
}

/**
 * Get transaction history for a user
 *
 * @param userId - User ID to query
 * @param limit - Maximum number of transactions to return (default: 10)
 * @returns Promise resolving to array of transactions
 *
 * @example
 * const history = await getTransactionHistory('user-123', 5);
 */
export async function getTransactionHistory(
  userId: string,
  limit: number = 10
): Promise<Array<{
  id: string;
  creditsAmount: number;
  transactionType: string;
  description: string;
  createdAt: Date;
}>> {
  return await db
    .select({
      id: creditTransactions.id,
      creditsAmount: creditTransactions.creditsAmount,
      transactionType: creditTransactions.transactionType,
      description: creditTransactions.description,
      createdAt: creditTransactions.createdAt,
    })
    .from(creditTransactions)
    .where(eq(creditTransactions.userId, userId))
    .orderBy(sql`${creditTransactions.createdAt} DESC`)
    .limit(limit);
}

/**
 * Create a test practice session
 *
 * @param userId - User ID for the session
 * @param status - Session status (default: 'active')
 * @returns Promise resolving to created session
 *
 * @example
 * const session = await createTestPracticeSession('user-123', 'completed');
 */
export async function createTestPracticeSession(
  userId: string,
  status: 'active' | 'completed' | 'cancelled' = 'active'
): Promise<{
  id: string;
  userId: string;
  status: string;
}> {
  const [session] = await db
    .insert(practiceSessions)
    .values({
      userId,
      jobRole: 'Software Engineer',
      difficulty: 'medium',
      language: 'en',
      status,
      totalQuestions: 5,
      currentQuestionNumber: 1,
    })
    .returning();

  return session;
}

/**
 * Delete a test practice session
 *
 * @param sessionId - Session ID to delete
 * @returns Promise resolving when deletion is complete
 *
 * @example
 * await deleteTestPracticeSession('session-123');
 */
export async function deleteTestPracticeSession(sessionId: string): Promise<void> {
  await db
    .delete(practiceSessions)
    .where(eq(practiceSessions.id, sessionId));
}

/**
 * Count records in a table
 *
 * @param tableName - Name of the table
 * @param whereClause - Optional WHERE clause
 * @returns Promise resolving to record count
 *
 * @example
 * const count = await countRecords('users', "email LIKE '%@test.com'");
 */
export async function countRecords(
  tableName: string,
  whereClause?: string
): Promise<number> {
  const where = whereClause ? `WHERE ${whereClause}` : '';
  const result = await db.execute(
    sql.raw(`SELECT COUNT(*) as count FROM ${tableName} ${where}`)
  );

  return Number(result.rows[0]?.count || 0);
}

/**
 * Create multiple test transactions at once
 *
 * @param userId - User ID for the transactions
 * @param count - Number of transactions to create
 * @param baseAmount - Base credit amount (will be varied)
 * @returns Promise resolving to array of created transactions
 *
 * @example
 * const transactions = await createBulkTransactions('user-123', 10, -100);
 */
export async function createBulkTransactions(
  userId: string,
  count: number,
  baseAmount: number = -100
): Promise<Array<{
  id: string;
  creditsAmount: number;
  transactionType: string;
}>> {
  const transactions = [];

  for (let i = 0; i < count; i++) {
    const transaction = await createTestTransaction(
      userId,
      baseAmount,
      'consumption',
      `Bulk test transaction ${i + 1}`
    );
    transactions.push(transaction);
  }

  return transactions;
}

/**
 * Reset entire test database to clean state
 * CAUTION: This will delete all test data
 *
 * @returns Promise resolving when reset is complete
 *
 * @example
 * await resetTestDatabase();
 */
export async function resetTestDatabase(): Promise<void> {
  await cleanupAllTestData();
}

/**
 * Create a snapshot of user credits for later comparison
 *
 * @param userId - User ID to snapshot
 * @returns Promise resolving to credit snapshot
 *
 * @example
 * const before = await snapshotUserCredits('user-123');
 * // ... perform operations
 * const after = await getUserCredits('user-123');
 * expect(after.total).toBe(before.total - 100);
 */
export async function snapshotUserCredits(userId: string): Promise<{
  total: number;
  monthly: number;
  topUp: number;
  timestamp: Date;
}> {
  const credits = await getUserCredits(userId);
  return {
    ...credits,
    timestamp: new Date(),
  };
}

/**
 * Verify database connection and health
 *
 * @returns Promise resolving to true if database is healthy
 *
 * @example
 * const isHealthy = await verifyDatabaseHealth();
 * if (!isHealthy) {
 *   throw new Error('Database connection failed');
 * }
 */
export async function verifyDatabaseHealth(): Promise<boolean> {
  try {
    await db.execute(sql`SELECT 1`);
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}
