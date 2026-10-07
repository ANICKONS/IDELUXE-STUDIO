"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AudioLines,
  Film,
  FolderOpen,
  Hand,
  Magnet,
  MousePointer2,
  Pause,
  Play,
  Scissors,
  SkipBack,
  SkipForward,
  Sparkles,
  Timer,
  Type,
} from "lucide-react";
import { BackgroundVideo } from "@/components/ui/background-video";
import { ReelButton } from "@/features/reel/reel-button";
import { ClickHint } from "@/features/reel/click-hint";
import { landingVideos, mediaUrl, reels } from "@/config/media";
import { packStats } from "@/content/pack";
import { HERO_REEL_ORIGIN } from "@/features/reel/origins";
import { formatClock, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { readTransitHold } from "@/lib/transit-hold";
import { readVideoHold } from "@/lib/video-hold";
import {
  LOOP,
  SEQ_DURATION,
  SEQ_OFFSET,
  THUMB_TILES,
  buildRows,
  clips,
  fxLayers,
  indexAt,
  musicWaveformPath,
  sfx,
  timecode,
  titles,
  type ClipKind,
} from "@/features/landing/sections/hero/editor/showreel-edit";

const THUMBS = mediaUrl("editor-thumbs.jpg");
const WAVEFORM = musicWaveformPath();
const pct = (seconds: number) => `${(seconds / LOOP) * 100}%`;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

const workspaces = ["Сборка", "Монтаж", "Цвет", "Эффекты", "Звук"];
/** Icons for the project bin, in the order of packStats: footage, presets, textures, SFX. */
const binIcons = [Film, Sparkles, FolderOpen, AudioLines];

const kindTone: Record<ClipKind, string> = {
  footage: "border-accent/45 bg-accent-strong/25",
  comp: "border-rose/60 bg-rose/25",
  flash: "border-amber/70 bg-amber/35",
  "3d": "border-teal/60 bg-teal/25",
  transition: "border-sky/60 bg-sky/25",
};
const kindDot: Record<ClipKind, string> = {
  footage: "bg-accent",
  comp: "bg-rose",
  flash: "bg-amber",
  "3d": "bg-teal",
  transition: "bg-sky",
};

/**
 * Short desktop screens (`short:`): the side panels take the monitor's height and clip whatever
 * doesn't fit (lower rows of the effect controls, the info list) — so the window is only as tall
 * as its program monitor and the whole hero fits the first screen.
 */
const SHORT_PANEL = "short:relative short:overflow-hidden short:[contain:size] short:[mask-image:linear-gradient(to_bottom,#000_82%,transparent)]";

/** Ruler marks in sequence time (the teaser covers 27.3–43.3 s of the showreel). */
const rulerSeconds = Array.from({ length: 16 }, (_, i) => 28 + i).filter((s) => s < SEQ_OFFSET + LOOP);

/**
 * Landing "editor": the showreel plays in the program monitor, and everything around it
 * is driven by video.currentTime — playhead, timecode, the clip under the playhead (real cuts),
 * its effect parameters with keyframes, a live luma waveform and audio meters.
 */
/** `className` goes on the glass window itself (e.g. its entrance: `arrive` must sit on the glass). */
export function EditorMock({ className }: { className?: string }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const fxRef = useRef<HTMLDivElement>(null);
  const lanesRef = useRef<HTMLDivElement>(null);
  const scopeRef = useRef<HTMLCanvasElement>(null);
  const meterLRef = useRef<HTMLSpanElement>(null);
  const meterRRef = useRef<HTMLSpanElement>(null);
  const timecodeRef = useRef<HTMLSpanElement>(null);
  const renderPctRef = useRef<HTMLSpanElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const exportBarRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [userPaused, setUserPaused] = useState(false);
  const [active, setActive] = useState({ clip: 0, layer: -1 });
  const [inView, setInView] = useState(false);

  const clip = clips[active.clip];
  const layer = active.layer >= 0 ? fxLayers[active.layer] : null;
  const rows = useMemo(() => buildRows(clips[active.clip], active.layer >= 0 ? fxLayers[active.layer] : null), [active]);
  const rowsRef = useRef(rows);
  useEffect(() => {
    rowsRef.current = rows;
  }, [rows]);

  const onVideo = useCallback((el: HTMLVideoElement | null) => {
    videoRef.current = el;
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: "100px 0px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /* ── One rAF loop drives the whole editor from the video's clock (no re-renders except on cuts) ── */
  useEffect(() => {
    if (!inView) return;
    const off = document.createElement("canvas");
    off.width = 64;
    off.height = 36;
    const octx = off.getContext("2d", { willReadFrequently: true });
    const prev = new Float32Array(64 * 36);
    let scopeOk = Boolean(octx);
    let frame = 0;
    let level = 0;
    let lastClip = -1;
    let lastLayer = -2;
    let lastT = -1;
    let lastCode = "";
    let lastPct = "";
    let raf = 0;
    let lastTick = 0;
    const html = document.documentElement;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      // Hidden behind the open reel player, or a page switch is under way (the video is paused
      // too, lib/transit-hold.ts): nothing to update, the frames go to the camera flight
      if (readVideoHold() || readTransitHold()) return;
      // ~50–60 updates a second are plenty for a playhead and some readouts (the video itself
      // plays at 24–30 fps); on 120/144 Hz screens this halves the work
      if (now - lastTick < 1000 / 60 - 2) return;
      lastTick = now;
      const v = videoRef.current;
      const t = v && v.readyState >= 1 ? v.currentTime : 0;
      const playing = Boolean(v && !v.paused && v.readyState >= 2);
      // Paused and already drawn: only the meters may still be settling
      if (t === lastT && !playing && level < 0.005) return;
      lastT = t;
      const d = v && Number.isFinite(v.duration) && v.duration > 0 ? v.duration : LOOP;
      const k = clamp01(t / d);
      // Playheads move by transform (no layout); text is only rewritten when it changes
      if (playheadRef.current) playheadRef.current.style.transform = `translateX(${(k * 100).toFixed(3)}%)`;
      if (exportBarRef.current) exportBarRef.current.style.transform = `scaleX(${k.toFixed(4)})`;
      const code = timecode(SEQ_OFFSET + t);
      if (code !== lastCode && timecodeRef.current) timecodeRef.current.textContent = lastCode = code;
      const pct = `${Math.floor(k * 100)} %`;
      if (pct !== lastPct && renderPctRef.current) renderPctRef.current.textContent = lastPct = pct;

      const ci = Math.max(0, indexAt(clips, t));
      const li = indexAt(fxLayers, t);
      if (ci !== lastClip || li !== lastLayer) {
        lastClip = ci;
        lastLayer = li;
        setActive({ clip: ci, layer: li });
      }

      // Effect values + local playheads inside the keyframe lanes.
      const c = clips[ci];
      const p = clamp01((t - c.start) / (c.end - c.start));
      const l = li >= 0 ? fxLayers[li] : null;
      const lp = l ? clamp01((t - l.start) / (l.end - l.start)) : 0;
      const panel = fxRef.current;
      if (panel) {
        panel.style.setProperty("--lp", String(p));
        panel.style.setProperty("--lpl", String(lp));
        const els = panel.querySelectorAll<HTMLElement>("[data-fx-value]");
        const current = rowsRef.current;
        els.forEach((el, i) => {
          const row = current[i];
          if (!row) return;
          const text = row.value(row.layer ? lp : p, t);
          if (el.textContent !== text) el.textContent = text;
        });
      }

      // Live luma waveform + meters (motion energy, punched up on every cut). Reading video pixels
      // back from the GPU is the costly part: ~15 times a second, and not during a camera flight
      if (playing && scopeOk && octx && ++frame % 4 === 0 && !html.hasAttribute("data-flying")) {
        try {
          octx.drawImage(v!, 0, 0, 64, 36);
          const data = octx.getImageData(0, 0, 64, 36).data;
          const scope = scopeRef.current;
          const sctx = scope?.getContext("2d");
          let diff = 0;
          if (scope && sctx) {
            const w = scope.width;
            const h = scope.height;
            sctx.globalCompositeOperation = "source-over";
            sctx.fillStyle = "rgba(5, 6, 8, 0.55)";
            sctx.fillRect(0, 0, w, h);
            sctx.globalCompositeOperation = "lighter";
            // Luma waveform in the scopes' classic neutral grey-white
            sctx.fillStyle = "rgba(205, 214, 228, 0.18)";
            const cw = w / 64;
            for (let i = 0; i < 64 * 36; i++) {
              const o = i * 4;
              const luma = (0.2126 * data[o] + 0.7152 * data[o + 1] + 0.0722 * data[o + 2]) / 255;
              diff += Math.abs(luma - prev[i]);
              prev[i] = luma;
              sctx.fillRect((i % 64) * cw, (1 - luma) * (h - 6) + 3, cw, 1.4);
            }
          }
          const energy = diff / (64 * 36);
          const hit = Math.exp(-(t - c.start) * 9) * 0.45;
          level = Math.max(Math.min(1, 0.28 + energy * 7 + hit), level * 0.9);
        } catch {
          scopeOk = false; // cross-origin media without CORS: scopes stay idle
        }
      } else if (!playing) {
        level *= 0.9;
      }
      if (meterLRef.current) meterLRef.current.style.transform = `scaleY(${level.toFixed(3)})`;
      if (meterRRef.current) meterRRef.current.style.transform = `scaleY(${(level * (0.9 + 0.08 * Math.sin(t * 17))).toFixed(3)})`;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView]);

  /* ── Transport ── */
  const seek = useCallback((t: number) => {
    const v = videoRef.current;
    if (!v) return;
    const d = Number.isFinite(v.duration) && v.duration > 0 ? v.duration : LOOP;
    v.currentTime = Math.min(d - 0.01, Math.max(0, t));
  }, []);

  const jump = (dir: -1 | 1) => {
    const v = videoRef.current;
    if (!v) return;
    const i = Math.max(0, indexAt(clips, v.currentTime));
    if (dir === 1) return seek(clips[(i + 1) % clips.length].start + 0.01);
    const intoClip = v.currentTime - clips[i].start;
    seek(clips[intoClip > 0.25 || i === 0 ? i : i - 1].start + 0.01);
  };

  /** Click or drag anywhere on the tracks to scrub. */
  const onScrub = (e: React.PointerEvent<HTMLDivElement>) => {
    const lanes = lanesRef.current;
    const v = videoRef.current;
    if (!lanes || !v || e.button !== 0) return;
    const to = (x: number) => {
      const r = lanes.getBoundingClientRect();
      const d = Number.isFinite(v.duration) && v.duration > 0 ? v.duration : LOOP;
      seek(clamp01((x - r.left) / r.width) * d);
    };
    to(e.clientX);
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const move = (ev: PointerEvent) => to(ev.clientX);
    const up = () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
  };

  return (
    <div
      ref={rootRef}
      role="group"
      aria-label="Демо: монтаж шоурила IDELUXE"
      className={cn("glass glass-strong overflow-hidden rounded-[1.6rem] p-0 text-left", className)}
      data-no-spot
    >
      {/* Title bar */}
      <div className="flex items-center gap-3 border-b border-white/6 px-4 py-2.5">
        <div className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-[#ff5f57]/80" />
          <span className="size-2.5 rounded-full bg-[#febc2e]/80" />
          <span className="size-2.5 rounded-full bg-[#28c840]/80" />
        </div>
        <span className="truncate font-mono text-[11px] text-dim">IDELUXE STUDIO — showreel_2026.prproj</span>
        <ul aria-hidden className="mx-auto hidden items-center gap-1 lg:flex">
          {workspaces.map((w) => (
            <li
              key={w}
              className={cn(
                "rounded-md px-2.5 py-1 text-[11px]",
                w === "Монтаж" ? "bg-accent/20 text-accent-soft shadow-[inset_0_-1px_0_rgb(var(--rgb-accent)/0.8)]" : "text-dim",
              )}
            >
              {w}
            </li>
          ))}
        </ul>
        <span aria-hidden className="ml-auto hidden shrink-0 font-mono text-[10px] whitespace-nowrap text-dim sm:inline lg:ml-0">
          1920×1080 · 23,976 fps
        </span>
      </div>

      {/* Panels */}
      {/* Desktop: effect controls | program monitor | scopes. The monitor's column may be set from
          outside (--editor-monitor: the hero fits it to the screen height), the side panels then
          share the rest 250 : 190; without it they are 250 / 190 px and the monitor takes the rest */}
      <div className="grid grid-cols-1 gap-px bg-white/[0.05] md:grid-cols-[minmax(0,1fr)_190px] lg:grid-cols-[minmax(0,1fr)_var(--editor-monitor,calc(100%_-_442px))_minmax(0,0.76fr)]">
        {/* Effect controls of the clip under the playhead */}
        <aside
          ref={fxRef}
          aria-hidden
          className={cn("hidden flex-col bg-ink-900/60 p-3 lg:flex", SHORT_PANEL)}
          style={{ ["--lp" as string]: 0, ["--lpl" as string]: 0 }}
        >
          <PanelTitle>Элементы управления эффектами</PanelTitle>
          <div className="mt-2.5 flex items-center gap-2 rounded-lg border border-white/6 bg-white/[0.03] px-2 py-1.5">
            <span className={cn("size-2 shrink-0 rounded-[2px]", kindDot[clip.kind])} />
            <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-fg">Главный · {clip.name}</span>
            <span className="shrink-0 font-mono text-[10px] text-dim">{(clip.end - clip.start).toFixed(2).replace(".", ",")} с</span>
          </div>
          <ul key={`${active.clip}:${active.layer}`} className="mt-2 animate-fade-in space-y-[3px]">
            {rows.map((row, i) => {
              const header = i === 0 || rows[i - 1].group !== row.group;
              return (
                <li key={i}>
                  {header && (
                    <p className={cn("flex items-center gap-1.5 pt-1.5 pb-1 text-[10.5px] font-semibold", row.layer ? "text-rose" : "text-fg/85")}>
                      <span className="rounded bg-white/8 px-1 font-mono text-[9px] text-accent-soft">fx</span>
                      <span className="truncate">{row.group}</span>
                    </p>
                  )}
                  {/* The keyframe lane grows with the panel, like the effect controls' own timeline */}
                  <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(58px,0.7fr)] items-center gap-2 pl-1">
                    <span className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted">
                      <Timer size={10} className={cn("shrink-0", row.keys.length ? "text-accent" : "text-dim/50")} />
                      <span className="truncate">{row.label}</span>
                    </span>
                    <span data-fx-value className="font-mono text-[10.5px] whitespace-nowrap text-accent-soft tabular-nums">
                      {row.value(0, 0)}
                    </span>
                    <span className="relative h-3.5 rounded-sm bg-white/[0.04]">
                      {row.keys.map((k) => (
                        <span
                          key={k}
                          className="absolute top-1/2 size-[6px] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-amber/90"
                          style={{ left: `${k * 100}%` }}
                        />
                      ))}
                      <span
                        className="absolute inset-y-0 w-px bg-accent-soft shadow-[0_0_4px_rgb(var(--rgb-accent)/0.7)]"
                        style={{ left: row.layer ? "calc(var(--lpl) * 100%)" : "calc(var(--lp) * 100%)" }}
                      />
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>

          {/* Project bin = what's inside IDX PACK (hidden on short screens: the hero needs the height) */}
          <div className="mt-auto border-t border-white/6 pt-2.5 short:hidden">
            <PanelTitle>Проект · IDX PACK</PanelTitle>
            <ul className="mt-1.5 grid grid-cols-2 gap-1">
              {packStats.map((s, i) => {
                const Icon = binIcons[i % binIcons.length];
                return (
                  <li key={s.label} className="flex items-center gap-1.5 rounded-md bg-white/[0.03] px-1.5 py-1 text-[10px] text-muted">
                    <Icon size={11} className="shrink-0 text-accent" />
                    <span className="truncate">{s.label}</span>
                    <span className="ml-auto font-mono text-[9px] text-dim">{formatNumber(s.value)}+</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        {/* Program monitor */}
        <div className="bg-ink-950/70 p-2.5 sm:p-3">
          <div className="flex items-center justify-between gap-3 px-0.5 pb-2">
            <PanelTitle>Программа: Showreel_2026</PanelTitle>
            <span aria-hidden className="shrink-0 font-mono text-[10px] whitespace-nowrap text-dim">
              Вписать · Полное
            </span>
          </div>

          <div id={HERO_REEL_ORIGIN} data-reel-tilt="0" className="relative aspect-video overflow-hidden rounded-lg bg-black">
            <BackgroundVideo
              video={landingVideos.reelTeaser}
              priority
              paused={userPaused}
              onVideo={onVideo}
              className="absolute inset-0"
            />
            {/* Action-safe / title-safe guides and centre cross, like a real program monitor */}
            <div aria-hidden className="pointer-events-none absolute inset-[5%] rounded-[2px] border border-dashed border-white/[0.12]" />
            <div aria-hidden className="pointer-events-none absolute inset-[10%] rounded-[2px] border border-white/[0.06]" />
            <div aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 h-3 w-px -translate-1/2 bg-white/20" />
            <div aria-hidden className="pointer-events-none absolute top-1/2 left-1/2 h-px w-3 -translate-1/2 bg-white/20" />

            <ReelButton
              reel="showreel"
              origin={`#${HERO_REEL_ORIGIN}`}
              aria-label={`Смотреть шоурил IDELUXE со звуком, ${formatClock(reels.showreel.duration)}`}
              className="group/hint absolute inset-0 cursor-pointer rounded-lg focus-visible:-outline-offset-2"
            >
              <ClickHint label="Смотреть со звуком" delay={2} className="max-sm:scale-[0.85]" />
            </ReelButton>
          </div>

          {/* Transport */}
          <div className="mt-2 flex items-center gap-2 px-0.5">
            <span ref={timecodeRef} className="font-mono text-[12px] text-accent-soft tabular-nums">
              {timecode(SEQ_OFFSET)}
            </span>
            <div className="mx-auto flex items-center gap-1">
              <TransportButton label="К предыдущей склейке" onClick={() => jump(-1)}>
                <SkipBack size={13} />
              </TransportButton>
              <TransportButton label={userPaused ? "Воспроизвести" : "Пауза"} onClick={() => setUserPaused((v) => !v)} primary>
                {userPaused ? <Play size={14} className="translate-x-px" /> : <Pause size={14} />}
              </TransportButton>
              <TransportButton label="К следующей склейке" onClick={() => jump(1)}>
                <SkipForward size={13} />
              </TransportButton>
            </div>
            <span aria-hidden className="font-mono text-[12px] text-dim tabular-nums">
              {timecode(SEQ_DURATION)}
            </span>
          </div>
        </div>

        {/* Scopes, meters, clip info */}
        <aside aria-hidden className={cn("hidden flex-col bg-ink-900/60 p-3 md:flex", SHORT_PANEL)}>
          <PanelTitle>Lumetri Scopes</PanelTitle>
          <div className="relative mt-2 aspect-[16/10] overflow-hidden rounded-md border border-white/6 bg-[#050608]">
            {[0, 25, 50, 75, 100].map((ire) => (
              <span key={ire} className="absolute inset-x-0 border-t border-white/[0.06]" style={{ bottom: `${3 + ire * 0.94}%` }}>
                <span className="absolute -top-[5px] left-0.5 font-mono text-[7px] leading-none text-dim/70">{ire}</span>
              </span>
            ))}
            <canvas ref={scopeRef} width={176} height={110} className="absolute inset-0 size-full" />
          </div>

          <div className="mt-3 flex items-end gap-3">
            <div>
              <PanelTitle>Звук</PanelTitle>
              <div className="mt-2 flex h-20 items-end gap-1">
                <MeterBar barRef={meterLRef} />
                <MeterBar barRef={meterRRef} />
                <span className="flex h-full flex-col justify-between font-mono text-[8px] leading-none text-dim">
                  <span>0</span>
                  <span>-12</span>
                  <span>-24</span>
                  <span>-48</span>
                </span>
              </div>
            </div>
            <dl className="min-w-0 flex-1 space-y-1.5 text-[10px]">
              <Info label="Клип">{clip.name}</Info>
              <Info label="Вход">{timecode(SEQ_OFFSET + clip.start).slice(3)}</Info>
              <Info label="Выход">{timecode(SEQ_OFFSET + clip.end).slice(3)}</Info>
              <Info label="Слой">{layer ? layer.name : "—"}</Info>
            </dl>
          </div>

          {/* Export queue follows the playhead (hidden on short screens, like the project bin) */}
          <div className="mt-auto border-t border-white/6 pt-2.5 short:hidden">
            <PanelTitle>Очередь экспорта</PanelTitle>
            <div className="mt-1.5 rounded-md bg-white/[0.03] px-2 py-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="truncate text-muted">YouTube · H.264 1080p</span>
                <span ref={renderPctRef} className="font-mono text-accent-soft">0 %</span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/[0.07]">
                <div ref={exportBarRef} className="h-full origin-left rounded-full bg-gradient-to-r from-accent-strong to-accent-soft" style={{ transform: "scaleX(0)" }} />
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Timeline */}
      <div aria-hidden className="border-t border-white/6 bg-ink-900/70 px-2.5 pt-2 pb-3 sm:px-3">
        <div className="flex items-center gap-3">
          <PanelTitle>Таймлайн · Showreel_2026</PanelTitle>
          <span className="hidden items-center gap-0.5 sm:flex">
            {[MousePointer2, Scissors, Hand, Magnet].map((Icon, i) => (
              <span key={i} className={cn("inline-flex size-6 items-center justify-center rounded-md", i === 0 ? "bg-accent/20 text-accent-soft" : "text-dim")}>
                <Icon size={12} />
              </span>
            ))}
          </span>
          <span className="ml-auto hidden font-mono text-[10px] text-dim sm:inline">
            {clips.length} клип · {titles.length} титров · {sfx.length} SFX
          </span>
        </div>

        <div className="relative mt-2">
          <div className="space-y-1">
            <Row label="">
              <div className="relative h-4">
                {rulerSeconds.map((s) => (
                  <span key={s} className="absolute bottom-0 flex flex-col items-start" style={{ left: pct(s - SEQ_OFFSET) }}>
                    <span className={cn("-translate-x-1/2 font-mono text-[9px] text-dim", s % 2 ? "hidden" : s % 4 ? "hidden sm:block" : "block")}>
                      00:{s}
                    </span>
                    <span className={cn("w-px bg-white/15", s % 2 ? "h-1" : "h-1.5")} />
                  </span>
                ))}
              </div>
            </Row>
            <Row label="V3">
              <Lane className="h-3.5 sm:h-4">
                {titles.map((c, i) => (
                  <Block key={i} start={c.start} end={c.end} className="border-teal/50 bg-teal/15 text-teal">
                    <Type size={9} className="hidden shrink-0 sm:block" />
                    <span className="hidden truncate sm:block">{c.name}</span>
                  </Block>
                ))}
              </Lane>
            </Row>
            <Row label="V2">
              <Lane className="h-3.5 sm:h-5 short:h-4">
                {fxLayers.map((c, i) => (
                  <Block key={i} start={c.start} end={c.end} active={i === active.layer} className="border-accent/40 bg-accent/15 pl-2.5 text-accent-soft">
                    {c.end - c.start >= 0.55 && <span className="hidden truncate lg:block">{c.name}</span>}
                    <Keyframe at="left" />
                    <Keyframe at="right" />
                  </Block>
                ))}
              </Lane>
            </Row>
            <Row label="V1">
              <Lane className="h-6 sm:h-9 short:h-7">
                {clips.map((c, i) => {
                  const long = c.end - c.start >= 0.8;
                  return (
                    <Block key={i} start={c.start} end={c.end} active={i === active.clip} className={cn(kindTone[c.kind], "gap-1 px-0.5 text-white/85")}>
                      {long && (
                        <span
                          className="hidden h-full w-9 shrink-0 rounded-[3px] bg-cover sm:block"
                          style={{
                            backgroundImage: `url(${THUMBS})`,
                            backgroundSize: `${THUMB_TILES * 100}% 100%`,
                            backgroundPosition: `${(c.thumb / (THUMB_TILES - 1)) * 100}% 0`,
                          }}
                        />
                      )}
                      {c.end - c.start >= 1.1 && <span className="hidden truncate lg:block">{c.name}</span>}
                    </Block>
                  );
                })}
              </Lane>
            </Row>
            <Row label="A1">
              <Lane className="h-5 sm:h-7 short:h-5">
                <div className="absolute inset-0 overflow-hidden rounded-[5px] border border-teal/30 bg-teal/[0.07]">
                  <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="size-full">
                    <path d={WAVEFORM} fill="rgb(143 185 174 / 0.55)" />
                  </svg>
                  <span className="absolute top-0.5 left-1.5 hidden font-mono text-[9px] text-teal/90 sm:block">beat_ideluxe.wav</span>
                </div>
              </Lane>
            </Row>
            <Row label="A2" className="short:hidden">
              <Lane className="h-3.5 sm:h-4">
                {sfx.map((c, i) => (
                  <Block key={i} start={c.start} end={c.end} className="border-sky/40 bg-[repeating-linear-gradient(90deg,rgb(147_178_212/0.35)_0_1px,transparent_1px_3px)] text-sky">
                    {c.end - c.start >= 0.4 && <span className="hidden truncate lg:block">{c.name}</span>}
                  </Block>
                ))}
              </Lane>
            </Row>
          </div>

          {/* Scrub area + playhead, aligned with the lanes (header column is 2.25rem + gap) */}
          <div ref={lanesRef} onPointerDown={onScrub} className="absolute top-0 right-0 bottom-0 left-[calc(2.25rem+0.5rem)] cursor-ew-resize touch-pan-y">
            <div ref={playheadRef} className="pointer-events-none absolute inset-0">
              <div className="absolute top-0 bottom-0 left-0 w-px bg-accent-soft shadow-[0_0_8px_rgb(var(--rgb-accent)/0.8)]">
                <span className="absolute -top-0.5 left-1/2 h-2.5 w-3 -translate-x-1/2 rounded-b-[4px] bg-accent-soft" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PanelTitle({ children }: { children: React.ReactNode }) {
  return <span className="block truncate font-mono text-[10px] tracking-[0.14em] text-dim uppercase">{children}</span>;
}

function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="shrink-0 text-dim">{label}</dt>
      <dd className="min-w-0 truncate font-mono text-muted">{children}</dd>
    </div>
  );
}

function MeterBar({ barRef }: { barRef: React.Ref<HTMLSpanElement> }) {
  return (
    <span className="relative h-full w-2.5 overflow-hidden rounded-[2px] bg-white/[0.05]">
      <span
        ref={barRef}
        className="absolute inset-0 origin-bottom bg-[linear-gradient(0deg,#93b2d4_0%,#93b2d4_55%,#e2b46e_78%,#f3f0ea_100%)]"
        style={{ transform: "scaleY(0)" }}
      />
    </span>
  );
}

function TransportButton({ label, onClick, children, primary }: { label: string; onClick: () => void; children: React.ReactNode; primary?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-white/10 text-fg/80 transition hover:bg-white/10 hover:text-fg",
        primary ? "size-8 bg-white/[0.08]" : "size-7 bg-white/[0.03]",
      )}
    >
      {children}
    </button>
  );
}

function Row({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("grid grid-cols-[2.25rem_minmax(0,1fr)] items-center gap-2", className)}>
      <span className={cn("flex h-full items-center justify-center rounded-md font-mono text-[10px] text-dim", label && "bg-white/[0.04]")}>{label}</span>
      {children}
    </div>
  );
}

function Lane({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("relative rounded-md bg-white/[0.025]", className)}>{children}</div>;
}

function Block({
  start,
  end,
  active,
  className,
  children,
}: {
  start: number;
  end: number;
  active?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "absolute inset-y-0 flex items-center gap-1 overflow-hidden rounded-[4px] border px-1 font-mono text-[9.5px] transition-[filter,box-shadow] duration-150",
        className,
        active && "z-10 shadow-[0_0_0_1px_rgb(255_255_255/0.75),0_0_14px_rgb(var(--rgb-accent)/0.5)] brightness-125",
      )}
      style={{ left: `calc(${pct(start)} + 1px)`, width: `max(2px, calc(${pct(end - start)} - 2px))` }}
    >
      {children}
    </div>
  );
}

function Keyframe({ at }: { at: "left" | "right" }) {
  return (
    <span
      className={cn(
        "absolute top-1/2 hidden size-[5px] -translate-y-1/2 rotate-45 bg-amber/90 sm:block",
        at === "left" ? "left-0.5" : "right-0.5",
      )}
    />
  );
}
