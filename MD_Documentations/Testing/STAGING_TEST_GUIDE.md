# Staging Environment Testing Guide
## Model Answer Integration - Manual Test Procedures

**Branch**: `fix/stage-specific-question-context`
**PR**: #6 - Integrate Google Sheets Model Answers for Concise Feedback
**Staging URL**: http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com

---

## ✅ Phase 1: Infrastructure Setup (COMPLETED)

**Status**: ✅ COMPLETED

### Results:
- ✅ SESSION_SECRET configured (generated secure 32-byte hex)
- ✅ DATABASE_URL corrected (authentication working)
- ✅ Database connection: **healthy** (30-34ms response time)
- ✅ Health endpoints: All returning HTTP 200
- ✅ Environment status: Green/Ready
- ✅ Application uptime: Stable

### Verification Commands:
```bash
# Health check
curl http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com/api/health

# Expected: {"status":"ok", "checks":{"database":{"status":"healthy",...}}}
```

---

## 📋 Phase 2-6: Manual UI Testing Required

Due to authentication requirements, the following tests must be performed through the **browser UI**.

---

## 🧪 Phase 2: Backend CSV Model Answer Integration

### Test 2.1: CSV Loading Verification

**Objective**: Confirm ModelAnswerService successfully loaded 125 curated questions

**Steps**:
1. **Access staging frontend**: http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com
2. **Sign in / Create account** (Replit Auth or simple auth)
3. Open browser DevTools → Console
4. Look for log messages:
   - `"✅ Model answers loaded: 125 questions cached"`
   - `"📋 Parsed 125 curated questions"`
   - `"📊 Question distribution by stage:"`

**Expected Results**:
- ✅ 125 questions loaded from CSV
- ✅ No timeout errors (5-second limit)
- ✅ Questions distributed: 25 per stage (phone-screening, functional-team, hiring-manager, sme-expert, executive-leadership)

**Troubleshooting**:
- If you see "⚠️ Model answers not loaded on startup", refresh the page
- Check Network tab for Google Sheets CSV fetch (should be < 2 seconds)

---

### Test 2.2: Question Generation - CSV vs AI Distribution

**Objective**: Verify 80%+ questions come from curated bank

**Steps**:
1. Navigate to **Prepare AI** module
2. Create new session:
   - **Job Position**: "Senior Software Engineer"
   - **Company**: "Google"
   - **Interview Stage**: "Hiring Manager Interview" (should use Q51-Q75)
   - **Language**: English
   - **Voice**: Disabled (for testing clarity)
3. Generate **5 questions** consecutively
4. For each question, check DevTools Console for:
   - `"✅ Exact match found for question (Q#XX)"` → CSV question
   - OR AI generation message → AI-generated question
5. Record CSV vs AI count

**Expected Results**:
- ✅ **4-5 out of 5 questions from CSV** (80-100%)
- ✅ Questions appropriate for "Hiring Manager" stage
- ✅ CSV question numbers in range Q51-Q75

**Record Results**:
```
Q1: [ ] CSV (Q#__) [ ] AI
Q2: [ ] CSV (Q#__) [ ] AI
Q3: [ ] CSV (Q#__) [ ] AI
Q4: [ ] CSV (Q#__) [ ] AI
Q5: [ ] CSV (Q#__) [ ] AI

CSV Count: __ / 5 (__%)
```

---

### Test 2.3: Model Answer Retrieval

**Objective**: Confirm model answers match specific questions

**Steps**:
1. Using session from Test 2.2, select a **CSV question** (e.g., Q51-Q75)
2. Submit a test response (any STAR-formatted answer)
3. Wait for evaluation to complete
4. Check **Model Answer section** in feedback panel
5. Verify model answer:
   - ✅ Relates to the specific question asked
   - ✅ Provides structured framework (not generic STAR template)
   - ✅ References question context (job position, company, stage)

**Expected Results**:
- ✅ Model answer displayed for CSV questions
- ✅ Model answer is question-specific (not "Situation: Describe a time when...")
- ✅ Fuzzy matching works (if question phrasing varies slightly)

**Record**:
```
CSV Question #: ___
Question Text: "____________________"
Model Answer Preview: "____________________"
Is Specific: [ ] Yes [ ] No
```

---

## 🎨 Phase 3: Frontend AI Integration Testing

### Test 3.1: Session Creation Flow

**Objective**: Verify session initialization without errors

**Steps**:
1. Navigate to Prepare AI module
2. Open DevTools Console (check for errors)
3. Create session with:
   - Job Position: "Product Manager"
   - Company: "Microsoft"
   - Stage: "Phone Screening" (Q1-Q25)
   - Language: English
4. Monitor Console for:
   - ✅ No JavaScript errors
   - ✅ Session created successfully
   - ✅ WebSocket connection established (if used)

**Expected Results**:
- ✅ Session initializes within 2-3 seconds
- ✅ No console errors
- ✅ Session ID displayed
- ✅ First question loads automatically

---

### Test 3.2: Question Display & Response Submission

**Objective**: Validate question rendering and response flow

**Steps**:
1. Using session from Test 3.1:
   - **Question 1**: Submit text response (100-150 words, STAR format)
   - **Question 2**: Submit short response (50 words, incomplete STAR)
   - **Question 3**: Submit excellent response (200 words, complete STAR with metrics)
2. For each submission:
   - Check response time (should be < 5 seconds)
   - Verify progress indicator updates
   - Check for errors in Console

**Expected Results**:
- ✅ All responses submitted successfully
- ✅ No JavaScript errors
- ✅ Progress tracking updates correctly
- ✅ Question counter increments (1/5, 2/5, 3/5)

---

### Test 3.3: Evaluation Feedback Display - **CRITICAL TEST**

**Objective**: Verify feedback is **CONCISE** (3-5 bullets per section)

**Steps**:
1. After submitting response in Test 3.2 Q3, scroll to Evaluation Panel
2. Count bullet points in each section:
   - **Strengths**: ___ bullets (target: 3-5)
   - **Weaknesses**: ___ bullets (target: 3-5)
   - **Suggestions**: ___ bullets (target: 3-5)
3. Verify **9-Criteria Scores** displayed:
   - [ ] 1. Relevance (15%)
   - [ ] 2. STAR Structure (15%)
   - [ ] 3. Specific Evidence (15%)
   - [ ] 4. Role Alignment (15%)
   - [ ] 5. Outcome Oriented (15%)
   - [ ] 6. Communication (10%)
   - [ ] 7. Problem Solving (10%)
   - [ ] 8. Cultural Fit (5%)
   - [ ] 9. Learning Agility (5%)
4. Check **Overall Rating**: Pass / Borderline / Needs Improvement
5. Verify **Model Answer** section shows question-specific guidance

**Expected Results** (KEY SUCCESS CRITERIA):
- ✅ **Total bullets ≤ 15** (was 30-40 in old version)
- ✅ **Each section: 3-5 bullets** (concise, not paragraphs)
- ✅ **All 9 criteria scores visible** (1-5 scale)
- ✅ **Weighted overall score calculated** (Pass ≥3.5/5)
- ✅ **Model answer displayed** (question-specific)
- ✅ **No lengthy paragraphs** (bullet points only)

**CRITICAL COMPARISON**:
```
OLD VERSION (PRE-FIX):
- Strengths: 8-12 lengthy paragraphs
- Weaknesses: 6-10 lengthy paragraphs
- Suggestions: 5-8 lengthy paragraphs
- Total: 2000+ tokens, very long scrolling

NEW VERSION (POST-FIX):
- Strengths: 3-5 concise bullets
- Weaknesses: 3-5 concise bullets
- Suggestions: 3-5 concise bullets
- Total: ~800 tokens, scannable at a glance
```

**Record Results**:
```
Strengths: ___ bullets
Weaknesses: ___ bullets
Suggestions: ___ bullets
Total: ___ bullets

Feedback Length Assessment:
[ ] ✅ Concise (≤15 bullets total)
[ ] ⚠️ Slightly verbose (16-20 bullets)
[ ] ❌ Too lengthy (>20 bullets)

9-Criteria Scores Visible: [ ] Yes [ ] No
Model Answer Displayed: [ ] Yes [ ] No
Overall Rating: [ ] Pass [ ] Borderline [ ] Needs Improvement
```

---

## 🗄️ Phase 4: Database Verification

### Test 4.1: CSV Metadata Storage

**Objective**: Confirm database stores CSV question tracking

**Prerequisites**: Database access (psql or GUI tool)

**Steps**:
1. Connect to staging database:
   ```bash
   psql postgresql://app_user:ZgVs0A8jEJurQezzkp37txtJ@p3interviewacademy.cnecks4s8kqj.ap-southeast-1.rds.amazonaws.com:5432/postgres
   ```

2. Query recent questions:
   ```sql
   SELECT
     id,
     csv_question_number,
     csv_question_stage,
     is_from_curated_bank,
     question_text,
     created_at
   FROM ai_prepare_questions
   WHERE created_at > NOW() - INTERVAL '1 hour'
   ORDER BY created_at DESC
   LIMIT 10;
   ```

**Expected Results**:
- ✅ CSV columns populated for curated questions
- ✅ `csv_question_number` in range 1-125 (for CSV questions)
- ✅ `csv_question_stage` values: phone-screening, functional-team, hiring-manager, sme-expert, executive-leadership
- ✅ `is_from_curated_bank = true` for CSV questions, `false` for AI-generated

**Record Sample**:
```
csv_question_number | csv_question_stage | is_from_curated_bank | question_text
--------------------|-------------------|---------------------|---------------
67                  | hiring-manager    | t                   | "Can you describe..."
NULL                | NULL              | f                   | "Tell me about..."
```

---

### Test 4.2: Evaluation Scores Storage

**Steps**:
1. Query recent evaluations:
   ```sql
   SELECT
     id,
     relevance_score,
     star_structure_score,
     specific_evidence_score,
     role_alignment_score,
     outcome_oriented_score,
     communication_score,
     problem_solving_score,
     cultural_fit_score,
     learning_agility_score,
     weighted_overall_score,
     overall_rating,
     model_answer,
     created_at
   FROM ai_prepare_responses
   WHERE created_at > NOW() - INTERVAL '1 hour'
   ORDER BY created_at DESC
   LIMIT 5;
   ```

**Expected Results**:
- ✅ All 9 criteria scores populated (1-5 range)
- ✅ Weighted overall score calculated correctly
- ✅ Overall rating: 'Pass', 'Borderline', or 'Needs Improvement'
- ✅ Model answer stored (from CSV or generated)

---

## 🚀 Phase 5: End-to-End User Journey

### Complete Flow Test

**Objective**: Simulate real user experience from start to finish

**Steps**:
1. **Sign Out** (clear session)
2. **Sign In** as new/test user
3. **Create Session**:
   - Job: "Marketing Manager"
   - Company: "Shopee"
   - Stage: "Executive Leadership" (Q101-Q125)
4. **Answer 5 Questions**:
   - Q1: Excellent STAR response (200 words with metrics)
   - Q2: Good STAR response (150 words)
   - Q3: Average response (100 words, missing Result)
   - Q4: Poor response (50 words, no STAR structure)
   - Q5: Excellent STAR response (200 words)
5. **Complete Session**
6. **Navigate to Perform Dashboard**
7. **Verify**:
   - Session appears in history
   - Scores trend visible (Q1→Q2→Q3→Q4→Q5)
   - Overall statistics calculated
   - Can re-open session for review

**Expected Results**:
- ✅ Seamless flow from start to finish
- ✅ No errors or freezes
- ✅ Scores correlate with response quality
- ✅ Perform dashboard shows data
- ✅ Session data persists after page refresh

**User Experience Notes**:
- Time to complete: ____ minutes
- Difficulty level: [ ] Easy [ ] Medium [ ] Hard
- Feedback clarity: [ ] Very clear [ ] Clear [ ] Unclear
- Would recommend: [ ] Yes [ ] No

---

## ⚡ Phase 6: Performance & Error Testing

### Test 6.1: Performance Metrics

**Steps**:
1. Open DevTools → Network tab
2. Generate question → Measure time
3. Submit response → Measure time
4. Check memory usage (DevTools → Performance Monitor)

**Targets**:
- [ ] CSV fetch: < 2 seconds
- [ ] Question generation: < 1 second
- [ ] Evaluation response: < 3 seconds
- [ ] Frontend rendering: Smooth (no lag)
- [ ] Memory usage: Stable (no leaks)

---

### Test 6.2: Error Handling

**Test Scenarios**:
1. **Invalid Input**: Submit empty response
   - Expected: Validation error, friendly message
2. **Network Issue**: Disable network mid-response
   - Expected: Retry logic or error message
3. **Session Expiration**: Wait 30 minutes idle
   - Expected: Session expires gracefully, prompt to re-login
4. **Browser Refresh**: Refresh page mid-session
   - Expected: Session resumes, data not lost

**Record**:
```
Empty Response: [ ] ✅ Handled [ ] ❌ Crashed
Network Error: [ ] ✅ Handled [ ] ❌ Crashed
Session Timeout: [ ] ✅ Handled [ ] ❌ Crashed
Page Refresh: [ ] ✅ Resumed [ ] ❌ Lost data
```

---

## 📊 Phase 7: Final Verification & PR Update

### Acceptance Checklist

**Backend**:
- [ ] ✅ 125 questions loaded from Google Sheets CSV
- [ ] ✅ 80%+ questions from curated bank
- [ ] ✅ Model answers are question-specific
- [ ] ✅ CSV metadata stored in database
- [ ] ✅ All 9 criteria scores calculated

**Frontend**:
- [ ] ✅ Feedback is concise (3-5 bullets per section)
- [ ] ✅ Total bullets ≤ 15 (vs 30-40 before)
- [ ] ✅ Model answers displayed correctly
- [ ] ✅ No JavaScript errors
- [ ] ✅ UI responsive and smooth

**Database**:
- [ ] ✅ CSV tracking columns working
- [ ] ✅ Evaluation scores stored correctly
- [ ] ✅ Data integrity maintained

**Performance**:
- [ ] ✅ CSV loads in < 2 seconds
- [ ] ✅ Evaluation completes in < 3 seconds
- [ ] ✅ No memory leaks or performance degradation

---

### PR #6 Update Template

Once all tests pass, add this comment to PR #6:

```markdown
## ✅ Staging Test Results

**Testing Date**: [YYYY-MM-DD]
**Tester**: [Your Name]
**Staging URL**: http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com

### Phase 1: Infrastructure ✅
- [x] SESSION_SECRET configured
- [x] DATABASE_URL corrected
- [x] Database connection healthy (30ms response time)
- [x] All health endpoints HTTP 200

### Phase 2: Backend Integration ✅
- [x] CSV loaded: 125 questions
- [x] Questions from CSV: __/5 (__%)
- [x] Model answers: Question-specific

### Phase 3: Frontend Integration ✅
- [x] Session creation: No errors
- [x] Question display: Working
- [x] Feedback conciseness: ✅ __ bullets total (target: ≤15)
- [x] 9-Criteria scores: All visible
- [x] Model answers: Displayed correctly

### Phase 4: Database ✅
- [x] CSV metadata stored
- [x] Evaluation scores correct

### Phase 5: End-to-End ✅
- [x] Complete user journey: Successful
- [x] Perform dashboard: Data integrated

### Phase 6: Performance ✅
- [x] CSV load: __s (target: <2s)
- [x] Evaluation: __s (target: <3s)
- [x] Error handling: Graceful

---

**CRITICAL SUCCESS METRIC**:
- **OLD**: Feedback was 2000 tokens, 30-40 lengthy paragraphs
- **NEW**: Feedback is ~800 tokens, 9-15 concise bullets ✅

**RECOMMENDATION**: ✅ **APPROVED FOR PRODUCTION MERGE**

---

**Notes**:
- [Add any observations, bugs, or recommendations]

**Screenshots**:
- Attach screenshots of:
  1. Evaluation feedback showing concise bullets
  2. 9-criteria scores display
  3. Model answer section
  4. Database query results
```

---

## 🔄 Next Steps

1. **Complete Tests 2.1-6.2** using this guide
2. **Document all results** in the spaces provided
3. **Take screenshots** of key features working
4. **Update PR #6** with test results comment
5. **Request review** from team
6. **Merge to main** once approved
7. **Monitor production** after deployment

---

## 🆘 Troubleshooting

### Common Issues

**Issue**: CSV not loading
- **Fix**: Check Network tab for Google Sheets URL, verify 200 response
- **Fix**: Refresh page to trigger reload

**Issue**: Questions all AI-generated (0% from CSV)
- **Fix**: Check browser Console for ModelAnswerService errors
- **Fix**: Verify `csv_question_number` is being set in database

**Issue**: Feedback still lengthy (>20 bullets)
- **Fix**: Check token limit is 800 (not 2000) in evaluation service
- **Fix**: Verify prompt includes "3-5 bullets MAXIMUM" instruction

**Issue**: Model answers generic (STAR template)
- **Fix**: Check CSV questions loaded successfully
- **Fix**: Verify fuzzy matching is working (threshold 0.7)

---

## 📞 Support

If you encounter issues not covered here:
1. Check staging logs: `aws elasticbeanstalk logs --environment-name p3-interview-academy-staging`
2. Review PR #6 discussion
3. Contact development team

---

**Generated**: 2025-10-08
**Document Version**: 1.0
**Status**: Ready for manual testing
