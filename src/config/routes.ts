/**
 * Every internal URL of the site in one place. Components never hardcode paths: when a page
 * moves or a new one appears, change it here (and add the page in src/app).
 */
export const routes = {
  home: "/",
  pricing: "/pricing",
  learn: "/learn",
  resources: "/resources",
  login: "/login",
  profile: "/profile",
  legal: {
    offer: "/legal/offer",
    privacy: "/legal/privacy",
  },
} as const;

/** Landing anchors. Ids are set on the sections in src/features/landing. */
export const landingAnchors = {
  /** Very top of the page (logo link). */
  top: "top",
  /** «Главная»: the editor window in the hero, not the headline (see hero-section.tsx). */
  home: "home",
  about: "about",
  audience: "audience",
  platform: "platform",
  faq: "faq",
} as const;

export type LandingAnchor = (typeof landingAnchors)[keyof typeof landingAnchors];

/** "/#about" — link to a landing block from any page. */
export const anchorHref = (id: LandingAnchor) => `${routes.home}#${id}`;

/** Tutorial section on /learn, e.g. "/learn#sec-vfx". */
export const learnSectionHref = (slug: string) => `${routes.learn}#sec-${slug}`;
