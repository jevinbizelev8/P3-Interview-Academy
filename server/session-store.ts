import session from "express-session";
import connectPg from "connect-pg-simple";
import type { PGStoreOptions } from "connect-pg-simple";

const PgStore = connectPg(session);

type StoreOverrides = Omit<PGStoreOptions, "pool" | "conString" | "conObject" | "pgPromise">;

export function createSessionStore(overrides: StoreOverrides = {}) {
  const sslOption = process.env.DB_SSL === "false" ? false : { rejectUnauthorized: false };

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
