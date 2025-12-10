/**
 * Test Scenario Fixtures
 *
 * Complete end-to-end test scenarios combining users, sessions, and transactions:
 * - User journeys
 * - Edge cases
 * - Error scenarios
 * - Performance test scenarios
 *
 * @module fixtures/scenarios
 */

/**
 * Complete user journey scenarios
 */
export const USER_JOURNEYS = {
  /** New user onboarding and first session */
  newUserJourney: {
    user: {
      email: 'newuser@test.com',
      password: 'NewUser123!@#',
      role: 'user' as const,
      credits: 100,
      monthlyAllocation: 100,
    },
    steps: [
      { action: 'register', description: 'User registers account' },
      { action: 'verify_email', description: 'User verifies email' },
      { action: 'login', description: 'User logs in' },
      { action: 'start_practice', description: 'User starts first practice session' },
      { action: 'complete_session', description: 'User completes session' },
      { action: 'view_feedback', description: 'User views performance feedback' },
    ],
    expectedCredits: {
      start: 100,
      afterSession: 0,
    },
  },

  /** Power user with multiple sessions */
  powerUserJourney: {
    user: {
      email: 'poweruser@test.com',
      password: 'Power123!@#',
      role: 'user' as const,
      credits: 1000,
      monthlyAllocation: 100,
      topUpCredits: 900,
    },
    steps: [
      { action: 'login', description: 'User logs in' },
      { action: 'start_practice', description: 'Start session 1' },
      { action: 'complete_session', description: 'Complete session 1' },
      { action: 'start_practice', description: 'Start session 2' },
      { action: 'complete_session', description: 'Complete session 2' },
      { action: 'start_practice', description: 'Start session 3' },
      { action: 'complete_session', description: 'Complete session 3' },
      { action: 'view_analytics', description: 'View performance analytics' },
    ],
    expectedCredits: {
      start: 1000,
      afterSessions: 700, // 1000 - (3 * 100)
    },
  },

  /** User runs out of credits and purchases more */
  purchaseJourney: {
    user: {
      email: 'purchase@test.com',
      password: 'Purchase123!@#',
      role: 'user' as const,
      credits: 50,
      monthlyAllocation: 50,
    },
    steps: [
      { action: 'login', description: 'User logs in' },
      { action: 'start_practice', description: 'Attempt to start session' },
      { action: 'insufficient_credits', description: 'Error: insufficient credits' },
      { action: 'view_pricing', description: 'User views pricing page' },
      { action: 'purchase_credits', description: 'User purchases 500 credits' },
      { action: 'payment_success', description: 'Payment processed successfully' },
      { action: 'start_practice', description: 'Start session with new credits' },
      { action: 'complete_session', description: 'Complete session' },
    ],
    expectedCredits: {
      start: 50,
      afterPurchase: 550, // 50 + 500
      afterSession: 450, // 550 - 100
    },
  },
} as const;

/**
 * Edge case scenarios
 */
export const EDGE_CASES = {
  /** User with exactly enough credits */
  exactBalance: {
    user: {
      email: 'exact@test.com',
      credits: 100,
    },
    session: {
      cost: 100,
    },
    expectedOutcome: {
      success: true,
      finalBalance: 0,
    },
  },

  /** User with one credit less than required */
  oneShort: {
    user: {
      email: 'oneshort@test.com',
      credits: 99,
    },
    session: {
      cost: 100,
    },
    expectedOutcome: {
      success: false,
      error: 'Insufficient credits',
      finalBalance: 99,
    },
  },

  /** Concurrent session attempts */
  concurrentSessions: {
    user: {
      email: 'concurrent@test.com',
      credits: 150,
    },
    sessions: [
      { id: 'session-1', cost: 100 },
      { id: 'session-2', cost: 100 },
    ],
    expectedOutcome: {
      firstSuccess: true,
      secondSuccess: false,
      finalBalance: 50,
    },
  },

  /** Session cancelled mid-way */
  cancelledSession: {
    user: {
      email: 'cancelled@test.com',
      credits: 1000,
    },
    session: {
      cost: 100,
      questionsTotal: 5,
      questionsCompleted: 2,
    },
    expectedOutcome: {
      refund: 0, // No refund for cancelled sessions
      finalBalance: 900,
    },
  },

  /** Duplicate payment webhook */
  duplicateWebhook: {
    user: {
      email: 'duplicate@test.com',
      credits: 100,
    },
    payment: {
      sessionId: 'cs_test_duplicate',
      amount: 500,
    },
    webhooks: [
      { timestamp: '2024-12-01T10:00:00Z', eventId: 'evt_1' },
      { timestamp: '2024-12-01T10:00:05Z', eventId: 'evt_1' }, // Duplicate
      { timestamp: '2024-12-01T10:00:10Z', eventId: 'evt_1' }, // Duplicate
    ],
    expectedOutcome: {
      creditsGranted: 500, // Only once
      finalBalance: 600,
      processedWebhooks: 1,
      ignoredWebhooks: 2,
    },
  },
} as const;

/**
 * Error scenarios
 */
export const ERROR_SCENARIOS = {
  /** Invalid session state */
  invalidSessionState: {
    description: 'Attempting to continue an already completed session',
    user: { email: 'user@test.com', credits: 100 },
    session: { id: 'session-1', status: 'completed' },
    action: 'continue_session',
    expectedError: 'Session is already completed',
  },

  /** Payment processing failure */
  paymentFailure: {
    description: 'Stripe payment declined',
    user: { email: 'user@test.com', credits: 100 },
    payment: {
      sessionId: 'cs_test_failed',
      amount: 4500,
      credits: 500,
    },
    webhookEvent: 'checkout.session.expired',
    expectedOutcome: {
      creditsGranted: 0,
      finalBalance: 100,
      error: 'Payment failed',
    },
  },

  /** Network timeout during AI call */
  aiTimeout: {
    description: 'OpenAI API timeout',
    user: { email: 'user@test.com', credits: 100 },
    session: { id: 'session-1', question: 'What is your experience?' },
    expectedOutcome: {
      error: 'AI service timeout',
      creditsRefunded: true,
      finalBalance: 100,
    },
  },

  /** Database connection failure */
  databaseError: {
    description: 'Database connection lost during transaction',
    user: { email: 'user@test.com', credits: 100 },
    operation: 'deduct_credits',
    expectedOutcome: {
      error: 'Database error',
      rollback: true,
      finalBalance: 100, // Unchanged due to rollback
    },
  },
} as const;

/**
 * Performance test scenarios
 */
export const PERFORMANCE_SCENARIOS = {
  /** Concurrent user load */
  concurrentUsers: {
    userCount: 100,
    sessionsPerUser: 5,
    totalSessions: 500,
    expectedDuration: '< 30 seconds',
    successRate: '> 99%',
  },

  /** Bulk credit transactions */
  bulkTransactions: {
    userCount: 50,
    transactionsPerUser: 100,
    totalTransactions: 5000,
    expectedDuration: '< 60 seconds',
    dataIntegrity: 'All balances accurate',
  },

  /** High-frequency webhook processing */
  webhookLoad: {
    webhooksPerSecond: 50,
    duration: 60, // seconds
    totalWebhooks: 3000,
    expectedIdempotency: '100%',
    duplicateRate: '10%', // Intentional duplicates for testing
  },

  /** Stress test - low credits, many users */
  stressTest: {
    userCount: 200,
    creditsPerUser: 100, // Just enough for 1 session
    concurrentAttempts: 200,
    expectedBehavior: 'Graceful degradation',
    expectedErrors: 'Insufficient credits errors for users who lost the race',
  },
} as const;

/**
 * Admin workflow scenarios
 */
export const ADMIN_WORKFLOWS = {
  /** Admin adjusts user credits */
  creditAdjustment: {
    admin: { email: 'admin@test.com', role: 'admin' },
    targetUser: { email: 'user@test.com', credits: 100 },
    adjustment: {
      amount: 500,
      reason: 'Customer support compensation',
    },
    expectedOutcome: {
      userCredits: 600,
      auditLogCreated: true,
    },
  },

  /** Admin views audit logs */
  auditLogReview: {
    admin: { email: 'admin@test.com', role: 'admin' },
    filters: {
      action: 'credit_adjustment',
      dateFrom: '2024-12-01',
      dateTo: '2024-12-31',
    },
    expectedResults: 'List of all credit adjustments in December',
  },

  /** Admin bulk credit reset */
  bulkCreditReset: {
    admin: { email: 'admin@test.com', role: 'admin' },
    targets: 'All users',
    operation: 'monthly_reset',
    expectedOutcome: {
      usersAffected: 'All active users',
      creditsReset: 'Monthly allocation restored',
      auditLog: 'Bulk operation logged',
    },
  },
} as const;

/**
 * Integration test scenarios
 */
export const INTEGRATION_SCENARIOS = {
  /** Complete purchase flow */
  completePurchaseFlow: {
    steps: [
      { service: 'Frontend', action: 'User clicks "Buy Credits"' },
      { service: 'Backend', action: 'Create Stripe checkout session' },
      { service: 'Stripe', action: 'Process payment' },
      { service: 'Stripe', action: 'Send webhook to backend' },
      { service: 'Backend', action: 'Verify webhook signature' },
      { service: 'Backend', action: 'Grant credits to user' },
      { service: 'Backend', action: 'Log transaction' },
      { service: 'Email', action: 'Send receipt email' },
      { service: 'Frontend', action: 'Show success message' },
    ],
    verificationPoints: [
      'Stripe session created with correct amount',
      'Webhook signature verified',
      'Credits added to user account',
      'Transaction logged in database',
      'Email sent to user',
      'UI updated with new balance',
    ],
  },

  /** Complete practice session flow */
  completePracticeFlow: {
    steps: [
      { service: 'Frontend', action: 'User starts practice session' },
      { service: 'Backend', action: 'Check credit balance' },
      { service: 'Backend', action: 'Deduct credits' },
      { service: 'Backend', action: 'Create session record' },
      { service: 'OpenAI', action: 'Generate interview question' },
      { service: 'Backend', action: 'Store question' },
      { service: 'Frontend', action: 'User answers question' },
      { service: 'Backend', action: 'Save user response' },
      { service: 'OpenAI', action: 'Evaluate response (STAR)' },
      { service: 'Backend', action: 'Store evaluation' },
      { service: 'Frontend', action: 'Display feedback' },
    ],
    verificationPoints: [
      'Credits deducted correctly',
      'Session created with correct state',
      'AI questions generated successfully',
      'User responses saved',
      'STAR evaluation completed',
      'Feedback displayed to user',
    ],
  },
} as const;

/**
 * Generate a complete test scenario
 *
 * @param scenarioType - Type of scenario to generate
 * @param customizations - Custom parameters
 * @returns Complete test scenario
 *
 * @example
 * const scenario = generateTestScenario('user_journey', {
 *   userCount: 10,
 *   sessionsPerUser: 3
 * });
 */
export function generateTestScenario(
  scenarioType: 'user_journey' | 'edge_case' | 'performance' | 'admin_workflow',
  customizations?: Record<string, any>
): any {
  const baseScenarios = {
    user_journey: USER_JOURNEYS.newUserJourney,
    edge_case: EDGE_CASES.exactBalance,
    performance: PERFORMANCE_SCENARIOS.concurrentUsers,
    admin_workflow: ADMIN_WORKFLOWS.creditAdjustment,
  };

  const base = baseScenarios[scenarioType];
  return { ...base, ...customizations };
}
