/**
 * User Test Fixtures
 *
 * Pre-defined user data for testing various scenarios:
 * - Regular users with different credit levels
 * - Admin users
 * - Premium/subscription users
 * - Edge case users
 *
 * @module fixtures/users
 */

/**
 * Standard test users
 */
export const TEST_USERS = {
  /** Regular user with standard credits */
  regularUser: {
    email: 'regular@test.com',
    password: 'Test123!@#',
    role: 'user' as const,
    credits: 100,
    monthlyAllocation: 100,
    topUpCredits: 0,
    fullName: 'Regular Test User',
    preferredLanguage: 'en',
  },

  /** Admin user with elevated privileges */
  adminUser: {
    email: 'admin@test.com',
    password: 'Admin123!@#',
    role: 'admin' as const,
    credits: 1000,
    monthlyAllocation: 1000,
    topUpCredits: 0,
    fullName: 'Admin Test User',
    preferredLanguage: 'en',
  },

  /** Premium user with large credit balance */
  premiumUser: {
    email: 'premium@test.com',
    password: 'Premium123!@#',
    role: 'user' as const,
    credits: 5000,
    monthlyAllocation: 1000,
    topUpCredits: 4000,
    fullName: 'Premium Test User',
    preferredLanguage: 'en',
  },

  /** User with low credits (for testing insufficient balance) */
  lowCreditUser: {
    email: 'lowcredit@test.com',
    password: 'LowCredit123!@#',
    role: 'user' as const,
    credits: 50,
    monthlyAllocation: 50,
    topUpCredits: 0,
    fullName: 'Low Credit User',
    preferredLanguage: 'en',
  },

  /** User with zero credits */
  zeroCreditUser: {
    email: 'zerocredit@test.com',
    password: 'ZeroCredit123!@#',
    role: 'user' as const,
    credits: 0,
    monthlyAllocation: 0,
    topUpCredits: 0,
    fullName: 'Zero Credit User',
    preferredLanguage: 'en',
  },

  /** User with only top-up credits */
  topUpOnlyUser: {
    email: 'topuponly@test.com',
    password: 'TopUp123!@#',
    role: 'user' as const,
    credits: 500,
    monthlyAllocation: 0,
    topUpCredits: 500,
    fullName: 'Top-Up Only User',
    preferredLanguage: 'en',
  },

  /** User with unverified email */
  unverifiedUser: {
    email: 'unverified@test.com',
    password: 'Unverified123!@#',
    role: 'user' as const,
    credits: 100,
    monthlyAllocation: 100,
    topUpCredits: 0,
    fullName: 'Unverified User',
    preferredLanguage: 'en',
    emailVerified: false,
  },

  /** User with multi-language preference */
  multiLangUser: {
    email: 'multilang@test.com',
    password: 'MultiLang123!@#',
    role: 'user' as const,
    credits: 100,
    monthlyAllocation: 100,
    topUpCredits: 0,
    fullName: 'Multi Language User',
    preferredLanguage: 'zh-sg',
  },
} as const;

/**
 * Bulk test users for load testing
 *
 * @param count - Number of users to generate
 * @param prefix - Email prefix (default: 'bulkuser')
 * @returns Array of user fixtures
 *
 * @example
 * const users = generateBulkUsers(100, 'loadtest');
 */
export function generateBulkUsers(
  count: number,
  prefix: string = 'bulkuser'
): Array<{
  email: string;
  password: string;
  role: 'user' | 'admin';
  credits: number;
  monthlyAllocation: number;
  topUpCredits: number;
  fullName: string;
  preferredLanguage: string;
}> {
  const users = [];

  for (let i = 1; i <= count; i++) {
    users.push({
      email: `${prefix}${i}@test.com`,
      password: 'BulkTest123!@#',
      role: 'user' as const,
      credits: 100,
      monthlyAllocation: 100,
      topUpCredits: 0,
      fullName: `Bulk Test User ${i}`,
      preferredLanguage: 'en',
    });
  }

  return users;
}

/**
 * User credentials for login testing
 */
export const USER_CREDENTIALS = {
  valid: {
    email: 'regular@test.com',
    password: 'Test123!@#',
  },
  invalid: {
    email: 'invalid@test.com',
    password: 'WrongPassword123!@#',
  },
  weakPassword: {
    email: 'weak@test.com',
    password: '123',
  },
  admin: {
    email: 'admin@test.com',
    password: 'Admin123!@#',
  },
} as const;

/**
 * User credit scenarios for testing
 */
export const CREDIT_SCENARIOS = {
  /** User with exactly enough credits for one session */
  exactBalance: {
    email: 'exact@test.com',
    password: 'Exact123!@#',
    role: 'user' as const,
    credits: 100,
    monthlyAllocation: 100,
    topUpCredits: 0,
  },

  /** User with insufficient credits */
  insufficient: {
    email: 'insufficient@test.com',
    password: 'Insufficient123!@#',
    role: 'user' as const,
    credits: 50,
    monthlyAllocation: 50,
    topUpCredits: 0,
  },

  /** User with abundant credits */
  abundant: {
    email: 'abundant@test.com',
    password: 'Abundant123!@#',
    role: 'user' as const,
    credits: 10000,
    monthlyAllocation: 5000,
    topUpCredits: 5000,
  },

  /** User with mixed credit types */
  mixed: {
    email: 'mixed@test.com',
    password: 'Mixed123!@#',
    role: 'user' as const,
    credits: 300,
    monthlyAllocation: 100,
    topUpCredits: 200,
  },
} as const;

/**
 * Role-based user fixtures
 */
export const ROLE_FIXTURES = {
  admins: [
    {
      email: 'admin1@test.com',
      password: 'Admin1123!@#',
      role: 'admin' as const,
      credits: 1000,
      fullName: 'Admin One',
    },
    {
      email: 'admin2@test.com',
      password: 'Admin2123!@#',
      role: 'admin' as const,
      credits: 1000,
      fullName: 'Admin Two',
    },
  ],
  users: [
    {
      email: 'user1@test.com',
      password: 'User1123!@#',
      role: 'user' as const,
      credits: 100,
      fullName: 'User One',
    },
    {
      email: 'user2@test.com',
      password: 'User2123!@#',
      role: 'user' as const,
      credits: 100,
      fullName: 'User Two',
    },
    {
      email: 'user3@test.com',
      password: 'User3123!@#',
      role: 'user' as const,
      credits: 100,
      fullName: 'User Three',
    },
  ],
} as const;
