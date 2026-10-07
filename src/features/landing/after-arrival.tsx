"use client";

import { useEffect, useState } from "react";
import { subscribeDeferredBlocks } from "@/lib/deferred-blocks";
import { readLeaveTarget } from "@/lib/page-leave";
import { readTransitHold, subscribeTransitHold } from "@/lib/transit-hold";

/** Hashes that land in the hero: the blocks below aren't needed for the jump. */
const HERO_HASHES = new Set(["", "#top"]);
/** Keys that scroll the page down. */
const SCROLL_KEYS = new Set(["ArrowDown", "PageDown", "End", " ", "Spacebar"]);

/**
 * Should this render wait? Only on a page switch to the landing that the camera flies (the old page
 * is easing away, lib/transit-hold.ts) and that lands in the hero. Never on the server, the first
 * load or a reload (the server HTML has everything), back/forward, or a jump to a block below
 * («Обо мне» from another page: the block must exist to scroll to it).
 */
function shouldWait() {
  return typeof window !== "undefined" && readTransitHold() && HERO_HASHES.has(readLeaveTarget().hash);
}

/**
 * The landing below its first screen. On a page switch these blocks — most of the page — are built
 * once the hero has come in with the camera: building them in the middle of the flight was the
 * longest stall of the whole switch. They don't make anyone wait, though: the moment the visitor
 * heads for them — a menu link to a block (HashLink → lib/deferred-blocks.ts), the wheel, a swipe,
 * a scroll key — they're built right away. Until then a screen-high spacer keeps the footer away.
 */
export function AfterArrival({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(() => !shouldWait());

  useEffect(() => {
    if (ready) return;
    let idle = 0;
    const now = () => setReady(true);
    const onKey = (e: KeyboardEvent) => {
      if (SCROLL_KEYS.has(e.key)) now();
    };
    const afterHold = () => {
      if (readTransitHold()) return;
      unsubscribeHold();
      // A quiet moment after the entrance (the hero's video and counters have just started)
      idle = window.requestIdleCallback ? window.requestIdleCallback(now, { timeout: 300 }) : window.setTimeout(now, 50);
    };
    const unsubscribeHold = subscribeTransitHold(afterHold);
    const unsubscribeAsk = subscribeDeferredBlocks(now);
    const intent = { passive: true } as const;
    window.addEventListener("wheel", now, intent);
    window.addEventListener("touchmove", now, intent);
    window.addEventListener("keydown", onKey);
    afterHold();
    return () => {
      unsubscribeHold();
      unsubscribeAsk();
      window.removeEventListener("wheel", now);
      window.removeEventListener("touchmove", now);
      window.removeEventListener("keydown", onKey);
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
    };
  }, [ready]);

  return ready ? children : <div aria-hidden className="min-h-svh" />;
}
