"use client";

import { useEffect, useRef } from "react";
import { createPlanetTrees } from "@/features/new-year/planet-trees";
import { createSnow } from "@/features/new-year/snow";
import { readBackdropFrame, subscribeBackdropFrame, type BackdropFrame } from "@/lib/backdrop-frame";
import { readBootPhase, subscribeBoot } from "@/lib/boot";

/**
 * Snowfall over the planet and the fir trees standing on it (planet-trees.ts): one canvas inside
 * the Backdrop (its `children`), so the vignette and the film grain lie over it like over the planet.
 * No loop of its own: it draws on the backdrop's frames
 * (lib/backdrop-frame.ts), so it follows its pacing, stops with it (reel player open), gets a
 * single still frame with reduced motion and moves with its scroll drift and camera.
 * Shows up once the preloader opens, easing in as the camera comes down.
 */
export function Snowfall() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const snow = createSnow();
    const trees = createPlanetTrees();
    let w = 0;
    let h = 0;
    let dpr = 0;
    let shown = false;

    const onBoot = () => {
      if (shown || readBootPhase() === "loading") return;
      shown = true;
      canvas.style.opacity = "1";
    };

    const draw = (f: BackdropFrame) => {
      if (f.width !== w || f.height !== h || f.dpr !== dpr) {
        w = f.width;
        h = f.height;
        dpr = f.dpr;
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
        snow.resize(w, h);
      }
      // Under the preloader only still frames are worth drawing (with reduced motion it's the only one)
      if (!shown && !f.still) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      // The trees stand on the planet, far behind the falling snow
      trees.draw(ctx, f);
      snow.draw(ctx, f);
    };

    // The backdrop mounts first: draw its latest frame now (the only one with reduced motion)
    const first = readBackdropFrame();
    if (first) draw(first);
    const unsubscribeFrame = subscribeBackdropFrame(draw);
    const unsubscribeBoot = subscribeBoot(onBoot);
    onBoot();

    return () => {
      unsubscribeFrame();
      unsubscribeBoot();
    };
  }, []);

  return (
    <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 size-full opacity-0 transition-opacity duration-[2.4s] ease-out" />
  );
}
