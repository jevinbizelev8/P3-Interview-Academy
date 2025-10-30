# DEPLOYMENT.md  
Comprehensive hybrid deployment guide for **P3 Interview Academy**.  
**Version:** 2.0 (October 2025)  
**Maintainer:** AI Engineering Lead  

---

## 📋 Table of Contents
1. [Overview](#overview)  
2. [Architecture](#architecture)  
3. [GitHub Environments](#github-environments)  
4. [CI/CD Workflows](#cicd-workflows)  
5. [Deployment Procedures](#deployment-procedures)  
6. [Promotion & Review Flow](#promotion--review-flow)  
7. [Manual Deployment](#manual-deployment)  
8. [Failure Handling](#failure-handling)  
9. [Stripe HTTPS Configuration](#stripe-https-configuration)  
10. [Troubleshooting](#troubleshooting)  

---

## Overview

P3 Interview Academy uses a **hybrid CI/CD model** combining:
- **GitHub Actions** for orchestration and logging  
- **AWS CLI** (via OIDC) for secure deployments  
- **Codex Cloud** for AI-assisted triage and auto-fix PRs  
- **Manual review by the engineering lead** (you) before promotion to production  

Unlike older flows, there is **no formal GitHub approval gate**.  
You review staging with the founders offline, then promote to production yourself.

---

## Architecture

### Deployment Flow
```
Feature Branch → PR → Ephemeral Staging (optional)
                               ↓
Main Branch → Staging (Auto, HTTPS) → Smoke Tests → Manual Review → Promotion to Production
```

### Environments

| Environment | AWS EB Name | Deployment | Stripe Mode | Notes |
|--------------|-------------|-------------|--------------|-------|
| **Development** | Local | Manual | Test | `npm run dev` |
| **Staging** | p3-interview-academy-staging | Auto on merge | Test | HTTPS enforced |
| **Production** | p3-interview-academy-prod-v2 | Manual promote | Live | Manual review before deploy |

---

## GitHub Environments

### Setup

1. Navigate to **Settings → Environments**
2. Create two environments: `staging` and `production`

#### Staging
- **Protection:** none (auto-deploy)
- **AWS role:** `AWS_STAGING_ROLE_ARN`
- **Secrets:**
  - `DATABASE_URL`, `SESSION_SECRET`, `OPENAI_API_KEY`
  - `STRIPE_MODE=test`, `STRIPE_TEST_SECRET_KEY`, `STRIPE_TEST_PUBLISHABLE_KEY`
  - Any staging credentials
- **Branch:** `main`

#### Production
- **Protection:** none (manual trigger only)
- **AWS role:** `AWS_PROD_ROLE_ARN`
- **Secrets:**
  - Same keys as staging, plus live Stripe keys when ready:
    - `STRIPE_MODE=live`, `STRIPE_LIVE_SECRET_KEY`, `STRIPE_LIVE_PUBLISHABLE_KEY`
- **Branch:** `main`

> 🔒 OIDC is used — no long-lived AWS keys in secrets.

---

## CI/CD Workflows

Located in `.github/workflows/`:

| File | Purpose |
|------|----------|
| `ci-staging.yml` | Auto-deploy to staging on `main` |
| `promote.yml` | Promote tested artifact to production |
| `codex-review.yml` | Auto-trigger Codex on failures |
| `opslog-seed.yml` | Monthly ops log generation |

### Key Highlights
- Single **build artifact** shared between staging and production.  
- **Codex AI triage** on any failed or cancelled workflow.  
- HTTPS enforced on staging (for Stripe).  
- **No approval gates** — you promote manually.

---

## Deployment Procedures

### 1. Develop & Test Locally
```bash
npm run dev
npm run check
npm run test
```

### 2. Create PR
- Push to GitHub → auto PR deploy to staging.  
- PR comment includes staging URL and version.

### 3. Review & Verify Staging
- Access the **HTTPS staging URL**:
  - Example: `https://staging.p3academy.com`
- Verify Stripe test payments (`4242 4242 4242 4242`)
- Validate logs and API health endpoints.

### 4. Merge to `main`
- Auto-deploys to staging again.
- Smoke tests run (E2E, DB migration, health).
- Workflow uploads logs automatically.

### 5. Review with Founders (Offline)
- You and founders test the staging build.  
- Confirm readiness for production.

### 6. Promote to Production
Run manually via one of two ways:

**A) GitHub UI**
1. Go to **Actions → Promote workflow**
2. Input artifact SHA or version
3. Click “Run workflow”

**B) Comment trigger**
Comment anywhere:
```
/promote <sha>
```
(Your GitHub handle is authorized to trigger.)

---

## Promotion & Review Flow

| Step | Trigger | Result |
|------|----------|---------|
| Auto Deploy to Staging | Merge to `main` | `https://staging...` live |
| Manual Review | You + founders | Confirm readiness |
| `/promote <sha>` | Comment or manual trigger | Prod deploy |
| Post-deploy | Automated | Smoke tests + summary comment |
| Failure | Auto | Codex review with log artifacts |

### Codex Cloud Integration
- On any failure, workflow auto-comments:
  ```
  @codex review
  Artifacts: staging-logs-<run_id>
  Run: https://github.com/org/repo/actions/runs/<id>
  ```
- Codex analyzes logs and proposes a PR with fixes.

---

## Manual Deployment

Fallback only.

### Prerequisites
```bash
npm ci
aws configure sso   # or use OIDC assumed role
```

### Manual Staging Deployment
```bash
npm run build
bash deployment-scripts/create-deployment-bundle.sh
bash deployment-scripts/deploy-to-eb.sh staging
```

### Manual Production Deployment
```bash
npm run build
bash deployment-scripts/create-deployment-bundle.sh
bash deployment-scripts/deploy-to-eb.sh production
```

Verify:
```bash
curl https://p3-interview-academy-prod-v2.ap-southeast-1.elasticbeanstalk.com/api/health
```

---

## Failure Handling

| Situation | Action |
|------------|--------|
| Workflow stuck or cancelled | Auto-triggers Codex review |
| E2E timeout | Retry failed job only |
| DB migration stuck | Manually terminate session, retry |
| Docker push fails | Re-run from “build-package” |
| AWS EB health red | Roll back via `update-environment` |

Rollback example:
```bash
aws elasticbeanstalk update-environment   --environment-name p3-interview-academy-prod-v2   --version-label <PREVIOUS_VERSION_LABEL>
```

---

## Stripe HTTPS Configuration

Stripe requires **HTTPS** for all webhook and checkout URLs.  

| Requirement | Stage | Setting |
|--------------|--------|----------|
| Protocol | HTTPS only | Enforced by EB load balancer |
| TLS | ≥ 1.2 | AWS ACM cert |
| Mode | Test | Staging |
| Mode | Live | Production |
| Redirects | Both | Configured via `.ebextensions/01-https-redirect.config` |

**.ebextensions/01-https-redirect.config**
```yaml
option_settings:
  aws:elasticbeanstalk:environment:proxy:staticfiles:
    /: public
files:
  "/etc/nginx/conf.d/https_redirect.conf":
    content: |
      server {
        listen 80;
        return 301 https://$host$request_uri;
      }
```

---

## Troubleshooting

| Issue | Likely Cause | Solution |
|--------|---------------|-----------|
| “Waiting for approval” timeout | Old workflow | Use new hybrid flow (no approvals) |
| Codex not triggered | Comment failed | Check `codex-review.yml` step |
| Stripe checkout fails | HTTP staging URL | Switch to HTTPS |
| DB errors | Stale migrations | Rollback and rebuild |
| EB unhealthy | Instance init failed | View `eb logs --all` |

### Health Check URLs
- **Staging:** `https://p3-interview-academy-staging.../api/health`  
- **Production:** `https://p3-interview-academy-prod-v2.../api/health`

---

## Summary

This streamlined hybrid model provides:
✅ Secure OIDC-based AWS deployments  
✅ Single-artifact promotion  
✅ HTTPS staging for Stripe compliance  
✅ Manual but auditable promotion  
✅ Automatic AI triage via Codex Cloud  

---

**Last Updated:** 2025-10-29  
**Document Version:** 2.0 (Hybrid Codex CI/CD)
