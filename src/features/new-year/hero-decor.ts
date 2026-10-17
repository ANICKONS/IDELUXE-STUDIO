import type { DecorAsset, DecorItem } from "@/features/decor";

/**
 * Bump after re-rendering (tools/decor-render/new-year.js): /decor is cached by browsers for a
 * week (next.config.ts) and the file names stay the same.
 */
const VERSION = 1;

/** Renders in public/decor/new-year; sizes as printed by the render script. */
const asset = (name: string, width: number, height: number): DecorAsset => ({
  src: `/decor/new-year/${name}.webp?v=${VERSION}`,
  width,
  height,
});

const bauble = asset("bauble", 624, 720);
const snowflake = asset("snowflake", 642, 720);
const star = asset("star", 720, 683);
const gift = asset("gift", 719, 720);

/**
 * The hero's four objects for the holidays, in the same places as the usual ones
 * (features/landing/decor.ts): the bauble instead of the keyframe, the snowflake instead of the
 * sparkle, the star instead of the play button, the gift instead of the far cube.
 */
export const heroDecor: DecorItem[] = [
  { name: bauble, side: "left", top: "12%", x: 40, size: 140, depth: 0.6, rotate: -8, inset: 0.5, mobile: true },
  { name: snowflake, side: "right", top: "6%", x: 70, size: 112, depth: 0.6, rotate: 12, inset: 0.5 },
  { name: star, side: "right", top: "30%", x: 12, size: 124, depth: 0.6, rotate: 6, inset: 0.6, mobile: true },
  { name: gift, side: "left", top: "31%", x: 210, size: 84, depth: 0.28, rotate: 10, inset: 0.8 },
];
