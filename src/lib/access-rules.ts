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

/**
 * One item of «Ресурсы» (content/resources.ts): with LITE / PRO (or admin) — everything; with a free
 * account — the programs and the items marked `free`; without an account — nothing.
 */
export function canOpenResource(access: AccessInfo | null | undefined, item: { kind: string; free?: boolean }): boolean {
  if (!access) return false;
  return can(access, "resources") || item.kind === "program" || item.free === true;
}

/**
 * One tutorial (content/tutorials.ts): with PRO (or admin) — every one; with a free account (LITE
 * too) — the intro ones (`intro`); without an account — none.
 */
export function canWatchTutorial(access: AccessInfo | null | undefined, lesson: { intro?: boolean }): boolean {
  if (!access) return false;
  return can(access, "tutorials") || lesson.intro === true;
}

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
