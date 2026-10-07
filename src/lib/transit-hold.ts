/**
 * "A page switch is under way" signal: from the click on a link (PageTransitions: the old page
 * eases away) until the new page's blocks have landed with the space camera (SpaceScene: the
 * flight). Meanwhile the heavy work nobody is looking at waits — the hero editor's clock and
 * scopes, background videos, the stat counters, looping CSS animations in the hero — so the
 * frames go to the flight. Leaving a page stops it at once; on the new page it starts once the
 * entrance is over. Mirrored as html[data-transit] for CSS.
 *
 * A tiny external store like lib/video-hold.ts (works with useSyncExternalStore). No "use client":
 * only client code imports it, and the state only changes in effects and event handlers.
 */

let leaving = false;
let arriving = false;
let held = false;
let arrivalTimer = 0;
let queued = false;
const listeners = new Set<() => void>();

/**
 * Applied in a microtask: the old page's "leaving" ends and the new page's "arriving" starts in
 * the same commit (two layout effects) — subscribers only see the result, never a blink in between.
 */
function update() {
  if (queued) return;
  queued = true;
  queueMicrotask(() => {
    queued = false;
    const next = leaving || arriving;
    if (next === held) return;
    held = next;
    document.documentElement.toggleAttribute("data-transit", held);
    for (const listener of listeners) listener();
  });
}

export function readTransitHold(): boolean {
  return leaving || arriving;
}

/** PageTransitions: the old page starts easing away (true) / the new page is in or the switch failed (false). */
export function setLeaveHold(on: boolean): void {
  leaving = on;
  update();
}

/** SpaceScene: the new page's entrance takes `ms` more (0 = it's over / there is none). */
export function holdArrival(ms: number): void {
  window.clearTimeout(arrivalTimer);
  arriving = ms > 0;
  if (arriving)
    arrivalTimer = window.setTimeout(() => {
      arriving = false;
      update();
    }, ms);
  update();
}

/** Returns the unsubscribe function. */
export function subscribeTransitHold(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
