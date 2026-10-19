"use client";

import Link from "next/link";
import { useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  ArrowRight,
  Check,
  Gauge,
  LoaderCircle,
  Lock,
  Maximize,
  Minimize,
  Pause,
  PictureInPicture2,
  Play,
  RotateCcw,
  Undo2,
  Redo2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { RATES, usePipSupport, useRate, useScreenPx, type Rate } from "@/features/learn/player-prefs";
import type { Chapter, LessonVideo } from "@/features/learn/types";
import { formatClock } from "@/lib/format";
import { cn } from "@/lib/utils";

/** How often the position is saved while playing, s of video. */
const REPORT_EVERY = 15;
const SEEK_STEP = 5;
const JUMP_STEP = 10;

export type PlayerHandle = {
  /** Jumps to `t` (s) and plays: a chapter, «Продолжить с…». */
  seek: (t: number) => void;
};

type Flash = { id: number; icon: "play" | "pause" | "back" | "fwd" | "rate"; text?: string };

/** The chapter playing at `t`. */
export function chapterAt(chapters: Chapter[], t: number): number {
  let index = -1;
  for (let i = 0; i < chapters.length; i++) if (chapters[i].at <= t + 0.25) index = i;
  return index;
}

/**
 * The lesson's player, styled like an editor's program monitor: the video with its own light
 * spilling around it, under it the transport — a timeline with the chapters as keyframe diamonds
 * (hover shows the time and the chapter), the time, −10 / +10 s, sound, speed, quality,
 * picture-in-picture, full screen.
 *
 * Before the first play the lesson's cover lies over it, with «Продолжить с 4:12» when the account
 * has stopped somewhere. Where it is gets reported (`onReport`) every 15 s of watching, on pause,
 * after a jump, at the end and when the tab is hidden or closed. Keys (any layout — physical keys):
 * Space / K, J / L ±10 s, ← / → ±5 s, ↑ / ↓ volume (in the player), M, F, 0–9, Shift + < / >.
 */
export function LessonPlayer({
  ref,
  title,
  video,
  chapters,
  cover,
  fallbackDuration,
  resumeAt,
  next,
  onReport,
  onTime,
}: {
  ref?: React.Ref<PlayerHandle>;
  title: string;
  video: LessonVideo;
  chapters: Chapter[];
  /** Lies over the video until it's played. */
  cover: React.ReactNode;
  /** The lesson's length before the video's own is known, s. */
  fallbackDuration: number;
  /** Where the account stopped, s; null — start from the beginning. */
  resumeAt: number | null;
  next?: { href: string; title: string; open: boolean } | null;
  onReport: (report: { position: number; duration: number }) => void;
  /** About once a second while the time moves (the chapters list follows it). */
  onTime?: (t: number) => void;
}) {
  const screenPx = useScreenPx();
  const pip = usePipSupport();
  const [rate, setRate] = useRate();
  const [override, setOverride] = useState<number | null>(null);
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [ended, setEnded] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [duration, setDuration] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);
  const [rateMenu, setRateMenu] = useState(false);
  const [flash, setFlash] = useState<Flash | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const ambientRef = useRef<HTMLCanvasElement>(null);
  const rangeRef = useRef<HTMLInputElement>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLSpanElement>(null);
  const tipTimeRef = useRef<HTMLSpanElement>(null);
  const tipTitleRef = useRef<HTMLSpanElement>(null);
  const playBtnRef = useRef<HTMLButtonElement>(null);
  const startedRef = useRef(false);
  /** A jump asked for before the video could take it (no metadata yet). */
  const pendingRef = useRef<number | null>(null);
  /** Where a quality switch picks up. */
  const resumeRef = useRef<{ t: number; play: boolean } | null>(null);
  const lastReportRef = useRef(-1);
  const lastKnownRef = useRef<{ t: number; d: number } | null>(null);
  const lastSecondRef = useRef(-1);
  const seekTimerRef = useRef(0);
  const scrubbingRef = useRef(false);
  const callbacks = useRef({ onReport, onTime });
  const flashId = useRef(0);

  useEffect(() => {
    callbacks.current = { onReport, onTime };
  });

  // The rendition by screen width (highest quality first); a pick by hand wins. No source on the
  // server: the browser chooses after hydration, so it never loads a file only to switch it.
  const auto = video.renditions.findIndex((r) => screenPx >= r.minWidth);
  const quality = override ?? (auto === -1 ? video.renditions.length - 1 : auto);
  const rendition = video.renditions[quality] ?? video.renditions[0];
  const src = screenPx ? rendition.src : undefined;
  const length = duration || fallbackDuration;

  const showFlash = useCallback((icon: Flash["icon"], text?: string) => {
    flashId.current += 1;
    setFlash({ id: flashId.current, icon, text });
  }, []);

  /**
   * Tells the page where the video is (skipped while nothing new happened). Reads the element while
   * it's there and the last known time after it's gone (unmounting detaches refs first).
   */
  const report = useCallback((force = false) => {
    const v = videoRef.current;
    if (v && v.duration && Number.isFinite(v.duration)) lastKnownRef.current = { t: v.ended ? v.duration : v.currentTime, d: v.duration };
    const known = lastKnownRef.current;
    if (!startedRef.current || !known) return;
    if (!force && Math.abs(known.t - lastReportRef.current) < 0.5) return;
    if (force && known.t === lastReportRef.current) return;
    lastReportRef.current = known.t;
    callbacks.current.onReport({ position: known.t, duration: known.d });
  }, []);

  const begin = useCallback((t: number) => {
    const v = videoRef.current;
    if (!v) return;
    startedRef.current = true;
    setStarted(true);
    setEnded(false);
    if (v.readyState >= 1) v.currentTime = t;
    else pendingRef.current = t;
    v.play().catch(() => {});
    requestAnimationFrame(() => playBtnRef.current?.focus({ preventScroll: true }));
  }, []);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (!startedRef.current) return begin(resumeAt ?? 0);
    if (v.paused || v.ended) {
      v.play().catch(() => {});
      showFlash("play");
    } else {
      v.pause();
      showFlash("pause");
    }
  }, [begin, resumeAt, showFlash]);

  const seekTo = useCallback(
    (t: number) => {
      const v = videoRef.current;
      if (!v) return;
      if (!startedRef.current) return begin(t);
      const d = v.duration || fallbackDuration;
      v.currentTime = Math.min(Math.max(0, t), Math.max(0, d - 0.05));
      if (v.paused) v.play().catch(() => {});
    },
    [begin, fallbackDuration],
  );

  const seekBy = useCallback(
    (delta: number) => {
      const v = videoRef.current;
      if (!v?.duration || !startedRef.current) return;
      v.currentTime = Math.min(v.duration, Math.max(0, v.currentTime + delta));
      showFlash(delta < 0 ? "back" : "fwd", `${delta > 0 ? "+" : "−"}${Math.abs(delta)} с`);
    },
    [showFlash],
  );

  useImperativeHandle(ref, () => ({ seek: seekTo }), [seekTo]);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    if (!v.muted && v.volume === 0) v.volume = 0.6;
  }, []);

  const nudgeVolume = useCallback((delta: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = false;
    v.volume = Math.min(1, Math.max(0, Math.round((v.volume + delta) * 10) / 10));
  }, []);

  const toggleFullscreen = useCallback(() => {
    const root = rootRef.current;
    const v = videoRef.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else if (root?.requestFullscreen && document.fullscreenEnabled) root.requestFullscreen().catch(() => {});
    else v?.webkitEnterFullscreen?.(); // iOS Safari: its own player
  }, []);

  const togglePip = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (document.pictureInPictureElement) document.exitPictureInPicture().catch(() => {});
    else v.requestPictureInPicture().catch(() => {});
  }, []);

  const pickRate = useCallback(
    (r: Rate) => {
      setRate(r);
      showFlash("rate", `${r}×`);
    },
    [setRate, showFlash],
  );
  const stepRate = useCallback(
    (dir: 1 | -1) => {
      const i = RATES.indexOf(rate);
      const nextRate = RATES[Math.min(RATES.length - 1, Math.max(0, i + dir))];
      if (nextRate !== rate) pickRate(nextRate);
    },
    [rate, pickRate],
  );

  const cycleQuality = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    resumeRef.current = { t: v.currentTime, play: !v.paused };
    setOverride((quality + 1) % video.renditions.length);
  }, [quality, video.renditions.length]);

  // Speed survives a change of source (a new source resets it)
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.defaultPlaybackRate = rate;
    v.playbackRate = rate;
  }, [rate, src]);

  // Playhead, time and the ambient light: one rAF loop, no React renders
  useEffect(() => {
    let raf = 0;
    let tick = 0;
    const loop = () => {
      const v = videoRef.current;
      const root = rootRef.current;
      if (v && root && v.duration) {
        const t = v.currentTime;
        root.style.setProperty("--p", String(t / v.duration));
        if (rangeRef.current && !scrubbingRef.current) rangeRef.current.value = String(t);
        if (timeRef.current) timeRef.current.textContent = formatClock(Math.floor(t));
        const canvas = ambientRef.current;
        if (canvas && !v.paused && v.readyState >= 2 && ++tick % 6 === 0) {
          try {
            canvas.getContext("2d")?.drawImage(v, 0, 0, canvas.width, canvas.height);
          } catch {
            // A video from another origin without CORS: no ambient light, the rest works
          }
        }
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === rootRef.current && rootRef.current !== null);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Leaving: the position is saved when the tab is hidden, the page closes or the lesson changes
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") report(true);
    };
    const onPageHide = () => report(true);
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", onPageHide);
      window.clearTimeout(seekTimerRef.current);
      report(true);
    };
  }, [report]);

  // The rate menu closes on a click elsewhere and on Escape
  useEffect(() => {
    if (!rateMenu) return;
    const onPointer = (e: PointerEvent) => {
      if (!(e.target as Element | null)?.closest("[data-rate-menu]")) setRateMenu(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setRateMenu(false);
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [rateMenu]);

  // Keys: physical ones (e.code), so they work in the Russian layout too
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const el = e.target instanceof HTMLElement ? e.target : null;
      const typing = el && (el.isContentEditable || /^(TEXTAREA|SELECT)$/.test(el.tagName) || (el.tagName === "INPUT" && el !== rangeRef.current));
      if (typing) return;
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      // Menus and option groups use the arrows themselves
      if (el?.closest('[role="menu"], [role="radiogroup"], [role="tablist"]')) return;
      const inside = Boolean(el && rootRef.current?.contains(el));
      const onControl = Boolean(el?.closest("button, a"));
      const v = videoRef.current;
      let handled = true;
      switch (e.code) {
        case "Space":
          if (onControl) return;
          togglePlay();
          break;
        case "KeyK":
          togglePlay();
          break;
        case "KeyJ":
          seekBy(-JUMP_STEP);
          break;
        case "KeyL":
          seekBy(JUMP_STEP);
          break;
        case "ArrowLeft":
          seekBy(-SEEK_STEP);
          break;
        case "ArrowRight":
          seekBy(SEEK_STEP);
          break;
        case "ArrowUp":
        case "ArrowDown":
          if (!inside) return;
          nudgeVolume(e.code === "ArrowUp" ? 0.1 : -0.1);
          break;
        case "KeyM":
          toggleMute();
          break;
        case "KeyF":
          toggleFullscreen();
          break;
        case "Comma":
        case "Period":
          if (!e.shiftKey) return;
          stepRate(e.code === "Period" ? 1 : -1);
          break;
        default:
          if (/^Digit\d$/.test(e.code) && v?.duration && startedRef.current) {
            v.currentTime = (Number(e.code.slice(5)) / 10) * v.duration;
          } else handled = false;
      }
      if (handled) e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [togglePlay, seekBy, nudgeVolume, toggleMute, toggleFullscreen, stepRate]);

  /* ── Timeline hover: the time and the chapter under the pointer ── */
  const onTimelineMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const box = timelineRef.current?.getBoundingClientRect();
    if (!box || !length) return;
    const x = Math.min(box.width, Math.max(0, e.clientX - box.left));
    const t = (x / box.width) * length;
    if (tipRef.current) tipRef.current.style.left = `${Math.min(box.width - 40, Math.max(40, x))}px`;
    if (tipTimeRef.current) tipTimeRef.current.textContent = formatClock(t);
    if (tipTitleRef.current) {
      const c = chapters[chapterAt(chapters, t)];
      tipTitleRef.current.textContent = c?.title ?? "";
    }
  };

  const markers = length > 0 ? chapters.filter((c) => c.at > 0 && c.at < length) : [];

  return (
    <div className="relative isolate">
      {/* The video's own light spilling around the player */}
      {!fullscreen && (
        <canvas
          ref={ambientRef}
          width={40}
          height={Math.round(40 / video.aspect)}
          aria-hidden
          className={cn(
            "pointer-events-none absolute -top-[8%] -left-[6%] -z-10 h-[90%] w-[112%] blur-[60px] saturate-150 transition-opacity duration-1000",
            playing ? "opacity-50" : "opacity-0",
          )}
        />
      )}

      <div
        ref={rootRef}
        className={cn(
          "glass overflow-hidden rounded-[1.6rem] p-1.5 sm:p-2",
          fullscreen && "flex size-full flex-col rounded-none border-0 bg-black p-3 sm:p-4",
        )}
      >
        <div
          className={cn("relative overflow-hidden bg-black", fullscreen ? "min-h-0 flex-1" : "rounded-[1.15rem]")}
          style={fullscreen ? undefined : { aspectRatio: String(video.aspect) }}
        >
          <video
            ref={videoRef}
            src={src}
            playsInline
            preload="metadata"
            aria-label={title}
            onClick={togglePlay}
            onDoubleClick={toggleFullscreen}
            onPlay={() => {
              setPlaying(true);
              setEnded(false);
            }}
            onPause={() => {
              setPlaying(false);
              report();
            }}
            onWaiting={() => setWaiting(true)}
            onPlaying={() => setWaiting(false)}
            onCanPlay={() => setWaiting(false)}
            onSeeked={() => {
              window.clearTimeout(seekTimerRef.current);
              seekTimerRef.current = window.setTimeout(() => report(), 1200);
            }}
            onTimeUpdate={(e) => {
              const v = e.currentTarget;
              if (v.duration && Number.isFinite(v.duration)) lastKnownRef.current = { t: v.currentTime, d: v.duration };
              if (!v.paused && Math.abs(v.currentTime - lastReportRef.current) >= REPORT_EVERY) report();
              const s = Math.floor(v.currentTime);
              if (s !== lastSecondRef.current) {
                lastSecondRef.current = s;
                callbacks.current.onTime?.(v.currentTime);
                rangeRef.current?.setAttribute("aria-valuetext", `${formatClock(s)} из ${formatClock(v.duration || length)}`);
              }
            }}
            onEnded={() => {
              setPlaying(false);
              setEnded(true);
              report(true);
              if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
            }}
            onVolumeChange={(e) => {
              setMuted(e.currentTarget.muted);
              setVolume(e.currentTarget.volume);
            }}
            onLoadedMetadata={(e) => {
              const v = e.currentTarget;
              if (Number.isFinite(v.duration)) setDuration(v.duration);
              v.defaultPlaybackRate = rate;
              v.playbackRate = rate;
              const pending = pendingRef.current;
              const resume = resumeRef.current;
              if (pending !== null) {
                pendingRef.current = null;
                v.currentTime = pending;
              } else if (resume) {
                resumeRef.current = null;
                v.currentTime = resume.t;
                if (resume.play) v.play().catch(() => {});
              }
            }}
            onProgress={(e) => {
              const v = e.currentTarget;
              const b = v.buffered;
              if (v.duration && b.length) rootRef.current?.style.setProperty("--b", String(b.end(b.length - 1) / v.duration));
            }}
            className={cn("size-full cursor-pointer", fullscreen ? "object-contain" : "object-cover")}
          />

          {video.demo && (
            <span className="pointer-events-none absolute top-3 left-3 z-[5] rounded-full border border-white/12 bg-ink-950/60 px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] text-fg/70 uppercase backdrop-blur-md">
              Демо-ролик вместо урока
            </span>
          )}

          {waiting && started && !ended && (
            <span className="pointer-events-none absolute inset-0 flex items-center justify-center" role="status" aria-label="Загрузка видео">
              <LoaderCircle size={34} className="animate-spin text-fg/80" />
            </span>
          )}

          {flash && (
            <span key={flash.id} aria-hidden className="pointer-events-none absolute inset-0 z-[2] flex items-center justify-center">
              <span className="player-flash inline-flex h-16 min-w-16 items-center justify-center gap-1.5 rounded-full bg-ink-950/55 px-4 text-fg backdrop-blur-md">
                {flash.icon === "play" && <Play size={26} className="translate-x-0.5" fill="currentColor" />}
                {flash.icon === "pause" && <Pause size={26} fill="currentColor" />}
                {flash.icon === "back" && <Undo2 size={22} />}
                {flash.icon === "fwd" && <Redo2 size={22} />}
                {flash.icon === "rate" && <Gauge size={22} />}
                {flash.text && <span className="font-mono text-[15px] font-semibold tabular-nums">{flash.text}</span>}
              </span>
            </span>
          )}

          {/* Before the first play: the cover, «Смотреть» or «Продолжить с…» */}
          {!started && (
            <div className="absolute inset-0 z-[4]">
              {cover}
              <div className="absolute inset-0 z-[3] flex flex-col items-center justify-center gap-3 bg-gradient-to-t from-ink-950/70 via-ink-950/20 to-transparent p-4 text-center sm:gap-4 sm:p-5">
                {resumeAt !== null ? (
                  <>
                    <p className="text-[13px] text-fg/85 sm:text-[14px]">
                      Ты остановился на <span className="font-mono text-accent-soft tabular-nums">{formatClock(resumeAt)}</span>
                    </p>
                    <div className="flex flex-wrap justify-center gap-2">
                      <button type="button" onClick={() => begin(resumeAt)} className="btn btn-primary btn-sm">
                        <Play size={15} fill="currentColor" /> Продолжить
                      </button>
                      <button type="button" onClick={() => begin(0)} className="btn btn-glass btn-sm">
                        <RotateCcw size={14} /> Сначала
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => begin(0)}
                    aria-label={`Смотреть: ${title}`}
                    className="group/play relative inline-flex size-20 items-center justify-center rounded-full border border-white/25 bg-ink-950/45 text-fg shadow-[0_18px_50px_-12px_rgb(0_0_0/0.9)] backdrop-blur-md transition duration-500 hover:scale-105 hover:border-white/40 sm:size-24"
                  >
                    <span aria-hidden className="absolute inset-0 animate-ping-soft rounded-full border border-accent-soft/40" />
                    <Play size={30} className="translate-x-0.5" fill="currentColor" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* The end: seen, what's next */}
          {ended && (
            <div className="absolute inset-0 z-[4] flex animate-fade-in flex-col items-center justify-center gap-5 bg-ink-950/75 p-6 text-center backdrop-blur-sm">
              <span className="inline-flex items-center gap-2 rounded-full border border-accent/35 bg-accent/12 px-3 py-1 text-[13px] font-semibold text-accent-soft">
                <Check size={15} strokeWidth={2.5} aria-hidden /> Разбор просмотрен
              </span>
              {next && (
                <Link href={next.href} className="group/next max-w-md">
                  <span className="inline-flex items-center gap-1.5 font-mono text-[10.5px] tracking-[0.18em] text-dim uppercase">
                    Следующий в разделе
                    {!next.open && (
                      <>
                        <span aria-hidden>·</span>
                        <Lock size={11} aria-hidden /> PRO
                      </>
                    )}
                  </span>
                  <span className="mt-2 block font-display text-lg font-semibold text-balance text-fg sm:text-2xl">
                    {next.title}
                    <ArrowRight size={20} aria-hidden className="ml-2 inline-block -translate-y-px align-middle transition-transform group-hover/next:translate-x-1" />
                  </span>
                </Link>
              )}
              <button type="button" onClick={() => begin(0)} className="btn btn-glass btn-sm">
                <RotateCcw size={14} /> Ещё раз
              </button>
            </div>
          )}

        </div>

        {/* Transport */}
        <div className={cn("px-2 pt-2.5 pb-1.5 sm:px-3", !started && "pointer-events-none opacity-60")} inert={!started}>
          <div
            ref={timelineRef}
            onPointerMove={onTimelineMove}
            className="player-timeline relative h-7 rounded-lg has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-accent-soft"
          >
            {/* Ruler */}
            <div aria-hidden className="absolute inset-x-0 top-0 flex justify-between">
              {Array.from({ length: 31 }, (_, i) => (
                <span key={i} className={cn("w-px bg-white/14", i % 5 === 0 ? "h-2" : "h-1")} />
              ))}
            </div>
            {/* Chapters: a keyframe diamond on the ruler and a gap in the bar */}
            {markers.map((c) => (
              <span key={c.at} aria-hidden className="absolute top-0 -translate-x-1/2" style={{ left: `${(c.at / length) * 100}%` }}>
                <span className="block size-[7px] rotate-45 rounded-[1.5px] border border-accent/60 bg-ink-950" />
              </span>
            ))}
            <div aria-hidden className="player-track absolute inset-x-0 top-1/2 mt-1 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-white/10">
              <div className="absolute inset-y-0 left-0 bg-white/15" style={{ width: "calc(var(--b, 0) * 100%)" }} />
              <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-accent-strong/60 via-accent to-accent-soft" style={{ width: "calc(var(--p, 0) * 100%)" }} />
              {markers.map((c) => (
                <span key={c.at} className="absolute inset-y-0 w-[3px] -translate-x-1/2 bg-ink-950" style={{ left: `${(c.at / length) * 100}%` }} />
              ))}
            </div>
            <div
              aria-hidden
              className="absolute top-0 bottom-0 w-px -translate-x-1/2 bg-accent-soft shadow-[0_0_8px_rgb(var(--rgb-accent)/0.8)]"
              style={{ left: "calc(var(--p, 0) * 100%)" }}
            >
              <span className="absolute -top-0.5 left-1/2 h-2.5 w-3 -translate-x-1/2 rounded-b-[4px] bg-accent-soft" />
            </div>
            <span ref={tipRef} aria-hidden className="player-tip pointer-events-none absolute bottom-[calc(100%+0.4rem)] z-10 flex max-w-56 flex-col items-center rounded-xl border border-white/10 bg-ink-950/90 px-2.5 py-1.5 text-center shadow-[0_10px_30px_-10px_rgb(0_0_0/0.9)] backdrop-blur-md">
              <span ref={tipTimeRef} className="font-mono text-[11px] text-accent-soft tabular-nums" />
              <span ref={tipTitleRef} className="mt-0.5 max-w-full truncate text-[11.5px] text-fg/85 empty:hidden" />
            </span>
            <input
              ref={rangeRef}
              type="range"
              min={0}
              max={length || 1}
              step="any"
              defaultValue={0}
              aria-label="Перемотка"
              onPointerDown={() => {
                scrubbingRef.current = true;
                timelineRef.current?.setAttribute("data-scrub", "");
              }}
              onPointerUp={() => {
                scrubbingRef.current = false;
                timelineRef.current?.removeAttribute("data-scrub");
              }}
              onInput={(e) => {
                const v = videoRef.current;
                if (v) v.currentTime = Number(e.currentTarget.value);
              }}
              onKeyDown={(e) => {
                // Arrows are handled above (±5 s); no native tiny step
                if (e.key.startsWith("Arrow")) e.preventDefault();
              }}
              className="absolute inset-0 size-full cursor-pointer appearance-none opacity-0"
            />
          </div>

          <div className="mt-1 flex items-center gap-1 sm:gap-1.5">
            <ControlButton ref={playBtnRef} onClick={togglePlay} label={playing ? "Пауза (K)" : "Смотреть (K)"}>
              {playing ? <Pause size={16} /> : <Play size={16} />}
            </ControlButton>
            <ControlButton onClick={() => seekBy(-JUMP_STEP)} label="Назад на 10 секунд (J)">
              <Undo2 size={16} />
            </ControlButton>
            <ControlButton onClick={() => seekBy(JUMP_STEP)} label="Вперёд на 10 секунд (L)">
              <Redo2 size={16} />
            </ControlButton>
            <p className="ml-1.5 font-mono text-[11.5px] whitespace-nowrap text-accent-soft tabular-nums sm:text-[12px]">
              <span ref={timeRef}>0:00</span>
              <span className="text-dim"> / {formatClock(length)}</span>
            </p>
            <span className="flex-1" />
            <span className="group/vol hidden items-center sm:flex">
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={(e) => {
                  const v = videoRef.current;
                  if (!v) return;
                  v.volume = Number(e.currentTarget.value);
                  v.muted = v.volume === 0;
                }}
                aria-label="Громкость"
                className="mr-1 h-1 w-0 cursor-pointer accent-[var(--color-accent)] opacity-0 transition-[width,opacity] duration-300 group-focus-within/vol:w-20 group-focus-within/vol:opacity-100 group-hover/vol:w-20 group-hover/vol:opacity-100"
              />
              <ControlButton onClick={toggleMute} label={muted ? "Включить звук (M)" : "Выключить звук (M)"}>
                {muted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </ControlButton>
            </span>
            <span className="sm:hidden">
              <ControlButton onClick={toggleMute} label={muted ? "Включить звук" : "Выключить звук"}>
                {muted || volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </ControlButton>
            </span>

            {/* Speed */}
            <div data-rate-menu className="relative">
              <button
                type="button"
                onClick={() => setRateMenu((o) => !o)}
                aria-haspopup="menu"
                aria-expanded={rateMenu}
                aria-label={`Скорость: ${rate}×`}
                title="Скорость (Shift + < / >)"
                className={cn(
                  "inline-flex h-8 min-w-11 items-center justify-center rounded-xl border px-2 font-mono text-[11.5px] transition sm:h-9",
                  rate !== 1 ? "border-accent/35 bg-accent/10 text-accent-soft" : "border-white/10 bg-white/[0.05] text-fg/80 hover:bg-white/10",
                )}
              >
                {rate}×
              </button>
              <div
                role="menu"
                aria-label="Скорость"
                data-open={rateMenu || undefined}
                inert={!rateMenu}
                className="menu-pop glass glass-strong absolute right-0 bottom-[calc(100%+0.5rem)] z-20 w-36 origin-bottom-right rounded-[1.1rem] p-1.5"
              >
                {RATES.map((r) => (
                  <button
                    key={r}
                    type="button"
                    role="menuitemradio"
                    aria-checked={r === rate}
                    onClick={() => {
                      pickRate(r);
                      setRateMenu(false);
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left font-mono text-[12.5px] transition",
                      r === rate ? "bg-white/[0.07] text-fg" : "text-fg/70 hover:bg-white/[0.05] hover:text-fg",
                    )}
                  >
                    {r === 1 ? "1× обычная" : `${r}×`}
                    <Check size={13} aria-hidden className={cn("text-accent", r === rate ? "opacity-100" : "opacity-0")} />
                  </button>
                ))}
              </div>
            </div>

            {video.renditions.length > 1 && (
              <button
                type="button"
                onClick={cycleQuality}
                aria-label={`Качество: ${rendition.label}. Переключить`}
                title="Качество видео"
                className="hidden h-9 items-center rounded-xl border border-white/10 bg-white/[0.05] px-2.5 font-mono text-[11px] text-fg/80 transition hover:bg-white/10 sm:inline-flex"
              >
                {rendition.label}
              </button>
            )}
            {pip && (
              <span className="hidden sm:inline-flex">
                <ControlButton onClick={togglePip} label="Картинка в картинке">
                  <PictureInPicture2 size={16} />
                </ControlButton>
              </span>
            )}
            <ControlButton onClick={toggleFullscreen} label={fullscreen ? "Выйти из полноэкранного режима (F)" : "Во весь экран (F)"}>
              {fullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            </ControlButton>
          </div>
        </div>
      </div>
    </div>
  );
}

function ControlButton({ label, onClick, children, ref }: { label: string; onClick: () => void; children: React.ReactNode; ref?: React.Ref<HTMLButtonElement> }) {
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
