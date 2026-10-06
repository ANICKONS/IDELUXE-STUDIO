import type { DecorItem } from "@/features/decor/decor-3d";

/**
 * Where the 3D objects hang on the landing. `depth` sets the depth of field (decor-3d.tsx):
 * 0.6 — sharp, at the content's plane; lower — further back, small, soft and dim; above 0.85 —
 * out-of-focus foreground in front of the content, big and mostly off-screen. Each block has a
 * sharp object on both sides where it fits, plus a far or a foreground one for depth.
 * `x` — px from the screen edge (negative = partly off-screen); keep sharp objects within ~140 px
 * of the edge, otherwise they slide under the cards on 1440 px screens. `inset` — how far the
 * object moves towards the content on wide screens. `top` is relative to the container.
 */

/** Inside the hero. */
export const heroDecor: DecorItem[] = [
  { name: "keyframe", side: "left", top: "12%", x: 40, size: 150, depth: 0.6, rotate: -12, inset: 0.5, mobile: true },
  { name: "sparkle", side: "right", top: "6%", x: 70, size: 110, depth: 0.6, rotate: 10, inset: 0.5 },
  { name: "play", side: "right", top: "27%", x: 40, size: 150, depth: 0.6, rotate: 8, inset: 0.35, mobile: true },
  { name: "cube", side: "left", top: "31%", x: 210, size: 80, depth: 0.28, rotate: 18, inset: 0.8 },
  { name: "lens", side: "left", top: "52%", x: -110, size: 300, depth: 0.95, rotate: -8 },
];

/**
 * Landing blocks: each block carries its own 2–3 objects (`top` = share of the block's height).
 * Neighbouring objects alternate sides, so two figures never end up on top of each other.
 */
export const sectionDecor = {
  about: [
    { name: "knot", side: "right", top: "4%", x: 10, size: 140, depth: 0.6, rotate: 12, inset: 0.5, mobile: true },
    { name: "asterisk", side: "left", top: "44%", x: 20, size: 120, depth: 0.6, rotate: -14, inset: 0.6 },
    { name: "wave", side: "right", top: "70%", x: 30, size: 110, depth: 0.3, rotate: -6, inset: 0.6 },
  ],
  audience: [
    { name: "cube", side: "right", top: "8%", x: -150, size: 320, depth: 0.95, rotate: -14 },
    { name: "keyframe", side: "left", top: "60%", x: 70, size: 80, depth: 0.22, rotate: 24, inset: 0.85 },
  ],
  platform: [
    { name: "lens", side: "left", top: "16%", x: 10, size: 130, depth: 0.6, rotate: 8, inset: 0.5, mobile: true },
    { name: "play", side: "right", top: "6%", x: 90, size: 70, depth: 0.2, rotate: -20, inset: 0.9 },
    { name: "asterisk", side: "right", top: "60%", x: 20, size: 120, depth: 0.6, rotate: 18, inset: 0.5 },
  ],
  faq: [
    { name: "sparkle", side: "left", top: "18%", x: 20, size: 120, depth: 0.6, rotate: -8, inset: 0.45, mobile: true },
    { name: "wave", side: "right", top: "62%", x: 20, size: 120, depth: 0.6, rotate: 10, inset: 0.5 },
  ],
  cta: [
    { name: "knot", side: "left", top: "16%", x: 40, size: 100, depth: 0.35, rotate: -14, inset: 0.6 },
    { name: "play", side: "right", top: "48%", x: -150, size: 300, depth: 0.96, rotate: -12 },
  ],
} satisfies Record<string, DecorItem[]>;
