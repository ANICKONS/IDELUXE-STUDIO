/**
 * Number and time formatting. Done by hand (no Intl): server and client must produce the very
 * same string, otherwise hydration of counters (StatCounter) would mismatch.
 */

const NBSP = "\u00A0";

/** Groups of three separated by a non-breaking space: 6500 → "6 500", 999 → "999", -1200 → "-1 200". */
export function formatNumber(value: number): string {
  const n = Math.round(value);
  const digits = String(Math.abs(n));
  let out = "";
  for (let i = 0; i < digits.length; i++) {
    if (i && (digits.length - i) % 3 === 0) out += NBSP;
    out += digits[i];
  }
  return (n < 0 ? "-" : "") + out;
}

/** 3500 → "3 500 ₽". */
export function formatRub(value: number): string {
  return `${formatNumber(value)}${NBSP}₽`;
}

/** Seconds → "m:ss" (from an hour on "h:mm:ss"): 65 → "1:05", 3725 → "1:02:05". */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const pad = (n: number) => String(n).padStart(2, "0");
  const h = Math.floor(s / 3600);
  const m = Math.floor(s / 60) % 60;
  return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${m}:${pad(s % 60)}`;
}

/** Russian plural form (word only): pluralRu(5, ["туториал", "туториала", "туториалов"]) → "туториалов". */
export function pluralRu(n: number, forms: readonly [one: string, few: string, many: string]): string {
  const abs = Math.abs(Math.trunc(n));
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}
