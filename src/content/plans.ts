/**
 * Business model in one place: what can be bought, for how much, and what each option opens.
 * /pricing, the landing, the sign-in card and the AI assistant's prompt all read it, so a price or
 * a rule changes here and nowhere else.
 *
 *  - IDX PACK — the materials (content/pack.ts), a one-time purchase, kept for good, pack updates
 *    included. The site itself stays in the free mode for a pack owner.
 *  - IDX LITE — subscription: the «Ресурсы» section (programs, plugins, extensions), nothing else.
 *  - IDX PRO — subscription: the whole platform: tutorials, resources, the AI assistant, new lessons.
 *  - IDX FULL — PACK + 3 months of PRO in one payment; after that PRO is renewed separately.
 *  - Free account (sign-up required): a few intro tutorials, the programs, a few plugins and
 *    extensions, the profile. Without an account only the landing is open.
 * A subscription isn't renewed automatically: when it ends, the account drops to the free mode;
 * the profile and a bought pack stay.
 *
 * Once payments are connected, the amount to charge must come from the server, not from here.
 */

import { packStats } from "@/content/pack";
import { formatNumber, formatRub } from "@/lib/format";

export type PlanId = "pack" | "lite" | "pro" | "full";
export type Billing = "month" | "year";

type PlanBase = {
  id: PlanId;
  title: string;
  /** One line under the name. */
  tagline: string;
  /** Short list on the plan's card (the full picture is the comparison table). */
  bullets: string[];
  /** Ribbon over the card. */
  badge?: string;
  /** The button. */
  cta: string;
};

export type OneTimePlan = PlanBase & {
  kind: "once";
  priceRub: number;
  /** What the same things cost bought separately: an honest anchor, shown crossed out. */
  separateRub?: number;
  /** Under the price. */
  note: string;
};

export type SubscriptionPlan = PlanBase & {
  kind: "subscription";
  monthRub: number;
  yearRub: number;
  /** Intro price of the first month (new subscribers, monthly billing). */
  firstMonthRub?: number;
};

export type Plan = OneTimePlan | SubscriptionPlan;

const PACK_RUB = 15990;
const PRO_MONTH_RUB = 3500;
/** Months of PRO in IDX FULL. */
export const FULL_PRO_MONTHS = 3;

const [footage, presets, textures, sounds] = packStats.map((s) => `${formatNumber(s.value)}${s.suffix}`);

export const plans: Record<PlanId, Plan> = {
  pack: {
    id: "pack",
    kind: "once",
    title: "IDX PACK",
    tagline: "Материалы, собранные за годы работы",
    priceRub: PACK_RUB,
    note: "Разовый платёж · остаётся навсегда",
    bullets: [`${footage} футажей и ${presets} пресетов`, `${textures} текстур и ${sounds} звуков`, "Шаблоны и материалы для проектов", "Обновления пака бесплатно"],
    cta: "Купить PACK",
  },
  lite: {
    id: "lite",
    kind: "subscription",
    title: "IDX LITE",
    tagline: "Для тех, кому нужен софт",
    monthRub: 399,
    yearRub: 3190,
    bullets: ["Весь раздел «Ресурсы»", "Программы, плагины и расширения", "Инструкции по установке", "Новые ресурсы, пока подписка активна"],
    cta: "Оформить LITE",
  },
  pro: {
    id: "pro",
    kind: "subscription",
    title: "IDX PRO",
    tagline: "Вся платформа IDELUXE",
    monthRub: PRO_MONTH_RUB,
    yearRub: 27990,
    firstMonthRub: 1490,
    badge: "Вся платформа",
    bullets: ["Все туториалы и новые разборы", "Раздел «Ресурсы» целиком", "ИИ-ассистент по монтажу 24/7", "Обновления платформы"],
    cta: "Оформить PRO",
  },
  full: {
    id: "full",
    kind: "once",
    title: "IDX FULL",
    tagline: `PACK навсегда + PRO на ${FULL_PRO_MONTHS} месяца`,
    priceRub: 19900,
    separateRub: PACK_RUB + PRO_MONTH_RUB * FULL_PRO_MONTHS,
    note: `Разовый платёж · PRO через ${FULL_PRO_MONTHS} месяца продлевается отдельно`,
    badge: "Выгоднее всего",
    bullets: ["Весь IDX PACK навсегда", `IDX PRO на ${FULL_PRO_MONTHS} месяца`, "Туториалы, ресурсы и ИИ", "Обновления пака бесплатно"],
    cta: "Купить FULL",
  },
};

/** Card order on /pricing: the most complete option last, next to the planet. */
export const planOrder: PlanId[] = ["pack", "lite", "pro", "full"];

/** Yearly billing: months given for free and the discount, % (LITE and PRO: 4 months, −33 %). */
export const yearGift = (p: SubscriptionPlan) => Math.round(12 - p.yearRub / p.monthRub);
export const yearDiscount = (p: SubscriptionPlan) => Math.round((1 - p.yearRub / (p.monthRub * 12)) * 100);
/** Yearly price per month, rounded down to a rouble. */
export const yearPerMonth = (p: SubscriptionPlan) => Math.floor(p.yearRub / 12);
/** IDX FULL against buying the same separately, ₽. */
export const fullSaving = () => {
  const full = plans.full as OneTimePlan;
  return (full.separateRub ?? full.priceRub) - full.priceRub;
};

/** Without paying: a free account (sign-up required). */
export const freeTier = {
  title: "Бесплатный аккаунт",
  bullets: ["Вводные туториалы", "Программы", "Несколько плагинов и расширений", "Профиль и достижения"],
};

/**
 * For those who bought IDX PACK before (through the Telegram bot): half price on the pack and a
 * welcome promo code for LITE, entered in the profile. `enabled: false` hides it everywhere.
 */
export const returningOffer = {
  enabled: true,
  packDiscount: 50,
  liteMonths: 3,
};

/* ── Comparison table (/pricing) ── */

export type Column = "free" | PlanId;
/** true — included, false — not, text — partly (e.g. «Вводные»). */
export type Access = boolean | string;

export const compareColumns: { id: Column; title: string; hint: string }[] = [
  { id: "free", title: "Аккаунт", hint: "бесплатно" },
  { id: "pack", title: "PACK", hint: formatRub(PACK_RUB) },
  { id: "lite", title: "LITE", hint: `${formatRub(399)}/мес` },
  { id: "pro", title: "PRO", hint: `${formatRub(PRO_MONTH_RUB)}/мес` },
  { id: "full", title: "FULL", hint: formatRub(19900) },
];

const row = (label: string, free: Access, pack: Access, lite: Access, pro: Access, full: Access) => ({
  label,
  values: { free, pack, lite, pro, full } as Record<Column, Access>,
});

export const compareGroups = [
  {
    title: "Материалы IDX PACK",
    rows: [
      row(`Футажи · ${footage}`, false, true, false, false, true),
      row(`Пресеты и эффекты · ${presets}`, false, true, false, false, true),
      row(`Текстуры · ${textures}`, false, true, false, false, true),
      row(`Звуковые эффекты · ${sounds}`, false, true, false, false, true),
      row("Шаблоны и материалы", false, true, false, false, true),
      row("Обновления пака", false, true, false, false, true),
    ],
  },
  {
    title: "Платформа",
    rows: [
      row("Туториалы", "Вводные", "Вводные", "Вводные", true, true),
      row("Новые туториалы", false, false, false, true, true),
      row("Программы", true, true, true, true, true),
      row("Плагины и расширения", "Несколько", "Несколько", true, true, true),
      row("Новые ресурсы", false, false, true, true, true),
      row("ИИ-ассистент по монтажу", false, false, false, true, true),
    ],
  },
  {
    title: "Аккаунт",
    rows: [
      row("Профиль и достижения", true, true, true, true, true),
      row("Срок", "Бессрочно", "Навсегда", "Пока активна", "Пока активна", `Пак навсегда, PRO ${FULL_PRO_MONTHS} мес.`),
    ],
  },
];

/* ── Questions about buying (/pricing; a few also on the landing) ── */

const pro = plans.pro as SubscriptionPlan;

export const pricingFaq: { q: string; a: string }[] = [
  {
    q: "Чем PACK отличается от подписки?",
    a: "PACK — это материалы: футажи, пресеты и эффекты, текстуры, звуки и шаблоны. Покупаешь один раз, и они твои навсегда, вместе с обновлениями пака. Подписка открывает сам сайт: LITE — раздел «Ресурсы» с программами, плагинами и расширениями, PRO — всю платформу: туториалы, ресурсы и ИИ-ассистента.",
  },
  {
    q: "Что открыто бесплатно?",
    a: `После регистрации: ${freeTier.bullets.map((b) => b.toLowerCase()).join(", ")}. Без аккаунта открыт только лендинг.`,
  },
  {
    q: "Что будет, когда подписка закончится?",
    a: "Подписка действует оплаченный срок и сама не продлевается. Когда он закончится, аккаунт перейдёт в бесплатный режим: туториалы, ресурсы и ИИ закроются, а профиль, достижения и купленный PACK останутся. Продлить можно в любой момент.",
  },
  {
    q: "Как работает IDX FULL?",
    a: `Это PACK навсегда и ${FULL_PRO_MONTHS} месяца PRO одним платежом — на ${formatRub(fullSaving())} дешевле, чем по отдельности. Через ${FULL_PRO_MONTHS} месяца PRO нужно продлить, если хочешь и дальше смотреть туториалы и пользоваться ресурсами и ИИ. Пак остаётся с тобой в любом случае.`,
  },
  {
    q: "Получу ли я обновления пака?",
    a: "Да. Все обновления IDX PACK приходят владельцам пака бесплатно — и с подпиской, и без.",
  },
  {
    q: "Есть ли скидки?",
    a: `Годовая подписка стоит как ${12 - yearGift(pro)} месяцев: ${yearGift(pro)} месяца в подарок. Первый месяц PRO — ${formatRub(pro.firstMonthRub ?? pro.monthRub)}. IDX FULL экономит ${formatRub(fullSaving())}.${returningOffer.enabled ? ` Если ты уже покупал IDX PACK, для тебя −${returningOffer.packDiscount}% на пак и ${returningOffer.liteMonths} месяца LITE по приветственному промокоду в профиле.` : ""}`,
  },
  {
    q: "Как оплатить?",
    a: "Сейчас PACK и подписки оформляются через Telegram-бота: он примет оплату и откроет доступ. Оплата прямо на сайте появится вместе с личным кабинетом.",
  },
];

/** Plain-text summary of the plans for the AI assistant's prompt. */
export function describePlans(): string {
  const lines = planOrder.map((id) => {
    const p = plans[id];
    const price =
      p.kind === "once"
        ? `${formatRub(p.priceRub)} разово${p.separateRub ? ` (по отдельности ${formatRub(p.separateRub)})` : ""}`
        : `${formatRub(p.monthRub)} в месяц или ${formatRub(p.yearRub)} в год${p.firstMonthRub ? `, первый месяц ${formatRub(p.firstMonthRub)}` : ""}`;
    return `- ${p.title}. ${p.tagline}. Входит: ${p.bullets.join("; ")}. Цена: ${price}.`;
  });
  return [
    ...lines,
    `- ${freeTier.title} (нужна регистрация). Входит: ${freeTier.bullets.join("; ")}. Без аккаунта открыт только лендинг.`,
    "- Подписка сама не продлевается. Когда она заканчивается, аккаунт переходит в бесплатный режим, профиль и купленный пак остаются.",
    returningOffer.enabled
      ? `- Тем, кто уже покупал IDX PACK: −${returningOffer.packDiscount}% на пак и ${returningOffer.liteMonths} месяца LITE по приветственному промокоду в профиле.`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}
