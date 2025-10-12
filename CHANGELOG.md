# Changelog

All notable changes to this project are documented here. Dates are in YYYY‑MM‑DD and UTC unless stated otherwise.

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

