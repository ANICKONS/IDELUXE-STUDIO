/**
 * The built-in pre-rendered objects in /public/decor (transparent WebP, tools/decor-render; README →
 * «3D-декор»): black chrome, champagne gold, ivory. Plain data, safe anywhere: the floating decor
 * (decor-3d.tsx) and the tutorial covers (features/learn) read it.
 */
export type DecorName = "play" | "keyframe" | "sparkle" | "lens" | "wave" | "knot" | "cube" | "asterisk";

/**
 * Bump after re-rendering: /decor is cached by browsers for a week (next.config.ts), and the
 * file names stay the same.
 */
export const DECOR_VERSION = 3;

/** Intrinsic size of each render, px. */
export const DECOR_SIZE: Record<DecorName, [width: number, height: number]> = {
  play: [683, 720],
  keyframe: [617, 720],
  sparkle: [667, 720],
  lens: [720, 712],
  wave: [720, 605],
  knot: [707, 720],
  cube: [695, 720],
  asterisk: [638, 720],
};

export const decorSrc = (name: DecorName) => `/decor/${name}.webp?v=${DECOR_VERSION}`;
