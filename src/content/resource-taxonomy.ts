/**
 * «Ресурсы»: the vocabulary of the hub — sections, kinds of add-ons, systems, programs, categories,
 * access — with their labels and tints. Safe for the browser (the sidebar, the cards and the item
 * window read it). The catalog itself, with its direct links, is server-only: content/resources.ts.
 */
import type { AppCode } from "@/components/ui/app-tile";

export type OS = "win" | "mac";
/** The programs everything else plugs into (their tiles: components/ui/app-tile.tsx). */
export type ProgramId = "ae" | "pr" | "me" | "ps" | "vg";
/** What plugs into a program. Scripts (ScriptUI panels) count as extensions. */
export type AddonKind = "plugin" | "extension";
/** The hub's three sections. */
export type ResourceKind = "program" | AddonKind;
/**
 * How an add-on comes:
 *  - "single" — one plugin or extension;
 *  - "module" — several plugins put together by IDELUXE, one download (Red Giant, Boris FX…);
 *  - "collection" — several separate add-ons under one card, each opened and downloaded on its own.
 */
export type AddonForm = "single" | "module" | "collection";
export type License = "free" | "paid" | "subscription";
export type Category =
  | "light"
  | "effects"
  | "3d"
  | "glitch"
  | "color"
  | "depth"
  | "retime"
  | "enhance"
  | "tracking"
  | "reframe"
  | "motion"
  | "presets"
  | "sound"
  | "workflow";

export const osLabel: Record<OS, string> = { win: "Windows", mac: "macOS" };

/** Short program names, for «Для After Effects 2026». */
export const programName: Record<ProgramId, string> = {
  ae: "After Effects",
  pr: "Premiere Pro",
  me: "Media Encoder",
  ps: "Photoshop",
  vg: "Vegas Pro",
};

export const kindLabel: Record<ResourceKind, { one: string; many: string }> = {
  program: { one: "Программа", many: "Программы" },
  plugin: { one: "Плагин", many: "Плагины" },
  extension: { one: "Расширение", many: "Расширения" },
};

/** The sidebar's order. */
export const sections: ResourceKind[] = ["program", "plugin", "extension"];
export const addonKinds: AddonKind[] = ["plugin", "extension"];

/** A section's groups in the sidebar, in this order (only the ones it has). */
export const forms: AddonForm[] = ["module", "collection", "single"];
export const formLabel: Record<Exclude<AddonForm, "single">, { one: string; many: string }> = {
  module: { one: "Модуль", many: "Модули" },
  collection: { one: "Коллекция", many: "Коллекции" },
};

/** «Доступ» in the item's window: how the developer gives it out. */
export const licenseLabel: Record<License, string> = {
  free: "Бесплатно",
  paid: "Платная лицензия",
  subscription: "По подписке",
};

/** What an add-on is for (the line under its name on a card) and its tint (RGB channels, styles/tokens.css). */
export const categories: Record<Category, { label: string; tint: string }> = {
  light: { label: "Свет и свечение", tint: "242 205 140" },
  effects: { label: "Эффекты", tint: "226 180 110" },
  "3d": { label: "3D", tint: "168 192 222" },
  glitch: { label: "Глитч и стилизация", tint: "212 148 138" },
  color: { label: "Цвет", tint: "214 160 182" },
  depth: { label: "Глубина и фокус", tint: "147 178 212" },
  retime: { label: "Ретайм и блюр", tint: "237 220 189" },
  enhance: { label: "Качество и апскейл", tint: "143 185 174" },
  tracking: { label: "Трекинг", tint: "120 190 170" },
  reframe: { label: "Формат кадра", tint: "176 190 205" },
  motion: { label: "Анимация", tint: "214 181 131" },
  presets: { label: "Пресеты и переходы", tint: "200 170 120" },
  sound: { label: "Звук", tint: "150 168 214" },
  workflow: { label: "Удобство", tint: "200 196 188" },
};

/** A program's tile (components/ui/app-tile.tsx). */
export const programCode: Record<ProgramId, AppCode> = { ae: "Ae", pr: "Pr", me: "Me", ps: "Ps", vg: "Vg" };

/** A program's own glow (the same as its tile's, components/ui/app-tile.tsx): its window's cover. */
export const programTint: Record<ProgramId, string> = {
  ae: "150 168 214",
  pr: "204 160 182",
  me: "214 181 131",
  ps: "120 168 226",
  vg: "140 180 222",
};
