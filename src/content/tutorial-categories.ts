/**
 * Tutorial sections. Tutorials are breakdowns of individual effects, not a course with a plan,
 * so /learn groups them by topic. The `slug` must match `sections.slug` in Supabase: it picks
 * the icon and colour (src/components/learn/category-icon.tsx). Any other slug works too and
 * gets the default icon.
 */
export const tutorialCategories = [
  { slug: "vfx", title: "VFX", hint: "Графика и композитинг" },
  { slug: "sfx", title: "SFX", hint: "Звук в эдите" },
  { slug: "motion", title: "Motion", hint: "Моушн-дизайн" },
  { slug: "transitions", title: "Переходы", hint: "Склейки и переходы" },
  { slug: "color", title: "Цвет", hint: "Цветокоррекция и look" },
  { slug: "export", title: "Экспорт", hint: "Рендер под площадки" },
] as const;
