import "server-only";

/** Server-only secrets. The `server-only` import makes the build fail if a client component imports this file. */
export const serverEnv = {
  aiApiKey: process.env.AI_API_KEY ?? "",
  aiBaseUrl: (process.env.AI_BASE_URL || "https://api.deepseek.com").replace(/\/$/, ""),
  aiModel: process.env.AI_MODEL || "deepseek-flash",
  aiExtraBody: process.env.AI_EXTRA_BODY ?? "",
  chatDailyLimit: Number(process.env.CHAT_DAILY_LIMIT ?? "20") || 20,
};

export const isAiConfigured = () => Boolean(serverEnv.aiApiKey);
