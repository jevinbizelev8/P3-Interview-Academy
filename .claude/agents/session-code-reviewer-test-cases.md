# Session Code Reviewer Agent - Test Cases

**Created**: 2025-10-30
**Purpose**: Validate secret detection patterns and exclusion rules

## Test Case 1: AWS Credentials (SHOULD BLOCK)

### Scenario: AWS key in JavaScript config file
```javascript
// config/aws-setup.js
const AWS_ACCESS_KEY_ID = "AKIAxxxxxxxxxxxxxxxxx";
const AWS_SECRET_ACCESS_KEY = "abc123def456ghi789jkl012mno345pqr678stu9";
```

**Expected Result**: ❌ BLOCK COMMIT
**Pattern Match**:
- `AKIA[0-9A-Z]{16}` matches "AKIAxxxxxxxxxxxxxxxxx"
- `[A-Za-z0-9/+=]{40}` matches the secret key

**Agent Action**: Report finding at `config/aws-setup.js:2` and `config/aws-setup.js:3`, STOP all git operations

---

## Test Case 2: Stripe Live Key (SHOULD BLOCK)

### Scenario: Stripe live key in payment service
```typescript
// server/services/payment-service.ts
const stripe = require('stripe')('sk_live_REDACTED');
```

**Expected Result**: ❌ BLOCK COMMIT (PRODUCTION CREDENTIAL)
**Pattern Match**: `sk_live_[0-9a-zA-Z]{24,}` (actual keys are 99 chars)
**Agent Action**: Report finding at `server/services/payment-service.ts:2`, STOP with HIGH PRIORITY alert

---

## Test Case 3: OpenAI Key (SHOULD BLOCK)

### Scenario: OpenAI key hardcoded in AI service
```typescript
// server/services/ai-service.ts
const openai = new OpenAI({
  apiKey: 'sk-proj-abc123def456ghi789jkl012mno345'
});
```

**Expected Result**: ❌ BLOCK COMMIT
**Pattern Match**: `sk-proj-[a-zA-Z0-9]{20,}`
**Agent Action**: Report finding at `server/services/ai-service.ts:3`

---

## Test Case 4: Database URL (SHOULD BLOCK)

### Scenario: Database URL with embedded password
```bash
# deploy.sh
export DATABASE_URL="postgresql://admin:SecureP@ssw0rd@rds-instance.amazonaws.com:5432/p3_prod"
```

**Expected Result**: ❌ BLOCK COMMIT
**Pattern Match**: `postgresql://[^:]+:[^@]+@[^/]+/`
**Agent Action**: Report finding at `deploy.sh:2`, recommend using .env file

---

## Test Case 5: .env.example Update (SHOULD ALLOW)

### Scenario: Updating example environment file
```bash
# .env.example
OPENAI_API_KEY=your_openai_api_key_here
STRIPE_SECRET_KEY=sk_test_xxx
AWS_ACCESS_KEY_ID=AKIA__EXAMPLE__
DATABASE_URL=postgresql://user:password@localhost/dbname
```

**Expected Result**: ✅ ALLOW (FALSE POSITIVE - EXCLUDED)
**Exclusion Match**: File is `.env.example` (in exclusion list)
**Agent Action**: Skip scanning this file, document in "Exclusions Applied" section

---

## Test Case 6: Documentation with Redacted Secrets (SHOULD ALLOW)

### Scenario: Ops log documenting past incident
```markdown
# docs/ops-log/2025-10.md
#### Incident: AWS Key Exposure
- Exposed key: AKIA... [REDACTED]
- Stripe webhook: whsec_... [REDACTED]
```

**Expected Result**: ✅ ALLOW (FALSE POSITIVE - EXCLUDED)
**Exclusion Match**:
- File is `docs/ops-log/*.md` (in exclusion list)
- Content contains `[REDACTED]` marker
**Agent Action**: Skip this file, note in report

---

## Test Case 7: Debug Statements (SHOULD WARN)

### Scenario: Console.log in production code
```typescript
// client/src/components/Dashboard.tsx
export function Dashboard() {
  console.log("User data:", userData);
  console.debug("Rendering dashboard");
  return <div>Dashboard</div>;
}
```

**Expected Result**: ⚠️ WARN (CODE QUALITY ISSUE)
**Pattern Match**: `console\.log\(`, `console\.debug\(`
**Agent Action**:
- Report findings at `client/src/components/Dashboard.tsx:3,4`
- Request user confirmation to proceed
- If user confirms, document in commit message

---

## Test Case 8: Large File (SHOULD WARN)

### Scenario: Committing a 2MB image file
```bash
git add attached_assets/screenshots/demo-video.mp4  # 2.5MB
```

**Expected Result**: ⚠️ WARN (LARGE FILE)
**Detection**: `git diff --staged --stat` shows file >1MB
**Agent Action**:
- Alert user about large file
- Ask if intentional (asset vs accidentally committed binary)
- Proceed if confirmed

---

## Test Case 9: TODOs in Code (SHOULD WARN)

### Scenario: Unfinished work markers
```typescript
// server/services/gamification-service.ts
export async function calculateReadiness(userId: string) {
  // TODO: Implement weighted average calculation
  // FIXME: Performance issue with nested queries
  // HACK: Temporary workaround for badge calculation
  return 0;
}
```

**Expected Result**: ⚠️ WARN (UNFINISHED WORK)
**Pattern Match**: `TODO:`, `FIXME:`, `HACK:`
**Agent Action**:
- Count TODOs (3 found)
- Report at `server/services/gamification-service.ts:3,4,5`
- Request user to document in commit message
- Proceed with confirmation

---

## Test Case 10: Stripe Test Key in Test File (SHOULD WARN)

### Scenario: Test key in testing code
```typescript
// server/__tests__/payment.test.ts
const stripe = new Stripe('sk_test_51RM8QpRYjG8QUIcy...');
```

**Expected Result**: ⚠️ WARN (TEST CREDENTIAL IN TEST FILE)
**Pattern Match**: `sk_test_[0-9a-zA-Z]{24,}`
**Agent Action**:
- Detect test key (not live key, so not HIGH priority)
- Note it's in a test file (acceptable context)
- Warn but allow with confirmation
- Lower priority than live keys

---

## Test Case 11: Dead Code (SHOULD WARN)

### Scenario: Large commented-out code block
```typescript
// server/routes/legacy.ts
/*
export function oldFeature() {
  // ... 50 lines of commented code ...
  const result = processData();
  return result;
}
*/

// import { oldHelper } from './helpers';
// import { deprecatedService } from './services';
```

**Expected Result**: ⚠️ WARN (DEAD CODE CLEANUP)
**Pattern Match**:
- `\/\*[\s\S]{100,}\*\/` (multi-line comment block >100 chars)
- `\/\/ import .* from` (commented imports)
**Agent Action**: Suggest cleanup, but allow if user confirms legacy code preservation

---

## Test Case 12: Mixed Scenario (SHOULD BLOCK)

### Scenario: Code with both secrets and quality issues
```typescript
// server/config.ts
console.log("Initializing config");  // Debug statement
const OPENAI_KEY = 'sk-abc123def456';  // SECRET!
// TODO: Move to environment variable
```

**Expected Result**: ❌ BLOCK COMMIT (SECRET TAKES PRECEDENCE)
**Findings**:
1. ❌ HIGH: OpenAI key at line 3
2. ⚠️ MEDIUM: Debug statement at line 2
3. ⚠️ LOW: TODO at line 4

**Agent Action**:
- **BLOCK** due to HIGH-priority secret detection
- Also report code quality issues
- User must fix secret before any other consideration

---

## Validation Summary

**Blocking Patterns (12 total):**
- ✅ AWS Access Keys (AKIA*, ASIA*)
- ✅ AWS Secret Access Keys (40-char base64)
- ✅ Stripe Live Keys (sk_live_)
- ✅ Stripe Webhook Secrets (whsec_)
- ✅ OpenAI Keys (sk-, sk-proj-)
- ✅ Database URLs with passwords

**Warning Patterns (6 total):**
- ✅ Debug statements (console.log, debugger)
- ✅ Large files (>1MB)
- ✅ Dead code blocks
- ✅ TODOs/FIXMEs
- ✅ Stripe test keys in non-test contexts
- ✅ Commented imports

**Exclusion Rules (5 total):**
- ✅ .env.example files
- ✅ *.md documentation files
- ✅ [REDACTED] markers in content
- ✅ Placeholder values (your_*_here, xxx)
- ✅ ops-log historical files

**Decision Logic:**
- ✅ Block on HIGH-confidence secrets (no exceptions)
- ✅ Warn on code quality issues (request confirmation)
- ✅ Allow excluded files/patterns (false positives)
- ✅ Mixed scenarios: Block takes precedence

---

## Integration with Session Review

When the session-code-reviewer agent runs:

1. **Pre-scan**: Run `git diff --staged` to get all changes
2. **Apply patterns**: Scan content using regex from Section 0
3. **Check exclusions**: Skip files/patterns in exclusion list
4. **Generate report**: Build findings with file:line references
5. **Decision point**:
   - If secrets → BLOCK
   - If quality issues → WARN
   - If clean → APPROVE
6. **Document**: Include findings in Security Scan Results section
7. **Git operations**: Only proceed if approved/confirmed

---

## Next Steps for Real-World Testing

1. **Create test branch**: `git checkout -b test/secret-detection`
2. **Add test file**: Create file with clearly marked TEST secrets
3. **Run agent**: Invoke session-code-reviewer via Task tool
4. **Verify blocking**: Confirm agent stops before commit
5. **Test exclusions**: Modify .env.example, verify it's skipped
6. **Test warnings**: Add console.log, verify warning behavior
7. **Clean up**: Delete test branch after validation

---

**Status**: Test cases documented, ready for real-world validation
**Risk**: LOW - Patterns are well-defined and conservative
**Rollback**: Original agent backed up at `.claude/agents/session-code-reviewer.md.backup`
