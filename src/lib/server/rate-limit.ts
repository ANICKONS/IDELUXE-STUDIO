import "server-only";
import { createHash } from "node:crypto";

/**
 * Fixed-window daily counter kept in the server's memory.
 *
 * Good enough for one Node process (`next start` on a VPS). On serverless or with several
 * instances every instance counts separately and a restart resets the counters, so before a
 * public launch move the counter to a shared store (Postgres, Redis) behind the same interface.
 */

type Bucket = { day: string; count: number };

const buckets = new Map<string, Bucket>();
const MAX_KEYS = 50_000;
/** Per-process salt: the map only needs a stable key, never the IP itself. */
const SALT = createHash("sha256").update(`${process.pid}:${Date.now()}:${Math.random()}`).digest("hex");

const today = () => new Date().toISOString().slice(0, 10);

export function hashKey(value: string): string {
  return createHash("sha256").update(`${SALT}:${value}`).digest("hex").slice(0, 32);
}

/** Counts one hit for `key`. Returns whether it's within `limit` for the current UTC day. */
export function consumeDailyQuota(key: string, limit: number): { allowed: boolean; remaining: number } {
  const day = today();
  // Keep memory bounded: drop yesterday's buckets, then the oldest ones (a Map iterates in insertion
  // order). Never clear everything — a flood of fake keys must not reset everyone's counters.
  if (buckets.size >= MAX_KEYS) {
    for (const [k, b] of buckets) if (b.day !== day) buckets.delete(k);
    for (const k of buckets.keys()) {
      if (buckets.size < MAX_KEYS * 0.9) break;
      if (k !== key) buckets.delete(k);
    }
  }
  const bucket = buckets.get(key);
  const count = bucket && bucket.day === day ? bucket.count + 1 : 1;
  // Re-insert, so a key in use moves to the end of the eviction order
  buckets.delete(key);
  buckets.set(key, { day, count });
  return { allowed: count <= limit, remaining: Math.max(0, limit - count) };
}
