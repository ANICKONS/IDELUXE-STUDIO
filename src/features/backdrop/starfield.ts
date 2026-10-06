/**
 * Star sky behind the planet (2D canvas): twinkling stars that drift a little with the scroll and
 * the pointer, plus a rare shooting star. The planet canvas sits on top and hides the stars behind it.
 */

/** Deterministic pseudo-random numbers: the same stars on every render. */
function seeded(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

type Star = { x: number; y: number; r: number; a: number; tw: number; ph: number; d: number; c: number };
type Meteor = { x: number; y: number; dx: number; dy: number; t: number };

const STAR_COLORS = ["238 236 255", "201 194 255", "233 168 255", "110 231 216"];
const METEOR_LIFE = 0.9;

const mod = (a: number, n: number) => ((a % n) + n) % n;

function makeStars(count: number): Star[] {
  const rnd = seeded(7);
  return Array.from({ length: count }, () => ({
    x: rnd(),
    y: rnd(),
    r: rnd() < 0.86 ? 0.5 + rnd() * 0.6 : 1.1 + rnd() * 0.7,
    a: 0.25 + rnd() * 0.6,
    tw: 0.4 + rnd() * 1.6,
    ph: rnd() * Math.PI * 2,
    d: 0.2 + rnd() * 0.8,
    c: rnd() < 0.8 ? (rnd() < 0.6 ? 0 : 1) : rnd() < 0.6 ? 2 : 3,
  }));
}

export type Starfield = {
  resize(width: number, height: number): void;
  /** Advances the shooting star's clock. */
  tick(dt: number): void;
  /** `scroll` — smoothed page scroll (px), `shift` — pointer parallax (px). */
  draw(ctx: CanvasRenderingContext2D, time: number, scroll: number, shift: number): void;
};

export function createStarfield(): Starfield {
  const rnd = seeded(42);
  let w = 0;
  let h = 0;
  let stars: Star[] = [];
  let meteor: Meteor | null = null;
  let nextMeteor = 4 + rnd() * 6;

  return {
    resize(width, height) {
      w = width;
      h = height;
      // The sky spans the whole screen; the planet covers its lower part
      const count = w < 768 ? 140 : 260;
      if (stars.length !== count) stars = makeStars(count);
    },

    tick(dt) {
      if (meteor) {
        meteor.t += dt;
        if (meteor.t > METEOR_LIFE) meteor = null;
      } else if ((nextMeteor -= dt) <= 0) {
        const dir = rnd() < 0.5 ? -1 : 1;
        meteor = { x: w * (0.2 + rnd() * 0.6), y: h * (0.03 + rnd() * 0.2), dx: dir * (220 + rnd() * 160), dy: 90 + rnd() * 60, t: 0 };
        nextMeteor = 9 + rnd() * 10;
      }
    },

    draw(ctx, time, scroll, shift) {
      for (const s of stars) {
        const tw = 0.55 + 0.45 * Math.sin(time * s.tw + s.ph);
        const a = s.a * tw;
        if (a < 0.02) continue;
        // Nearer stars (bigger d) drift further: a hint of depth while scrolling
        const y = mod(s.y * h - scroll * 0.035 * s.d, h);
        const x = mod(s.x * w + shift * s.d, w);
        ctx.fillStyle = `rgb(${STAR_COLORS[s.c]} / ${a.toFixed(3)})`;
        ctx.fillRect(x - s.r, y - s.r, s.r * 2, s.r * 2);
      }

      if (!meteor) return;
      const k = meteor.t / METEOR_LIFE;
      const hx = meteor.x + meteor.dx * k;
      const hy = meteor.y + meteor.dy * k;
      const len = 150;
      const norm = Math.hypot(meteor.dx, meteor.dy);
      const tx = hx - (meteor.dx / norm) * len;
      const ty = hy - (meteor.dy / norm) * len;
      const a = Math.sin(Math.PI * k);
      const g = ctx.createLinearGradient(hx, hy, tx, ty);
      g.addColorStop(0, `rgb(238 236 255 / ${0.85 * a})`);
      g.addColorStop(1, "rgb(201 194 255 / 0)");
      ctx.globalCompositeOperation = "lighter";
      ctx.strokeStyle = g;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(tx, ty);
      ctx.stroke();
      ctx.globalCompositeOperation = "source-over";
    },
  };
}
