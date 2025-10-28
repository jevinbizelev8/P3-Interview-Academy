# Security Documentation

This document outlines security best practices, credential management, and incident response procedures for the P3 Interview Academy project.

**Last Updated**: 2025-10-23

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

**Setup git-secrets** (recommended):
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
