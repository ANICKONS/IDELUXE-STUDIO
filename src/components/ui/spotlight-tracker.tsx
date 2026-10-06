"use client";

import { useEffect } from "react";

/**
 * One global listener that makes every `.glass` surface catch light under the cursor.
 * Cheaper than attaching handlers to each card.
 */
export function SpotlightTracker() {
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    let active: HTMLElement | null = null;
    let frame = 0;

    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const target = (e.target as Element | null)?.closest?.(".glass") as HTMLElement | null;
        if (active && active !== target) active.style.setProperty("--spot", "0");
        active = target;
        if (!target) return;
        const rect = target.getBoundingClientRect();
        target.style.setProperty("--mx", `${e.clientX - rect.left}px`);
        target.style.setProperty("--my", `${e.clientY - rect.top}px`);
        target.style.setProperty("--spot", "1");
      });
    };

    const onLeave = () => {
      if (active) active.style.setProperty("--spot", "0");
      active = null;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return null;
}
