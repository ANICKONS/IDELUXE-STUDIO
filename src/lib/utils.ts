export type ClassValue = string | number | boolean | null | undefined;

/**
 * Joins class names with spaces, skipping false / true / null / undefined / "" / 0.
 * No tailwind-merge: put the overriding `className` last and avoid conflicting utilities.
 */
export function cn(...inputs: ClassValue[]): string {
  let out = "";
  for (const v of inputs) {
    if (!v || v === true) continue;
    out += (out ? " " : "") + v;
  }
  return out;
}
