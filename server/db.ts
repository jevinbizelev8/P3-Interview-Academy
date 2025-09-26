import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzleNeon, type NeonDatabase } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import { Pool as PgPool } from 'pg';
import { drizzle as drizzlePg, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const connectionString = process.env.DATABASE_URL;
const env = process.env as Record<string, string | undefined>;
const DB_CLIENT_ENV_KEY = "DB_CLIENT";

const resolveDriver = (): 'neon' | 'pg' => {
  const explicit = env[DB_CLIENT_ENV_KEY]?.toLowerCase();
  if (explicit === 'neon' || explicit === 'pg') {
    return explicit;
  }

  try {
    const hostname = new URL(connectionString).hostname;
    return hostname.endsWith('.neon.tech') ? 'neon' : 'pg';
  } catch (error) {
    console.warn('Failed to parse DATABASE_URL, defaulting to pg driver', error);
    return 'pg';
  }
};

type DatabaseClient =
  | { pool: NeonPool; db: NeonDatabase<typeof schema>; isNeon: true }
  | { pool: PgPool; db: NodePgDatabase<typeof schema>; isNeon: false };

const createNeonClient = (url: string): DatabaseClient => {
  neonConfig.webSocketConstructor = ws;
  const pool = new NeonPool({ connectionString: url });
  const db = drizzleNeon({ client: pool, schema });
  return { pool, db, isNeon: true };
};

const createPostgresClient = (url: string): DatabaseClient => {
  const pool = new PgPool({
    connectionString: url,
    ssl: env['DB_SSL'] === 'false' ? false : { rejectUnauthorized: false },
  });
  const db = drizzlePg(pool, { schema });
  return { pool, db, isNeon: false };
};

const driver = resolveDriver();
const client: DatabaseClient = driver === 'neon'
  ? createNeonClient(connectionString)
  : createPostgresClient(connectionString);

export const pool = client.pool;
export const db = client.db;
export const isNeonDatabase = client.isNeon;

export async function executeQuery<T = any>(sql: string): Promise<T> {
  if (isNeonDatabase) {
    return (pool as NeonPool).query(sql) as Promise<T>;
  }
  return (pool as PgPool).query(sql) as Promise<T>;
}
