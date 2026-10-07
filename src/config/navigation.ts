import { anchorHref, landingAnchors, routes } from "@/config/routes";
import { site } from "@/config/site";

export type NavItem = {
  label: string;
  href: string;
  /** Landing block id: the tab is highlighted while this block is on screen. */
  section?: string;
  /** Warm glow accent («Тарифы»). */
  highlight?: boolean;
};

export type NavLink = { label: string; href: string };

/**
 * Header menu. «Главная», «Обо мне», «Платформа», «FAQ» are landing anchors; «Ресурсы», «Тарифы» are pages.
 * «Главная» leads to the very top: the header is in its full state and the whole first screen
 * (headline, editor, numbers) is visible.
 */
export const mainNav: NavItem[] = [
  { label: "Главная", href: anchorHref(landingAnchors.top), section: landingAnchors.home },
  // IDELUXE is one person, so the block is «Обо мне»
  { label: "Обо мне", href: anchorHref(landingAnchors.about), section: landingAnchors.about },
  { label: "Платформа", href: anchorHref(landingAnchors.platform), section: landingAnchors.platform },
  { label: "FAQ", href: anchorHref(landingAnchors.faq), section: landingAnchors.faq },
  { label: "Ресурсы", href: routes.resources },
  { label: "Тарифы", href: routes.pricing, highlight: true },
];

/** Footer columns: landing blocks, then the pages. */
export const footerNav: { title: string; links: NavLink[] }[] = [
  { title: "Навигация", links: mainNav.filter((n) => n.section).map(({ label, href }) => ({ label, href })) },
  {
    title: "Платформа",
    links: [
      { label: "Туториалы", href: routes.learn },
      { label: "Ресурсы", href: routes.resources },
      { label: "Тарифы", href: routes.pricing },
    ],
  },
];

export const legalNav: NavLink[] = [
  { label: "Публичная оферта", href: routes.legal.offer },
  { label: "Политика конфиденциальности", href: routes.legal.privacy },
];

/** Telegram links in the header menu and the mobile sheet. */
export const telegramLinks = [
  { label: "Канал", hint: "Новости и анонсы", ...site.telegram.channel },
  { label: "Бот", hint: "Покупка и доступ", ...site.telegram.bot },
  { label: "Написать IDELUXE", hint: "Вопросы и занятия", ...site.telegram.personal },
];

/** Telegram contacts in the footer. */
export const footerContacts = [site.telegram.bot, site.telegram.channel, site.telegram.personal];
