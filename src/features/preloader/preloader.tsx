"use client";

import { useEffect, useRef, useState } from "react";
import { LogoMarkDrawn } from "@/components/icons";
import { BOOT_SEEN_KEY, isBackdropReady, setBootPhase } from "@/lib/boot";

/** Shortest time on screen, ms since the navigation started: the logo has time to draw itself. */
const MIN_FIRST = 1500;
/** Reloads in the same tab: everything is cached, don't make the visitor wait. */
const MIN_REPEAT = 500;
/** Longest wait: after that the site opens even if something is still loading. */
const MAX_WAIT = 7000;
/** The exit (iris opening), ms: matches `.preloader[data-state="reveal"]` in styles/components.css. */
const EXIT = 1300;
/** The render counter runs over 4 s of timeline at 25 fps. */
const FPS = 25;
const FRAMES = 100;

const pad = (n: number) => String(n).padStart(2, "0");
const timecode = (frame: number) => `00:00:${pad(Math.floor(frame / FPS))}:${pad(frame % FPS)}`;

/**
 * First-load screen, styled as a render: the IDX mark draws itself, a timeline bar with a
 * playhead fills up and the timecode runs while the fonts, the page and the planet load. Then
 * an iris opens from the centre, the mark flies at the camera, the page's entrance animations
 * start and the space camera brings the planet up (lib/boot.ts → SpaceScene).
 *
 * The markup is server-rendered and shown by CSS from the first paint (html[data-boot], see
 * boot-script.tsx), so it covers the page even before React loads. Client-side navigation never
 * shows it again: it lives in the root layout.
 */
export function Preloader() {
  const [state, setState] = useState<"loading" | "reveal" | "done">("loading");
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const pctRef = useRef<HTMLSpanElement>(null);
  const codeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const html = document.documentElement;
    const mode = html.getAttribute("data-boot");
    // The failsafe already opened the page (or the script didn't run): CSS keeps this hidden
    if (mode === null) {
      setBootPhase("done");
      return;
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const minTime = mode === "repeat" || reduced ? MIN_REPEAT : MIN_FIRST;
    let fonts = !document.fonts;
    let loaded = document.readyState === "complete";
    document.fonts?.ready.then(
      () => (fonts = true),
      () => (fonts = true),
    );
    const onLoad = () => {
      loaded = true;
    };
    window.addEventListener("load", onLoad);

    let shown = 0;
    let last = performance.now();
    let frame = 0;
    let timer = 0;

    const open = () => {
      const root = rootRef.current;
      if (!root || !html.hasAttribute("data-boot")) {
        setBootPhase("done");
        setState("done");
        return;
      }
      try {
        sessionStorage.setItem(BOOT_SEEN_KEY, "1");
      } catch {
        // private mode: every load gets the full version
      }
      // Switch the state on the element first: once data-boot is gone, only it keeps the overlay visible
      root.dataset.state = "reveal";
      html.removeAttribute("data-boot");
      setState("reveal");
      setBootPhase("reveal");
      timer = window.setTimeout(
        () => {
          setState("done");
          setBootPhase("done");
        },
        reduced ? 0 : EXIT,
      );
    };

    const tick = (now: number) => {
      const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
      last = now;
      const parts = Number(fonts) + Number(loaded) + Number(isBackdropReady());
      const ready = (parts === 3 && now >= minTime) || now >= MAX_WAIT;
      // Creeps on with time and with every finished part; runs to the end once everything is in
      const goal = ready ? 1 : 0.92 * (1 - Math.exp(-now / 1500)) * (0.4 + 0.2 * parts);
      shown += (Math.max(goal, shown) - shown) * (1 - Math.exp(-dt * (ready ? 9 : 3.5)));
      if (ready && shown > 0.996) shown = 1;

      stageRef.current?.style.setProperty("--p", shown.toFixed(4));
      if (pctRef.current) pctRef.current.textContent = `${Math.round(shown * 100)}%`;
      if (codeRef.current) codeRef.current.textContent = timecode(Math.round(shown * FRAMES));

      if (shown === 1) open();
      else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      window.removeEventListener("load", onLoad);
    };
  }, []);

  if (state === "done") return null;

  return (
    <div ref={rootRef} className="preloader" data-state={state} role="status">
      <span className="sr-only">Загружаем сайт…</span>
      <div aria-hidden className="preloader-curtain" />
      <div aria-hidden className="preloader-ring" />

      <div ref={stageRef} aria-hidden className="preloader-stage">
        <div className="relative">
          <span className="preloader-halo" />
          {/* The IDX mark: its gold outlines draw themselves, then the glass and the gold fill in */}
          <LogoMarkDrawn size={96} />
        </div>

        <p className="preloader-word mt-7 font-display text-sm font-semibold text-fg">IDELUXE</p>

        <div className="preloader-meter mt-10 w-[min(17rem,70vw)] font-mono text-[10px] tracking-[0.18em] text-dim uppercase">
          <div className="flex justify-between">
            <span>Render</span>
            <span ref={pctRef} className="text-accent-soft tabular-nums">
              0%
            </span>
          </div>
          <div className="preloader-track relative mt-2.5 h-px rounded-full bg-white/10">
            <div className="preloader-bar absolute inset-0 rounded-full bg-gradient-to-r from-accent-strong/60 via-accent to-accent-soft" />
            <div className="preloader-head absolute -top-[3px] h-[7px] w-px bg-accent-soft shadow-[0_0_8px_1px_rgb(var(--rgb-accent)/0.7)]" />
          </div>
          <div className="mt-2.5 flex justify-between">
            <span ref={codeRef} className="tabular-nums">
              00:00:00:00
            </span>
            <span>25 fps</span>
          </div>
        </div>
      </div>
    </div>
  );
}
