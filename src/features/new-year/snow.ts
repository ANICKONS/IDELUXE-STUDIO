import type { BackdropFrame } from "@/lib/backdrop-frame";

/*
 * Snow in front of the planet (2D canvas, drawn on the backdrop's own frames — snowfall.tsx).
 * Three depths, like the 3D decor's depth of field: far flakes are tiny, slow and bluish (the
 * atmosphere), middle ones sharp and twinkling, a few near ones are big out-of-focus bokeh discs.
 * The nearer a flake, the faster it falls, the more it drifts with the scroll (world space: content
 * goes up, the snow goes up a little slower) and the further it swings when the camera pans.
 * While the view moves fast (a page flight) the flakes smear into short streaks.
 */

type Flake = {
  /** Position, CSS px: x wraps around the screen, y runs 0 → height + 2 × MARGIN. */
  x: number;
  y: number;
  /** Depth: 0 far → 1 right at the camera. */
  z: number;
  r: number;
  /** Fall speed, px/s; sideways sway: amplitude px, rate rad/s, phase. */
  vy: number;
  sway: number;
  freq: number;
  ph: number;
  a: number;
  /** Twinkle rate, rad/s (0: steady). */
  tw: number;
  sprite: number;
  /** This frame's step, px (for the streak). */
  mx: number;
  my: number;
};

/** How far off screen a flake wraps round, px (the biggest bokeh must leave the screen first). */
const MARGIN = 24;
/** Screen area per flake, px² (far and middle ones), and the limits. */
const AREA_PER_FLAKE = 8200;
const MIN_FLAKES = 55;
const MAX_FLAKES = 190;

/** Ivory snow, the same with the atmosphere's blue, sun-warmed bokeh, cold bokeh. */
const IVORY = "246 243 236";
const FROST = "204 220 244";
const WARM = "250 234 206";

const mod = (a: number, n: number) => ((a % n) + n) % n;

/** Soft round flake: a bright core in a faint halo. Drawn at 4 × r. */
function dot(color: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 32;
  const x = c.getContext("2d")!;
  const g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, `rgb(${color} / 1)`);
  g.addColorStop(0.22, `rgb(${color} / 0.92)`);
  g.addColorStop(0.5, `rgb(${color} / 0.3)`);
  g.addColorStop(1, `rgb(${color} / 0)`);
  x.fillStyle = g;
  x.fillRect(0, 0, 32, 32);
  return c;
}

/**
 * Out-of-focus flake: a soft glowing disc, brightest in the middle (a hard bokeh rim read as dust
 * on the lens, not as snow). Drawn at 2 × r.
 */
function bokeh(color: string) {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const x = c.getContext("2d")!;
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, `rgb(${color} / 0.9)`);
  g.addColorStop(0.45, `rgb(${color} / 0.6)`);
  g.addColorStop(0.8, `rgb(${color} / 0.22)`);
  g.addColorStop(1, `rgb(${color} / 0)`);
  x.fillStyle = g;
  x.fillRect(0, 0, 64, 64);
  return c;
}

export type Snow = {
  resize(width: number, height: number): void;
  /** Advances the flakes by the frame's step (not on still frames) and draws them. */
  draw(ctx: CanvasRenderingContext2D, frame: BackdropFrame): void;
};

export function createSnow(): Snow {
  // [ivory dot, frost dot, warm bokeh, frost bokeh]; bokeh ones are 2 and 3
  const sprites = [dot(IVORY), dot(FROST), bokeh(WARM), bokeh(FROST)];
  let w = 0;
  let h = 0;
  let flakes: Flake[] = [];
  /** The frame the flakes last moved with: scroll and pan move them by the difference. */
  let prev: { drift: number; panX: number; panY: number } | null = null;

  const make = (z: number): Flake => {
    const rnd = Math.random;
    const near = z > 0.88;
    const mid = !near && z > 0.45;
    return {
      x: rnd() * (w + 2 * MARGIN),
      y: rnd() * (h + 2 * MARGIN),
      z,
      r: near ? 8 + rnd() * 9 : mid ? 1.5 + rnd() * 1.3 : 0.8 + z * 1.2 + rnd() * 0.5,
      vy: near ? 50 + rnd() * 28 : 12 + z * 46 + rnd() * 9,
      sway: near ? 14 + rnd() * 14 : 3 + z * 14 + rnd() * 4,
      freq: 0.25 + rnd() * 0.55,
      ph: rnd() * Math.PI * 2,
      a: near ? 0.05 + rnd() * 0.06 : mid ? 0.6 + rnd() * 0.3 : 0.38 + rnd() * 0.3,
      tw: mid && rnd() < 0.45 ? 1.5 + rnd() * 2.5 : 0,
      sprite: near ? (rnd() < 0.6 ? 2 : 3) : mid ? 0 : rnd() < 0.55 ? 1 : 0,
      mx: 0,
      my: 0,
    };
  };

  /** Gentle wind with slow gusts, px/s at the nearest depth. */
  const wind = (t: number) => 6 + 7 * Math.sin(t * 0.11) + 3 * Math.sin(t * 0.29 + 1.3);

  const advance = (f: BackdropFrame) => {
    const last = prev ?? f;
    let dDrift = f.drift - last.drift;
    // Jumps (a page switch, a resize) don't throw the snow around
    if (Math.abs(dDrift) > h) dDrift = 0;
    const dPanX = f.panX - last.panX;
    const dPanY = f.panY - last.panY;
    prev = { drift: f.drift, panX: f.panX, panY: f.panY };
    const W = w + 2 * MARGIN;
    const H = h + 2 * MARGIN;
    const gust = wind(f.time) * f.dt;
    for (const s of flakes) {
      // Scroll parallax and camera pan grow with nearness; the far snow barely moves with either
      const scroll = 0.04 + 0.45 * s.z * s.z;
      const pan = 0.5 + 1.2 * s.z;
      s.mx = gust * (0.35 + 0.8 * s.z) + dPanX * pan;
      s.my = s.vy * f.dt - dDrift * scroll + dPanY * pan;
      s.x = mod(s.x + s.mx, W);
      s.y += s.my;
      // Gone off the bottom (or pushed off the top by the scroll): back in at the other edge, elsewhere
      if (s.y >= H || s.y < 0) {
        s.y = mod(s.y, H);
        s.x = Math.random() * W;
      }
    }
  };

  return {
    resize(width, height) {
      if (width === w && height === h) return;
      w = width;
      h = height;
      prev = null;
      const count = Math.round(Math.min(MAX_FLAKES, Math.max(MIN_FLAKES, (w * h) / AREA_PER_FLAKE)));
      const near = w < 768 ? 3 : 7;
      // Far and middle flakes, then the bokeh; drawn back to front
      const zs = [...Array.from({ length: count }, () => Math.random() * 0.88), ...Array.from({ length: near }, () => 0.9 + Math.random() * 0.1)];
      flakes = zs.sort((a, b) => a - b).map(make);
    },

    draw(ctx, f) {
      if (f.still) {
        prev = { drift: f.drift, panX: f.panX, panY: f.panY };
        for (const s of flakes) s.mx = s.my = 0;
      } else advance(f);

      const W = w + 2 * MARGIN;
      const { dpr, time } = f;
      let turned = false;
      for (const s of flakes) {
        const bokehFlake = s.sprite >= 2;
        const size = bokehFlake ? s.r * 2 : s.r * 4;
        const x = mod(s.x + s.sway * Math.sin(time * s.freq + s.ph), W) - MARGIN;
        const y = s.y - MARGIN;
        const a = s.tw ? s.a * (0.7 + 0.3 * Math.sin(time * s.tw + s.ph)) : s.a;
        const sprite = sprites[s.sprite];
        const step = Math.hypot(s.mx, s.my);
        if (step > size * 0.6) {
          // Fast view: a streak from where the flake was to where it is, fainter the longer it gets
          const c = s.mx / step;
          const k = s.my / step;
          ctx.setTransform(dpr * c, dpr * k, -dpr * k, dpr * c, dpr * x, dpr * y);
          ctx.globalAlpha = a * Math.min(1, (size * 1.6) / (step + size));
          ctx.drawImage(sprite, -step - size / 2, -size / 2, step + size, size);
          turned = true;
          continue;
        }
        if (turned) {
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          turned = false;
        }
        ctx.globalAlpha = a;
        ctx.drawImage(sprite, x - size / 2, y - size / 2, size, size);
      }
      ctx.globalAlpha = 1;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    },
  };
}
