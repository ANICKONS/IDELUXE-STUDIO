/**
 * The "edit" shown in the landing editor. Clip boundaries are the real cuts of
 * public/videos/reel-teaser.* (found with ffmpeg scene detection), so the timeline,
 * the active clip and the effect controls follow the picture frame-accurately.
 *
 * The teaser is a 16 s loop cut from the showreel at 27.3 s, which is why the
 * sequence timecode starts at 00:00:27:07.
 */

export const LOOP = 16;
export const FPS = 24;
/** Sequence time (in the full showreel) of teaser t = 0. */
export const SEQ_OFFSET = 27.3;
export const SEQ_DURATION = 56.77;
/** Tiles in /videos/editor-thumbs.jpg (one 112×63 frame per detected shot). */
export const THUMB_TILES = 34;

export type ClipKind = "footage" | "comp" | "flash" | "3d" | "transition";
export type FxPreset =
  | "push"
  | "pull"
  | "grade"
  | "fisheye"
  | "flash"
  | "posterize"
  | "text"
  | "speed"
  | "glow"
  | "wipe"
  | "shake"
  | "glitch"
  | "3d"
  | "zoom"
  | "dissolve";

export type Clip = { start: number; end: number; name: string; kind: ClipKind; thumb: number; fx: FxPreset };
export type Layer = { start: number; end: number; name: string };

// prettier-ignore
export const clips: Clip[] = [
  { start: 0,      end: 0.25,   name: "crt_static.mov",       kind: "footage",    thumb: 0,  fx: "grade" },
  { start: 0.25,   end: 1.208,  name: "crt_hallway.mov",      kind: "footage",    thumb: 1,  fx: "push" },
  { start: 1.208,  end: 1.333,  name: "street_a.mov",         kind: "footage",    thumb: 2,  fx: "pull" },
  { start: 1.333,  end: 1.625,  name: "street_b.mov",         kind: "footage",    thumb: 3,  fx: "push" },
  { start: 1.625,  end: 2.458,  name: "title_cod.aep",        kind: "comp",       thumb: 4,  fx: "text" },
  { start: 2.458,  end: 3.333,  name: "skate_fisheye_a.mov",  kind: "footage",    thumb: 5,  fx: "fisheye" },
  { start: 3.333,  end: 4.0,    name: "subway_fisheye.mov",   kind: "footage",    thumb: 6,  fx: "fisheye" },
  { start: 4.0,    end: 4.167,  name: "flash_white.aep",      kind: "flash",      thumb: 7,  fx: "flash" },
  { start: 4.167,  end: 4.375,  name: "posterize_a.mov",      kind: "footage",    thumb: 8,  fx: "posterize" },
  { start: 4.375,  end: 4.833,  name: "posterize_b.mov",      kind: "footage",    thumb: 9,  fx: "posterize" },
  { start: 4.833,  end: 5.375,  name: "skate_fisheye_b.mov",  kind: "footage",    thumb: 10, fx: "fisheye" },
  { start: 5.375,  end: 6.333,  name: "type_partners.aep",    kind: "comp",       thumb: 11, fx: "text" },
  { start: 6.333,  end: 6.875,  name: "promo_overlays.aep",   kind: "comp",       thumb: 12, fx: "glow" },
  { start: 6.875,  end: 7.333,  name: "promo_overlays_b.aep", kind: "comp",       thumb: 13, fx: "text" },
  { start: 7.333,  end: 7.5,    name: "flash_white.aep",      kind: "flash",      thumb: 14, fx: "flash" },
  { start: 7.5,    end: 7.75,   name: "promo_presets.aep",    kind: "comp",       thumb: 15, fx: "text" },
  { start: 7.75,   end: 8.875,  name: "presets_hall.mov",     kind: "footage",    thumb: 16, fx: "speed" },
  { start: 8.875,  end: 9.375,  name: "portrait_cap.mov",     kind: "footage",    thumb: 17, fx: "grade" },
  { start: 9.375,  end: 9.875,  name: "portrait_close.mov",   kind: "footage",    thumb: 18, fx: "push" },
  { start: 9.875,  end: 10.25,  name: "lips_highkey.mov",     kind: "footage",    thumb: 19, fx: "grade" },
  { start: 10.25,  end: 10.708, name: "profile_bw.mov",       kind: "footage",    thumb: 21, fx: "pull" },
  { start: 10.708, end: 10.833, name: "wipe_light.aep",       kind: "transition", thumb: 22, fx: "wipe" },
  { start: 10.833, end: 11.167, name: "night_hat.mov",        kind: "footage",    thumb: 23, fx: "push" },
  { start: 11.167, end: 12.458, name: "promo_sfx.aep",        kind: "comp",       thumb: 24, fx: "text" },
  { start: 12.458, end: 12.875, name: "tv_room.mov",          kind: "footage",    thumb: 27, fx: "grade" },
  { start: 12.875, end: 13.208, name: "tv_room_b.mov",        kind: "footage",    thumb: 28, fx: "shake" },
  { start: 13.208, end: 14.542, name: "glitch_collage.aep",   kind: "comp",       thumb: 29, fx: "glitch" },
  { start: 14.542, end: 14.875, name: "type_glitch.aep",      kind: "comp",       thumb: 30, fx: "glitch" },
  { start: 14.875, end: 15.292, name: "red_sim.c4d",          kind: "3d",         thumb: 31, fx: "3d" },
  { start: 15.292, end: 15.5,   name: "asterisk_hit.aep",     kind: "comp",       thumb: 32, fx: "zoom" },
  { start: 15.5,   end: 16,     name: "Перекрёстный наплыв",  kind: "transition", thumb: 33, fx: "dissolve" },
];

/** V3: typography that is baked into the reel (the same numbers as IDX PACK). */
// prettier-ignore
export const titles: Layer[] = [
  { start: 1.625,  end: 2.458,  name: "Call of Duty" },
  { start: 5.375,  end: 6.333,  name: "PARTNERS" },
  { start: 6.333,  end: 7.333,  name: "8 500 OVERLAYS" },
  { start: 7.5,    end: 8.875,  name: "5 000 PRESETS" },
  { start: 11.167, end: 12.458, name: "11 000 SFX" },
];

/** V2: adjustment layers. */
// prettier-ignore
export const fxLayers: Layer[] = [
  { start: 0.25,   end: 1.208,  name: "CRT · развёртка" },
  { start: 2.458,  end: 3.333,  name: "Shake" },
  { start: 4.0,    end: 4.167,  name: "Flash" },
  { start: 4.167,  end: 4.833,  name: "RGB Split" },
  { start: 7.333,  end: 7.5,    name: "Flash" },
  { start: 7.75,   end: 8.875,  name: "Twixtor 35%" },
  { start: 10.25,  end: 10.833, name: "Chromatic" },
  { start: 11.167, end: 12.458, name: "Deep Glow" },
  { start: 13.208, end: 14.542, name: "Datamosh" },
  { start: 15.292, end: 15.5,   name: "Zoom Hit" },
];

/** A2: sound design hits on the big cuts. */
// prettier-ignore
export const sfx: Layer[] = [
  { start: 1.625,  end: 2.0,    name: "impact" },
  { start: 2.458,  end: 2.9,    name: "whoosh" },
  { start: 4.0,    end: 4.35,   name: "flash_hit" },
  { start: 5.1,    end: 5.375,  name: "riser" },
  { start: 7.333,  end: 7.7,    name: "hit" },
  { start: 8.875,  end: 9.3,    name: "whoosh" },
  { start: 11.167, end: 11.7,   name: "boom" },
  { start: 13.208, end: 13.6,   name: "glitch" },
  { start: 15.292, end: 15.6,   name: "hit" },
];

export function indexAt(list: { start: number; end: number }[], t: number) {
  for (let i = 0; i < list.length; i++) if (t >= list[i].start && t < list[i].end) return i;
  return -1;
}

/** 00:00:27:07 */
export function timecode(seconds: number) {
  const frames = Math.floor(Math.max(0, seconds) * FPS + 1e-6);
  const s = Math.floor(frames / FPS);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(s / 3600))}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}:${pad(frames % FPS)}`;
}

/* ───────────────────────── Effect controls ───────────────────────── */

/** One parameter row. `layer` rows follow the adjustment layer's progress instead of the clip's. */
export type FxRow = {
  group: string;
  label: string;
  /** Keyframe positions within the clip / layer, 0..1. */
  keys: number[];
  value: (p: number, t: number) => string;
  layer?: boolean;
};

const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const ease = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
/** Russian number format, like in the RU interface of Premiere / After Effects. */
const f = (v: number, digits = 1) => v.toFixed(digits).replace(".", ",");

const MOTION = "Движение";

function motion(from: number, to: number, keys = [0, 1]): FxRow[] {
  return [
    { group: MOTION, label: "Масштаб", keys: from === to ? [] : keys, value: (p) => f(lerp(from, to, ease(p))) },
    { group: MOTION, label: "Положение", keys: [], value: () => "960,0  540,0" },
  ];
}

const presets: Record<FxPreset, () => FxRow[]> = {
  push: () => [...motion(100, 108), { group: "Непрозрачность", label: "Непрозрачность", keys: [], value: () => "100,0 %" }],
  pull: () => [...motion(114, 100), { group: "Непрозрачность", label: "Непрозрачность", keys: [], value: () => "100,0 %" }],
  grade: () => [
    ...motion(100, 100),
    { group: "Lumetri Color", label: "Температура", keys: [0, 1], value: (p) => f(lerp(-6, -14, p)) },
    { group: "Lumetri Color", label: "Насыщенность", keys: [0, 1], value: (p) => f(lerp(112, 128, p)) },
  ],
  fisheye: () => [
    ...motion(104, 104),
    { group: "Optics Compensation", label: "Поле зрения", keys: [0, 1], value: (p) => f(lerp(64, 78, ease(p))) },
    { group: "Optics Compensation", label: "Обратная дисторсия", keys: [], value: () => "Вкл" },
  ],
  flash: () => [
    ...motion(100, 100),
    { group: "Lumetri Color", label: "Экспозиция", keys: [0, 1], value: (p) => `+${f(4.5 * (1 - p) * (1 - p), 2)}` },
  ],
  posterize: () => [
    ...motion(100, 104),
    { group: "Posterize", label: "Уровень", keys: [0, 1], value: (p) => String(Math.round(lerp(7, 3, p))) },
    { group: "RGB Split", label: "Смещение", keys: [0, 0.5, 1], value: (p) => `${f(Math.sin(p * Math.PI) * 14)} px` },
  ],
  text: () => [
    ...motion(100, 104),
    { group: "Текст", label: "Трекинг", keys: [0, 1], value: (p) => f(lerp(60, 0, ease(p)), 0) },
    { group: "Текст", label: "Непрозрачность", keys: [0, 0.18], value: (p) => `${f(Math.min(1, p / 0.18) * 100, 0)} %` },
    { group: "Deep Glow", label: "Радиус", keys: [0, 1], value: (p) => f(lerp(18, 42, p)) },
  ],
  speed: () => [
    ...motion(100, 106),
    {
      group: "Twixtor",
      label: "Скорость",
      keys: [0, 0.3, 0.8, 1],
      value: (p) => `${f(p < 0.3 ? lerp(100, 35, p / 0.3) : p < 0.8 ? 35 : lerp(35, 100, (p - 0.8) / 0.2), 0)} %`,
    },
  ],
  glow: () => [
    ...motion(100, 103),
    { group: "Deep Glow", label: "Радиус", keys: [0, 1], value: (p) => f(lerp(24, 72, p)) },
    { group: "Deep Glow", label: "Экспозиция", keys: [0, 1], value: (p) => f(lerp(0.2, 0.9, p), 2) },
  ],
  wipe: () => [
    ...motion(100, 100),
    { group: "Линейное стирание", label: "Завершение", keys: [0, 1], value: (p) => `${f(p * 100, 0)} %` },
    { group: "Линейное стирание", label: "Растушёвка", keys: [], value: () => "40,0" },
  ],
  shake: () => [
    { group: "Transform · Shake", label: "Положение", keys: [0, 0.2, 0.4, 0.6, 0.8, 1], value: (_, t) => `${f(960 + Math.sin(t * 47) * 14 + Math.sin(t * 23) * 6)}  ${f(540 + Math.cos(t * 39) * 10)}` },
    { group: "Transform · Shake", label: "Поворот", keys: [0, 0.5, 1], value: (_, t) => `${f(Math.sin(t * 31) * 1.6)}°` },
    { group: "Transform · Shake", label: "Угол затвора", keys: [], value: () => "180,0°" },
  ],
  glitch: () => [
    ...motion(100, 100),
    { group: "Datamosh", label: "Сила", keys: [0, 0.35, 0.7, 1], value: (_, t) => `${f(40 + Math.abs(Math.sin(t * 9)) * 55, 0)} %` },
    { group: "Displacement Map", label: "Смещение", keys: [0, 0.5, 1], value: (_, t) => f(Math.sin(t * 13) * 38) },
  ],
  "3d": () => [
    { group: "Cinema 4D · Камера", label: "Поворот Y", keys: [0, 1], value: (p) => `${f(lerp(0, 38, ease(p)))}°` },
    { group: "Cinema 4D · Камера", label: "Диафрагма", keys: [0, 1], value: (p) => `f/${f(lerp(2.8, 1.4, p))}` },
  ],
  zoom: () => [
    { group: MOTION, label: "Масштаб", keys: [0, 1], value: (p) => f(lerp(60, 140, 1 - Math.pow(1 - p, 3))) },
    { group: "Размытие в движении", label: "Угол затвора", keys: [], value: () => "360,0°" },
  ],
  dissolve: () => [
    { group: "Перекрёстный наплыв", label: "Прогресс", keys: [0, 1], value: (p) => `${f(p * 100, 0)} %` },
    { group: "Непрозрачность", label: "Непрозрачность", keys: [0, 1], value: (p) => `${f((1 - p) * 100, 0)} %` },
  ],
};

const layerRows: Record<string, Omit<FxRow, "group" | "layer">> = {
  "CRT · развёртка": { label: "Линии", keys: [], value: () => "540" },
  Shake: { label: "Амплитуда", keys: [0, 1], value: (p) => f(lerp(22, 6, p)) },
  Flash: { label: "Яркость", keys: [0, 1], value: (p) => `${f((1 - p) * 100, 0)} %` },
  "RGB Split": { label: "Смещение", keys: [0, 0.5, 1], value: (p) => `${f(Math.sin(p * Math.PI) * 12)} px` },
  "Twixtor 35%": { label: "Кадровая интерп.", keys: [], value: () => "Смешение" },
  Chromatic: { label: "Аберрация", keys: [0, 1], value: (p) => f(lerp(8, 1, p)) },
  "Deep Glow": { label: "Радиус", keys: [0, 1], value: (p) => f(lerp(30, 90, p)) },
  Datamosh: { label: "Порог", keys: [0, 1], value: (_, t) => f(0.3 + Math.abs(Math.sin(t * 5)) * 0.5, 2) },
  "Zoom Hit": { label: "Масштаб", keys: [0, 1], value: (p) => f(lerp(118, 100, p)) },
};

export function buildRows(clip: Clip, layer: Layer | null): FxRow[] {
  const rows = presets[clip.fx]();
  const extra = layer ? layerRows[layer.name] : null;
  if (layer && extra) rows.push({ ...extra, group: `Корр. слой · ${layer.name}`, layer: true });
  return rows;
}

/* ───────────────────────── Audio waveform (music on A1) ───────────────────────── */

/** SVG path of a waveform whose transients land exactly on the cuts. Deterministic (same on server and client). */
export function musicWaveformPath(samples = 240) {
  const hits = clips.map((c) => c.start).filter((s) => s > 0);
  const top: string[] = [];
  const bottom: string[] = [];
  for (let i = 0; i <= samples; i++) {
    const t = (i / samples) * LOOP;
    let amp = 0.22 + 0.2 * Math.abs(Math.sin(i * 0.9) * Math.sin(i * 0.23 + 1));
    for (const h of hits) if (t >= h && t - h < 0.35) amp += 0.55 * Math.exp(-(t - h) * 12);
    amp = Math.min(0.96, amp);
    top.push(`${((i / samples) * 100).toFixed(2)},${(10 - amp * 9.5).toFixed(2)}`);
    bottom.unshift(`${((i / samples) * 100).toFixed(2)},${(10 + amp * 9.5).toFixed(2)}`);
  }
  return `M${top.join(" L")} L${bottom.join(" L")} Z`;
}
