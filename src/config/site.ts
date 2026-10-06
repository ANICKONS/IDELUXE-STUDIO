/** Brand and contacts. IDELUXE is the nickname of one person, not a school or a team. */
export const site = {
  name: "IDELUXE STUDIO",
  shortName: "IDELUXE",
  description:
    "Платформа монтажёра IDELUXE: туториалы с разбором эффектов (VFX, SFX, Motion) в After Effects, Premiere Pro и Vegas Pro, IDX PACK с футажами, пресетами и звуками и ИИ-ассистент по монтажу.",
  locale: "ru_RU",
  themeColor: "#04030d",
  telegram: {
    bot: { handle: "@de_1uxe_bot", url: "https://t.me/de_1uxe_bot" },
    channel: { handle: "@de_1uxeee", url: "https://t.me/de_1uxeee" },
    personal: { handle: "@de_1uxe", url: "https://t.me/de_1uxe" },
  },
} as const;

export type TelegramContact = { handle: string; url: string };
