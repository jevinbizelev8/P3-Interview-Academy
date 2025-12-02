/**
 * Transaction Test Fixtures
 *
 * Pre-defined transaction data for testing:
 * - Credit transactions (deductions, top-ups, refunds)
 * - Stripe payment transactions
 * - Transaction history scenarios
 *
 * @module fixtures/transactions
 */

/**
 * Credit transaction fixtures
 */
export const CREDIT_TRANSACTIONS = {
  /** Credit consumption for practice session */
  practiceConsumption: {
    creditsAmount: -100,
    transactionType: 'consumption' as const,
    featureUsed: 'practice-session',
    description: 'Practice session credit deduction',
    balanceAfter: 900,
  },

  /** Credit consumption for preparation */
  prepareConsumption: {
    creditsAmount: -50,
    transactionType: 'consumption' as const,
    featureUsed: 'preparation-session',
    description: 'Preparation session credit deduction',
    balanceAfter: 950,
  },

  /** Credit top-up from purchase */
  topUp500: {
    creditsAmount: 500,
    transactionType: 'top-up' as const,
    featureUsed: null,
    description: 'Credit purchase - POPULAR package',
    balanceAfter: 1500,
    stripeSessionId: 'cs_test_popular_500',
  },

  /** Credit top-up small package */
  topUp100: {
    creditsAmount: 100,
    transactionType: 'top-up' as const,
    featureUsed: null,
    description: 'Credit purchase - SMALL package',
    balanceAfter: 1100,
    stripeSessionId: 'cs_test_small_100',
  },

  /** Credit top-up bulk package */
  topUp2000: {
    creditsAmount: 2000,
    transactionType: 'top-up' as const,
    featureUsed: null,
    description: 'Credit purchase - BULK package',
    balanceAfter: 3000,
    stripeSessionId: 'cs_test_bulk_2000',
  },

  /** Monthly credit allocation */
  monthlyAllocation: {
    creditsAmount: 100,
    transactionType: 'monthly-allocation' as const,
    featureUsed: null,
    description: 'Monthly credit allocation',
    balanceAfter: 100,
  },

  /** Credit refund */
  refund: {
    creditsAmount: 100,
    transactionType: 'refund' as const,
    featureUsed: null,
    description: 'Credit refund for cancelled session',
    balanceAfter: 1100,
  },

  /** Admin credit adjustment */
  adminAdjustment: {
    creditsAmount: 1000,
    transactionType: 'top-up' as const,
    featureUsed: null,
    description: 'Admin credit adjustment - promotional credits',
    balanceAfter: 2000,
    adminId: 'admin-123',
  },
} as const;

/**
 * Stripe payment fixtures
 */
export const STRIPE_PAYMENTS = {
  /** Successful payment for popular package */
  successfulPopular: {
    sessionId: 'cs_test_popular_success',
    amount: 4500, // $45.00 in cents
    currency: 'usd',
    paymentStatus: 'paid' as const,
    credits: 500,
    packageType: 'POPULAR' as const,
    customerEmail: 'customer@test.com',
  },

  /** Successful payment for small package */
  successfulSmall: {
    sessionId: 'cs_test_small_success',
    amount: 1000, // $10.00 in cents
    currency: 'usd',
    paymentStatus: 'paid' as const,
    credits: 100,
    packageType: 'SMALL' as const,
    customerEmail: 'customer@test.com',
  },

  /** Successful payment for bulk package */
  successfulBulk: {
    sessionId: 'cs_test_bulk_success',
    amount: 16000, // $160.00 in cents
    currency: 'usd',
    paymentStatus: 'paid' as const,
    credits: 2000,
    packageType: 'BULK' as const,
    customerEmail: 'customer@test.com',
  },

  /** Failed payment - card declined */
  failedCardDeclined: {
    sessionId: 'cs_test_failed_declined',
    amount: 4500,
    currency: 'usd',
    paymentStatus: 'unpaid' as const,
    credits: 500,
    packageType: 'POPULAR' as const,
    failureReason: 'card_declined',
  },

  /** Failed payment - insufficient funds */
  failedInsufficientFunds: {
    sessionId: 'cs_test_failed_insufficient',
    amount: 4500,
    currency: 'usd',
    paymentStatus: 'unpaid' as const,
    credits: 500,
    packageType: 'POPULAR' as const,
    failureReason: 'insufficient_funds',
  },

  /** Pending payment */
  pending: {
    sessionId: 'cs_test_pending',
    amount: 4500,
    currency: 'usd',
    paymentStatus: 'unpaid' as const,
    credits: 500,
    packageType: 'POPULAR' as const,
  },
} as const;

/**
 * Transaction history scenarios
 */
export const TRANSACTION_HISTORY = {
  /** Active user with mixed transactions */
  activeUser: [
    {
      creditsAmount: 100,
      transactionType: 'monthly-allocation',
      description: 'Monthly credit allocation',
      createdAt: new Date('2024-12-01T00:00:00Z'),
    },
    {
      creditsAmount: -100,
      transactionType: 'consumption',
      description: 'Practice session',
      createdAt: new Date('2024-12-02T10:00:00Z'),
    },
    {
      creditsAmount: 500,
      transactionType: 'top-up',
      description: 'Credit purchase - POPULAR',
      createdAt: new Date('2024-12-03T15:30:00Z'),
    },
    {
      creditsAmount: -100,
      transactionType: 'consumption',
      description: 'Practice session',
      createdAt: new Date('2024-12-04T09:00:00Z'),
    },
  ],

  /** New user - first month */
  newUser: [
    {
      creditsAmount: 100,
      transactionType: 'monthly-allocation',
      description: 'Welcome credits - first month',
      createdAt: new Date('2024-12-01T00:00:00Z'),
    },
  ],

  /** Heavy user */
  heavyUser: [
    {
      creditsAmount: 100,
      transactionType: 'monthly-allocation',
      description: 'Monthly credits',
      createdAt: new Date('2024-12-01T00:00:00Z'),
    },
    {
      creditsAmount: -100,
      transactionType: 'consumption',
      description: 'Practice session 1',
      createdAt: new Date('2024-12-01T08:00:00Z'),
    },
    {
      creditsAmount: 2000,
      transactionType: 'top-up',
      description: 'Credit purchase - BULK',
      createdAt: new Date('2024-12-01T12:00:00Z'),
    },
    {
      creditsAmount: -100,
      transactionType: 'consumption',
      description: 'Practice session 2',
      createdAt: new Date('2024-12-02T08:00:00Z'),
    },
    {
      creditsAmount: -100,
      transactionType: 'consumption',
      description: 'Practice session 3',
      createdAt: new Date('2024-12-02T14:00:00Z'),
    },
    {
      creditsAmount: -100,
      transactionType: 'consumption',
      description: 'Practice session 4',
      createdAt: new Date('2024-12-03T08:00:00Z'),
    },
  ],

  /** User with refunds */
  withRefunds: [
    {
      creditsAmount: 100,
      transactionType: 'monthly-allocation',
      description: 'Monthly credits',
      createdAt: new Date('2024-12-01T00:00:00Z'),
    },
    {
      creditsAmount: -100,
      transactionType: 'consumption',
      description: 'Practice session',
      createdAt: new Date('2024-12-02T10:00:00Z'),
    },
    {
      creditsAmount: 100,
      transactionType: 'refund',
      description: 'Refund for cancelled session',
      createdAt: new Date('2024-12-02T10:30:00Z'),
    },
  ],
} as const;

/**
 * Generate bulk transactions for testing
 *
 * @param count - Number of transactions to generate
 * @param userId - User ID for transactions
 * @param type - Transaction type (default: 'consumption')
 * @returns Array of transaction fixtures
 *
 * @example
 * const transactions = generateBulkTransactions(50, 'user-123', 'consumption');
 */
export function generateBulkTransactions(
  count: number,
  userId: string,
  type: 'consumption' | 'top-up' | 'monthly-allocation' | 'refund' = 'consumption'
): Array<{
  userId: string;
  creditsAmount: number;
  transactionType: string;
  description: string;
  featureUsed: string | null;
  balanceAfter: number;
}> {
  const transactions = [];
  let balance = 1000;

  for (let i = 0; i < count; i++) {
    const amount = type === 'consumption' ? -100 : 100;
    balance += amount;

    transactions.push({
      userId,
      creditsAmount: amount,
      transactionType: type,
      description: `Bulk test transaction ${i + 1}`,
      featureUsed: type === 'consumption' ? 'test-feature' : null,
      balanceAfter: balance,
    });
  }

  return transactions;
}

/**
 * Credit balance scenarios
 */
export const BALANCE_SCENARIOS = {
  /** Starting with zero, multiple top-ups */
  zeroToHero: [
    { amount: 0, type: 'initial' },
    { amount: 500, type: 'top-up', description: 'First purchase' },
    { amount: 500, type: 'top-up', description: 'Second purchase' },
    { amount: 2000, type: 'top-up', description: 'Bulk purchase' },
    // Final balance: 3000
  ],

  /** Heavy consumption */
  heavyConsumption: [
    { amount: 1000, type: 'initial' },
    { amount: -100, type: 'consumption', description: 'Session 1' },
    { amount: -100, type: 'consumption', description: 'Session 2' },
    { amount: -100, type: 'consumption', description: 'Session 3' },
    { amount: -100, type: 'consumption', description: 'Session 4' },
    { amount: -100, type: 'consumption', description: 'Session 5' },
    // Final balance: 500
  ],

  /** Mixed activity */
  mixedActivity: [
    { amount: 100, type: 'monthly-allocation' },
    { amount: -100, type: 'consumption', description: 'Used monthly credits' },
    { amount: 500, type: 'top-up', description: 'Purchase' },
    { amount: -100, type: 'consumption', description: 'Session 1' },
    { amount: -100, type: 'consumption', description: 'Session 2' },
    { amount: 100, type: 'refund', description: 'Cancelled session' },
    // Final balance: 400
  ],
} as const;

/**
 * Admin transaction scenarios
 */
export const ADMIN_TRANSACTIONS = {
  /** Credit adjustment */
  creditAdjustment: {
    creditsAmount: 1000,
    transactionType: 'top-up' as const,
    description: 'Admin credit adjustment - customer support',
    adminId: 'admin-123',
    reason: 'Customer requested additional credits',
  },

  /** Promotional credits */
  promotional: {
    creditsAmount: 500,
    transactionType: 'top-up' as const,
    description: 'Promotional credits - new user bonus',
    adminId: 'admin-123',
    reason: 'New user promotion',
  },

  /** Credit correction */
  correction: {
    creditsAmount: -200,
    transactionType: 'consumption' as const,
    description: 'Credit correction - duplicate transaction',
    adminId: 'admin-123',
    reason: 'Correcting duplicate credit grant',
  },
} as const;
