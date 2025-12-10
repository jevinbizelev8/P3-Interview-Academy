# Phase 9 Testing: Quick Wins

**Goal**: Reach 70%+ test coverage with minimal effort

---

## Current Status
- ✅ 214 tests passing (65%)
- 🟡 116 tests skipped (35%)
- 🎯 Target: 231+ tests (70%)
- 📊 Gap: 17+ tests needed

---

## Quick Win #1: Unskip Existing Tests (113 tests, 16 hours)

**Impact**: Instant +34% coverage boost

### Server Tests (92 tests)
```bash
# Fix these skipped test files:
server/__tests__/prepare.routes.test.ts        # 31 tests
server/__tests__/perform.routes.test.ts        # 24 tests
server/__tests__/referrals.routes.test.ts      # 23 tests
server/__tests__/practice-enhancements.test.ts # 14 tests
server/__tests__/practice.routes.test.ts       # 3 tests
```

### Client Tests (21 tests)
```bash
# Fix these skipped test files:
client/src/__tests__/components/mvp/prepare/LearningHub.test.tsx        # 11 tests
client/src/__tests__/components/mvp/shared/CreditCostBadge.test.tsx     # 10 tests
```

### Action Plan
1. Remove `.skip` from `describe.skip()`
2. Run test: `npm test <file>`
3. Fix any broken imports/mocks
4. Commit when passing

**Estimated Time**: 8 minutes per test × 113 = 15 hours

---

## Quick Win #2: Critical Route Tests (55 tests, 22 hours)

**Impact**: Test revenue-critical features

### Priority Order (Start Here)
1. **stripe-webhooks.test.ts** (15 tests, 6 hours) - 🔴 CRITICAL
   - Revenue processing
   - Payment webhooks
   - Subscription lifecycle

2. **admin.routes.test.ts** (20 tests, 8 hours) - 🔴 CRITICAL
   - Phase 3.5 security fixes
   - User management
   - Credit adjustments

3. **credits.routes.test.ts** (8 tests, 3 hours) - 🔴 CRITICAL
   - Credit balance API
   - User-facing billing

4. **subscriptions.routes.test.ts** (12 tests, 5 hours) - 🔴 CRITICAL
   - Subscription management
   - Recurring revenue

**Total**: 55 tests in 22 hours = Gets you to 82% coverage ✅

---

## Quick Win #3: Enable One File at a Time

**Strategy**: Pick the easiest file, fix it, commit, repeat.

### Recommended Order (Easiest First)
1. ✅ CreditCostBadge.test.tsx (10 tests) - Simple UI component
2. ✅ LearningHub.test.tsx (11 tests) - Standalone component
3. ✅ practice.routes.test.ts (3 tests) - Small test file
4. ✅ practice-enhancements.test.ts (14 tests) - Well-structured tests
5. ✅ referrals.routes.test.ts (23 tests) - Complete feature tests
6. ✅ prepare.routes.test.ts (31 tests) - Larger test suite
7. ✅ perform.routes.test.ts (24 tests) - Complex interactions

---

## Daily Goals

### Day 1 (4 hours)
- ✅ Unskip CreditCostBadge.test.tsx (10 tests)
- ✅ Unskip LearningHub.test.tsx (11 tests)
- ✅ Unskip practice.routes.test.ts (3 tests)
- **Total**: 24 tests → 238/330 (72%) ✅ GOAL MET

### Day 2 (4 hours)
- ✅ Unskip practice-enhancements.test.ts (14 tests)
- ✅ Start stripe-webhooks.test.ts (5 tests)
- **Total**: 257/330 (78%)

### Day 3 (4 hours)
- ✅ Complete stripe-webhooks.test.ts (10 tests)
- ✅ Start admin.routes.test.ts (6 tests)
- **Total**: 273/330 (83%)

### Day 4 (4 hours)
- ✅ Complete admin.routes.test.ts (14 tests)
- **Total**: 287/330 (87%)

### Day 5 (4 hours)
- ✅ Complete credits.routes.test.ts (8 tests)
- ✅ Complete subscriptions.routes.test.ts (12 tests)
- **Total**: 307/330 (93%) ✅ STRETCH GOAL

---

## Test Template Cheat Sheet

### Server Route Test
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import router from "../routes/your-route";

describe("Your Route", () => {
  let app;
  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.user = { id: "test-user-123" };
      next();
    });
    app.use("/api/route", router);
  });

  it("should work", async () => {
    const res = await request(app).get("/api/route/endpoint");
    expect(res.status).toBe(200);
  });
});
```

### Component Test
```typescript
import { render, screen } from "@testing-library/react";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import YourComponent from "./YourComponent";

it("should render", () => {
  const queryClient = new QueryClient();
  render(
    <QueryClientProvider client={queryClient}>
      <YourComponent />
    </QueryClientProvider>
  );
  expect(screen.getByText("Expected")).toBeInTheDocument();
});
```

---

## Common Fixes

### Fix #1: Remove .skip
```typescript
// Before:
describe.skip("My tests", () => {

// After:
describe("My tests", () => {
```

### Fix #2: Update imports
```typescript
// If you see import errors, check:
import { db } from "../db";           // Correct path?
import { users } from "@shared/schema"; // @shared alias configured?
```

### Fix #3: Mock external services
```typescript
// Mock before importing router:
vi.mock("../services/stripe-service", () => ({
  StripeService: { checkout: vi.fn() }
}));
```

### Fix #4: Act warning in React tests
```typescript
// Wrap state updates:
import { waitFor } from "@testing-library/react";

await waitFor(() => {
  expect(screen.getByText("Result")).toBeInTheDocument();
});
```

---

## Success Checklist

### ✅ Phase 9 Complete When:
- [ ] 231+ tests passing (70%+ coverage)
- [ ] Zero skipped tests (except documented)
- [ ] CI/CD pipeline green
- [ ] All critical routes tested (admin, credits, stripe, subscriptions)
- [ ] Documentation updated

### 🎯 Stretch Goals:
- [ ] 280+ tests passing (85% coverage)
- [ ] All skipped tests enabled
- [ ] Integration tests added
- [ ] Component tests added

---

## Getting Help

### Commands
```bash
# Run all tests
npm test

# Run specific file
npm test server/__tests__/admin.routes.test.ts

# Watch mode (auto-rerun)
npm test -- --watch

# See coverage
npm test -- --coverage
```

### Resources
- **Full Strategy**: `/docs/testing/PHASE_9_TESTING_STRATEGY.md`
- **Testing Guide**: `/docs/testing/TESTING_GUIDE.md`
- **Test Examples**: `/server/__tests__/gamification.routes.test.ts`

### Debugging
```bash
# Test fails? Add console.log:
console.log("DEBUG:", yourVariable);

# Need to see what's happening?
console.log("Request body:", req.body);
console.log("Response:", res.body);

# Check mock was called:
expect(mockFunction).toHaveBeenCalled();
console.log("Mock calls:", mockFunction.mock.calls);
```

---

## Quick Reference

| Test File | Tests | Hours | Priority | Status |
|-----------|-------|-------|----------|--------|
| CreditCostBadge | 10 | 2 | 🟢 Easy | ⏳ |
| LearningHub | 11 | 2 | 🟢 Easy | ⏳ |
| practice.routes | 3 | 1 | 🟢 Easy | ⏳ |
| **Day 1 Total** | **24** | **5** | | |
| practice-enhancements | 14 | 3 | 🟡 Medium | ⏳ |
| stripe-webhooks | 15 | 6 | 🔴 Critical | ⏳ |
| admin.routes | 20 | 8 | 🔴 Critical | ⏳ |
| credits.routes | 8 | 3 | 🔴 Critical | ⏳ |
| subscriptions.routes | 12 | 5 | 🔴 Critical | ⏳ |

---

**Remember**: Commit small, commit often. One passing test file = one commit.

**Start with**: `CreditCostBadge.test.tsx` (easiest, 10 tests, 2 hours)
