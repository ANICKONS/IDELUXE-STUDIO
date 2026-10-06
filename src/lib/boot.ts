/**
 * First-load sequence, shared by the preloader (features/preloader) and the space backdrop:
 *  - "loading": the preloader covers the page. html[data-boot] is set by the inline script in
 *    features/preloader/boot-script.tsx before the first paint;
 *  - "reveal": the preloader opens and the camera brings the planet into view;
 *  - "done": the site is on screen. Also the phase right away when there is no preloader
 *    (its failsafe already fired, or the code was hot-reloaded).
 * Plus one flag the preloader waits for: the backdrop has baked the planet and drawn a frame.
 *
 * A tiny external store like lib/video-hold.ts. No "use client": only client code reads it.
 */

export type BootPhase = "loading" | "reveal" | "done";

/** sessionStorage key: the preloader already ran in this tab, the next loads get a short version. */
export const BOOT_SEEN_KEY = "idx-boot";

let phase: BootPhase | null = null;
let backdropReady = false;
const listeners = new Set<() => void>();

const notify = () => {
  for (const listener of listeners) listener();
};

export function readBootPhase(): BootPhase {
  // Read lazily from the DOM: the inline script runs long before any module
  phase ??= typeof document !== "undefined" && document.documentElement.hasAttribute("data-boot") ? "loading" : "done";
  return phase;
}

export function setBootPhase(next: BootPhase): void {
  if (readBootPhase() === next) return;
  phase = next;
  notify();
}

export function isBackdropReady(): boolean {
  return backdropReady;
}

export function markBackdropReady(): void {
  if (backdropReady) return;
  backdropReady = true;
  notify();
}

/** Returns the unsubscribe function. */
export function subscribeBoot(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
