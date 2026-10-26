"use client";

import "@/features/landing/sections/hero/editor/editor.css";
import { useRef, useState, useSyncExternalStore } from "react";
import { Clapperboard, Smartphone } from "lucide-react";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { cn } from "@/lib/utils";
import { EditsView } from "@/features/landing/sections/hero/editor/edits-view";
import { feed } from "@/features/landing/sections/hero/editor/edits-sequence";
import { VfxView } from "@/features/landing/sections/hero/editor/vfx-view";

type ViewId = "vfx" | "edits";

/** The window's two views, in the order of their tabs (the first one opens with the page). */
const views: { id: ViewId; label: string; short: string; Icon: typeof Clapperboard; file: string; format: string }[] = [
  { id: "vfx", label: "Шоурил VFX", short: "VFX", Icon: Clapperboard, file: "showreel_2026.prproj", format: "1920×1080 · 23,976 fps" },
  { id: "edits", label: "Шоурил эдитов", short: "Эдиты", Icon: Smartphone, file: "edits_2026.prproj", format: "1080×1920 · 9:16" },
];

/** Once the edits tab has been opened, its «new» ring stops pulsing (on this device). */
const SEEN_KEY = "idx:edits-seen";
const noSubscribe = () => () => {};
function readSeen() {
  try {
    return localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return true;
  }
}

/**
 * The editor window of the first screen. Its title bar holds two tabs — «Шоурил VFX» (the showreel
 * in the program monitor with its timeline, vfx-view.tsx) and «Шоурил эдитов» (a feed of short
 * vertical edits switched by its own timeline, edits-view.tsx). A switch cross-fades the views
 * with a slide towards the tab's side while a band of light runs across the window (editor.css).
 * `className` goes on the glass window itself (e.g. its entrance: `arrive` must sit on the glass).
 */
export function EditorMock({ className }: { className?: string }) {
  const [view, setView] = useState<ViewId>("vfx");
  /** The first switch has happened: from now on the incoming panels rise one by one. */
  const [switched, setSwitched] = useState(false);
  /** The edits tab has been pointed at or focused: its covers may load. */
  const [primed, setPrimed] = useState(false);
  /** …and opened at least once: from now on its videos may load too. */
  const [opened, setOpened] = useState(false);
  const seen = useSyncExternalStore(noSubscribe, readSeen, () => true);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const sweepRef = useRef<HTMLSpanElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const current = views.find((v) => v.id === view) ?? views[0];
  const currentIndex = views.indexOf(current);

  const runSweep = (forward: boolean) => {
    const box = sweepRef.current;
    const band = box?.firstElementChild as HTMLElement | null;
    if (!box || !band || reducedMotion) return;
    const w = box.offsetWidth;
    const b = band.offsetWidth;
    const [from, to] = forward ? [-b, w] : [w, -b];
    band.animate(
      [
        { transform: `translate3d(${from}px, 0, 0) skewX(-14deg)`, opacity: 0 },
        { opacity: 1, offset: 0.3 },
        { opacity: 1, offset: 0.7 },
        { transform: `translate3d(${to}px, 0, 0) skewX(-14deg)`, opacity: 0 },
      ],
      { duration: 900, easing: "cubic-bezier(0.45, 0, 0.2, 1)" },
    );
  };

  const select = (next: ViewId) => {
    setPrimed(true);
    if (next === view) return;
    const forward = views.findIndex((v) => v.id === next) > currentIndex;
    setView(next);
    setSwitched(true);
    if (next === "edits") setOpened(true);
    if (next === "edits" && !seen) {
      try {
        localStorage.setItem(SEEN_KEY, "1");
      } catch {
        /* private mode: the ring simply pulses again next time */
      }
    }
    runSweep(forward);
  };

  const onTabsKeyDown = (e: React.KeyboardEvent) => {
    const n = views.length;
    const target =
      e.key === "ArrowRight" ? (currentIndex + 1) % n : e.key === "ArrowLeft" ? (currentIndex - 1 + n) % n : e.key === "Home" ? 0 : e.key === "End" ? n - 1 : -1;
    if (target < 0) return;
    e.preventDefault();
    select(views[target].id);
    tabRefs.current[target]?.focus();
  };

  return (
    <div
      role="group"
      aria-label="Окно редактора: шоурилы IDELUXE"
      className={cn("glass glass-strong overflow-hidden rounded-[1.6rem] p-0 text-left", className)}
      data-no-spot
    >
      {/* Title bar: file name | tabs | sequence format */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-white/6 px-3 py-2 sm:gap-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex shrink-0 gap-1.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-[#ff5f57]/80" />
            <span className="size-2.5 rounded-full bg-[#febc2e]/80" />
            <span className="size-2.5 rounded-full bg-[#28c840]/80" />
          </div>
          <span key={current.id} aria-hidden className="hidden min-w-0 animate-fade-in truncate font-mono text-[11px] text-dim sm:block">
            IDELUXE STUDIO — {current.file}
          </span>
        </div>

        <div
          role="tablist"
          aria-label="Что показать в окне"
          onKeyDown={onTabsKeyDown}
          className="relative grid grid-cols-2 rounded-full border border-white/10 bg-white/[0.04] p-0.5 shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]"
        >
          {/* The lit pill slides under the selected tab */}
          <span
            aria-hidden
            className={cn(
              "absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-full bg-accent/20 shadow-[inset_0_0_0_1px_rgb(var(--rgb-accent)/0.4),0_0_18px_-6px_rgb(var(--rgb-accent)/0.7)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
              currentIndex === 1 && "translate-x-full",
            )}
          />
          {views.map((v, i) => {
            const selected = v.id === view;
            return (
              <button
                key={v.id}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`editor-tab-${v.id}`}
                aria-selected={selected}
                aria-controls={`editor-panel-${v.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => select(v.id)}
                onPointerEnter={v.id === "edits" ? () => setPrimed(true) : undefined}
                onFocus={v.id === "edits" ? () => setPrimed(true) : undefined}
                className={cn(
                  "relative z-10 inline-flex h-7 items-center justify-center gap-1.5 rounded-full px-3 text-[12px] font-semibold whitespace-nowrap transition-colors duration-300 sm:px-3.5",
                  selected ? "text-accent-soft" : "text-fg/65 hover:text-fg",
                )}
              >
                <v.Icon size={13} className="hidden shrink-0 sm:block" />
                <span className="sm:hidden">{v.short}</span>
                <span className="hidden sm:inline">{v.label}</span>
                {v.id === "edits" && (
                  <span className="relative inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-white/10 px-1 font-mono text-[9.5px] leading-none text-fg/85">
                    {feed.length}
                    {!seen && <span aria-hidden data-loop className="absolute -inset-0.5 animate-ping-soft rounded-full border border-accent/80" />}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <span key={current.id} aria-hidden className="hidden animate-fade-in justify-self-end font-mono text-[10px] whitespace-nowrap text-dim lg:inline">
          {current.format}
        </span>
      </div>

      {/* The views: VFX stays in the flow (the window's height), the edits lie over it */}
      <div className="editor-views relative" data-switched={switched || undefined}>
        <VfxView
          active={view === "vfx"}
          id="editor-panel-vfx"
          role="tabpanel"
          aria-labelledby="editor-tab-vfx"
          data-side="start"
          data-active={view === "vfx" || undefined}
          inert={view !== "vfx" || undefined}
          className="editor-view"
        />
        <EditsView
          active={view === "edits"}
          primed={primed}
          opened={opened}
          id="editor-panel-edits"
          role="tabpanel"
          aria-labelledby="editor-tab-edits"
          data-side="end"
          data-active={view === "edits" || undefined}
          inert={view !== "edits" || undefined}
          className="editor-view absolute inset-0"
        />
        <span ref={sweepRef} aria-hidden className="editor-sweep">
          <span />
        </span>
      </div>
    </div>
  );
}
