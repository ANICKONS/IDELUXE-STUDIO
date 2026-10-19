"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { OS } from "@/content/resource-taxonomy";

/*
 * The visitor's system (Windows / macOS / both) outlives the page: kept in localStorage, and until
 * picked it's guessed from the browser. An external store (useSyncExternalStore): the server and the
 * first render use "all", the browser's value follows right after hydration without a mismatch.
 */

export type OsPref = "all" | OS;

const KEY = "idx-res-os";
const listeners = new Set<() => void>();

function read(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

/** Windows or a Mac by the browser's platform; anything else (phones, Linux) — both. */
function detectOs(): OsPref {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const platform = (nav.userAgentData?.platform || nav.platform || "").toLowerCase();
  if (platform.startsWith("win")) return "win";
  if (platform.startsWith("mac") && navigator.maxTouchPoints < 2) return "mac";
  return "all";
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export function useOsPref(): [OsPref, (value: OsPref) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => {
      const v = read();
      return v === "all" || v === "win" || v === "mac" ? v : detectOs();
    },
    (): OsPref => "all",
  );
  const set = useCallback((v: OsPref) => {
    try {
      window.localStorage.setItem(KEY, v);
    } catch {
      // Private mode: the choice simply isn't remembered
    }
    for (const listener of listeners) listener();
  }, []);
  return [value, set];
}
