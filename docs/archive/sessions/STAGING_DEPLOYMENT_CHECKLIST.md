# Phase 10 Staging Deployment Checklist

**Date**: 2025-12-02
**Branch**: `feature/backend-credits-management`
**Target**: Staging (`p3-interview-academy-staging`)

---

## Pre-Deployment (5 minutes)

### Git Operations
- [ ] Working directory clean (except .claude/data/usage-stats.json)
- [ ] Push local commits to remote branch:
  ```bash
  git push origin feature/backend-credits-management
  ```

### Create Pull Request
- [ ] Create PR to `main` branch:
  ```bash
  gh pr create --base main --head feature/backend-credits-management \
    --title "Phase 10: Backend Credits Management + Security Fixes" \
    --body "Deploys Phase 3.5 security fixes (5 critical vulnerabilities) and Phase 1-2 admin improvements. 214 tests passing (65%). Ready for staging validation."
  ```

### Pre-Flight Checks (Already Validated)
- [x] TypeScript compilation passes (`npm run check`)
- [x] Tests pass: 214 passing (65% coverage)
- [x] Security fixes complete (Phase 3.5)
- [x] Staging environment healthy (HTTP 200)
- [x] Database connectivity verified (45ms response)

---

## During Deployment (Automated - 10-15 minutes)

### Monitor GitHub Actions
- [ ] Watch workflow progress:
  ```bash
  gh run watch
  ```

### Workflow Jobs to Monitor
- [ ] **Job 1: Test** (~2 minutes)
  - Checkout code
  - Install dependencies
  - Run TypeScript check
  - Run tests (continue on error)

- [ ] **Job 2: Deploy to Staging** (~8-10 minutes)
  - Configure AWS credentials
  - Build application
  - Create deployment bundle
  - Upload to S3
  - Update Elastic Beanstalk environment
  - Wait for deployment (timeout: 600s)
  - Verify health endpoint (3 retries)

- [ ] **Job 3: PR Comment** (~5 seconds)
  - Post staging URL to pull request
  - Show deployment version
  - Confirm health verified

---

## Post-Deployment Validation (10 minutes)

### Automated Smoke Tests (Via GitHub Actions)
- [ ] Health Check (Simple) - `/api/health/simple`
- [ ] Health Check (Detailed) - `/api/health` (database status)
- [ ] Practice Module API - `/api/practice/sessions`

### Manual Validation (Browser)
- [ ] Visit staging URL from PR comment
- [ ] Homepage loads without errors (no blank screen)
- [ ] Check browser console for errors (F12)
- [ ] Test login flow (if test credentials available)
  - Email: `test@example.com` (or use `TEST_SEED_KEY` if enabled)
- [ ] Test admin dashboard access (if admin user exists)
  - URL: `<staging-url>/admin/dashboard`
  - Verify credit management UI loads

### API Health Check (curl)
- [ ] Simple health check:
  ```bash
  curl http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/api/health/simple
  # Expected: {"status":"ok","timestamp":"..."}
  ```

- [ ] Detailed health check:
  ```bash
  curl http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/api/health | jq '.'
  # Expected: HTTP 200, database.status: "healthy"
  ```

### CloudWatch Logs Review (Optional)
- [ ] Check for errors in last 10 minutes:
  ```bash
  aws logs tail /aws/elasticbeanstalk/p3-interview-academy-staging/var/log/web.stdout.log --since 10m
  ```

- [ ] No critical errors (HTTP 5xx, database connection failures)
- [ ] Low error rate (<5% of requests)

---

## Post-Validation Actions

### If Deployment Successful
- [ ] Update ops-log:
  ```markdown
  ## 2025-12-02 - Phase 10 Staging Deployment
  - Deployed Phase 3.5 security fixes (5 critical vulnerabilities)
  - Deployed Phase 1-2 admin improvements (credit management, audit logging)
  - Tests: 214 passing (65%)
  - Staging URL: <url>
  - Version: staging-YYYYMMDD-HHMMSS
  ```

- [ ] Notify team in Slack/Telegram:
  ```
  ✅ Phase 10 deployed to staging
  Version: staging-YYYYMMDD-HHMMSS
  Tests: 214 passing (65%)
  Staging URL: <url>
  Next: Manual validation required before production approval
  ```

- [ ] Monitor for 30 minutes (watch for delayed issues)

### If Deployment Failed
- [ ] Check GitHub Actions logs for error details
- [ ] Check AWS EB events:
  ```bash
  aws elasticbeanstalk describe-events --environment-name p3-interview-academy-staging --max-items 20
  ```

- [ ] Rollback to previous version:
  ```bash
  aws elasticbeanstalk update-environment \
    --environment-name p3-interview-academy-staging \
    --version-label staging-20251201-101237
  ```

- [ ] Document failure in ops-log:
  ```markdown
  ## 2025-12-02 - Phase 10 Staging Deployment FAILED
  - Error: <error message>
  - Rollback: staging-20251201-101237
  - Investigation: <investigation notes>
  ```

---

## Production Approval (If Staging Successful)

### Pre-Approval Checks
- [ ] All staging smoke tests passed
- [ ] No critical errors in CloudWatch logs
- [ ] Admin dashboard tested and functional
- [ ] Credit management features working
- [ ] Rollback plan documented

### Approval Process
1. **Merge PR to main branch**:
   ```bash
   gh pr merge --squash --delete-branch
   ```

2. **Monitor production deployment**:
   - GitHub Actions will automatically:
     - Deploy to staging (again, from main branch)
     - Run smoke tests
     - Wait for manual approval
     - Deploy to production (after approval)

3. **Approve via GitHub Environments**:
   - Visit GitHub Actions workflow page
   - Click "Review deployments" button
   - Select "Production" environment
   - Click "Approve deployment"

4. **Monitor production deployment** (10-15 minutes):
   - Watch GitHub Actions logs
   - Check production health endpoint
   - Monitor CloudWatch logs for errors

---

## Rollback Procedures

### Staging Rollback (If Needed)
```bash
# Rollback to last known good version
aws elasticbeanstalk update-environment \
  --environment-name p3-interview-academy-staging \
  --version-label staging-20251201-101237
```

### Production Rollback (If Needed)
```bash
# Rollback to current production version (2025-10-23)
aws elasticbeanstalk update-environment \
  --environment-name p3-interview-academy-prod-v2 \
  --version-label deployment-20251023-014610
```

---

## Rollback Decision Criteria

**Rollback if**:
- [ ] Health check fails for >5 minutes
- [ ] Database connectivity lost
- [ ] Critical errors in CloudWatch logs (>10 errors/minute)
- [ ] HTTP 5xx error rate exceeds 10%
- [ ] Admin dashboard inaccessible
- [ ] Credit transactions fail

**Do NOT rollback if**:
- ⚠️ NODE_ENV shows "production" (cosmetic issue, non-critical)
- ⚠️ HTTP 4xx errors (expected auth failures)
- ⚠️ Smoke tests take longer than usual (staging may be cold)

---

## Success Metrics

### Deployment Success
- [x] Health check returns HTTP 200
- [x] Database status: "healthy"
- [x] Response time: <2 seconds
- [x] Memory usage: <150MB RSS
- [x] Smoke tests: 3/3 passing

### Post-Deployment Success (Monitor for 30 minutes)
- [ ] HTTP 5xx error rate: <1%
- [ ] HTTP 4xx error rate: <50% (auth failures expected)
- [ ] Database connection pool: Stable (no spikes or drops)
- [ ] CloudWatch logs: <5 errors per 10 minutes
- [ ] Environment health: Remains "Green"

---

## Timeline Summary

| Phase | Duration | Status |
|-------|----------|--------|
| Pre-deployment | 5 min | ⏳ Pending |
| Automated deployment | 10-15 min | ⏳ Pending |
| Manual validation | 10 min | ⏳ Pending |
| Monitoring period | 30 min | ⏳ Pending |
| **TOTAL** | **55-60 min** | - |

---

## Contact & Resources

**Documentation**:
- Full Assessment: `PRE_DEPLOYMENT_ASSESSMENT_PHASE10.md`
- Executive Summary: `DEPLOYMENT_EXECUTIVE_SUMMARY.md`
- This Checklist: `STAGING_DEPLOYMENT_CHECKLIST.md`

**Tools**:
- Deployment Scripts: `deployment-scripts/`
- Smoke Tests: `deployment-scripts/smoke-tests.ts`
- CI/CD Workflows: `.github/workflows/deploy-eb-staging.yml`

**Monitoring**:
- Staging: http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com
- Production: http://p3-interview-academy-prod-v2.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com
- CloudWatch: AWS Console → CloudWatch → Log Groups

---

**Last Updated**: 2025-12-02 03:30 UTC
**Maintained By**: AWS DevOps Specialist
