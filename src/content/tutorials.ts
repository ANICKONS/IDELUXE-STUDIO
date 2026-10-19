import "server-only";
import { mediaUrl } from "@/config/media";
import type { ProgramId } from "@/content/resource-taxonomy";
import type { TutorialSection } from "@/content/tutorial-categories";

/*
 * The tutorials: breakdowns of individual effects, grouped by section (content/tutorial-categories.ts).
 * Server-only on purpose: `video` and `files` are the direct links, and the pages hand them out only
 * to the accounts a lesson is open for (features/learn/catalog.server.ts, rules in lib/access-rules.ts →
 * canWatchTutorial). Everything else (title, description, chapters, what it uses) is public: a locked
 * lesson still shows what's inside. Copy protection (DRM, watermark) comes with the video hosting
 * (Kinescope), not from here.
 *
 *  - `slug` — the lesson's address (/learn/<slug>) and its key in the progress table: don't rename
 *    a published lesson, or everyone's progress on it is lost.
 *  - `intro: true` — an intro lesson, open with a free account; the rest are IDX PRO.
 *  - `duration` — seconds, shown on the card before the video loads.
 *  - `published` — "YYYY-MM-DD": the «Новые» order and the «Новое» badge (NEW_DAYS).
 *  - `chapters` — `at` in seconds from the start; the first one at 0.
 *  - `resources` — ids from content/resources.ts: «Что понадобится» links into «Ресурсы».
 *  - `poster` — the card's cover and the player's first frame (16:9 image); without it the cover is
 *    drawn from the section's tint and 3D object.
 *  - `video.renditions` — highest quality first; the player picks by screen width.
 * Order in the array = the «По порядку» order (and the order inside a section's list).
 */

export type Chapter = { at: number; title: string };

export type TutorialVideo = {
  renditions: { label: string; src: string; minWidth: number }[];
  /** width / height; 16:9 by default. */
  aspect?: number;
  /**
   * A stand-in until the real lesson is uploaded: the page says so, and the chapters are squeezed
   * into the stand-in's own `length` (s) for whoever gets the video.
   */
  demo?: boolean;
  length?: number;
};

/** Project files, presets, footage for the lesson: open only with the lesson itself. */
export type TutorialFile = { label: string; href: string; size?: string };

export type TutorialEntry = {
  slug: string;
  section: TutorialSection;
  title: string;
  /** One line on the card. */
  summary: string;
  /** «О разборе» on the lesson's page; paragraphs separated by an empty line. */
  about: string;
  intro?: boolean;
  duration: number;
  published: string;
  programs: ProgramId[];
  resources?: string[];
  chapters?: Chapter[];
  files?: TutorialFile[];
  poster?: string;
  video?: TutorialVideo;
};

/** How long a lesson wears the «Новое» badge, days. */
export const NEW_DAYS = 21;

const t = (min: number, sec = 0) => min * 60 + sec;

/*
 * ЗАГЛУШКА до настоящих уроков: у примеров ниже вместо видео шоурил (57 с), на странице урока это
 * подписано. Когда появятся уроки — впиши им `video` и убери `demo()` вместе с DEMO_VIDEO.
 */
const DEMO_VIDEO: TutorialVideo = {
  renditions: [
    { label: "1080p", src: mediaUrl("showreel-1080.mp4"), minWidth: 1400 },
    { label: "720p", src: mediaUrl("showreel-720.mp4"), minWidth: 0 },
  ],
  aspect: 16 / 9,
  demo: true,
  length: 57,
};
const demo = (lesson: TutorialEntry): TutorialEntry => (lesson.video ? lesson : { ...lesson, video: DEMO_VIDEO });

const lessons: TutorialEntry[] = [
  /* ───────────── VFX ───────────── */
  {
    slug: "deep-glow",
    section: "vfx",
    intro: true,
    title: "Мягкое свечение с Deep Glow",
    summary: "Неоновый текст и световые акценты без пересвета",
    about:
      "Разбираем, почему стандартный Glow выглядит дёшево и чем Deep Glow отличается: физически правильный спад света, цветовая аберрация и аккуратная работа с яркими пикселями.\n\nСобираем свечение для текста и для отдельных элементов кадра, настраиваем радиус и экспозицию так, чтобы свет не «съедал» детали.",
    duration: t(9, 40),
    published: "2026-10-09",
    programs: ["ae"],
    resources: ["deep-glow"],
    chapters: [
      { at: 0, title: "Что делаем" },
      { at: t(1, 5), title: "Почему стандартный Glow выглядит плоско" },
      { at: t(2, 40), title: "Deep Glow: радиус и экспозиция" },
      { at: t(5, 10), title: "Цвет и аберрация" },
      { at: t(7, 30), title: "Свечение только на ярких участках" },
      { at: t(8, 50), title: "Итог и частые ошибки" },
    ],
  },
  {
    slug: "optical-flares",
    section: "vfx",
    title: "Блики и световые лучи с Optical Flares",
    summary: "Свет от фонаря, солнца и вспышек, привязанный к кадру",
    about:
      "Ставим источник света в кадре и привязываем блик к трекингу, чтобы он жил вместе с камерой. Разбираем пресеты Optical Flares и собираем свой.\n\nОтдельно — как спрятать блик за объектом и приглушить его на краях кадра.",
    duration: t(14, 20),
    published: "2026-09-22",
    programs: ["ae"],
    resources: ["optical-flares"],
    chapters: [
      { at: 0, title: "Задача" },
      { at: t(1, 30), title: "Трекинг точки источника" },
      { at: t(4, 15), title: "Пресеты и свой блик" },
      { at: t(8, 0), title: "Перекрытие объектами" },
      { at: t(11, 20), title: "Встраиваем в цвет кадра" },
    ],
  },
  {
    slug: "element-3d-title",
    section: "vfx",
    title: "Объёмный 3D-титр в Element 3D",
    summary: "Металлический логотип с отражениями прямо в After Effects",
    about:
      "Делаем объёмный титр из текстового слоя: экструзия, фаска, материал металла и окружение для отражений.\n\nАнимируем камеру, добавляем глубину резкости и собираем финальный кадр со свечением.",
    duration: t(18, 5),
    published: "2026-08-28",
    programs: ["ae"],
    resources: ["element-3d", "deep-glow"],
    chapters: [
      { at: 0, title: "Что получится" },
      { at: t(1, 40), title: "Текст в Element 3D" },
      { at: t(5, 30), title: "Материал и окружение" },
      { at: t(10, 10), title: "Камера и движение" },
      { at: t(14, 0), title: "Глубина резкости" },
      { at: t(16, 20), title: "Сборка кадра" },
    ],
  },
  {
    slug: "rgb-glitch",
    section: "vfx",
    title: "Глитч и RGB-сдвиг под бит",
    summary: "Цифровые сбои, которые попадают в музыку",
    about:
      "Собираем глитч из простых эффектов и из Glitchify: разделение каналов, смещение блоков, шум. Ставим сбои точно в удары трека с помощью маркеров.\n\nВ конце — как не переборщить: где глитч работает, а где мешает читать кадр.",
    duration: t(11, 30),
    published: "2026-08-12",
    programs: ["ae"],
    resources: ["glitchify"],
    chapters: [
      { at: 0, title: "Референс" },
      { at: t(1, 20), title: "RGB-сдвиг вручную" },
      { at: t(4, 40), title: "Glitchify: пресеты и настройка" },
      { at: t(7, 50), title: "Маркеры под бит" },
      { at: t(10, 10), title: "Мера и вкус" },
    ],
  },

  /* ───────────── SFX ───────────── */
  {
    slug: "sfx-whooshes",
    section: "sfx",
    intro: true,
    title: "Звук под склейку: вжухи и удары",
    summary: "Почему эдит без SFX ощущается пустым и как это исправить",
    about:
      "Показываю, как звук делает переход: вжух перед склейкой, удар на ней, хвост после. Где брать звуки и как подрезать их под длину перехода.\n\nРазбираем громкость и паузы, чтобы эффекты не спорили с музыкой.",
    duration: t(8, 15),
    published: "2026-10-02",
    programs: ["pr", "ae"],
    resources: ["jerry-sfx"],
    chapters: [
      { at: 0, title: "До и после" },
      { at: t(1, 10), title: "Вжух, удар, хвост" },
      { at: t(3, 30), title: "Подгоняем под переход" },
      { at: t(5, 45), title: "Громкость и место для музыки" },
    ],
  },
  {
    slug: "sfx-layering",
    section: "sfx",
    title: "Слои звука: «дорогой» удар из трёх простых",
    summary: "Низ, середина и верх — как собирают звук в трейлерах",
    about:
      "Раскладываем удар на слои: саб, тело и атака. Подбираем каждый, выравниваем по времени и сводим в один звук с компрессией.\n\nПотом собираем библиотеку своих ударов, чтобы не начинать с нуля в каждом проекте.",
    duration: t(12, 50),
    published: "2026-09-04",
    programs: ["pr"],
    chapters: [
      { at: 0, title: "Из чего состоит удар" },
      { at: t(2, 0), title: "Подбор слоёв" },
      { at: t(5, 40), title: "Выравнивание и фазы" },
      { at: t(8, 30), title: "Компрессия и эквалайзер" },
      { at: t(11, 0), title: "Своя библиотека" },
    ],
  },

  /* ───────────── Motion ───────────── */
  {
    slug: "graph-editor",
    section: "motion",
    intro: true,
    title: "Плавная анимация: Graph Editor без боли",
    summary: "Ускорение и торможение, из-за которых движение выглядит живым",
    about:
      "Главный навык моушна — работа с графиками скорости. Разбираем Easy Ease, графики значения и скорости, и когда какой открывать.\n\nДелаем одну и ту же анимацию «деревянной» и живой, чтобы увидеть разницу. В конце — Flow для быстрых кривых.",
    duration: t(10, 30),
    published: "2026-09-30",
    programs: ["ae"],
    resources: ["flow"],
    chapters: [
      { at: 0, title: "Деревянное и живое движение" },
      { at: t(1, 30), title: "Easy Ease и его пределы" },
      { at: t(3, 20), title: "График скорости" },
      { at: t(6, 10), title: "График значения" },
      { at: t(8, 40), title: "Кривые через Flow" },
    ],
  },
  {
    slug: "kinetic-type",
    section: "motion",
    title: "Кинетическая типографика под голос",
    summary: "Слова появляются в ритме речи и не мешают читать",
    about:
      "Анимируем текст под закадровый голос: раскладываем фразу по маркерам, выбираем характер появления и собираем композицию так, чтобы взгляд не прыгал.\n\nИспользуем пресеты как основу и доводим их вручную.",
    duration: t(16, 40),
    published: "2026-09-12",
    programs: ["ae"],
    resources: ["motion-bro-5"],
    chapters: [
      { at: 0, title: "Референсы" },
      { at: t(2, 10), title: "Разметка речи маркерами" },
      { at: t(5, 0), title: "Характер появления" },
      { at: t(9, 30), title: "Композиция и ритм" },
      { at: t(13, 40), title: "Пресеты и доводка" },
    ],
  },
  {
    slug: "camera-shake",
    section: "motion",
    title: "Тряска камеры и импакт",
    summary: "Удар, который чувствуется, а не просто дёргает кадр",
    about:
      "Делаем тряску на выражениях и вручную, добавляем размытие движения и короткий зум на ударе.\n\nРазбираем, как дозировать импакт, чтобы он подчёркивал музыку, а не утомлял.",
    duration: t(7, 55),
    published: "2026-08-20",
    programs: ["ae"],
    chapters: [
      { at: 0, title: "Что такое импакт" },
      { at: t(1, 15), title: "Тряска на wiggle" },
      { at: t(3, 30), title: "Ручная тряска по ключам" },
      { at: t(5, 40), title: "Размытие и зум" },
    ],
  },

  /* ───────────── Переходы ───────────── */
  {
    slug: "zoom-transition",
    section: "transitions",
    intro: true,
    title: "Зум-переход с размытием",
    summary: "Самый популярный переход эдитов — с нуля и без плагинов",
    about:
      "Собираем зум-переход из стандартных эффектов: масштаб, отражение краёв, радиальное размытие. Настраиваем графики, чтобы склейка пряталась в самом быстром моменте.\n\nСохраняем всё в пресет, чтобы ставить переход за секунды.",
    duration: t(6, 40),
    published: "2026-10-14",
    programs: ["ae"],
    chapters: [
      { at: 0, title: "Как устроен переход" },
      { at: t(0, 55), title: "Масштаб и края" },
      { at: t(2, 40), title: "Размытие в движении" },
      { at: t(4, 20), title: "Графики и склейка" },
      { at: t(5, 50), title: "Свой пресет" },
    ],
  },
  {
    slug: "velocity-twixtor",
    section: "transitions",
    title: "Velocity-эдит и плавное замедление в Twixtor",
    summary: "Скорость, которая ускоряется и тормозит в такт",
    about:
      "Готовим исходник, делаем ремап времени и сглаживаем замедление через Twixtor. Разбираем, какие кадры подходят для velocity, а какие развалятся.\n\nСобираем ритм скорости под трек и добавляем размытие движения.",
    duration: t(15, 10),
    published: "2026-09-18",
    programs: ["ae"],
    resources: ["revision-fx"],
    chapters: [
      { at: 0, title: "Какие кадры подходят" },
      { at: t(2, 20), title: "Ремап времени" },
      { at: t(5, 50), title: "Twixtor: настройки" },
      { at: t(9, 40), title: "Скорость под бит" },
      { at: t(12, 50), title: "Размытие движения" },
    ],
  },
  {
    slug: "preset-transitions",
    section: "transitions",
    title: "Пресеты переходов: быстро, но не шаблонно",
    summary: "Как ставить готовые переходы так, чтобы их не узнавали",
    about:
      "Берём готовые переходы из расширений и меняем их под свой ролик: длительность, кривые, направление и звук.\n\nСобираем из нескольких пресетов один свой переход.",
    duration: t(9, 20),
    published: "2026-08-05",
    programs: ["ae", "pr"],
    resources: ["mister-horse"],
    chapters: [
      { at: 0, title: "Почему пресеты узнают" },
      { at: t(1, 40), title: "Длительность и кривые" },
      { at: t(4, 30), title: "Направление и звук" },
      { at: t(7, 0), title: "Свой переход из трёх" },
    ],
  },

  /* ───────────── Цвет ───────────── */
  {
    slug: "lumetri-look",
    section: "color",
    intro: true,
    title: "Свой look в Lumetri Color",
    summary: "От плоского исходника к цельной картинке за 10 минут",
    about:
      "Разбираем порядок цветокоррекции: сначала баланс и экспозиция, потом контраст, потом look. Учимся читать скопы, чтобы не доверять одному монитору.\n\nСохраняем look в LUT и переносим его на весь ролик.",
    duration: t(13, 0),
    published: "2026-09-26",
    programs: ["pr"],
    chapters: [
      { at: 0, title: "Порядок работы" },
      { at: t(1, 50), title: "Баланс и экспозиция" },
      { at: t(4, 30), title: "Скопы" },
      { at: t(7, 20), title: "Контраст и кривые" },
      { at: t(10, 0), title: "Look и LUT" },
    ],
  },
  {
    slug: "cinematic-color",
    section: "color",
    title: "Кино-цвет с Magic Bullet Looks",
    summary: "Тёплые блики, холодные тени и плёночное зерно",
    about:
      "Собираем «киношную» картинку в Magic Bullet Looks: разделение тонов, мягкий контраст, зерно и виньетка.\n\nРазбираем, как подогнать один look под кадры с разным светом, и как сохранить кожу естественной.",
    duration: t(12, 15),
    published: "2026-08-30",
    programs: ["ae", "pr"],
    resources: ["red-giant"],
    chapters: [
      { at: 0, title: "Референс" },
      { at: t(1, 30), title: "Разделение тонов" },
      { at: t(4, 50), title: "Контраст и плёнка" },
      { at: t(8, 10), title: "Кожа и разный свет" },
      { at: t(10, 40), title: "Сохраняем свой look" },
    ],
  },

  /* ───────────── Экспорт ───────────── */
  {
    slug: "export-vertical",
    section: "export",
    intro: true,
    title: "Экспорт под Reels, Shorts и TikTok",
    summary: "Настройки, после которых площадка не убивает качество",
    about:
      "Какое разрешение, частоту кадров и битрейт отдавать каждой площадке, и почему «максимальное качество» иногда выглядит хуже.\n\nСобираем пресеты в Media Encoder, чтобы отправлять ролик в один клик.",
    duration: t(7, 30),
    published: "2026-10-06",
    programs: ["me", "ae"],
    resources: ["media-encoder"],
    chapters: [
      { at: 0, title: "Почему площадки портят видео" },
      { at: t(1, 20), title: "Разрешение и частота" },
      { at: t(3, 10), title: "Битрейт" },
      { at: t(5, 20), title: "Пресеты в Media Encoder" },
    ],
  },
  {
    slug: "export-quality",
    section: "export",
    title: "Рендер без потери качества: кодеки и мастер-копия",
    summary: "H.264, H.265, ProRes — что выбрать и когда",
    about:
      "Разбираемся в кодеках без лишней теории: чем мастер-копия отличается от файла для загрузки, когда нужен ProRes и почему H.265 не всегда лучше.\n\nНастраиваем очередь рендера, чтобы проект выходил сразу в нескольких версиях.",
    duration: t(11, 45),
    published: "2026-08-16",
    programs: ["me", "ae", "pr"],
    resources: ["media-encoder"],
    chapters: [
      { at: 0, title: "Мастер и копия для площадки" },
      { at: t(2, 0), title: "H.264 и H.265" },
      { at: t(5, 10), title: "ProRes и альфа-канал" },
      { at: t(8, 20), title: "Очередь рендера" },
    ],
  },
];

export const tutorials: TutorialEntry[] = lessons.map(demo);
