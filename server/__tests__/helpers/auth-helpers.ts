/**
 * Authentication Test Helpers
 *
 * Comprehensive utilities for testing authentication flows:
 * - JWT token generation for admin and user roles
 * - Test user creation with credentials
 * - Login simulation and session management
 * - Authorization header formatting
 *
 * @module auth-helpers
 */

import bcrypt from "bcryptjs";
import { db } from "../../db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";

/**
 * Test user IDs for consistent testing
 */
export const TEST_USER_IDS = {
  ADMIN: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  REGULAR: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  TARGET: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
  PREMIUM: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
} as const;

/**
 * Mock session for testing
 * Simulates Express session object without actual session middleware
 */
export interface MockSession {
  userId: string;
  role: 'user' | 'admin';
  email: string;
}

/**
 * Hash a password using bcrypt for test users
 *
 * @param password - Plain text password to hash
 * @returns Promise resolving to hashed password
 *
 * @example
 * const hash = await hashPassword('Test123!@#');
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Verify a password against a hash
 *
 * @param password - Plain text password to verify
 * @param hash - Bcrypt hash to verify against
 * @returns Promise resolving to true if password matches
 *
 * @example
 * const isValid = await verifyPassword('Test123!@#', hash);
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Create a test user in the database
 *
 * @param email - User email address
 * @param role - User role ('user' or 'admin')
 * @param password - Plain text password (default: 'Test123!@#')
 * @param credits - Initial credit balance (default: 100)
 * @returns Promise resolving to created user object
 *
 * @example
 * const user = await createTestUser('test@example.com', 'user');
 * const admin = await createTestUser('admin@example.com', 'admin', 'AdminPass123!', 1000);
 */
export async function createTestUser(
  email: string,
  role: 'user' | 'admin' = 'user',
  password: string = 'Test123!@#',
  credits: number = 100
): Promise<{ id: string; email: string; role: string }> {
  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values({
      email,
      passwordHash,
      role,
      emailVerified: true,
      creditBalance: credits,
      monthlyCreditAllocation: credits,
      topUpCredits: 0,
      preferredLanguage: 'en',
      fullName: `Test User (${role})`,
    })
    .returning();

  return user;
}

/**
 * Create a mock session object for middleware testing
 *
 * @param userId - User ID for the session
 * @param role - User role ('user' or 'admin')
 * @param email - User email address
 * @returns Mock session object
 *
 * @example
 * const session = createMockSession(TEST_USER_IDS.ADMIN, 'admin', 'admin@test.com');
 */
export function createMockSession(
  userId: string,
  role: 'user' | 'admin',
  email: string
): MockSession {
  return {
    userId,
    role,
    email,
  };
}

/**
 * Create a mock Express request object with authentication
 *
 * @param session - Mock session object
 * @param params - Request params (e.g., { id: '123' })
 * @param body - Request body
 * @param query - Request query parameters
 * @returns Mock request object
 *
 * @example
 * const req = createMockRequest(
 *   createMockSession(TEST_USER_IDS.ADMIN, 'admin', 'admin@test.com'),
 *   { id: 'user-123' },
 *   { credits: 500 }
 * );
 */
export function createMockRequest(
  session: MockSession,
  params: Record<string, string> = {},
  body: Record<string, any> = {},
  query: Record<string, string> = {}
): any {
  return {
    session,
    user: session,
    params,
    body,
    query,
    headers: {},
    method: 'GET',
    url: '/',
  };
}

/**
 * Create a mock Express response object
 *
 * @returns Mock response object with status, json, send methods
 *
 * @example
 * const res = createMockResponse();
 * res.status(200).json({ success: true });
 */
export function createMockResponse(): any {
  const res: any = {
    statusCode: 200,
    data: null,
    status: function(code: number) {
      this.statusCode = code;
      return this;
    },
    json: function(data: any) {
      this.data = data;
      return this;
    },
    send: function(data: any) {
      this.data = data;
      return this;
    },
    setHeader: function() {
      return this;
    },
  };
  return res;
}

/**
 * Create a mock next function for middleware testing
 *
 * @returns Mock next function that tracks if it was called
 *
 * @example
 * const next = createMockNext();
 * await authMiddleware(req, res, next);
 * expect(next.called).toBe(true);
 */
export function createMockNext(): any {
  const next: any = function() {
    next.called = true;
  };
  next.called = false;
  return next;
}

/**
 * Get a user by email from the database
 *
 * @param email - User email address
 * @returns Promise resolving to user object or null
 *
 * @example
 * const user = await getUserByEmail('test@example.com');
 */
export async function getUserByEmail(
  email: string
): Promise<{ id: string; email: string; role: string; creditBalance: number } | null> {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  return user || null;
}

/**
 * Update a user's role
 *
 * @param userId - User ID to update
 * @param role - New role ('user' or 'admin')
 * @returns Promise resolving when update is complete
 *
 * @example
 * await updateUserRole('user-123', 'admin');
 */
export async function updateUserRole(
  userId: string,
  role: 'user' | 'admin'
): Promise<void> {
  await db
    .update(users)
    .set({ role })
    .where(eq(users.id, userId));
}

/**
 * Delete a test user by email
 *
 * @param email - User email address
 * @returns Promise resolving when deletion is complete
 *
 * @example
 * await deleteTestUser('test@example.com');
 */
export async function deleteTestUser(email: string): Promise<void> {
  await db
    .delete(users)
    .where(eq(users.email, email));
}

/**
 * Create multiple test users at once
 *
 * @param count - Number of users to create
 * @param rolePrefix - Prefix for email addresses (default: 'testuser')
 * @param role - User role (default: 'user')
 * @returns Promise resolving to array of created users
 *
 * @example
 * const users = await createBulkTestUsers(5, 'bulktest');
 */
export async function createBulkTestUsers(
  count: number,
  rolePrefix: string = 'testuser',
  role: 'user' | 'admin' = 'user'
): Promise<Array<{ id: string; email: string; role: string }>> {
  const users: Array<{ id: string; email: string; role: string }> = [];

  for (let i = 1; i <= count; i++) {
    const email = `${rolePrefix}${i}@test.com`;
    const user = await createTestUser(email, role);
    users.push(user);
  }

  return users;
}

/**
 * Authenticate as admin (for supertest requests)
 * Returns authentication header object
 *
 * @returns Promise resolving to authorization header object
 *
 * @example
 * const authHeader = await authenticateAsAdmin();
 * await request(app).get('/api/admin/users').set(authHeader);
 */
export async function authenticateAsAdmin(): Promise<{ Authorization: string }> {
  // Create or get admin user
  let admin = await getUserByEmail('admin@test.com');
  if (!admin) {
    admin = await createTestUser('admin@test.com', 'admin');
  }

  // In this implementation, we return a mock session identifier
  // In production, this would be a JWT token or session cookie
  return {
    Authorization: `Session ${admin.id}:admin`,
  };
}

/**
 * Authenticate as regular user (for supertest requests)
 * Returns authentication header object
 *
 * @param email - User email (optional, creates new user if not provided)
 * @returns Promise resolving to authorization header object
 *
 * @example
 * const authHeader = await authenticateAsUser('test@example.com');
 * await request(app).get('/api/profile').set(authHeader);
 */
export async function authenticateAsUser(
  email: string = 'user@test.com'
): Promise<{ Authorization: string }> {
  let user = await getUserByEmail(email);
  if (!user) {
    user = await createTestUser(email, 'user');
  }

  return {
    Authorization: `Session ${user.id}:user`,
  };
}

/**
 * Create a complete test user setup with credits and verified email
 *
 * @param options - User configuration options
 * @returns Promise resolving to created user with additional details
 *
 * @example
 * const user = await setupTestUser({
 *   email: 'premium@test.com',
 *   role: 'user',
 *   credits: 5000,
 *   monthlyAllocation: 1000,
 *   topUpCredits: 4000
 * });
 */
export async function setupTestUser(options: {
  email: string;
  role?: 'user' | 'admin';
  password?: string;
  credits?: number;
  monthlyAllocation?: number;
  topUpCredits?: number;
  fullName?: string;
}): Promise<{ id: string; email: string; role: string; creditBalance: number }> {
  const {
    email,
    role = 'user',
    password = 'Test123!@#',
    credits = 100,
    monthlyAllocation = 100,
    topUpCredits = 0,
    fullName = 'Test User',
  } = options;

  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values({
      email,
      passwordHash,
      role,
      emailVerified: true,
      creditBalance: credits,
      monthlyCreditAllocation: monthlyAllocation,
      topUpCredits,
      preferredLanguage: 'en',
      fullName,
    })
    .returning();

  return user;
}
