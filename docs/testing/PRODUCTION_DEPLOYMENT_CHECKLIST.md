# Production Deployment Checklist - PR #6

**Feature**: Model Answer Integration with 9-Criteria Scoring
**Date**: 2025-10-09
**Staging Test Results**: 97.1% passing (34/35 tests)
**Deployment Type**: Database migration + code deployment

---

## ⏰ Estimated Timeline

- Pre-deployment tasks: ~30 minutes
- Database migration: ~5 minutes
- Code deployment: ~10 minutes
- Post-deployment validation: ~20 minutes
- **Total**: ~65 minutes

**Recommended Deployment Window**: Low-traffic period (e.g., 2:00 AM - 4:00 AM local time)

---

## 📋 Pre-Deployment Checklist (30 min before deployment)

### Database Preparation
- [ ] **1.1** Connect to production database
  ```bash
  psql "postgresql://app_user:[REDACTED]@p3interviewacademy.cnecks4s8kqj.ap-southeast-1.rds.amazonaws.com:5432/postgres"
  ```

- [ ] **1.2** Create database backup
  ```bash
  pg_dump "postgresql://app_user:[REDACTED]@p3interviewacademy.cnecks4s8kqj.ap-southeast-1.rds.amazonaws.com:5432/postgres" > backup-before-9-criteria-$(date +%Y%m%d-%H%M).sql
  ```
  **Verify**: Backup file created and size > 0 bytes

- [ ] **1.3** Verify current schema (should NOT have 9-criteria columns yet)
  ```sql
  SELECT column_name FROM information_schema.columns
  WHERE table_name = 'ai_prepare_responses'
    AND column_name LIKE '%score%';
  ```
  **Expected**: Only `relevance_score`, `communication_score`, `completeness_score`

### Environment Verification
- [ ] **2.1** Check production environment health
  ```bash
  curl http://p3-interview-academy-prod-v2.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/api/health
  ```
  **Expected**: `{"status":"healthy"}`

- [ ] **2.2** Verify AWS credentials configured
  ```bash
  aws sts get-caller-identity
  ```
  **Expected**: Shows your AWS account ID

- [ ] **2.3** Verify GitHub CLI authenticated
  ```bash
  gh auth status
  ```
  **Expected**: Shows logged in status

### Code Preparation
- [ ] **3.1** Verify PR #6 is ready to merge
  ```bash
  gh pr view 6 --json state,statusCheckRollup
  ```
  **Expected**: State=OPEN, all checks passing

- [ ] **3.2** Confirm latest commit on PR branch
  ```bash
  gh pr view 6 --json headRefOid
  ```
  **Expected**: Commit hash `7f88d4f0` or later

### Google Sheets Access
- [ ] **4.1** Test CSV URL accessibility from production network
  ```bash
  curl -I "https://docs.google.com/spreadsheets/d/e/2PACX-1vQlowLLYOvBywNMirisORd1rDOcNVsCzF61nUa5sty2y7EXF_ix8XhvaEe5vx5llYPaIYGnQPvcC8o_/pub?output=csv"
  ```
  **Expected**: HTTP 200 response

- [ ] **4.2** Verify CSV contains model answers
  ```bash
  curl "https://docs.google.com/spreadsheets/d/e/2PACX-1vQlowLLYOvBywNMirisORd1rDOcNVsCzF61nUa5sty2y7EXF_ix8XhvaEe5vx5llYPaIYGnQPvcC8o_/pub?output=csv" | head -5
  ```
  **Expected**: CSV data with questions and model answers visible

### Team Notification
- [ ] **5.1** Notify team of upcoming deployment (Slack/Email)
- [ ] **5.2** Confirm on-call engineer availability during deployment
- [ ] **5.3** Prepare rollback team (if needed)

---

## 🚀 Deployment Phase 1: Database Migration (5 min)

### Migration Execution
- [ ] **6.1** Run migration script
  ```bash
  psql "postgresql://app_user:[REDACTED]@p3interviewacademy.cnecks4s8kqj.ap-southeast-1.rds.amazonaws.com:5432/postgres" < deployment-scripts/migrate-9-criteria-columns.sql
  ```

- [ ] **6.2** Verify migration success
  ```sql
  SELECT column_name, data_type
  FROM information_schema.columns
  WHERE table_name = 'ai_prepare_responses'
    AND column_name IN (
      'star_structure_score',
      'specific_evidence_score',
      'role_alignment_score',
      'outcome_oriented_score',
      'problem_solving_score',
      'cultural_fit_score',
      'learning_agility_score',
      'weighted_overall_score',
      'overall_rating'
    );
  ```
  **Expected**: 9 rows showing all new columns

- [ ] **6.3** Verify indexes created
  ```sql
  SELECT indexname FROM pg_indexes
  WHERE tablename = 'ai_prepare_responses'
    AND indexname IN ('idx_weighted_overall_score', 'idx_overall_rating');
  ```
  **Expected**: 2 rows

- [ ] **6.4** Test query performance
  ```sql
  EXPLAIN ANALYZE SELECT * FROM ai_prepare_responses LIMIT 1;
  ```
  **Expected**: Query completes in < 50ms

---

## 🚀 Deployment Phase 2: Code Deployment (10 min)

### Merge and Deploy
- [ ] **7.1** Merge PR #6 to main
  ```bash
  gh pr merge 6 --squash --delete-branch
  ```

- [ ] **7.2** Monitor GitHub Actions workflow
  ```bash
  gh run watch
  ```
  **Expected**: Workflow completes successfully

- [ ] **7.3** Wait for Elastic Beanstalk deployment
  ```bash
  aws elasticbeanstalk describe-environments \
    --environment-names p3-interview-academy-prod-v2 \
    --region ap-southeast-1 \
    --query 'Environments[0].[Status,Health]'
  ```
  **Expected**: ["Ready", "Green"]

- [ ] **7.4** Note deployment timestamp
  - **Time**: _________________ (for rollback reference)

---

## ✅ Deployment Phase 3: Post-Deployment Validation (20 min)

### Health Checks
- [ ] **8.1** Verify health endpoint (should show recent restart)
  ```bash
  curl http://p3-interview-academy-prod-v2.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/api/health | jq '.uptime'
  ```
  **Expected**: Uptime < 300 seconds

- [ ] **8.2** Check server logs for startup errors
  ```bash
  aws logs tail /aws/elasticbeanstalk/p3-interview-academy-prod-v2/var/log/nodejs/nodejs.log \
    --since 5m --follow
  ```
  **Expected**: No error messages, CSV loaded successfully

### Smoke Tests
- [ ] **9.1** Run automated smoke tests
  ```bash
  node testing-scripts/test-production-smoke.js
  ```
  **Expected**: All critical tests pass (>90% success rate)

- [ ] **9.2** Manual UI test - Create session
  1. Navigate to production URL in browser
  2. Create account / login
  3. Create "Prepare" session (phone-screening stage)
  4. Generate question
  - [ ] Question displays correctly
  - [ ] CSV question number shown (if applicable)

- [ ] **9.3** Manual UI test - Submit response
  1. Submit test response to question
  2. Wait for evaluation (should complete in < 10 seconds)
  - [ ] Model answer appears in feedback
  - [ ] 9-criteria scores visible
  - [ ] Feedback has ≤15 bullet points
  - [ ] Weighted score and rating displayed

- [ ] **9.4** Test all 3 stages
  - [ ] phone-screening: Questions Q#1-25
  - [ ] hiring-manager: Questions Q#51-75
  - [ ] executive-leadership: Questions Q#101-125

### Database Validation
- [ ] **10.1** Verify new responses contain 9-criteria scores
  ```sql
  SELECT
    weighted_overall_score,
    overall_rating,
    star_structure_score,
    model_answer IS NOT NULL as has_model_answer
  FROM ai_prepare_responses
  WHERE created_at > NOW() - INTERVAL '10 minutes'
  LIMIT 5;
  ```
  **Expected**: All new responses have scores and model answers

- [ ] **10.2** Check for errors in responses
  ```sql
  SELECT COUNT(*) FROM ai_prepare_responses
  WHERE created_at > NOW() - INTERVAL '10 minutes'
    AND weighted_overall_score IS NULL;
  ```
  **Expected**: 0 rows (all responses should have scores)

### Performance Monitoring
- [ ] **11.1** Monitor API response times
  ```bash
  # Check CloudWatch metrics or application logs
  aws cloudwatch get-metric-statistics \
    --namespace AWS/ElasticBeanstalk \
    --metric-name ApplicationLatencyP95 \
    --dimensions Name=EnvironmentName,Value=p3-interview-academy-prod-v2 \
    --start-time $(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%S) \
    --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
    --period 300 \
    --statistics Average
  ```
  **Expected**: P95 latency < 5 seconds

- [ ] **11.2** Check error rates
  ```bash
  aws logs filter-pattern "ERROR" \
    --log-group-name /aws/elasticbeanstalk/p3-interview-academy-prod-v2/var/log/nodejs/nodejs.log \
    --start-time $(date -u -d '10 minutes ago' +%s)000
  ```
  **Expected**: No critical errors related to 9-criteria or model answers

- [ ] **11.3** Monitor database connection pool
  ```sql
  SELECT count(*) as active_connections
  FROM pg_stat_activity
  WHERE datname = 'postgres' AND state = 'active';
  ```
  **Expected**: < 20 active connections

---

## 📊 Success Criteria

Deployment is **SUCCESSFUL** if ALL of the following are true:

- [x] Database migration completed without errors
- [x] GitHub Actions workflow completed successfully
- [x] EB environment status: Ready + Green
- [x] Health endpoint returns 200 OK
- [x] Smoke tests pass with >90% success rate
- [x] Manual UI tests: model answers display correctly
- [x] Manual UI tests: 9-criteria scores visible
- [x] No critical errors in logs (past 10 minutes)
- [x] API response times < 5 seconds
- [x] Database queries complete in < 100ms

**If ANY criterion fails**: Proceed to Rollback section below

---

## 🔄 Rollback Procedure (If Issues Detected)

### When to Rollback
- Critical functionality broken (cannot create sessions/questions)
- Error rate > 10% in past 10 minutes
- Database corruption or data loss detected
- Performance degradation > 50% (response times > 10s)

### Rollback Steps

- [ ] **R1** Identify previous EB application version
  ```bash
  aws elasticbeanstalk describe-application-versions \
    --application-name p3-interview-academy \
    --region ap-southeast-1 \
    --query 'ApplicationVersions[*].[VersionLabel,DateCreated]' \
    --output table
  ```

- [ ] **R2** Revert to previous version
  ```bash
  aws elasticbeanstalk update-environment \
    --environment-name p3-interview-academy-prod-v2 \
    --version-label [PREVIOUS_VERSION_LABEL]
  ```

- [ ] **R3** Wait for rollback to complete (5-10 minutes)
  ```bash
  watch -n 10 'aws elasticbeanstalk describe-environments \
    --environment-names p3-interview-academy-prod-v2 \
    --query "Environments[0].Status"'
  ```
  **Wait for**: Status = "Ready"

- [ ] **R4** Verify health after rollback
  ```bash
  curl http://p3-interview-academy-prod-v2.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/api/health
  ```

- [ ] **R5** Decision: Rollback database?
  - **If NO data corruption**: Leave 9-criteria columns (they won't be used by old code)
  - **If data corruption detected**: Restore from backup
    ```bash
    psql "postgresql://[prod-connection-string]" < backup-before-9-criteria-[timestamp].sql
    ```

- [ ] **R6** Notify team of rollback and reason
- [ ] **R7** Schedule post-mortem to identify root cause

---

## 📝 Post-Deployment Actions

### Immediate (Day 0)
- [ ] **P1** Update deployment log with results
- [ ] **P2** Monitor error rates for next 2 hours
- [ ] **P3** Notify team of successful deployment
- [ ] **P4** Update PR #6 with deployment timestamp

### Short-term (Week 1)
- [ ] **P5** Review user feedback on model answers
- [ ] **P6** Analyze CSV distribution metrics (should converge to ~80%)
- [ ] **P7** Monitor 9-criteria score distribution
- [ ] **P8** Check for any performance regressions

### Medium-term (Month 1)
- [ ] **P9** Comprehensive retrospective meeting
- [ ] **P10** A/B test analysis (with vs without model answers)
- [ ] **P11** Plan optimizations based on production data
- [ ] **P12** Update documentation with lessons learned

---

## 🎯 Deployment Sign-off

- [ ] **Pre-deployment checklist**: 100% complete
- [ ] **Database migration**: Successful
- [ ] **Code deployment**: Successful
- [ ] **Post-deployment validation**: All tests passing
- [ ] **Success criteria**: All requirements met

**Deployment Lead**: ___________________________
**Sign-off Date/Time**: ________________________
**Deployment Status**: ☐ SUCCESS  ☐ ROLLBACK  ☐ PARTIAL

---

## 📞 Emergency Contacts

**Production Issues**:
- Deployment engineer on-call: [Contact Info]
- Database administrator: [Contact Info]
- AWS account owner: [Contact Info]

**Escalation**:
1. Check this checklist for troubleshooting steps
2. Review `STAGING_TO_PRODUCTION_GUIDE.md` for detailed issue resolution
3. Contact on-call engineer
4. Execute rollback if issue is critical

---

**Document Version**: 1.0
**Last Updated**: 2025-10-09
**Related Documents**:
- `MD_Documentations/Testing/STAGING_TO_PRODUCTION_GUIDE.md` - Detailed technical guide
- `deployment-scripts/migrate-9-criteria-columns.sql` - Migration script
- `testing-scripts/test-production-smoke.js` - Automated smoke tests
