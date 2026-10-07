import "server-only";
import { randomInt } from "node:crypto";
import { serverEnv } from "@/config/env.server";
import { FULL_PRO_MONTHS } from "@/content/plans";
import { getDb, transaction } from "@/lib/server/db";
import type { AccessInfo } from "@/types/session";

/*
 * Access of an account: entitlements (what was bought or given) and promo codes.
 * Only the server reads and writes them; the rules of what opens what are in lib/access-rules.ts.
 */

type Kind = "pack" | "lite" | "pro";
type Row = { kind: Kind; starts_at: number; ends_at: number | null };

/** Calendar months, in UTC; the 31st plus a month lands on the last day of a shorter month. */
export function addMonths(from: number, months: number): number {
  const d = new Date(from);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return d.getTime();
}

/** End of the unbroken run of periods that covers `now` (renewals start where the last one ends). */
function activeUntil(rows: Row[], kind: "lite" | "pro", now: number): number | null {
  let until = now;
  for (const r of rows.filter((r) => r.kind === kind && r.ends_at !== null && r.ends_at > now).sort((a, b) => a.starts_at - b.starts_at)) {
    if (r.starts_at > until) break;
    until = Math.max(until, r.ends_at!);
  }
  return until > now ? until : null;
}

function rowsOf(userId: string): Row[] {
  return getDb().prepare("SELECT kind, starts_at, ends_at FROM entitlement WHERE user_id = ?").all(userId) as Row[];
}

/** Access of an account when only its id is known (the bot's grants): reads the e-mail itself. */
export function getAccessFor(userId: string): AccessInfo {
  const row = getDb().prepare('SELECT email FROM "user" WHERE id = ?').get(userId) as { email: string } | undefined;
  return getAccess(userId, row?.email ?? "");
}

export function getAccess(userId: string, email: string): AccessInfo {
  const admin = serverEnv.adminEmails.includes(email.toLowerCase());
  const rows = rowsOf(userId);
  const now = Date.now();
  const liteUntil = activeUntil(rows, "lite", now);
  const proUntil = activeUntil(rows, "pro", now);
  return {
    tier: admin || proUntil ? "pro" : liteUntil ? "lite" : "free",
    pack: admin || rows.some((r) => r.kind === "pack"),
    liteUntil,
    proUntil,
    admin,
  };
}

export type Grant = "pack" | "lite" | "pro" | "full";

/**
 * Gives an account a plan. Subscriptions add `months` after the current period (or from now);
 * IDX FULL = the pack + PRO for FULL_PRO_MONTHS. `source` says where it came from (bot, promo, admin).
 */
export function grant(userId: string, plan: Grant, { months = 1, source, note }: { months?: number; source: string; note?: string }): void {
  const db = getDb();
  const insert = db.prepare("INSERT INTO entitlement (user_id, kind, starts_at, ends_at, source, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
  const now = Date.now();
  const period = (kind: "lite" | "pro", n: number) => {
    const start = activeUntil(rowsOf(userId), kind, now) ?? now;
    insert.run(userId, kind, start, addMonths(start, n), source, note ?? null, now);
  };
  transaction(db, () => {
    if (plan === "pack" || plan === "full") insert.run(userId, "pack", now, null, source, note ?? null, now);
    if (plan === "full") period("pro", FULL_PRO_MONTHS);
    if (plan === "lite" || plan === "pro") period(plan, months);
  });
}

/** Account id by e-mail (Better Auth keeps e-mails lowercase). */
export function findUserIdByEmail(email: string): string | null {
  const row = getDb().prepare('SELECT id FROM "user" WHERE email = ?').get(email.trim().toLowerCase()) as { id: string } | undefined;
  return row?.id ?? null;
}

/**
 * Account id by Telegram user id — the number the bot sees in a chat. Accounts created through
 * Telegram login store it as the account key (lib/server/auth.ts → accountSubject), so a purchase
 * in the bot needs no e-mail at all.
 */
export function findUserIdByTelegram(telegramId: string): string | null {
  const row = getDb()
    .prepare("SELECT userId AS id FROM account WHERE providerId = 'telegram' AND accountId = ?")
    .get(telegramId.trim()) as { id: string } | undefined;
  return row?.id ?? null;
}

/* ── Promo codes ── */

/** No look-alike characters (0/O, 1/I/L): codes are typed by hand. */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

/** Creates a code like IDX-7KQ4-M2XP. `maxUses` null — any number of accounts (each once). */
export function createPromoCode({
  kind,
  months,
  maxUses = 1,
  expiresAt = null,
  note,
}: {
  kind: "lite" | "pro";
  months: number;
  maxUses?: number | null;
  expiresAt?: number | null;
  note?: string;
}): string {
  const part = () => Array.from({ length: 4 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
  const insert = getDb().prepare("INSERT OR IGNORE INTO promo_code (code, kind, months, max_uses, expires_at, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
  // 31⁸ combinations: a clash is near impossible, but a clash must never reuse someone's code
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = `IDX-${part()}-${part()}`;
    if (insert.run(code, kind, months, maxUses, expiresAt, note ?? null, Date.now()).changes) return code;
  }
  throw new Error("Could not create a unique promo code");
}

export type RedeemResult =
  | { ok: true; kind: "lite" | "pro"; months: number }
  | { ok: false; reason: "invalid" | "expired" | "used_up" | "already" };

export function redeemPromoCode(userId: string, raw: string): RedeemResult {
  const code = normalizeCode(raw);
  if (!/^[A-Z0-9-]{4,32}$/.test(code)) return { ok: false, reason: "invalid" };
  const db = getDb();
  return transaction(db, (): RedeemResult => {
    const promo = db.prepare("SELECT kind, months, max_uses, uses, expires_at FROM promo_code WHERE code = ?").get(code) as
      | { kind: "lite" | "pro"; months: number; max_uses: number | null; uses: number; expires_at: number | null }
      | undefined;
    if (!promo) return { ok: false, reason: "invalid" };
    if (promo.expires_at !== null && promo.expires_at <= Date.now()) return { ok: false, reason: "expired" };
    if (db.prepare("SELECT 1 FROM promo_redemption WHERE code = ? AND user_id = ?").get(code, userId)) return { ok: false, reason: "already" };
    if (promo.max_uses !== null && promo.uses >= promo.max_uses) return { ok: false, reason: "used_up" };
    db.prepare("INSERT INTO promo_redemption (code, user_id, redeemed_at) VALUES (?, ?, ?)").run(code, userId, Date.now());
    db.prepare("UPDATE promo_code SET uses = uses + 1 WHERE code = ?").run(code);
    // The grant joins this transaction (nested BEGIN isn't allowed): insert directly
    const now = Date.now();
    const start = activeUntil(rowsOf(userId), promo.kind, now) ?? now;
    db.prepare("INSERT INTO entitlement (user_id, kind, starts_at, ends_at, source, note, created_at) VALUES (?, ?, ?, ?, 'promo', ?, ?)").run(
      userId,
      promo.kind,
      start,
      addMonths(start, promo.months),
      code,
      now,
    );
    return { ok: true, kind: promo.kind, months: promo.months };
  });
}
