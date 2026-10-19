"use client";

import { useMemo, useSyncExternalStore } from "react";
import { applyProgress, type ProgressInput } from "@/features/learn/progress";
import type { Progress, ProgressMap } from "@/features/learn/types";

/*
 * Progress in the browser. A page comes with the account's progress from the server; whatever the
 * player reports in this tab is kept here too and wins when it's newer. So the catalog shows a
 * lesson's new state right away — even when the router brings it back from its cache on «Назад».
 * The server is told in the background (/api/learn/progress); a failed report is simply lost, the
 * next one carries the newer position anyway.
 */

const EMPTY: ProgressMap = {};
let local: ProgressMap = EMPTY;
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** The server's progress with this tab's newer reports over it. */
export function useProgress(server: ProgressMap): ProgressMap {
  const mine = useSyncExternalStore(
    subscribe,
    () => local,
    () => EMPTY,
  );
  return useMemo(() => {
    if (mine === EMPTY) return server;
    const out = { ...server };
    for (const [slug, p] of Object.entries(mine)) {
      if (!out[slug] || out[slug].updatedAt <= p.updatedAt) out[slug] = p;
    }
    return out;
  }, [server, mine]);
}

/**
 * Records a report and sends it. `prev` — the state shown now (so the change is the same one the
 * server will make). `keepalive`: still delivered while the page is closing.
 */
export function reportProgress(slug: string, prev: Progress | undefined, input: ProgressInput): Progress {
  const base = local[slug] && (!prev || local[slug].updatedAt >= prev.updatedAt) ? local[slug] : prev;
  const next = applyProgress(base, input, Date.now());
  local = { ...local, [slug]: next };
  for (const listener of listeners) listener();
  fetch("/api/learn/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lesson: slug, ...input }),
    credentials: "same-origin",
    keepalive: true,
  }).catch(() => {});
  return next;
}
