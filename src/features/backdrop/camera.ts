import { routes } from "@/config/routes";

/*
 * Camera of the space backdrop. Every page has its shot:
 *  - "home": a huge planet rises from the bottom of the screen, the sun hidden right behind it;
 *  - "right" / "left" («Тарифы» / «Ресурсы»): the camera has flown round the planet, it hangs at
 *    the side of the screen and the sun lights a crescent facing the content;
 *  - "above" (the auth screens: sign-in, confirming an address, a new password): the camera has
 *    risen over the planet, only open space is left.
 * Switching pages flies the camera between the shots: the planet swoops along an arc (the camera
 * pulls back a little mid-way), the stars pan and space dust streams past.
 */

export type Shot = "home" | "right" | "left" | "above";

export function shotFor(pathname: string): Shot {
  if (pathname.startsWith(routes.pricing)) return "right";
  if (pathname.startsWith(routes.resources)) return "left";
  // Every auth screen keeps the same shot, so following a link from a letter doesn't move the camera
  if (pathname.startsWith(routes.login) || pathname.startsWith(routes.verifyEmail) || pathname.startsWith(routes.resetPassword)) return "above";
  return "home";
}

export type Pose = {
  /** Planet disc: centre and radius, viewport CSS px. */
  x: number;
  y: number;
  r: number;
  /** Camera orbit around the planet, rad: turns the visible face of the planet and its lighting. */
  yaw: number;
  pitch: number;
  /** Star sky offset for the nearest stars, px (far stars move less). */
  panX: number;
  panY: number;
};

/** Top of the planet (the limb at the centre of the screen) on the landing, share of the viewport height. */
const HOME_LIMB = 0.69;

/** Landing planet radius: big enough to read as a planet, not a hill (the limb drops ~250 px towards the sides at 1440 px). */
export const homeRadius = (w: number) => Math.max(w * 0.8, 440);

export function shotPose(shot: Shot, w: number, h: number): Pose {
  switch (shot) {
    case "home": {
      const r = homeRadius(w);
      return { x: w / 2, y: h * HOME_LIMB + r, r, yaw: 0, pitch: 0, panX: 0, panY: 0 };
    }
    case "right":
    case "left": {
      const side = shot === "right" ? 1 : -1;
      // Phones: a smaller planet low in the corner; wide screens: a tall sphere along the edge
      const portrait = w < h;
      const r = portrait ? w * 0.62 : Math.min(w * 0.42, h * 0.75);
      const x = w / 2 + side * (w / 2 + r * (portrait ? 0.2 : 0.08));
      const y = portrait ? h * 0.8 : h * 0.56;
      // The sun swings to the far side: its crescent faces the middle of the screen
      return { x, y, r, yaw: -side * 0.78, pitch: 0.1, panX: side * w * 0.42, panY: -h * 0.04 };
    }
    case "above": {
      // Below the screen with its glow; the surface has rolled towards the camera
      const r = homeRadius(w) * 1.06;
      return { x: w / 2, y: h + 260 + r, r, yaw: 0, pitch: -0.55, panX: 0, panY: h * 0.3 };
    }
  }
}

export type Flight = {
  from: Pose;
  /** The target is evaluated every frame, so a resize mid-flight still lands on the right spot. */
  to: Shot;
  start: number;
  duration: number;
  /** How far the planet dips below its straight path mid-flight, px. */
  dip: number;
  /** How much the camera pulls back mid-flight, share of the radius. */
  pull: number;
  /** Space dust streaming past and the stars' spread, 0–1. */
  dust: number;
};

export type CameraFrame = {
  pose: Pose;
  /** Stars spread from the centre (flying forward), 0 at rest. */
  zoom: number;
  /** Space dust intensity, 0–1. */
  dust: number;
};

export function restingFrame(pose: Pose): CameraFrame {
  return { pose, zoom: 0, dust: 0 };
}

/** CSS-like cubic-bézier easing (x is monotonic for these control points). */
function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sx = (t: number) => ((ax * t + bx) * t + cx) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  return (x: number) => {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const err = sx(t) - x;
      const d = dx(t);
      if (Math.abs(err) < 1e-5 || Math.abs(d) < 1e-6) break;
      t -= err / d;
    }
    t = Math.min(1, Math.max(0, t));
    return ((ay * t + by) * t + cy) * t;
  };
}

/** Gentle start, fast middle, long soft landing: reads as a camera move, not a slide. */
const ease = cubicBezier(0.6, 0, 0.2, 1);

/** `intro`: the first flight after the preloader (the camera comes down and the planet rises). */
export function planFlight(from: Pose, to: Shot, w: number, h: number, now: number, intro = false): Flight {
  const target = shotPose(to, w, h);
  const across = Math.min(1, Math.abs(target.x - from.x) / w);
  return {
    from,
    to,
    start: now,
    // ms; the page's entrance and the exit before it are timed off these (SpaceScene, PageTransitions)
    duration: intro ? 2800 : to === "above" ? 2000 : 2050 + across * 480,
    dip: across * h * 0.45,
    pull: across * 0.16,
    dust: intro ? 0.25 : to === "above" ? 0.25 : 0.3 + across * 0.5,
  };
}

export function sampleFlight(f: Flight, to: Pose, now: number): CameraFrame & { done: boolean } {
  const t = Math.min(1, Math.max(0, (now - f.start) / f.duration));
  const e = ease(t);
  const arc = Math.sin(Math.PI * e);
  const mix = (a: number, b: number) => a + (b - a) * e;
  const { from } = f;
  return {
    pose: {
      x: mix(from.x, to.x),
      y: mix(from.y, to.y) + f.dip * arc,
      r: mix(from.r, to.r) * (1 - f.pull * arc),
      yaw: mix(from.yaw, to.yaw),
      pitch: mix(from.pitch, to.pitch),
      panX: mix(from.panX, to.panX),
      panY: mix(from.panY, to.panY),
    },
    zoom: 0.07 * f.dust * arc,
    dust: f.dust * arc,
    done: t >= 1,
  };
}
