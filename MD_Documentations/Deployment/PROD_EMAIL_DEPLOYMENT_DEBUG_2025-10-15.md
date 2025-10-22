# Production Email Deployment Debug Log — 2025-10-15/16

This document records the investigation, fixes, and verification steps taken to restore the AWS Elastic Beanstalk production deployment and verify the email functionality.

## Summary

- Deployment now healthy: Environment `p3-interview-academy-prod-v2` is Ready/Green and serving `/api/health`.
- Root cause of 502: A hardcoded `PORT: 5000` in EB config conflicted with the platform-assigned port. Fixed by removing the override.
- Zip bundle issue: Windows-created zip used backslashes; EB `unzip` failed. Fixed by using the POSIX pack script.
- SMTP status: Application is up; SMTP verify fails with `EAUTH (AUTH PLAIN)`. Email sending remains blocked until credentials are corrected.
- 2025-10-16: Rotated `SMTP_PASS` with the new value provided (normalized to remove spaces). SMTP verify still fails with `EAUTH`, indicating credentials/policy are not accepted by Gmail SMTP.

## Timeline / Actions

1) Identified that production environment was unhealthy and public endpoints were returning 502.
2) Found EB configuration override in `.ebextensions/01-nodejs.config` which set `PORT: 5000`.
3) Removed `PORT` override so Node listens on platform-provided port (`process.env.PORT`).
4) Built deployment bundle and redeployed. Initially used Windows `Compress-Archive`, which caused EB unzip errors due to backslashes in the archive.
5) Switched to `npm run bundle:posix` (script: `scripts/pack/create-posix-zip.js`) to produce a POSIX-compliant zip.
6) Uploaded the bundle to S3 and created a new EB application version. Updated environment to the new version.
7) Verified environment reached Ready/Green and `/api/health` returned OK with database healthy.
8) Verified email diagnostics endpoints — SMTP auth failing with `EAUTH cmd=AUTH PLAIN`.
9) 2025-10-16: Updated `SMTP_PASS` in EB environment with new value (spaces removed). Environment updated successfully, app stayed healthy. Re-tested SMTP diagnostics — still `EAUTH` failure.

## Details

### 1. EB Port Misconfiguration (Resolved)

- File: `.ebextensions/01-nodejs.config`
- Problem: `PORT: 5000` was set under `aws:elasticbeanstalk:application:environment`.
- Effect: The Node process listened on 5000 while the EB Node platform expected the assigned port (e.g., 8081), leading to 502 from the load balancer.
- Fix: Removed the `PORT` line. App now binds to `process.env.PORT` from EB.

### 2. Zip Archive Extraction Failures (Resolved)

- Symptom in logs: `eb-engine.log` showed unzip failures with message "appears to use backslashes as path separators".
- Cause: Windows `Compress-Archive` produced a zip with `\` separators. EB `unzip` failed to stage the app.
- Fix: Use the provided POSIX packer: `npm run bundle:posix` (generates `deployment-YYYYMMDD-HHMMSS.zip` with `/` separators).

### 3. SMTP Authentication Failure (Outstanding)

- Endpoints (`/api/auth/diag-email`, `/api/health/email`, `/api/diagnostics/email`) report:
  - `{"ok":false,"message":"SMTP verify failed (host=smtp.gmail.com, from=support@bizelev8.ai) code=EAUTH cmd=AUTH PLAIN"}`
- Likely causes:
  - Incorrect Gmail/Workspace app password for `SMTP_USER`.
  - Account security/app password not configured for SMTP.
  - Requirement to use OAuth2 instead of basic auth.
- Current prod env snapshot (names only): `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM`, `EMAIL_FROM_NAME` are set.
  - Note: `TEMP_AUTO_VERIFY=true` in prod skips verification emails on signup. Password reset emails will still attempt to send and currently fail with EAUTH.

#### 2025-10-16 Update

- Action: Rotated `SMTP_PASS` in EB env using the value provided and normalized (removed whitespace).
- Result: Environment updated; app health remained Green. SMTP diagnostics still fail with `EAUTH (AUTH PLAIN)`.
- Conclusion: The new value is not an accepted Gmail app password for SMTP, or the account requires different auth (e.g., reissue app password or switch to OAuth2/SES).

### 4. Security Notes

- `NODE_TLS_REJECT_UNAUTHORIZED=0` is present in prod env; consider removing for production security.
- Secrets appear correctly stored as environment variables; do not commit to code or docs.

## Verification Steps (Post‑Fix)

After the redeploy:

- Health
  - `GET /api/health` → 200 OK, status `ok`, DB healthy
  - `GET /api/health/simple` → 200 OK

- Email diagnostics
  - `GET /api/auth/diag-email` → fails with EAUTH (auth issue only, transport reachable)

- Auth flows
  - `POST /api/auth/signup` → succeeds; with `TEMP_AUTO_VERIFY=true`, user created and verification email is not sent.
  - `POST /api/auth/forgot-password` → 500 due to SMTP EAUTH failure.

### 2025-10-16 Verification Addendum

- After rotating `SMTP_PASS`, re-ran:
  - `GET /api/auth/diag-email` → `{"ok":false,"message":"SMTP verify failed (host=smtp.gmail.com, from=support@bizelev8.ai) code=EAUTH cmd=AUTH PLAIN"}`
  - `GET /api/health/email` → same as above
  - Health endpoints remained OK; application served traffic normally.

## Next Actions

1) Fix SMTP credentials or switch provider:
   - Confirm Google Workspace app password for `support@bizelev8.ai` and update `SMTP_PASS`.
   - Or migrate to Amazon SES in `ap-southeast-1` and update env vars accordingly.

2) Once SMTP is working:
   - Optionally set `TEMP_AUTO_VERIFY=false` to enable verification emails on signup.
   - Re-test `/api/auth/diag-email`, signup, verification link, and forgot/reset password flows.

3) Optional hardening:
   - Remove `NODE_TLS_REJECT_UNAUTHORIZED=0` in prod.
   - Rotate any credentials present in historical commits (already addressed in recent commit but worth re‑validating).

## Commands Used (for future maintenance)

```
# Build POSIX zip
npm run bundle:posix

# Upload bundle
aws s3 cp deployment-YYYYMMDD-HHMMSS.zip s3://elasticbeanstalk-ap-southeast-1-<ACCOUNT_ID>/p3-interview-academy/

# Create app version and deploy
aws elasticbeanstalk create-application-version \
  --application-name p3-interview-academy \
  --version-label deployment-YYYYMMDD-HHMMSS \
  --source-bundle S3Bucket=elasticbeanstalk-ap-southeast-1-<ACCOUNT_ID>,S3Key=p3-interview-academy/deployment-YYYYMMDD-HHMMSS.zip

aws elasticbeanstalk update-environment \
  --environment-name p3-interview-academy-prod-v2 \
  --version-label deployment-YYYYMMDD-HHMMSS

# Check environment
aws elasticbeanstalk describe-environments --environment-names p3-interview-academy-prod-v2
```

## 2025-10-17 Update — Gmail SMTP EAUTH (support@bizelev8.ai)

Context:
- Staging previously worked using `jevin@bizelev8.ai` with a Gmail App Password.
- Production uses `support@bizelev8.ai`. Health is Green; SMTP diagnostics fail with `EAUTH (AUTH PLAIN)`.
- New 16‑character App Password was generated for `support@bizelev8.ai` (value not stored in repo).

Observed behaviour:
- Local verifier: connectivity OK to `smtp.gmail.com` on ports 587/465, but local script reports `ESOCKET/CONN` from this machine (non‑prod); not authoritative.
- Production diagnostics endpoints:
  - `/api/auth/diag-email` and `/api/health/email` return `EAUTH (AUTH PLAIN)` — Gmail rejects authentication.
- This indicates credentials/policy rejection, not a network issue.

Likely causes (differences vs staging):
- Account type: `support@bizelev8.ai` must be a full mailbox user. Google Groups/aliases cannot authenticate via SMTP.
- 2‑Step Verification / App Password: Must be enabled for `support@`. App Password (16 chars) must be created for “Mail”.
- Org policy: SMTP AUTH may be disabled for the OU/user. Jevin’s user may be allowed while support@ is blocked.
- Mismatch: `SMTP_USER` and `EMAIL_FROM` must both be `support@bizelev8.ai` to avoid provider checks failing.
- Org requirement: Some orgs enforce OAuth‑only; basic SMTP AUTH will be rejected with EAUTH.

Actions taken:
- Verified production reaches Gmail; failures are `EAUTH`, not connectivity.
- Retried with newly generated App Password (normalized to remove spaces) — still `EAUTH` in prod.

Resolution checklist (to complete):
- [ ] Confirm `support@bizelev8.ai` is a licensed mailbox user (not a group/alias).
- [ ] Ensure 2‑Step Verification is ON for `support@` and create a Gmail App Password for “Mail”.
- [ ] In Google Admin, allow SMTP AUTH for the OU/user containing `support@`.
- [ ] (Optional) Ensure IMAP access is enabled for the account per org policy.
- [ ] Update Elastic Beanstalk env vars:
  - `SMTP_USER = support@bizelev8.ai`
  - `EMAIL_FROM = support@bizelev8.ai`
  - `SMTP_PASS = <16 chars, no spaces>`
- [ ] Re‑test production: `GET /api/auth/diag-email` should return ok.

Security notes:
- Do not persist app passwords in repository files. Store only in EB environment variables or a secrets manager.
- Code strips whitespace from `SMTP_PASS`, but set the 16‑character value without spaces in EB for clarity.

Fallback plan:
- If Gmail SMTP remains blocked by policy, migrate to Amazon SES (set `SMTP_HOST=email-smtp.<region>.amazonaws.com` with SES SMTP creds) and re‑test diagnostics.
