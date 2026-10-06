"use client";

import type { ReelId } from "@/config/media";

export const OPEN_REEL_EVENT = "idx:open-reel";

/** `origin` is the element the player window flies out of (and back into when closed). */
export type OpenReelDetail = { id: ReelId; origin: HTMLElement | null };

export function openReel(id: ReelId, origin: HTMLElement | null = null) {
  window.dispatchEvent(new CustomEvent<OpenReelDetail>(OPEN_REEL_EVENT, { detail: { id, origin } }));
}
