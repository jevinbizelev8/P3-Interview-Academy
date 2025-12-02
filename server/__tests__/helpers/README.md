# Test Helpers Documentation

Comprehensive test infrastructure and helper utilities for the P3 Interview Academy test suite.

## Overview

This directory contains reusable test helpers and utilities that eliminate code duplication and provide consistent testing patterns across all test files.

## Structure

```
helpers/
├── auth-helpers.ts       # Authentication and user management
├── database-helpers.ts   # Database operations and cleanup
├── stripe-helpers.ts     # Stripe payment mocking
├── openai-helpers.ts     # AI service mocking
└── index.ts             # Central export point
```

## Quick Start

```typescript
import {
  createTestUser,
  resetUserCredits,
  generateWebhookSignature,
  mockOpenAIResponse
} from '../helpers';

// Create a test user
const user = await createTestUser('test@example.com', 'user');

// Reset credits
await resetUserCredits(user.id, 500);

// Generate Stripe webhook
const signature = generateWebhookSignature(webhookPayload);

// Mock AI response
const aiResponse = mockOpenAIResponse("Great answer!");
```

## Helpers Documentation

### Authentication Helpers (`auth-helpers.ts`)

Utilities for testing authentication flows:

#### Key Functions

- **`createTestUser(email, role, password?, credits?)`**
  - Creates a test user in the database
  - Returns user object with id, email, role
  - Example: `const user = await createTestUser('test@example.com', 'user');`

- **`createMockSession(userId, role, email)`**
  - Creates a mock session object for middleware testing
  - Example: `const session = createMockSession(userId, 'admin', 'admin@test.com');`

- **`createMockRequest(session, params?, body?, query?)`**
  - Creates a mock Express request object
  - Example: `const req = createMockRequest(session, { id: '123' });`

- **`authenticateAsAdmin()`**
  - Returns authentication header for admin requests
  - Example: `const authHeader = await authenticateAsAdmin();`

- **`authenticateAsUser(email?)`**
  - Returns authentication header for user requests
  - Example: `const authHeader = await authenticateAsUser('user@test.com');`

#### Constants

- `TEST_USER_IDS`: Pre-defined UUIDs for consistent testing

### Database Helpers (`database-helpers.ts`)

Utilities for database operations and cleanup:

#### Key Functions

- **`cleanupTestUsers()`**
  - Removes all test users (emails ending in @test.com)
  - Example: `await cleanupTestUsers();`

- **`cleanupAllTestData()`**
  - Cleans up all test data from multiple tables
  - Example: `await cleanupAllTestData();`

- **`seedTestData()`**
  - Creates standard test users (regular, admin, premium)
  - Returns object with created users
  - Example: `const { regularUser, adminUser } = await seedTestData();`

- **`resetUserCredits(userId, amount, topUpCredits?)`**
  - Resets user credit balance
  - Example: `await resetUserCredits('user-123', 500, 200);`

- **`withTransaction(callback)`**
  - Executes callback within a database transaction
  - Example: `await withTransaction(async (tx) => { /* operations */ });`

- **`truncateTable(tableName, cascade?)`**
  - Truncates a table (clears all data)
  - Example: `await truncateTable('credit_transactions', true);`

### Stripe Helpers (`stripe-helpers.ts`)

Utilities for testing Stripe payment integration:

#### Key Functions

- **`generateWebhookSignature(payload, secret?, timestamp?)`**
  - Generates a valid Stripe webhook signature
  - Example: `const sig = generateWebhookSignature(JSON.stringify(event));`

- **`createMockCheckoutSession(userId, credits, packageType?, paymentStatus?)`**
  - Creates a mock Stripe checkout session
  - Example: `const session = createMockCheckoutSession('user-123', 500, 'POPULAR');`

- **`createMockWebhookEvent(type, data, eventId?)`**
  - Creates a mock Stripe webhook event
  - Example: `const event = createMockWebhookEvent('checkout.session.completed', session);`

- **`createWebhookPayload(type, data, secret?)`**
  - Creates complete webhook payload with signature
  - Returns { payload, signature, event }
  - Example: `const { payload, signature } = createWebhookPayload('checkout.session.completed', session);`

- **`createSuccessfulPaymentEvent(userId, credits, packageType?)`**
  - Creates a complete successful payment webhook
  - Example: `const webhook = createSuccessfulPaymentEvent('user-123', 500);`

#### Constants

- `TEST_CARD_NUMBERS`: Official Stripe test card numbers
- `CREDIT_PACKAGES`: Credit package configurations (SMALL, POPULAR, BULK)

### OpenAI Helpers (`openai-helpers.ts`)

Utilities for testing AI service integration:

#### Key Functions

- **`mockOpenAIResponse(content, model?, tokens?)`**
  - Creates a mock OpenAI chat completion response
  - Example: `const response = mockOpenAIResponse("This is a great answer!");`

- **`mockStreamingResponse(content, chunkSize?, delayMs?)`**
  - Creates a mock streaming response (async generator)
  - Example: `const stream = mockStreamingResponse("Streaming content...");`

- **`simulateAIError(errorType)`**
  - Simulates various AI service errors
  - Error types: 'rate_limit', 'timeout', 'invalid_request', 'api_error', 'network_error', 'authentication'
  - Example: `const error = simulateAIError('rate_limit');`

- **`mockSTAREvaluation(answer, score?)`**
  - Creates a mock STAR method evaluation
  - Example: `const eval = mockSTAREvaluation(userAnswer, 85);`

- **`mockQuestionGeneration(jobRole, difficulty, count?)`**
  - Mocks interview question generation
  - Example: `const questions = mockQuestionGeneration('Software Engineer', 'medium', 5);`

#### Constants

- `MOCK_QUESTIONS`: Pre-defined interview questions (behavioral, technical, leadership, etc.)
- `MOCK_ANSWERS`: Pre-defined answers (good STAR, poor, excellent)

## Fixtures

Fixtures provide pre-defined test data for various scenarios. See `fixtures/` directory:

### User Fixtures (`fixtures/users.ts`)

- `TEST_USERS`: Standard test users (regular, admin, premium, low credit, etc.)
- `USER_CREDENTIALS`: Login credentials for testing
- `CREDIT_SCENARIOS`: Various credit balance scenarios
- `ROLE_FIXTURES`: Role-based user collections

### Session Fixtures (`fixtures/sessions.ts`)

- `PRACTICE_SESSIONS`: Practice session states (active, completed, cancelled)
- `PREPARATION_SESSIONS`: Preparation session configurations
- `INTERVIEW_SESSIONS`: Interview session setups
- `SESSION_RESPONSES`: Sample user responses

### Transaction Fixtures (`fixtures/transactions.ts`)

- `CREDIT_TRANSACTIONS`: Various credit transaction types
- `STRIPE_PAYMENTS`: Stripe payment scenarios
- `TRANSACTION_HISTORY`: Complete transaction histories

### Scenario Fixtures (`fixtures/scenarios.ts`)

- `USER_JOURNEYS`: Complete user journey scenarios
- `EDGE_CASES`: Edge case scenarios (exact balance, concurrent sessions, etc.)
- `ERROR_SCENARIOS`: Error handling scenarios
- `PERFORMANCE_SCENARIOS`: Performance test scenarios

## Usage Examples

### Example 1: Testing User Registration and First Session

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestUser, resetUserCredits, cleanupTestUsers } from '../helpers';
import { TEST_USERS } from '../fixtures';

describe('User Registration Flow', () => {
  beforeEach(async () => {
    await cleanupTestUsers();
  });

  afterEach(async () => {
    await cleanupTestUsers();
  });

  it('should allow new user to start a practice session', async () => {
    // Create test user
    const user = await createTestUser(
      TEST_USERS.regularUser.email,
      'user',
      TEST_USERS.regularUser.password,
      100
    );

    // User starts session (100 credits deducted)
    await startPracticeSession(user.id);

    // Verify credits deducted
    const credits = await getUserCredits(user.id);
    expect(credits.total).toBe(0);
  });
});
```

### Example 2: Testing Stripe Payment Flow

```typescript
import { describe, it, expect } from 'vitest';
import {
  createSuccessfulPaymentEvent,
  verifyWebhookSignature
} from '../helpers';

describe('Stripe Payment Flow', () => {
  it('should process successful payment webhook', async () => {
    const userId = 'user-123';
    const { payload, signature, session } = createSuccessfulPaymentEvent(
      userId,
      500,
      'POPULAR'
    );

    // Verify signature
    expect(verifyWebhookSignature(payload, signature, webhookSecret)).toBe(true);

    // Send webhook to endpoint
    const response = await request(app)
      .post('/api/webhooks/stripe')
      .set('stripe-signature', signature)
      .send(payload);

    expect(response.status).toBe(200);

    // Verify credits granted
    const credits = await getUserCredits(userId);
    expect(credits.total).toBe(600); // 100 + 500
  });
});
```

### Example 3: Testing AI Response Evaluation

```typescript
import { describe, it, expect } from 'vitest';
import {
  mockOpenAIResponse,
  mockSTAREvaluation,
  MOCK_ANSWERS
} from '../helpers';

describe('AI Response Evaluation', () => {
  it('should evaluate STAR method answer', async () => {
    const evaluation = mockSTAREvaluation(
      MOCK_ANSWERS.GOOD_STAR.full,
      85
    );

    expect(evaluation.overallScore).toBe(85);
    expect(evaluation.components.situation.present).toBe(true);
    expect(evaluation.components.task.present).toBe(true);
    expect(evaluation.components.action.present).toBe(true);
    expect(evaluation.components.result.present).toBe(true);
  });
});
```

### Example 4: Testing Concurrent Operations

```typescript
import { describe, it, expect } from 'vitest';
import {
  createTestUser,
  resetUserCredits,
  cleanupTestUsers
} from '../helpers';

describe('Concurrent Credit Deductions', () => {
  it('should handle concurrent session starts', async () => {
    const user = await createTestUser('concurrent@test.com', 'user');
    await resetUserCredits(user.id, 150); // Only enough for 1 session

    // Attempt 2 concurrent sessions
    const [result1, result2] = await Promise.allSettled([
      startPracticeSession(user.id),
      startPracticeSession(user.id),
    ]);

    // One should succeed, one should fail
    const successful = [result1, result2].filter(r => r.status === 'fulfilled').length;
    const failed = [result1, result2].filter(r => r.status === 'rejected').length;

    expect(successful).toBe(1);
    expect(failed).toBe(1);

    // Final balance should be 50 (150 - 100)
    const credits = await getUserCredits(user.id);
    expect(credits.total).toBe(50);
  });
});
```

## Best Practices

1. **Always clean up after tests**
   ```typescript
   afterEach(async () => {
     await cleanupTestUsers();
   });
   ```

2. **Use fixtures for consistency**
   ```typescript
   import { TEST_USERS } from '../fixtures';
   const user = await createTestUser(TEST_USERS.regularUser.email, 'user');
   ```

3. **Leverage helper functions to reduce duplication**
   ```typescript
   // Bad: Repeated setup code in every test
   const user = await db.insert(users).values({...}).returning();
   await db.update(users).set({ credits: 100 }).where(eq(users.id, user.id));

   // Good: Use helpers
   const user = await createTestUser('test@example.com', 'user', 'password', 100);
   ```

4. **Mock external services consistently**
   ```typescript
   const mockOpenAI = createMockOpenAIClient();
   mockOpenAI.chat.completions.create.mockResolvedValue(
     mockOpenAIResponse("Great answer!")
   );
   ```

5. **Use snapshots for credit balances**
   ```typescript
   const before = await snapshotUserCredits(userId);
   // ... perform operations
   const after = await getUserCredits(userId);
   expect(after.total).toBe(before.total - 100);
   ```

## Contributing

When adding new helpers:

1. **Add JSDoc documentation** for all functions
2. **Follow TypeScript strict mode** requirements
3. **Export from index.ts** for easy imports
4. **Add usage examples** to this README
5. **Create corresponding fixtures** if needed

## Testing the Helpers

The helpers themselves should be thoroughly tested:

```bash
npm run test:run server/__tests__/helpers
```

## Related Documentation

- [Testing Guide](../../../docs/testing/TESTING_GUIDE.md)
- [API Testing](../../../docs/testing/API_TESTING.md)
- [Database Schema](../../../shared/schema.ts)
