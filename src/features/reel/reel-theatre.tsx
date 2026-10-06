"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Clapperboard,
  Headphones,
  LoaderCircle,
  Maximize,
  Maximize2,
  Minimize,
  Pause,
  PictureInPicture2,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { reels, type Reel } from "@/config/media";
import { routes } from "@/config/routes";
import { OPEN_REEL_EVENT, type OpenReelDetail } from "@/features/reel/events";
import { setVideoHold } from "@/lib/video-hold";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { cn } from "@/lib/utils";

type Mode = "theatre" | "mini";
type Geometry = { cx: number; cy: number; width: number };
type Flip = { from: Geometry; fade: boolean; tilt: number };

const SEEK_STEP = 5;
const MINI_MARGIN = 16;

/** 00:00:12:08 — editor-style timecode. */
function timecode(t: number, fps: number) {
  const rate = Math.round(fps);
  const frames = Math.floor(Math.max(0, t) * rate + 1e-6);
  const s = Math.floor(frames / rate);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(frames % rate)}`;
}

/** Centre + untransformed width (bounding boxes of rotated previews are too large). */
function geometry(el: HTMLElement): Geometry {
  const r = el.getBoundingClientRect();
  return { cx: r.left + r.width / 2, cy: r.top + r.height / 2, width: el.offsetWidth || r.width };
}

function pickQuality(reel: Reel) {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (connection?.saveData) return reel.renditions.length - 1;
  const px = window.innerWidth * Math.min(window.devicePixelRatio || 1, 2);
  const index = reel.renditions.findIndex((r) => px >= r.minWidth);
  return index === -1 ? reel.renditions.length - 1 : index;
}

/**
 * Showreel player. The window flies out of the preview that was clicked, floats over a blurred
 * page with the video's own light spilling around it (ambient mode), and can be collapsed into
 * a draggable mini window that keeps playing while the user scrolls.
 */
export function ReelTheatre() {
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  const [reel, setReel] = useState<Reel | null>(null);
  const [mode, setMode] = useState<Mode>("theatre");
  const [closing, setClosing] = useState(false);
  const [quality, setQuality] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(true);
  const [ended, setEnded] = useState(false);
  const [muted, setMuted] = useState(false);
  const [soundBlocked, setSoundBlocked] = useState(false);
  const [duration, setDuration] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [miniPos, setMiniPos] = useState<{ x: number; y: number } | null>(null);
  const [flipKey, setFlipKey] = useState(0);

  const frameRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ambientRef = useRef<HTMLCanvasElement>(null);
  const rangeRef = useRef<HTMLInputElement>(null);
  const timecodeRef = useRef<HTMLSpanElement>(null);
  const playBtnRef = useRef<HTMLButtonElement>(null);
  /** Frame of the preview video, carried by the flying window so the hand-off is seamless. */
  const snapshotRef = useRef<HTMLCanvasElement>(null);
  const snapshotSourceRef = useRef<HTMLVideoElement | null>(null);

  const flipRef = useRef<Flip | null>(null);
  const originRef = useRef<{ el: HTMLElement; hidden: boolean; tilt: number } | null>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const resumeRef = useRef<{ t: number; play: boolean } | null>(null);
  const scrubbingRef = useRef(false);
  const stateRef = useRef<{ reel: Reel | null; mode: Mode }>({ reel: null, mode: "theatre" });

  useEffect(() => {
    stateRef.current = { reel, mode };
  });

  const restoreOrigin = useCallback(() => {
    const origin = originRef.current;
    if (origin?.hidden) origin.el.style.visibility = "";
    originRef.current = null;
    snapshotSourceRef.current = null;
  }, []);

  /** Paints the preview's current frame onto the snapshot layer. False if there's nothing to paint. */
  const paintSnapshot = useCallback(() => {
    const source = snapshotSourceRef.current;
    const canvas = snapshotRef.current;
    if (!source || !canvas || source.readyState < 2 || !source.videoWidth) return false;
    canvas.width = 640;
    canvas.height = Math.round((640 * source.videoHeight) / source.videoWidth);
    try {
      canvas.getContext("2d")?.drawImage(source, 0, 0, canvas.width, canvas.height);
      return true;
    } catch {
      return false;
    }
  }, []);

  /* ── Open (from any ReelButton) ── */
  useEffect(() => {
    const onOpen = (e: Event) => {
      const { id, origin } = (e as CustomEvent<OpenReelDetail>).detail;
      const next = reels[id];
      const current = stateRef.current;

      // Same reel already playing in the mini window → just expand it.
      if (current.reel?.id === id) {
        if (current.mode === "mini" && boxRef.current) {
          flipRef.current = { from: geometry(boxRef.current), fade: false, tilt: 0 };
          setMode("theatre");
          setFlipKey((k) => k + 1);
        }
        return;
      }

      restoreOrigin();
      returnFocusRef.current = document.activeElement as HTMLElement | null;

      if (origin) {
        const ratio = origin.offsetWidth / Math.max(1, origin.offsetHeight);
        const sameShape = Math.abs(ratio - next.aspect) < 0.12;
        const tilt = Number(origin.dataset.reelTilt ?? 0) || 0;
        flipRef.current = { from: geometry(origin), fade: !sameShape, tilt };
        // A matching preview "detaches": it disappears while its window is out, and takes it back on close.
        if (sameShape) origin.style.visibility = "hidden";
        originRef.current = { el: origin, hidden: sameShape, tilt };
        snapshotSourceRef.current = sameShape ? origin.querySelector("video") : null;
      } else {
        flipRef.current = null;
      }

      setQuality(pickQuality(next));
      setDuration(next.duration);
      setPlaying(false);
      setWaiting(true);
      setEnded(false);
      setMuted(false);
      setSoundBlocked(false);
      setClosing(false);
      setMiniPos(null);
      setMode("theatre");
      setReel(next);
      setFlipKey((k) => k + 1);
    };
    window.addEventListener(OPEN_REEL_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_REEL_EVENT, onOpen);
  }, [restoreOrigin]);

  /* ── Fly-in / mode-change animation (FLIP) ── */
  useLayoutEffect(() => {
    const flip = flipRef.current;
    const frame = frameRef.current;
    const box = boxRef.current;
    flipRef.current = null;
    if (!frame || !box) return;

    const chrome = frame.querySelectorAll<HTMLElement>("[data-reel-chrome]");
    if (!flip || reducedMotion) {
      frame.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: "ease-out" });
      return;
    }

    const f = frame.getBoundingClientRect();
    const b = box.getBoundingClientRect();
    const cx = b.left + b.width / 2;
    const cy = b.top + b.height / 2;
    frame.style.transformOrigin = `${cx - f.left}px ${cy - f.top}px`;
    const scale = flip.from.width / b.width;
    const dx = flip.from.cx - cx;
    const dy = flip.from.cy - cy;

    frame.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(${scale}) rotate(${flip.tilt}deg)`, opacity: flip.fade ? 0 : 1 },
        { transform: "translate(0px, -12px) scale(1.012) rotate(-0.4deg)", opacity: 1, offset: 0.74 },
        { transform: "translate(0px, 0px) scale(1) rotate(0deg)", opacity: 1 },
      ],
      { duration: 860, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
    );
    // The window flies out showing the preview's frame, then cross-fades into the full video.
    if (!flip.fade && paintSnapshot()) {
      snapshotRef.current?.animate([{ opacity: 1 }, { opacity: 1, offset: 0.55 }, { opacity: 0 }], {
        duration: 1400,
        easing: "ease-out",
        fill: "forwards",
      });
    }
    chrome.forEach((el) =>
      el.animate([{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], {
        duration: 420,
        delay: 420,
        easing: "ease-out",
        fill: "backwards",
      }),
    );
  }, [flipKey, reducedMotion, paintSnapshot]);

  /* ── Autoplay with sound (the click is a user gesture); muted fallback if the browser refuses ── */
  const reelId = reel?.id;
  useEffect(() => {
    const v = videoRef.current;
    if (!reelId || !v) return;
    v.muted = false;
    v.play().catch(() => {
      v.muted = true;
      setMuted(true);
      setSoundBlocked(true);
      v.play().catch(() => setWaiting(false));
    });
    requestAnimationFrame(() => playBtnRef.current?.focus({ preventScroll: true }));
  }, [reelId]);

  /* ── Theatre: lock page scroll, pause background videos ── */
  const theatreOpen = Boolean(reel) && mode === "theatre";
  useEffect(() => {
    setVideoHold(theatreOpen);
    if (!theatreOpen) return;
    const root = document.documentElement;
    const prev = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = prev;
      setVideoHold(false);
    };
  }, [theatreOpen]);

  useEffect(() => () => restoreOrigin(), [restoreOrigin]);

  /* ── Playhead, timecode and ambient light: one rAF loop, no React re-renders ── */
  useEffect(() => {
    if (!reel) return;
    let raf = 0;
    let tick = 0;
    let lastSecond = -1;
    const loop = () => {
      const v = videoRef.current;
      const frame = frameRef.current;
      if (v && frame && v.duration) {
        frame.style.setProperty("--p", String(v.currentTime / v.duration));
        if (rangeRef.current && !scrubbingRef.current) rangeRef.current.value = String(v.currentTime);
        if (timecodeRef.current) timecodeRef.current.textContent = timecode(v.currentTime, reel.fps);
        const second = Math.floor(v.currentTime);
        if (second !== lastSecond && rangeRef.current) {
          lastSecond = second;
          rangeRef.current.setAttribute("aria-valuetext", timecode(v.currentTime, reel.fps).slice(3, 8));
        }
        const canvas = ambientRef.current;
        if (canvas && !v.paused && v.readyState >= 2 && ++tick % 6 === 0) {
          canvas.getContext("2d")?.drawImage(v, 0, 0, canvas.width, canvas.height);
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [reel]);

  useEffect(() => {
    const onChange = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  /* ── Actions ── */
  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused || v.ended) v.play().catch(() => {});
    else v.pause();
  }, []);

  const seekBy = useCallback((delta: number) => {
    const v = videoRef.current;
    if (v?.duration) v.currentTime = Math.min(v.duration, Math.max(0, v.currentTime + delta));
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    if (!v.muted) setSoundBlocked(false);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const frame = frameRef.current;
    const v = videoRef.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else if (frame?.requestFullscreen && document.fullscreenEnabled) {
      frame.requestFullscreen().catch(() => {});
    } else {
      v?.webkitEnterFullscreen?.(); // iOS Safari: native player
    }
  }, []);

  const replay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = 0;
    v.play().catch(() => {});
  }, []);

  const cycleQuality = useCallback(() => {
    const v = videoRef.current;
    const current = stateRef.current.reel;
    if (!v || !current) return;
    resumeRef.current = { t: v.currentTime, play: !v.paused };
    setQuality((q) => (q + 1) % current.renditions.length);
  }, []);

  const toMini = useCallback(() => {
    if (!boxRef.current) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    flipRef.current = { from: geometry(boxRef.current), fade: false, tilt: 0 };
    restoreOrigin(); // the window no longer returns to its preview
    setMode("mini");
    setFlipKey((k) => k + 1);
  }, [restoreOrigin]);

  const expand = useCallback(() => {
    if (!boxRef.current) return;
    flipRef.current = { from: geometry(boxRef.current), fade: false, tilt: 0 };
    setMode("theatre");
    setFlipKey((k) => k + 1);
  }, []);

  const close = useCallback(() => {
    const frame = frameRef.current;
    const box = boxRef.current;
    const origin = originRef.current;
    const wasTheatre = stateRef.current.mode === "theatre";
    videoRef.current?.pause();
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});

    const finish = () => {
      restoreOrigin();
      setReel(null);
      setClosing(false);
      setMiniPos(null);
      if (wasTheatre) returnFocusRef.current?.focus?.({ preventScroll: true });
    };
    if (!frame || !box || reducedMotion) return finish();

    setClosing(true);
    frame.querySelectorAll<HTMLElement>("[data-reel-chrome]").forEach((el) => el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: "forwards" }));

    let animation: Animation;
    const target = wasTheatre && origin?.el.isConnected ? geometry(origin.el) : null;
    if (target && target.width > 0) {
      const f = frame.getBoundingClientRect();
      const b = box.getBoundingClientRect();
      const cx = b.left + b.width / 2;
      const cy = b.top + b.height / 2;
      frame.style.transformOrigin = `${cx - f.left}px ${cy - f.top}px`;
      animation = frame.animate(
        [
          { transform: "none", opacity: 1 },
          {
            transform: `translate(${target.cx - cx}px, ${target.cy - cy}px) scale(${target.width / b.width}) rotate(${origin!.tilt}deg)`,
            opacity: origin!.hidden ? 1 : 0,
          },
        ],
        { duration: 620, easing: "cubic-bezier(0.6, 0, 0.2, 1)", fill: "forwards" },
      );
      // Land showing exactly the frame the preview will resume from.
      if (origin!.hidden && paintSnapshot()) {
        snapshotRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 380, easing: "ease-out", fill: "forwards" });
      }
    } else {
      animation = frame.animate(
        [
          { opacity: 1, transform: "none" },
          { opacity: 0, transform: "translateY(14px) scale(0.94)" },
        ],
        { duration: 260, easing: "ease-in", fill: "forwards" },
      );
    }
    animation.onfinish = finish;
  }, [reducedMotion, restoreOrigin, paintSnapshot]);

  /* ── Keyboard (theatre is modal): shortcuts + focus trap. Russian layout keys work too. ── */
  useEffect(() => {
    if (!theatreOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target instanceof Element ? e.target : null;
      const onButton = Boolean(target?.closest("button, a"));
      const key = e.key.toLowerCase();
      if (key === "escape") {
        e.preventDefault();
        close();
      } else if ((key === " " && !onButton) || key === "k" || key === "л") {
        e.preventDefault();
        togglePlay();
      } else if (key === "arrowleft" || key === "arrowright") {
        e.preventDefault();
        seekBy(key === "arrowleft" ? -SEEK_STEP : SEEK_STEP);
      } else if (key === "m" || key === "ь") {
        toggleMute();
      } else if (key === "f" || key === "а") {
        toggleFullscreen();
      } else if (key === "tab") {
        const root = frameRef.current;
        if (!root) return;
        const items = [...root.querySelectorAll<HTMLElement>("button:not([disabled]), a[href], input")].filter((el) => el.offsetParent);
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (!root.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        } else if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [theatreOpen, close, togglePlay, seekBy, toggleMute, toggleFullscreen]);

  /* ── Pointer: gentle 3D tilt (theatre), drag + tap-to-expand (mini) ── */
  const onTilt = (e: React.PointerEvent) => {
    const el = tiltRef.current;
    if (!el || reducedMotion || fullscreen || e.pointerType !== "mouse") return;
    const nx = e.clientX / window.innerWidth - 0.5;
    const ny = e.clientY / window.innerHeight - 0.5;
    el.style.transform = `perspective(1800px) rotateX(${(-ny * 3).toFixed(2)}deg) rotateY(${(nx * 4).toFixed(2)}deg)`;
  };

  const onMiniPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    const el = e.currentTarget;
    const start = el.getBoundingClientRect();
    const offX = e.clientX - start.left;
    const offY = e.clientY - start.top;
    let moved = false;
    el.setPointerCapture(e.pointerId);

    const move = (ev: PointerEvent) => {
      if (!moved && Math.hypot(ev.clientX - e.clientX, ev.clientY - e.clientY) < 5) return;
      moved = true;
      const x = Math.min(window.innerWidth - start.width - 8, Math.max(8, ev.clientX - offX));
      const y = Math.min(window.innerHeight - start.height - 8, Math.max(8, ev.clientY - offY));
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.bottom = "auto";
    };
    const up = () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      if (moved) setMiniPos({ x: parseFloat(el.style.left), y: parseFloat(el.style.top) });
      else expand();
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  };

  if (!reel) return null;

  const theatre = mode === "theatre";
  const rendition = reel.renditions[quality] ?? reel.renditions[0];
  const ambientHeight = Math.round(40 / reel.aspect);

  const frameStyle: React.CSSProperties = fullscreen
    ? {}
    : theatre
      ? { width: `min(92vw, 1180px, calc((100dvh - 230px) * ${reel.aspect}))` }
      : {
          width: "min(320px, 62vw)",
          ...(miniPos ? { left: miniPos.x, top: miniPos.y } : { left: MINI_MARGIN, bottom: MINI_MARGIN }),
        };

  return (
    <div
      className={cn("fixed inset-0", theatre ? "z-[70] flex items-center justify-center p-3 sm:p-6" : "pointer-events-none z-[65]")}
      onPointerMove={theatre ? onTilt : undefined}
    >
      {theatre && (
        <div
          aria-hidden
          onClick={close}
          className={cn(
            "absolute inset-0 bg-ink-950/80 backdrop-blur-2xl transition-opacity duration-500",
            closing ? "opacity-0" : "animate-fade-in",
          )}
        />
      )}

      <div
        ref={frameRef}
        role={theatre ? "dialog" : "region"}
        aria-modal={theatre || undefined}
        aria-label={theatre ? reel.title : `${reel.title} — мини-плеер`}
        onPointerDown={theatre ? undefined : onMiniPointerDown}
        className={cn(
          theatre ? "relative" : "pointer-events-auto absolute cursor-grab touch-none active:cursor-grabbing",
          fullscreen && "flex size-full flex-col bg-black p-3 sm:p-5",
        )}
        style={frameStyle}
      >
        {/* Floats while idle; freezes under the cursor so buttons don't drift away from it */}
        <div className={cn(fullscreen ? "flex min-h-0 flex-1 flex-col" : theatre && "animate-reel-float hover:[animation-play-state:paused]")}>
          <div ref={tiltRef} className={cn("transition-transform duration-700 ease-out", fullscreen && "flex min-h-0 flex-1 flex-col")}>
            {theatre && (
              // z-10: the ambient glow canvas (next sibling, own stacking context) must stay underneath.
              <div
                data-reel-chrome
                className="relative z-10 mb-3 flex items-center gap-3 rounded-2xl border border-white/12 bg-ink-950/90 py-1.5 pr-1.5 pl-2 shadow-[0_12px_40px_-12px_rgb(0_0_0/0.9)] backdrop-blur-xl"
              >
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-accent/40 bg-accent/20 text-accent-soft">
                  <Clapperboard size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-display text-sm font-semibold text-fg sm:text-base">{reel.title}</p>
                  <p className="truncate text-xs text-muted">{reel.subtitle}</p>
                </div>
                {reel.headphones && (
                  <span className="hidden items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1 text-xs text-fg/85 sm:inline-flex">
                    <Headphones size={14} className="text-accent-soft" /> Лучше в наушниках
                  </span>
                )}
                <button
                  type="button"
                  onClick={close}
                  aria-label="Закрыть (Esc)"
                  title="Закрыть (Esc)"
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-fg transition hover:border-white/35 hover:bg-white/20"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            {/* Stage: ambient light spills from the video beyond its edges */}
            <div className={cn("relative isolate", fullscreen && "min-h-0 flex-1")}>
              {theatre && !fullscreen && (
                <canvas
                  ref={ambientRef}
                  width={40}
                  height={ambientHeight}
                  aria-hidden
                  className="pointer-events-none absolute -top-[14%] -left-[10%] -z-10 h-[128%] w-[120%] animate-fade-in opacity-60 blur-[64px] saturate-150"
                />
              )}

              <div
                ref={boxRef}
                className={cn(
                  "relative overflow-hidden bg-black",
                  fullscreen ? "size-full" : theatre ? "rounded-[1.4rem]" : "rounded-2xl",
                  !fullscreen && "shadow-[0_40px_120px_-30px_rgb(0_0_0/0.9),0_0_0_1px_rgb(255_255_255/0.08)]",
                  !theatre && "shadow-[0_24px_60px_-12px_rgb(0_0_0/0.85),0_0_0_1px_rgb(160_148_255/0.35)]",
                )}
                style={fullscreen ? undefined : { aspectRatio: String(reel.aspect) }}
              >
                <video
                  key={reel.id}
                  ref={videoRef}
                  src={rendition.src}
                  poster={reel.poster}
                  playsInline
                  preload="auto"
                  aria-label={reel.title}
                  onClick={theatre ? togglePlay : undefined}
                  onPlay={() => {
                    setPlaying(true);
                    setEnded(false);
                  }}
                  onPause={() => setPlaying(false)}
                  onWaiting={() => setWaiting(true)}
                  onPlaying={() => setWaiting(false)}
                  onCanPlay={() => setWaiting(false)}
                  onEnded={() => {
                    setPlaying(false);
                    setEnded(true);
                  }}
                  onVolumeChange={(e) => setMuted(e.currentTarget.muted)}
                  onLoadedMetadata={(e) => {
                    const v = e.currentTarget;
                    if (Number.isFinite(v.duration)) setDuration(v.duration);
                    const resume = resumeRef.current;
                    if (resume) {
                      resumeRef.current = null;
                      v.currentTime = resume.t;
                      if (resume.play) v.play().catch(() => {});
                    }
                  }}
                  onProgress={(e) => {
                    const v = e.currentTarget;
                    const b = v.buffered;
                    if (!v.duration || !b.length) return;
                    frameRef.current?.style.setProperty("--b", String(b.end(b.length - 1) / v.duration));
                  }}
                  className={cn("size-full", fullscreen ? "object-contain" : "object-cover", theatre && "cursor-pointer")}
                />
                <canvas ref={snapshotRef} aria-hidden className="pointer-events-none absolute inset-0 size-full object-cover opacity-0" />

                {waiting && !ended && (
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center" role="status" aria-label="Загрузка видео">
                    <LoaderCircle size={theatre ? 34 : 22} className="animate-spin text-fg/80" />
                  </span>
                )}

                {soundBlocked && theatre && (
                  <button
                    type="button"
                    onClick={toggleMute}
                    className="btn btn-primary btn-sm absolute bottom-4 left-1/2 -translate-x-1/2 animate-fade-up"
                  >
                    <Volume2 size={15} /> Включить звук
                  </button>
                )}

                {ended && theatre && (
                  <div className="absolute inset-0 flex animate-fade-in flex-col items-center justify-center gap-5 bg-ink-950/70 p-6 text-center backdrop-blur-sm">
                    <p className="font-display text-xl font-semibold text-balance sm:text-3xl">
                      Хочешь монтировать так же? <span className="text-gradient">Все приёмы — в разборах.</span>
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                      <button type="button" onClick={replay} className="btn btn-glass btn-md">
                        <RotateCcw size={16} /> Ещё раз
                      </button>
                      <Link href={routes.pricing} className="btn btn-primary btn-md">
                        Выбрать тариф
                      </Link>
                    </div>
                  </div>
                )}

                {!theatre && (
                  <>
                    <div className="absolute inset-x-0 top-0 flex justify-end gap-1.5 bg-gradient-to-b from-black/60 to-transparent p-1.5">
                      <MiniButton onClick={expand} label="Развернуть">
                        <Maximize2 size={14} />
                      </MiniButton>
                      <MiniButton onClick={close} label="Закрыть">
                        <X size={14} />
                      </MiniButton>
                    </div>
                    <MiniButton onClick={ended ? replay : togglePlay} label={ended ? "Смотреть ещё раз" : playing ? "Пауза" : "Смотреть"} className="absolute bottom-2.5 left-1.5">
                      {ended ? <RotateCcw size={14} /> : playing ? <Pause size={14} /> : <Play size={14} />}
                    </MiniButton>
                    <div aria-hidden className="absolute inset-x-0 bottom-0 h-1 bg-white/10">
                      <div className="h-full bg-gradient-to-r from-accent-strong via-accent to-pink" style={{ width: "calc(var(--p, 0) * 100%)" }} />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Transport bar, styled like an editor's program monitor */}
            {theatre && (
              <div data-reel-chrome className="relative z-10 mt-3 rounded-2xl border border-white/12 bg-ink-950/90 px-3 pt-2 pb-2.5 shadow-[0_12px_40px_-12px_rgb(0_0_0/0.9)] backdrop-blur-xl">
                <div className="relative h-7 rounded-lg has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-accent-soft">
                  <div aria-hidden className="absolute inset-x-0 top-0 flex justify-between">
                    {Array.from({ length: 21 }, (_, i) => (
                      <span key={i} className={cn("w-px bg-white/15", i % 5 === 0 ? "h-2" : "h-1")} />
                    ))}
                  </div>
                  <div aria-hidden className="absolute inset-x-0 top-1/2 mt-1 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-white/10">
                    <div className="absolute inset-y-0 left-0 bg-white/15" style={{ width: "calc(var(--b, 0) * 100%)" }} />
                    <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-accent-strong via-accent to-pink" style={{ width: "calc(var(--p, 0) * 100%)" }} />
                  </div>
                  <div
                    aria-hidden
                    className="absolute top-0 bottom-0 w-px -translate-x-1/2 bg-pink shadow-[0_0_8px_rgb(233_168_255/0.9)]"
                    style={{ left: "calc(var(--p, 0) * 100%)" }}
                  >
                    <span className="absolute -top-0.5 left-1/2 h-2.5 w-3 -translate-x-1/2 rounded-b-[4px] bg-pink" />
                  </div>
                  <input
                    ref={rangeRef}
                    type="range"
                    min={0}
                    max={duration || reel.duration}
                    step="any"
                    defaultValue={0}
                    aria-label="Перемотка"
                    onPointerDown={() => (scrubbingRef.current = true)}
                    onPointerUp={() => (scrubbingRef.current = false)}
                    onInput={(e) => {
                      const v = videoRef.current;
                      if (v) v.currentTime = Number(e.currentTarget.value);
                    }}
                    onKeyDown={(e) => {
                      // Arrows are handled globally (±5 s); stop the native tiny step.
                      if (e.key.startsWith("Arrow")) e.preventDefault();
                    }}
                    className="absolute inset-0 size-full cursor-pointer appearance-none opacity-0"
                  />
                </div>

                <div className="mt-1.5 flex items-center gap-1.5 sm:gap-2">
                  <ControlButton ref={playBtnRef} onClick={ended ? replay : togglePlay} label={ended ? "Смотреть ещё раз" : playing ? "Пауза (K)" : "Смотреть (K)"}>
                    {ended ? <RotateCcw size={16} /> : playing ? <Pause size={16} /> : <Play size={16} />}
                  </ControlButton>
                  <p className="font-mono text-[11px] text-accent-soft tabular-nums sm:text-[12px]">
                    <span ref={timecodeRef}>00:00:00:00</span>
                    <span className="hidden text-dim sm:inline"> / {timecode(duration || reel.duration, reel.fps)}</span>
                  </p>
                  <span className="flex-1" />
                  <ControlButton onClick={toggleMute} label={muted ? "Включить звук (M)" : "Выключить звук (M)"}>
                    {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                  </ControlButton>
                  {reel.renditions.length > 1 && (
                    <button
                      type="button"
                      onClick={cycleQuality}
                      aria-label={`Качество: ${rendition.label}. Переключить`}
                      title="Качество видео"
                      className="inline-flex h-8 items-center rounded-xl border border-white/10 bg-white/[0.05] px-2 font-mono text-[11px] text-fg/80 transition hover:bg-white/10 sm:h-9 sm:px-2.5"
                    >
                      {rendition.label}
                    </button>
                  )}
                  <ControlButton onClick={toMini} label="Свернуть в мини-окно">
                    <PictureInPicture2 size={16} />
                  </ControlButton>
                  <ControlButton onClick={toggleFullscreen} label={fullscreen ? "Выйти из полноэкранного режима (F)" : "Во весь экран (F)"}>
                    {fullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
                  </ControlButton>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ControlButton({
  label,
  onClick,
  children,
  ref,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  ref?: React.Ref<HTMLButtonElement>;
}) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-fg/80 transition hover:bg-white/10 hover:text-fg sm:size-9"
    >
      {children}
    </button>
  );
}

function MiniButton({ label, onClick, children, className }: { label: string; onClick: () => void; children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-lg border border-white/15 bg-ink-950/60 text-fg/90 backdrop-blur-md transition hover:bg-ink-950/80",
        className,
      )}
    >
      {children}
    </button>
  );
}
