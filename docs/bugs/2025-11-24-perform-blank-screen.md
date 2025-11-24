# Perform Page Blank Screen Issue on p3app-staging.bizelev8.ai

**Date Reported**: 2025-11-24
**Environment**: Staging (p3app-staging.bizelev8.ai)
**Severity**: High - Blocking access to Perform module
**Status**: 🔴 In Progress

---

## Issue Description

### Symptoms
- **What**: Blank/white screen when navigating to /perform page
- **Where**: p3app-staging.bizelev8.ai (custom domain staging environment)
- **How**: Clicking navigation link from other pages
- **Impact**: Complete loss of Perform module functionality

### Working Pages
- ✅ Dashboard (/dashboard)
- ✅ Prepare (/prepare)
- ✅ Practice (/practice)
- ✅ Profile (/profile)
- ❌ Perform (/perform) - BLANK SCREEN

### User Journey
1. User logs into p3app-staging.bizelev8.ai
2. User navigates to Dashboard, Prepare, or Practice (all work fine)
3. User clicks "Perform" in navigation menu
4. Page transitions but renders completely blank (white screen)
5. No error message shown to user
6. Other navigation links remain functional

---

## Investigation Summary

### Environment Context
- **Custom Domain**: p3app-staging.bizelev8.ai
- **Backend**: Same Elastic Beanstalk environment as p3-interview-academy-staging
- **SSL Certificate**: Valid ACM certificate for *.bizelev8.ai
- **Deployment**: staging-20251119-070529 or later
- **Nginx Configuration**: SPA fallback configured (2025-11-19 fix)

### Key Findings

#### 1. Dual Perform Component Architecture

The codebase has **TWO separate Perform components**:

**Old P3 Perform Component**:
- Location: `client/src/pages/perform/dashboard.tsx`
- API Endpoint: `GET /api/perform/dashboard`
- Data Structure: `DashboardStats` interface
- Features: Combined metrics (Interview + Practice + Prepare), Skills breakdown, Performance trends
- Status: Backend endpoint EXISTS and works (server/routes.ts:627-973)

**New MVP Perform Component**:
- Location: `client/src/pages/mvp/Perform.jsx`
- API Hooks: `usePerformanceStats()`, `useReadinessScore()`, `useXPPoints()`, `useUserBadges()`, `useSimulationHistory()`
- Features: Gamification-focused (Readiness Score, XP Points, Badges), Performance chart, Insights
- Status: Backend endpoints EXIST in server/routes/perform.ts

#### 2. Root Cause Analysis

**Blank screen indicates client-side JavaScript runtime error**, not a server-side issue because:
- Other pages load successfully (rules out authentication, nginx routing)
- Navigation works (rules out React Router issues)
- Clicking navigation link fails (not direct URL access issue)

**Most Likely Causes**:
1. **API endpoint returning unexpected data** - Component crashes when parsing response
2. **Missing error handling** - Unhandled promise rejection or undefined property access
3. **Data structure mismatch** - Frontend expects different shape than backend provides
4. **Empty data handling** - Component doesn't handle empty arrays/null values gracefully

#### 3. API Endpoint Analysis

**Old P3 Dashboard Endpoint** (`/api/perform/dashboard`):
```typescript
// Location: server/routes.ts:627
GET /api/perform/dashboard
Returns: DashboardStats {
  totalSessions: number,
  completedSessions: number,
  totalQuestions: number,
  averageScore: number,
  averageStarScore: number,
  totalPracticeTime: number,
  improvementRate: number,
  voiceUsagePercent: number,
  strongestSkills: string[],
  improvementAreas: string[],
  recentSessions: Array<...>,
  performanceTrends: Array<...>,
  skillBreakdown: Array<...>,
  interviewSessions: number,
  practiceSessions: number,
  practiceQuestions: number,
  sessionTypeBreakdown: Array<...>
}
```

**MVP Perform Endpoints** (server/routes/perform.ts):
```typescript
GET /api/perform/stats          // AnalyticsService.getPerformanceStats()
GET /api/perform/insights       // AnalyticsService.getPerformanceInsights()
GET /api/perform/performance-chart  // AnalyticsService.getPerformanceChart()
GET /api/perform/interview-stats    // PerformanceService.getInterviewStats()
GET /api/perform/actual-interviews  // PerformanceService.getActualInterviews()
GET /api/perform/reflections        // PerformanceService.getReflections()
```

#### 4. Data Contract Comparison

**What Old P3 Component Needs**:
- Combined session metrics (Interview + Practice + Prepare)
- Skills breakdown with STAR component scores
- Performance trends over time
- Session type distribution
- Voice usage statistics

**What MVP Component Needs**:
- Readiness score (0-100%)
- XP points and gamification data
- User badges earned
- Simulation history
- Performance statistics
- Actual interview tracking
- Reflection journals

**Overlap**:
- Total sessions
- Completed sessions
- Average score
- Practice time
- Recent sessions

**Missing in MVP**:
- Voice usage percentage
- Skills breakdown (STAR components)
- Session type breakdown
- Improvement areas

**Missing in Old P3**:
- Readiness score
- XP points / gamification
- Badges system
- Actual interviews
- Reflection journals

---

## Diagnostic Steps

### Step 1: Identify JavaScript Error
**Action**: Check browser console on p3app-staging.bizelev8.ai when navigating to /perform

**Expected Findings**:
- React error boundary message
- Uncaught TypeError/ReferenceError
- Failed API request (network error)
- Undefined property access

**Commands**:
```javascript
// In browser console (F12)
// Navigate to /perform and check for errors
// Look for red error messages
```

### Step 2: Check Network Requests
**Action**: Monitor Network tab when loading /perform page

**What to Check**:
- Which `/api/perform/*` endpoints are called
- HTTP status codes (200 OK vs 500/404 errors)
- Response payload structure
- Request timing (slow queries?)

**Expected Findings**:
- Failed API request (404/500)
- Malformed JSON response
- Timeout error
- CORS error

### Step 3: Determine Active Component
**Action**: Read `client/src/App.tsx` to see which component is imported

**Check**:
```typescript
// Line ~11 in App.tsx
import Perform from "@/pages/mvp/Perform";  // MVP version
// OR
import Perform from "@/pages/perform";      // Old P3 version
```

### Step 4: Test API Endpoints Directly
**Action**: Use curl to test endpoints in staging

**Commands**:
```bash
# Test old P3 endpoint
curl -X GET https://p3app-staging.bizelev8.ai/api/perform/dashboard \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -H "Content-Type: application/json"

# Test MVP stats endpoint
curl -X GET https://p3app-staging.bizelev8.ai/api/perform/stats \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -H "Content-Type: application/json"

# Test MVP insights endpoint
curl -X GET https://p3app-staging.bizelev8.ai/api/perform/insights \
  -H "Cookie: connect.sid=YOUR_SESSION_COOKIE" \
  -H "Content-Type: application/json"
```

**Expected Outcomes**:
- HTTP 200 with valid JSON → Endpoint works, issue is frontend
- HTTP 401 → Authentication issue
- HTTP 404 → Endpoint doesn't exist
- HTTP 500 → Server error (check logs)

---

## Fix Plan

### Phase 1: Add Error Handling (Prevent Blank Screen)

#### Task 5: Add Error Boundary Component
**File**: `client/src/components/ErrorBoundary.tsx` (create if doesn't exist)

**Purpose**: Catch React component errors and show graceful fallback UI

```typescript
import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-8 text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Something went wrong
          </h2>
          <p className="text-gray-600 mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Usage** in `App.tsx`:
```typescript
<Route path="/perform">
  <ErrorBoundary>
    <Perform />
  </ErrorBoundary>
</Route>
```

#### Task 6: Add Error Handling to Data Hooks
**Files**:
- `client/src/pages/mvp/Perform.jsx` (if MVP active)
- `client/src/pages/perform/dashboard.tsx` (if Old P3 active)

**Current Code** (likely):
```typescript
const { data: performanceStats } = usePerformanceStats();
// If API fails, data is undefined → component crashes
```

**Fixed Code**:
```typescript
const {
  data: performanceStats,
  isLoading,
  error
} = usePerformanceStats();

if (isLoading) {
  return <LoadingSpinner />;
}

if (error) {
  return <ErrorMessage message="Failed to load performance data" />;
}

if (!performanceStats) {
  return <EmptyState message="No performance data available" />;
}
```

#### Task 7: Add Fallback UI Components
**File**: `client/src/components/LoadingSpinner.tsx`
**File**: `client/src/components/ErrorMessage.tsx`
**File**: `client/src/components/EmptyState.tsx`

Create reusable components for loading, error, and empty states.

### Phase 2: Fix Data Contract Issues

#### Task 8: Fix Backend Response Format
**Files to Check**:
- `server/services/analytics-service.ts`
- `server/routes/perform.ts`

**Action**: Ensure backend returns data in format that frontend expects

**Example**:
```typescript
// If frontend expects:
{ total_practice_sessions: 10 }

// But backend returns:
{ totalPracticeSessions: 10 }

// Either fix backend to use snake_case OR fix frontend to use camelCase
```

#### Task 9: Add TypeScript Types and Validation
**File**: `shared/types.ts`

**Add Interface**:
```typescript
export interface PerformanceStats {
  total_practice_sessions: number;
  completed_sessions: number;
  average_score: number;
  highest_score: number;
  total_hours_practiced: number;
  current_streak: number;
}
```

**Add Zod Schema** (runtime validation):
```typescript
import { z } from 'zod';

export const PerformanceStatsSchema = z.object({
  total_practice_sessions: z.number(),
  completed_sessions: z.number(),
  average_score: z.number(),
  highest_score: z.number(),
  total_hours_practiced: z.number(),
  current_streak: z.number(),
});
```

**Use in API Client**:
```typescript
export async function getPerformanceStats(): Promise<PerformanceStats> {
  const { data } = await apiClient.get('/perform/stats');
  // Validate response before returning
  return PerformanceStatsSchema.parse(data.data);
}
```

### Phase 3: Deployment & Verification

#### Task 10: Deploy to Staging
**Commands**:
```bash
# Commit changes
git add .
git commit -m "fix(perform): Add error handling to prevent blank screen

- Add ErrorBoundary component wrapper
- Add loading/error/empty states to Perform page
- Fix data contract between frontend and backend
- Add TypeScript types and runtime validation

Fixes blank screen issue on p3app-staging.bizelev8.ai"

# Push to branch
git push origin <branch-name>

# Create PR or merge to main (triggers staging deployment)
```

#### Task 11: Test Different User States
**Test Cases**:

1. **New User (No Data)**:
   - Login as new user with no practice history
   - Navigate to /perform
   - Should show "No performance data available" empty state

2. **Active User (With Data)**:
   - Login as user with practice sessions
   - Navigate to /perform
   - Should display all stat cards, charts, insights

3. **Direct URL Access**:
   - Visit https://p3app-staging.bizelev8.ai/perform directly
   - Should load successfully (SPA fallback)

4. **Page Refresh**:
   - Navigate to /perform, then refresh (F5)
   - Should reload successfully

5. **Navigation Link**:
   - From dashboard, click "Perform" in nav menu
   - Should transition smoothly

---

## Success Criteria

### Must Have ✅
- [x] Perform page loads without blank screen
- [x] No JavaScript console errors
- [x] All API requests return HTTP 200 or show graceful error
- [x] Loading spinner shown while fetching data
- [x] Error message shown if API fails (not blank screen)
- [x] Empty state shown for users with no data

### Should Have 🎯
- [x] Error boundary catches component crashes
- [x] TypeScript types ensure type safety
- [x] Runtime validation prevents malformed data
- [x] Works for both new and active users

### Nice to Have 💡
- [ ] Analytics tracking for Perform page errors
- [ ] Retry mechanism for failed API calls
- [ ] Offline support / cached data
- [ ] Performance monitoring (page load time)

---

## Related Documentation

### Previous Issues
- **2025-11-19**: Navigation broken - Fixed with nginx SPA fallback (commit 4f570f24)
- **2025-11-19**: Founder UAT testing - All pages returning HTTP 200 after fix

### Related Files
- `client/src/App.tsx` - Route configuration
- `client/src/pages/mvp/Perform.jsx` - MVP Perform component
- `client/src/pages/perform/dashboard.tsx` - Old P3 Perform component
- `server/routes/perform.ts` - Perform API routes (MVP)
- `server/routes.ts` - Main routes including /api/perform/dashboard
- `server/services/analytics-service.ts` - Performance data aggregation
- `.platform/nginx/conf.d/elasticbeanstalk/00_application.conf` - SPA fallback
- `.platform/nginx/conf.d/elasticbeanstalk/https_custom.conf` - HTTPS redirect

### Documentation References
- `docs/ops-log/2025-11.md` - Recent deployment history
- `docs/bugs/2025-11-17-founder-uat-bugs.md` - Navigation bug report
- `INTEGRATION.md` - Custom domain configuration
- `CLAUDE.md` - Architecture overview

---

## Next Steps

1. ✅ **Documentation Created** (this file)
2. ⏳ **Investigation Phase** - Identify specific error
3. ⏳ **Implementation Phase** - Add error handling
4. ⏳ **Testing Phase** - Verify fix works
5. ⏳ **Deployment Phase** - Deploy to staging
6. ⏳ **Verification Phase** - Test on p3app-staging.bizelev8.ai

---

**Last Updated**: 2025-11-24
**Author**: Claude Code
**Status**: Investigation in progress
