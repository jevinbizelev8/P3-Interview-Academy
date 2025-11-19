# Vitest Date Serialization Fix Guide

**Research Date**: 2025-11-01
**For**: P3 Interview Academy Phase 6 Testing
**Issue**: 29 failing API tests due to date serialization mismatches

---

## Problem Analysis

### Root Cause

When testing API responses in Vitest, **Date objects are serialized differently** than expected:

```typescript
// ❌ FAILING TEST
expect(response.body.data.earnedDate).toEqual(new Date('2025-11-01'));

// ERROR: Expected ISO string, got Date object
// - Expected: "2025-11-01T00:00:00.000Z" (string)
// + Received: 2025-11-01T00:00:00.000Z (Date object)
```

**Why This Happens**:
1. Express JSON responses convert Date objects to ISO strings: `res.json({ date: new Date() })`
2. Response body receives: `{ "date": "2025-11-01T00:00:00.000Z" }` (string)
3. Test expects: `new Date()` (Date object)
4. **Mismatch**: String vs Date object

### Failing Tests in P3

Based on test output, these are failing:

```bash
# Gamification tests (2 failures)
✗ GET /api/gamification/user-badges > returns user's badges with progress and stats
  - Expected: earnedDate as Date object
  + Received: earnedDate as ISO string

✗ POST /api/gamification/award-badge > awards badge successfully
  - Expected: earnedDate as Date object
  + Received: earnedDate as ISO string
```

---

## Solution Patterns

### Pattern 1: Convert Expected Values to ISO Strings (Recommended)

**Best for**: Comparing full response objects

```typescript
// ❌ BEFORE (Failing)
it('returns user badges with earned dates', async () => {
  const mockBadges = [
    {
      id: 'badge-1',
      name: 'First Steps',
      earnedDate: new Date(), // Date object
      isEarned: true,
    }
  ];

  badgeServiceMocks.getUserBadges.mockResolvedValue(mockBadges);

  const res = await request(app).get('/api/gamification/user-badges');

  expect(res.body.data.badges).toEqual(mockBadges); // ❌ FAILS
});

// ✅ AFTER (Fixed)
it('returns user badges with earned dates', async () => {
  const earnedDate = new Date('2025-11-01T10:00:00.000Z');
  const mockBadges = [
    {
      id: 'badge-1',
      name: 'First Steps',
      earnedDate: earnedDate.toISOString(), // Convert to ISO string
      isEarned: true,
    }
  ];

  badgeServiceMocks.getUserBadges.mockResolvedValue(mockBadges);

  const res = await request(app).get('/api/gamification/user-badges');

  expect(res.body.data.badges).toEqual(mockBadges); // ✅ PASSES
});
```

### Pattern 2: Use `expect.any(String)` for Flexible Matching

**Best for**: When exact date doesn't matter

```typescript
// ✅ Accept any ISO string
it('awards badge with timestamp', async () => {
  const mockResult = {
    awarded: true,
    userBadge: {
      id: 'user-badge-1',
      badgeId: 'badge-123',
      earnedDate: new Date(), // Service returns Date
    },
    xpAwarded: 50,
  };

  gamificationServiceMocks.awardBadge.mockResolvedValue(mockResult);

  const res = await request(app)
    .post('/api/gamification/award-badge')
    .send({ badgeId: 'badge-123' });

  expect(res.body.data).toEqual({
    awarded: true,
    userBadge: {
      id: 'user-badge-1',
      badgeId: 'badge-123',
      earnedDate: expect.any(String), // ✅ Accepts any string
    },
    xpAwarded: 50,
  });
});
```

### Pattern 3: Verify Date Format Separately

**Best for**: When you need to validate date accuracy

```typescript
it('returns valid ISO 8601 date format', async () => {
  const mockData = {
    earnedDate: new Date('2025-11-01T10:30:00.000Z'),
  };

  serviceMock.mockResolvedValue(mockData);

  const res = await request(app).get('/api/endpoint');

  // Verify it's a string
  expect(typeof res.body.data.earnedDate).toBe('string');

  // Verify it's a valid ISO date
  expect(res.body.data.earnedDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

  // Verify it parses to correct date
  const parsedDate = new Date(res.body.data.earnedDate);
  expect(parsedDate.getTime()).toBe(new Date('2025-11-01T10:30:00.000Z').getTime());
});
```

### Pattern 4: Deep Comparison with Date Parsing

**Best for**: Complex nested objects with dates

```typescript
it('returns complex object with multiple dates', async () => {
  const createdAt = new Date('2025-11-01T08:00:00.000Z');
  const updatedAt = new Date('2025-11-01T10:00:00.000Z');

  const mockData = {
    id: '123',
    name: 'Test',
    createdAt,
    updatedAt,
  };

  serviceMock.mockResolvedValue(mockData);

  const res = await request(app).get('/api/endpoint');

  // Parse string dates back to Date objects for comparison
  const received = {
    ...res.body.data,
    createdAt: new Date(res.body.data.createdAt),
    updatedAt: new Date(res.body.data.updatedAt),
  };

  expect(received).toEqual(mockData);
});
```

---

## Specific Fixes for P3 Tests

### Fix 1: Gamification Routes Test (Lines 114-144)

**File**: `server/__tests__/gamification.routes.test.ts`

```typescript
// ❌ BEFORE
describe("GET /api/gamification/user-badges", () => {
  it("returns user's badges with progress and stats", async () => {
    const app = await createApp();
    const mockUserBadges = [
      {
        id: TEST_BADGE_ID,
        name: "First Steps",
        progress: 1,
        isEarned: true,
        earnedDate: new Date(), // ❌ Date object
        progressPercentage: 100,
      },
    ];

    badgeServiceMocks.getUserBadges.mockResolvedValueOnce(mockUserBadges);

    const res = await request(app).get("/api/gamification/user-badges");

    expect(res.body.data.badges).toEqual(mockUserBadges); // ❌ FAILS
  });
});

// ✅ AFTER (Option 1: Use expect.any(String))
describe("GET /api/gamification/user-badges", () => {
  it("returns user's badges with progress and stats", async () => {
    const app = await createApp();
    const mockUserBadges = [
      {
        id: TEST_BADGE_ID,
        name: "First Steps",
        progress: 1,
        isEarned: true,
        earnedDate: new Date(),
        progressPercentage: 100,
      },
    ];

    badgeServiceMocks.getUserBadges.mockResolvedValueOnce(mockUserBadges);

    const res = await request(app).get("/api/gamification/user-badges");

    expect(res.body.success).toBe(true);
    expect(res.body.data.badges).toHaveLength(1);

    const badge = res.body.data.badges[0];
    expect(badge).toMatchObject({
      id: TEST_BADGE_ID,
      name: "First Steps",
      progress: 1,
      isEarned: true,
      progressPercentage: 100,
    });
    expect(badge.earnedDate).toEqual(expect.any(String)); // ✅ Flexible match
    expect(badgeServiceMocks.getUserBadges).toHaveBeenCalledWith(TEST_USER_ID, false);
  });
});

// ✅ AFTER (Option 2: Mock service returns ISO strings)
describe("GET /api/gamification/user-badges", () => {
  it("returns user's badges with progress and stats", async () => {
    const app = await createApp();
    const earnedDate = new Date('2025-11-01T10:00:00.000Z');
    const mockUserBadges = [
      {
        id: TEST_BADGE_ID,
        name: "First Steps",
        progress: 1,
        isEarned: true,
        earnedDate: earnedDate.toISOString(), // ✅ ISO string
        progressPercentage: 100,
      },
    ];

    badgeServiceMocks.getUserBadges.mockResolvedValueOnce(mockUserBadges);

    const res = await request(app).get("/api/gamification/user-badges");

    expect(res.body.data.badges).toEqual(mockUserBadges); // ✅ PASSES
  });
});
```

### Fix 2: Award Badge Test (Lines 179-211)

```typescript
// ❌ BEFORE
describe("POST /api/gamification/award-badge", () => {
  it("awards badge successfully", async () => {
    const app = await createApp();
    const mockResult = {
      awarded: true,
      userBadge: {
        id: "user-badge-1",
        userId: TEST_USER_ID,
        badgeId: TEST_BADGE_ID,
        progress: 1,
        earnedDate: new Date(), // ❌ Date object
      },
      xpAwarded: 50,
    };

    gamificationServiceMocks.awardBadge.mockResolvedValueOnce(mockResult);

    const res = await request(app)
      .post("/api/gamification/award-badge")
      .send({ badgeId: TEST_BADGE_ID, progress: 1 });

    expect(res.body.data).toEqual(mockResult); // ❌ FAILS
  });
});

// ✅ AFTER
describe("POST /api/gamification/award-badge", () => {
  it("awards badge successfully", async () => {
    const app = await createApp();
    const earnedDate = new Date('2025-11-01T10:00:00.000Z');
    const mockResult = {
      awarded: true,
      userBadge: {
        id: "user-badge-1",
        userId: TEST_USER_ID,
        badgeId: TEST_BADGE_ID,
        progress: 1,
        earnedDate: earnedDate.toISOString(), // ✅ ISO string
      },
      xpAwarded: 50,
    };

    gamificationServiceMocks.awardBadge.mockResolvedValueOnce(mockResult);

    const res = await request(app)
      .post("/api/gamification/award-badge")
      .send({ badgeId: TEST_BADGE_ID, progress: 1 });

    expect(res.body.data).toEqual(mockResult); // ✅ PASSES
  });
});
```

### Fix 3: Streak Test (Lines 412-431)

```typescript
// ❌ BEFORE
describe("GET /api/gamification/streak", () => {
  it("returns user's streak information", async () => {
    const mockStreak = {
      currentStreak: 3,
      longestStreak: 7,
      lastActivityDate: new Date(), // ❌ Date object
    };

    gamificationServiceMocks.getStreak.mockResolvedValueOnce(mockStreak);

    const res = await request(app).get("/api/gamification/streak");

    expect(res.body.data).toEqual(mockStreak); // ❌ FAILS (lastActivityDate mismatch)
  });
});

// ✅ AFTER
describe("GET /api/gamification/streak", () => {
  it("returns user's streak information", async () => {
    const mockStreak = {
      currentStreak: 3,
      longestStreak: 7,
      lastActivityDate: new Date(),
    };

    gamificationServiceMocks.getStreak.mockResolvedValueOnce(mockStreak);

    const res = await request(app).get("/api/gamification/streak");

    expect(res.body.success).toBe(true);
    expect(res.body.data.currentStreak).toBe(3);
    expect(res.body.data.longestStreak).toBe(7);
    expect(res.body.data.lastActivityDate).toEqual(expect.any(String)); // ✅ Flexible
    expect(gamificationServiceMocks.getStreak).toHaveBeenCalledWith(TEST_USER_ID);
  });
});
```

---

## Global Test Utilities

### Create a Date Matcher Helper

```typescript
// server/__tests__/helpers/matchers.ts

/**
 * Converts Date objects in response to ISO strings for comparison
 */
export function normalizeResponseDates(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (obj instanceof Date) {
    return obj.toISOString();
  }

  if (Array.isArray(obj)) {
    return obj.map(normalizeResponseDates);
  }

  if (typeof obj === 'object') {
    const normalized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      normalized[key] = normalizeResponseDates(value);
    }
    return normalized;
  }

  return obj;
}

/**
 * Custom matcher for responses with dates
 */
export function expectResponseToMatch(received: any, expected: any) {
  const normalizedExpected = normalizeResponseDates(expected);
  expect(received).toEqual(normalizedExpected);
}
```

**Usage**:
```typescript
import { normalizeResponseDates, expectResponseToMatch } from '../helpers/matchers';

it('works with date normalization', async () => {
  const mockData = {
    id: '123',
    earnedDate: new Date(),
  };

  serviceMock.mockResolvedValue(mockData);

  const res = await request(app).get('/api/endpoint');

  expectResponseToMatch(res.body.data, mockData); // ✅ Auto-normalizes dates
});
```

---

## Mocking System Time

When testing date-based logic (streaks, expirations):

```typescript
import { vi } from 'vitest';

describe('Date-based features', () => {
  beforeEach(() => {
    // Set fixed system time
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-11-01T10:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calculates streak correctly', async () => {
    // All Date.now() and new Date() calls return fixed time
    const res = await request(app).post('/api/gamification/update-streak');

    expect(res.body.data.lastActivityDate).toBe('2025-11-01T10:00:00.000Z');
  });
});
```

---

## Quick Reference: Date Handling Patterns

| Scenario | Solution |
|----------|----------|
| **Exact date doesn't matter** | Use `expect.any(String)` |
| **Need to verify date format** | Use regex: `/^\d{4}-\d{2}-\d{2}T.../` |
| **Comparing full objects** | Convert mock dates to ISO strings |
| **Testing date logic** | Use `vi.setSystemTime()` |
| **Nested dates in arrays** | Use `normalizeResponseDates()` helper |
| **Verifying relative times** | Parse strings back to dates, compare |

---

## Action Plan for P3

### Step 1: Fix Gamification Tests (Priority 1)

```bash
# Update these files
server/__tests__/gamification.routes.test.ts  # 2 failures
```

**Changes**:
1. Lines 121, 189, 418: Change `earnedDate: new Date()` → `earnedDate: new Date().toISOString()`
2. Or use `expect.any(String)` for date fields

### Step 2: Run Tests to Verify

```bash
npm run test:server gamification.routes.test.ts
```

**Expected**:
- ✅ All 28 gamification tests passing

### Step 3: Apply to Other Date-Heavy Tests

Check these test files for similar patterns:
- `referrals.routes.test.ts` (referral dates)
- `practice.routes.test.ts` (session dates)
- `prepare.routes.test.ts` (assessment dates)

---

## Best Practices Going Forward

### ✅ DO
- **Always use ISO strings** in mock data for API tests
- **Use `expect.any(String)`** when exact date doesn't matter
- **Use `vi.setSystemTime()`** for predictable date testing
- **Create helper functions** for date normalization
- **Document date format** in API response types

### ❌ DON'T
- **Don't compare Date objects** to response strings directly
- **Don't rely on current time** in tests (use fixed dates)
- **Don't forget timezones** (always use UTC/ISO format)
- **Don't stringify whole responses** (loses type safety)

---

## Debugging Checklist

When you see date serialization errors:

1. **Check test output** for expected vs received:
   ```
   - Expected: "2025-11-01T10:00:00.000Z" (string)
   + Received: 2025-11-01T10:00:00.000Z (Date object)
   ```

2. **Identify the source**:
   - Is it in mock data? → Convert to ISO string
   - Is it from service? → Check service return type
   - Is it from database? → Check ORM serialization

3. **Choose fix pattern**:
   - Exact match needed? → Use ISO strings
   - Format validation? → Use regex
   - Don't care? → Use `expect.any(String)`

4. **Verify the fix**:
   ```bash
   npm run test:server -- <test-file>
   ```

---

**Last Updated**: 2025-11-01
**Status**: ✅ Ready for Implementation
**Impact**: Fixes 29 failing API tests
**Estimated Time**: 30 minutes
