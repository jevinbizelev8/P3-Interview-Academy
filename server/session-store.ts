import session from "express-session";
import connectPg from "connect-pg-simple";
import type { PGStoreOptions } from "connect-pg-simple";

const PgStore = connectPg(session);

type StoreOverrides = Omit<PGStoreOptions, "pool" | "conString" | "conObject" | "pgPromise">;

function getPgSslConfig(): false | { rejectUnauthorized: boolean; ca?: string } {
  const env = process.env as Record<string, string | undefined>;
  if (env.DB_SSL === "false") return false;
  const caFromB64 = env.DB_SSL_CA_B64 ? Buffer.from(env.DB_SSL_CA_B64, "base64").toString("utf8") : undefined;
  const ca = caFromB64 || env.DB_SSL_CA;
  if (ca) {
    return { rejectUnauthorized: true, ca };
  }
  console.warn("[session-store] No DB SSL CA provided; using insecure TLS (rejectUnauthorized=false)");
  return { rejectUnauthorized: false };
}

export function createSessionStore(overrides: StoreOverrides = {}) {
  const sslOption = getPgSslConfig();

  const store = new PgStore({
    ...overrides,
    conObject: {
      connectionString: process.env.DATABASE_URL!,
      ...(sslOption === false ? { ssl: false } : { ssl: sslOption }),
    },
    createTableIfMissing: overrides.createTableIfMissing ?? true,
    tableName: overrides.tableName ?? "sessions",
    pruneSessionInterval: overrides.pruneSessionInterval ?? false,
  });

  store.on("error", (err: unknown) => {
    console.error("[session-store] error", err);
  });

  store.on("connect", () => {
    console.log("[session-store] connected to database");
  });

  return store;
}
