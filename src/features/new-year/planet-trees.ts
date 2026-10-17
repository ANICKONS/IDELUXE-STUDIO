import { homeRadius, planetGeometry } from "@/features/backdrop";
import type { BackdropFrame } from "@/lib/backdrop-frame";

/*
 * Snowy fir trees standing on the planet's horizon, like on the Little Prince's asteroid (2D canvas,
 * drawn by snowfall.tsx under the snow). Always right on the limb, upright against the atmosphere's
 * glow, and carried along it by the planet itself: every frame each tree's spot of the ground is
 * followed to where the spin (and the camera) moved it, then put back on the horizon. Scroll down and
 * the trees run along the edge with the surface, scroll up and they come back.
 * (Along the limb the ground moves at the same speed everywhere — the spin's component towards the
 * viewer — so the trees keep their spacing for good.)
 * The first one stands in the margin left of the content, on the first screen.
 */

/** Sprite in CSS-like units (drawn at RES× for sharpness); the tree's base is at (BASE_X, BASE_Y). */
const SW = 96;
const SH = 128;
const RES = 2;
const BASE_X = 48;
const BASE_Y = 124;
/** Height of the biggest tree, CSS px: share of the planet radius, within limits. */
const HEIGHT_K = 0.088;
const MIN_H = 64;
const MAX_H = 116;
/**
 * The trees round the limb: angle from the first one, rad, and size. Five, the gaps a little less
 * than the stretch of the limb a desktop screen shows (≈77°), so one is always in view; the second
 * one waits just past the right edge, so the first screen shows only the first.
 */
const deg = Math.PI / 180;
const TREES = [
  { at: 0, size: 1 },
  { at: 76 * deg, size: 0.82 },
  { at: 148 * deg, size: 0.92 },
  { at: 220 * deg, size: 0.86 },
  { at: 292 * deg, size: 0.78 },
];
/** How far the base sinks under the horizon, share of the tree's height (planted, not floating). */
const SINK = 0.03;

/** Tiers, bottom to top: apex y, bottom y, half-width at the bottom. */
const TIERS: [number, number, number][] = [
  [62, 110, 42],
  [44, 90, 34],
  [27, 70, 26],
  [12, 49, 17],
];
const STAR_Y = 10;
const COLORS = ["242 205 140", "255 243 222", "178 206 242", "238 168 150"];

/** Garland swags: one across each tier, alternating direction, so they read as a spiral. */
const SWAGS = TIERS.map(([apex, bottom, half], i) => {
  const hw = (y: number) => ((y - apex) / (bottom - apex)) * half;
  const ya = apex + (bottom - apex) * 0.42;
  const yb = bottom - 5;
  const dir = i % 2 ? -1 : 1;
  const from: [number, number] = [BASE_X - dir * hw(ya) * 0.75, ya];
  const to: [number, number] = [BASE_X + dir * hw(yb) * 0.82, yb];
  const n = i === TIERS.length - 1 ? 2 : 4;
  // Lights along the swag, sagging a little between its ends
  const lights = Array.from({ length: n }, (_, j) => {
    const t = (j + 0.5) / n;
    return [from[0] + (to[0] - from[0]) * t, from[1] + (to[1] - from[1]) * t + Math.sin(Math.PI * t) * 2.5] as [number, number];
  });
  return { from, to, lights };
});
const LIGHTS = SWAGS.flatMap((s) => s.lights);

const smooth = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const canvas = (w: number, h: number, res = 1) => {
  const c = document.createElement("canvas");
  c.width = w * res;
  c.height = h * res;
  const x = c.getContext("2d")!;
  x.scale(res, res);
  return [c, x] as const;
};

function tierPath(ctx: CanvasRenderingContext2D, [apex, bottom, half]: [number, number, number]) {
  const r = BASE_X + half;
  ctx.beginPath();
  ctx.moveTo(BASE_X, apex);
  // Slightly concave sides, a gently scalloped hem
  ctx.quadraticCurveTo(BASE_X + half * 0.36, apex + (bottom - apex) * 0.62, r, bottom);
  const steps = Math.max(3, Math.round(half / 7));
  for (let i = 1; i <= steps; i++) {
    const x0 = r - ((i - 1) / steps) * half * 2;
    const x1 = r - (i / steps) * half * 2;
    ctx.quadraticCurveTo((x0 + x1) / 2, bottom + 4, x1, bottom);
  }
  ctx.quadraticCurveTo(BASE_X - half * 0.36, apex + (bottom - apex) * 0.62, BASE_X, apex);
  ctx.closePath();
}

/**
 * The tree in layers drawn once, so the light can weigh them per frame: the body (pine green, lit
 * from the left, so it has volume and reads against the black sky) with its garland wire, the
 * sunlit rim, the snow (on each tier's shoulders, under the tier above, and round the trunk), the star.
 */
function treeLayers() {
  const [body, b] = canvas(SW, SH, RES);
  const bark = b.createLinearGradient(BASE_X - 5, 0, BASE_X + 5, 0);
  bark.addColorStop(0, "#4a3626");
  bark.addColorStop(1, "#1c130d");
  b.fillStyle = bark;
  b.fillRect(BASE_X - 5, 102, 10, BASE_Y - 102);
  TIERS.forEach((tier, i) => {
    const [, , half] = tier;
    tierPath(b, tier);
    const g = b.createLinearGradient(BASE_X - half, 0, BASE_X + half, 0);
    g.addColorStop(0, "#3a6152");
    g.addColorStop(0.45, "#24453b");
    g.addColorStop(1, "#0f2420");
    b.fillStyle = g;
    b.fill();
    // A darker band along the hem: the shade under the tier above
    b.save();
    tierPath(b, tier);
    b.clip();
    const shade = b.createLinearGradient(0, tier[1] - 10, 0, tier[1] + 4);
    shade.addColorStop(0, "rgb(4 10 9 / 0)");
    shade.addColorStop(1, "rgb(4 10 9 / 0.55)");
    b.fillStyle = shade;
    b.fillRect(0, tier[1] - 10, SW, 14);
    b.restore();
    // The garland's wire across this tier
    const { from, to } = SWAGS[i];
    b.beginPath();
    b.moveTo(...from);
    b.quadraticCurveTo((from[0] + to[0]) / 2, (from[1] + to[1]) / 2 + 5, ...to);
    b.strokeStyle = "rgb(236 214 170 / 0.6)";
    b.lineWidth = 0.7;
    b.stroke();
  });

  // Rim: each tier's outline, cut where the tier above covers it
  const [rim, r] = canvas(SW, SH, RES);
  r.lineWidth = 2;
  r.lineJoin = "round";
  TIERS.forEach((tier, i) => {
    tierPath(r, tier);
    const g = r.createLinearGradient(0, tier[0], 0, tier[1]);
    g.addColorStop(0, "rgb(250 228 186 / 0.9)");
    g.addColorStop(1, "rgb(168 192 222 / 0.3)");
    r.strokeStyle = g;
    r.stroke();
    if (i < TIERS.length - 1) {
      r.globalCompositeOperation = "destination-out";
      tierPath(r, TIERS[i + 1]);
      r.fill();
      r.globalCompositeOperation = "source-over";
    }
  });

  // Snow on each tier's shoulders: from where the tier above ends (the top tier: from its tip) down
  // to a wavy line with a few drips, clipped to the tier; the tier above then covers its own part
  const [snow, s] = canvas(SW, SH, RES);
  TIERS.forEach((tier, i) => {
    const [apex, , half] = tier;
    const top = i < TIERS.length - 1 ? TIERS[i + 1][1] - 2 : apex;
    const line = top + (i < TIERS.length - 1 ? 6 : 13);
    s.save();
    tierPath(s, tier);
    s.clip();
    const g = s.createLinearGradient(0, top, 0, line + 4);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(1, "#c9d6e6");
    s.fillStyle = g;
    s.beginPath();
    s.moveTo(BASE_X - half - 4, top - 20);
    s.lineTo(BASE_X + half + 4, top - 20);
    s.lineTo(BASE_X + half + 4, line);
    const waves = 5;
    for (let k = 1; k <= waves; k++) {
      const x0 = BASE_X + half + 4 - ((k - 1) / waves) * (half * 2 + 8);
      const x1 = BASE_X + half + 4 - (k / waves) * (half * 2 + 8);
      const drop = (k + i) % 2 ? 3.4 : 1.4;
      s.bezierCurveTo(x0, line + drop * 1.5, x1, line + drop * 1.5, x1, line);
    }
    s.closePath();
    s.fill();
    s.restore();
    if (i < TIERS.length - 1) {
      s.globalCompositeOperation = "destination-out";
      tierPath(s, TIERS[i + 1]);
      s.fill();
      s.globalCompositeOperation = "source-over";
    }
  });
  // A little snow round the trunk
  const drift = s.createLinearGradient(0, BASE_Y - 4, 0, BASE_Y + 3);
  drift.addColorStop(0, "#f6f8fc");
  drift.addColorStop(1, "#b6c4d8");
  s.fillStyle = drift;
  s.beginPath();
  s.ellipse(BASE_X, BASE_Y, 15, 3.6, 0, Math.PI, 0);
  s.closePath();
  s.fill();

  const [star, st] = canvas(SW, SH, RES);
  st.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 ? 3.8 : 8.5;
    st.lineTo(BASE_X + Math.cos(a) * rr, STAR_Y + Math.sin(a) * rr);
  }
  st.closePath();
  const gold = st.createLinearGradient(BASE_X - 8, STAR_Y - 8, BASE_X + 8, STAR_Y + 8);
  gold.addColorStop(0, "#fff6dc");
  gold.addColorStop(0.5, "#e5bd72");
  gold.addColorStop(1, "#a8783a");
  st.fillStyle = gold;
  st.fill();

  return { body, rim, snow, star };
}

/** Soft round light in a colour (canvas can't tint a drawImage). */
function glow(rgb: string, falloff = 0.45) {
  const [c, x] = canvas(32, 32);
  const g = x.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, `rgb(${rgb} / 1)`);
  g.addColorStop(0.18, `rgb(${rgb} / 0.85)`);
  g.addColorStop(falloff, `rgb(${rgb} / 0.25)`);
  g.addColorStop(1, `rgb(${rgb} / 0)`);
  x.fillStyle = g;
  x.fillRect(0, 0, 32, 32);
  return c;
}

type Orbit = Pick<BackdropFrame, "spin" | "yaw" | "pitch">;

export type PlanetTrees = {
  draw(ctx: CanvasRenderingContext2D, frame: BackdropFrame): void;
};

export function createPlanetTrees(): PlanetTrees {
  const layers = treeLayers();
  const lights = COLORS.map((c) => glow(c));
  const starGlow = glow("250 222 160");
  const halo = glow("255 214 160", 0.6);

  /** Where along the limb each tree stands: angle from the top of the disc, clockwise, rad. */
  let angles: number[] | null = null;
  let lastSpin = 0;

  /** First frame: the first tree in the margin left of the content column (phones: near the top). */
  const place = (w: number) => {
    const first = w >= 1024 ? -Math.asin(Math.min(0.95, (w / 2 - Math.max(64, (w - 1152) / 4 + 24)) / homeRadius(w))) : -0.32;
    return TREES.map((t) => first + t.at);
  };

  /**
   * Follows each tree's ground through this frame's spin (seen from the current camera) and puts it
   * back on the horizon. Only the spin carries them: a camera move between pages leaves the trees
   * where they stand on the limb, so a flight doesn't shuffle them along it.
   */
  const carry = (list: number[], from: number, to: Orbit) => {
    const was = planetGeometry({ ...to, spin: from });
    const now = planetGeometry(to);
    return list.map((a) => {
      const [x, y] = now.surface(was.locate([Math.sin(a), Math.cos(a), 0]));
      return Math.atan2(x, y);
    });
  };

  return {
    draw(ctx, f) {
      const orbit: Orbit = { spin: f.spin, yaw: f.yaw, pitch: f.pitch };
      angles = angles ? (f.spin !== lastSpin ? carry(angles, lastSpin, orbit) : angles) : place(f.width);
      lastSpin = f.spin;

      const [sx, sy] = planetGeometry(orbit).sun;
      const sunLen = Math.hypot(sx, sy) || 1;
      const height = Math.min(MAX_H, Math.max(MIN_H, f.planetR * HEIGHT_K));
      const { dpr } = f;

      angles.forEach((angle, i) => {
        const H = height * TREES[i].size;
        const nx = Math.sin(angle);
        const ny = Math.cos(angle);
        const r = f.planetR - H * SINK;
        const bx = f.planetX + r * nx;
        const by = f.planetY - r * ny;
        if (bx < -H || bx > f.width + H || by < -H || by > f.height + H) return;

        // Backlit like the limb: the rim and the snow catch more light on the sun's side
        const lit = smooth(-0.4, 1, (nx * sx + ny * sy) / sunLen);
        const k = H / BASE_Y;
        const c = Math.cos(angle) * k * dpr;
        const s = Math.sin(angle) * k * dpr;
        // Sprite units → device px: rotate about the base, which sits on the horizon
        ctx.setTransform(c, s, -s, c, bx * dpr, by * dpr);

        // A faint warm halo of its lights over the atmosphere
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = 0.14;
        ctx.drawImage(halo, -70, -BASE_Y * 0.62 - 60, 140, 120);
        ctx.globalCompositeOperation = "source-over";

        ctx.globalAlpha = 1;
        ctx.drawImage(layers.body, -BASE_X, -BASE_Y, SW, SH);
        ctx.globalAlpha = 0.25 + 0.6 * lit;
        ctx.drawImage(layers.rim, -BASE_X, -BASE_Y, SW, SH);
        ctx.globalAlpha = 0.85 + 0.15 * lit;
        ctx.drawImage(layers.snow, -BASE_X, -BASE_Y, SW, SH);
        ctx.globalAlpha = 1;
        ctx.drawImage(layers.star, -BASE_X, -BASE_Y, SW, SH);

        // Its lights and the star's glow, added on top
        ctx.globalCompositeOperation = "lighter";
        const t = f.time + i * 2.3;
        LIGHTS.forEach(([lx, ly], j) => {
          const tw = 0.5 + 0.5 * Math.sin(t * (1.1 + (j % 4) * 0.37) + j * 1.9);
          ctx.globalAlpha = 0.45 + 0.55 * tw;
          const size = 7.5 + tw * 2.5;
          ctx.drawImage(lights[j % lights.length], lx - BASE_X - size / 2, ly - BASE_Y - size / 2, size, size);
        });
        const pulse = 0.5 + 0.5 * Math.sin(t * 0.9);
        ctx.globalAlpha = 0.6 + 0.25 * pulse;
        const sg = 30 + pulse * 8;
        ctx.drawImage(starGlow, -sg / 2, STAR_Y - BASE_Y - sg / 2, sg, sg);
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
      });
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    },
  };
}
