import type { DecorItem } from "@/features/decor/decor-3d";

/**
 * Inner pages (tutorials, pricing, profile…): the content column starts right at the top, so the
 * objects stay in the side margins — on 1440 px screens those are only ~140 px wide.
 * Landing placements (and what `depth` means) live next to the landing: src/features/landing/decor.ts.
 */
export const pageDecor: DecorItem[] = [
  { name: "sparkle", side: "left", top: "150px", x: -40, size: 130, depth: 0.6, rotate: -10, inset: 0.45, mobile: true },
  { name: "knot", side: "right", top: "190px", x: -40, size: 170, depth: 0.6, rotate: 16 },
  { name: "cube", side: "right", top: "560px", x: 30, size: 90, depth: 0.6, rotate: -18, inset: 0.8 },
  { name: "play", side: "left", top: "58%", x: -30, size: 110, depth: 0.6, rotate: 14, inset: 0.5 },
  { name: "lens", side: "right", top: "74%", x: -160, size: 300, depth: 0.95, rotate: -12 },
];
