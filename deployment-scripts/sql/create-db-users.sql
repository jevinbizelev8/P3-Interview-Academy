-- Create per-environment app users with least privileges
-- Run as a superuser/DBA from a trusted workstation or bastion

-- Production user (adjust password)
CREATE ROLE app_user_prod LOGIN PASSWORD '<SET_STRONG_PASSWORD_HERE>';
GRANT CONNECT ON DATABASE postgres TO app_user_prod;
GRANT USAGE ON SCHEMA public TO app_user_prod;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user_prod;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user_prod;

-- Staging user (adjust password)
CREATE ROLE app_user_staging LOGIN PASSWORD '<SET_STRONG_PASSWORD_HERE>';
GRANT CONNECT ON DATABASE postgres TO app_user_staging;
GRANT USAGE ON SCHEMA public TO app_user_staging;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user_staging;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO app_user_staging;

-- If you have multiple schemas, repeat GRANTs per schema accordingly.

