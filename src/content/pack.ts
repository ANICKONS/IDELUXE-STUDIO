/**
 * IDX PACK: what's inside. The pack is the materials only (footage, effects and presets, sounds,
 * textures, templates); the platform itself — tutorials, resources, AI — comes with a subscription
 * (content/plans.ts). Shared by the landing, /pricing and the AI assistant's prompt.
 */

export const packStats = [
  { value: 6500, suffix: "+", label: "футажей" },
  { value: 3000, suffix: "+", label: "пресетов" },
  { value: 3200, suffix: "+", label: "текстур" },
  { value: 9000, suffix: "+", label: "звуковых эффектов" },
];

/** Everything in the pack, for lists and the assistant. */
export const packContents = ["футажи", "эффекты и пресеты", "звуки", "текстуры", "шаблоны и материалы для проектов"];

/** The next pack: not on sale yet (/pricing shows a locked card, the FAQ and the assistant mention it). */
export const pack3d = {
  title: "IDX PACK 3D",
  tagline: "3D-графика и моушн нового уровня. Готовим к запуску.",
  available: false,
};
