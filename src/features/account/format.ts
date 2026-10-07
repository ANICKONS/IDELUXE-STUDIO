import { pluralRu } from "@/lib/format";
import type { AccessInfo } from "@/types/session";

/** Dates of the account pages, rendered on the server only (no hydration to match): "7 января 2027". */
const dateFormat = new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Moscow" });

export const formatDate = (ms: number) => dateFormat.format(ms).replace(/\s*г\.$/, "");

const DAY = 24 * 60 * 60 * 1000;

/** "до 7 января 2027 · ещё 45 дней" */
export function untilText(ms: number): string {
  const days = Math.max(1, Math.ceil((ms - Date.now()) / DAY));
  return `до ${formatDate(ms)} · ещё ${days} ${pluralRu(days, ["день", "дня", "дней"])}`;
}

/** The account's plan in one line, for headings and the profile. */
export function planName(access: AccessInfo): string {
  if (access.admin) return "Полный доступ";
  if (access.tier === "pro") return "IDX PRO";
  if (access.tier === "lite") return "IDX LITE";
  return "Бесплатный аккаунт";
}

export const months = (n: number) => `${n} ${pluralRu(n, ["месяц", "месяца", "месяцев"])}`;
