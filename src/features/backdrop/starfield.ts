/**
 * Star sky behind the planet (2D canvas): twinkling stars that drift a little with the scroll and
 * the pointer, plus a rare shooting star. When the camera flies between shots (camera.ts) the
 * stars pan with depth parallax and smear into short motion trails, and faint space dust streams
 * past from the centre. The planet canvas sits on top and hides the stars behind it.
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
/** Space dust: a direction from the centre and a depth (1 far → NEAR right at the camera). */
type Mote = { angle: number; z: number; c: number };

const STAR_COLORS = ["238 236 255", "201 194 255", "233 168 255", "110 231 216"];
const METEOR_LIFE = 0.9;
const MOTES = 40;
const NEAR = 0.06;
/** Motion trail length: how far a star moves in this much time, s. */
const TRAIL = 0.03;
const MAX_TRAIL = 90;

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

export type SkyView = {
  /** Scroll drift, px. Accumulated, so a jump to another page doesn't throw the stars around. */
  drift: number;
  /** Offset of the nearest stars, px: pointer parallax + camera pan. */
  x: number;
  y: number;
  /** Stars spread from the centre while the camera flies forward, 0 at rest. */
  zoom: number;
  /** Space dust intensity, 0–1. */
  dust: number;
};

export type Starfield = {
  resize(width: number, height: number): void;
  /** Advances the clocks (shooting star, dust) by `dt` s and draws the sky. */
  draw(ctx: CanvasRenderingContext2D, time: number, dt: number, view: SkyView): void;
};

export function createStarfield(): Starfield {
  const rnd = seeded(42);
  const rndDust = seeded(99);
  let w = 0;
  let h = 0;
  let stars: Star[] = [];
  let meteor: Meteor | null = null;
  let nextMeteor = 4 + rnd() * 6;
  let prev: SkyView | null = null;
  const motes: Mote[] = Array.from({ length: MOTES }, () => ({
    angle: rndDust() * Math.PI * 2,
    z: NEAR + rndDust() * (1 - NEAR),
    c: rndDust() < 0.7 ? 1 : 2,
  }));
  const p: [number, number] = [0, 0];
  const q: [number, number] = [0, 0];

  // Nearer stars (bigger d) drift further: a hint of depth
  const place = (s: Star, v: SkyView, out: [number, number]) => {
    let x = mod(s.x * w + v.x * s.d, w);
    let y = mod(s.y * h + (v.y - v.drift * 0.035) * s.d, h);
    if (v.zoom) {
      const k = 1 + v.zoom * s.d;
      x = w / 2 + (x - w / 2) * k;
      y = h / 2 + (y - h / 2) * k;
    }
    out[0] = x;
    out[1] = y;
  };

  const tickMeteor = (dt: number) => {
    if (meteor) {
      meteor.t += dt;
      if (meteor.t > METEOR_LIFE) meteor = null;
    } else if ((nextMeteor -= dt) <= 0) {
      const dir = rnd() < 0.5 ? -1 : 1;
      meteor = { x: w * (0.2 + rnd() * 0.6), y: h * (0.03 + rnd() * 0.2), dx: dir * (220 + rnd() * 160), dy: 90 + rnd() * 60, t: 0 };
      nextMeteor = 9 + rnd() * 10;
    }
  };

  const drawMeteor = (ctx: CanvasRenderingContext2D) => {
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
  };

  /** Dust flies out of the centre and grows into streaks as it passes the camera. */
  const drawDust = (ctx: CanvasRenderingContext2D, dt: number, dust: number) => {
    const speed = dust * 1.2;
    for (const m of motes) {
      m.z -= speed * dt;
      if (m.z < NEAR) {
        m.z += 1 - NEAR;
        m.angle = rndDust() * Math.PI * 2;
      }
    }
    if (dust < 0.01) return;
    const reach = Math.hypot(w, h) / 2;
    const cx = w / 2;
    const cy = h * 0.46;
    ctx.globalCompositeOperation = "lighter";
    ctx.lineCap = "round";
    for (const m of motes) {
      const head = (reach * 0.08) / m.z;
      const tail = (reach * 0.08) / Math.min(1, m.z + 0.02 + speed * 0.05);
      if (tail > reach * 1.1) continue;
      // Born faint in the distance, brighter as it nears, fading again towards the screen edges
      const alpha = dust * 0.26 * Math.min(1, (1 - m.z) * 2.2) * Math.max(0, 1 - tail / reach);
      const cos = Math.cos(m.angle);
      const sin = Math.sin(m.angle);
      ctx.strokeStyle = `rgb(${STAR_COLORS[m.c]} / ${alpha.toFixed(3)})`;
      ctx.lineWidth = 0.5 + (1 - m.z) * 1.1;
      ctx.beginPath();
      ctx.moveTo(cx + cos * tail, cy + sin * tail);
      ctx.lineTo(cx + cos * head, cy + sin * head);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = "source-over";
  };

  return {
    resize(width, height) {
      w = width;
      h = height;
      prev = null;
      // The sky spans the whole screen; the planet covers part of it
      const count = w < 768 ? 140 : 260;
      if (stars.length !== count) stars = makeStars(count);
    },

    draw(ctx, time, dt, view) {
      tickMeteor(dt);

      // Trails only while the sky actually moves (camera flight, fast scrolling)
      const last = prev;
      const moving =
        last !== null &&
        dt > 0 &&
        Math.abs(view.x - last.x) + Math.abs(view.y - last.y) + Math.abs(view.zoom - last.zoom) * w + Math.abs(view.drift - last.drift) * 0.035 > 0.3;
      if (moving) ctx.lineCap = "round";

      for (const s of stars) {
        const tw = 0.55 + 0.45 * Math.sin(time * s.tw + s.ph);
        const a = s.a * tw;
        if (a < 0.02) continue;
        place(s, view, p);
        const color = `rgb(${STAR_COLORS[s.c]} / ${a.toFixed(3)})`;
        if (moving && last) {
          place(s, last, q);
          const dx = p[0] - q[0];
          const dy = p[1] - q[1];
          const dist = Math.hypot(dx, dy);
          const len = Math.min(MAX_TRAIL, (dist / dt) * TRAIL);
          // dist too big = the star wrapped round the screen edge this frame: no trail
          if (len > 2 && dist < w * 0.25) {
            // The star's light spreads along the trail: longer trails are fainter
            ctx.strokeStyle = `rgb(${STAR_COLORS[s.c]} / ${(a * Math.min(1, 0.3 + 5 / len)).toFixed(3)})`;
            ctx.lineWidth = s.r * 1.6;
            ctx.beginPath();
            ctx.moveTo(p[0], p[1]);
            ctx.lineTo(p[0] - (dx / dist) * len, p[1] - (dy / dist) * len);
            ctx.stroke();
            continue;
          }
        }
        ctx.fillStyle = color;
        ctx.fillRect(p[0] - s.r, p[1] - s.r, s.r * 2, s.r * 2);
      }
      prev = { ...view };

      drawDust(ctx, dt, view.dust);
      drawMeteor(ctx);
    },
  };
}
