/**
 * Page-wide "hold" signal: while the reel player is open in theatre mode, background loops
 * (BackgroundVideo) and the space backdrop pause, so the GPU and the network serve the player.
 *
 * A tiny external store: works with useSyncExternalStore and plain subscriptions alike.
 * No "use client": only client components import it, and the state only changes in effects.
 */

let held = false;
const listeners = new Set<() => void>();

export function readVideoHold(): boolean {
  return held;
}

export function setVideoHold(next: boolean): void {
  if (next === held) return;
  held = next;
  for (const listener of listeners) listener();
}

/** Returns the unsubscribe function. */
export function subscribeVideoHold(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
