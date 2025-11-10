# Integration Test Examples: Credit & Gamification Systems

**Research Date**: 2025-11-01
**For**: P3 Interview Academy Phase 6 Testing
**Tech Stack**: Vitest + Supertest + PostgreSQL + Express.js

---

## Overview

This document provides **code-ready integration test examples** for P3's credit purchase and gamification systems. These tests use real database operations (ephemeral test DB) and validate multi-step user journeys.

---

## 1. Test Architecture Setup

### Database Test Setup (Recommended Pattern)

```typescript
// server/__tests__/setup/test-database.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { migrate } from 'drizzle-orm/postgres-js/migrator';

let testDb: ReturnType<typeof drizzle>;
let testClient: ReturnType<typeof postgres>;

export async function setupTestDatabase() {
  // Use separate test database
  const connectionString = process.env.DATABASE_URL!.replace('/postgres', '/p3_test');

  testClient = postgres(connectionString, { max: 1 });
  testDb = drizzle(testClient);

  // Run migrations
  await migrate(testDb, { migrationsFolder: './drizzle' });

  return testDb;
}

export async function teardownTestDatabase() {
  await testClient.end();
}

export async function clearTestData() {
  // Clear in reverse order of foreign key dependencies
  await testDb.delete(creditTransactions);
  await testDb.delete(userBadges);
  await testDb.delete(xpHistory);
  await testDb.delete(referrals);
  await testDb.delete(users);
}
```

### Vitest Config for Integration Tests

```typescript
// vitest.config.integration.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    name: 'integration',
    include: ['**/*.integration.test.ts'],
    environment: 'node',
    setupFiles: ['./server/__tests__/setup/integration-setup.ts'],
    testTimeout: 10000, // Longer timeout for DB operations
    hookTimeout: 10000,
    teardownTimeout: 10000,
  },
});
```

---

## 2. Credit Purchase Flow Tests

### Test 1: Complete Credit Purchase Journey

```typescript
// server/__tests__/integration/credit-purchase.integration.test.ts
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import Stripe from 'stripe';
import { app } from '../../index';
import { setupTestDatabase, clearTestData, teardownTestDatabase } from '../setup/test-database';
import { db } from '../../db';
import { users, creditTransactions } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_TEST_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

describe('Credit Purchase Integration', () => {
  let testUserId: string;
  let authCookie: string;

  beforeEach(async () => {
    await setupTestDatabase();
    await clearTestData();

    // Create test user
    const [user] = await db.insert(users).values({
      email: 'test@example.com',
      password: 'hashedpassword',
      firstName: 'Test',
      lastName: 'User',
      creditBalance: 0,
      xpPoints: 0,
    }).returning();

    testUserId = user.id;

    // Get auth session (login)
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password' });

    authCookie = loginRes.headers['set-cookie'][0];
  });

  afterAll(async () => {
    await clearTestData();
    await teardownTestDatabase();
  });

  it('should complete full credit purchase flow: checkout → webhook → balance update', async () => {
    // Step 1: Create checkout session
    const checkoutRes = await request(app)
      .post('/api/billing/create-checkout-session')
      .set('Cookie', authCookie)
      .send({
        priceId: process.env.STRIPE_PRICE_TOPUP_100!, // 100 credits
        packageType: 'topup_100',
      });

    expect(checkoutRes.status).toBe(200);
    expect(checkoutRes.body.success).toBe(true);
    expect(checkoutRes.body.data.sessionId).toBeDefined();

    const sessionId = checkoutRes.body.data.sessionId;

    // Step 2: Retrieve checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    expect(session.metadata?.userId).toBe(testUserId);
    expect(session.metadata?.creditAmount).toBe('100');

    // Step 3: Simulate successful payment (complete the session)
    // In Stripe test mode, we can mark session as paid
    await stripe.checkout.sessions.expire(sessionId); // Expire to complete
    const completedSession = await stripe.checkout.sessions.retrieve(sessionId);
    expect(completedSession.payment_status).toBe('paid');

    // Step 4: Manually trigger webhook handler (since we can't wait for Stripe CLI)
    const webhookEvent = stripe.webhooks.constructEvent(
      JSON.stringify({
        id: `evt_test_${Date.now()}`,
        type: 'checkout.session.completed',
        data: { object: completedSession },
      }),
      // Generate test signature
      stripe.webhooks.generateTestHeaderString({
        payload: JSON.stringify({
          id: `evt_test_${Date.now()}`,
          type: 'checkout.session.completed',
          data: { object: completedSession },
        }),
        secret: process.env.STRIPE_TEST_WEBHOOK_SECRET!,
      }),
      process.env.STRIPE_TEST_WEBHOOK_SECRET!
    );

    const webhookRes = await request(app)
      .post('/api/webhooks/stripe')
      .set('stripe-signature', webhookEvent.id)
      .send(webhookEvent);

    expect(webhookRes.status).toBe(200);

    // Step 5: Verify credit balance updated
    const [updatedUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, testUserId));

    expect(updatedUser.creditBalance).toBe(100);

    // Step 6: Verify transaction logged
    const transactions = await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, testUserId));

    expect(transactions).toHaveLength(1);
    expect(transactions[0].amount).toBe(100);
    expect(transactions[0].type).toBe('topup');
    expect(transactions[0].status).toBe('completed');
    expect(transactions[0].stripeSessionId).toBe(sessionId);
  });

  it('should handle duplicate webhook delivery (idempotency)', async () => {
    // Create a completed checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: process.env.STRIPE_PRICE_TOPUP_100!, quantity: 1 }],
      mode: 'payment',
      success_url: 'http://localhost:5000/success',
      cancel_url: 'http://localhost:5000/cancel',
      metadata: { userId: testUserId, creditAmount: '100' },
    });

    const event = {
      id: `evt_duplicate_${Date.now()}`,
      type: 'checkout.session.completed',
      data: { object: session },
    };

    // Send webhook event first time
    await request(app)
      .post('/api/webhooks/stripe')
      .send(event);

    // Verify credits added
    let [user] = await db.select().from(users).where(eq(users.id, testUserId));
    expect(user.creditBalance).toBe(100);

    // Send same webhook event second time (duplicate delivery)
    await request(app)
      .post('/api/webhooks/stripe')
      .send(event);

    // Verify credits NOT added twice
    [user] = await db.select().from(users).where(eq(users.id, testUserId));
    expect(user.creditBalance).toBe(100); // Still 100, not 200

    // Verify only one transaction logged
    const transactions = await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, testUserId));

    expect(transactions).toHaveLength(1);
  });

  it('should deduct credits when starting practice session', async () => {
    // Setup: User has 100 credits
    await db.update(users)
      .set({ creditBalance: 100 })
      .where(eq(users.id, testUserId));

    // Start practice session (costs 10 credits)
    const sessionRes = await request(app)
      .post('/api/practice/sessions')
      .set('Cookie', authCookie)
      .send({
        difficulty: 'medium',
        jobDescription: 'Software Engineer',
      });

    expect(sessionRes.status).toBe(201);

    // Verify credits deducted
    const [user] = await db.select().from(users).where(eq(users.id, testUserId));
    expect(user.creditBalance).toBe(90);

    // Verify deduction logged
    const transactions = await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, testUserId));

    expect(transactions).toHaveLength(1);
    expect(transactions[0].amount).toBe(-10);
    expect(transactions[0].type).toBe('practice_session');
  });

  it('should return error when insufficient credits', async () => {
    // User has only 5 credits
    await db.update(users)
      .set({ creditBalance: 5 })
      .where(eq(users.id, testUserId));

    // Try to start practice session (costs 10 credits)
    const sessionRes = await request(app)
      .post('/api/practice/sessions')
      .set('Cookie', authCookie)
      .send({
        difficulty: 'medium',
        jobDescription: 'Software Engineer',
      });

    expect(sessionRes.status).toBe(403);
    expect(sessionRes.body.error).toContain('Insufficient credits');

    // Verify no credits deducted
    const [user] = await db.select().from(users).where(eq(users.id, testUserId));
    expect(user.creditBalance).toBe(5);
  });
});
```

---

## 3. Gamification System Tests

### Test 2: XP Award and Badge Unlocking Journey

```typescript
// server/__tests__/integration/gamification.integration.test.ts
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../index';
import { setupTestDatabase, clearTestData, teardownTestDatabase } from '../setup/test-database';
import { db } from '../../db';
import { users, badges, userBadges, xpHistory } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

describe('Gamification System Integration', () => {
  let testUserId: string;
  let authCookie: string;
  let firstStepsBadgeId: string;

  beforeEach(async () => {
    await setupTestDatabase();
    await clearTestData();

    // Create test user
    const [user] = await db.insert(users).values({
      email: 'gamer@example.com',
      password: 'hashedpassword',
      firstName: 'Gamer',
      lastName: 'User',
      xpPoints: 0,
      currentStreak: 0,
      longestStreak: 0,
    }).returning();

    testUserId = user.id;

    // Create "First Steps" badge (1 module completion, 50 XP reward)
    const [badge] = await db.insert(badges).values({
      name: 'First Steps',
      description: 'Complete your first learning module',
      category: 'learning',
      tier: 'common',
      requirementType: 'module_completion',
      requirementValue: 1,
      xpReward: 50,
      isActive: true,
    }).returning();

    firstStepsBadgeId = badge.id;

    // Login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'gamer@example.com', password: 'password' });

    authCookie = loginRes.headers['set-cookie'][0];
  });

  afterAll(async () => {
    await clearTestData();
    await teardownTestDatabase();
  });

  it('should award XP and unlock badge when completing first module', async () => {
    // Step 1: User completes a learning module
    const moduleRes = await request(app)
      .post('/api/prepare/modules/1/complete')
      .set('Cookie', authCookie);

    expect(moduleRes.status).toBe(200);

    // Step 2: Verify XP awarded (20 XP for module completion)
    let [user] = await db.select().from(users).where(eq(users.id, testUserId));
    expect(user.xpPoints).toBeGreaterThanOrEqual(20);

    // Step 3: Verify XP logged in history
    const xpRecords = await db
      .select()
      .from(xpHistory)
      .where(eq(xpHistory.userId, testUserId));

    expect(xpRecords.length).toBeGreaterThan(0);
    expect(xpRecords[0].source).toBe('module_completion');

    // Step 4: Check badge progress
    const badgeRes = await request(app)
      .get('/api/gamification/user-badges')
      .set('Cookie', authCookie);

    expect(badgeRes.status).toBe(200);
    const userBadge = badgeRes.body.data.badges.find(
      (b: any) => b.id === firstStepsBadgeId
    );

    expect(userBadge).toBeDefined();
    expect(userBadge.progress).toBe(1);
    expect(userBadge.isEarned).toBe(true);

    // Step 5: Verify badge earned in database
    const earnedBadges = await db
      .select()
      .from(userBadges)
      .where(eq(userBadges.userId, testUserId));

    expect(earnedBadges).toHaveLength(1);
    expect(earnedBadges[0].badgeId).toBe(firstStepsBadgeId);
    expect(earnedBadges[0].earnedDate).toBeDefined();

    // Step 6: Verify badge XP reward added
    [user] = await db.select().from(users).where(eq(users.id, testUserId));
    expect(user.xpPoints).toBeGreaterThanOrEqual(70); // 20 (module) + 50 (badge)
  });

  it('should update streak and award bonus XP for consecutive days', async () => {
    // Day 1: Complete activity
    await request(app)
      .post('/api/gamification/update-streak')
      .set('Cookie', authCookie);

    let [user] = await db.select().from(users).where(eq(users.id, testUserId));
    expect(user.currentStreak).toBe(1);

    // Simulate next day (mock system time in service)
    // ... (implementation depends on your streak logic)

    // Day 2: Complete activity
    await request(app)
      .post('/api/gamification/update-streak')
      .set('Cookie', authCookie);

    [user] = await db.select().from(users).where(eq(users.id, testUserId));
    expect(user.currentStreak).toBe(2);

    // Check for streak bonus XP
    const xpRecords = await db
      .select()
      .from(xpHistory)
      .where(eq(xpHistory.userId, testUserId));

    const streakBonus = xpRecords.find(x => x.source === 'daily_streak');
    expect(streakBonus).toBeDefined();
    expect(streakBonus!.pointsEarned).toBeGreaterThan(0);
  });

  it('should calculate readiness score based on multiple factors', async () => {
    // Setup: User has some progress
    await db.update(users)
      .set({
        xpPoints: 500,
        currentStreak: 5,
      })
      .where(eq(users.id, testUserId));

    // Complete a module (20% weight)
    await request(app)
      .post('/api/prepare/modules/1/complete')
      .set('Cookie', authCookie);

    // Complete a practice simulation (60% weight)
    const sessionRes = await request(app)
      .post('/api/practice/sessions')
      .set('Cookie', authCookie)
      .send({ difficulty: 'medium', jobDescription: 'Software Engineer' });

    const sessionId = sessionRes.body.data.id;

    await request(app)
      .post(`/api/practice/sessions/${sessionId}/complete`)
      .set('Cookie', authCookie)
      .send({ performanceScore: 85 });

    // Get readiness score
    const readinessRes = await request(app)
      .get('/api/gamification/readiness-score')
      .set('Cookie', authCookie);

    expect(readinessRes.status).toBe(200);
    expect(readinessRes.body.data.score).toBeGreaterThan(0);
    expect(readinessRes.body.data.score).toBeLessThanOrEqual(100);
    expect(readinessRes.body.data.breakdown).toBeDefined();
    expect(readinessRes.body.data.breakdown.simulationPerformance).toBeDefined();
    expect(readinessRes.body.data.breakdown.moduleCompletion).toBeDefined();
  });
});
```

---

## 4. Referral System Tests

### Test 3: Referral Code Generation and Reward Distribution

```typescript
// server/__tests__/integration/referrals.integration.test.ts
import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../index';
import { setupTestDatabase, clearTestData, teardownTestDatabase } from '../setup/test-database';
import { db } from '../../db';
import { users, referrals, creditTransactions } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

describe('Referral System Integration', () => {
  let referrerUserId: string;
  let referrerAuthCookie: string;

  beforeEach(async () => {
    await setupTestDatabase();
    await clearTestData();

    // Create referrer user
    const [user] = await db.insert(users).values({
      email: 'referrer@example.com',
      password: 'hashedpassword',
      firstName: 'Referrer',
      lastName: 'User',
      creditBalance: 100,
      xpPoints: 0,
    }).returning();

    referrerUserId = user.id;

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'referrer@example.com', password: 'password' });

    referrerAuthCookie = loginRes.headers['set-cookie'][0];
  });

  afterAll(async () => {
    await clearTestData();
    await teardownTestDatabase();
  });

  it('should complete full referral journey: code generation → new signup → rewards', async () => {
    // Step 1: Generate referral code
    const codeRes = await request(app)
      .post('/api/referrals/create')
      .set('Cookie', referrerAuthCookie);

    expect(codeRes.status).toBe(201);
    expect(codeRes.body.success).toBe(true);
    expect(codeRes.body.data.code).toMatch(/^[A-Z0-9]{8}$/); // 8-char alphanumeric

    const referralCode = codeRes.body.data.code;

    // Step 2: New user signs up with referral code
    const signupRes = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        referralCode: referralCode,
      });

    expect(signupRes.status).toBe(201);
    const newUserId = signupRes.body.data.userId;

    // Step 3: Verify referral recorded in database
    const referralRecords = await db
      .select()
      .from(referrals)
      .where(eq(referrals.referrerUserId, referrerUserId));

    expect(referralRecords).toHaveLength(1);
    expect(referralRecords[0].referredUserId).toBe(newUserId);
    expect(referralRecords[0].status).toBe('pending'); // Not rewarded yet

    // Step 4: New user completes qualifying action (e.g., first practice session)
    const newUserLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'newuser@example.com', password: 'password123' });

    const newUserAuthCookie = newUserLoginRes.headers['set-cookie'][0];

    // Give new user credits to start session
    await db.update(users)
      .set({ creditBalance: 50 })
      .where(eq(users.id, newUserId));

    const practiceRes = await request(app)
      .post('/api/practice/sessions')
      .set('Cookie', newUserAuthCookie)
      .send({ difficulty: 'medium', jobDescription: 'Developer' });

    expect(practiceRes.status).toBe(201);

    // Step 5: Verify referrer received rewards
    const [referrer] = await db
      .select()
      .from(users)
      .where(eq(users.id, referrerUserId));

    expect(referrer.creditBalance).toBe(150); // 100 + 50 referral reward
    expect(referrer.xpPoints).toBeGreaterThanOrEqual(100); // Referral XP bonus

    // Step 6: Verify new user received signup bonus
    const [newUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, newUserId));

    expect(newUser.creditBalance).toBeGreaterThanOrEqual(25); // Signup bonus

    // Step 7: Verify referral status updated
    const [updatedReferral] = await db
      .select()
      .from(referrals)
      .where(eq(referrals.referredUserId, newUserId));

    expect(updatedReferral.status).toBe('completed');
    expect(updatedReferral.rewardedAt).toBeDefined();

    // Step 8: Verify credit transactions logged
    const referrerTransactions = await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, referrerUserId));

    const referralReward = referrerTransactions.find(t => t.type === 'referral_reward');
    expect(referralReward).toBeDefined();
    expect(referralReward!.amount).toBe(50);
  });

  it('should reject invalid referral codes', async () => {
    const signupRes = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        referralCode: 'INVALID123',
      });

    expect(signupRes.status).toBe(400);
    expect(signupRes.body.error).toContain('Invalid referral code');
  });

  it('should prevent self-referral', async () => {
    // Get user's own referral code
    const codeRes = await request(app)
      .get('/api/referrals/code')
      .set('Cookie', referrerAuthCookie);

    const selfCode = codeRes.body.data.code;

    // Try to use own code (should be prevented at signup)
    const signupRes = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'referrer@example.com', // Same email
        password: 'password123',
        firstName: 'Self',
        lastName: 'Referral',
        referralCode: selfCode,
      });

    expect(signupRes.status).toBe(400);
  });
});
```

---

## 5. Mock Stripe Helper for Testing

```typescript
// server/__tests__/helpers/stripe-mock.ts
import Stripe from 'stripe';

/**
 * Creates a mock Stripe checkout session for testing
 */
export function createMockCheckoutSession(
  overrides: Partial<Stripe.Checkout.Session> = {}
): Stripe.Checkout.Session {
  return {
    id: `cs_test_${Date.now()}`,
    object: 'checkout.session',
    payment_status: 'paid',
    status: 'complete',
    customer: 'cus_test123',
    metadata: {
      userId: 'test-user-123',
      creditAmount: '100',
      ...overrides.metadata,
    },
    amount_total: 1000, // $10.00 in cents
    currency: 'usd',
    ...overrides,
  } as Stripe.Checkout.Session;
}

/**
 * Generates a valid Stripe webhook signature for testing
 */
export function generateStripeWebhookSignature(
  payload: string,
  secret: string
): string {
  const stripe = new Stripe(process.env.STRIPE_TEST_SECRET_KEY!, {
    apiVersion: '2024-11-20.acacia',
  });

  return stripe.webhooks.generateTestHeaderString({
    payload,
    secret,
  });
}
```

---

## 6. Test Data Factories

```typescript
// server/__tests__/factories/user-factory.ts
import { db } from '../../db';
import { users } from '../../../shared/schema';

export async function createTestUser(overrides: Partial<typeof users.$inferInsert> = {}) {
  const [user] = await db.insert(users).values({
    email: `test-${Date.now()}@example.com`,
    password: 'hashed_password',
    firstName: 'Test',
    lastName: 'User',
    creditBalance: 100,
    xpPoints: 0,
    currentStreak: 0,
    longestStreak: 0,
    readinessScore: 0,
    ...overrides,
  }).returning();

  return user;
}

export async function createTestUserWithCredits(credits: number) {
  return createTestUser({ creditBalance: credits });
}

export async function createTestUserWithXP(xp: number) {
  return createTestUser({ xpPoints: xp });
}
```

---

## 7. Running Integration Tests

### Package.json Scripts

```json
{
  "scripts": {
    "test:integration": "vitest run --config vitest.config.integration.ts",
    "test:integration:watch": "vitest --config vitest.config.integration.ts",
    "test:integration:ui": "vitest --ui --config vitest.config.integration.ts"
  }
}
```

### Run Commands

```bash
# Run all integration tests once
npm run test:integration

# Run with watch mode
npm run test:integration:watch

# Run specific test file
npm run test:integration credit-purchase.integration.test.ts

# Run with UI
npm run test:integration:ui
```

---

## 8. Key Patterns Used

### ✅ Best Practices Applied

1. **Real Database Operations**: Uses ephemeral test database, not mocks
2. **Complete User Journeys**: Tests multi-step flows end-to-end
3. **Idempotency Testing**: Verifies duplicate webhook handling
4. **Authorization Testing**: Tests with authenticated sessions
5. **Data Cleanup**: Clears test data after each test
6. **Transaction Verification**: Checks database state after operations
7. **Error Cases**: Tests insufficient credits, invalid codes, etc.

### 📝 Test Structure

Each integration test follows this pattern:
1. **Setup** → Create test user, login, seed data
2. **Act** → Perform multi-step user journey
3. **Assert** → Verify database state, API responses
4. **Cleanup** → Clear test data

---

## 9. Next Steps

After implementing these tests:

1. **Add to CI/CD Pipeline**:
   ```yaml
   # .github/workflows/test.yml
   - name: Run Integration Tests
     run: npm run test:integration
     env:
       DATABASE_URL: ${{ secrets.TEST_DATABASE_URL }}
       STRIPE_TEST_SECRET_KEY: ${{ secrets.STRIPE_TEST_SECRET_KEY }}
   ```

2. **Create Test Database**:
   ```bash
   createdb p3_test
   npm run db:push -- --database-url=$DATABASE_URL_TEST
   ```

3. **Document Edge Cases**: Add tests for:
   - Concurrent credit purchases
   - Race conditions in badge unlocking
   - Failed payment retries
   - Subscription upgrades/downgrades

---

**Last Updated**: 2025-11-01
**Status**: ✅ Ready for Implementation
**Files to Create**: 4 new integration test files
