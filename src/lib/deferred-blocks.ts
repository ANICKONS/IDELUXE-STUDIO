/**
 * "Build the deferred blocks now" request. Right after a page switch the landing builds its blocks
 * below the first screen only once the hero has come in (features/landing/after-arrival.tsx); when
 * the visitor wants one of them sooner (a menu link to «Обо мне», HashLink), it asks for them here.
 *
 * A tiny pub/sub like lib/video-hold.ts. No "use client": only client code imports it.
 */

const listeners = new Set<() => void>();

export function requestDeferredBlocks(): void {
  for (const listener of listeners) listener();
}

/** Returns the unsubscribe function. */
export function subscribeDeferredBlocks(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
