# Security Documentation

This document outlines security best practices, credential management, and incident response procedures for the P3 Interview Academy project.

**Last Updated**: 2025-12-02

---

## 🔐 AWS Credentials Management

### Critical Security Rules

- **❌ NEVER commit credentials to git repositories** - This is a critical security vulnerability
- **✅ Use AWS CLI profiles**: Configure with `aws configure --profile bizelev8`
- **✅ Use environment variables**: Set `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` externally
- **✅ Enable MFA** on your AWS account for additional security
- **✅ Regularly rotate access keys** (every 90 days recommended)
- **✅ Use least privilege principle** - only grant necessary permissions
- **✅ Monitor AWS CloudTrail** for unauthorized activity

### Environment Variable Security

**🔒 SECURITY NOTE**: Never commit credentials to version control. Use environment variables or AWS CLI profiles.

Key environment variables requiring protection (see `.env.example`):
- **AWS Credentials**: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (use AWS CLI profiles when possible)
- **AI Services**: `OPENAI_API_KEY` (required), `ANTHROPIC_API_KEY` (optional), `QWEN_API_KEY` (future)
- **Database**: `DATABASE_URL` (PostgreSQL connection string with credentials)
- **Google Cloud**: `GOOGLE_API_KEY`, `GCP_PROJECT_ID`, `GCP_REGION`
- **Auth**: `SESSION_SECRET` (critical for session encryption)
- **Email**: `SMTP_PASS` (Gmail app password)
- **OAuth**: `GOOGLE_CLIENT_SECRET` (Google OAuth credentials)
- **Payment Processing**: `STRIPE_TEST_SECRET_KEY`, `STRIPE_LIVE_SECRET_KEY` (Stripe API keys)
- **Webhooks**: `STRIPE_TEST_WEBHOOK_SECRET`, `STRIPE_LIVE_WEBHOOK_SECRET` (Stripe webhook signatures)

### AWS CLI Profile Setup

```bash
# Configure AWS CLI with profile
aws configure --profile bizelev8

# Use profile in commands
aws elasticbeanstalk describe-environments --profile bizelev8 --environment-names p3-interview-academy-prod-v2

# Set as default for session
export AWS_PROFILE=bizelev8
```

### Credential Rotation Procedure

1. **Generate new credentials** in AWS IAM Console
2. **Test new credentials** in development environment first
3. **Update all environments** (local, staging, production)
4. **Verify application functionality** after rotation
5. **Delete old credentials** from AWS IAM
6. **Document rotation** in ops-log with timestamp

---

## 🚨 Security Incident History

### Security Enhancement: React/Next.js Vulnerability Fixes (2025-12-10) ✅ RESOLVED

**Detection**: Proactive security audit using AI agent collaboration (@agent-gemini-research-specialist and @agent-qwen-specialist)

**Severity**: HIGH (CVSS 7.3 → 2.0 after remediation)

**Affected Areas**:
- **XSS Vulnerability**: AI-generated content rendered with dangerouslySetInnerHTML
- **File Upload Security**: MIME type spoofing vulnerability
- **Socket.IO CORS**: Wildcard origins and placeholder domains
- **Auth Bypass**: No protection against accidental production bypass
- **CSP Headers**: Missing Content Security Policy

**Vulnerabilities Fixed**:

1. **XSS in Pre-Interview Briefing (CVSS 7.3 - CRITICAL)**
   - **File**: `client/src/pages/practice/pre-interview-briefing.tsx:559-567`
   - **Risk**: Script injection via AI-generated coaching content
   - **Attack Vector**: Malicious AI response could inject `<script>` tags or event handlers
   - **Fix**: Removed `dangerouslySetInnerHTML`, replaced with safe React rendering
   - **Commit**: e44433f8

2. **File Upload MIME Type Spoofing (CVSS 5.0 - MEDIUM)**
   - **File**: `server/routes/users.ts:15-30`
   - **Risk**: .php, .exe files disguised as images via MIME type manipulation
   - **Attack Vector**: Upload malicious executable with image MIME type
   - **Fix**: Added extension validation (.jpg, .jpeg, .png, .gif, .webp only)
   - **Commit**: e44433f8

3. **Socket.IO CORS Wildcard (CVSS 4.5 - MEDIUM)**
   - **File**: `server/services/prepare-websocket-service.ts:48-82`
   - **Risk**: Unauthorized cross-origin WebSocket connections
   - **Attack Vector**: Malicious site connects to WebSocket and intercepts real-time data
   - **Fix**: Explicit production/development origin whitelists, removed allowAllOrigins
   - **Commit**: e44433f8

4. **Auth Bypass in Production (CVSS 4.0 - MEDIUM)**
   - **File**: `server/index.ts:11-22`
   - **Risk**: Accidental authentication bypass in production/staging environments
   - **Attack Vector**: Misconfigured BYPASS_AUTH=true in production
   - **Fix**: Server crashes on startup if BYPASS_AUTH=true in non-dev environments
   - **Commit**: e44433f8

5. **Missing CSP Headers (CVSS 3.0 - LOW)**
   - **File**: `server/index.ts:85-98`
   - **Risk**: Inline script execution, unauthorized API connections
   - **Attack Vector**: XSS attacks, data exfiltration to unauthorized endpoints
   - **Fix**: Comprehensive CSP with 9 directives (script-src, style-src, img-src, connect-src, etc.)
   - **Commit**: e44433f8

**Security Improvements**:
- ✅ CVSS score reduced from 7.3 (High) to 2.0 (Low)
- ✅ 0 npm vulnerabilities (all dependencies patched)
- ✅ 12 new XSS prevention tests added (all passing)
- ✅ CSP headers protect against inline scripts and unauthorized connections
- ✅ File upload validation prevents malicious file execution
- ✅ Socket.IO CORS hardened with explicit origin whitelists
- ✅ Production auth bypass protection with startup checks

**Related CVEs Patched**:
- CVE-2024-45296: Express.js path traversal (patched in 4.21.2)
- CVE-2024-38355: Socket.IO CORS bypass (patched in 4.8.1)
- CVE-2024-47764: PostCSS parsing issue (patched in 8.4.47)

**Testing Coverage**:
- New test file: `client/src/__tests__/security/xss-prevention.test.tsx` (299 lines, 12 tests)
- Test scenarios: Script injection, event handlers, data URIs, HTML entities, nested attacks
- All security tests passing (12/12)

**Impact Assessment**:
- **Risk**: MEDIUM - Vulnerabilities existed but not exploited (proactive fix)
- **Data Exposure**: NONE - No evidence of exploitation
- **Action Required**: YES - Deploy fixes to staging and production immediately
- **Production Impact**: POSITIVE - Significantly improved security posture

**Monitoring**:
- CloudWatch alerts configured for CSP violations
- File upload rejection logging enabled
- Socket.IO connection failures tracked
- Auth bypass attempts logged (server crashes)

**Documentation**:
- `docs/security/2025-12-10-security-fixes.md` - Detailed technical writeup
- `docs/ops-log/2025-12.md` - Session log with full context
- `CHANGELOG.md` - Release notes for security fixes

---

### Incident: Hardcoded Database Credentials (2025-12-02) ✅ RESOLVED

**Detection**: Security scan during session review detected hardcoded database credentials in multiple files

**Severity**: MEDIUM (Project not live, no actual compromise)

**Affected Resources**:
- **Password Exposed**: Database password for `app_user` and `app_user_staging` (staging environment)
- **Database**: `p3interviewacademy.cnecks4s8kqj.ap-southeast-1.rds.amazonaws.com`
- **Affected Files**: 19 files total
  - Deployment scripts: 8 JavaScript files in `/deployment-scripts/util/`
  - Documentation: 11 markdown files in `/docs/`
  - Session reviews: 2 temporary review documents
  - Claude settings: 1 configuration file

**Response Timeline**:
1. **Detection**: Automated security scan during session review (2025-12-02)
2. **Assessment**: Confirmed project not live, no credential compromise occurred
3. **Immediate Action**: All hardcoded credentials removed from codebase
4. **Script Updates**: Deployment scripts updated to use environment variables
5. **Documentation**: Credentials redacted, credential management guide created
6. **Verification**: Full codebase scan confirmed no remaining exposed credentials

**Actions Taken**:
- ✅ Removed hardcoded credentials from 19 files (8 scripts, 11 docs)
- ✅ Updated all deployment scripts to use environment variables
- ✅ Redacted credentials in all documentation with `[REDACTED]` placeholder
- ✅ Created comprehensive credential management guide (`/docs/guides/DATABASE_CREDENTIAL_MANAGEMENT.md`)
- ✅ Added environment variable validation to all scripts
- ✅ Updated SECURITY.md with incident record and best practices
- ✅ Verified no other secrets exposed (AWS, Stripe, OpenAI keys checked)

**Verification**:
- Full codebase scan: No hardcoded database passwords found
- Stripe test keys: Properly gitignored in `.config/` directory
- AWS keys: Not exposed (historical references only in incident logs)
- OpenAI keys: Not exposed (archived test files only)
- All scripts: Now require environment variables before execution

**Impact Assessment**:
- **Risk**: LOW - Project not live, credentials not accessed by unauthorized parties
- **Data Exposure**: NONE - No user data compromised
- **Action Required**: NO - Password rotation not required (confirmed by user)
- **Production Impact**: NONE - No production systems affected

**Lessons Learned**:
1. Never hardcode credentials, even in utility scripts or documentation
2. Use environment variables for all database connections
3. Redact credentials in documentation (use placeholders like `<PASSWORD>`)
4. Add environment variable validation to scripts (fail early if not set)
5. Create credential retrieval guides instead of embedding credentials
6. Regular security scans catch issues before they reach production

**Prevention Measures Implemented**:
- Created `/docs/guides/DATABASE_CREDENTIAL_MANAGEMENT.md` with secure practices
- Updated all deployment scripts with environment variable usage
- Added clear error messages when environment variables are missing
- Documented AWS EB configuration retrieval methods
- Enhanced session review security scanning process

**Related Documentation**:
- [Database Credential Management Guide](docs/guides/DATABASE_CREDENTIAL_MANAGEMENT.md)
- [Deployment Scripts](deployment-scripts/util/)

---

### Incident: Exposed AWS Credentials (2025-09-30) ✅ RESOLVED

**Detection**: AWS detected exposed credentials in public GitHub repository

**Affected Resources**:
- **Compromised Key**: `AKIAWCHYHHICYOWB626U`
- **Affected Files**:
  - `aws-rds-security-update.js`
  - `check-deployment-status.js`
  - `deploy-with-schema.js`
  - `aws-sdk-deploy.js`
  - `aws-schema-deploy.js`

**Response Timeline**:
1. **Detection**: AWS automated scanning detected exposed key
2. **Notification**: Email alert sent to account administrator
3. **Immediate Action**: Credentials removed from all repository files
4. **Key Rotation**: Compromised key deleted, new key generated
5. **Verification**: Tested access with new credentials
6. **Documentation**: Incident documented and reviewed

**Actions Taken**:
- ✅ Immediate credential removal from all repository files
- ✅ Secure configuration implemented (environment variables only)
- ✅ Compromised key deleted from AWS IAM (`AKIAWCHYHHICYOWB626U`)
- ✅ New access key generated (`AKIAWCHYHHIC7FAFLACQ`)
- ✅ AWS CLI configured with new credentials locally
- ✅ Elastic Beanstalk access verified with new credentials
- ✅ Code review process updated to prevent future incidents

**Verification**:
- Production environment: Green/Ok status
- Staging environment: Ready status
- Both environments accessible with new credentials
- No unauthorized activity detected in CloudTrail logs

**Lessons Learned**:
1. Never hardcode credentials in source files, even temporarily
2. Use `.env` files and `.gitignore` for local development
3. Implement pre-commit hooks to scan for credentials
4. Enable AWS CloudTrail for audit logging
5. Set up automated alerts for credential exposure

**Prevention Measures Implemented**:
- Added pre-commit hooks to detect credential patterns
- Updated team documentation on credential management
- Enabled GitHub secret scanning
- Documented secure credential handling in this file

---

## 🛡️ Development Security Guidelines

### Code Review Checklist

Before committing code, verify:
- [ ] No hardcoded credentials (API keys, passwords, tokens)
- [ ] No database connection strings with embedded passwords
- [ ] No comments containing sensitive information
- [ ] `.env` file is in `.gitignore`
- [ ] Environment variable usage is documented in `.env.example`

### Secret Scanning Tools

**Recommended Tools**:
- **GitHub Secret Scanning**: Enabled by default on public repos
- **GitGuardian**: Automated secret detection in commits
- **git-secrets**: AWS tool to prevent committing secrets
- **TruffleHog**: Find secrets in git history
- **Session Code Reviewer Agent** ✅ ACTIVE: Claude Code agent with automated secret detection (see details below)

**Session Code Reviewer Agent (Enhanced 2025-10-30)**:

**Status**: ✅ Active and operational

The session-code-reviewer agent now includes automated secret detection that runs before every commit, providing the first line of defense against credential leaks.

**Features**:
- **Automated Pattern Matching**: Scans `git diff --staged` for secrets before commit
- **Multi-Layer Detection**: Covers AWS, Stripe, OpenAI, database URLs, session secrets
- **Smart Exclusions**: Skips `.env.example`, documentation, historical logs with `[REDACTED]`
- **Code Quality Checks**: Also detects debug statements, large files, TODOs, dead code
- **Blocking Behavior**: Stops commits immediately when HIGH-confidence secrets detected
- **Warning System**: Requests confirmation for code quality issues

**Secret Patterns Detected**:
```
HIGH PRIORITY (BLOCKS COMMIT):
- AWS Credentials: AKIA[0-9A-Z]{16}, ASIA[0-9A-Z]{16}, secret access keys
- Stripe Keys: sk_live_*, pk_live_*, whsec_* (PRODUCTION credentials)
- OpenAI Keys: sk-*, sk-proj-*
- Database URLs: postgresql://user:password@host/db
- Session Secrets: Long random tokens in source code

MEDIUM PRIORITY (WARNS):
- Stripe TEST keys: sk_test_*, pk_test_* (outside test files)
- Debug statements: console.log, debugger
- Large files: >1MB
- Dead code: Comment blocks, commented imports
- TODOs/FIXMEs: Unfinished work markers

EXCLUDED (SAFE):
- .env.example files with placeholders
- Documentation files (*.md)
- Historical logs with [REDACTED] markers
- Test fixtures with mock credentials
```

**How It Works**:
1. User completes development work and requests session review
2. Agent is invoked via Task tool with `subagent_type: session-code-reviewer`
3. Agent runs TypeScript checks, code review, and **security scan**
4. Security scan runs `git diff --staged` and applies regex patterns
5. **DECISION POINT**:
   - If secrets detected → ❌ **BLOCK COMMIT** with file:line references
   - If code quality issues → ⚠️ **WARN** and request confirmation
   - If clean → ✅ **APPROVE** for commit
6. Only proceeds to git operations if scan approves

**Benefits Over Manual Review**:
- ✅ Consistent detection (never forgets to check)
- ✅ Pattern-based matching (catches variations)
- ✅ File:line references (quick remediation)
- ✅ Past incident awareness (references 2025-09-30 AWS, 2025-10-28 Stripe)
- ✅ No external tool installation required (built into agent)

**Test Coverage**:
- 12 documented test cases in `.claude/agents/session-code-reviewer-test-cases.md`
- Validated against past security incidents
- Covers BLOCK, WARN, and ALLOW scenarios

**Configuration**:
- Agent file: `.claude/agents/session-code-reviewer.md`
- Backup: `.claude/agents/session-code-reviewer.md.backup`
- Pattern updates: Edit Section 0 of agent file
- Exclusions: Modify exclusion list in Section 0

**Usage**:
```typescript
// User finishes work, then invokes:
"I've finished the gamification feature, please review"

// Agent responds:
"I'll use the session-code-reviewer agent to review your work..."

// Agent performs security scan automatically
// Reports findings before any git operations
```

**Limitations**:
- Regex-based detection (not semantic analysis)
- May have false positives (use exclusion list to refine)
- Does not prevent force-push bypassing
- Complements (not replaces) GitHub/GitGuardian scanning

**Future Enhancements**:
- Phase 2: Install pre-commit git hooks for additional layer
- Phase 3: Integrate with GitGuardian API for real-time verification
- Continuous pattern refinement based on new threat patterns

**Documentation**:
- Full specification: `.claude/agents/session-code-reviewer.md` (16KB)
- Test cases: `.claude/agents/session-code-reviewer-test-cases.md`
- Implementation log: `docs/ops-log/2025-10.md` (2025-10-30 entry)

**Setup git-secrets** (recommended for additional layer):
```bash
# Install
brew install git-secrets  # macOS
# or download from https://github.com/awslabs/git-secrets

# Configure for repo
cd /path/to/repo
git secrets --install
git secrets --register-aws

# Scan entire history
git secrets --scan-history
```

### Environment Separation

**Development**:
- Use local `.env` file (never commit)
- Use development database (separate from production)
- Use test API keys with rate limits
- `BYPASS_AUTH=true` acceptable in local dev only

**Staging**:
- Separate database (`p3_staging`)
- Separate AWS environment
- Test SMTP configuration (use test email addresses)
- OAuth configured with staging redirect URLs

**Production**:
- Separate database (`postgres`)
- Production AWS environment
- Live SMTP configuration
- OAuth configured with production redirect URLs
- `BYPASS_AUTH` must be false or unset
- `FORCE_HTTPS=true` for secure cookies

### Backup Strategy

**Credentials Backup** (secure storage required):
- Use password manager (1Password, LastPass, AWS Secrets Manager)
- Never store in plain text files
- Never store in Slack, email, or shared documents
- Encrypt backups if stored locally

**Database Backups**:
- RDS automated backups: 7-day retention enabled
- Manual snapshots before major deployments
- Test restore procedures quarterly
- Encrypt all database snapshots

### Team Training

**Required Knowledge**:
- How to use `.env` files properly
- AWS IAM best practices (MFA, key rotation)
- How to detect exposed credentials
- Incident response procedures
- Where to report security concerns

**Security Contact**:
- Report security issues immediately to: [security email]
- Do not disclose security issues in public channels
- Follow responsible disclosure practices

---

## 🔍 Monitoring & Auditing

### AWS CloudTrail

Monitor for suspicious activity:
- Unauthorized API calls
- Failed authentication attempts
- Unusual geographic access patterns
- Privilege escalation attempts

### Application Logging

**Do NOT log**:
- Passwords or password hashes
- API keys or tokens
- Session cookies
- Database credentials
- OAuth tokens or secrets

**Safe to log**:
- User IDs (not names in production)
- Request paths and methods
- Response status codes
- Error types (without sensitive context)
- Timestamps and durations

### Security Headers

Production environment includes:
- `Content-Security-Policy`: Controls resource loading
- `X-Content-Type-Options: nosniff`: Prevents MIME sniffing
- `X-Frame-Options`: Removed for iframe embedding (documented exception)
- `Strict-Transport-Security`: Enforces HTTPS
- CORS configuration: Restricted to bizelev8.ai domains

---

## 📋 Compliance & Standards

### Data Protection

- **GDPR**: User data segregated (staging vs production databases)
- **Data Retention**: 7-day database backups, no long-term PII storage in logs
- **Data Deletion**: User deletion procedures documented in `server/storage.ts`

### Access Control

- **Admin Access**: Limited to authorized personnel
- **Database Access**: Restricted by security groups
- **RDS Security**: External access blocked by `pg_hba.conf`
- **Session Management**: Encrypted sessions with `SESSION_SECRET`

### Audit Trail

- All deployments logged in `deployment-scripts/ops-log/`
- Security incidents documented in this file
- Credential rotations documented with timestamps
- Configuration changes tracked in git history

---

## 🚀 Emergency Procedures

### Suspected Credential Compromise

1. **Immediately revoke** the compromised credential
2. **Generate new credential** and update all environments
3. **Review CloudTrail logs** for unauthorized activity
4. **Scan git history** for exposed credentials
5. **Document incident** in this file
6. **Notify team** via secure channel
7. **Review access patterns** for anomalies

### Security Vulnerability Discovered

1. **Assess severity** (critical, high, medium, low)
2. **Document vulnerability** privately
3. **Develop fix** or mitigation strategy
4. **Test fix** in staging environment
5. **Deploy to production** with priority based on severity
6. **Document in ops-log** after resolution

### Contact Information

- **AWS Support**: [AWS account owner contact]
- **Security Team**: [security email]
- **On-Call**: [on-call contact for emergencies]

---

## 📚 Additional Resources

- [AWS Security Best Practices](https://aws.amazon.com/security/best-practices/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [Environment Configuration](.env.example)
- [Deployment Security](DEPLOYMENT.md#security)
