/**
 * Landing copy: lists and repeated items. Texts are written by one author (IDELUXE) and address
 * the reader as «ты» — keep that when editing. The AI assistant reads the same facts.
 */

import { pricingFaq } from "@/content/plans";

/** Questions about buying that the landing's FAQ shows too (the rest are on /pricing). */
const landingPricingQuestions = new Set(["Чем PACK отличается от подписки?", "Что открыто бесплатно?", "Как оплатить?"]);

export const faq: { q: string; a: string }[] = [
  {
    q: "Это онлайн-школа?",
    a: "Нет. IDELUXE — никнейм одного монтажёра и моушн-дизайнера, а сайт — его платформа: туториалы с разбором эффектов, ресурсы и IDX PACK с материалами для работы. Здесь нет программы обучения, групп и домашних заданий — смотришь то, что нужно тебе сейчас.",
  },
  {
    q: "Как устроены туториалы?",
    a: "Каждый туториал — разбор конкретного эффекта или приёма. Они разложены по разделам: VFX, SFX, Motion, переходы, цвет и другие. Смотреть можно в любом порядке, новые разборы выходят по мере готовности.",
  },
  {
    q: "Нужен ли опыт в монтаже?",
    a: "Базовое знакомство с программой пригодится, но разборы идут шаг за шагом, поэтому повторить эффект сможет и новичок. Если что-то непонятно в интерфейсе, спроси ИИ-ассистента на сайте.",
  },
  {
    q: "Какой компьютер нужен?",
    a: "Для комфортной работы в Premiere Pro и After Effects желательно от 16 ГБ оперативной памяти, современный процессор, дискретная видеокарта и SSD. На более слабом железе тоже можно работать: выручат прокси и облегчённое превью, а ассистент подскажет настройки.",
  },
  // About buying: the same answers as on /pricing (content/plans.ts)
  ...pricingFaq.filter((f) => landingPricingQuestions.has(f.q)),
  {
    q: "Работает ли всё на macOS?",
    a: "After Effects, Premiere Pro и Media Encoder работают на Windows и macOS. Vegas Pro доступен только на Windows.",
  },
  {
    q: "Можно ли задать вопрос по туториалу?",
    a: "Да. ИИ-ассистент на сайте отвечает на вопросы по монтажу круглосуточно, а со сложным случаем можно написать IDELUXE в Telegram.",
  },
  {
    q: "Когда выйдет IDX PACK 3D?",
    a: "Пак с 3D-графикой и моушном сейчас в работе. Следи за новостями в Telegram-канале IDELUXE — старт объявят там первым.",
  },
  {
    q: "Можно ли вернуть деньги?",
    a: "Условия возврата описаны в публичной оферте. Если что-то пошло не так — напиши в Telegram, разберёмся.",
  },
];

/** «Для кого подойдёт». `icon` is mapped to a lucide icon in audience-section.tsx. */
export const audience = [
  {
    icon: "sprout",
    title: "Новичкам",
    text: "Хочешь сделать первый эффектный ролик? Разборы идут шаг за шагом: повторяешь за IDELUXE — и эффект готов.",
  },
  {
    icon: "phone",
    title: "Блогерам и авторам",
    text: "Монтируешь ролики, Reels и шортсы сам? Находишь нужный приём в разделе и сразу используешь, без часовых лекций.",
  },
  {
    icon: "wand",
    title: "Монтажёрам с опытом",
    text: "База уже есть, нужны свежие эффекты, моушн и звук — и готовые материалы из пака вместо поисков по всему интернету.",
  },
] as const;

/** «Мой подход» in «Обо мне». `icon` is mapped in about-section.tsx. */
export const approachPillars = [
  {
    icon: "briefcase",
    title: "Реальные кейсы",
    text: "Разбираю эффекты из проектов, которые вышли в свет: клипы, реклама, контент для артистов.",
  },
  {
    icon: "wrench",
    title: "Рабочие инструменты",
    text: "Те же футажи, пресеты, текстуры и плагины, которыми пользуюсь сам в коммерческих заказах.",
  },
  {
    icon: "headphones",
    title: "На связи",
    text: "Не получается повторить эффект или падает рендер — пиши в Telegram, подскажу.",
  },
] as const;

/** Programs used in the tutorials: tiles in the «Программы, плагины, расширения» card + the AI prompt. */
export const software = [
  { code: "Ae", name: "After Effects", role: "Моушн и эффекты", text: "Моушн-дизайн, анимация текста, эффекты, трекинг и композитинг." },
  { code: "Pr", name: "Premiere Pro", role: "Монтаж и цвет", text: "Монтаж, ритм и склейки, цветокоррекция, работа со звуком." },
  { code: "Vg", name: "Vegas Pro", role: "Быстрые эдиты", text: "Быстрый монтаж эдитов, переходы, работа с плагинами." },
  { code: "Me", name: "Media Encoder", role: "Экспорт и рендер", text: "Экспорт под YouTube, Reels и TikTok, кодеки и пресеты рендера." },
] as const;

/** «Опыт работы с» marquee. */
export const clients = [
  "Calvin Klein",
  "GL4 Spaz",
  "Echstacy",
  "Бустер",
  "Парадеевич",
  "KIRILL SARYCHEV",
  "Глебас",
  "Суета",
  "Tatwole",
  "Адель Вейгель",
  "sorryKITANA",
  "НАВЕРНОЕ ПОЭТ",
];
