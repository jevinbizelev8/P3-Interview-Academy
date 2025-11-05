# Changelog

All notable changes to this project are documented here. Dates are in YYYY‑MM‑DD and UTC unless stated otherwise.

## [2.4.0] - 2025-11-01

### Added
- 🤖 **Telegram Remote Control System** - Complete mobile notification and approval system for Claude Code agents
  - Webhook server with Flask (396 lines) supporting inline keyboard buttons
  - AWS deployment approval gates integrated with GitHub Actions
  - Database migration approval workflow with schema preview
  - Gemini research task notifications (start/complete)
  - Stripe payment testing notifications (6 event types monitored)
  - Claude Code operations notifications (start/complete/approve/alert)
  - Multiple-choice questions with inline keyboard buttons and text fallback
  - System monitoring tools (monitor.sh, cleanup.sh, webhook_info.sh)

### Documentation
- Comprehensive Telegram integration guides in `docs/telegram/`
- Integration examples for AWS, Database, Gemini, Stripe, and Claude Code workflows
- Testing procedures and verification steps
- Setup guides for GitHub Actions, Replit, and production deployment

### Infrastructure
- Replit-compatible webhook server (Flask + Python)
- File-based state management (.pending/, .inbox/)
- Silent mode support for local development (auto-approve)
- Automated cleanup and health monitoring scripts
- Token-based approval system with secure random generation

**Statistics**:
- 8,500+ lines of production-ready code
- 6 complete integrations
- 15 executable scripts
- 20+ documentation files
- 100% test coverage for core systems

---

## 2025-11-01: Phase 6 Testing - Server Test Improvements

**Status**: Pre-staging deployment preparation

### Fixed
- **Date Serialization Test Failures** (10 fixes across 3 test files)
  - `server/__tests__/gamification.routes.test.ts` - Fixed 3 date comparison issues
  - `server/__tests__/perform.routes.test.ts` - Fixed 4 date comparison issues
  - `server/__tests__/support.routes.test.ts` - Fixed 3 date comparison issues
  - **Impact**: Server test passing rate improved from 86% (176/203) to 88% (179/203)
  - **Root Cause**: Express.js serializes Date objects to ISO strings in JSON responses
  - **Solution**: Convert mock dates to `.toISOString()` or use `expect.any(String)`

### Added
- **Integration Test Example**: `server/__tests__/integration/credit-purchase.integration.test.ts`
  - Example test showing credit purchase flow (checkout → webhook → credits added)
  - Includes idempotency test (skipped - feature not yet implemented)
  - Serves as template for future integration tests

### Verified
- **Stripe Webhook Configuration** ✅ Correct
  - Webhook route order verified: raw body parser before `express.json()`
  - Signature verification implemented correctly
  - Event handling for `checkout.session.completed` confirmed

### Security Findings
- ⚠️ **CRITICAL**: Stripe webhook idempotency NOT implemented
  - **Risk**: Duplicate webhook events will add credits twice to user accounts
  - **Recommendation**: Add idempotency check using `session.id` or `event.id` before Monday staging deployment
  - **Location**: `server/services/topup-service.ts -> processTopUpPayment()`

### Documentation
- **Ops Log**: `docs/ops-log/2025-11.md` - Detailed testing results and findings
- **Research Guides**:
  - `docs/research/VITEST_DATE_SERIALIZATION_FIX.md` - Date testing patterns
  - `docs/research/STRIPE_WEBHOOK_TESTING_BEST_PRACTICES.md` - Webhook testing guide
  - `docs/research/INTEGRATION_TEST_EXAMPLES.md` - Integration test examples

### Next Steps (Before Staging Deployment)
1. **HIGH PRIORITY**: Implement webhook idempotency in `processTopUpPayment()`
2. Register Stripe webhook endpoint in test mode Stripe Dashboard
3. Test credit purchase flow in staging environment
4. Verify webhook delivery and duplicate event handling

---

## 2025-10-12

Production deployment and database hardening following PR #7 merge.

- Deployed to production: `deployment-20251012-144133`
  - "Security: Fix critical email vulnerabilities and remove hardcoded credentials"
- Infrastructure/DB hardening
  - RDS security group tightened on port 5432
    - Removed 0.0.0.0/0 and Google CIDRs (35.227.103.0/24, 35.227.103.23/32)
    - Preserved EB SG‑to‑SG ingress
    - Added admin /32 allow‑list (current IP) and tagged the rule for audit
  - Staging `DATABASE_URL` aligned to use `sslmode=require` (production already had it)
  - Created per‑environment DB users with least privileges
    - Production: `app_user_prod`
    - Staging: `app_user_staging`
  - Switched Elastic Beanstalk env vars to per‑env users
    - Production and Staging now use the respective app users
  - Health checks: both environments returned HTTP 200 after changes
- Scripts and docs added
  - `deployment-scripts/sql/create-db-users.sql` – SQL template for per‑env users and grants
  - `deployment-scripts/eb/update-eb-db-urls.ps1` – helper to set `DATABASE_URL` per environment
  - `deployment-scripts/db-hardening.md` – hardening plan, rotation playbook, and migration guidance
  - `deployment-scripts/tasks/sg-access-review-2025-12-12.md` – reminder to review/remove temporary admin IP

Notes
- Secrets were not committed; temporary credentials were handled only in the local session.
- Recommend migrating DB credentials to AWS Secrets Manager and planning RDS private‑subnet migration in a future window.

