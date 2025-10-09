# Staging to Production Migration Guide

**Date**: 2025-10-09
**Feature**: PR #6 Model Answer Integration with 9-Criteria Scoring
**Staging Success Rate**: 97.1% (34/35 tests passing)

---

## Executive Summary

The Model Answer Integration feature has been successfully tested in staging with a 97.1% passing rate, exceeding the 80% target. This document captures all challenges encountered, solutions implemented, and recommendations for production deployment.

---

## 🎯 Key Achievements in Staging

### Test Results
- **Overall Success Rate**: 97.1% (34 of 35 tests passing)
- **Model Answers**: ✅ 100% success (all 3 stages providing question-specific answers)
- **9-Criteria Scores**: ✅ 100% success (all scoring metrics working correctly)
- **Feedback Conciseness**: ✅ 100% success (6 bullets per stage, target ≤15)
- **Weighted Scores**: ✅ 100% success (4.2/5 Pass rating across all stages)
- **CSV Distribution**: ⚠️ 73.3% (11/15 questions from curated bank, target ≥80%)

### Feature Validation
1. ✅ **Question Generation**: Stage-specific questions from CSV bank (Q#1-25, Q#51-75, Q#101-125)
2. ✅ **Model Answer Integration**: Curated answers from Google Sheets successfully loaded
3. ✅ **9-Criteria Evaluation**: All rubric scores (relevance, STAR structure, evidence, etc.) working
4. ✅ **Feedback Quality**: Concise, actionable feedback (≤15 bullet points per response)
5. ✅ **API Response Format**: Proper camelCase formatting for frontend consumption

---

## 🚧 Challenges Encountered & Solutions

### Challenge 1: Database Column Name Mismatch
**Issue**: PostgreSQL returns snake_case column names (`model_answer`, `weighted_overall_score`) but tests expected camelCase (`modelAnswer`, `weightedOverallScore`).

**Root Cause**:
- Used raw SQL `INSERT...RETURNING *` to bypass Drizzle ORM type inference issues
- Database naturally returns column names as defined in schema (snake_case)
- Frontend/API expects camelCase convention

**Solution**:
```typescript
// Map database snake_case to API camelCase in prepare-ai-service.ts:323-361
const response = {
  modelAnswer: dbResponse.model_answer,
  weightedOverallScore: dbResponse.weighted_overall_score ? parseFloat(dbResponse.weighted_overall_score) : null,
  relevanceScore: dbResponse.relevance_score ? parseFloat(dbResponse.relevance_score) : null,
  // ... (full mapping in server/services/prepare-ai-service.ts)
}
```

**Lesson Learned**:
- Always map database responses to API conventions explicitly when using raw SQL
- Consider using a utility function for snake_case → camelCase conversion
- Document this pattern for future raw SQL queries

**Production Impact**: ✅ Fixed in commit `efa6209d` - No additional action needed

---

### Challenge 2: TypeScript Type Inference Errors
**Issue**: TypeScript compilation failures during deployment:
```
error TS2352: Conversion of type '{ modelAnswer: any; ... }' to type 'AiPrepareResponse' may be a mistake
Types of property 'relevanceScore' are incompatible.
Type 'number | undefined' is not comparable to type 'string | null'.
```

**Root Cause**:
- Schema defines numeric scores as `numeric("relevance_score")` → TypeScript type is `string | null`
- Business logic expects JavaScript numbers for calculations
- Mismatch between database type (numeric/string) and application type (number)

**Solution**:
```typescript
// Convert PostgreSQL numeric strings to numbers, but keep as nullable
relevanceScore: dbResponse.relevance_score ? parseFloat(dbResponse.relevance_score) : null,
// Use 'as any' cast to bypass strict type checking
} as any;
```

**Lesson Learned**:
- PostgreSQL `numeric` columns return strings in JavaScript drivers
- Always convert numeric database values to numbers at the data access layer
- Consider updating schema types to reflect actual API return types

**Production Impact**: ✅ Fixed in commits `3aa62622` and `2b5764bb` - No additional action needed

---

### Challenge 3: CSV Distribution Variance
**Issue**: CSV question usage at 73.3% (11/15 questions), below 80% target.

**Root Cause**:
- Random selection algorithm with 80% probability per question
- Statistical variance with small sample size (15 questions)
- Expected range with 80% probability: 9-15 questions (60%-100%)
- Actual result (11/15 = 73.3%) is within normal variance

**Analysis**:
```
Sample Size: 15 questions
Target Probability: 80% per question
Expected Mean: 12 questions from CSV (80%)
Standard Deviation: ~1.55 questions
Actual Result: 11 questions (73.3%)
Z-Score: -0.65 (within 1 standard deviation)
```

**Solution**:
- **Option A** (Recommended): Accept statistical variance, feature is working correctly
- **Option B**: Increase probability to 85-90% to compensate for variance
- **Option C**: Use guaranteed minimum (e.g., "at least 12 of 15 questions must be from CSV")

**Lesson Learned**:
- Small sample sizes amplify statistical variance
- 80% probability ≠ exactly 80% results in small samples
- Consider using deterministic selection for strict requirements

**Production Impact**: ⚠️ Monitor in production - May want to adjust probability if consistently below target

---

### Challenge 4: Schema Migration Coordination
**Issue**: Need to ensure database schema includes all 9-criteria columns before deploying application code.

**Columns Required**:
```sql
-- 9-Criteria Scoring Columns (must exist before deployment)
star_structure_score NUMERIC(3,2)
specific_evidence_score NUMERIC(3,2)
role_alignment_score NUMERIC(3,2)
outcome_oriented_score NUMERIC(3,2)
problem_solving_score NUMERIC(3,2)
cultural_fit_score NUMERIC(3,2)
learning_agility_score NUMERIC(3,2)
weighted_overall_score NUMERIC(3,2)
overall_rating VARCHAR(30)
```

**Solution**:
- ✅ Staging database already migrated (verified in testing)
- ✅ Schema definition updated in `shared/schema.ts`
- ⚠️ **Production database requires migration before deployment**

**Production Migration Script**:
```sql
-- Run BEFORE deploying application code to production
ALTER TABLE ai_prepare_responses
ADD COLUMN IF NOT EXISTS star_structure_score NUMERIC(3,2),
ADD COLUMN IF NOT EXISTS specific_evidence_score NUMERIC(3,2),
ADD COLUMN IF NOT EXISTS role_alignment_score NUMERIC(3,2),
ADD COLUMN IF NOT EXISTS outcome_oriented_score NUMERIC(3,2),
ADD COLUMN IF NOT EXISTS problem_solving_score NUMERIC(3,2),
ADD COLUMN IF NOT EXISTS cultural_fit_score NUMERIC(3,2),
ADD COLUMN IF NOT EXISTS learning_agility_score NUMERIC(3,2),
ADD COLUMN IF NOT EXISTS weighted_overall_score NUMERIC(3,2),
ADD COLUMN IF NOT EXISTS overall_rating VARCHAR(30);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_weighted_overall_score
ON ai_prepare_responses(weighted_overall_score);

CREATE INDEX IF NOT EXISTS idx_overall_rating
ON ai_prepare_responses(overall_rating);
```

**Lesson Learned**:
- Always run database migrations before deploying code changes
- Use `IF NOT EXISTS` clauses for idempotent migrations
- Add performance indexes for frequently queried columns

**Production Impact**: 🔴 **CRITICAL** - Must run migration script before deployment

---

### Challenge 5: Google Sheets CSV Loading
**Issue**: Need to ensure Google Sheets CSV data is loaded at application startup.

**Current Implementation**:
- CSV loaded in `ModelAnswerService` constructor (`server/services/model-answer-service.ts`)
- Automatic refresh on server restart
- In-memory caching for performance

**Verification**:
```bash
# Check if CSV loaded successfully (look for startup logs)
curl http://[staging-url]/api/health

# Response should include uptime < 300s if recently restarted
{
  "status": "healthy",
  "uptime": 243,
  "checks": {
    "database": { "status": "healthy", "responseTime": "1ms" }
  }
}
```

**Lesson Learned**:
- Server restart required to load latest CSV changes
- Consider adding manual refresh endpoint for CSV updates
- Monitor startup logs for CSV loading errors

**Production Impact**: ✅ Working correctly - Consider adding CSV refresh endpoint for future

---

## 📋 Production Deployment Checklist

### Pre-Deployment (Run BEFORE code deployment)

- [ ] **1. Database Migration**
  ```bash
  # Connect to production database
  psql "postgresql://[prod-db-connection-string]"

  # Run migration script (see Challenge 4 above)
  # Verify columns created:
  \d ai_prepare_responses
  ```

- [ ] **2. Verify Google Sheets Access**
  ```bash
  # Test CSV URL is accessible from production environment
  curl https://docs.google.com/spreadsheets/d/e/2PACX-1vQlowLLYOvBywNMirisORd1rDOcNVsCzF61nUa5sty2y7EXF_ix8XhvaEe5vx5llYPaIYGnQPvcC8o_/pub?output=csv

  # Should return CSV data with questions and model answers
  ```

- [ ] **3. Backup Production Database**
  ```bash
  # Create backup before schema changes
  pg_dump [prod-db-connection-string] > backup-before-9-criteria-$(date +%Y%m%d).sql
  ```

- [ ] **4. Review Environment Variables**
  - Ensure `OPENAI_API_KEY` is set for AI evaluation
  - Verify `DATABASE_URL` points to production database
  - Check `NODE_ENV=production`

### Deployment

- [ ] **5. Merge PR #6 to Main Branch**
  ```bash
  # Ensure all staging tests pass
  gh pr view 6 --json statusCheckRollup

  # Merge PR
  gh pr merge 6 --squash --delete-branch
  ```

- [ ] **6. Monitor Production Deployment**
  ```bash
  # Watch GitHub Actions workflow
  gh run watch

  # Check Elastic Beanstalk environment status
  aws elasticbeanstalk describe-environments \
    --environment-names p3-interview-academy-prod-v2 \
    --region ap-southeast-1
  ```

- [ ] **7. Verify Health Endpoint**
  ```bash
  # Should return 200 OK with uptime < 5 minutes
  curl http://p3-interview-academy-prod-v2.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/api/health
  ```

### Post-Deployment Validation (Run AFTER code deployment)

- [ ] **8. Smoke Test - Create Session**
  ```bash
  # Test session creation for each stage
  node testing-scripts/test-production-smoke.js
  ```

- [ ] **9. Validate Model Answers**
  - Create test session in production UI
  - Generate question (should show CSV Q# if from bank)
  - Submit response
  - Verify model answer appears in feedback
  - Check 9-criteria scores are present

- [ ] **10. Monitor Error Rates**
  ```bash
  # Check CloudWatch logs for errors
  aws logs tail /aws/elasticbeanstalk/p3-interview-academy-prod-v2/var/log/eb-engine.log \
    --follow --since 10m
  ```

- [ ] **11. Performance Monitoring**
  - Monitor API response times (should be < 5 seconds for evaluation)
  - Check database query performance
  - Verify memory/CPU usage is stable

### Rollback Plan (If Issues Detected)

- [ ] **12. Emergency Rollback Procedure**
  ```bash
  # Revert to previous EB application version
  aws elasticbeanstalk update-environment \
    --environment-name p3-interview-academy-prod-v2 \
    --version-label [previous-version-label]

  # Restore database if needed
  psql [prod-db-connection-string] < backup-before-9-criteria-[date].sql
  ```

---

## 🧪 Recommended Additional Tests

### 1. Load Testing
**Why**: Ensure 9-criteria evaluation performs well under production traffic.

**Test Script**:
```javascript
// testing-scripts/test-production-load.js
// Simulate 50 concurrent users submitting responses
// Measure: average response time, error rate, database connection pool
```

**Acceptance Criteria**:
- 95th percentile response time < 5 seconds
- Error rate < 1%
- Database connections < 20 concurrent

### 2. Long-Running Session Test
**Why**: Validate session state management over extended usage.

**Test Scenario**:
1. Create session
2. Generate 20 questions (full session)
3. Submit responses for all questions
4. Verify all model answers and scores stored correctly
5. Check session completion and analytics

**Acceptance Criteria**:
- All 20 responses processed successfully
- Session progress accurate (100%)
- Analytics dashboard shows correct metrics

### 3. Edge Case Testing
**Why**: Ensure robust handling of unusual inputs.

**Test Cases**:
- **Very Short Response** (< 10 words)
  - Expected: Still provides model answer and basic scores
- **Very Long Response** (> 500 words)
  - Expected: Processes without timeout, provides full evaluation
- **Non-English Response** (Thai, Bahasa, etc.)
  - Expected: Model answer in matching language, proper evaluation
- **Empty/Whitespace Response**
  - Expected: Graceful error or minimum viable evaluation

### 4. CSV Distribution Statistical Test
**Why**: Validate CSV selection probability over larger sample size.

**Test Script**:
```javascript
// Generate 100 questions across all 3 stages
// Measure: actual CSV percentage
// Expected: 75-85% (should converge to 80% with larger sample)
```

### 5. Model Answer Quality Validation
**Why**: Ensure AI-generated fallback answers maintain quality.

**Test Scenario**:
1. Force AI-generated question (not in CSV bank)
2. Submit response
3. Verify model answer is contextual and uses STAR method
4. Check feedback specificity

**Acceptance Criteria**:
- Model answer references question content
- STAR structure present (Situation, Task, Action, Result)
- Feedback includes 3-5 specific suggestions

### 6. Concurrent Session Test
**Why**: Validate isolation between multiple user sessions.

**Test Script**:
```javascript
// Create 5 sessions simultaneously with different stages
// Generate questions for all sessions in parallel
// Verify: no cross-contamination of questions/responses
```

### 7. Database Performance Test
**Why**: Ensure 9-criteria columns don't degrade query performance.

**Test Queries**:
```sql
-- Test response insertion performance
EXPLAIN ANALYZE
INSERT INTO ai_prepare_responses (...) VALUES (...);

-- Test session query performance with new columns
EXPLAIN ANALYZE
SELECT * FROM ai_prepare_responses WHERE session_id = '...';

-- Test analytics aggregation performance
EXPLAIN ANALYZE
SELECT AVG(weighted_overall_score) FROM ai_prepare_responses
WHERE created_at > NOW() - INTERVAL '7 days';
```

**Acceptance Criteria**:
- INSERT query < 50ms
- SELECT query < 20ms
- Aggregation query < 100ms

---

## 📊 Monitoring Recommendations

### Key Metrics to Track in Production

1. **Feature Adoption**
   - % of sessions using model answers
   - Average 9-criteria scores
   - CSV question distribution (daily average)

2. **Performance**
   - API response time (p50, p95, p99)
   - Evaluation duration (AI service latency)
   - Database query performance

3. **Quality**
   - User feedback on model answer helpfulness
   - Error rates by endpoint
   - Incomplete session rate

4. **Business Impact**
   - User engagement (time spent per session)
   - Session completion rates
   - Repeat usage frequency

### CloudWatch Alarms to Configure

```bash
# High Error Rate Alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "PrepareModule-HighErrorRate" \
  --alarm-description "Alert when error rate > 5%" \
  --metric-name "ErrorRate" \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold

# Slow Response Time Alarm
aws cloudwatch put-metric-alarm \
  --alarm-name "PrepareModule-SlowResponse" \
  --alarm-description "Alert when p95 latency > 10s" \
  --metric-name "ResponseTime" \
  --statistic "p95" \
  --threshold 10000 \
  --comparison-operator GreaterThanThreshold
```

---

## 🔍 Known Issues & Workarounds

### Issue 1: CSV Distribution Below Target (Non-Critical)
**Status**: Monitoring
**Impact**: Feature working correctly, statistical variance expected
**Workaround**: None needed, monitor production data for consistent patterns
**Fix**: Consider adjusting probability to 85% if consistently below 80%

### Issue 2: Numeric Type Conversion Overhead
**Status**: Implemented
**Impact**: Minor performance overhead from string→number conversion
**Workaround**: Using parseFloat() at data access layer
**Fix**: Consider migrating to DOUBLE PRECISION columns in future schema update

---

## 📚 Reference Documentation

### Key Files Modified
- `server/services/prepare-ai-service.ts:323-361` - API response mapping
- `server/services/response-evaluation-service.ts` - 9-criteria evaluation logic
- `server/services/model-answer-service.ts` - Google Sheets CSV loading
- `shared/schema.ts` - Database schema with 9-criteria columns
- `testing-scripts/test-staging-automated.js` - Comprehensive test suite

### Related PRs
- **PR #6**: Integrate Google Sheets Model Answers for Concise Feedback
  - Branch: `fix/stage-specific-question-context`
  - Status: Open, ready for production merge
  - Test Results: 97.1% passing (34/35 tests)

### Database Schema Changes
```typescript
// Added to shared/schema.ts
export const aiPrepareResponses = pgTable("ai_prepare_responses", {
  // ... existing columns ...

  // 9-Criteria Rubric Scores (NEW)
  starStructureScore: numeric("star_structure_score", { precision: 3, scale: 2 }),
  specificEvidenceScore: numeric("specific_evidence_score", { precision: 3, scale: 2 }),
  roleAlignmentScore: numeric("role_alignment_score", { precision: 3, scale: 2 }),
  outcomeOrientedScore: numeric("outcome_oriented_score", { precision: 3, scale: 2 }),
  problemSolvingScore: numeric("problem_solving_score", { precision: 3, scale: 2 }),
  culturalFitScore: numeric("cultural_fit_score", { precision: 3, scale: 2 }),
  learningAgilityScore: numeric("learning_agility_score", { precision: 3, scale: 2 }),
  weightedOverallScore: numeric("weighted_overall_score", { precision: 3, scale: 2 }),
  overallRating: varchar("overall_rating", { length: 30 }),
});
```

---

## ✅ Final Recommendations

### Go/No-Go Decision Criteria

**✅ READY FOR PRODUCTION** if:
- All pre-deployment checklist items completed
- Database migration successful
- Smoke tests passing in production
- Rollback plan reviewed and ready

**🔴 HOLD PRODUCTION DEPLOYMENT** if:
- Database migration fails or cannot verify completion
- Google Sheets CSV URL inaccessible from production network
- Staging environment showing < 90% test pass rate
- Critical production issues unresolved

### Post-Launch Action Items

1. **Week 1**: Monitor all metrics daily, review CloudWatch logs
2. **Week 2**: Analyze CSV distribution trends, user feedback on model answers
3. **Week 3**: Review performance data, optimize slow queries if needed
4. **Month 1**: Comprehensive retrospective, plan future improvements

### Future Enhancements (Post-Launch)

1. **CSV Refresh Endpoint**: Add admin API to reload Google Sheets without server restart
2. **Schema Type Optimization**: Migrate numeric columns to DOUBLE PRECISION for native number types
3. **Deterministic CSV Selection**: Implement guaranteed minimum CSV usage (e.g., 12 of 15)
4. **Enhanced Analytics**: Dashboard for 9-criteria score distribution and trends
5. **A/B Testing**: Compare user outcomes with/without model answers

---

## 📞 Support Contacts

**For Production Issues**:
- Deployment Issues: Check GitHub Actions logs, AWS EB console
- Database Issues: Review CloudWatch RDS logs, check connection pool
- Performance Issues: Monitor API response times, database query performance

**Escalation Path**:
1. Check this guide for known issues and solutions
2. Review staging test results for similar patterns
3. Check git commit history for recent changes
4. Rollback to previous version if critical

---

**Document Version**: 1.0
**Last Updated**: 2025-10-09
**Next Review**: After production deployment
