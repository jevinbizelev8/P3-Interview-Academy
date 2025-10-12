import { Client } from "pg";

async function run() {
  const host = process.env.DB_HOST;
  const port = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 5432;
  const database = process.env.DB_NAME || "postgres";
  const adminUser = process.env.DB_ADMIN_USER || "app_user";
  const adminPassword = process.env.DB_ADMIN_PASSWORD;
  const prodUser = process.env.DB_PROD_USER || "app_user_prod";
  const prodPass = process.env.DB_PROD_PASSWORD;
  const stagUser = process.env.DB_STAG_USER || "app_user_staging";
  const stagPass = process.env.DB_STAG_PASSWORD;

  if (!host || !adminPassword || !prodPass || !stagPass) {
    console.error("Missing required env: DB_HOST, DB_ADMIN_PASSWORD, DB_PROD_PASSWORD, DB_STAG_PASSWORD");
    process.exit(1);
  }

  const client = new Client({ host, port, database, user: adminUser, password: adminPassword, ssl: { rejectUnauthorized: false } });
  await client.connect();

  const sql = `
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${prodUser}') THEN
    CREATE ROLE ${prodUser} LOGIN PASSWORD '${prodPass}';
  ELSE
    ALTER ROLE ${prodUser} LOGIN PASSWORD '${prodPass}';
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = '${stagUser}') THEN
    CREATE ROLE ${stagUser} LOGIN PASSWORD '${stagPass}';
  ELSE
    ALTER ROLE ${stagUser} LOGIN PASSWORD '${stagPass}';
  END IF;
END$$;

GRANT CONNECT ON DATABASE ${database} TO ${prodUser};
GRANT USAGE ON SCHEMA public TO ${prodUser};
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${prodUser};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${prodUser};

GRANT CONNECT ON DATABASE ${database} TO ${stagUser};
GRANT USAGE ON SCHEMA public TO ${stagUser};
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${stagUser};
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${stagUser};
`;

  await client.query(sql);
  await client.end();
  console.log("Created/updated per-env users and grants.");
}

run().catch((e) => { console.error(e.message); process.exit(1); });

