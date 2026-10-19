/**
 * «Туториалы»: the catalog (app/learn/page.tsx) and a lesson's page with the player
 * (app/learn/[slug]/page.tsx). The server-only parts (what this account gets, progress in the
 * database, the profile's stats) are imported directly from the *.server.ts files, not through
 * this barrel.
 */
export { LearnCatalog } from "@/features/learn/catalog";
export { LessonView } from "@/features/learn/lesson-view";
export type { Audience, LessonCard, LessonPage, Progress, ProgressMap } from "@/features/learn/types";
