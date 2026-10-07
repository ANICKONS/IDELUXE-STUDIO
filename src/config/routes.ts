/**
 * Every internal URL of the site in one place. Components never hardcode paths: when a page
 * moves or a new one appears, change it here (and add the page in src/app).
 */
export const routes = {
  /** The landing for guests; for a signed-in account the same URL shows its home (proxy.ts → `dashboard`). */
  home: "/",
  /** The signed-in home, served at "/" (link to `home`, not here). */
  dashboard: "/home",
  pricing: "/pricing",
  learn: "/learn",
  resources: "/resources",
  login: "/login",
  profile: "/profile",
  /** Where the letter's link lands: reports the result of confirming the address. */
  verifyEmail: "/verify-email",
  /** The new-password form, opened from the reset letter with ?token=… */
  resetPassword: "/reset-password",
  legal: {
    offer: "/legal/offer",
    privacy: "/legal/privacy",
  },
} as const;

/** Landing anchors. Ids are set on the sections in src/features/landing. */
export const landingAnchors = {
  /** Very top of the page: the hero (logo and «Главная» links). */
  top: "top",
  /** «Главная» as a menu section (highlighted above «Обо мне»); not a DOM id, the link goes to `top`. */
  home: "home",
  about: "about",
  audience: "audience",
  platform: "platform",
  faq: "faq",
} as const;

export type LandingAnchor = (typeof landingAnchors)[keyof typeof landingAnchors];

/** The sign-in card opened on sign-up (features/auth reads the hash). */
export const registerHref = `${routes.login}#register`;

/** "/#about" — link to a landing block from any page. */
export const anchorHref = (id: LandingAnchor) => `${routes.home}#${id}`;

/** Tutorial section on /learn, e.g. "/learn#sec-vfx". */
export const learnSectionHref = (slug: string) => `${routes.learn}#sec-${slug}`;
