import "@/features/new-year/ornaments.css";
import { cn } from "@/lib/utils";

/*
 * Snow lying on the top edge of a panel. Four looks, all generated from `seed` (the same on the
 * server and in the browser), flat SVG, no layout cost:
 *  - "soft":    an even drift of uneven lumps, thinning out before the rounded corners, a few drips;
 *  - "draped":  the drift runs over both rounded corners and hangs down the sides, tapering to a drip;
 *  - "heap":    blown to one side: thin at one end, a deep pile at the other, draped over that corner;
 *  - "icicles": a thinner drift with a row of icicles hanging over the edge.
 * A couple of glints twinkle on the snow now and then.
 * The middle stretches to the panel's width, so pick `lumps` to the panel's size: about one per
 * 30 px of the snowy stretch. Draped corners are drawn to the panel's corner `radius`, px.
 * `seed` also names the gradients: give every cap on a page its own.
 */

/** Width of one lump, SVG units; the strip's height, px, and where the panel's edge runs in it. */
const LUMP = 24;
const HEIGHT = 18;
const EDGE = 10;
/** The underside of the drift: just over the panel's edge (covers its bright border). */
const UNDER = EDGE + 1.4;

export type SnowCapVariant = "soft" | "draped" | "heap" | "icicles";

function seeded(seed: number) {
  let s = (seed * 2654435761) >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const smooth = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const f = (n: number) => Math.round(n * 100) / 100;
const pts = (list: [number, number][]) => list.map(([x, y]) => `${f(x)} ${f(y)}`).join("L");

/** How an end of the drift meets the panel: it fades out, or joins a draped corner at this thickness. */
type End = "fade" | number;

type DriftOptions = {
  left: End;
  right: End;
  /** Depth along the edge, 0–1 → multiplier. */
  profile: (t: number) => number;
  /** Overall thickness. */
  depth: number;
  drips: boolean;
  icicles: boolean;
};

/** The stretchy middle: the drift's outline, its icicles, and where the glints sit. */
function drift(lumps: number, rnd: () => number, o: DriftOptions) {
  const width = lumps * LUMP;
  const envelope = (x: number) => {
    const t = x / width;
    return (o.left === "fade" ? smooth(0, 0.14, t) : 1) * (o.right === "fade" ? 1 - smooth(0.86, 1, t) : 1) * o.profile(t);
  };
  const endY = (end: End) => (end === "fade" ? UNDER : UNDER - end);

  const borders = Array.from({ length: lumps + 1 }, (_, i) => (i === 0 || i === lumps ? i * LUMP : (i + (rnd() - 0.5) * 0.5) * LUMP));
  const peaks: [number, number][] = [];
  let d = `M0 ${f(endY(o.left))}`;
  let y0 = endY(o.left);
  for (let i = 0; i < lumps; i++) {
    const x0 = borders[i];
    const x1 = borders[i + 1];
    const y1 = i === lumps - 1 ? endY(o.right) : UNDER - envelope(x1) * (2.4 + rnd() * 1.6) * o.depth;
    const peak = Math.min(Math.min(y0, y1) - 0.6, UNDER - envelope((x0 + x1) / 2) * (5 + rnd() * 2.8) * o.depth);
    // Cubic through the peak at its middle: rounder, flatter tops than a quadratic
    const c = (peak - 0.125 * (y0 + y1)) / 0.75;
    const w = x1 - x0;
    d += `C${f(x0 + w * 0.12)} ${f(c)} ${f(x1 - w * 0.12)} ${f(c)} ${f(x1)} ${f(y1)}`;
    peaks.push([(x0 + x1) / 2, peak]);
    y0 = y1;
  }

  // Underside, right to left (from straight under the right end: a draped end is thick there), with
  // a few drips hanging over the edge
  d += `L${f(width)} ${f(UNDER)}`;
  if (o.drips) {
    const drips = new Set<number>();
    const count = Math.max(1, Math.round(lumps / 4));
    while (drips.size < Math.min(count, lumps - 2)) drips.add(1 + Math.floor(rnd() * (lumps - 2)));
    for (const i of [...drips].sort((a, b) => b - a)) {
      const x = (borders[i] + borders[i + 1]) / 2 + (rnd() - 0.5) * LUMP * 0.4;
      const half = 2.6 + rnd() * 1.4;
      const depth = (2.5 + rnd() * 3) * (0.5 + 0.5 * Math.min(1, envelope(x)));
      d += `L${f(x + half)} ${f(UNDER)}`;
      d += `C${f(x + half)} ${f(UNDER + depth * 0.7)} ${f(x + half * 0.7)} ${f(UNDER + depth)} ${f(x)} ${f(UNDER + depth)}`;
      d += `C${f(x - half * 0.7)} ${f(UNDER + depth)} ${f(x - half)} ${f(UNDER + depth * 0.7)} ${f(x - half)} ${f(UNDER)}`;
    }
  }
  d += `L0 ${f(UNDER)}Z`;

  // Icicles: tapering spikes under the edge, longer where the snow is deeper
  let ice = "";
  let shine = "";
  if (o.icicles) {
    const count = Math.round(lumps / 1.6);
    for (let i = 0; i < count; i++) {
      const x = width * (0.06 + (0.88 * (i + 0.2 + rnd() * 0.6)) / count);
      const len = (2.5 + rnd() * (rnd() < 0.3 ? 11 : 6)) * (0.4 + 0.6 * Math.min(1, envelope(x)));
      const hw = 1.2 + rnd() * 1.3;
      ice += `M${f(x - hw)} ${f(UNDER - 0.8)}L${f(x + hw)} ${f(UNDER - 0.8)}Q${f(x + hw * 0.25)} ${f(UNDER + len * 0.55)} ${f(x)} ${f(UNDER + len)}Q${f(x - hw * 0.25)} ${f(UNDER + len * 0.55)} ${f(x - hw)} ${f(UNDER - 0.8)}Z`;
      shine += `M${f(x - hw * 0.4)} ${f(UNDER + 0.5)}Q${f(x - hw * 0.2)} ${f(UNDER + len * 0.45)} ${f(x - 0.1)} ${f(UNDER + len * 0.8)}`;
    }
  }

  // Glints on two of the higher lumps, away from the ends
  const glints = peaks
    .slice(1, -1)
    .map((p, i) => ({ p, r: rnd() + (UNDER - p[1]) * 0.08, i }))
    .sort((a, b) => b.r - a.r)
    .slice(0, 2)
    .map(({ p: [x, y] }) => ({ x: x / width, y: y + 1.4 }));

  return { d, ice, shine, glints, width };
}

/** An ellipse as a closed subpath (subpaths of one path fill as a union). */
const blob = (x: number, y: number, rx: number, ry: number) => `M${f(x - rx)} ${f(y)}a${f(rx)} ${f(ry)} 0 1 0 ${f(rx * 2)} 0a${f(rx)} ${f(ry)} 0 1 0 ${f(-rx * 2)} 0Z`;

/**
 * A rounded corner (the left one; the right is its mirror image): the snow rides the corner's arc,
 * slides down to where it gets steep and hangs there over the side as a heavy rounded lip, an
 * icicle (or a drop) under it. Pixel coordinates; the panel's corner box starts at (EDGE, EDGE), so
 * the drawing lines up with the middle strip.
 */
function corner(radius: number, thick: number, rnd: () => number) {
  const cx = EDGE + radius;
  const cy = EDGE + radius;
  const inner = radius - 1.4;
  const at = (beta: number, r: number): [number, number] => [cx - r * Math.sin(beta), cy - r * Math.cos(beta)];
  // The band along the arc, as far as snow holds on the slope (~50°), thinning a little, with a wobble
  const end = 0.82 + rnd() * 0.14;
  const phase = rnd() * 6;
  const N = 22;
  const out: [number, number][] = [];
  for (let i = 0; i <= N; i++) {
    const s = i / N;
    out.push(at(s * end, inner + thick * (1 - 0.3 * s) + 0.9 * Math.sin(s * 6 + phase) * s * (1 - s)));
  }
  const back: [number, number][] = [];
  for (let i = N; i >= 0; i--) back.push(at((i / N) * end, inner));
  let d = `M${pts(out)}L${pts(back)}Z`;

  // The lip: where the band ends the snow has slid over and sags past the arc, a heavy rounded mass
  // (two blobs, so it isn't a perfect oval), standing out beyond the panel's outline
  const lip = Math.max(3.4, thick * 0.85);
  const [lx, ly] = at(end + 0.2, inner + lip * 0.55);
  d += blob(lx, ly + lip * 0.55, lip * 1.05, lip * 1.2);
  const [mx, my] = at(end - 0.05, inner + thick * 0.62);
  d += blob(mx, my + lip * 0.1, lip * 0.95, lip * 0.85);

  // Under the lip: an icicle, or a drop about to fall
  const tipX = lx + lip * 0.1;
  const tipY = ly + lip * 1.6;
  const icicle = rnd() < 0.65;
  let ice = "";
  if (icicle) {
    const len = 5 + rnd() * 7;
    const hw = 1.3 + rnd() * 0.6;
    ice = `M${f(tipX - hw)} ${f(tipY - 1)}L${f(tipX + hw)} ${f(tipY - 1)}Q${f(tipX + hw * 0.25)} ${f(tipY + len * 0.55)} ${f(tipX)} ${f(tipY + len)}Q${f(tipX - hw * 0.25)} ${f(tipY + len * 0.55)} ${f(tipX - hw)} ${f(tipY - 1)}Z`;
  } else d += blob(tipX, tipY + 2.6, 1.1, 1.4);
  return { d, ice, width: EDGE + radius, height: tipY + 14 };
}

/**
 * Shadow on the glass, the shaded underside, the lit top (white, cooling to pale blue towards the
 * bottom, so the lumps look round). `id` must be unique on the page (its gradient).
 */
function Snow({ d, id }: { d: string; id: string }) {
  return (
    <>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#ffffff" />
          <stop offset=".55" stopColor="#f2f5fa" />
          <stop offset="1" stopColor="#d3deeb" />
        </linearGradient>
      </defs>
      <path d={d} transform="translate(0 1.2)" fill="rgb(0 0 0 / 0.38)" />
      <path d={d} fill="#b7c6da" />
      <path d={d} transform="translate(0 -1)" fill={`url(#${id})`} />
    </>
  );
}

/** Icicles: translucent ice with a light streak down each. */
function Ice({ d, shine }: { d: string; shine?: string }) {
  return (
    <>
      <path d={d} fill="rgb(214 230 250 / 0.55)" />
      {shine && <path d={shine} fill="none" stroke="rgb(255 255 255 / 0.7)" strokeWidth="0.7" strokeLinecap="round" vectorEffect="non-scaling-stroke" />}
    </>
  );
}

function Corner({ radius, thick, seed, side }: { radius: number; thick: number; seed: number; side: "left" | "right" }) {
  const c = corner(radius, thick, seeded(seed * 31 + (side === "left" ? 1 : 2)));
  return (
    <div className="relative shrink-0" style={{ width: radius }}>
      <svg
        viewBox={`0 0 ${f(c.width)} ${f(c.height)}`}
        className="absolute top-0 overflow-visible"
        style={{ width: c.width, height: c.height, [side]: -EDGE, transform: side === "right" ? "scaleX(-1)" : undefined }}
      >
        {c.ice && <Ice d={c.ice} />}
        <Snow d={c.d} id={`ny-snow-${seed}-${side}`} />
      </svg>
    </div>
  );
}

/**
 * Depth along the edge, 0–1 → multiplier. Never perfectly even: a slow random swell makes thinner
 * and deeper stretches, the way real snow lies.
 */
function profile(variant: "even" | "heap-left" | "heap-right", rnd: () => number) {
  const p1 = rnd();
  const p2 = rnd();
  const swell = (t: number) => 0.8 + 0.2 * Math.sin(2 * Math.PI * (t * 1.3 + p1)) + 0.1 * Math.sin(2 * Math.PI * (t * 3.1 + p2));
  if (variant === "even") return swell;
  // Blown to one side: a thin dusting at one end, a pile about twice the usual drift at the other
  const heap = (t: number) => 0.32 + 1.7 * smooth(0.05, 0.98, t) ** 1.8;
  return variant === "heap-right" ? (t: number) => heap(t) * swell(t) : (t: number) => heap(1 - t) * swell(t);
}

/**
 * Put it inside the panel (positioned, and not clipping its overflow, or the drift above the edge
 * is cut off). Next to a panel that clips (e.g. the hero editor), use `overlay`: the cap then sits
 * in a box the size of the panel's wrapper, and `className` goes on that box, so an entrance
 * animation (`arrive`) moves it exactly like the panel.
 * `from` / `to`: how far the snow keeps from the left / right side (CSS length); draped sides
 * default to 0, the others to 1.75 rem, clear of a rounded corner.
 */
export function SnowCap({
  variant = "soft",
  side = "right",
  radius = 32,
  lumps = 12,
  seed = 1,
  from,
  to,
  overlay = false,
  className,
}: {
  variant?: SnowCapVariant;
  /** Where the heap piles up. */
  side?: "left" | "right";
  radius?: number;
  lumps?: number;
  seed?: number;
  from?: string;
  to?: string;
  overlay?: boolean;
  className?: string;
}) {
  const rnd = seeded(seed);
  const heap = variant === "heap";
  const drapeLeft = variant === "draped" || (heap && side === "left");
  const drapeRight = variant === "draped" || (heap && side === "right");
  const depthAt = profile(heap ? (side === "left" ? "heap-left" : "heap-right") : "even", rnd);
  const depth = variant === "icicles" ? 0.78 : 1;
  // A draped corner starts as thick as the drift is where it meets it (and never too thin to hang)
  const joint = (t: number) => Math.round(Math.max(4.6, 5 * depthAt(t) * depth) * 10) / 10;
  const m = drift(lumps, rnd, {
    left: drapeLeft ? joint(0) : "fade",
    right: drapeRight ? joint(1) : "fade",
    profile: depthAt,
    depth,
    drips: variant !== "icicles",
    icicles: variant === "icicles",
  });

  const cap = (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute z-10 flex", !overlay && className)}
      style={{ top: -EDGE, height: HEIGHT, left: from ?? (drapeLeft ? 0 : "1.75rem"), right: to ?? (drapeRight ? 0 : "1.75rem") }}
    >
      {drapeLeft && <Corner radius={radius} thick={joint(0)} seed={seed} side="left" />}
      <div className="relative min-w-0 flex-1">
        <svg viewBox={`0 0 ${m.width} ${HEIGHT}`} preserveAspectRatio="none" className="block size-full overflow-visible">
          {m.ice && <Ice d={m.ice} shine={m.shine} />}
          <Snow d={m.d} id={`ny-snow-${seed}`} />
        </svg>
        {m.glints.map((g, i) => (
          <span
            key={i}
            data-loop
            className="ny-glint"
            style={
              {
                left: `${(g.x * 100).toFixed(2)}%`,
                top: g.y,
                "--d": `${(5.5 + ((seed + i * 3) % 4) * 0.9).toFixed(1)}s`,
                "--delay": `${(-((seed * 1.7 + i * 2.9) % 6)).toFixed(1)}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
      {drapeRight && <Corner radius={radius} thick={joint(1)} seed={seed} side="right" />}
    </div>
  );

  return overlay ? (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0", className)}>
      {cap}
    </div>
  ) : (
    cap
  );
}
