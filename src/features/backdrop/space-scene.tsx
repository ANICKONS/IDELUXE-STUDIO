"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";
import {
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
import { subscribeLeave } from "@/lib/page-leave";
import { holdArrival } from "@/lib/transit-hold";
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
/** Share of a flight when the new page's blocks start coming in, and when they've landed. */
const ARRIVE_START = 0.28;
const ARRIVE_END = 0.9;
/** Shortest entrance, ms (a late page still eases in instead of popping). */
const ARRIVE_MIN = 500;
/**
 * After the entrance, ms: the stagger of the first blocks (`--i` × 80 ms, the hero editor is 3rd).
 * Then the new page's videos and loops start (lib/transit-hold.ts).
 */
const ARRIVE_TAIL = 240;
/**
 * Frame pacing. While something moves (flight, scroll, pointer) the backdrop renders at no less
 * than ~60 fps, at rest (twinkle, slow spin) at ~30 fps — indistinguishable, and half the GPU work,
 * including every glass panel re-blurring the backdrop behind it. Counted in display refreshes,
 * not milliseconds, so the steps stay even: on 144 Hz every 2nd refresh in motion (72 fps; a
 * millisecond budget landed on every 3rd — 48 fps, visibly choppier than the page's own 144 fps
 * animations), every 5th at rest; on 60 Hz every refresh / every 2nd.
 */
const BUSY_FPS = 60;
const IDLE_FPS = 30;
/** Refreshes per rendered frame for a target rate (a little slack for a slightly fast display). */
const pace = (refresh: number, fps: number) => Math.max(1, Math.floor(refresh / fps + 0.2));

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

    const coarse = window.matchMedia("(pointer: coarse)").matches;
    /** Reallocates both canvases; false when nothing worth it changed. */
    const resize = () => {
      const nw = window.innerWidth;
      const nh = window.innerHeight;
      // Phones: the URL bar showing/hiding changes the height while scrolling — the canvases
      // simply stretch a little instead of being reallocated mid-scroll
      if (nw === w && (nh === h || (coarse && Math.abs(nh - h) < 160))) return false;
      w = nw;
      h = nh;
      dpr = Math.min(window.devicePixelRatio || 1, w < 768 ? 1 : 1.5);
      sky.width = Math.round(w * dpr);
      sky.height = Math.round(h * dpr);
      stars.resize(w, h);
      planet?.resize(w, h);
      return true;
    };

    let frame = 0;
    let last = 0;
    let running = false;
    let flying = false;
    // Display refresh rate, Hz: estimated from the gaps between animation frames (smoothed,
    // ignoring stalls); `skipped` counts refreshes since the last rendered frame
    let refresh = 60;
    let lastCall = 0;
    let skipped = 0;

    /** `still`: a single frame (reduced motion, paused) — the planet bakes its map in one go. */
    const render = (now: number, still = false) => {
      // Pacing (see BUSY_FPS / IDLE_FPS): render on every n-th display refresh
      if (!still) {
        const gap = lastCall ? now - lastCall : 0;
        lastCall = now;
        if (gap > 2 && gap < 40) refresh += (1000 / gap - refresh) * 0.05;
        if (last) {
          const moving =
            flight !== null || Math.abs(omega - IDLE_SPIN) > 0.003 || Math.abs(mouseTarget - mouseX) > 0.002 || Math.abs(scrollTarget - scrollSmooth) > 0.5;
          // A late refresh counts for as many as it took
          skipped += gap > 0 ? Math.max(1, Math.round((gap * refresh) / 1000)) : 1;
          if (skipped < pace(refresh, moving ? BUSY_FPS : IDLE_FPS)) {
            if (running) frame = requestAnimationFrame(render);
            return;
          }
        }
        skipped = 0;
      }
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
      last = now;
      const time = now / 1000;
      // html[data-flying]: other heavy work (the editor's scopes) takes a break during a flight
      if ((flight !== null) !== flying) {
        flying = flight !== null;
        if (flying) document.documentElement.setAttribute("data-flying", "");
        else document.documentElement.removeAttribute("data-flying");
      }

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
      lastCall = 0;
      skipped = 0;
      frame = requestAnimationFrame(render);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };

    /**
     * Times the new page's entrance (`.arrive`, styles/components.css) to the flight: its blocks
     * start coming in once the camera is under way and land as it settles, drifting the same way
     * as the sky. Called when the new page mounts — the flight may have started earlier, on the
     * click (PageTransitions). No flight → the defaults (they come in at once).
     * The timing goes into its own tiny stylesheet aimed at the entering blocks only (and the
     * properties don't inherit, styles/animations.css): setting or dropping it restyles those few
     * elements, not the whole page — on <html> it was a hitch right as the page landed.
     */
    const timing = document.createElement("style");
    timing.dataset.arriveTiming = "";
    document.head.append(timing);
    let arriveTimer = 0;
    const clearArrive = () => {
      if (timing.textContent) timing.textContent = "";
    };
    const timeArrival = (f: Flight | null) => {
      window.clearTimeout(arriveTimer);
      const now = performance.now();
      if (!f || now > f.start + f.duration * ARRIVE_END) {
        holdArrival(0);
        return clearArrive();
      }
      const delay = Math.max(0, f.start + f.duration * ARRIVE_START - now);
      const duration = Math.max(ARRIVE_MIN, f.start + f.duration * ARRIVE_END - now - delay);
      // Heavy page work (hero editor, videos) waits until the blocks have landed
      holdArrival(delay + duration + ARRIVE_TAIL);
      const to = shotPose(f.to, w, h);
      const x = -Math.sign(Math.round(to.panX - f.from.panX)) * 48;
      const y = -Math.sign(Math.round(to.panY - f.from.panY)) * 32;
      timing.textContent = `.arrive,.decor-in{--arrive-delay:${Math.round(delay)}ms;--arrive-duration:${Math.round(duration)}ms;--arrive-x:${x}px;--arrive-y:${y}px}`;
      // Once everything has landed, later entrances on the page are immediate again
      arriveTimer = window.setTimeout(clearArrive, delay + duration + 900);
    };

    /** Fly to a shot (or just show it when nothing animates). */
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
    /** The new page is in the DOM: make sure the camera heads there, time its entrance. */
    goRef.current = (next: Shot) => {
      go(next);
      timeArrival(flight && flight.to === next ? flight : null);
    };
    // A link was clicked: start flying while the old page is still easing away
    const unsubscribeLeave = subscribeLeave((path) => go(shotFor(path)));

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
    let resizeFrame = 0;
    const onResize = () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        if (resize() && !running) render(performance.now(), true);
      });
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
      cancelAnimationFrame(resizeFrame);
      document.documentElement.removeAttribute("data-flying");
      window.clearTimeout(arriveTimer);
      timing.remove();
      holdArrival(0);
      goRef.current = null;
      unsubscribeLeave();
      unsubscribeHold();
      unsubscribeBoot();
      planet?.dispose();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointer);
    };
  }, []);

  // Page switches move the camera. A layout effect: the new page is already in the DOM but not yet
  // painted, so its entrance gets the flight's timing from its very first frame
  useLayoutEffect(() => {
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
