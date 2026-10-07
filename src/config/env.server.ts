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
  /** Messages per day from one IP. */
  chatDailyLimit: int(process.env.CHAT_DAILY_LIMIT, 20) || 20,
  /** Messages per day for the whole site: a ceiling on the API bill whatever the IPs. */
  chatGlobalDailyLimit: int(process.env.CHAT_GLOBAL_DAILY_LIMIT, 1500) || 1500,
  /** Reverse proxies in front of the app that append to X-Forwarded-For (lib/server/client-ip.ts). */
  trustedProxyHops: int(process.env.TRUSTED_PROXY_HOPS, 1),
};

export const isAiConfigured = () => Boolean(serverEnv.aiApiKey);
