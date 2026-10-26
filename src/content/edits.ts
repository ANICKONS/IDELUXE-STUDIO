/*
 * «Шоурил эдитов» — вторая вкладка окна-редактора на первом экране: лента коротких вертикальных
 * роликов. Карточки листаются свайпом, стрелками, кликом по соседней карточке или по таймлайну под
 * лентой (на нём эдиты стоят подряд, как клипы в секвенции). Ролик доиграл — включается следующий.
 * Клик по карточке открывает плеер со звуком.
 *
 * Как добавить эдит:
 *  1. Положи в public/videos/edits/ два файла с одним именем:
 *     - `имя.mp4` — вертикальный 9:16, H.264 + AAC, 540×960 или 720×1280, до ~15 с и ~3 МБ;
 *     - `имя.jpg` — обложка того же размера (самый узнаваемый кадр).
 *     Команды ffmpeg для сжатия и обложки — README → «Видео» → «Эдиты».
 *  2. Допиши объект в массив `edits` (порядок в массиве = порядок в ленте и на таймлайне):
 *   {
 *     id: "neon-drift",               // латиницей, без пробелов, не повторяется
 *     title: "Неоновый дрифт",        // название на карточке
 *     author: "@de_1uxe",             // кто смонтировал
 *     software: "Ae",                 // в чём: Ae | Pr | Vg
 *     video: "neon-drift",            // имя файлов в public/videos/edits без расширения
 *     duration: 8.4,                  // длительность в секундах: по ней строится таймлайн
 *     tags: ["#glitch", "#флеш"],     // необязательно: подпись на карточке
 *     used: ["Twixtor", "Deep Glow"], // необязательно: эффекты и плагины, панель «Об эдите»
 *     link: "https://t.me/…/123",     // необязательно: где эдит опубликован (пост, TikTok)
 *   },
 *
 * Сейчас здесь ДЕМО: шесть вертикальных нарезок из шоурила IDELUXE (того же, что во вкладке
 * «Шоурил VFX»). Заменяй их своими эдитами, а файлы демо удали из public/videos/edits.
 */

/** Programs an edit can be made in (their tiles: components/ui/app-tile.tsx). */
export type EditSoftware = "Ae" | "Pr" | "Vg";

export type Edit = {
  id: string;
  title: string;
  author: string;
  software: EditSoftware;
  /** File name without extension in public/videos/edits: `<video>.mp4` + `<video>.jpg`. */
  video: string;
  /** Seconds. The timeline is laid out by it (the real file may differ by a frame or two). */
  duration: number;
  tags?: string[];
  used?: string[];
  link?: string;
};

export const softwareName: Record<EditSoftware, string> = {
  Ae: "After Effects",
  Pr: "Premiere Pro",
  Vg: "Vegas Pro",
};

export const edits: Edit[] = [
  {
    id: "glitch-intro",
    title: "Глитч-титры",
    author: "@de_1uxe",
    software: "Ae",
    video: "glitch-intro",
    duration: 6.88,
    tags: ["#glitch", "#титры"],
    used: ["Displacement Map", "RGB Split"],
  },
  {
    id: "rhythm-cut",
    title: "Ритм-нарезка",
    author: "@de_1uxe",
    software: "Pr",
    video: "rhythm-cut",
    duration: 6.38,
    tags: ["#ритм", "#склейки"],
    used: ["Flash", "Shake"],
  },
  {
    id: "type-beat",
    title: "Текст в бит",
    author: "@de_1uxe",
    software: "Ae",
    video: "type-beat",
    duration: 5.17,
    tags: ["#типографика"],
    used: ["Трекинг текста", "Deep Glow"],
  },
  {
    id: "fisheye-skate",
    title: "Fisheye-скейт",
    author: "@de_1uxe",
    software: "Ae",
    video: "fisheye-skate",
    duration: 7.3,
    tags: ["#fisheye", "#скейт"],
    used: ["Optics Compensation", "Twixtor"],
  },
  {
    id: "flash-poster",
    title: "Флеши и постер",
    author: "@de_1uxe",
    software: "Pr",
    video: "flash-poster",
    duration: 4.88,
    tags: ["#flash", "#постеризация"],
    used: ["Posterize", "Lumetri Color"],
  },
  {
    id: "datamosh-final",
    title: "Datamosh",
    author: "@de_1uxe",
    software: "Ae",
    video: "datamosh-final",
    duration: 9.09,
    tags: ["#datamosh", "#глитч"],
    used: ["Datamosh", "Chromatic"],
  },
];
