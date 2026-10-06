"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import {
  homeRadius,
  planFlight,
  restingFrame,
  sampleFlight,
  shotFor,
  shotPose,
  type CameraFrame,
  type Flight,
  type Shot,
} from "@/features/backdrop/camera";
import { createPlanet, drawPlanetFallback } from "@/features/backdrop/planet";
import { createStarfield } from "@/features/backdrop/starfield";
import { markBackdropReady, readBootPhase, subscribeBoot } from "@/lib/boot";
import { readVideoHold, subscribeVideoHold } from "@/lib/video-hold";

/*
 * «Space» behind the whole site: a star sky and a huge planet (features/backdrop/planet.ts).
 * The planet turns slowly on its own; scrolling down spins it faster the same way, scrolling up
 * spins it backwards just as fast (smoothed, so it eases back into the idle drift afterwards).
 * Each page has its camera shot (camera.ts) and switching pages flies the camera between them;
 * after the preloader the camera comes down and the planet rises into view. The pointer shifts the
 * view a little. One animation loop drives both canvases.
 */

/** Idle spin, rad/s. */
const IDLE_SPIN = 0.01;
/** Spin per scrolled pixel, rad, and its cap, rad/s. */
const SCROLL_SPIN = 0.0005;
const MAX_SPIN = 1.6;
/** How quickly the spin follows the scroll, 1/s: lower = more inertia. */
const SPIN_RESPONSE = 6;
/** Clouds run a bit ahead of the ground: the layers part, the planet looks alive. */
const CLOUD_LEAD = 1.12;
/** Scroll movement ignored after a page switch (Next jumps to the top of the new page), ms. */
const SCROLL_SETTLE = 500;

export function SpaceScene() {
  const skyRef = useRef<HTMLCanvasElement>(null);
  const planetRef = useRef<HTMLCanvasElement>(null);
  const pathname = usePathname();
  const initialShot = useRef<Shot>(shotFor(pathname));
  const goRef = useRef<((shot: Shot) => void) | null>(null);

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
    let omega = IDLE_SPIN;
    let scrollTarget = window.scrollY;
    let scrollSmooth = scrollTarget;
    let lastScroll = scrollTarget;
    let drift = 0;
    let settleUntil = 0;
    let mouseX = 0;
    let mouseTarget = 0;

    let shot = initialShot.current;
    let flight: Flight | null = null;
    // First load: the camera waits above the planet until the preloader opens
    let introPending = !reduced && readBootPhase() === "loading";
    let camera: CameraFrame | null = null;

    const cameraAt = (now: number): CameraFrame => {
      if (introPending) return restingFrame(shotPose("above", w, h));
      if (flight) {
        const f = sampleFlight(flight, shotPose(flight.to, w, h), now);
        if (f.done) flight = null;
        return f;
      }
      return restingFrame(shotPose(shot, w, h));
    };

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

      // Scroll → spin. The signed scroll speed sets the target spin: down = faster in the idle
      // direction, up = backwards at the same speed; the spin eases towards it (inertia)
      if (now < settleUntil) scrollSmooth = lastScroll = scrollTarget;
      scrollSmooth += (scrollTarget - scrollSmooth) * Math.min(1, dt * 5);
      const dScroll = scrollSmooth - lastScroll;
      lastScroll = scrollSmooth;
      drift += dScroll;
      const speed = dt > 0 ? dScroll / dt : 0;
      const target = Math.abs(speed) > 1 ? Math.sign(speed) * (IDLE_SPIN + Math.min(MAX_SPIN, Math.abs(speed) * SCROLL_SPIN)) : IDLE_SPIN;
      omega += (target - omega) * (1 - Math.exp(-dt * SPIN_RESPONSE));
      spin += omega * dt;
      mouseX += (mouseTarget - mouseX) * Math.min(1, dt * 3);

      camera = cameraAt(now);
      const { pose } = camera;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      stars.draw(ctx, time, dt, { drift, x: pose.panX - mouseX * 14, y: pose.panY, zoom: camera.zoom, dust: camera.dust });

      const view = {
        x: pose.x - mouseX * 10,
        y: pose.y,
        r: pose.r,
        spin,
        clouds: spin * CLOUD_LEAD + time * 0.002,
        yaw: pose.yaw,
        pitch: pose.pitch,
        cityCells: homeRadius(w) / 4.5,
      };
      if (!planet) {
        drawPlanetFallback(ctx, view);
        markBackdropReady();
      } else if (planet.draw(view, still)) markBackdropReady();

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

    /** A page switch: fly to its shot (or just show it when nothing animates). */
    const go = (next: Shot) => {
      const now = performance.now();
      // Any page switch: the jump to the top of the new page must not spin the planet
      settleUntil = now + SCROLL_SETTLE;
      if (next === shot) return;
      const from = camera?.pose ?? shotPose(shot, w, h);
      shot = next;
      if (introPending) return; // the intro flies straight to the new shot
      if (!running) {
        flight = null;
        render(now, true);
        return;
      }
      flight = planFlight(from, next, w, h, now);
    };
    goRef.current = go;

    const onBoot = () => {
      if (!introPending || readBootPhase() === "loading") return;
      introPending = false;
      if (running) flight = planFlight(shotPose("above", w, h), shot, w, h, performance.now(), true);
      else render(performance.now(), true);
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
    const unsubscribeHold = subscribeVideoHold(onHold);
    const unsubscribeBoot = subscribeBoot(onBoot);
    onBoot();

    return () => {
      stop();
      goRef.current = null;
      unsubscribeHold();
      unsubscribeBoot();
      planet?.dispose();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointer);
    };
  }, []);

  // Page switches move the camera
  useEffect(() => {
    const next = shotFor(pathname);
    initialShot.current = next;
    goRef.current?.(next);
  }, [pathname]);

  return (
    <>
      <canvas ref={skyRef} className="absolute inset-0 size-full" />
      {/* Covers the screen, but only the rows under the planet and its glow are drawn; fades in once baked */}
      <canvas ref={planetRef} className="absolute inset-0 size-full opacity-0 transition-opacity duration-[1.6s] ease-out" />
    </>
  );
}
