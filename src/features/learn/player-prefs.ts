"use client";

import { useCallback, useSyncExternalStore } from "react";

/*
 * The player's remembered choices and what the browser can do, read without a hydration mismatch
 * (external stores: the server and the first render use the defaults, the browser's values follow
 * right after hydration).
 */

export const RATES = [0.75, 1, 1.25, 1.5, 1.75, 2] as const;
export type Rate = (typeof RATES)[number];

const RATE_KEY = "idx-learn-rate";
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
const never = () => () => {};

function readRate(): Rate {
  try {
    const v = Number(window.localStorage.getItem(RATE_KEY));
    return (RATES as readonly number[]).includes(v) ? (v as Rate) : 1;
  } catch {
    return 1;
  }
}

/** Playback speed, kept across lessons and visits (tutorials are often watched at 1.25–1.5×). */
export function useRate(): [Rate, (rate: Rate) => void] {
  const rate = useSyncExternalStore(subscribe, readRate, (): Rate => 1);
  const set = useCallback((v: Rate) => {
    try {
      window.localStorage.setItem(RATE_KEY, String(v));
    } catch {
      // Private mode: the choice simply isn't remembered
    }
    for (const listener of listeners) listener();
  }, []);
  return [rate, set];
}

/** Screen width in device pixels (capped at 2×), read once per page: picks the rendition. 0 on the server. */
let screenPx = 0;
function readScreenPx(): number {
  if (!screenPx) {
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    screenPx = connection?.saveData ? 1 : Math.round(window.innerWidth * Math.min(window.devicePixelRatio || 1, 2));
  }
  return screenPx;
}
export const useScreenPx = () => useSyncExternalStore(never, readScreenPx, () => 0);

const readPip = () => typeof document !== "undefined" && document.pictureInPictureEnabled === true;
/** The browser's own picture-in-picture is available. */
export const usePipSupport = () => useSyncExternalStore(never, readPip, () => false);
