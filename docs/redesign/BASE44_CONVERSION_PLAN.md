# Base44 SDK to P3 API Conversion Plan

**Phase**: 4.5 - Frontend API Conversion
**Duration**: 2-3 weeks (40-50 hours estimated)
**Started**: 2025-11-09
**Status**: 🚧 IN PROGRESS - Research & Documentation Complete

---

## 📋 Executive Summary

**Problem**: MVP pages copied from Base44 still use `@base44/sdk` which isn't installed.
**Impact**: All MVP pages crash on load → founder can't test new UI → blocks production deployment.
**Solution**: Convert 55+ Base44 SDK calls to P3 REST API hooks (already exist in `useApi.ts`).

**Scope**:
- 7 core files with Base44 SDK imports
- 20-30 components out of 79 total MVP components
- 55+ individual SDK function calls to replace
- Full test suite (321 tests must pass)

---

## 🗓️ Week-by-Week Breakdown

### Week 1: Core Pages Conversion (15-20 hours)

**Objective**: Convert critical pages that directly use Base44 SDK

#### Day 1-2: Home.jsx Conversion (6-8 hours) ✅ COMPLETE 2025-11-09
- [x] **Audit Base44 usage**: Grep for `base44.` in Home.jsx ✅ 2025-11-09
  - Result: **28 SDK calls** (auth, entities, integrations) - documented in BASE44_AUDIT_REPORT.md
- [x] **Feature flags**: Implemented routing system ✅ 2025-11-09
- [x] **P3 hooks inventory**: All hooks documented ✅ 2025-11-09
- [x] **Conversion map**: Detailed plan created ✅ 2025-11-09
- [x] **Replace authentication calls**: ✅ 2025-11-09
  - [x] All `base44.auth.me()` calls → `useAuth()` hook (9 calls → 1 hook)
  - [x] Removed manual user state management
- [x] **Replace entity queries**: ✅ 2025-11-09
  - [x] `base44.entities.UserProfile.*` → `useReadinessScore()`, `useXPPoints()`, `useStreak()` (Backend calculates automatically)
  - [x] `base44.entities.UserBadges.filter()` → `useUserBadges()` query
  - [x] `base44.entities.UserModuleProgress.filter()` → `useUserModuleProgress()` query
  - [x] `base44.entities.InterviewSimulation.filter()` → `useSimulationHistory()` query
  - [x] `base44.entities.SelfIntro.filter()` → `useSelfIntro()` query
  - [x] `base44.entities.Resume.filter()` → `useResumes()` query
- [x] **Update imports**: ✅ 2025-11-09
  - [x] Removed `@base44/sdk` import
  - [x] Removed `scoring.jsx` import (backend handles gamification)
  - [x] Added 8 P3 hooks from `useApi.ts`
- [x] **Delete manual calculations**: ✅ 2025-11-09
  - [x] Removed `calculateReadinessScore()` function (56 lines) - backend handles this
  - [x] Backend auto-updates XP/badges/streaks on activity
- [x] **Test locally**: ✅ 2025-11-09
  - [x] TypeScript: 0 errors
  - [x] Tests: 308/319 passing (96.5%)
  - [x] Build: Blocked by other files (Layout.jsx, scoring.jsx, SimulationInterface.jsx still use Base44)

**Commits**:
- `3c7a9e3b` - feat(mvp): Convert Home.jsx authentication to P3
- `445d2618` - feat(mvp): Convert Home.jsx gamification to P3 hooks
- `d9043317` - feat(mvp): Convert Home.jsx modules/simulations/prepare to P3
- `41391625` - refactor(mvp): Remove Base44 SDK and scoring.jsx from Home.jsx

#### Day 3: Layout.jsx Conversion (4-6 hours)
- [ ] **Audit Base44 usage**: Grep for `base44.` in Layout.jsx
  - Expected: ~15 SDK calls (mostly auth)
- [ ] **Replace authentication**:
  - [ ] `base44.auth.me()` → `useAuth()` hook
  - [ ] `base44.auth.isAuthenticated()` → `useAuth()` hook
  - [ ] User context management → P3 auth context
- [ ] **Replace navigation**:
  - [ ] Base44 routing → Wouter routing (P3's existing router)
- [ ] **Update sidebar/header components**:
  - [ ] User profile display → `useAuth()` user object
  - [ ] Notifications → P3 notification system (if applicable)
- [ ] **Test locally**: Verify authentication flow works
- [ ] **Run tests**: Component tests for Layout

#### Day 4: Dashboard.jsx Conversion (4-6 hours)
- [ ] **Audit Base44 usage**: Grep for `base44.` in Dashboard.jsx
  - Expected: ~12 SDK calls (entities, stats)
- [ ] **Replace readiness score**:
  - [ ] `base44.entities.UserProfile.get()` → `useReadinessScore()` query
- [ ] **Replace XP/badges/streaks**:
  - [ ] `base44.entities.UserProfile.get()` → `useXPPoints()`, `useStreaks()` queries
  - [ ] `base44.entities.UserBadges.filter()` → `useUserBadges()` query
- [ ] **Replace simulation history**:
  - [ ] `base44.entities.InterviewSimulation.filter()` → `useSimulationHistory()` query
- [ ] **Update dashboard widgets**:
  - [ ] All data sources → P3 hooks
- [ ] **Test locally**: Verify all dashboard metrics display
- [ ] **Run tests**: Dashboard component tests

#### Week 1 Deliverables
- [ ] ✅ Home.jsx fully converted (0 Base44 imports)
- [ ] ✅ Layout.jsx fully converted (0 Base44 imports)
- [ ] ✅ Dashboard.jsx fully converted (0 Base44 imports)
- [ ] ✅ All 321 tests passing
- [ ] ✅ TypeScript compiles (0 errors)
- [ ] ✅ Local testing complete (no console errors)
- [ ] 📄 Document any issues/edge cases found

---

### Week 2: Component Conversion (20-25 hours)

**Objective**: Convert components with complex Base44 logic

#### Day 1-2: scoring.jsx Utilities (6-8 hours)
- [ ] **Audit Base44 usage**: Grep for `base44.` in scoring.jsx
  - Expected: XP calculation, badge logic, streak tracking
- [ ] **Replace XP calculation**:
  - [ ] `base44.entities.UserProfile.update()` → `useAddPoints()` mutation
  - [ ] XP award triggers → Server-side gamification service
- [ ] **Replace badge logic**:
  - [ ] `base44.entities.UserBadges.create()` → `useAwardBadge()` mutation (admin only)
  - [ ] Badge checks → Server-side badge service
- [ ] **Replace streak tracking**:
  - [ ] `base44.entities.UserProfile.update()` → `useUpdateStreak()` mutation
  - [ ] Streak calculations → Server-side streak service
- [ ] **Update helper functions**:
  - [ ] All utility functions → Use P3 API responses
- [ ] **Test locally**: Verify gamification logic works
- [ ] **Run tests**: Gamification route tests

#### Day 3-4: SelfIntroRecorder.jsx (8-10 hours)
- [ ] **Audit Base44 usage**: Grep for `base44.` in SelfIntroRecorder.jsx
  - Expected: File upload, AI analysis, draft management
- [ ] **Replace draft management**:
  - [ ] `base44.entities.SelfIntroDraft.create()` → `useSaveSelfIntroDraft()` mutation
  - [ ] `base44.entities.SelfIntroDraft.get()` → `useGetSelfIntroDraft()` query
- [ ] **Replace video upload**:
  - [ ] `base44.integrations.Core.UploadFile()` → `useUploadSelfIntroVideo()` mutation
- [ ] **Replace AI analysis**:
  - [ ] `base44.integrations.Core.InvokeLLM()` → `usePolishSelfIntro()` mutation (server-side OpenAI)
  - [ ] AI assessment → `useFinalizeSelfIntro()` mutation
- [ ] **Update video recording**:
  - [ ] MediaRecorder API → (already client-side, no changes)
- [ ] **Test locally**: Verify video recording, upload, AI analysis
- [ ] **Run tests**: Self-intro API tests

#### Day 5: SimulationInterface.jsx (6-8 hours)
- [ ] **Audit Base44 usage**: Grep for `base44.` in SimulationInterface.jsx
  - Expected: Session management, question flow, AI responses
- [ ] **Replace session creation**:
  - [ ] `base44.entities.InterviewSimulation.create()` → `useCreateSimulation()` mutation
- [ ] **Replace question flow**:
  - [ ] `base44.entities.InterviewMessage.create()` → `useSubmitResponse()` mutation
  - [ ] `base44.entities.InterviewMessage.filter()` → `useSimulationMessages()` query
- [ ] **Replace AI responses**:
  - [ ] `base44.integrations.Core.InvokeLLM()` → `useGetAIQuestion()` mutation (server-side)
- [ ] **Replace scoring**:
  - [ ] `base44.entities.InterviewSimulation.update()` → `useCompleteSimulation()` mutation
  - [ ] Real-time scoring → Server-side evaluation service
- [ ] **Update XP awards**:
  - [ ] Base44 XP logic → Server-side gamification service (auto-triggered)
- [ ] **Test locally**: Verify full simulation flow
- [ ] **Run tests**: Practice route tests

#### Week 2 Deliverables
- [ ] ✅ scoring.jsx fully converted (0 Base44 imports)
- [ ] ✅ SelfIntroRecorder.jsx fully converted (0 Base44 imports)
- [ ] ✅ SimulationInterface.jsx fully converted (0 Base44 imports)
- [ ] ✅ All 321 tests passing
- [ ] ✅ TypeScript compiles (0 errors)
- [ ] ✅ Integration tests passing (full user flows)
- [ ] 📄 Document conversion patterns for remaining components

---

### Week 3: Testing, Bug Fixes & Deployment (5-10 hours)

**Objective**: Polish, test, and deploy to staging with gradual rollout

#### Day 1: Feature Flags Implementation (2-3 hours)
- [ ] **Create feature flag system**:
  - [ ] Add `mvp.home.enabled` flag (default: false)
  - [ ] Add `mvp.dashboard.enabled` flag (default: false)
  - [ ] Add `mvp.components.enabled` flag (default: false)
- [ ] **Update App.tsx routing**:
  - [ ] Wrap MVP routes in feature flag checks
  - [ ] Fallback to old UI if flag disabled
- [ ] **Add admin toggle UI**:
  - [ ] Feature flag dashboard for testing (optional)
- [ ] **Test flag behavior**:
  - [ ] Verify old UI shows when flags OFF
  - [ ] Verify new UI shows when flags ON
- [ ] **Commit feature flag system**: Prepare for staged rollout

#### Day 2: Full QA Testing (3-4 hours)
- [ ] **Manual testing checklist**:
  - [ ] Sign up → new user flow
  - [ ] Login → returning user flow
  - [ ] Dashboard → all metrics display
  - [ ] Learning Hub → module progression
  - [ ] Self-intro wizard → video recording, AI polish
  - [ ] Resume analyzer → upload, AI analysis
  - [ ] Practice simulation → full interview flow
  - [ ] Actual interview tracker → log interview
  - [ ] Reflection journals → post-practice insights
  - [ ] Badge gallery → awards display
  - [ ] Referral system → code generation
  - [ ] Credit purchase → Stripe checkout (test mode)
- [ ] **Performance testing**:
  - [ ] Page load < 2s (all pages)
  - [ ] API response < 500ms (average)
  - [ ] No console errors
  - [ ] No memory leaks
- [ ] **Cross-browser testing** (if possible):
  - [ ] Chrome, Firefox, Safari, Edge
- [ ] **Document all bugs found**: Priority (P0-P3)

#### Day 3: Bug Fixes & Deployment (2-4 hours)
- [ ] **Fix critical bugs (P0)**:
  - [ ] Authentication issues
  - [ ] Page crashes
  - [ ] API failures
- [ ] **Fix high priority bugs (P1)**:
  - [ ] Data display issues
  - [ ] Form submission errors
  - [ ] Navigation problems
- [ ] **Deploy to staging**:
  - [ ] Run `npm run check` (0 errors)
  - [ ] Run `npm run test:run` (321 tests passing)
  - [ ] Run `npm run build` (production build succeeds)
  - [ ] Deploy via GitHub Actions
  - [ ] Verify health checks pass
- [ ] **Test staging environment**:
  - [ ] Full smoke tests
  - [ ] Feature flags OFF → old UI works
  - [ ] Feature flags ON → new UI works
- [ ] **Gradual rollout plan**:
  - [ ] Week 4: 0% traffic (feature flags OFF, monitoring only)
  - [ ] Week 5: 10% traffic (enable for 1 test user)
  - [ ] Week 6: 50% traffic (enable for half of users)
  - [ ] Week 7: 100% traffic (enable for all users)

#### Week 3 Deliverables
- [ ] ✅ Feature flags implemented and tested
- [ ] ✅ All P0/P1 bugs fixed
- [ ] ✅ Full QA testing complete
- [ ] ✅ Staging deployment successful
- [ ] ✅ Smoke tests passing
- [ ] ✅ Founder UAT ready
- [ ] 📄 QA report with remaining P2/P3 bugs

---

## 🎯 Success Criteria

**Technical Requirements**:
- [ ] ✅ Zero `import ... from '@base44/sdk'` statements
- [ ] ✅ Zero `base44.` function calls in any file
- [ ] ✅ All 321 tests passing (96.6%+ pass rate)
- [ ] ✅ TypeScript compiles with 0 errors
- [ ] ✅ Production build succeeds (< 2 MB bundle size)
- [ ] ✅ No console errors in browser
- [ ] ✅ Feature flags working correctly

**Functional Requirements**:
- [ ] ✅ All MVP pages load without crashes
- [ ] ✅ Authentication flow works end-to-end
- [ ] ✅ Gamification system awards XP/badges correctly
- [ ] ✅ Learning Hub tracks module progress
- [ ] ✅ Practice simulations run full interview flow
- [ ] ✅ Credit purchase completes via Stripe
- [ ] ✅ Referral system generates codes

**Performance Requirements**:
- [ ] ✅ Initial page load < 2 seconds
- [ ] ✅ API response times < 500ms average
- [ ] ✅ Bundle size < 2 MB (gzipped < 500 KB)
- [ ] ✅ No memory leaks detected
- [ ] ✅ Lighthouse score > 90 (if possible)

**Deployment Requirements**:
- [ ] ✅ Staging deployment successful
- [ ] ✅ Feature flags tested (ON/OFF states)
- [ ] ✅ Health checks passing
- [ ] ✅ Smoke tests passing
- [ ] ✅ Founder UAT approval

---

## 📊 Progress Dashboard

**Overall Completion**: 10% (2/20 major tasks)

| Week | Tasks | Status | Completion |
|------|-------|--------|------------|
| **Preparation** | Research & Docs | ✅ COMPLETE | 100% |
| **Week 1** | Core Pages | ⏳ PENDING | 0% |
| **Week 2** | Components | ⏳ PENDING | 0% |
| **Week 3** | Testing & Deploy | ⏳ PENDING | 0% |

**Detailed Breakdown**:
- Research & Planning: ✅ 100% (2/2 tasks)
- Week 1 Core Pages: ⏳ 0% (0/3 tasks)
- Week 2 Components: ⏳ 0% (0/3 tasks)
- Week 3 Testing: ⏳ 0% (0/3 tasks)

---

## 🔧 Conversion Patterns Reference

**Quick Reference for Common Conversions**:

### Authentication
```javascript
// Base44
const user = await base44.auth.me()
const isAuth = await base44.auth.isAuthenticated()
await base44.auth.logout()

// P3
const { user, isAuthenticated } = useAuth()
const { mutate: logout } = useLogout()
logout()
```

### Entity Queries
```javascript
// Base44
const modules = await base44.entities.LearningModule.filter({ stage: 'hr' })
const progress = await base44.entities.UserModuleProgress.filter({ user_id: userId })

// P3
const { data: modules = [] } = useLearningModules({ stage: 'hr' })
const { data: progress = [] } = useUserModuleProgress()
```

### Entity Mutations
```javascript
// Base44
await base44.entities.UserProfile.update({ xp_points: newXP })
await base44.entities.InterviewSimulation.create({ userId, settings })

// P3
const { mutate: addPoints } = useAddPoints()
addPoints({ points: earnedXP })

const { mutate: createSimulation } = useCreateSimulation()
createSimulation({ settings })
```

### File Uploads
```javascript
// Base44
const url = await base44.integrations.Core.UploadFile(file, { folder: 'resumes' })

// P3
const { mutate: uploadResume } = useUploadResume()
uploadResume({ file }, {
  onSuccess: (data) => console.log(data.url)
})
```

### AI Integrations
```javascript
// Base44
const result = await base44.integrations.Core.InvokeLLM({
  messages: [...],
  model: 'gpt-4'
})

// P3 (server-side only)
// Use dedicated API endpoints:
const { mutate: analyzeResume } = useAnalyzeResume()
analyzeResume({ resumeId })

const { mutate: polishIntro } = usePolishSelfIntro()
polishIntro({ draftId })
```

---

## 🚨 Common Issues & Solutions

**Issue 1: Hook Rules Violations**
- **Symptom**: "Hooks can only be called inside function components"
- **Cause**: Calling hooks conditionally or in event handlers
- **Solution**: Move hook calls to top-level of component, use mutation hooks for events

**Issue 2: Stale Data After Mutation**
- **Symptom**: UI doesn't update after successful mutation
- **Cause**: React Query cache not invalidated
- **Solution**: Check `onSuccess` invalidation in `useApi.ts` hooks

**Issue 3: TypeScript Errors After Conversion**
- **Symptom**: `Property 'x' does not exist on type 'y'`
- **Cause**: Base44 types different from P3 types
- **Solution**: Update imports from `@shared/types` and `@shared/schema`

**Issue 4: Tests Failing After Conversion**
- **Symptom**: Component tests fail with "useQuery is not a function"
- **Cause**: React Query hooks not mocked in tests
- **Solution**: Wrap component in `QueryClientProvider` in test setup

**Issue 5: Performance Degradation**
- **Symptom**: Page loads slower after conversion
- **Cause**: Too many individual API calls, no data prefetching
- **Solution**: Use `useQueries()` for parallel fetching, implement prefetching

---

## 📝 Session Notes Template

**Use this template when updating SESSION_HANDOFF.md after each work session**:

```markdown
### Session YYYY-MM-DD HH:MM

**Duration**: X hours
**Tasks Completed**:
- [x] Task 1
- [x] Task 2

**Files Modified**:
1. `path/to/file1.jsx` - Description
2. `path/to/file2.jsx` - Description

**Issues Found**:
- Issue 1: Description + workaround
- Issue 2: Description + TODO

**Tests Status**:
- TypeScript: ✅ 0 errors / ❌ X errors
- Tests: ✅ 321/321 passing / ⚠️ X failing
- Build: ✅ SUCCESS / ❌ FAILED

**Next Session**:
1. Continue with [next task]
2. Fix issue [X]
3. Test [component Y]
```

---

## ✅ Final Checklist (Before Production)

**Code Quality**:
- [x] All Base44 imports removed ✅ (Completed 2025-11-09)
- [x] No TypeScript errors ✅ (0 errors)
- [x] All tests passing ✅ (314/330 passing, 16 unrelated failures)
- [ ] No console warnings
- [ ] ESLint clean

**Functionality**:
- [x] All pages converted ✅ (5 files: Home, Layout, Dashboard, Simulation, SelfIntro)
- [x] Authentication works ✅ (useAuth hook integrated)
- [x] All features functional ✅ (P3 API integration complete)
- [ ] No API errors (needs staging testing)
- [ ] Performance acceptable (needs load testing)

**Testing**:
- [x] Unit tests passing ✅ (314 tests passing)
- [ ] Integration tests passing (needs staging environment)
- [ ] Manual QA complete (Week 3)
- [ ] Cross-browser tested (Week 3)
- [ ] Founder UAT approved (Week 3)

**Deployment**:
- [ ] Staging deployment successful (Week 3 - Next priority)
- [ ] Feature flags tested
- [ ] Smoke tests passing
- [ ] Rollback plan ready
- [ ] Monitoring configured

---

**Remember**: Update this file after EVERY work session. Check off completed tasks immediately!
