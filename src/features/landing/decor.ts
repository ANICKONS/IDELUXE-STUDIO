import type { DecorItem } from "@/features/decor/decor-3d";

/**
 * The only 3D objects on the site: four of them float around the hero, beside the headline and in
 * the margins (the right one must fit the ~140 px beside the editor on 1440 px screens). `depth` sets the depth of field (decor-3d.tsx): 0.6 — sharp, at the content's
 * plane; lower — further back, small, soft and dim. `x` — px from the screen edge, `inset` — how far
 * the object moves towards the content on wide screens, `top` — share of the hero's height.
 */
export const heroDecor: DecorItem[] = [
  { name: "keyframe", side: "left", top: "12%", x: 40, size: 150, depth: 0.6, rotate: -12, inset: 0.5, mobile: true },
  { name: "sparkle", side: "right", top: "6%", x: 70, size: 110, depth: 0.6, rotate: 10, inset: 0.5 },
  { name: "play", side: "right", top: "30%", x: 12, size: 120, depth: 0.6, rotate: 8, inset: 0.6, mobile: true },
  { name: "cube", side: "left", top: "31%", x: 210, size: 80, depth: 0.28, rotate: 18, inset: 0.8 },
];
