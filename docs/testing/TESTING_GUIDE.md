# Testing Guide - P3 Interview Academy

**Document Version**: 1.0
**Date**: 2025-11-05
**Project**: P3 Interview Academy
**Status**: ✅ Production Guide

---

## Executive Summary

This guide provides comprehensive instructions for testing the P3 Interview Academy application. It covers test types, running tests locally and in CI/CD, writing new tests, debugging failures, and maintaining test quality.

### Quick Reference

**Run All Tests**:
```bash
npm test              # Watch mode (interactive)
npm run test:run      # Run once (CI/CD mode)
npm run test:coverage # With coverage report
```

**Run Specific Tests**:
```bash
npm run test:client   # Client component tests only
npm run test:server   # Server API tests only
npm run test:api      # Server tests with verbose output
```

**Current Status**: 365 tests (242 passing, 66.3% pass rate)

**Target**: 90%+ pass rate after Phase 6 improvements

---

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Test Types Overview](#test-types-overview)
3. [Test Architecture](#test-architecture)
4. [Running Tests](#running-tests)
5. [Writing New Tests](#writing-new-tests)
6. [Test Patterns](#test-patterns)
7. [Debugging Test Failures](#debugging-test-failures)
8. [CI/CD Integration](#cicd-integration)
9. [Test Maintenance](#test-maintenance)
10. [Best Practices](#best-practices)
11. [Related Documentation](#related-documentation)

---

## Testing Philosophy

### Our Testing Approach

P3 Interview Academy uses a **pragmatic testing pyramid** approach:

```
           /\
          /  \         5%  - Manual QA (exploratory, UX)
         /    \
        /------\       10% - E2E Tests (critical flows)
       /        \
      /----------\     25% - Integration Tests (realistic scenarios)
     /            \
    /--------------\   60% - Unit Tests (fast, focused)
   /__________________\
```

**Key Principles**:
1. **Fast Feedback** - Most tests should run in < 2 minutes
2. **Reliable** - Tests should not be flaky or timing-dependent
3. **Maintainable** - Clear, readable test code with good coverage
4. **Cost-Effective** - Minimize external service costs (use mocks/fixtures)
5. **Comprehensive** - Cover critical user flows end-to-end

### What We Test

✅ **API Endpoints** - Request/response validation, error handling
✅ **Business Logic** - Calculations, algorithms, state transitions
✅ **Component Rendering** - UI components in isolation
✅ **Integration Flows** - Multi-step user journeys
✅ **Database Operations** - Schema, queries, constraints
❌ **AI Quality** - We don't test subjective quality (use fixtures instead)
❌ **Third-Party Services** - Mock external APIs (OpenAI, Stripe, etc.)

---

## Test Types Overview

### 1. Unit Tests (60%)

**Purpose**: Test individual functions, services, and utilities in isolation.

**Characteristics**:
- Fast execution (< 1 second)
- No external dependencies (database, APIs)
- Heavily mocked
- Deterministic results

**Examples**:
- Service methods: `gamification-service.ts`, `readiness-service.ts`
- Utility functions: String formatting, date calculations
- Business logic: Score calculations, rating thresholds

**When to Use**: Testing isolated logic, calculations, transformations.

---

### 2. Component Tests (15%)

**Purpose**: Test React components in isolation using jsdom.

**Characteristics**:
- Rendered in jsdom (simulated browser)
- No real browser required
- Fast execution
- Testing Library patterns

**Examples**:
- `LanguageSelector.test.tsx` - UI component behavior
- `JobDescriptionUpload.test.tsx` - Form interactions
- `SignupForm.test.tsx` - Validation logic

**When to Use**: Testing UI components, user interactions, form validation.

---

### 3. Integration Tests (25%)

**Purpose**: Test multiple components/services working together with realistic data.

**Characteristics**:
- Uses fixtures (pre-recorded AI responses)
- Tests complete flows
- Validates data transformations
- No real API calls (cost-effective)

**Examples**:
- `practice-flow.integration.test.tsx` - Complete practice session
- `gamification-triggers.integration.test.ts` - XP/badge awards
- `credit-purchase.integration.test.ts` - Payment processing

**When to Use**: Testing multi-step workflows, service interactions, data flows.

---

### 4. Smoke Tests (10%)

**Purpose**: Verify critical functionality in deployed environments.

**Characteristics**:
- Real API calls (selective)
- Pre-deployment checks
- Fast execution (< 30 seconds)
- High-level validation

**Examples**:
- Health endpoints (`/api/health`, `/api/health/simple`)
- Database connectivity
- Authentication flow
- Module availability

**When to Use**: Pre-deployment validation, production health checks.

---

### 5. E2E Tests (5%)

**Purpose**: Test complete user journeys in a real browser.

**Characteristics**:
- Runs in GitHub Actions (not Replit)
- Uses Playwright for browser automation
- Tests full application stack
- Longest execution time

**Examples**:
- User registration → Login → Practice session → Evaluation
- Credit purchase → Simulation → Badge earned
- Module completion → Readiness score update

**When to Use**: Critical user flows, cross-browser validation.

**Note**: See [BROWSER_AUTOMATION_RESEARCH.md](./BROWSER_AUTOMATION_RESEARCH.md) for E2E setup.

---

### 6. Manual QA (5%)

**Purpose**: Human validation of UX, AI quality, and edge cases.

**Characteristics**:
- Exploratory testing
- Subjective quality assessment
- Edge case discovery
- User experience validation

**Examples**:
- AI question relevance for different job positions
- Evaluation accuracy vs. expert judgment
- Multi-language translation quality
- Overall user experience

**When to Use**: Pre-release validation, AI quality checks, UX testing.

---

## Test Architecture

### Vitest Workspace Configuration

**File**: `vitest.workspace.ts`

We use Vitest workspace to configure two separate test projects:

```typescript
import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    extends: './vite.config.ts',
    test: {
      name: 'client',
      environment: 'jsdom',
      setupFiles: ['./client/src/__tests__/setup.ts'],
      include: ['client/src/__tests__/**/*.test.tsx'],
      exclude: ['client/src/__tests__/integration/**/*.integration.test.tsx']
    }
  },
  {
    test: {
      name: 'server',
      environment: 'node',
      setupFiles: ['./server/__tests__/setup.ts'],
      include: ['server/__tests__/**/*.test.ts'],
      exclude: ['server/__tests__/integration/**/*.integration.test.ts']
    }
  }
]);
```

**Key Features**:
- **Two Projects**: Client (jsdom) and Server (node)
- **Separate Environments**: Browser simulation vs. Node.js runtime
- **Setup Files**: Global test configuration and mocks
- **Exclusions**: Integration tests excluded from regular runs

### Test File Locations

```
project-root/
├── client/src/__tests__/          # Client tests
│   ├── setup.ts                   # Client test setup
│   ├── components/                # Component tests (118 tests)
│   │   ├── LanguageSelector.test.tsx
│   │   ├── JobDescriptionUpload.test.tsx
│   │   └── SignupForm.test.tsx
│   └── integration/               # Client integration tests
│       ├── practice-flow.integration.test.tsx
│       └── prepare-session.integration.test.tsx
│
├── server/__tests__/              # Server tests
│   ├── setup.ts                   # Server test setup
│   ├── routes/                    # API route tests (203 tests)
│   │   ├── prepare-ai.routes.test.ts
│   │   ├── practice.routes.test.ts
│   │   ├── gamification.routes.test.ts
│   │   └── support.routes.test.ts
│   ├── services/                  # Service tests
│   │   ├── model-answer-service.test.ts
│   │   └── response-evaluation-service.test.ts
│   ├── integration/               # Server integration tests
│   │   ├── credit-purchase.integration.test.ts
│   │   └── gamification-triggers.integration.test.ts
│   └── migrations/                # Migration tests
│       └── redesign-schema.test.ts
│
└── e2e/                           # E2E tests (GitHub Actions only)
    ├── auth-flow.spec.ts
    ├── practice-module.spec.ts
    └── prepare-module.spec.ts
```

### Test Utilities and Fixtures

**Client Test Utilities**: `client/src/__tests__/utils/`
- Test helpers
- Mock data generators
- Custom matchers

**Server Test Fixtures**: `server/__tests__/fixtures/`
- AI response fixtures
- Database seed data
- Sample payloads

---

## Running Tests

### Local Development

#### Run All Tests (Watch Mode)
```bash
npm test
```
- Interactive mode with file watching
- Re-runs on file changes
- Shows only failures by default
- Best for active development

#### Run All Tests (Once)
```bash
npm run test:run
```
- Runs all tests once and exits
- Used in CI/CD pipelines
- Shows full results
- Fastest for validation

#### Run Tests with Coverage
```bash
npm run test:coverage
```
- Generates coverage report
- Shows uncovered lines
- HTML report in `coverage/`
- Useful for coverage analysis

#### Interactive UI
```bash
npm run test:ui
```
- Launches Vitest UI in browser
- Visual test explorer
- Watch mode with filtering
- Great for debugging

### Targeted Test Runs

#### Client Tests Only
```bash
npm run test:client
```
- Runs 118 component tests
- jsdom environment
- Fast execution (< 30 seconds)

#### Server Tests Only
```bash
npm run test:server
```
- Runs 203 API tests
- Node.js environment
- Includes service tests

#### API Tests (Verbose)
```bash
npm run test:api
```
- Server tests with detailed output
- Shows request/response details
- Useful for API debugging

#### Specific Test File
```bash
npm test -- client/src/__tests__/components/LanguageSelector.test.tsx
```

#### Specific Test Pattern
```bash
npm test -- --grep "practice session"
```

#### Integration Tests
```bash
npm run test:integration
```
- Runs integration tests only
- Requires DATABASE_URL (staging/local)
- Longer execution time

### CI/CD Test Runs

Tests run automatically in GitHub Actions:

**On PR Creation/Update**:
```yaml
# .github/workflows/deploy-eb-staging.yml
- name: Run tests
  run: npm run test:run
  continue-on-error: true  # Allow known failures
```

**On Main Branch Push**:
```yaml
# .github/workflows/deploy-main.yml
- name: Run tests
  run: npm run test:run
  # Must pass for deployment
```

**E2E Tests** (GitHub Actions only):
```yaml
# .github/workflows/e2e-tests.yml
- name: Run E2E tests
  run: npx playwright test
```

---

## Writing New Tests

### Test Structure

All tests follow the AAA pattern: **Arrange → Act → Assert**

```typescript
import { describe, test, expect, beforeEach } from 'vitest';

describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
  });

  test('should do something specific', async () => {
    // Arrange: Set up test data and mocks
    const input = { /* test data */ };

    // Act: Execute the code under test
    const result = await functionUnderTest(input);

    // Assert: Verify the results
    expect(result).toBe(expectedValue);
  });
});
```

### Component Test Example

**File**: `client/src/__tests__/components/LanguageSelector.test.tsx`

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import LanguageSelector from '@/components/LanguageSelector';

describe('LanguageSelector', () => {
  test('renders all supported languages', () => {
    // Arrange
    const onLanguageChange = vi.fn();

    // Act
    render(<LanguageSelector onChange={onLanguageChange} value="en" />);

    // Assert
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Bahasa Malaysia')).toBeInTheDocument();
  });

  test('calls onChange when language selected', () => {
    // Arrange
    const onLanguageChange = vi.fn();
    render(<LanguageSelector onChange={onLanguageChange} value="en" />);

    // Act
    fireEvent.click(screen.getByText('Bahasa Malaysia'));

    // Assert
    expect(onLanguageChange).toHaveBeenCalledWith('ms');
  });
});
```

### API Test Example

**File**: `server/__tests__/routes/practice.routes.test.ts`

```typescript
import request from 'supertest';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import app from '../../index';

describe('POST /api/practice/sessions', () => {
  beforeEach(() => {
    // Mock authentication
    vi.mock('../../middleware/auth', () => ({
      requireAuth: (req, res, next) => {
        req.user = { id: 'test-user-id' };
        next();
      }
    }));

    // Mock AI service
    vi.mock('../../services/ai-question-generator', () => ({
      generateQuestion: vi.fn().mockResolvedValue({
        questionText: "Sample question",
        questionCategory: "behavioral",
        difficultyLevel: "intermediate"
      })
    }));
  });

  test('creates new practice session', async () => {
    // Arrange
    const payload = {
      scenarioId: 'behavioral',
      difficultyLevel: 'intermediate'
    };

    // Act
    const response = await request(app)
      .post('/api/practice/sessions')
      .send(payload)
      .expect(201);

    // Assert
    expect(response.body.success).toBe(true);
    expect(response.body.data.session.id).toBeTruthy();
    expect(response.body.data.session.scenarioId).toBe('behavioral');
  });

  test('returns 401 when not authenticated', async () => {
    // Override mock to remove authentication
    vi.mock('../../middleware/auth', () => ({
      requireAuth: (req, res, next) => {
        res.status(401).json({ error: 'Unauthorized' });
      }
    }));

    // Act & Assert
    await request(app)
      .post('/api/practice/sessions')
      .send({})
      .expect(401);
  });
});
```

### Integration Test Example

**File**: `server/__tests__/integration/practice-flow.integration.test.ts`

```typescript
import { describe, test, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../index';
import aiFixtures from '../fixtures/ai-responses.json';

describe('Practice Flow Integration', () => {
  let sessionId: string;
  let authToken: string;

  beforeEach(async () => {
    // Setup: Login and create session
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'test123' });

    authToken = loginResponse.body.token;
  });

  test('complete practice session flow', async () => {
    // Step 1: Create session
    const createResponse = await request(app)
      .post('/api/practice/sessions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ scenarioId: 'behavioral', difficultyLevel: 'intermediate' })
      .expect(201);

    sessionId = createResponse.body.data.session.id;

    // Step 2: Get AI question (uses fixture)
    const questionResponse = await request(app)
      .post(`/api/practice/sessions/${sessionId}/ai-question`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(questionResponse.body.data.question.questionText).toBeTruthy();

    // Step 3: Submit response
    const responseSubmit = await request(app)
      .post(`/api/practice/sessions/${sessionId}/response`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ responseText: "I led a project..." })
      .expect(200);

    expect(responseSubmit.body.data.evaluation.overallRating).toMatch(/Pass|Needs Improvement/);

    // Step 4: Complete session
    const completeResponse = await request(app)
      .post(`/api/practice/sessions/${sessionId}/complete`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(completeResponse.body.data.session.completedAt).toBeTruthy();
  });
});
```

---

## Test Patterns

### 1. Mocking AI Services

**Problem**: AI services are expensive and non-deterministic.

**Solution**: Mock the entire service with fixtures.

```typescript
import { vi } from 'vitest';

// Mock the AI service module
vi.mock('../services/ai-question-generator', () => ({
  AIQuestionGenerator: vi.fn(() => ({
    generateQuestion: vi.fn().mockResolvedValue({
      questionText: "Tell me about a time...",
      questionCategory: "behavioral",
      difficultyLevel: "intermediate",
      expectedAnswerTime: 180
    })
  }))
}));

test('generates question and updates session', async () => {
  const response = await request(app)
    .post('/api/practice/sessions/123/ai-question');

  expect(response.status).toBe(200);
  expect(response.body.data.question.questionText).toBeTruthy();
});
```

### 2. Testing Non-Deterministic Outputs

**Problem**: AI outputs vary on each run.

**Solution**: Test structure and constraints, not exact content.

```typescript
import { z } from 'zod';

// Define schema
const questionSchema = z.object({
  questionText: z.string().min(10).max(500),
  questionCategory: z.enum(['behavioral', 'technical', 'situational', 'cultural']),
  difficultyLevel: z.enum(['beginner', 'intermediate', 'advanced']),
  expectedAnswerTime: z.number().min(60).max(600)
});

test('generates question with valid schema', async () => {
  const question = await generateQuestion(params);

  // Test structure, not content
  expect(() => questionSchema.parse(question)).not.toThrow();

  // Test constraints
  expect(question.questionText.length).toBeGreaterThan(20);
  expect(['beginner', 'intermediate', 'advanced']).toContain(question.difficultyLevel);
});
```

### 3. Fixture-Based Testing

**Problem**: Need realistic AI responses for integration tests.

**Solution**: Create fixture library of pre-recorded responses.

**Fixture File**: `server/__tests__/fixtures/ai-responses.json`

```json
{
  "questions": {
    "behavioral_intermediate": {
      "questionText": "Tell me about a time you led a diverse team through a challenging project.",
      "questionCategory": "leadership",
      "difficultyLevel": "intermediate",
      "expectedAnswerTime": 180,
      "starMethodRelevant": true
    }
  },
  "evaluations": {
    "strong_star_response": {
      "relevanceScore": 4.5,
      "starStructureScore": 4.8,
      "specificEvidenceScore": 4.2,
      "weightedOverallScore": 4.3,
      "overallRating": "Pass",
      "detailedFeedback": {
        "strengths": ["Clear STAR structure", "Specific metrics"],
        "weaknesses": ["Could elaborate on results"],
        "suggestions": ["Add more quantifiable outcomes"]
      }
    }
  }
}
```

**Usage in Tests**:

```typescript
import aiFixtures from '../fixtures/ai-responses.json';

test('evaluates response with comprehensive feedback', async () => {
  // Use fixture instead of real API
  mockEvaluationService.evaluateResponse.mockResolvedValue(
    aiFixtures.evaluations.strong_star_response
  );

  const response = await request(app)
    .post('/api/practice/sessions/123/response')
    .send({ responseText: "I led a project..." });

  expect(response.body.data.evaluation.overallRating).toBe("Pass");
  expect(response.body.data.evaluation.detailedFeedback.strengths).toHaveLength(2);
});
```

### 4. Testing Database Operations

**Problem**: Tests should not depend on external database state.

**Solution**: Use in-memory database or transaction rollback.

```typescript
import { db } from '../db';
import { sql } from 'drizzle-orm';

describe('Database Operations', () => {
  beforeEach(async () => {
    // Start transaction
    await db.execute(sql`BEGIN`);
  });

  afterEach(async () => {
    // Rollback transaction
    await db.execute(sql`ROLLBACK`);
  });

  test('creates user and awards XP', async () => {
    const userId = await createUser({ email: 'test@example.com' });
    await awardXP(userId, 50, 'test_action');

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });

    expect(user.xpPoints).toBe(50);
  });
});
```

### 5. Testing Async Operations

**Problem**: Some operations are asynchronous and may have timing issues.

**Solution**: Use `async/await` and proper timeout handling.

```typescript
import { waitFor } from '@testing-library/react';

test('updates UI after async data load', async () => {
  render(<Dashboard />);

  // Wait for async operation
  await waitFor(() => {
    expect(screen.getByText('Welcome')).toBeInTheDocument();
  }, { timeout: 5000 });

  // Assert final state
  expect(screen.getByText('Readiness Score: 75%')).toBeInTheDocument();
});
```

### 6. Testing Error Handling

**Problem**: Need to verify error scenarios.

**Solution**: Mock errors and verify error handling.

```typescript
test('handles API error gracefully', async () => {
  // Mock service to throw error
  mockAIService.generateQuestion.mockRejectedValue(
    new Error('OpenAI API rate limit exceeded')
  );

  const response = await request(app)
    .post('/api/practice/sessions/123/ai-question')
    .expect(429);

  expect(response.body.error).toContain('rate limit');
  expect(response.body.retryAfter).toBeTruthy();
});
```

---

## Debugging Test Failures

### Common Issues and Solutions

#### Issue 1: "Found multiple elements with text"

**Error**:
```
TestingLibraryElementError: Found multiple elements with text: Readiness Score
```

**Root Cause**: Using `getByText()` when multiple elements match.

**Solution**: Use `getAllByText()` or more specific selector:

```typescript
// ❌ Bad
const element = screen.getByText('Readiness Score');

// ✅ Good - Get all and select
const elements = screen.getAllByText('Readiness Score');
expect(elements[0]).toBeInTheDocument();

// ✅ Better - Use more specific selector
const element = screen.getByRole('heading', { name: 'Readiness Score' });
```

#### Issue 2: "Cannot find module" in CI

**Error**:
```
Error: Cannot find module '@/components/LearningHub'
```

**Root Cause**: Path resolution differences between local and CI.

**Solution**: Check Vite config and ensure aliases are properly defined:

```typescript
// vite.config.ts
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared')
    }
  }
});
```

#### Issue 3: Test Timeout

**Error**:
```
Test timeout of 5000ms exceeded
```

**Root Cause**: Async operation taking too long or not resolving.

**Solution**: Increase timeout or fix the async logic:

```typescript
// Increase timeout for specific test
test('slow operation', async () => {
  // ... test code
}, { timeout: 10000 }); // 10 seconds

// Or fix the async issue
test('fast operation', async () => {
  // Ensure all promises resolve
  await waitFor(() => expect(mockFn).toHaveBeenCalled());
});
```

#### Issue 4: Database Connection Error

**Error**:
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Root Cause**: Test trying to connect to database that's not available.

**Solution**: Mock database operations:

```typescript
vi.mock('../db', () => ({
  db: {
    query: {
      users: {
        findFirst: vi.fn().mockResolvedValue({ id: '123', email: 'test@example.com' })
      }
    }
  }
}));
```

### Debugging Techniques

#### 1. Use `test.only()` to Isolate

```typescript
test.only('focus on this test', () => {
  // Only this test will run
});
```

#### 2. Add Console Logs

```typescript
test('debug test', async () => {
  const response = await request(app).get('/api/health');
  console.log('Response:', response.body); // View response
  expect(response.status).toBe(200);
});
```

#### 3. Use Vitest UI for Visual Debugging

```bash
npm run test:ui
```
- View test hierarchy
- See console output
- Inspect failures
- Re-run specific tests

#### 4. Check Mock Calls

```typescript
test('verify mock was called correctly', () => {
  mockFunction();

  console.log('Mock calls:', mockFunction.mock.calls);
  console.log('Call count:', mockFunction.mock.calls.length);

  expect(mockFunction).toHaveBeenCalledWith(expectedArg);
});
```

#### 5. Inspect DOM State

```typescript
import { screen, debug } from '@testing-library/react';

test('debug component', () => {
  render(<MyComponent />);

  // Print entire DOM
  debug();

  // Print specific element
  const element = screen.getByTestId('my-element');
  debug(element);
});
```

---

## CI/CD Integration

### GitHub Actions Test Workflow

Tests run automatically on every PR and push to main.

**Workflow**: `.github/workflows/deploy-eb-staging.yml`

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci --omit=optional

      - name: Run TypeScript check
        run: npm run check

      - name: Run tests
        run: npm run test:run
        continue-on-error: true  # Allow known failures
```

### Test Status in PRs

When a PR is created:
1. Tests run automatically
2. Results shown in PR status checks
3. Staging deployment happens if tests pass (with continue-on-error)
4. Comment added to PR with staging URL

### Smoke Tests Before Production

**Workflow**: `.github/workflows/deploy-main.yml`

Before production deployment:
1. Deploy to staging
2. Run smoke tests (`deployment-scripts/smoke-tests.ts`)
3. Verify health endpoints
4. Check database connectivity
5. Validate authentication
6. **Manual approval required**
7. Deploy to production

**Smoke Test Coverage**:
```typescript
// deployment-scripts/smoke-tests.ts
const smokeTests = [
  { name: 'Simple Health', endpoint: '/api/health/simple' },
  { name: 'Detailed Health', endpoint: '/api/health' },
  { name: 'Auth Endpoints', endpoint: '/api/auth/check' },
  { name: 'Practice API', endpoint: '/api/practice/sessions' },
  { name: 'Prepare API', endpoint: '/api/prepare/learning-modules' }
];
```

---

## Test Maintenance

### Regular Maintenance Tasks

#### 1. Fix Flaky Tests (Monthly)
- Identify tests with inconsistent results
- Add proper `waitFor()` for async operations
- Increase timeouts if necessary
- Improve test isolation

#### 2. Update Fixtures (Quarterly)
- Review AI response fixtures
- Add new scenarios as features evolve
- Remove outdated fixtures
- Ensure fixtures match current API responses

#### 3. Review Coverage (Monthly)
```bash
npm run test:coverage
```
- Check coverage report
- Identify uncovered critical code
- Add tests for new features
- Target: >80% coverage for critical paths

#### 4. Update Test Documentation (As Needed)
- Document new test patterns
- Update examples when API changes
- Add troubleshooting guides
- Keep this guide current

### Performance Optimization

#### Keep Tests Fast
- Mock expensive operations
- Use fixtures instead of real API calls
- Avoid unnecessary database operations
- Run tests in parallel when possible

**Current Benchmarks**:
- Client tests: ~30 seconds (118 tests)
- Server tests: ~45 seconds (203 tests)
- Total: < 2 minutes

**Target**: Keep under 3 minutes for full suite

#### Reduce Test Redundancy
- Don't test the same thing multiple times
- Use parameterized tests for similar scenarios
- Share setup code with beforeEach/beforeAll

```typescript
// ✅ Good - Parameterized test
test.each([
  ['beginner', 60],
  ['intermediate', 120],
  ['advanced', 180]
])('generates %s question with %d second time', async (level, time) => {
  const question = await generateQuestion({ difficultyLevel: level });
  expect(question.expectedAnswerTime).toBe(time);
});

// ❌ Bad - Separate tests for same logic
test('generates beginner question', async () => { /* ... */ });
test('generates intermediate question', async () => { /* ... */ });
test('generates advanced question', async () => { /* ... */ });
```

---

## Best Practices

### General Guidelines

1. **Test Behavior, Not Implementation**
   - Focus on what the code does, not how it does it
   - Don't test private methods
   - Test public API and user-facing behavior

2. **Keep Tests Independent**
   - Tests should not depend on each other
   - Use beforeEach/afterEach for setup/teardown
   - Clean up after each test

3. **Use Descriptive Test Names**
   - Test names should describe what is being tested
   - Include expected behavior
   - Make failures easy to understand

```typescript
// ✅ Good
test('creates practice session and deducts 10 credits from user balance', async () => {
  // ...
});

// ❌ Bad
test('test session creation', async () => {
  // ...
});
```

4. **Follow AAA Pattern**
   - **Arrange**: Set up test data and mocks
   - **Act**: Execute the code under test
   - **Assert**: Verify the results

5. **Mock External Dependencies**
   - Don't hit real APIs in tests
   - Use fixtures for AI responses
   - Mock database operations when appropriate

6. **Test Edge Cases**
   - Empty inputs
   - Invalid data
   - Boundary conditions
   - Error scenarios

### Component Testing Best Practices

1. **Use Semantic Queries**
```typescript
// ✅ Good - Semantic queries
screen.getByRole('button', { name: 'Submit' })
screen.getByLabelText('Email Address')

// ❌ Bad - Implementation details
screen.getByClassName('submit-button')
screen.getByTestId('email-input')
```

2. **Test User Interactions**
```typescript
import userEvent from '@testing-library/user-event';

test('submits form on button click', async () => {
  const user = userEvent.setup();
  render(<Form onSubmit={mockSubmit} />);

  await user.type(screen.getByLabelText('Email'), 'test@example.com');
  await user.click(screen.getByRole('button', { name: 'Submit' }));

  expect(mockSubmit).toHaveBeenCalled();
});
```

3. **Wait for Async Updates**
```typescript
import { waitFor } from '@testing-library/react';

test('displays data after load', async () => {
  render(<Dashboard />);

  await waitFor(() => {
    expect(screen.getByText('Welcome')).toBeInTheDocument();
  });
});
```

### API Testing Best Practices

1. **Test Request/Response Contracts**
```typescript
test('POST /api/practice/sessions returns correct shape', async () => {
  const response = await request(app)
    .post('/api/practice/sessions')
    .send(validPayload)
    .expect(201);

  expect(response.body).toMatchObject({
    success: true,
    data: {
      session: {
        id: expect.any(String),
        scenarioId: expect.any(String),
        createdAt: expect.any(String)
      }
    }
  });
});
```

2. **Test Error Responses**
```typescript
test('returns 400 for invalid payload', async () => {
  const response = await request(app)
    .post('/api/practice/sessions')
    .send({ invalid: 'data' })
    .expect(400);

  expect(response.body.error).toBeTruthy();
  expect(response.body.message).toContain('validation');
});
```

3. **Test Authentication**
```typescript
test('returns 401 without authentication', async () => {
  await request(app)
    .get('/api/practice/sessions')
    .expect(401);
});

test('returns 200 with valid token', async () => {
  await request(app)
    .get('/api/practice/sessions')
    .set('Authorization', `Bearer ${validToken}`)
    .expect(200);
});
```

---

## Related Documentation

### Testing Documentation
- **[UAT_AUTOMATION_STRATEGY.md](./UAT_AUTOMATION_STRATEGY.md)** - Comprehensive UAT automation approach, three-tier testing strategy, cost-benefit analysis
- **[BROWSER_AUTOMATION_RESEARCH.md](./BROWSER_AUTOMATION_RESEARCH.md)** - Playwright/MCP compatibility research, E2E alternatives, Replit constraints analysis
- **[PHASE_6_TESTING_REPORT.md](../redesign/PHASE_6_TESTING_REPORT.md)** - Phase 6 test results, deployment process, UAT checklist

### Project Documentation
- **[CLAUDE.md](../../CLAUDE.md)** - Development commands, project structure, architecture overview
- **[DEPLOYMENT.md](../../DEPLOYMENT.md)** - Deployment procedures, CI/CD pipeline, AWS configuration
- **[MASTER_PLAN.md](../redesign/MASTER_PLAN.md)** - Redesign project roadmap, phase breakdown, timeline

### Code Quality
- **TypeScript Configuration**: `tsconfig.json` - Strict type checking enabled
- **ESLint Configuration**: `.eslintrc.js` - Code style rules
- **Vitest Configuration**: `vitest.workspace.ts` - Test environment setup

---

## Quick Command Reference

```bash
# Development
npm test                   # Watch mode (interactive)
npm run test:run          # Run once (CI/CD)
npm run test:ui           # Interactive UI
npm run test:coverage     # With coverage

# Targeted Testing
npm run test:client       # Client tests only
npm run test:server       # Server tests only
npm run test:api          # Server verbose
npm run test:integration  # Integration tests

# Specific Tests
npm test -- path/to/file.test.ts           # Single file
npm test -- --grep "test pattern"          # Pattern match
npm test -- --reporter=verbose             # Verbose output

# Debugging
npm test -- --inspect     # Node debugger
npm test -- --ui          # Visual debugger
```

---

**Document Owner**: Engineering Team
**Review Schedule**: Quarterly
**Last Updated**: 2025-11-05
**Version**: 1.0

---

## Appendix: Test Statistics

**Current Status** (as of 2025-11-05):
- **Total Tests**: 365
- **Passing**: 242 (66.3%)
- **Failing**: 116 (31.8%)
- **Skipped**: 7 (1.9%)

**By Category**:
- Server API: 174/203 passing (86%) ✅ Production-Ready
- Client Components: 58/118 passing (49%) ⚠️ Selector Issues
- Integration: 10/37 passing (27%) 📋 Expected Failures

**Target**: 90%+ pass rate after fixes

**Test Execution Time**:
- Client: ~30 seconds
- Server: ~45 seconds
- Total: < 2 minutes
