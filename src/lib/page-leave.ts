/**
 * "The page is about to change" signal. PageTransitions (features/transitions) announces the
 * destination as soon as a link is clicked, while the old page is still fading out, so the space
 * camera can start flying right away instead of after the swap. The last destination stays
 * readable (readLeaveTarget): the new page's first render happens before the URL changes.
 *
 * A tiny pub/sub like lib/video-hold.ts. No "use client": only client code imports it.
 */

type Listener = (pathname: string) => void;

const listeners = new Set<Listener>();
let target = { pathname: "", hash: "" };

export function announceLeave(pathname: string, hash = ""): void {
  target = { pathname, hash };
  for (const listener of listeners) listener(pathname);
}

/** Where the last link click leads (empty strings before the first one). */
export function readLeaveTarget(): { pathname: string; hash: string } {
  return target;
}

/** Returns the unsubscribe function. */
export function subscribeLeave(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
