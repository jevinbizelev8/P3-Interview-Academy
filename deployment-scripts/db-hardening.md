DB Hardening Plan

Scope
- Apply safe improvements without rotating credentials now.
- Prepare a clean path to stronger isolation and future rotation.

Completed
- RDS SG tightened: removed 0.0.0.0/0 on 5432; added current admin /32; EB SG access preserved.
- Staging DATABASE_URL aligned with production and uses sslmode=require.

Next Steps (Recommended)
- Tag temporary admin IP rules with descriptions and set a review reminder (60 days).
- Create per-environment DB users with least privilege.
- Migrate DB secrets to AWS Secrets Manager or SSM Parameter Store.
- Plan RDS private-subnet migration (PubliclyAccessible=false).

Per-Environment Users (PostgreSQL)
-- Connect as an admin role:
-- CREATE ROLE app_user_prod LOGIN PASSWORD '<strong-password>';
-- CREATE ROLE app_user_staging LOGIN PASSWORD '<strong-password>';
-- Grant only needed privileges (example schema/table grants shown):
-- GRANT CONNECT ON DATABASE postgres TO app_user_prod;
-- GRANT USAGE ON SCHEMA public TO app_user_prod;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user_prod;
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user_prod;
-- Repeat for app_user_staging on the staging DB.

Switch App Credentials
- Update Elastic Beanstalk envs to use per-env users:
  - Prod: DATABASE_URL postgresql://app_user_prod:<password>@<endpoint>:5432/postgres?sslmode=require
  - Staging: DATABASE_URL postgresql://app_user_staging:<password>@<endpoint>:5432/postgres?sslmode=require
- Verify /api/health and basic DB flows.

Secrets Manager Integration (minimal)
1) Create a secret "p3/db/prod" with JSON:
   {"username":"app_user_prod","password":"<pwd>","host":"<endpoint>","port":5432,"database":"postgres"}
2) Grant EB instance role permission: secretsmanager:GetSecretValue on that secret (and KMS decrypt if needed).
3) Load at runtime:
   - Option A (bootstrap): add an .ebextensions command to fetch and export env vars before Node starts.
   - Option B (app init): fetch on server start using AWS SDK and populate DATABASE_URL.
4) Repeat for staging as "p3/db/staging".

RDS Private Subnets (overview)
- Ensure VPC has private subnets with NAT for outbound updates.
- Create or modify RDS to place in private subnets (PubliclyAccessible=false).
- Ensure EB instances can reach RDS SG-to-SG.
- Use SSM Session Manager, VPN, or a bastion for admin access.

Rotation Playbook (later)
1) Schedule maintenance window per env.
2) Rotate in DB first: ALTER USER ... WITH PASSWORD '...'; validate connections via admin client.
3) Immediately update EB DATABASE_URL; verify health.
4) Remove legacy credentials and update Secrets/Parameters.

