import "server-only";
import { applyProgress, type ProgressInput } from "@/features/learn/progress";
import type { Progress, ProgressMap } from "@/features/learn/types";
import { getDb, transaction } from "@/lib/server/db";

/*
 * Lesson progress in the database (table tutorial_progress, lib/server/db.ts): one row per account
 * and lesson, the last position and whether it's watched. Prepared statements only.
 */

type Row = { lesson: string; position: number; duration: number; watched: number; watched_at: number | null; updated_at: number };

const toProgress = (r: Row): Progress => ({ position: r.position, duration: r.duration, watched: r.watched === 1, updatedAt: r.updated_at });

/** Every lesson this account has touched. */
export function progressFor(userId: string): ProgressMap {
  const rows = getDb()
    .prepare("SELECT lesson, position, duration, watched, watched_at, updated_at FROM tutorial_progress WHERE user_id = ?")
    .all(userId) as unknown as Row[];
  const out: ProgressMap = {};
  for (const r of rows) out[r.lesson] = toProgress(r);
  return out;
}

/** When each watched lesson was finished (ms), for the streak in the profile. */
export function watchedDates(userId: string): number[] {
  const rows = getDb()
    .prepare("SELECT watched_at FROM tutorial_progress WHERE user_id = ? AND watched = 1 AND watched_at IS NOT NULL")
    .all(userId) as unknown as { watched_at: number }[];
  return rows.map((r) => r.watched_at);
}

/** Saves a report from the player (or a «Просмотрено» click) and returns the new state. */
export function saveProgress(userId: string, lesson: string, input: ProgressInput): Progress {
  const db = getDb();
  return transaction(db, () => {
    const prev = db
      .prepare("SELECT lesson, position, duration, watched, watched_at, updated_at FROM tutorial_progress WHERE user_id = ? AND lesson = ?")
      .get(userId, lesson) as unknown as Row | undefined;
    const now = Date.now();
    const next = applyProgress(prev ? toProgress(prev) : undefined, input, now);
    // The day it was first finished stays (a re-watch doesn't move it); un-marking clears it
    const watchedAt = next.watched ? (prev?.watched === 1 && prev.watched_at ? prev.watched_at : now) : null;
    db.prepare(
      `INSERT INTO tutorial_progress (user_id, lesson, position, duration, watched, watched_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (user_id, lesson) DO UPDATE SET
         position = excluded.position,
         duration = excluded.duration,
         watched = excluded.watched,
         watched_at = excluded.watched_at,
         updated_at = excluded.updated_at`,
    ).run(userId, lesson, next.position, next.duration, next.watched ? 1 : 0, watchedAt, now);
    return next;
  });
}
