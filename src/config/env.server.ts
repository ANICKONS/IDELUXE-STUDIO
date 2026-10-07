import "server-only";

const int = (value: string | undefined, fallback: number) => {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
};

/** Server-only secrets. The `server-only` import makes the build fail if a client component imports this file. */
export const serverEnv = {
  aiApiKey: process.env.AI_API_KEY ?? "",
  aiBaseUrl: (process.env.AI_BASE_URL || "https://api.deepseek.com").replace(/\/$/, ""),
  aiModel: process.env.AI_MODEL || "deepseek-flash",
  aiExtraBody: process.env.AI_EXTRA_BODY ?? "",
  /** Messages per day from one IP (several accounts behind one address; the per-account limit is below). */
  chatDailyLimit: int(process.env.CHAT_DAILY_LIMIT, 300) || 300,
  /** Messages per day for the whole site: a ceiling on the API bill whatever the IPs. */
  chatGlobalDailyLimit: int(process.env.CHAT_GLOBAL_DAILY_LIMIT, 1500) || 1500,
  /** Reverse proxies in front of the app that append to X-Forwarded-For (lib/server/client-ip.ts). */
  trustedProxyHops: int(process.env.TRUSTED_PROXY_HOPS, 1),
  /** Assistant messages per day for one account (on top of the IP and site-wide limits). */
  chatUserDailyLimit: int(process.env.CHAT_USER_DAILY_LIMIT, 100) || 100,

  /* ── Accounts (lib/server/auth.ts) ── */
  /** Signs sessions and cookies. Required in production: `openssl rand -base64 32`. */
  authSecret: process.env.BETTER_AUTH_SECRET ?? "",
  /** SQLite file with accounts and access, relative to the project root. Keep it out of git and back it up. */
  databasePath: process.env.DATABASE_PATH || "data/ideluxe.sqlite",
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  /** Telegram login: Client ID and Secret from @BotFather → Login Widget (OpenID Connect). */
  telegramClientId: process.env.TELEGRAM_CLIENT_ID ?? "",
  telegramClientSecret: process.env.TELEGRAM_CLIENT_SECRET ?? "",

  /* ── Mail (lib/server/mail.ts): address confirmation and password reset ── */
  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: int(process.env.SMTP_PORT, 465) || 465,
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPassword: process.env.SMTP_PASSWORD ?? "",
  /** Sender, e.g. `IDELUXE STUDIO <no-reply@ideluxe.ru>`. Falls back to SMTP_USER. */
  mailFrom: process.env.MAIL_FROM || process.env.SMTP_USER || "",
  /** Where replies go (support), if different from the sender. */
  mailReplyTo: process.env.MAIL_REPLY_TO ?? "",
  /** Accounts with full access (the owner, testers), comma-separated emails. */
  adminEmails: (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
  /** Bearer token for /api/internal/* (the Telegram bot grants access with it). Empty → those endpoints are off. */
  internalApiSecret: process.env.INTERNAL_API_SECRET ?? "",
};

export const isAiConfigured = () => Boolean(serverEnv.aiApiKey);
export const isGoogleConfigured = () => Boolean(serverEnv.googleClientId && serverEnv.googleClientSecret);
export const isTelegramConfigured = () => Boolean(serverEnv.telegramClientId && serverEnv.telegramClientSecret);
/** Without mail there is no address confirmation and no password reset (lib/server/auth.ts). */
export const isMailConfigured = () => Boolean(serverEnv.smtpHost && serverEnv.smtpUser && serverEnv.smtpPassword && serverEnv.mailFrom);
