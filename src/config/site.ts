/** Brand and contacts. IDELUXE is the nickname of one person, not a school or a team. */
export const site = {
  name: "IDELUXE STUDIO",
  shortName: "IDELUXE",
  description:
    "Платформа монтажёра IDELUXE: туториалы с разбором эффектов (VFX, SFX, Motion) в After Effects, Premiere Pro и Vegas Pro, IDX PACK с футажами, пресетами и звуками и ИИ-ассистент по монтажу.",
  locale: "ru_RU",
  themeColor: "#060709",
  telegram: {
    bot: { handle: "@de_1uxe_bot", url: "https://t.me/de_1uxe_bot" },
    channel: { handle: "@de_1uxeee", url: "https://t.me/de_1uxeee" },
    personal: { handle: "@de_1uxe", url: "https://t.me/de_1uxe" },
    /** «Клипы» in «Ресурсы»: the channel the clips are collected in. ВРЕМЕННО основной канал — замени на канал с клипами. */
    clips: { handle: "@de_1uxeee", url: "https://t.me/de_1uxeee" },
  },
  /** The Discord server: the header (beside Telegram), the mobile menu, the footer. ЗАМЕНИ url на приглашение сервера (https://discord.gg/…). */
  discord: { label: "Discord", hint: "Сервер IDELUXE", url: "https://discord.com/" },
} as const;

export type TelegramContact = { handle: string; url: string };
