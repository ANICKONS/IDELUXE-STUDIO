"use client";

import { useEffect, useRef } from "react";
import { formatNumber } from "@/lib/format";

/** Count-up length, ms. */
const DURATION = 1400;
/** If the card's entrance never reports its start, count anyway after this, ms. */
const GIVE_UP = 6000;

/**
 * Counts up once when scrolled into view. Renders the final value on the server (no layout shift, SEO-friendly).
 * Inside a card that is still waiting for its entrance (`.arrive`: after a page switch, behind the
 * preloader) it holds at zero and starts the moment the card starts coming in, so the numbers run
 * while it lands — each card on its own, nothing waits for the whole page.
 */
export function StatCounter({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let timer = 0;
    let started = false;
    const card = el.closest<HTMLElement>(".arrive");

    const count = () => {
      if (started) return;
      started = true;
      window.clearTimeout(timer);
      card?.removeEventListener("animationstart", onStart);
      const start = performance.now();
      let written = 0;
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / DURATION);
        // ~30 updates a second read as a smooth count and keep the work light while the cards land
        if (t < 1) frame = requestAnimationFrame(tick);
        if (t < 1 && now - written < 30) return;
        written = now;
        const eased = 1 - Math.pow(1 - t, 4);
        el.textContent = formatNumber(Math.round(value * eased)) + suffix;
      };
      frame = requestAnimationFrame(tick);
    };
    const onStart = (e: AnimationEvent) => {
      if (e.target === card && e.animationName === "arrive") count();
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        // The card's entrance: still waiting (its delay, or paused under the preloader)?
        const entrance = card?.getAnimations().find((a) => (a as CSSAnimation).animationName === "arrive");
        const delay = Number(entrance?.effect?.getTiming().delay ?? 0);
        if (card && entrance && (entrance.playState === "paused" || Number(entrance.currentTime ?? 0) < delay)) {
          el.textContent = formatNumber(0) + suffix;
          card.addEventListener("animationstart", onStart);
          timer = window.setTimeout(count, GIVE_UP);
        } else count();
      },
      { threshold: 0.6 },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
      card?.removeEventListener("animationstart", onStart);
      cancelAnimationFrame(frame);
    };
  }, [value, suffix]);

  return (
    <span ref={ref} className="tabular-nums">
      {formatNumber(value)}
      {suffix}
    </span>
  );
}
