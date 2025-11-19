# Phase 6 Autonomous Execution Plan

**Created**: 2025-11-05
**Status**: Ready for Execution
**Orchestrator**: Claude Code (Main)
**Human Input**: Minimal (end-of-session only, or Telegram for critical blockers)

---

## 🎯 Execution Philosophy

**Claude Code is the Decision Maker**:
- Autonomous execution with pre-defined decision trees
- No human approval needed for standard operations
- Telegram notifications for progress updates
- **Only interrupt human for**:
  1. Critical blockers that prevent workflow continuation
  2. End-of-session summary and sign-off
  3. Production deployment approval (Phase 7)

---

## 📋 Pre-Execution Checklist

**Before starting, Claude Code will**:
- [ ] Enable Telegram notifications: `./scripts/telegram/core/notifyctl on`
- [ ] Disable StatusLine: Edit `~/.claude/settings.json` → `statusLine.type: "none"`
- [ ] Send start notification: `./scripts/telegram/core/notify.sh "Phase 6 autonomous execution started"`
- [ ] Create todo list with all tasks (use TodoWrite tool)

---

## 🤖 Autonomous Execution Workflow

### Stage 1: Integration Tests (2-3 hours)

**Objective**: Write 4 critical integration tests

#### Task 1.1: Practice User Journey Test
**File**: `client/src/__tests__/integration/practice-flow.integration.test.tsx`
**Agent**: Main Claude (no specialist needed)
**Coverage**:
- Setup practice session
- Start interview simulation
- Answer questions
- Receive AI assessment
- Check credit deduction

**Decision Tree**:
- If test setup fails → Check existing integration test patterns in `prepare-session.integration.test.tsx` and replicate
- If API mocking is unclear → Use MSW patterns from existing tests
- If test passes → Mark todo as complete, notify via Telegram, continue
- If test fails → Debug, fix, re-run. If blocked >30 min → Notify via Telegram for human review

**Success Criteria**: Test passes, covers full practice flow, no human input needed

---

#### Task 1.2: Gamification Triggers Test
**File**: `server/__tests__/integration/gamification-triggers.integration.test.ts`
**Agent**: Main Claude
**Coverage**:
- XP award on module completion
- Badge progression logic
- Streak tracking (daily activity)
- Readiness score recalculation

**Decision Tree**:
- If gamification service unclear → Read `server/services/gamification-service.ts` for implementation details
- If database mocking needed → Use patterns from `server/__tests__/gamification.routes.test.ts`
- If XP calculations unclear → Reference `docs/redesign/DATABASE_SCHEMA.md` for XP rules
- If test passes → Continue
- If blocked → Notify via Telegram, document issue, continue to next task

**Success Criteria**: Test validates XP, badges, streaks, readiness score updates

---

#### Task 1.3: Credit Purchase E2E Test
**File**: `server/__tests__/integration/credit-purchase.integration.test.ts` (enhance existing)
**Agent**: stripe-specialist
**Coverage**:
- Stripe checkout session creation
- Webhook handling (payment success)
- Credit balance update
- Transaction history

**Decision Tree**:
- Use stripe-specialist agent for Stripe-specific testing
- If webhook testing unclear → Use Stripe CLI patterns from CLAUDE.md
- If test passes → Continue
- If Stripe configuration needed → Document for end-of-session review

**Success Criteria**: Full E2E test from checkout to credit balance update

---

#### Task 1.4: Referral System E2E Test
**File**: `server/__tests__/integration/referral-flow.integration.test.ts`
**Agent**: Main Claude
**Coverage**:
- Referral code generation
- Code application by new user
- Credit award to referrer
- Referral stats tracking

**Decision Tree**:
- If referral logic unclear → Read `server/__tests__/referrals.routes.test.ts` and `docs/redesign/API_MAPPING.md`
- If database relationships unclear → Reference `docs/redesign/DATABASE_SCHEMA.md`
- If test passes → Continue
- If blocked → Document, notify via Telegram

**Success Criteria**: Test validates full referral flow

---

#### Task 1.5: Run All Tests
**Command**: `npm run test:run`
**Decision Tree**:
- If new tests pass → Excellent, continue to Stage 2
- If new tests fail → Debug and fix immediately
- If existing tests still have failures → Acceptable, continue to Stage 2 (will fix in next stage)

**Telegram Notification**: "Stage 1 complete: 4 integration tests created. Results: X/X passing"

---

### Stage 2: Fix API Test Failures (2-3 hours)

**Objective**: Bring server API test pass rate from 86% to >90%

#### Task 2.1: Analyze Failures
**Command**: `npm run test:api` (with verbose output)
**Action**:
- Identify all 29 failing tests
- Categorize by failure type:
  - Date serialization issues (non-critical, document as acceptable)
  - Authentication issues (must fix)
  - Data validation issues (must fix)
  - Other issues (evaluate case-by-case)

**Decision Tree**:
- **Date serialization issues**: Document as "acceptable - known cosmetic issue", skip fix
- **Authentication/validation issues**: Fix immediately
- **Unknown issues**: Investigate, fix if <30 min, otherwise document for end-of-session review

---

#### Task 2.2: Fix Critical Failures
**Agent**: Main Claude
**Action**:
- Fix authentication issues in API tests
- Fix data validation issues
- Fix any test setup/teardown issues

**Decision Tree**:
- If fix is straightforward → Apply fix, re-run tests
- If fix requires API change → Document for human review at end of session
- If fix requires schema change → STOP, notify via Telegram immediately (critical blocker)
- Target: >90% pass rate overall

**Success Criteria**: Server test pass rate >90% (180+/203 passing)

---

#### Task 2.3: Document Non-Critical Failures
**File**: `docs/redesign/TEST_STATUS.md` (create)
**Content**:
- List of remaining failures
- Categorization (critical vs non-critical)
- Justification for deferring fixes
- Plan for post-deployment resolution

**Decision Tree**:
- If all critical tests pass → Document remaining failures as post-deployment work
- If critical tests still fail → Escalate to end-of-session review

**Telegram Notification**: "Stage 2 complete: API tests at X% pass rate. Y failures documented as acceptable."

---

### Stage 3: Code Review & Security Scan (30 min)

**Objective**: Clean security scan, prepare for commit

#### Task 3.1: Run Session Code Review
**Agent**: session-code-reviewer
**Actions**:
- Security scan (detect AWS keys, Stripe keys, database URLs, etc.)
- Repository housekeeping (remove temp files, check .gitignore)
- TypeScript validation (`npm run check`)
- Build validation (`npm run build`)

**Decision Tree**:
- **If secrets found**:
  - Remove immediately
  - Check git history for exposure
  - Notify via Telegram if secrets were committed
  - Regenerate compromised keys (add to end-of-session action items)
- **If TypeScript errors found**:
  - Fix if <15 min
  - Otherwise, document for end-of-session review
- **If build fails**:
  - STOP, notify via Telegram (critical blocker)
- **If all clean**: Continue to commit

**Success Criteria**: Clean security scan, no secrets, TypeScript passes, build succeeds

---

#### Task 3.2: Commit and Push
**Agent**: session-code-reviewer (handles git operations)
**Actions**:
- Stage all test files
- Create commit with message: "test: Complete Phase 6 integration tests and fix API test failures"
- Push to `redesign/mvp-founder-design` branch

**Decision Tree**:
- If push succeeds → Continue to Stage 4
- If push fails (conflicts) → Pull, rebase, push again
- If still fails → Notify via Telegram, document for human resolution

**Telegram Notification**: "Stage 3 complete: Code reviewed, committed, pushed to branch"

---

### Stage 4: SSL Setup & Pre-Deployment (1 hour)

**Objective**: Complete SSL certificate validation, prepare for deployment

#### Task 4.1: Resume SSL Setup
**Agent**: aws-deployment-specialist
**Status**: Paused at DNS validation step
**Actions**:
1. Verify certificate request: ARN `arn:aws:acm:ap-southeast-1:417132395013:certificate/8e2e99dd-dc3b-4538-a433-51796d33b355`
2. Get DNS CNAME validation records from AWS ACM
3. **Critical Decision Point**: Add CNAME to Cloudflare DNS
   - **Option A**: If Cloudflare credentials available → Add CNAME automatically via Cloudflare API
   - **Option B**: If no access → **STOP, notify via Telegram**: "Need Cloudflare DNS access to add CNAME: [provide CNAME details]"
4. Wait for certificate validation (5-10 min, check status every 30 sec)
5. Configure HTTPS listener on staging ELB
6. Test HTTPS access to `https://p3app-staging.bizelev8.ai`

**Decision Tree**:
- If certificate validates → Continue to configure ELB
- If validation takes >15 min → Continue to Stage 5 anyway (SSL not blocking deployment, can finish later)
- If ELB configuration fails → Document error, continue anyway (HTTP deployment is acceptable for staging)

**Telegram Notification**: "Stage 4 complete: SSL status [SUCCESS/PENDING/DEFERRED]"

---

#### Task 4.2: Pre-Deployment Health Check
**Command**: `./deployment-scripts/check-environment-status.sh p3-interview-academy-staging`
**Decision Tree**:
- If staging environment healthy → Continue
- If issues found → Attempt automatic fix (restart, clear cache, etc.)
- If unfixable → Document, notify via Telegram if critical

**Success Criteria**: Staging environment healthy or issues documented

---

### Stage 5: Staging Deployment (1-2 hours)

**Objective**: Deploy to staging via GitHub Actions, monitor, validate

#### Task 5.1: Trigger Deployment
**Agent**: opencode-deploy-expert
**Method**:
- **Option A** (Preferred): Push commit from Stage 3 to branch (already done, triggers PR-based deployment)
- **Option B**: Manual GitHub Actions workflow dispatch (if Option A doesn't auto-trigger)

**Decision Tree**:
- If deployment triggers automatically → Monitor in Task 5.2
- If no automatic trigger → Use GitHub CLI: `gh workflow run deploy-eb-staging.yml --ref redesign/mvp-founder-design`
- If still no trigger → Notify via Telegram, provide manual steps

**Telegram Notification**: "Stage 5 started: Deployment triggered, monitoring GitHub Actions"

---

#### Task 5.2: Monitor Deployment
**Agent**: aws-deployment-specialist
**Monitoring**:
- GitHub Actions stages (Tests → Build → Deploy)
- CloudWatch logs (real-time)
- Health checks (every 30 sec)
- Telegram notifications (progress updates every 5 min)

**Decision Tree**:
- **Tests fail**: Check logs, if new test failures → Fix and redeploy, if existing issues → Document
- **Build fails**: STOP, notify via Telegram immediately (critical blocker)
- **Deploy fails**: Check logs, attempt rollback if needed, notify via Telegram
- **Health checks fail**: Investigate logs, check database connectivity, notify via Telegram
- **All succeed**: Continue to Task 5.3

**Auto-Notifications**: Send Telegram update at each stage completion

---

#### Task 5.3: Post-Deployment Smoke Tests
**Command**: `npx tsx deployment-scripts/smoke-tests.ts http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com`
**Decision Tree**:
- If all smoke tests pass → Continue to Stage 6
- If some tests fail → Investigate, categorize (critical vs non-critical)
  - **Critical failures** (health, database): STOP, notify via Telegram
  - **Non-critical failures** (specific API endpoints): Document, continue
- If smoke tests crash → Check staging logs, notify via Telegram

**Success Criteria**: Core functionality (health, database, auth) working in staging

**Telegram Notification**: "Stage 5 complete: Deployment successful, smoke tests: X/Y passing"

---

### Stage 6: Manual Testing Preparation (30 min)

**Objective**: Prepare comprehensive testing checklist for human UAT

#### Task 6.1: Create Testing Session Report
**File**: `docs/redesign/PHASE_6_TESTING_REPORT.md` (create)
**Agent**: gemini-research-specialist
**Content**:
1. **Deployment Summary**
   - Staging URL: `http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com`
   - HTTPS URL (if SSL complete): `https://p3app-staging.bizelev8.ai`
   - Deployment time and duration
   - GitHub Actions run ID

2. **Test Results Summary**
   - Integration tests: X/4 passing
   - API tests: X/203 passing (Y% pass rate)
   - Component tests: 58/118 passing (documented as acceptable)
   - Smoke tests: X/Y passing

3. **Manual Testing Checklist** (from STAGING_DEPLOYMENT_CHECKLIST.md)
   - [ ] New user signup and email verification
   - [ ] Login and dashboard access
   - [ ] Prepare: Learning Hub (11 modules)
   - [ ] Prepare: Resume Analyzer
   - [ ] Prepare: Self-Intro Wizard
   - [ ] Prepare: STAR Story Builder
   - [ ] Practice: Simulation Setup
   - [ ] Practice: Interview Session
   - [ ] Practice: AI Assessment
   - [ ] Perform: Dashboard and Analytics
   - [ ] Perform: Badge Gallery
   - [ ] Gamification: XP awards
   - [ ] Gamification: Badge progression
   - [ ] Gamification: Streak tracking
   - [ ] Gamification: Readiness score
   - [ ] Credits: Purchase flow
   - [ ] Referrals: Code generation and application
   - [ ] Support: Ticket creation
   - [ ] Feedback: Submission

4. **Known Issues**
   - List of documented test failures
   - SSL status (if pending)
   - Any deployment warnings

5. **Critical Questions for Human Review**
   - Any blockers encountered during execution
   - Any decisions that need approval
   - Any security concerns

**Decision Tree**:
- Always create this report, regardless of test results
- Include all relevant links and commands
- Make checklist actionable for human tester

---

#### Task 6.2: Update Master Plan
**File**: `docs/redesign/MASTER_PLAN.md`
**Actions**:
- Update Phase 6 checkboxes based on completion
- Update timeline if needed
- Add "Phase 6 Testing Complete" entry with date

**Decision Tree**:
- Update all completed checkboxes
- Leave incomplete items unchecked with notes
- Update status percentages

---

#### Task 6.3: Create Ops Log Entry
**File**: `docs/ops-log/2025-11.md`
**Section**: Add new entry under appropriate date
**Content**:
```markdown
### YYYY-MM-DD: Phase 6 Testing & Staging Deployment (Autonomous Execution)

**Executed By**: Claude Code (Autonomous)
**Duration**: X hours
**Status**: ✅ Staging Deployed | ⏳ UAT Pending

**Completed Tasks**:
- ✅ 4 integration tests created (practice flow, gamification, credits, referrals)
- ✅ API test failures addressed (86% → X% pass rate)
- ✅ Code review and security scan complete
- ✅ SSL setup: [STATUS]
- ✅ Staging deployment successful
- ✅ Smoke tests: X/Y passing

**Test Results**:
- Integration: X/4 passing
- API: X/203 passing (Y%)
- Component: 58/118 passing (deferred)
- Smoke: X/Y passing

**Known Issues**:
- [List any documented issues]

**Next Steps**:
- Manual UAT testing (human required)
- Review PHASE_6_TESTING_REPORT.md
- Address any critical issues found
- Prepare for Phase 7 (Production Deployment)

**Links**:
- Staging URL: http://...
- GitHub Actions: [run ID]
- Testing Report: docs/redesign/PHASE_6_TESTING_REPORT.md
```

---

#### Task 6.4: Send End-of-Session Summary
**Method**: Telegram notification + Chat message
**Telegram**: `./scripts/telegram/core/notify.sh "Phase 6 autonomous execution complete. See PHASE_6_TESTING_REPORT.md for details and UAT checklist."`
**Chat Message**: Comprehensive summary with:
- What was completed
- Test results
- Deployment status
- Known issues
- Critical questions (if any)
- Next steps for human
- Links to all reports

**Telegram Notification**: "Phase 6 complete: Autonomous execution finished. Ready for UAT."

---

## 🚨 Critical Blocker Protocol

**When to Interrupt Human via Telegram**:

1. **Build Failure** - `npm run build` fails (blocks deployment)
   - **Telegram**: "🚨 CRITICAL: Build failed. Error: [details]. Execution paused."
   - **Action**: Pause execution, wait for human input

2. **Schema Change Required** - Test fix needs database migration
   - **Telegram**: "🚨 CRITICAL: Test fix requires schema change. Manual review needed."
   - **Action**: Document issue, continue with other tasks, wait for end-of-session review

3. **Deployment Failure** - GitHub Actions deployment fails
   - **Telegram**: "🚨 CRITICAL: Staging deployment failed. Error: [details]. Checking logs..."
   - **Action**: Attempt automatic diagnosis, provide logs, wait for human input if can't resolve

4. **DNS Access Needed** - SSL setup requires Cloudflare credentials
   - **Telegram**: "⚠️ BLOCKER: Need Cloudflare DNS access to complete SSL. CNAME details: [details]. Continuing without SSL for now."
   - **Action**: Continue with HTTP deployment, document SSL as pending

5. **Security Issue** - Secrets found in code or git history
   - **Telegram**: "🚨 SECURITY: Secrets detected: [type]. Removed from code. Check git history."
   - **Action**: Remove secrets, document for credential rotation

**Telegram Message Format**:
```
🚨 [CRITICAL/BLOCKER/SECURITY]: [Brief description]

Details: [Full details]
Impact: [What this blocks]
Action Needed: [What human should do]
Current Status: [Paused/Continuing]

Reply to this message with instructions.
```

---

## 📊 Progress Tracking

**Claude Code will maintain TodoWrite list**:

```
Stage 1: Integration Tests
  ├─ ✅ Practice user journey test
  ├─ ✅ Gamification triggers test
  ├─ ✅ Credit purchase E2E test
  ├─ ✅ Referral flow E2E test
  └─ ✅ Run all tests

Stage 2: Fix API Test Failures
  ├─ ✅ Analyze failures
  ├─ ✅ Fix critical failures
  └─ ✅ Document non-critical failures

Stage 3: Code Review
  ├─ ✅ Security scan
  ├─ ✅ Repository housekeeping
  └─ ✅ Commit and push

Stage 4: SSL Setup
  ├─ ⏳ Add DNS CNAME record (blocked - need access)
  ├─ ⏳ Wait for validation
  └─ ⏳ Configure HTTPS listener

Stage 5: Staging Deployment
  ├─ ✅ Trigger deployment
  ├─ ✅ Monitor deployment
  └─ ✅ Run smoke tests

Stage 6: Documentation
  ├─ ✅ Create testing report
  ├─ ✅ Update master plan
  ├─ ✅ Create ops log entry
  └─ ✅ Send end-of-session summary
```

**Telegram Updates**: Send progress update every stage completion (6 total notifications + any blockers)

---

## 🎯 Success Criteria

**Phase 6 considered successful if**:
- ✅ 4 integration tests created and passing (or failures documented)
- ✅ API test pass rate >90% (or remaining failures documented as acceptable)
- ✅ Clean security scan (no secrets)
- ✅ Staging deployment successful
- ✅ Smoke tests passing (or critical issues documented)
- ✅ SSL setup complete OR documented as pending
- ✅ Comprehensive testing report created for human UAT
- ✅ All documentation updated

**Acceptable Outcomes**:
- Some tests may still fail if documented as non-critical
- SSL may be pending if DNS access is blocked
- Some smoke tests may fail if documented and categorized

**Unacceptable Outcomes** (require human intervention):
- Build failure blocking deployment
- Security issues unresolved
- Staging deployment failed with no diagnosis
- Critical smoke tests failing (health, database, auth)

---

## 🔄 Fallback Strategies

### If Integration Tests Take Too Long (>4 hours)
- **Action**: Complete 2 tests (Practice flow + Gamification), defer other 2 to post-deployment
- **Reason**: Better to deploy and test manually than block on test writing

### If API Test Fixes Are Extensive (>3 hours)
- **Action**: Fix only authentication/critical issues, document rest as post-deployment
- **Reason**: 86% pass rate is acceptable for staging deployment

### If Staging Deployment Fails
- **Action**:
  1. Check logs for obvious errors (typos, missing env vars)
  2. Attempt one retry with fixes
  3. If still failing, notify via Telegram, provide full diagnostics
  4. Do not attempt >2 deployments without human input

### If SSL Setup Is Blocked
- **Action**: Continue with HTTP deployment, document SSL as pending
- **Reason**: SSL is nice-to-have for staging, not critical for testing

### If Smoke Tests Reveal Critical Issues
- **Action**:
  1. Categorize issues (blocking vs non-blocking)
  2. If blocking (health/database/auth) → Notify via Telegram
  3. If non-blocking (specific features) → Document for UAT
  4. Do not attempt fixes without human approval (avoid breaking things further)

---

## 📝 End-of-Session Deliverables

**Claude Code will provide**:

1. **PHASE_6_TESTING_REPORT.md** - Comprehensive testing report with UAT checklist
2. **TEST_STATUS.md** - Current test status with pass/fail breakdown
3. **Updated MASTER_PLAN.md** - Phase 6 progress updated
4. **Updated ops-log/2025-11.md** - Execution summary logged
5. **Staged changes committed and pushed** - All work saved to git

**Human will receive**:
1. Telegram notification: "Phase 6 complete"
2. Chat summary with links to all reports
3. Clear next steps for UAT
4. Any critical questions that need answers

---

## 🚀 Execution Command

**To start autonomous execution, human should say**:
- "Execute Phase 6 plan autonomously"
- "Start Phase 6 with minimal supervision"
- "Run the autonomous execution plan"

**Claude Code will**:
1. Confirm execution start
2. Enable Telegram notifications
3. Create TodoWrite list
4. Execute all stages sequentially
5. Send progress updates via Telegram
6. Interrupt only for critical blockers
7. Provide end-of-session summary

**Estimated Duration**: 6-8 hours total
- Stage 1: 2-3 hours
- Stage 2: 2-3 hours
- Stage 3: 30 min
- Stage 4: 1 hour
- Stage 5: 1-2 hours
- Stage 6: 30 min

---

**End of Plan**

*This plan is designed for autonomous execution with minimal human supervision. Claude Code has full authority to make technical decisions within the scope of this plan. Human input is only required for critical blockers or end-of-session review.*
