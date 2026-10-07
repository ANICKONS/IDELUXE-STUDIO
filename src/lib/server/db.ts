import "server-only";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { serverEnv } from "@/config/env.server";

/*
 * The site's database: one SQLite file (DATABASE_PATH) through Node's built-in driver — no server
 * to run, nothing native to compile. Fits one VPS (`next start`): WAL lets readers and a writer
 * work at once. Accounts and sessions are Better Auth's tables ("user", "session", "account",
 * "verification", lib/server/auth.ts); access and promo codes are ours (below).
 * Every query goes through prepared statements with `?` parameters, never string building.
 */

const cache = globalThis as unknown as { __idxDb?: DatabaseSync };

/** Opened lazily on first use (not at import: `next build` must not create the file). */
export function getDb(): DatabaseSync {
  if (cache.__idxDb) return cache.__idxDb;
  const file = resolve(/* turbopackIgnore: true */ process.cwd(), serverEnv.databasePath);
  mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec("PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000; PRAGMA synchronous = NORMAL;");
  // Kept across dev hot reloads, so the file isn't opened again on every edit
  cache.__idxDb = db;
  return db;
}

/**
 * Our tables, created if missing (run after Better Auth's migrations: they reference "user").
 *  - entitlement: one row per grant. `pack` never ends (ends_at NULL); `lite` / `pro` cover
 *    [starts_at, ends_at); a renewal starts where the previous period ends.
 *  - promo_code / promo_redemption: codes that grant a subscription period, each account once.
 * Change them only by adding: new tables, new nullable columns.
 */
export function migrateAppTables(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS entitlement (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      kind TEXT NOT NULL CHECK (kind IN ('pack', 'lite', 'pro')),
      starts_at INTEGER NOT NULL,
      ends_at INTEGER,
      source TEXT NOT NULL,
      note TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS entitlement_user ON entitlement (user_id, kind);

    CREATE TABLE IF NOT EXISTS promo_code (
      code TEXT PRIMARY KEY,
      kind TEXT NOT NULL CHECK (kind IN ('lite', 'pro')),
      months INTEGER NOT NULL CHECK (months BETWEEN 1 AND 36),
      max_uses INTEGER,
      uses INTEGER NOT NULL DEFAULT 0,
      expires_at INTEGER,
      note TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS promo_redemption (
      code TEXT NOT NULL REFERENCES promo_code(code) ON DELETE CASCADE,
      user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      redeemed_at INTEGER NOT NULL,
      PRIMARY KEY (code, user_id)
    );
  `);
}

/** Runs `fn` in one transaction (node:sqlite has no helper): all or nothing. */
export function transaction<T>(db: DatabaseSync, fn: () => T): T {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
