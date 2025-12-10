# Phase 9: Testing Improvement Strategy

**Date**: 2025-12-02
**Current Status**: 214 tests passing (65% coverage), Need 70%+ to pass Phase 9
**Project**: P3 Interview Academy - MVP Integration Testing Phase

---

## Executive Summary

This document provides a comprehensive testing improvement strategy to reach 70%+ coverage and ensure the stability of Phases 1-8 (Games, Admin, Gamification, Security, Credits, Stripe, Referrals, Support).

### Current Test Status

```
Test Files:  14 passed | 7 skipped (21)
Tests:       214 passed | 116 skipped (330)
Coverage:    ~65% (214/330 tests passing)
Target:      70%+ coverage (231+ tests passing)
Gap:         17+ tests needed
```

### Key Findings

1. **116 tests are skipped** - Many existing tests are disabled (describe.skip)
2. **8 critical routes have NO tests** - Admin, Credits, Stripe Webhooks, Subscriptions, Users, Voice Services, Schema Migration
3. **Component coverage is low** - 11 component tests for 193 components (5.7%)
4. **Integration tests incomplete** - Credit purchase flow has tests, but Stripe webhooks and subscriptions don't

---

## 1. Test Coverage Analysis

### 1.1 Server-Side Coverage

#### Routes WITH Tests ✅
- **gamification.routes.test.ts** (21 tests) - ✅ PASSING
- **model-answer-service.test.ts** (38 tests) - ✅ PASSING
- **support.routes.test.ts** (32 tests) - ✅ PASSING
- **prepare-ai.routes.test.ts** (3 tests) - ✅ PASSING
- **referrals.routes.test.ts** (23 tests) - 🟡 SKIPPED
- **prepare.routes.test.ts** (31 tests) - 🟡 SKIPPED
- **practice.routes.test.ts** (3 tests) - 🟡 SKIPPED
- **practice-enhancements.test.ts** (14 tests) - 🟡 SKIPPED
- **perform.routes.test.ts** (24 tests) - 🟡 SKIPPED

#### Routes WITHOUT Tests ❌
- **admin.ts** - 🔴 **CRITICAL** (Phase 3.5 Security Fixes, User Management, Credit Management)
- **credits.ts** - 🔴 **CRITICAL** (Core billing feature)
- **stripe-webhooks.ts** - 🔴 **CRITICAL** (Revenue-critical payment processing)
- **subscriptions.ts** - 🔴 **CRITICAL** (Recurring revenue)
- **users.ts** - 🔴 **HIGH** (Authentication, user management)
- **voice-services-mvp.ts** - 🟡 MEDIUM (AI simulation feature)
- **voice-services.ts** - 🟡 MEDIUM (AI simulation feature)
- **schema-migration.ts** - 🟢 LOW (Development tool)

#### Integration Tests
- **credit-purchase.integration.test.ts** - ✅ EXISTS (Stripe checkout flow)
- **gamification-triggers.integration.test.ts** - ✅ EXISTS (XP/badge system)
- **referral-flow.integration.test.ts** - ✅ EXISTS (Referral system)
- Missing: Stripe webhook end-to-end flow, subscription lifecycle, admin operations

### 1.2 Client-Side Coverage

#### Component Tests WITH Tests ✅
- **SignupForm.test.tsx** (2 tests) - ✅ PASSING
- **LanguageSelector.test.tsx** - ✅ PASSING
- **JobDescriptionUpload.test.tsx** - ✅ PASSING
- **mvp/perform/ActualInterviewTracker.test.tsx** (17 tests) - ✅ PASSING
- **mvp/perform/BadgeGallery.test.tsx** - ✅ PASSING
- **mvp/practice/SimulationSetup.test.tsx** (15 tests) - ✅ PASSING
- **mvp/prepare/LearningHub.test.tsx** (11 tests) - 🟡 SKIPPED
- **mvp/prepare/ResumeAnalyzer.test.tsx** (17 tests) - ✅ PASSING
- **mvp/prepare/STARStoryBuilder.test.tsx** (14 tests) - ✅ PASSING
- **mvp/shared/CreditCostBadge.test.tsx** (10 tests) - 🟡 SKIPPED
- **mvp/shared/ReadinessScoreBadge.test.tsx** (22 tests) - ✅ PASSING

#### Component Coverage Gap
- **Total Components**: 193 components
- **Tested Components**: 11 components
- **Coverage**: 5.7% 🔴

#### Critical Untested Components
- **Admin Panel Components** - admin/scenario-table.tsx (Phase 3.5 security)
- **Payment Components** - Stripe checkout, subscription management
- **Credit Purchase Flow** - Credit balance display, purchase buttons
- **Gamification UI** - Badge displays, XP progress bars, readiness score
- **Practice Flow** - Chat interface, feedback panel, scenario cards
- **Prepare Flow** - Session dashboard, voice controls, breadcrumb navigation

---

## 2. Prioritized Testing Plan

### Priority 1: Critical Business Logic (MUST HAVE - Week 1)

These tests cover revenue-critical and security-critical features.

#### 2.1 Stripe Webhooks Tests (HIGH PRIORITY - 15 tests, 6 hours)
**File**: `server/__tests__/stripe-webhooks.test.ts`

**Why Critical**:
- Revenue-critical payment processing
- Handles subscription renewals and top-ups
- Already has integration test, needs unit coverage

**Test Scenarios**:
1. ✅ `checkout.session.completed` - Subscription checkout
2. ✅ `checkout.session.completed` - One-time payment (top-up)
3. ✅ `customer.subscription.created` - New subscription
4. ✅ `customer.subscription.updated` - Plan changes
5. ✅ `customer.subscription.deleted` - Cancellations
6. ✅ `invoice.payment_succeeded` - Successful payments
7. ✅ `invoice.payment_failed` - Failed payments
8. ❌ Missing webhook signature (security)
9. ❌ Invalid webhook secret
10. ❌ Replay attack prevention (idempotency)
11. ❌ Duplicate event handling
12. ❌ Unknown event type handling
13. ❌ Malformed event data
14. ❌ Database transaction rollback on error
15. ❌ Webhook logging and monitoring

**Estimated Effort**: 6 hours
**Value**: Very High - Prevents payment processing bugs

---

#### 2.2 Admin Routes Tests (HIGH PRIORITY - 20 tests, 8 hours)
**File**: `server/__tests__/admin.routes.test.ts`

**Why Critical**:
- Phase 3.5 security fixes validation
- User management and credit management
- Rate limiting and CSRF protection

**Test Scenarios**:

**User Management** (8 tests):
1. ✅ GET /api/admin/users - List users with pagination
2. ✅ GET /api/admin/users - Search by email/name
3. ✅ GET /api/admin/users/:id - Get single user
4. ✅ PUT /api/admin/users/:id - Update user
5. ✅ DELETE /api/admin/users/:id - Soft delete user
6. ❌ Requires admin role (403 for non-admins)
7. ❌ Rate limiting (60 req/min)
8. ❌ CSRF protection via referrer validation

**Credit Management** (7 tests):
9. ✅ POST /api/admin/credits/adjust - Add credits to user
10. ✅ POST /api/admin/credits/adjust - Deduct credits
11. ❌ Input validation (negative amounts, invalid user ID)
12. ❌ Audit log creation on credit adjustment
13. ❌ Transaction idempotency
14. ❌ Balance validation before deduction
15. ❌ Rate limiting for bulk operations (10 req/min)

**Bulk Operations** (3 tests):
16. ✅ POST /api/admin/credits/bulk-adjust - Bulk credit adjustment
17. ❌ Partial success handling
18. ❌ Rollback on error

**Security** (2 tests):
19. ❌ CSRF token validation
20. ❌ Admin session timeout

**Estimated Effort**: 8 hours
**Value**: Very High - Validates Phase 3.5 security fixes

---

#### 2.3 Credits Routes Tests (HIGH PRIORITY - 8 tests, 3 hours)
**File**: `server/__tests__/credits.routes.test.ts`

**Why Critical**:
- Core billing feature
- User-facing credit balance display

**Test Scenarios**:
1. ✅ GET /api/credits/balance - Returns user credit balance
2. ✅ GET /api/credits/balance - Breakdown by type (monthly vs top-up)
3. ❌ Requires authentication (401 for unauthenticated)
4. ❌ Returns correct balance after subscription renewal
5. ❌ Returns correct balance after top-up purchase
6. ❌ Returns correct balance after credit deduction
7. ❌ Handles missing user gracefully
8. ❌ Database error handling

**Estimated Effort**: 3 hours
**Value**: High - Core user-facing feature

---

#### 2.4 Subscriptions Routes Tests (HIGH PRIORITY - 12 tests, 5 hours)
**File**: `server/__tests__/subscriptions.routes.test.ts`

**Why Critical**:
- Recurring revenue management
- Subscription lifecycle handling

**Test Scenarios**:

**Subscription Management** (6 tests):
1. ✅ GET /api/subscriptions/current - Get current subscription
2. ✅ POST /api/subscriptions/checkout - Create checkout session
3. ✅ POST /api/subscriptions/cancel - Cancel subscription
4. ✅ POST /api/subscriptions/resume - Resume subscription
5. ❌ Requires authentication
6. ❌ Handles Stripe API errors

**Subscription Status** (6 tests):
7. ✅ Returns active subscription with credits
8. ✅ Returns cancelled subscription
9. ✅ Returns past_due subscription
10. ❌ Returns unpaid subscription
11. ❌ Returns trialing subscription
12. ❌ Handles no subscription gracefully

**Estimated Effort**: 5 hours
**Value**: High - Recurring revenue

---

### Priority 2: Skipped Tests (SHOULD HAVE - Week 2)

These tests exist but are skipped. Enabling them is quick wins.

#### 2.5 Enable Skipped Server Tests (MEDIUM PRIORITY - 92 tests, 12 hours)

**Quick Wins** (fix and unskip):
1. **prepare.routes.test.ts** (31 tests) - Core prepare module
2. **practice.routes.test.ts** (3 tests) - Core practice module
3. **practice-enhancements.test.ts** (14 tests) - Practice features
4. **perform.routes.test.ts** (24 tests) - Performance tracking
5. **referrals.routes.test.ts** (23 tests) - Referral system

**Why Skipped**:
- Tests may have been disabled during refactoring
- May have external dependencies (database, mocks)
- May need minor fixes to run

**Action Plan**:
1. Review each skipped test file
2. Fix any broken imports or mocks
3. Update test data to match current schema
4. Remove `.skip` once passing
5. Run incrementally to identify issues

**Estimated Effort**: 12 hours (92 tests @ 8 min/test)
**Value**: Very High - Existing tests with immediate coverage boost

---

#### 2.6 Enable Skipped Client Tests (MEDIUM PRIORITY - 21 tests, 4 hours)

**Quick Wins**:
1. **LearningHub.test.tsx** (11 tests) - Learning module UI
2. **CreditCostBadge.test.tsx** (10 tests) - Credit display

**Why Skipped**:
- May have component import issues
- May need mock updates

**Action Plan**:
1. Fix component imports
2. Update mocks for API calls
3. Remove `.skip` once passing

**Estimated Effort**: 4 hours
**Value**: High - Existing tests with minimal effort

---

### Priority 3: Integration Tests (SHOULD HAVE - Week 3)

#### 2.7 Stripe Webhook Integration Test (HIGH PRIORITY - 8 tests, 6 hours)
**File**: `server/__tests__/integration/stripe-webhook-flow.integration.test.ts`

**Why Important**:
- End-to-end payment flow validation
- Complements existing credit-purchase test

**Test Scenarios**:
1. ✅ Complete subscription purchase flow (checkout → webhook → credits added)
2. ✅ Complete top-up purchase flow
3. ✅ Subscription renewal via invoice.payment_succeeded
4. ✅ Failed payment handling (invoice.payment_failed)
5. ❌ Subscription cancellation flow
6. ❌ Plan change flow
7. ❌ Refund handling
8. ❌ Webhook replay attack prevention

**Estimated Effort**: 6 hours
**Value**: High - End-to-end revenue flow validation

---

#### 2.8 Admin Security Integration Test (MEDIUM PRIORITY - 6 tests, 4 hours)
**File**: `server/__tests__/integration/admin-security.integration.test.ts`

**Why Important**:
- Validates Phase 3.5 security fixes in real scenarios

**Test Scenarios**:
1. ✅ Admin adjusts user credits → audit log created
2. ✅ Non-admin attempts admin action → 403 error
3. ✅ Rate limiting prevents admin abuse
4. ❌ CSRF protection blocks forged requests
5. ❌ Bulk operation partial failure rollback
6. ❌ Admin session timeout

**Estimated Effort**: 4 hours
**Value**: Medium - Security validation

---

### Priority 4: Component Tests (NICE TO HAVE - Week 4)

#### 2.9 Payment Flow Components (MEDIUM PRIORITY - 12 tests, 6 hours)

**Files**:
- `client/src/__tests__/components/CreditPurchase.test.tsx`
- `client/src/__tests__/components/SubscriptionManagement.test.tsx`

**Test Scenarios**:

**CreditPurchase Component** (6 tests):
1. ✅ Displays credit balance
2. ✅ Shows credit package options
3. ✅ Opens Stripe checkout on purchase
4. ❌ Disables purchase button during processing
5. ❌ Shows success message after purchase
6. ❌ Handles Stripe errors gracefully

**SubscriptionManagement Component** (6 tests):
7. ✅ Displays current subscription details
8. ✅ Shows plan upgrade options
9. ✅ Allows subscription cancellation
10. ❌ Confirms cancellation with modal
11. ❌ Shows cancellation effective date
12. ❌ Allows subscription resume

**Estimated Effort**: 6 hours
**Value**: Medium - User-facing revenue features

---

#### 2.10 Admin Panel Components (LOW PRIORITY - 8 tests, 4 hours)

**Files**:
- `client/src/__tests__/components/admin/UserManagement.test.tsx`
- `client/src/__tests__/components/admin/CreditAdjustment.test.tsx`

**Test Scenarios**:

**UserManagement Component** (4 tests):
1. ✅ Lists users with pagination
2. ✅ Filters users by search
3. ❌ Opens user edit modal
4. ❌ Requires admin role

**CreditAdjustment Component** (4 tests):
5. ✅ Shows credit adjustment form
6. ✅ Validates input (positive numbers only)
7. ❌ Shows confirmation before adjustment
8. ❌ Displays audit log

**Estimated Effort**: 4 hours
**Value**: Low - Internal admin tool (less user-facing)

---

## 3. Test Implementation Guide

### 3.1 Server Route Test Pattern

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express, { type Express } from "express";
import router from "../routes/your-route";

// Mock services
const serviceMocks = vi.hoisted(() => ({
  methodName: vi.fn(),
}));

vi.mock("../services/your-service", () => ({
  YourService: serviceMocks,
}));

// Test app setup
function createTestApp(): Express {
  const app = express();
  app.use(express.json());

  // Mock authentication middleware
  app.use((req, _res, next) => {
    req.user = { id: "test-user-123", role: "user" };
    next();
  });

  app.use("/api/route", router);
  return app;
}

describe("Your Route Tests", () => {
  let app: Express;

  beforeEach(() => {
    app = createTestApp();
    vi.clearAllMocks();
  });

  it("should handle successful request", async () => {
    serviceMocks.methodName.mockResolvedValue({ success: true });

    const response = await request(app)
      .get("/api/route/endpoint")
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(serviceMocks.methodName).toHaveBeenCalled();
  });

  it("should handle errors gracefully", async () => {
    serviceMocks.methodName.mockRejectedValue(new Error("Service error"));

    const response = await request(app)
      .get("/api/route/endpoint")
      .expect(500);

    expect(response.body.success).toBe(false);
  });
});
```

---

### 3.2 Integration Test Pattern

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../../db';
import { users, creditTransactions } from '../../../shared/schema';
import { eq } from 'drizzle-orm';

describe("End-to-End Flow", () => {
  let testUserId: string;

  beforeEach(async () => {
    // Create test user
    const [user] = await db.insert(users).values({
      email: "test@example.com",
      // ... other fields
    }).returning();
    testUserId = user.id;
  });

  afterEach(async () => {
    // Clean up test data
    await db.delete(creditTransactions).where(eq(creditTransactions.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  it("should complete the full flow", async () => {
    // Step 1: Trigger action
    // Step 2: Verify database changes
    // Step 3: Verify side effects
  });
});
```

---

### 3.3 Component Test Pattern

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import YourComponent from "../YourComponent";

// Mock API calls
vi.mock("../../api/your-api", () => ({
  yourApiMethod: vi.fn(),
}));

function renderWithProviders(component: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
}

describe("YourComponent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render correctly", () => {
    renderWithProviders(<YourComponent />);
    expect(screen.getByText("Expected Text")).toBeInTheDocument();
  });

  it("should handle user interaction", async () => {
    renderWithProviders(<YourComponent />);

    const button = screen.getByRole("button", { name: "Click Me" });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Success")).toBeInTheDocument();
    });
  });
});
```

---

## 4. Testing Best Practices

### 4.1 Test Quality Standards

**DO**:
- ✅ Test business logic, not implementation details
- ✅ Use descriptive test names (should/when/given format)
- ✅ Test edge cases (null, undefined, empty arrays, etc.)
- ✅ Mock external dependencies (APIs, databases, services)
- ✅ Clean up test data in afterEach/afterAll hooks
- ✅ Use factories/fixtures for test data
- ✅ Test error handling and validation
- ✅ Use waitFor for async operations
- ✅ Test user-facing behavior, not internals

**DON'T**:
- ❌ Test framework code (React, Express, libraries)
- ❌ Test third-party services (Stripe, OpenAI) - mock them
- ❌ Skip tests without good reason
- ❌ Write tests that depend on external state
- ❌ Write tests that depend on test execution order
- ❌ Use real API keys in tests
- ❌ Leave test data in database

---

### 4.2 Security Test Checklist

For all admin/payment routes, verify:
- [ ] Authentication required (401 for unauthenticated)
- [ ] Authorization enforced (403 for non-admins)
- [ ] Rate limiting works (429 after limit exceeded)
- [ ] Input validation (400 for invalid input)
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (sanitized output)
- [ ] CSRF protection (referrer validation)
- [ ] Idempotency (duplicate requests handled)
- [ ] Audit logging (sensitive actions logged)
- [ ] Error messages don't leak sensitive data

---

### 4.3 Revenue Test Checklist

For all payment/subscription routes, verify:
- [ ] Stripe API calls are mocked (no real charges)
- [ ] Webhook signatures are verified
- [ ] Credit balances update correctly
- [ ] Transaction records created
- [ ] Idempotency prevents duplicate charges
- [ ] Failed payments handled gracefully
- [ ] Subscription renewals work
- [ ] Cancellations process correctly
- [ ] Refunds update credits correctly
- [ ] Database transactions rollback on error

---

## 5. Implementation Timeline

### Week 1: Critical Business Logic (HIGH PRIORITY)
**Goal**: Test revenue-critical and security-critical features

| Task | Tests | Hours | Status |
|------|-------|-------|--------|
| 2.1 Stripe Webhooks Tests | 15 | 6 | ⏳ Not Started |
| 2.2 Admin Routes Tests | 20 | 8 | ⏳ Not Started |
| 2.3 Credits Routes Tests | 8 | 3 | ⏳ Not Started |
| 2.4 Subscriptions Routes Tests | 12 | 5 | ⏳ Not Started |
| **Week 1 Total** | **55** | **22** | **0%** |

**Expected Coverage**: +17% (55 tests / 330 total = 82%)

---

### Week 2: Enable Skipped Tests (QUICK WINS)
**Goal**: Unskip and fix existing tests

| Task | Tests | Hours | Status |
|------|-------|-------|--------|
| 2.5 Enable Skipped Server Tests | 92 | 12 | ⏳ Not Started |
| 2.6 Enable Skipped Client Tests | 21 | 4 | ⏳ Not Started |
| **Week 2 Total** | **113** | **16** | **0%** |

**Expected Coverage**: +34% (113 tests / 330 total = 99%)

---

### Week 3: Integration Tests (SHOULD HAVE)
**Goal**: End-to-end flow validation

| Task | Tests | Hours | Status |
|------|-------|-------|--------|
| 2.7 Stripe Webhook Integration | 8 | 6 | ⏳ Not Started |
| 2.8 Admin Security Integration | 6 | 4 | ⏳ Not Started |
| **Week 3 Total** | **14** | **10** | **0%** |

**Expected Coverage**: +4% (14 tests / 330 total = 103%)

---

### Week 4: Component Tests (NICE TO HAVE)
**Goal**: User-facing UI validation

| Task | Tests | Hours | Status |
|------|-------|-------|--------|
| 2.9 Payment Flow Components | 12 | 6 | ⏳ Not Started |
| 2.10 Admin Panel Components | 8 | 4 | ⏳ Not Started |
| **Week 4 Total** | **20** | **10** | **0%** |

**Expected Coverage**: +6% (20 tests / 330 total = 109%)

---

### Total Implementation Effort
- **Total New Tests**: 202 tests
- **Total Hours**: 58 hours (~7.5 days)
- **Final Coverage**: 416 tests total (126% increase)

---

## 6. Risk Mitigation

### 6.1 Risks and Mitigation Strategies

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Skipped tests have breaking dependencies | High | High | Fix incrementally, one file at a time |
| Stripe mocks don't match real behavior | High | Medium | Validate against Stripe test mode |
| Database migrations break tests | High | Low | Use ephemeral test database |
| Test data leaks between tests | Medium | Medium | Clean up in afterEach hooks |
| Flaky tests (timing issues) | Medium | Medium | Use waitFor, avoid sleep() |
| Mock drift from real implementations | Medium | High | Review mocks during code reviews |
| Tests take too long to run | Low | High | Parallelize test execution |

---

### 6.2 Rollback Plan

If tests reveal critical bugs:
1. **Document the bug** in `docs/bugs/` with test case
2. **Create hotfix branch** from main
3. **Fix the bug** with new test coverage
4. **Deploy hotfix** to staging → production
5. **Update Phase 9 plan** with lessons learned

---

## 7. Success Metrics

### 7.1 Phase 9 Completion Criteria

- [ ] **Test Coverage**: 70%+ tests passing (231+ tests)
- [ ] **Critical Routes Tested**: Admin, Credits, Stripe Webhooks, Subscriptions (55 tests)
- [ ] **Skipped Tests Enabled**: 90%+ of skipped tests fixed and running (100+ tests)
- [ ] **Integration Tests**: Stripe webhook flow tested end-to-end (8 tests)
- [ ] **Security Tests**: Admin security validated (20 tests)
- [ ] **Component Tests**: Payment flow components tested (12 tests)
- [ ] **Zero Flaky Tests**: All tests pass consistently (3 runs)
- [ ] **Fast Test Suite**: Tests run in < 60 seconds
- [ ] **CI/CD Integration**: All tests run on every PR
- [ ] **Documentation**: Testing guide updated with new patterns

---

### 7.2 Quality Gates

**Before merging to main**:
1. ✅ All new tests pass (100%)
2. ✅ No skipped tests (except documented exceptions)
3. ✅ Code coverage report generated
4. ✅ Security tests pass
5. ✅ Integration tests pass
6. ✅ No test data left in database
7. ✅ Test documentation updated

---

## 8. Quick Start Guide

### 8.1 Running Tests Locally

```bash
# Run all tests
npm test

# Run specific test file
npm test server/__tests__/admin.routes.test.ts

# Run tests in watch mode
npm test -- --watch

# Run with coverage report
npm test -- --coverage

# Run only server tests
npm run test:server

# Run only client tests
npm run test:client
```

---

### 8.2 Creating a New Test File

```bash
# 1. Create test file
touch server/__tests__/your-route.test.ts

# 2. Copy test template from Section 3.1

# 3. Write test scenarios

# 4. Run test
npm test server/__tests__/your-route.test.ts

# 5. Verify passing
npm test -- --run
```

---

## 9. Next Steps

### Immediate Actions (This Week)
1. **Review this strategy** with team/founder
2. **Prioritize Week 1 tasks** (55 critical tests)
3. **Set up test environment** (database, mocks)
4. **Start with stripe-webhooks.test.ts** (highest priority)
5. **Commit tests incrementally** (don't wait for 100%)

### Long-term Improvements
1. **Add E2E tests** with Playwright (browser automation)
2. **Add performance tests** (load testing with k6)
3. **Add visual regression tests** (screenshot comparison)
4. **Set up continuous monitoring** (test results dashboard)
5. **Implement mutation testing** (test the tests)

---

## 10. Resources

### Documentation
- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Stripe Test Mode](https://stripe.com/docs/testing)

### Internal References
- `/home/runner/workspace/docs/testing/TESTING_GUIDE.md` - Complete testing guide
- `/home/runner/workspace/docs/development/COMMANDS.md` - Testing commands
- `/home/runner/workspace/client/src/__tests__/setup.ts` - Test setup configuration
- `/home/runner/workspace/server/__tests__/` - Existing server tests

### Test Examples
- `server/__tests__/gamification.routes.test.ts` - Well-structured route tests
- `server/__tests__/integration/credit-purchase.integration.test.ts` - Integration test example
- `client/src/__tests__/components/mvp/practice/SimulationSetup.test.tsx` - Component test example

---

## Appendix A: Test Checklist

Use this checklist to track progress:

### Week 1: Critical Business Logic
- [ ] stripe-webhooks.test.ts (15 tests)
- [ ] admin.routes.test.ts (20 tests)
- [ ] credits.routes.test.ts (8 tests)
- [ ] subscriptions.routes.test.ts (12 tests)

### Week 2: Enable Skipped Tests
- [ ] prepare.routes.test.ts (31 tests)
- [ ] practice.routes.test.ts (3 tests)
- [ ] practice-enhancements.test.ts (14 tests)
- [ ] perform.routes.test.ts (24 tests)
- [ ] referrals.routes.test.ts (23 tests)
- [ ] LearningHub.test.tsx (11 tests)
- [ ] CreditCostBadge.test.tsx (10 tests)

### Week 3: Integration Tests
- [ ] stripe-webhook-flow.integration.test.ts (8 tests)
- [ ] admin-security.integration.test.ts (6 tests)

### Week 4: Component Tests
- [ ] CreditPurchase.test.tsx (6 tests)
- [ ] SubscriptionManagement.test.tsx (6 tests)
- [ ] UserManagement.test.tsx (4 tests)
- [ ] CreditAdjustment.test.tsx (4 tests)

---

## Appendix B: Common Test Issues and Solutions

### Issue: Tests fail with "Database error"
**Solution**: Use ephemeral test database or mock database calls

### Issue: Tests timeout
**Solution**: Increase timeout in vitest.config.ts or use `await waitFor()`

### Issue: "act() warning" in React tests
**Solution**: Wrap state updates in `await waitFor()` or `act()`

### Issue: Stripe webhook signature verification fails
**Solution**: Use proper signature generation function (see credit-purchase test)

### Issue: Tests pass locally but fail in CI/CD
**Solution**: Check environment variables, database setup, timezone issues

### Issue: Mock not working
**Solution**: Use `vi.hoisted()` for mocks that need to be defined before imports

---

**Last Updated**: 2025-12-02
**Document Version**: 1.0
**Status**: Ready for Implementation
