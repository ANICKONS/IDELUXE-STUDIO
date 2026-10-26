import { cn } from "@/lib/utils";

/** Small building blocks shared by the editor window's two views (vfx-view.tsx, edits-view.tsx). */

export function PanelTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cn("block truncate font-mono text-[10px] tracking-[0.14em] text-dim uppercase", className)}>{children}</span>;
}

export function Info({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="shrink-0 text-dim">{label}</dt>
      <dd className="min-w-0 truncate font-mono text-muted">{children}</dd>
    </div>
  );
}

export function MeterBar({ barRef }: { barRef: React.Ref<HTMLSpanElement> }) {
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

export function TransportButton({
  label,
  onClick,
  children,
  primary,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  primary?: boolean;
}) {
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

/** A track: its name in the header column (2.25rem) and the lane. */
export function Row({ label, className, children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("grid grid-cols-[2.25rem_minmax(0,1fr)] items-center gap-2", className)}>
      <span className={cn("flex h-full items-center justify-center rounded-md font-mono text-[10px] text-dim", label && "bg-white/[0.04]")}>{label}</span>
      {children}
    </div>
  );
}

export function Lane({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("relative rounded-md bg-white/[0.025]", className)}>{children}</div>;
}

/** A clip on a lane, placed by its start / end in a sequence of `total` seconds. */
export function Block({
  start,
  end,
  total,
  active,
  className,
  style,
  children,
}: {
  start: number;
  end: number;
  total: number;
  active?: boolean;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  const pct = (seconds: number) => `${(seconds / total) * 100}%`;
  return (
    <div
      className={cn(
        "absolute inset-y-0 flex items-center gap-1 overflow-hidden rounded-[4px] border px-1 font-mono text-[9.5px] transition-[filter,box-shadow] duration-150",
        className,
        active && "z-10 shadow-[0_0_0_1px_rgb(255_255_255/0.75),0_0_14px_rgb(var(--rgb-accent)/0.5)] brightness-125",
      )}
      style={{ left: `calc(${pct(start)} + 1px)`, width: `max(2px, calc(${pct(end - start)} - 2px))`, ...style }}
    >
      {children}
    </div>
  );
}

export function Keyframe({ at }: { at: "left" | "right" }) {
  return (
    <span
      className={cn(
        "absolute top-1/2 hidden size-[5px] -translate-y-1/2 rotate-45 bg-amber/90 sm:block",
        at === "left" ? "left-0.5" : "right-0.5",
      )}
    />
  );
}

/** The playhead over the lanes (moved by transform from the view's rAF loop). */
export function Playhead({ playheadRef }: { playheadRef: React.Ref<HTMLDivElement> }) {
  return (
    <div ref={playheadRef} className="pointer-events-none absolute inset-0">
      <div className="absolute top-0 bottom-0 left-0 w-px bg-accent-soft shadow-[0_0_8px_rgb(var(--rgb-accent)/0.8)]">
        <span className="absolute -top-0.5 left-1/2 h-2.5 w-3 -translate-x-1/2 rounded-b-[4px] bg-accent-soft" />
      </div>
    </div>
  );
}

/**
 * Click or drag along the lanes to scrub (call it from the scrub area's onPointerDown, the area
 * spans the lanes): `to` gets the pointer's position along them, 0..1, until the button is released.
 */
export function startScrub(e: React.PointerEvent<HTMLElement>, to: (k: number) => void) {
  if (e.button !== 0) return;
  const area = e.currentTarget;
  const at = (x: number) => {
    const r = area.getBoundingClientRect();
    to(Math.min(1, Math.max(0, (x - r.left) / r.width)));
  };
  at(e.clientX);
  area.setPointerCapture(e.pointerId);
  const move = (ev: PointerEvent) => at(ev.clientX);
  const up = () => {
    area.removeEventListener("pointermove", move);
    area.removeEventListener("pointerup", up);
    area.removeEventListener("pointercancel", up);
  };
  area.addEventListener("pointermove", move);
  area.addEventListener("pointerup", up);
  area.addEventListener("pointercancel", up);
}

/**
 * Short desktop screens (`short:`): the side panels take the monitor's height and clip whatever
 * doesn't fit (lower rows of the effect controls, the info list) — so the window is only as tall
 * as its program monitor and the whole hero fits the first screen.
 */
export const SHORT_PANEL = "short:relative short:overflow-hidden short:[contain:size] short:[mask-image:linear-gradient(to_bottom,#000_82%,transparent)]";
