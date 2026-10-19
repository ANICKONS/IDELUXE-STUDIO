import "server-only";
import type { AppCode } from "@/components/ui/app-tile";
import type { AddonKind, Category, License, OS, ProgramId } from "@/content/resource-taxonomy";
import { programName } from "@/content/resource-taxonomy";

/*
 * The «Ресурсы» catalog: programs, plugins and extensions (vocabulary: content/resource-taxonomy.ts).
 * Server-only on purpose: `downloads` are the direct links, and the page hands them out only to the
 * accounts an item is open for (features/resources/catalog.server.ts, rules in lib/access-rules.ts).
 *
 *  - A program has `versions` (its years: 2026, 2025…), each with its own downloads.
 *  - A plugin or an extension is for After Effects ADDON_YEAR unless it says otherwise (`hosts`).
 *    Several builds of one (Deep Glow / Deep Glow 2) — `builds`, each with its own downloads;
 *    one build — just `downloads`.
 *  - `contents` makes an add-on a module: several plugins put together by IDELUXE, one download.
 *  - A collection (`items`) groups separate add-ons under one card; each opens and downloads on its own.
 *
 * Order in the arrays = the «Популярные» order. `downloads: { win, mac }` — direct links per
 * system; without them the button leads to the developer's site (`site`), without that it says the
 * link is coming. `free: true` — open with a free account (programs always are). Installation steps
 * come from `setup` (a template at the bottom) unless the item has its own `install`.
 */

/** The year of the programs the add-ons are built for. */
export const ADDON_YEAR = "2026";

export type InstallStep = {
  text: string;
  /** A folder to copy files to, per system: shown as a copyable path. */
  path?: Partial<Record<OS, string>>;
};

/** How it's installed: the developer's installer, files copied by hand, a .zxp, a ScriptUI panel, a module's installer. */
export type Setup = "installer" | "manual" | "zxp" | "panel" | "module";

export type Compat = { program: ProgramId; year: string };

/** One downloadable build: a program's version (2026) or an add-on's variant (Deep Glow 2). */
export type BuildEntry = {
  id: string;
  label: string;
  /** Small text beside the label, e.g. the version number «v26». */
  hint?: string;
  /** Add-ons: what it runs in; by default the item's `hosts` in ADDON_YEAR. */
  compat?: Compat[];
  downloads?: Partial<Record<OS, string>>;
};

type Common = {
  id: string;
  name: string;
  vendor?: string;
  os: OS[];
  license?: License;
  /** The developer's site (public). */
  site?: string;
  /** One line under the name. */
  summary: string;
  /** «Описание» in the item's window. */
  about: string;
  /** Own installation steps instead of the template. */
  install?: InstallStep[];
};

export type ProgramEntry = Common & { kind: "program"; programId: ProgramId; code: AppCode; role: string; versions: BuildEntry[] };

export type AddonEntry = Common & {
  kind: AddonKind;
  /** Its monogram on the card and in the window (2–3 characters). */
  mark: string;
  category: Category;
  /** The programs it plugs into; After Effects by default. */
  hosts?: ProgramId[];
  /** Open with a free account. */
  free?: boolean;
  setup?: Setup;
  /** Several builds to choose from; without it the item has one, with `downloads`. */
  builds?: BuildEntry[];
  downloads?: Partial<Record<OS, string>>;
  /** What a module holds (makes the item a module). */
  contents?: { name: string; note?: string }[];
};

export type CollectionEntry = {
  kind: AddonKind;
  id: string;
  name: string;
  vendor?: string;
  mark: string;
  category: Category;
  summary: string;
  about: string;
  items: AddonEntry[];
};

const BOTH: OS[] = ["win", "mac"];
const AE_PR: ProgramId[] = ["ae", "pr"];

/* ───────────── Programs ───────────── */

export const programs: ProgramEntry[] = [
  {
    kind: "program",
    id: "after-effects",
    programId: "ae",
    code: "Ae",
    name: "After Effects",
    vendor: "Adobe",
    role: "Моушн и эффекты",
    os: BOTH,
    license: "subscription",
    site: "https://www.adobe.com/products/aftereffects.html",
    summary: "Моушн-дизайн, анимация текста, эффекты и композитинг.",
    about:
      "Главная программа для моушн-дизайна: анимация текста и графики, эффекты, трекинг и композитинг. На ней сделана большая часть разборов, и под неё собраны все плагины и расширения хаба.",
    versions: [
      { id: "2026", label: "2026", hint: "v26" },
      { id: "2025", label: "2025", hint: "v25" },
    ],
  },
  {
    kind: "program",
    id: "premiere-pro",
    programId: "pr",
    code: "Pr",
    name: "Premiere Pro",
    vendor: "Adobe",
    role: "Монтаж и цвет",
    os: BOTH,
    license: "subscription",
    site: "https://www.adobe.com/products/premiere.html",
    summary: "Монтаж, ритм и склейки, цветокоррекция и звук.",
    about: "Монтажка для роликов любой длины: таймлайн, ритм и склейки, цвет в Lumetri, звук. Дружит с After Effects через Dynamic Link.",
    versions: [
      { id: "2026", label: "2026", hint: "v26" },
      { id: "2025", label: "2025", hint: "v25" },
    ],
  },
  {
    kind: "program",
    id: "media-encoder",
    programId: "me",
    code: "Me",
    name: "Media Encoder",
    vendor: "Adobe",
    role: "Экспорт и рендер",
    os: BOTH,
    license: "subscription",
    site: "https://www.adobe.com/products/media-encoder.html",
    summary: "Очередь рендера и экспорт под любые площадки.",
    about: "Рендерит в фоне, пока ты монтируешь дальше: очередь из Premiere Pro и After Effects, пресеты под площадки, пакетный экспорт.",
    versions: [
      { id: "2026", label: "2026", hint: "v26" },
      { id: "2025", label: "2025", hint: "v25" },
    ],
  },
  {
    kind: "program",
    id: "photoshop",
    programId: "ps",
    code: "Ps",
    name: "Photoshop",
    vendor: "Adobe",
    role: "Обложки и графика",
    os: BOTH,
    license: "subscription",
    site: "https://www.adobe.com/products/photoshop.html",
    summary: "Обложки, превью, ретушь и графика для роликов.",
    about:
      "Графика вокруг монтажа: обложки и превью, ретушь кадров, текстуры и элементы для эффектов. Файлы со слоями открываются в After Effects и Premiere Pro как есть.",
    versions: [
      { id: "2026", label: "2026", hint: "v27" },
      { id: "2025", label: "2025", hint: "v26" },
    ],
  },
  {
    kind: "program",
    id: "vegas-pro",
    programId: "vg",
    code: "Vg",
    name: "Sony Vegas Pro",
    vendor: "VEGAS Creative Software",
    role: "Быстрые эдиты",
    os: ["win"],
    license: "paid",
    site: "https://www.vegascreativesoftware.com/",
    summary: "Быстрый монтаж эдитов. Только для Windows.",
    about:
      "Лёгкая и быстрая монтажка, любимая в эдитах: простой таймлайн, эффекты Video FX и плагины OFX. Раньше её выпускала Sony, теперь — VEGAS Creative Software. Работает только на Windows.",
    versions: [
      { id: "23", label: "Pro 23" },
      { id: "22", label: "Pro 22" },
    ],
  },
];

/* ───────────── Plugins and extensions ───────────── */

export const addons: (AddonEntry | CollectionEntry)[] = [
  /* ── Plugins ── */
  {
    kind: "plugin",
    id: "red-giant",
    name: "Red Giant",
    vendor: "Maxon · Red Giant",
    mark: "RG",
    category: "effects",
    os: BOTH,
    license: "subscription",
    site: "https://www.maxon.net/en/red-giant",
    setup: "module",
    summary: "Вся экосистема Red Giant одной загрузкой.",
    about:
      "Модуль собран IDELUXE: всё от Red Giant в одной загрузке. Частицы и 3D-свет Trapcode, киношный цвет Magic Bullet Looks, композитинг VFX Suite, переходы и стилизации Universe — и Maxon App, через который они ставятся и обновляются.",
    contents: [
      { name: "Maxon App", note: "установка и обновления" },
      { name: "Red Giant" },
      { name: "Trapcode", note: "частицы, 3D-формы и свет" },
      { name: "Magic Bullet Looks", note: "киношный цвет" },
      { name: "VFX Suite", note: "композитинг и VFX" },
      { name: "Red Giant Universe", note: "переходы, глитчи, стилизации" },
    ],
  },
  {
    kind: "plugin",
    id: "boris-fx",
    name: "Boris FX",
    vendor: "Boris FX",
    mark: "BFX",
    category: "light",
    os: BOTH,
    license: "subscription",
    site: "https://borisfx.com/",
    setup: "module",
    summary: "Continuum и Sapphire одной загрузкой.",
    about:
      "Модуль собран IDELUXE: два больших пакета Boris FX в одной загрузке. Continuum — сотни эффектов, переходов и титров с трекингом Mocha внутри. Sapphire — свечения, блики, искажения и переходы, которыми пользуются в кино и рекламе.",
    contents: [
      { name: "Continuum", note: "эффекты, переходы, титры" },
      { name: "Sapphire", note: "свечения, блики, искажения" },
    ],
  },
  {
    kind: "plugin",
    id: "revision-fx",
    name: "RE:Vision FX",
    vendor: "RE:Vision Effects",
    mark: "RE",
    category: "retime",
    os: BOTH,
    license: "paid",
    site: "https://revisionfx.com/",
    setup: "module",
    summary: "17 плагинов RE:Vision: Twixtor Pro, ReelSmart Motion Blur, DE:Noise и другие.",
    about:
      "Модуль собран IDELUXE: весь набор RE:Vision Effects в одной загрузке. Слоумо с дорисовкой кадров Twixtor Pro, честный моушн-блюр ReelSmart, шумодав и антимерцание, апскейл, деформации и стилизации.",
    contents: [
      { name: "Color Genius" },
      { name: "DE:Flicker", note: "убирает мерцание" },
      { name: "DE:Noise", note: "шумоподавление" },
      { name: "FieldsKit", note: "деинтерлейс и поля" },
      { name: "PV Feather", note: "растушёвка масок" },
      { name: "RE:Fill", note: "заполнение пустот в кадре" },
      { name: "RE:Flex", note: "морфинг и деформация" },
      { name: "RE:Grade" },
      { name: "RE:Lens", note: "объективы и дисторсия" },
      { name: "RE:Map", note: "перенос текстур" },
      { name: "RE:Match", note: "совмещение цвета между кадрами" },
      { name: "RE:Zup", note: "апскейл" },
      { name: "ReelSmart Motion Blur Pro", note: "моушн-блюр по движению" },
      { name: "Shade/Shape", note: "объём и свет на 2D" },
      { name: "SmoothKit", note: "размытия" },
      { name: "Twixtor Pro", note: "слоумо с дорисовкой кадров" },
      { name: "Video Gogh", note: "стилизация под живопись" },
    ],
  },
  {
    kind: "plugin",
    id: "deep-glow",
    name: "Deep Glow",
    vendor: "Plugin Everything",
    mark: "DG",
    category: "light",
    os: BOTH,
    license: "paid",
    site: "https://www.plugineverything.com/",
    setup: "manual",
    summary: "Физически правильное свечение. Две версии на выбор.",
    about:
      "Свечение, которое ведёт себя как настоящий свет: мягкое, без грязных ореолов, с контролем цвета и экспозиции. Здесь обе версии: привычный Deep Glow и Deep Glow 2 — новее, с расширенными настройками.",
    builds: [
      { id: "deep-glow", label: "Deep Glow" },
      { id: "deep-glow-2", label: "Deep Glow 2" },
    ],
  },
  {
    kind: "plugin",
    id: "video-copilot",
    name: "Video Copilot",
    vendor: "Video Copilot",
    mark: "VC",
    category: "light",
    summary: "Optical Flares и Element 3D.",
    about: "Два классических плагина Video Copilot: блики объектива Optical Flares и Element 3D — 3D-модели и объёмный текст прямо в After Effects. Каждый скачивается отдельно.",
    items: [
      {
        kind: "plugin",
        id: "optical-flares",
        name: "Optical Flares",
        vendor: "Video Copilot",
        mark: "OF",
        category: "light",
        os: BOTH,
        license: "paid",
        site: "https://www.videocopilot.net/",
        summary: "Блики и засветки объектива.",
        about: "Собирает блики как настоящие линзы: от тонких лучей до анаморфных полос. Хорош для переходов и акцентов на ударах.",
      },
      {
        kind: "plugin",
        id: "element-3d",
        name: "Element 3D",
        vendor: "Video Copilot",
        mark: "E3D",
        category: "3d",
        os: BOTH,
        license: "paid",
        site: "https://www.videocopilot.net/",
        summary: "3D-модели и объёмный текст прямо в After Effects.",
        about: "Загружает 3D-модели и делает объёмный текст внутри After Effects, рендер на видеокарте. Для логотипов, титров и сцен без отдельной 3D-программы.",
      },
    ],
  },
  {
    kind: "plugin",
    id: "ai-plugins",
    name: "AI плагины",
    mark: "AI",
    category: "enhance",
    summary: "Нейросети внутри After Effects: цвет, глубина, свет, апскейл, слоумо.",
    about:
      "Шесть плагинов на нейросетях: подгонка цвета под референс, размытие и карта глубины из обычного видео, новый свет на снятом кадре, апскейл и плавное замедление. Каждый скачивается отдельно.",
    items: [
      {
        kind: "plugin",
        id: "ai-color-match",
        name: "AI Color Match",
        vendor: "Baskl.ai",
        mark: "CM",
        category: "color",
        os: BOTH,
        license: "paid",
        site: "https://aescripts.com/ai-color-match/",
        summary: "Цвет под референс в один клик.",
        about: "Сравнивает видео с кадром-референсом и сам подгоняет под него цвет. Удобно, чтобы свести шоты с разных камер или повторить понравившийся лук.",
      },
      {
        kind: "plugin",
        id: "ai-depth-of-field",
        name: "AI Depth of Field",
        vendor: "Baskl.ai",
        mark: "DoF",
        category: "depth",
        os: BOTH,
        license: "paid",
        site: "https://aescripts.com/ai-depth-of-field/",
        summary: "Размытие фона и переднего плана, как с объектива.",
        about: "Сам понимает, где в кадре передний план, а где фон, и размывает нужное — как будто снято со светосильной оптикой.",
      },
      {
        kind: "plugin",
        id: "ai-relight",
        name: "AI Relight",
        vendor: "Baskl.ai",
        mark: "RL",
        category: "light",
        os: BOTH,
        license: "paid",
        site: "https://aescripts.com/ai-relight/",
        summary: "Новый свет на уже снятом видео.",
        about: "Понимает объём сцены и даёт добавить искусственные 3D-источники света: свет ложится по форме лиц и предметов, направление задаётся по X, Y и Z.",
      },
      {
        kind: "plugin",
        id: "scaleup",
        name: "ScaleUp",
        vendor: "aescripts + aeplugins",
        mark: "SU",
        category: "enhance",
        os: BOTH,
        license: "paid",
        site: "https://aescripts.com/scaleup/",
        summary: "Апскейл видео до 10 раз.",
        about: "Увеличивает видео до 10 раз с минимальной потерей качества: нейросеть дорисовывает детали. Выручает старые и маленькие исходники.",
      },
      {
        kind: "plugin",
        id: "quick-depth-3",
        name: "Quick Depth 3",
        vendor: "Baskl.ai",
        mark: "QD3",
        category: "depth",
        os: BOTH,
        license: "paid",
        site: "https://aescripts.com/quick-depth/",
        summary: "Карта глубины из любого видео.",
        about: "Строит карту глубины по обычному видео — быстро и без мерцания. По ней делают туман, фокус, 3D-эффекты и разделение кадра на планы.",
      },
      {
        kind: "plugin",
        id: "bullet-time",
        name: "Bullet Time",
        vendor: "Blace Plugins",
        mark: "BT",
        category: "retime",
        os: BOTH,
        license: "paid",
        site: "https://aescripts.com/bullet-time/",
        summary: "Плавное слоумо: нейросеть дорисовывает кадры.",
        about: "Дорисовывает промежуточные кадры: из 24 или 30 fps получается гладкое замедление до 120 fps. Умеет и плавный переход между двумя кадрами.",
      },
    ],
  },
  {
    kind: "plugin",
    id: "ignite-pro",
    name: "Ignite PRO",
    vendor: "FXhome",
    mark: "IG",
    category: "effects",
    os: BOTH,
    license: "paid",
    site: "https://fxhome.com/",
    summary: "Больше 180 эффектов и переходов одним пакетом.",
    about: "Большой пакет от создателей HitFilm: свечения, блики, искажения, глитчи, частицы, переходы и цветокоррекция — всё в одном меню эффектов.",
  },
  {
    kind: "plugin",
    id: "glitchify",
    name: "Glitchify",
    vendor: "Element Supply Co.",
    mark: "Gl",
    category: "glitch",
    os: BOTH,
    license: "paid",
    site: "https://elementsupply.co/products/glitchify",
    summary: "Цифровой глитч, который настраивается до мелочей.",
    about: "Сдвиги, полосы, разрывы цвета и артефакты сжатия. Красиво выглядит сразу после применения, а дальше каждый параметр подкручивается под ритм.",
  },
  {
    kind: "plugin",
    id: "pixel-sorter-3",
    name: "Pixel Sorter 3",
    vendor: "Pixel Sorter Studio",
    mark: "PxS",
    category: "glitch",
    os: BOTH,
    license: "paid",
    site: "https://aescripts.com/pixel-sorter/",
    summary: "Пиксель-сортинг: картинка растекается полосами.",
    about: "Сортирует пиксели по яркости и цвету, и кадр «растекается» полосами — тот самый глитч-арт. Третья версия быстрее и даёт больше контроля.",
  },
  {
    kind: "plugin",
    id: "signal",
    name: "Signal",
    vendor: "Zaebects",
    mark: "Sg",
    category: "glitch",
    os: BOTH,
    license: "paid",
    site: "https://aescripts.com/signal/",
    summary: "Настоящий аналоговый ТВ-сигнал.",
    about:
      "Не имитирует, а воссоздаёт аналоговую передачу: видео кодируется в сигнал и декодируется обратно. Получаются честные помехи, полосы и цветовые сбои старого телевизора и VHS.",
  },
  {
    kind: "plugin",
    id: "break-it",
    name: "Break It!",
    vendor: "aescripts + aeplugins",
    mark: "BI",
    category: "effects",
    os: BOTH,
    license: "paid",
    site: "https://aescripts.com/break-it/",
    summary: "Разбивает слой на осколки.",
    about: "Разбивает картинку или текст на куски с физикой: число осколков, сила удара, разлёт. Работает без других плагинов, превью — сразу.",
  },
  {
    kind: "plugin",
    id: "lockdown",
    name: "Lockdown",
    vendor: "aescripts + aeplugins",
    mark: "LD",
    category: "tracking",
    os: BOTH,
    license: "paid",
    site: "https://aescripts.com/lockdown/",
    summary: "Трекинг гнущихся поверхностей.",
    about: "Трекает то, что гнётся и деформируется: кожу, ткань, бутылку в руке. Прилепляет к поверхности графику и VFX, а трек можно отправить в Cinema 4D или Blender.",
  },
  {
    kind: "plugin",
    id: "atomic-stretch",
    name: "Atomic Stretch",
    vendor: "Atomic Image Labs",
    mark: "AS",
    category: "reframe",
    os: BOTH,
    license: "free",
    free: true,
    site: "https://atomicimagelabs.com/",
    summary: "Меняет формат кадра без искажений: 16:9 в 9:16 и обратно.",
    about: "Умное растягивание под другое соотношение сторон в реальном времени: кадр подстраивается под новый формат, а главное в нём не плющится. Удобно, чтобы переделать горизонтальный ролик в вертикальный.",
  },
  {
    kind: "plugin",
    id: "tracery",
    name: "Tracery",
    vendor: "aescripts + aeplugins",
    mark: "Tr",
    category: "tracking",
    os: BOTH,
    license: "paid",
    site: "https://aescripts.com/tracery/",
    summary: "Трекинг по цвету и движению — в HUD-графику.",
    about: "Находит области по цвету или движению и превращает их в интерфейсную графику: рамки, маркеры, сетки, линии связей и подписи. Тот самый «хакерский» трекинг из эдитов.",
  },

  /* ── Extensions ── */
  {
    kind: "extension",
    id: "fx-console",
    name: "FX Console",
    vendor: "Video Copilot",
    mark: "FX",
    category: "workflow",
    os: BOTH,
    license: "free",
    free: true,
    site: "https://www.videocopilot.net/",
    setup: "installer",
    summary: "Эффект на слой — с клавиатуры, за секунду.",
    about: "Жмёшь сочетание клавиш, набираешь пару букв — и эффект уже на слое. Ещё хранит избранные эффекты и делает снимки кадра. Бесплатно.",
  },
  {
    kind: "extension",
    id: "flow",
    name: "Flow",
    vendor: "aescripts + aeplugins",
    mark: "Fl",
    category: "motion",
    os: BOTH,
    license: "paid",
    site: "https://aescripts.com/flow/",
    setup: "zxp",
    summary: "Кривые скорости в одной панели.",
    about: "Рисуешь кривую изинга и применяешь к ключам, сохраняешь свои пресеты. Плавность движения без возни в редакторе графиков.",
  },
  {
    kind: "extension",
    id: "prime-tools",
    name: "Prime Tools",
    mark: "PT",
    category: "workflow",
    os: BOTH,
    setup: "zxp",
    summary: "Утилиты для ежедневной работы в After Effects.",
    about: "Панель с утилитами, которые экономят клики в ежедневном монтаже в After Effects.",
  },
  {
    kind: "extension",
    id: "randomatic",
    name: "Randomatic",
    vendor: "Romain Cousin",
    mark: "Rn",
    category: "motion",
    os: BOTH,
    license: "paid",
    site: "https://aescripts.com/randomatic/",
    setup: "panel",
    summary: "Случайные значения и вигл — без выражений.",
    about: "Раздаёт случайные значения сотням свойств сразу: позиция, поворот, цвет, задержки. Статичный рандом, анимированный или вигл — без единой строчки кода.",
  },
  {
    kind: "extension",
    id: "mister-horse",
    name: "Mister Horse",
    vendor: "Mister Horse",
    mark: "MH",
    category: "presets",
    hosts: AE_PR,
    os: BOTH,
    license: "free",
    free: true,
    site: "https://misterhorse.com/",
    setup: "installer",
    summary: "Animation Composer и Premiere Composer: пресеты в один клик.",
    about:
      "Панель Mister Horse с пресетами анимации, переходов и титров: Animation Composer для After Effects и Premiere Composer для Premiere Pro. Выбираешь, смотришь превью, применяешь. Базовые наборы бесплатные.",
  },
  {
    kind: "extension",
    id: "motion-bro-5",
    name: "Motion Bro 5",
    vendor: "Motion Bro",
    mark: "MB5",
    category: "presets",
    hosts: AE_PR,
    os: BOTH,
    license: "free",
    free: true,
    site: "https://motionbro.net/",
    setup: "installer",
    summary: "Менеджер паков: превью и перетаскивание в таймлайн.",
    about: "Панель для паков переходов и эффектов: превью, поиск и импорт в один клик. Само расширение бесплатное, паки к нему — отдельно.",
  },
  {
    kind: "extension",
    id: "rtfx-generator",
    name: "RTFX Generator",
    vendor: "RTFX animation",
    mark: "RT",
    category: "effects",
    os: BOTH,
    license: "paid",
    site: "https://rtfxanimation.com/",
    setup: "panel",
    summary: "Рисованные 2D-эффекты: огонь, дым, взрывы, энергия.",
    about: "Библиотека нарисованных вручную FX-анимаций — огонь, дым, взрывы, жидкости, энергия — и панель, которая собирает из них свои эффекты прямо в After Effects.",
  },
  {
    kind: "extension",
    id: "jerry",
    name: "Jerry",
    vendor: "JryMedia",
    mark: "JR",
    category: "motion",
    summary: "Jerry Flow и Jerry SFX.",
    about: "Расширения JryMedia, любимые в авто- и спорт-эдитах: Jerry Flow для анимации и переходов и Jerry SFX с библиотекой звуков. Каждое скачивается отдельно.",
    items: [
      {
        kind: "extension",
        id: "jerry-flow",
        name: "Jerry Flow",
        vendor: "JryMedia",
        mark: "JF",
        category: "motion",
        os: BOTH,
        license: "paid",
        site: "https://jerryflow.com/",
        setup: "zxp",
        summary: "Кривые, шейки, переходы и спид-рампы в одной панели.",
        about: "Расширение для эдитов: мгновенные кривые скорости, шейки, переходы и спид-рампы, свои пресеты. Ускоряет то, что в эдите делается сотни раз.",
      },
      {
        kind: "extension",
        id: "jerry-sfx",
        name: "Jerry SFX",
        vendor: "JryMedia",
        mark: "JS",
        category: "sound",
        hosts: AE_PR,
        os: BOTH,
        license: "paid",
        site: "https://jry-media.store/",
        setup: "zxp",
        summary: "Больше 1250 звуков прямо в таймлайне.",
        about: "Библиотека из 1250+ собственных звуков — эмбиент, пролёты, дроны, удары — разложена по разделам и перетаскивается прямо в таймлайн After Effects или Premiere Pro.",
      },
    ],
  },
];

/* ── Installation steps ── */

const join = (names: string[]) => (names.length > 1 ? `${names.slice(0, -1).join(", ")} и ${names[names.length - 1]}` : names[0]);

/** The steps for an item: its own, or its setup's template. */
export function installSteps(item: ProgramEntry | AddonEntry): InstallStep[] {
  if (item.install) return item.install;
  if (item.kind === "program") {
    return [
      { text: "Выбери версию и систему и скачай установщик." },
      { text: "Версии разных лет ставятся рядом и друг другу не мешают: старую удалять не обязательно." },
      { text: "Запусти установщик, дождись конца установки и открой программу." },
    ];
  }
  const hosts = join((item.hosts ?? ["ae"]).map((h) => programName[h]));
  const effects = "Открой программу: эффекты появятся в панели Effects & Presets.";
  switch (item.setup ?? (item.kind === "plugin" ? "installer" : "zxp")) {
    case "module":
      return [
        { text: `Закрой ${hosts}.` },
        { text: "Запусти установщик модуля и отметь плагины, которые нужны: можно поставить всё сразу или только часть." },
        { text: effects },
      ];
    case "installer":
      return [
        { text: `Закрой ${hosts}.` },
        { text: `Запусти установщик ${item.name} и отметь программы, в которые его поставить.` },
        { text: item.kind === "plugin" ? effects : "Открой программу: панель — в меню Window → Extensions." },
      ];
    case "manual":
      return [
        { text: `Закрой ${hosts}.` },
        {
          text: "Скопируй файлы плагина в общую папку плагинов Adobe:",
          path: {
            win: "C:\\Program Files\\Adobe\\Common\\Plug-ins\\7.0\\MediaCore",
            mac: "/Library/Application Support/Adobe/Common/Plug-ins/7.0/MediaCore",
          },
        },
        { text: effects },
      ];
    case "zxp":
      return [
        { text: "Установи бесплатный ZXP Installer от aescripts." },
        { text: `Перетащи файл .zxp с ${item.name} в окно установщика.` },
        { text: `Перезапусти ${hosts} и открой Window → Extensions → ${item.name}.` },
      ];
    case "panel":
      return [
        { text: "В After Effects: File → Scripts → Install ScriptUI Panel… и выбери файл .jsx или .jsxbin." },
        {
          text: "Или скопируй его сам в папку панелей (вместо <версия> — год твоей версии):",
          path: {
            win: "C:\\Program Files\\Adobe\\Adobe After Effects <версия>\\Support Files\\Scripts\\ScriptUI Panels",
            mac: "/Applications/Adobe After Effects <версия>/Scripts/ScriptUI Panels",
          },
        },
        { text: "Включи Edit → Preferences → Scripting & Expressions → Allow Scripts to Write Files and Access Network (на macOS — After Effects → Settings)." },
        { text: `Перезапусти After Effects и открой ${item.name} в меню Window.` },
      ];
  }
}
