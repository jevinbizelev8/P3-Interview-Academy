# Staging Deployment TODO (Remaining Tasks)

Status: IN PROGRESS — track completion here. When all items are checked, flip STAGING_TEST_REPORT.md to COMPLETE.

## 1) Stripe Billing: Customer Portal (500)
- [ ] Ensure test user has a valid `stripeCustomerId` in DB (e.g., `qa+seed@example.com`).
  - [x] If missing, auto-create Stripe customer and persist ID (code updated).
- [ ] Fix `createCustomerPortalSession` errors and return 200 with URL
  - Code: `server/services/subscription-service.ts:236-266` (patched)
- [ ] Verify `GET /api/subscription/customer-portal` responds 200 and opens Billing Portal
- [ ] Record portal URL test outcome in the report

## 2) Stripe Webhooks: End-to-End (Dashboard)
- [ ] Confirm EB env has correct staging webhook secret in `STRIPE_WEBHOOK_SECRET`
- [ ] Verify raw-body middleware order for Stripe webhooks
  - Files: `server/index.ts`, `server/routes.ts:1956-1960` (`/api/webhooks/stripe`)
- [ ] From Stripe Dashboard (Test mode), send events to staging URL and expect 2xx:
  - [ ] `checkout.session.completed` (subscription)
  - [ ] `invoice.payment_succeeded`
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
  - [ ] `checkout.session.completed` (top-up) / `charge.succeeded`
- [ ] Verify DB effects:
  - [ ] `subscriptions` rows reflect status/period changes
  - [ ] `credit_transactions` created and balances updated
- [ ] Update the report with results and timestamps

## 3) Email Templates (8 total)
- [ ] Ensure SMTP/email provider env vars are set for staging
- [ ] Trigger and verify each template (content, variables, links):
  - [ ] Welcome / Account Created
  - [ ] Password Reset
  - [ ] Subscription Activated
  - [ ] Subscription Canceled
  - [ ] Payment Receipt (Subscription)
  - [ ] Payment Receipt (Top-up)
  - [ ] Low Credits Warning
  - [ ] Monthly Credit Reset Notice
- [ ] Check provider logs and mark pass/fail for each template in the report

## 4) Cron: Credit Reset
- [ ] Expose or use the admin/manual trigger as per DEPLOYMENT.md
- [ ] Run manual reset; verify:
  - [ ] `credit_transactions` contains reset entries for applicable users
  - [ ] User balances reflect new monthly allocation
- [ ] Confirm scheduled cron is enabled and visible in EB logs

## 5) UI/UX & Admin Smoke Tests
- [ ] Pricing page loads, plan costs match `credit_costs`
- [ ] Subscription checkout: session created, redirect works, returns success state
- [ ] Top-up checkout: session created, redirect works, credits increase
- [ ] Customer Portal redirect works (after Section 1 fix)
- [ ] Admin/usage dashboards render; no console errors

## 6) Database & Migrations
- [ ] All bootstrap scripts completed without errors (idempotent on re-run)
  - Scripts:
    - `deployment-scripts/util/bootstrap-staging-core.cjs`
    - `deployment-scripts/util/patch-users-columns.cjs`
    - `deployment-scripts/util/bootstrap-subscription-core.cjs`
    - `deployment-scripts/util/bootstrap-credit-costs.cjs`
- [ ] RDS connectivity healthy (SSL enabled; CA in place)
- [ ] Monitor for connection pool timeouts or auth errors

## 7) Environment & EB Health
- [ ] EB env vars finalized (no stale values)
  - [ ] `STRIPE_TEST_SECRET_KEY` is the corrected key
  - [ ] `STRIPE_PUBLISHABLE_KEY` set (test)
  - [ ] `STRIPE_WEBHOOK_SECRET` (staging) set
  - [ ] `DATABASE_URL` points to staging DB
- [ ] EB environment status remains Green; deploys use AllAtOnce with Min/Max=1
- [ ] Logs: no `StripeAuthenticationError`, no unhandled exceptions

## 8) Reporting & Sign‑off
- [ ] Update `MD_Documentations/Deployment/STAGING_TEST_REPORT.md` with latest pass/fail and notes
- [ ] Complete all items from the 46‑item checklist in DEPLOYMENT.md
- [ ] Flip the report status to COMPLETE and add completion timestamp
- [ ] Tag this TODO file as COMPLETE (commit note)

---

Owner: Deployment lead (you can assign initials per item)
Notes: Keep this file in sync with the staging test report. If any new defect appears, add a sub‑task here and reference log excerpts and request IDs.
