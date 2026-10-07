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
    // The card's rect is read once per card (and again after a scroll/resize), not on every move
    let rect: DOMRect | null = null;
    let frame = 0;

    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        // data-no-spot: big panels (the editor) — the variables would restyle their whole subtree
        const found = (e.target as Element | null)?.closest?.(".glass") as HTMLElement | null;
        const target = found && !found.hasAttribute("data-no-spot") ? found : null;
        if (active && active !== target) active.style.setProperty("--spot", "0");
        if (active !== target) rect = null;
        active = target;
        if (!target) return;
        rect ??= target.getBoundingClientRect();
        target.style.setProperty("--mx", `${Math.round(e.clientX - rect.left)}px`);
        target.style.setProperty("--my", `${Math.round(e.clientY - rect.top)}px`);
        target.style.setProperty("--spot", "1");
      });
    };
    const forget = () => {
      rect = null;
    };

    const onLeave = () => {
      if (active) active.style.setProperty("--spot", "0");
      active = null;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("scroll", forget, { passive: true });
    window.addEventListener("resize", forget);
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("scroll", forget);
      window.removeEventListener("resize", forget);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return null;
}
