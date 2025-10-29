# AWS Elastic Beanstalk Environment Configuration Report
Generated: 2025-10-22

## 📊 Environment Status Overview

### Production: `p3-interview-academy-prod-v2`
- **Status**: ✅ Ready
- **Health**: ✅ Green
- **Version**: `deployment-20251015-180323`
- **Last Updated**: 2025-10-16 00:52:59 UTC
- **URL**: http://p3-interview-academy-prod-v2.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com

### Staging: `p3-interview-academy-staging`
- **Status**: ✅ Ready
- **Health**: ✅ Green
- **Version**: `staging-20251012-143433`
- **Last Updated**: 2025-10-12 15:46:30 UTC
- **URL**: http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com

---

## 🔐 Environment Variables Comparison

| Variable | Production | Staging | Notes |
|----------|-----------|---------|-------|
| **NODE_ENV** | production | staging | ✅ Correct |
| **PORT** | (default 5000) | 5000 | ✅ Set explicitly in staging |
| **DATABASE_URL** | app_user_prod | app_user_staging | ✅ Separate databases |
| **SESSION_SECRET** | ✅ Set (48 chars) | ✅ Set (64 chars) | ✅ Both configured |
| **OPENAI_API_KEY** | ✅ Set (sk-proj-...) | ✅ Set (sk-proj-...) | ✅ Both configured |
| **SEALION_API_KEY** | "disabled" | ❌ Not set | ⚠️ Missing in staging |
| **WS_ALLOWED_ORIGINS** | "*" | "*" | ⚠️ Very permissive |
| **BYPASS_AUTH** | ❌ Not set (false) | ✅ true | ✅ Good for staging testing |
| **ADMIN_KEY** | ✅ adm-2f8f928c1bbc4c29 | ❌ Not set | ℹ️ Production only |
| **TEMP_AUTO_VERIFY** | ✅ true | ❌ Not set | ℹ️ Production only |
| **NODE_TLS_REJECT_UNAUTHORIZED** | 0 | ❌ Not set | ℹ️ Production only (TLS bypass) |
| **DEPLOY_SCHEMA** | true | ❌ Not set | ℹ️ Production only |
| **SCHEMA_DEPLOY_TIMESTAMP** | 2025-09-29T08:21:36.726Z | ❌ Not set | ℹ️ Production only |

### Email Configuration (SMTP)

| Variable | Production | Staging |
|----------|-----------|---------|
| **EMAIL_FROM** | support@bizelev8.ai | jevin@bizelev8.ai |
| **EMAIL_FROM_NAME** | P3 Interview Academy | P3 Interview Academy Staging |
| **SMTP_HOST** | smtp.gmail.com | smtp.gmail.com |
| **SMTP_PORT** | 587 | 587 |
| **SMTP_USER** | support@bizelev8.ai | jevin@bizelev8.ai |
| **SMTP_PASS** | lcgzwwzvxgmoovxc | uhdzvjjqqqrigjfz |
| **SMTP_SECURE** | false | ❌ Not set |
| **SMTP_SELF_TEST_TO** | robinbilly@gmail.com | ❌ Not set |

### Application URLs

| Variable | Production | Staging |
|----------|-----------|---------|
| **APP_URL_PROD** | https://p3app.bizelev8.ai | http://...-staging...elasticbeanstalk.com |
| **APP_URL_DEV** | ❌ Not set | http://...-staging...elasticbeanstalk.com |

---

## ⚠️ Key Findings & Issues

### Critical Issues
1. **Intermittent HTTP 4xx Errors** (Both Environments)
   - Production: Multiple transitions between Ok ↔ Severe (100% 4xx errors)
   - Last occurrence: 2025-10-22 01:35 UTC
   - **Action Required**: Investigate root cause of 4xx errors

### Configuration Issues
2. **SEALION_API_KEY Missing in Staging**
   - Production: Set to "disabled"
   - Staging: Not configured at all
   - **Impact**: Staging may behave differently than production for AI features
   - **Recommendation**: Set to "disabled" in staging to match production

3. **WS_ALLOWED_ORIGINS Too Permissive**
   - Both environments: Set to "*" (allows all origins)
   - **Security Risk**: WebSocket CORS wide open
   - **Recommendation**: Restrict to specific domains:
     ```
     https://www.bizelev8.ai,https://bizelev8.ai,https://p3app.bizelev8.ai,http://p3-interview-academy-staging.eba-wdmrjtn2.ap-southeast-1.elasticbeanstalk.com
     ```

4. **NODE_TLS_REJECT_UNAUTHORIZED=0 in Production**
   - **Security Risk**: Disables SSL certificate validation
   - **Impact**: Man-in-the-middle attack vulnerability
   - **Recommendation**: Remove this setting and fix underlying certificate issues

5. **Missing Environment Parity**
   - Staging missing several production variables:
     - ADMIN_KEY
     - TEMP_AUTO_VERIFY
     - DEPLOY_SCHEMA
     - SMTP_SECURE
     - SMTP_SELF_TEST_TO
   - **Impact**: Staging behavior differs from production
   - **Recommendation**: Sync non-sensitive variables to staging

### Positive Findings ✅
- Both environments are Green/Ready
- Separate databases for prod/staging (good practice)
- Different OpenAI API keys (good for cost tracking)
- BYPASS_AUTH enabled in staging (good for testing)
- Separate email credentials for staging

---

## 🔧 Recommended Actions

### High Priority
1. **Investigate HTTP 4xx Errors**
   ```bash
   # Check application logs
   aws elasticbeanstalk retrieve-environment-info \
     --environment-name p3-interview-academy-prod-v2 \
     --info-type tail
   ```

2. **Fix Security Issues**
   ```bash
   # Remove TLS rejection bypass in production
   aws elasticbeanstalk update-environment \
     --environment-name p3-interview-academy-prod-v2 \
     --options-to-remove Namespace=aws:elasticbeanstalk:application:environment,OptionName=NODE_TLS_REJECT_UNAUTHORIZED

   # Restrict WebSocket CORS
   aws elasticbeanstalk update-environment \
     --environment-name p3-interview-academy-prod-v2 \
     --option-settings \
       Namespace=aws:elasticbeanstalk:application:environment,OptionName=WS_ALLOWED_ORIGINS,Value="https://www.bizelev8.ai,https://bizelev8.ai,https://p3app.bizelev8.ai"
   ```

3. **Add Missing Staging Variables**
   ```bash
   aws elasticbeanstalk update-environment \
     --environment-name p3-interview-academy-staging \
     --option-settings \
       Namespace=aws:elasticbeanstalk:application:environment,OptionName=SEALION_API_KEY,Value="disabled" \
       Namespace=aws:elasticbeanstalk:application:environment,OptionName=SMTP_SECURE,Value="false"
   ```

### Medium Priority
4. **Monitor Database Connectivity**
   - Staging showed database timeout in earlier health check
   - May be intermittent network issue
   - Monitor for recurring issues

5. **Review SMTP Configuration**
   - Production health check showed SMTP auth failure
   - May need to update Gmail app passwords
   - Consider using AWS SES instead of Gmail SMTP

### Low Priority
6. **Environment Variable Cleanup**
   - Document purpose of TEMP_AUTO_VERIFY
   - Consider removing if no longer needed
   - Document ADMIN_KEY usage

---

## 📝 GitHub Secrets Configuration

These secrets are required in your GitHub repository for CI/CD:

| Secret Name | Purpose | Status |
|-------------|---------|--------|
| AWS_ACCESS_KEY_ID | AWS authentication | ✅ Required |
| AWS_SECRET_ACCESS_KEY | AWS authentication | ✅ Required |
| AWS_ACCOUNT_ID | S3 bucket (417132395013) | ✅ Required |
| DATABASE_URL | PostgreSQL (prod) | ✅ Required |
| SESSION_SECRET | Session encryption | ✅ Required |
| OPENAI_API_KEY | AI service | ✅ Required |

---

## 🚀 Next Steps

1. **Immediate**: Investigate and fix intermittent 4xx errors
2. **Security**: Remove NODE_TLS_REJECT_UNAUTHORIZED from production
3. **Security**: Restrict WS_ALLOWED_ORIGINS to known domains
4. **Configuration**: Add SEALION_API_KEY=disabled to staging
5. **Monitoring**: Set up CloudWatch alarms for health transitions
6. **Documentation**: Document all environment variables and their purposes

---

## 📞 Support Information

- AWS Account: 417132395013
- IAM User: bizelev8DevOps
- Region: ap-southeast-1 (Singapore)
- Application: p3-interview-academy
