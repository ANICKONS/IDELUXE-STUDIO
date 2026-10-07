import type { AccessInfo } from "@/types/session";

/**
 * What each part of the platform needs (content/plans.ts → compareGroups describes the same rules
 * for people). Pure and shared: the server enforces it (API routes, pages), the browser only uses
 * it to show locks.
 *  - tutorials — all tutorials: PRO;
 *  - resources — the whole «Ресурсы» section: LITE or PRO;
 *  - ai — the assistant: PRO;
 *  - pack — IDX PACK files: PACK (or FULL).
 * Without these, a signed-in account still gets the free part (intro tutorials, the programs,
 * a few plugins and extensions) — the pages decide what's free.
 */
export type Feature = "tutorials" | "resources" | "ai" | "pack";

export function can(access: AccessInfo | null | undefined, feature: Feature): boolean {
  if (!access) return false;
  if (access.admin) return true;
  switch (feature) {
    case "tutorials":
    case "ai":
      return access.tier === "pro";
    case "resources":
      return access.tier === "pro" || access.tier === "lite";
    case "pack":
      return access.pack;
  }
}
