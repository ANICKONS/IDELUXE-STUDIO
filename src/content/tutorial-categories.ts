import type { DecorName } from "@/features/decor/assets";

/**
 * Tutorial sections. Tutorials are breakdowns of individual effects, not a course with a plan,
 * so /learn groups them by topic (the lessons themselves: content/tutorials.ts). Order = the
 * sidebar's order. `tint` (RGB channels) lights the section's covers and its marks; `decor` is the
 * 3D render on a lesson's cover until it has its own poster. Icons: features/learn/glyphs.tsx.
 */
export const tutorialCategories = [
  { slug: "vfx", title: "VFX", hint: "Графика и композитинг", tint: "242 205 140", decor: "sparkle" },
  { slug: "sfx", title: "SFX", hint: "Звук в эдите", tint: "150 168 214", decor: "wave" },
  { slug: "motion", title: "Motion", hint: "Моушн-дизайн", tint: "214 181 131", decor: "keyframe" },
  { slug: "transitions", title: "Переходы", hint: "Склейки и переходы", tint: "212 148 138", decor: "knot" },
  { slug: "color", title: "Цвет", hint: "Цветокоррекция и look", tint: "214 160 182", decor: "lens" },
  { slug: "export", title: "Экспорт", hint: "Рендер под площадки", tint: "143 185 174", decor: "play" },
] as const satisfies readonly { slug: string; title: string; hint: string; tint: string; decor: DecorName }[];

export type TutorialSection = (typeof tutorialCategories)[number]["slug"];
export type TutorialCategory = (typeof tutorialCategories)[number];

export const tutorialSections: TutorialSection[] = tutorialCategories.map((c) => c.slug);

export const categoryOf = (slug: TutorialSection): TutorialCategory => tutorialCategories.find((c) => c.slug === slug)!;
