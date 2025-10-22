# RDS SSL Hardening (Production)

Goal: Enable proper TLS verification for PostgreSQL without relying on `NODE_TLS_REJECT_UNAUTHORIZED=0`.

## Overview

The app uses `pg` (node-postgres). We added support for providing a CA certificate via environment variables so that TLS verification can be enforced safely.

Code changes:
- `server/db.ts`: looks for `DB_SSL_CA_B64` (base64) or `DB_SSL_CA` (PEM) and sets `ssl: { rejectUnauthorized: true, ca }`.
- `server/session-store.ts`: same behavior for the session store.

If no CA is provided and `DB_SSL !== 'false'`, the code will warn and fall back to `rejectUnauthorized: false` (legacy behavior) to avoid breaking production during rollout.

## Steps (AWS Elastic Beanstalk)

1) Get the Amazon RDS CA bundle

   Download the current RDS combined CA bundle (PEM). See AWS docs: "Using SSL/TLS to encrypt a connection to a DB instance".

   For ap-southeast-1, use the standard RDS 2019/2025 root chain from the AWS page.

2) Base64-encode the PEM and set as EB env var

   On your workstation:

   - Linux/macOS:
     `base64 -w 0 rds-combined-ca-bundle.pem > rds-ca.b64`

   - Windows PowerShell:
     `[Convert]::ToBase64String([IO.File]::ReadAllBytes('rds-combined-ca-bundle.pem')) | Out-File -Encoding ascii rds-ca.b64`

   Then update the EB environment:

   `aws elasticbeanstalk update-environment \
     --environment-name p3-interview-academy-prod-v2 \
     --option-settings Namespace=aws:elasticbeanstalk:application:environment,OptionName=DB_SSL_CA_B64,Value=$(cat rds-ca.b64)`

3) (Optional) Explicitly keep TLS on

   If you want to make intent explicit, set `DB_SSL=true`. The default is TLS on.

4) Remove insecure overrides

   After the app restarts cleanly and `/api/health` shows a healthy database check, remove:

   - `NODE_TLS_REJECT_UNAUTHORIZED`

   We already removed `PORT` override; EB assigns the port.

5) Validate

   - `GET /api/health` should return status `ok` and `checks.database.status` should be `healthy`.

## Notes

- You can also store the PEM directly using `DB_SSL_CA` (multi-line), but base64 is easier to manage in EB.
- Connection string should continue to include `?sslmode=require` if you previously set it; the driver uses the provided `ssl` config.

