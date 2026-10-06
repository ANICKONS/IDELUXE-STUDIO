"use client";

import { useCallback } from "react";
import { cn } from "@/lib/utils";

/**
 * Pre-rendered three.js objects in /public/decor (transparent WebP). play, keyframe, sparkle, lens
 * and wave come from tools/decor-render (scene, studio light, render script); knot, cube and
 * asterisk are the original renders from v4 (README → «3D-декор»).
 */
export type DecorName = "play" | "keyframe" | "sparkle" | "lens" | "wave" | "knot" | "cube" | "asterisk";

/**
 * Bump after re-rendering: /decor is cached by browsers for a week (next.config.ts), and the
 * file names stay the same.
 */
const DECOR_VERSION = 2;

const INTRINSIC: Record<DecorName, [number, number]> = {
  play: [683, 720],
  keyframe: [617, 720],
  sparkle: [667, 720],
  lens: [720, 712],
  wave: [720, 605],
  knot: [617, 632],
  cube: [618, 661],
  asterisk: [671, 727],
};

/*
 * Depth of field. The page content is the focal plane, at depth FOCUS. Objects behind it (depth
 * 0 → FOCUS) get softer, dimmer and greyer the further back they are and lag behind the scroll;
 * objects in front (FOCUS → 1) blur quickly and outrun it. Past FRONT they hang in front of the
 * content, as out-of-focus foreground at the screen edges.
 */
const FOCUS = 0.6;
const FRONT = 0.85;
/** Blur (px) at the far end (depth 0) and at the near end (depth 1). */
const FAR_BLUR = 7;
const NEAR_BLUR = 16;
/** Parallax travel per screen (px) for one unit of depth away from the focal plane. */
const PARALLAX = 230;

export type DecorItem = {
  name: DecorName;
  side: "left" | "right";
  /** Position inside the container (px or %). */
  top: string;
  /** Distance from the side edge in px; negative values hang off-screen. */
  x: number;
  /** Width on desktop, px. */
  size: number;
  /**
   * 0 = far behind the content (small parallax, soft, dim), FOCUS (0.6) = sharp, 1 = right in front
   * of the camera. Above 0.85 the object is drawn over the content (desktop only, kept in the margins).
   */
  depth: number;
  /** Overrides the depth-of-field blur, px. */
  blur?: number;
  rotate?: number;
  /**
   * 0–1: on wide screens, how far the object moves from the screen edge towards the content
   * column (share of the free space beside the 72rem column). 0 = stays at `x`.
   */
  inset?: number;
  /** Also shown on phones (smaller, kept near the edge). Ignored for foreground objects. */
  mobile?: boolean;
};

const smooth = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Depth-of-field blur of an object at rest, px. */
function focusBlur(depth: number) {
  return depth < FOCUS ? FAR_BLUR * ((FOCUS - depth) / FOCUS) ** 1.3 : NEAR_BLUR * ((depth - FOCUS) / (1 - FOCUS)) ** 1.4;
}

/* ── One scroll listener for every object on the page ── */
const nodes = new Set<HTMLElement>();
let frame = 0;
let listening = false;

function update() {
  frame = 0;
  const vh = window.innerHeight;
  for (const anchor of nodes) {
    const mover = anchor.firstElementChild as HTMLElement | null;
    if (!mover) continue;
    // The anchor is never transformed, so its rect is the true layout position.
    const r = anchor.getBoundingClientRect();
    // -1: leaving through the top, 0: centre of the screen, 1: entering from the bottom.
    const p = (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2);
    if (p < -1.5 || p > 1.5) {
      if (mover.style.opacity !== "0") mover.style.opacity = "0";
      continue;
    }
    const depth = Number(anchor.dataset.depth);
    const base = Number(anchor.dataset.blur);
    const dir = Number(anchor.dataset.dir);
    const alpha = Number(anchor.dataset.alpha);
    const leaving = smooth(0.35, 1, -p);
    const entering = smooth(0.5, 1.05, p);
    // Near objects outrun the page, far ones lag behind
    const shift = -p * PARALLAX * (depth - FOCUS);
    // Focus breathes a little: sharpest mid-screen, softer while sliding under the header
    const blur = Math.round((base + leaving * 6 + entering * 3) * 4) / 4;
    const turn = p * (8 + depth * 10) * dir;
    mover.style.transform = `translate3d(0, ${shift.toFixed(1)}px, 0) rotate(${turn.toFixed(2)}deg) scale(${(1 - leaving * 0.1).toFixed(3)})`;
    const filter = blur > 0.3 ? `blur(${blur}px)` : "none";
    if (mover.style.filter !== filter) mover.style.filter = filter;
    mover.style.opacity = (alpha * (1 - leaving) * (1 - entering * 0.7)).toFixed(3);
  }
}

const schedule = () => {
  if (!frame) frame = requestAnimationFrame(update);
};

function register(el: HTMLElement) {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  nodes.add(el);
  if (!listening) {
    listening = true;
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
  }
  schedule();
  return () => {
    nodes.delete(el);
    if (!nodes.size && listening) {
      listening = false;
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    }
  };
}

/**
 * Decorative 3D objects hovering along the sides. Each one bobs gently (CSS), moves with
 * depth-based parallax on scroll and gets depth-of-field blur and atmospheric dimming.
 * Background objects sit behind the content (`className`, e.g. -z-10), foreground ones in a
 * second layer above it. Put it inside a positioned container; it never takes pointer events.
 */
export function Decor3D({ items, className }: { items: DecorItem[]; className?: string }) {
  const anchorRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    return register(el);
  }, []);

  const back = items.filter((item) => item.depth <= FRONT);
  const front = items.filter((item) => item.depth > FRONT);
  const layer = (list: DecorItem[], isFront: boolean) => (
    <div aria-hidden data-decor className={cn("pointer-events-none absolute inset-0 select-none", isFront ? "z-20 hidden xl:block" : className)}>
      {list.map((item, i) => (
        <DecorObject key={`${item.name}-${i}`} item={item} index={i + (isFront ? back.length : 0)} front={isFront} anchorRef={anchorRef} />
      ))}
    </div>
  );

  return (
    <>
      {back.length > 0 && layer(back, false)}
      {front.length > 0 && layer(front, true)}
    </>
  );
}

function DecorObject({
  item,
  index: i,
  front,
  anchorRef,
}: {
  item: DecorItem;
  index: number;
  front: boolean;
  anchorRef: (el: HTMLDivElement | null) => void;
}) {
  const [w, h] = INTRINSIC[item.name];
  const left = item.side === "left";
  const blur = item.blur ?? focusBlur(item.depth);
  // Atmospheric depth: far objects are dimmer and greyer. Foreground ones are out of the light
  // (darker, translucent), so a big blurred shape at the edge never outshines the content.
  const far = 1 - Math.min(1, item.depth / FOCUS);
  const alpha = front ? 0.7 : 0.5 + 0.5 * (1 - far);
  const grade = front
    ? "brightness(0.62) saturate(0.85)"
    : far > 0.01
      ? `brightness(${(1 - far * 0.35).toFixed(2)}) saturate(${(1 - far * 0.3).toFixed(2)})`
      : undefined;

  // Base offset + share of the space left between the object and the content column
  // (inset 1 = touches the column with a 16 px gap, never slides under it).
  let x = item.inset ? `calc(${item.x}px + max(0px, (100% - 72rem) / 2 - ${item.size + item.x + 16}px) * ${item.inset})` : `${item.x}px`;
  // Foreground: never over the text — on narrower screens slide further out (up to 70 % hidden)
  if (front) x = `min(${x}, max(${-Math.round(item.size * 0.7)}px, (100% - 72rem) / 2 - ${item.size + 8}px))`;

  return (
    <div
      ref={anchorRef}
      data-depth={item.depth}
      data-blur={blur.toFixed(2)}
      data-dir={left ? -1 : 1}
      data-alpha={alpha.toFixed(3)}
      className={cn(
        "absolute w-[var(--wm)] md:w-[var(--w)]",
        left ? "left-[var(--xm)] md:left-[var(--x)]" : "right-[var(--xm)] md:right-[var(--x)]",
        !item.mobile && "hidden md:block",
      )}
      style={
        {
          top: item.top,
          "--w": `${item.size}px`,
          "--wm": `${Math.round(item.size * 0.5)}px`,
          "--x": x,
          // Phones: always half off-screen, so the objects never sit under the text.
          "--xm": `${Math.round(Math.min(item.x, -20) * 0.6 - item.size * 0.18)}px`,
        } as React.CSSProperties
      }
    >
      <div
        className="will-change-[transform,filter,opacity]"
        style={{ filter: blur > 0.3 ? `blur(${blur.toFixed(1)}px)` : undefined, opacity: alpha }}
      >
        {/* Two loops with unrelated periods (bob + sideways sway) so the motion never looks in sync */}
        <div
          className="animate-sway"
          style={
            {
              "--sx": `${(i % 2 ? -1 : 1) * Math.round(4 + item.depth * 8)}px`,
              "--sr": `${(i % 3 ? 1 : -1) * (2 + (i % 4))}deg`,
              animationDuration: `${11 + ((i * 2.3) % 7)}s`,
              animationDelay: `${-((i * 3.1) % 9)}s`,
            } as React.CSSProperties
          }
        >
          <div
            className="animate-levitate"
            style={
              {
                "--r": `${item.rotate ?? 0}deg`,
                "--lift": `${8 + item.depth * 16}px`,
                animationDuration: `${6.5 + ((i * 1.7) % 5)}s`,
                animationDelay: `${-((i * 1.3) % 6)}s`,
              } as React.CSSProperties
            }
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- small pre-rendered decor, sized by CSS */}
            <img
              src={`/decor/${item.name}.webp?v=${DECOR_VERSION}`}
              alt=""
              width={w}
              height={h}
              loading="lazy"
              decoding="async"
              draggable={false}
              className="block h-auto w-full"
              style={{ filter: grade }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
