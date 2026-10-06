"use client";

import { useEffect, useRef } from "react";
import { createPlanet, drawPlanetFallback, planetGeometry } from "@/features/backdrop/planet";
import { createStarfield } from "@/features/backdrop/starfield";
import { readVideoHold, subscribeVideoHold } from "@/lib/video-hold";

/*
 * «Space» behind the whole site: a star sky and a huge planet rising from the bottom of the screen
 * (features/backdrop/planet.ts). The planet turns slowly on its own and much faster while the page
 * scrolls (smoothed, so a jump from the menu reads as a short spin-up); the pointer shifts the
 * view a little. One animation loop drives both canvases.
 */

/** Planet spin, rad: per second while idle, per scrolled pixel, and the cap per frame. */
const IDLE_SPIN = 0.01;
const SCROLL_SPIN = 0.0005;
const MAX_FRAME_SPIN = 0.03;
/** Clouds run a bit ahead of the ground: the layers part, the planet looks alive. */
const CLOUD_LEAD = 1.12;

export function SpaceScene() {
  const skyRef = useRef<HTMLCanvasElement>(null);
  const planetRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const sky = skyRef.current;
    const planetCanvas = planetRef.current;
    const ctx = sky?.getContext("2d");
    if (!sky || !planetCanvas || !ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const stars = createStarfield();
    // null → no WebGL: the sky canvas draws a flat silhouette instead
    const planet = createPlanet(planetCanvas);

    let w = 0;
    let h = 0;
    let dpr = 1;
    let spin = 0;
    let scrollTarget = window.scrollY;
    let scrollSmooth = scrollTarget;
    let lastScroll = scrollTarget;
    let mouseX = 0;
    let mouseTarget = 0;

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, w < 768 ? 1 : 1.5);
      sky.width = Math.round(w * dpr);
      sky.height = Math.round(h * dpr);
      stars.resize(w, h);
      planet?.resize(w, h);
    };

    let frame = 0;
    let last = 0;
    let running = false;

    /** `still`: a single frame (reduced motion, paused) — the planet bakes its map in one go. */
    const render = (now: number, still = false) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      const time = now / 1000;

      // Smooth scroll-driven spin (inertia) + idle drift; the direction never flips
      scrollSmooth += (scrollTarget - scrollSmooth) * Math.min(1, dt * 5);
      const dScroll = scrollSmooth - lastScroll;
      lastScroll = scrollSmooth;
      spin += IDLE_SPIN * dt + Math.min(MAX_FRAME_SPIN, Math.abs(dScroll) * SCROLL_SPIN);
      mouseX += (mouseTarget - mouseX) * Math.min(1, dt * 3);
      stars.tick(dt);

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      stars.draw(ctx, time, scrollSmooth, -mouseX * 14);

      const view = { spin, clouds: spin * CLOUD_LEAD + time * 0.002, shiftX: -mouseX * 10 };
      if (planet) planet.draw(view, still);
      else drawPlanetFallback(ctx, planetGeometry(w, h, view.shiftX));

      if (running) frame = requestAnimationFrame(render);
    };

    const start = () => {
      if (running || reduced || readVideoHold()) return;
      running = true;
      last = 0;
      frame = requestAnimationFrame(render);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };

    const onScroll = () => {
      scrollTarget = window.scrollY;
    };
    const onPointer = (e: PointerEvent) => {
      mouseTarget = (e.clientX / Math.max(1, w)) * 2 - 1;
    };
    const onResize = () => {
      resize();
      if (!running) render(performance.now(), true);
    };
    const onHold = () => (readVideoHold() ? stop() : start());

    resize();
    // First frame right away (the only one with reduced motion); when animating, the planet
    // bakes its map over the next few frames instead
    render(0, reduced || readVideoHold());
    start();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    if (finePointer && !reduced) window.addEventListener("pointermove", onPointer, { passive: true });
    const unsubscribe = subscribeVideoHold(onHold);

    return () => {
      stop();
      unsubscribe();
      planet?.dispose();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointer);
    };
  }, []);

  return (
    <>
      <canvas ref={skyRef} className="absolute inset-0 size-full" />
      {/* Covers only the lower part of the screen (the planet and its glow); fades in once baked */}
      <canvas ref={planetRef} className="absolute inset-x-0 w-full opacity-0 transition-opacity duration-[1.6s] ease-out" />
    </>
  );
}
