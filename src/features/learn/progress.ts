import type { Progress } from "@/features/learn/types";

/*
 * Progress rules, shared by the server (progress.server.ts saves) and the browser (progress-store.ts
 * shows the change at once): one place decides when a lesson counts as watched.
 */

/** A lesson counts as watched once this share of it is behind. */
export const WATCHED_SHARE = 0.9;
/** Less than this into a lesson (s) isn't "started": a click on play by mistake. */
export const STARTED_AT = 5;

export type ProgressInput = { position?: number; duration?: number; watched?: boolean };

/** The next state after a report from the player (or a «Просмотрено» click). */
export function applyProgress(prev: Progress | undefined, input: ProgressInput, now: number): Progress {
  const duration = input.duration && input.duration > 0 ? input.duration : (prev?.duration ?? 0);
  const position = input.position ?? prev?.position ?? 0;
  const reached = duration > 0 && position >= duration * WATCHED_SHARE;
  return {
    position,
    duration,
    watched: input.watched ?? (Boolean(prev?.watched) || reached),
    updatedAt: now,
  };
}

/** 0–1: how much of it is seen (a watched lesson is full). */
export function shareOf(p: Progress | undefined, fallbackDuration = 0): number {
  if (!p) return 0;
  if (p.watched) return 1;
  const d = p.duration || fallbackDuration;
  return d > 0 ? Math.min(1, Math.max(0, p.position / d)) : 0;
}

/** Started and not finished: worth a «Продолжить». */
export function inProgress(p: Progress | undefined): p is Progress {
  return Boolean(p && !p.watched && p.position >= STARTED_AT);
}
