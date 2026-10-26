"use client";

import type { Reel, ReelId } from "@/config/media";

export const OPEN_REEL_EVENT = "idx:open-reel";

/**
 * `reel` is one of the fixed reels (config/media.ts) or a reel built on the fly (an edit of the hero
 * feed). `origin` is the element the player window flies out of (and back into when closed).
 */
export type OpenReelDetail = { reel: ReelId | Reel; origin: HTMLElement | null };

export function openReel(reel: ReelId | Reel, origin: HTMLElement | null = null) {
  window.dispatchEvent(new CustomEvent<OpenReelDetail>(OPEN_REEL_EVENT, { detail: { reel, origin } }));
}
