"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ArrowUpRight, Hand, Magnet, MousePointer2, Pause, Play, Scissors, SkipBack, SkipForward, Volume2 } from "lucide-react";
import { AppTile } from "@/components/ui/app-tile";
import { site } from "@/config/site";
import { softwareName } from "@/content/edits";
import { openReel } from "@/features/reel/events";
import { formatClock, pluralRu } from "@/lib/format";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { readTransitHold, subscribeTransitHold } from "@/lib/transit-hold";
import { readVideoHold, subscribeVideoHold } from "@/lib/video-hold";
import { cn } from "@/lib/utils";
import { Block, Info, Lane, PanelTitle, Playhead, Row, TransportButton, startScrub } from "@/features/landing/sections/hero/editor/editor-parts";
import {
  FEED_TOTAL,
  editReel,
  editWaveformPath,
  feed,
  feedIndexAt,
  feedOffset,
} from "@/features/landing/sections/hero/editor/edits-sequence";
import { timecode } from "@/features/landing/sections/hero/editor/showreel-edit";

const COUNT = feed.length;
const WAVEFORMS = feed.map((_, i) => editWaveformPath(i + 1));
/** Ruler: a mark every second, a label every 5 s (every 10 s on phones). */
const rulerSeconds = Array.from({ length: Math.floor(FEED_TOTAL) + 1 }, (_, s) => s);
const pct = (seconds: number) => `${(seconds / FEED_TOTAL) * 100}%`;
const pad2 = (n: number) => String(n).padStart(2, "0");
const wrap = (i: number) => ((i % COUNT) + COUNT) % COUNT;

/**
 * «Шоурил эдитов»: a feed of short vertical edits (content/edits.ts) in the editor window.
 * - The cards stand in a row, the current one plays in the middle (muted); when it ends, the next
 *   one comes in. Swipe or drag them, use ←/→, click a neighbour, the project bin or the timeline.
 * - On the timeline the edits stand one after another like clips: the playhead runs across the
 *   whole sequence, and scrubbing it switches the videos.
 * - A click on the current card opens it with sound in the reel player (features/reel), which
 *   flies out of the card and back into it.
 * Nothing loads until the tab has been pointed at (`primed`: the covers), the videos — once it has
 * been opened (`opened`), and only for the current card and its neighbours. Paused while hidden,
 * off-screen, under the player, during page switches.
 */
export function EditsView({
  active,
  primed,
  opened,
  className,
  ...panel
}: { active: boolean; primed: boolean; opened: boolean; className?: string } & React.HTMLAttributes<HTMLDivElement>) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const playheadRef = useRef<HTMLDivElement>(null);
  const timecodeRef = useRef<HTMLSpanElement>(null);
  const videos = useRef(new Map<number, HTMLVideoElement>());
  const cards = useRef(new Map<number, HTMLButtonElement>());

  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  /** Where to start the edit that is about to become current (the timeline was scrubbed onto it). */
  const pendingRef = useRef<{ index: number; t: number } | null>(null);
  const lastIndexRef = useRef(-1);
  /** null = as the page decides (plays, unless the OS asks for less motion); then the user's choice. */
  const [playIntent, setPlayIntent] = useState<boolean | null>(null);
  const [inView, setInView] = useState(false);

  const held = useSyncExternalStore(subscribeVideoHold, readVideoHold, () => false);
  const transit = useSyncExternalStore(subscribeTransitHold, readTransitHold, () => false);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const wantPlay = playIntent ?? !reducedMotion;
  const canPlay = primed && active && inView && !held && !transit;
  const edit = feed[index];

  const go = useCallback((i: number, t?: number) => {
    const next = wrap(i);
    pendingRef.current = t === undefined ? null : { index: next, t };
    indexRef.current = next;
    setIndex(next);
  }, []);

  const step = useCallback((dir: number) => go(indexRef.current + dir), [go]);

  const open = useCallback((i: number) => {
    const card = cards.current.get(i);
    openReel(editReel(feed[i]), card?.querySelector<HTMLElement>("[data-media]") ?? card ?? null);
  }, []);

  /* ── Refs to the cards and their videos (by data-index) ── */
  const bindVideo = useCallback((el: HTMLVideoElement | null) => {
    if (!el) return;
    const i = Number(el.dataset.index);
    videos.current.set(i, el);
    return () => {
      if (videos.current.get(i) === el) videos.current.delete(i);
    };
  }, []);
  const bindCard = useCallback((el: HTMLButtonElement | null) => {
    if (!el) return;
    const i = Number(el.dataset.index);
    cards.current.set(i, el);
    return () => {
      if (cards.current.get(i) === el) cards.current.delete(i);
    };
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin: "100px 0px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /* ── Playback: only the current card plays; a card that becomes current starts from the top
     (or from where the timeline was scrubbed to) ── */
  useEffect(() => {
    const changed = lastIndexRef.current !== index;
    lastIndexRef.current = index;
    videos.current.forEach((el, i) => {
      if (i !== index && !el.paused) el.pause();
    });
    const v = videos.current.get(index);
    if (!v) return;
    const pending = pendingRef.current;
    if (pending?.index === index) {
      pendingRef.current = null;
      v.currentTime = pending.t;
    } else if (changed && v.currentTime > 0.05) {
      v.currentTime = 0;
    }
    if (canPlay && wantPlay) v.play().catch(() => {});
    else v.pause();
  }, [index, canPlay, wantPlay]);

  /* ── Focus follows the current card when the feed is driven from the keyboard ── */
  useEffect(() => {
    const stage = stageRef.current;
    if (stage?.contains(document.activeElement) && document.activeElement !== cards.current.get(index)) {
      cards.current.get(index)?.focus({ preventScroll: true });
    }
  }, [index]);

  /* ── One rAF loop: playhead across the sequence, timecode, the card's progress ── */
  useEffect(() => {
    if (!primed || !active || !inView) return;
    let raf = 0;
    let lastTick = 0;
    let lastCode = "";
    let lastG = -1;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (readVideoHold() || readTransitHold()) return;
      if (now - lastTick < 1000 / 60 - 2) return;
      lastTick = now;
      const i = indexRef.current;
      const item = feed[i];
      const v = videos.current.get(i);
      const pending = pendingRef.current;
      const local = pending?.index === i ? pending.t : v && v.readyState >= 1 ? Math.min(v.currentTime, item.duration) : 0;
      const g = item.start + local;
      if (g === lastG) return;
      lastG = g;
      if (playheadRef.current) playheadRef.current.style.transform = `translateX(${((g / FEED_TOTAL) * 100).toFixed(3)}%)`;
      stageRef.current?.style.setProperty("--ep", (local / item.duration).toFixed(4));
      const code = timecode(g);
      if (code !== lastCode && timecodeRef.current) timecodeRef.current.textContent = lastCode = code;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [primed, active, inView]);

  const onEnded = (i: number) => {
    if (i !== indexRef.current) return;
    if (COUNT > 1) return step(1);
    const v = videos.current.get(i);
    if (v) {
      v.currentTime = 0;
      v.play().catch(() => {});
    }
  };

  /* ── Transport ── */
  const prev = () => {
    // Like a player: back to the start of this edit first, then to the previous one
    const v = videos.current.get(indexRef.current);
    if (v && v.currentTime > 1.2) v.currentTime = 0;
    else step(-1);
  };

  /** Scrub the sequence: the edit under the pointer becomes current, at the time under the pointer. */
  const onScrub = (e: React.PointerEvent<HTMLDivElement>) =>
    startScrub(e, (k) => {
      const g = Math.min(k * FEED_TOTAL, FEED_TOTAL - 0.02);
      const i = feedIndexAt(g);
      const t = Math.max(0, g - feed[i].start);
      const v = videos.current.get(i);
      if (i !== indexRef.current) go(i, t);
      else if (v) v.currentTime = t;
    });

  /* ── Swipe / drag the cards (touch: horizontal moves only, vertical ones scroll the page) ── */
  const dragRef = useRef<{ x: number; y: number; id: number; dragging: boolean } | null>(null);
  const suppressClickRef = useRef(false);

  const onStagePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    dragRef.current = { x: e.clientX, y: e.clientY, id: e.pointerId, dragging: false };
  };
  const onStagePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    const stage = stageRef.current;
    if (!d || d.id !== e.pointerId || !stage) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.dragging) {
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        dragRef.current = null;
        return;
      }
      d.dragging = true;
      stage.setPointerCapture(e.pointerId);
      stage.dataset.dragging = "";
    }
    stage.style.setProperty("--drag", `${dx.toFixed(1)}px`);
  };
  const onStagePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    const stage = stageRef.current;
    dragRef.current = null;
    if (!d?.dragging || !stage) return;
    delete stage.dataset.dragging;
    stage.style.setProperty("--drag", "0px");
    // The click that follows a drag must not open or pick a card
    suppressClickRef.current = true;
    window.setTimeout(() => (suppressClickRef.current = false), 0);
    if (e.type === "pointercancel") return;
    const dx = e.clientX - d.x;
    const width = cards.current.get(indexRef.current)?.offsetWidth ?? 160;
    if (Math.abs(dx) < Math.min(56, width * 0.28)) return;
    const steps = Math.max(1, Math.min(2, Math.round(Math.abs(dx) / (width * 0.8))));
    step(dx < 0 ? steps : -steps);
  };

  /* ── Horizontal trackpad swipes: one card per gesture ── */
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    let lastEvent = 0;
    let acc = 0;
    let fired = false;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      const now = performance.now();
      if (now - lastEvent > 260) {
        acc = 0;
        fired = false;
      }
      lastEvent = now;
      if (fired) return;
      acc += e.deltaX;
      if (Math.abs(acc) > 40) {
        fired = true;
        step(acc > 0 ? 1 : -1);
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [step]);

  const playing = wantPlay && canPlay;

  return (
    <div ref={rootRef} className={cn("flex flex-col", className)} {...panel}>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-px bg-white/[0.05] md:grid-cols-[minmax(0,1fr)_190px] lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.5fr)_minmax(0,0.76fr)]">
        {/* Project bin: every edit, a click makes it current */}
        <aside data-enter className="hidden min-h-0 flex-col bg-ink-900/60 p-3 lg:flex">
          <div className="flex items-baseline justify-between gap-2">
            <PanelTitle>Проект · Эдиты</PanelTitle>
            <span className="shrink-0 font-mono text-[10px] text-dim">
              {COUNT} {pluralRu(COUNT, ["клип", "клипа", "клипов"])}
            </span>
          </div>
          <ul className="mt-2.5 min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin] [mask-image:linear-gradient(to_bottom,#000_88%,transparent)]">
            {feed.map((item, i) => {
              const current = i === index;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => (current ? open(i) : go(i))}
                    aria-current={current || undefined}
                    aria-label={current ? `Смотреть со звуком: «${item.title}»` : `Показать эдит «${item.title}»`}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg border px-1.5 py-1.5 text-left transition",
                      current ? "border-accent/35 bg-accent/[0.12]" : "border-transparent hover:bg-white/[0.04]",
                    )}
                  >
                    <span
                      className="aspect-[9/16] w-6 shrink-0 rounded-[4px] bg-ink-950 bg-cover bg-center shadow-[0_0_0_1px_rgb(255_255_255/0.08)]"
                      style={primed ? { backgroundImage: `url(${item.poster})` } : undefined}
                    />
                    <span className="min-w-0 flex-1">
                      <span className={cn("block truncate text-[12px] font-semibold", current ? "text-fg" : "text-fg/80")}>{item.title}</span>
                      <span className="block truncate text-[10.5px] text-dim">
                        {item.author} · {item.software}
                      </span>
                    </span>
                    {current ? (
                      <span aria-hidden data-paused={!playing || undefined} className="edit-eq flex h-3 shrink-0 items-end gap-[2px]">
                        <span data-loop className="h-full w-[3px] rounded-full bg-accent-soft" />
                        <span data-loop className="h-full w-[3px] rounded-full bg-accent-soft" />
                        <span data-loop className="h-full w-[3px] rounded-full bg-accent-soft" />
                      </span>
                    ) : (
                      <span className="shrink-0 font-mono text-[10px] text-dim">{formatClock(item.duration)}</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        {/* Program monitor = the feed */}
        <div data-enter className="flex min-h-0 flex-col bg-ink-950/70 p-2 [--d:1] sm:p-3">
          <div className="hidden items-center justify-between gap-3 px-0.5 pb-2 sm:flex">
            <PanelTitle>Программа: Эдиты</PanelTitle>
            <span aria-hidden className="shrink-0 font-mono text-[10px] whitespace-nowrap text-dim">
              {pad2(index + 1)} / {pad2(COUNT)} · 9:16
            </span>
          </div>

          <div
            ref={stageRef}
            role="group"
            aria-roledescription="лента"
            aria-label="Эдиты: листай стрелками или свайпом"
            onPointerDown={onStagePointerDown}
            onPointerMove={onStagePointerMove}
            onPointerUp={onStagePointerUp}
            onPointerCancel={onStagePointerUp}
            onClickCapture={(e) => {
              if (!suppressClickRef.current) return;
              suppressClickRef.current = false;
              e.preventDefault();
              e.stopPropagation();
            }}
            onKeyDown={(e) => {
              if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
              e.preventDefault();
              step(e.key === "ArrowLeft" ? -1 : 1);
            }}
            className="edit-stage relative min-h-0 flex-1 touch-pan-y overflow-hidden rounded-lg bg-[radial-gradient(60%_70%_at_50%_55%,rgb(var(--rgb-accent)/0.1),transparent_70%)] select-none [mask-image:linear-gradient(90deg,transparent,#000_9%,#000_91%,transparent)]"
            style={{ ["--ep" as string]: 0, ["--drag" as string]: "0px" }}
          >
            {feed.map((item, i) => {
              const o = feedOffset(i, index);
              const a = Math.abs(o);
              const current = o === 0;
              const far = a > 2;
              const withVideo = opened && a <= 1;
              return (
                <button
                  key={item.id}
                  ref={bindCard}
                  type="button"
                  data-index={i}
                  data-current={current || undefined}
                  data-far={far || undefined}
                  inert={far || undefined}
                  tabIndex={current ? 0 : -1}
                  aria-label={current ? `Смотреть со звуком: «${item.title}», ${item.author}` : `Показать эдит «${item.title}»`}
                  onClick={() => (current ? open(i) : go(i))}
                  className="edit-card group/card absolute top-0 left-1/2 aspect-[9/16] h-full cursor-pointer rounded-xl focus-visible:outline-offset-4"
                  style={{ ["--o" as string]: o, ["--a" as string]: a }}
                >
                  <span data-media data-reel-tilt="0" className="edit-media relative block size-full overflow-hidden rounded-xl bg-ink-950">
                    {primed && (
                      // eslint-disable-next-line @next/next/no-img-element -- a video cover, sized by CSS
                      <img src={item.poster} alt="" decoding="async" draggable={false} className="absolute inset-0 size-full object-cover" />
                    )}
                    {withVideo && (
                      <video
                        ref={bindVideo}
                        data-index={i}
                        src={item.src}
                        poster={item.poster}
                        muted
                        playsInline
                        preload={o === 0 || o === 1 ? "auto" : "metadata"}
                        disablePictureInPicture
                        disableRemotePlayback
                        tabIndex={-1}
                        onEnded={() => onEnded(i)}
                        className="absolute inset-0 size-full object-cover"
                      />
                    )}

                    {/* TikTok-style captions over the current card */}
                    <span aria-hidden className="edit-overlay pointer-events-none absolute inset-0">
                      <span className="absolute inset-x-2 top-2 h-[3px] overflow-hidden rounded-full bg-white/20">
                        <span className="block h-full origin-left rounded-full bg-white/90" style={{ transform: "scaleX(var(--ep, 0))" }} />
                      </span>
                      <span className="absolute top-4 right-2 inline-flex items-center gap-1 rounded-full bg-black/45 px-1.5 py-0.5 text-[10px] font-semibold text-white/90 backdrop-blur-sm">
                        <Volume2 size={11} />
                        <span className="hidden sm:inline">Со звуком</span>
                      </span>
                      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-2.5 pt-10 pb-2.5 text-left sm:px-3 sm:pb-3">
                        <span className="block truncate text-[10.5px] font-semibold text-white/75">{item.author}</span>
                        <span className="mt-0.5 block truncate text-[12.5px] leading-tight font-semibold text-white sm:text-[13.5px]">{item.title}</span>
                        {item.tags?.length ? (
                          <span className="mt-1 block truncate text-[10.5px] text-accent-soft">{item.tags.join(" ")}</span>
                        ) : null}
                      </span>
                    </span>

                    {/* Hover: the card opens with sound */}
                    <span
                      aria-hidden
                      className={cn(
                        "pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 transition duration-300",
                        current && "group-hover/card:opacity-100 group-focus-visible/card:opacity-100",
                      )}
                    >
                      <span className="inline-flex size-12 items-center justify-center rounded-full border border-white/30 bg-white/10 shadow-[0_10px_30px_-10px_rgb(0_0_0/0.7)] backdrop-blur-md">
                        <Play size={18} strokeWidth={1.75} className="translate-x-0.5 fill-white/90 text-white/90" />
                      </span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* About the current edit */}
        <aside data-enter className="hidden min-h-0 flex-col overflow-hidden bg-ink-900/60 p-3 [--d:2] md:flex">
          <PanelTitle>Об эдите</PanelTitle>
          <div key={edit.id} className="edit-about mt-2.5 min-h-0 flex-1 animate-fade-in overflow-hidden">
            <div className="flex items-center gap-2.5">
              <AppTile code={edit.software} size={30} className="shrink-0" />
              <div className="min-w-0">
                <p className="truncate font-display text-[14px] leading-tight font-semibold text-fg">{edit.title}</p>
                <p className="truncate text-[11px] text-muted">{edit.author}</p>
              </div>
            </div>
            <dl className="mt-3 space-y-1.5 text-[10px]">
              <Info label="Программа">{softwareName[edit.software]}</Info>
              <Info label="Длительность">{formatClock(edit.duration)}</Info>
              <Info label="На таймлайне">{timecode(edit.start).slice(3)}</Info>
            </dl>
            {edit.used?.length ? (
              <div className="edit-about-more mt-3">
                <PanelTitle>Эффекты</PanelTitle>
                <ul className="mt-1.5 flex flex-wrap gap-1">
                  {edit.used.map((u) => (
                    <li key={u} className="rounded-md border border-accent/25 bg-accent/10 px-1.5 py-0.5 text-[10px] text-accent-soft">
                      {u}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
          <div className="mt-2 space-y-2 border-t border-white/6 pt-2.5">
            <button type="button" onClick={() => open(index)} className="btn btn-glass h-8 w-full px-3 text-[12px]">
              <Volume2 size={14} /> Смотреть со звуком
            </button>
            {edit.link ? (
              <a href={edit.link} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1 text-[11px] font-semibold text-muted transition hover:text-fg">
                Оригинал <ArrowUpRight size={12} />
              </a>
            ) : (
              <ClipsLink />
            )}
          </div>
        </aside>
      </div>

      {/* Timeline: the edits one after another; the transport sits in its header */}
      <div data-enter className="border-t border-white/6 bg-ink-900/70 px-2.5 pt-2 pb-3 [--d:3] sm:px-3">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
          <div className="flex min-w-0 items-center gap-3">
            <PanelTitle className="hidden sm:block">Таймлайн · Эдиты</PanelTitle>
            <span aria-hidden className="hidden items-center gap-0.5 lg:flex">
              {[MousePointer2, Scissors, Hand, Magnet].map((Icon, i) => (
                <span key={i} className={cn("inline-flex size-6 items-center justify-center rounded-md", i === 0 ? "bg-accent/20 text-accent-soft" : "text-dim")}>
                  <Icon size={12} />
                </span>
              ))}
            </span>
            <span aria-hidden className="font-mono text-[11px] text-fg/70 sm:hidden">
              {pad2(index + 1)} / {pad2(COUNT)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <TransportButton label="К предыдущему эдиту" onClick={prev}>
              <SkipBack size={13} />
            </TransportButton>
            <TransportButton label={wantPlay ? "Пауза" : "Воспроизвести"} onClick={() => setPlayIntent(!wantPlay)} primary>
              {wantPlay ? <Pause size={14} /> : <Play size={14} className="translate-x-px" />}
            </TransportButton>
            <TransportButton label="К следующему эдиту" onClick={() => step(1)}>
              <SkipForward size={13} />
            </TransportButton>
          </div>
          <p aria-hidden className="justify-self-end font-mono text-[12px] whitespace-nowrap tabular-nums">
            <span ref={timecodeRef} className="text-accent-soft">
              {timecode(0)}
            </span>
            <span className="hidden text-dim sm:inline"> / {timecode(FEED_TOTAL)}</span>
          </p>
        </div>

        <div aria-hidden className="relative mt-2">
          <div className="space-y-1">
            <Row label="" className="hidden sm:grid">
              <div className="relative h-4">
                {rulerSeconds.map((s) => (
                  <span key={s} className="absolute bottom-0 flex flex-col items-start" style={{ left: pct(s) }}>
                    <span className={cn("font-mono text-[9px] text-dim", s > 0 && "-translate-x-1/2", s % 5 ? "hidden" : s % 10 ? "hidden lg:block" : "block")}>
                      00:{pad2(s)}
                    </span>
                    <span className={cn("w-px bg-white/15", s % 5 ? "h-1" : "h-1.5")} />
                  </span>
                ))}
              </div>
            </Row>
            <Row label="V1">
              <Lane className="h-9 sm:h-11 short:h-9">
                {feed.map((item, i) => (
                  <Block
                    key={item.id}
                    start={item.start}
                    end={item.end}
                    total={FEED_TOTAL}
                    active={i === index}
                    className="border-accent/45 bg-ink-950 bg-repeat-x text-white/90"
                    style={primed ? { backgroundImage: `url(${item.poster})`, backgroundSize: "auto 100%" } : undefined}
                  >
                    <span className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/30 to-black/10" />
                    <span className="relative hidden truncate px-0.5 sm:block">{item.title}</span>
                  </Block>
                ))}
              </Lane>
            </Row>
            <Row label="A1">
              <Lane className="h-5 sm:h-6 short:h-5">
                {feed.map((item, i) => (
                  <Block key={item.id} start={item.start} end={item.end} total={FEED_TOTAL} className="border-teal/30 bg-teal/[0.07]">
                    <svg viewBox="0 0 100 20" preserveAspectRatio="none" className="absolute inset-0 size-full">
                      <path d={WAVEFORMS[i]} fill="rgb(143 185 174 / 0.55)" />
                    </svg>
                  </Block>
                ))}
              </Lane>
            </Row>
          </div>

          {/* Scrub area + playhead, aligned with the lanes (header column is 2.25rem + gap) */}
          <div onPointerDown={onScrub} className="absolute top-0 right-0 bottom-0 left-[calc(2.25rem+0.5rem)] cursor-ew-resize touch-pan-y">
            <Playhead playheadRef={playheadRef} />
          </div>
        </div>
      </div>
    </div>
  );
}

/** «More edits» → the clips channel in Telegram (config/site.ts → telegram.clips). */
function ClipsLink() {
  return (
    <a
      href={site.telegram.clips.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center gap-1 text-[11px] font-semibold text-muted transition hover:text-fg"
    >
      Ещё эдиты в Telegram <ArrowUpRight size={12} />
    </a>
  );
}
