import { useEffect, useSyncExternalStore } from "react";
import type { Viewer } from "@/types/session";

/**
 * Who's signed in, in the browser: one request to /api/me per page load, shared by every component
 * (header, assistant, locks). Pages stay static and learn it after hydration; on the first load the
 * preloader covers that moment. "loading" until the answer: show the guest UI meanwhile.
 * Only a hint for the UI: the server checks the session itself on every protected request.
 */

type State = { status: "idle" | "loading" | "ready"; viewer: Viewer | null };

const SERVER: State = { status: "idle", viewer: null };
let state: State = SERVER;
const listeners = new Set<() => void>();

function set(next: State) {
  state = next;
  for (const listener of listeners) listener();
}

async function load() {
  set({ status: "loading", viewer: state.viewer });
  try {
    const res = await fetch("/api/me", { cache: "no-store", credentials: "same-origin" });
    const data = res.ok ? ((await res.json()) as { viewer: Viewer | null }) : { viewer: null };
    set({ status: "ready", viewer: data.viewer });
  } catch {
    set({ status: "ready", viewer: null });
  }
}

/** Asks /api/me again (e.g. after a promo code changed the access). */
export function refreshViewer(): Promise<void> {
  return load();
}

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export function useViewer(): State {
  const current = useSyncExternalStore(
    subscribe,
    () => state,
    () => SERVER,
  );
  useEffect(() => {
    if (state.status === "idle") void load();
  }, []);
  return current;
}
