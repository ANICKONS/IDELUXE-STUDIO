import "server-only";
import { tutorialCategories, type TutorialSection } from "@/content/tutorial-categories";
import { tutorials } from "@/content/tutorials";
import { inProgress, shareOf } from "@/features/learn/progress";
import { progressFor, watchedDates } from "@/features/learn/progress.server";
import { canWatchTutorial } from "@/lib/access-rules";
import type { AccessInfo } from "@/types/session";

/** Days are counted in Moscow time (UTC+3, no daylight saving): the audience's evening is one day. */
const DAY = 86_400_000;
const MSK = 3 * 3_600_000;
const dayOf = (ms: number) => Math.floor((ms + MSK) / DAY);

export type LearnStats = {
  total: number;
  watched: number;
  sections: { slug: TutorialSection; title: string; total: number; watched: number }[];
  /** Days in a row (up to today or yesterday) with a lesson finished. */
  streak: number;
  /** The lesson to come back to: the last one started and not finished, open to this account. */
  resume: { slug: string; title: string; section: TutorialSection; position: number; share: number } | null;
};

/** What the profile («Достижения») and «Моя студия» show about the tutorials. */
export function learnStats(userId: string, access: AccessInfo): LearnStats {
  const progress = progressFor(userId);
  const sections = tutorialCategories
    .map((c) => {
      const list = tutorials.filter((t) => t.section === c.slug);
      return { slug: c.slug, title: c.title, total: list.length, watched: list.filter((t) => progress[t.slug]?.watched).length };
    })
    .filter((s) => s.total > 0);

  const days = new Set(watchedDates(userId).map(dayOf));
  let day = dayOf(Date.now());
  if (!days.has(day)) day -= 1;
  let streak = 0;
  while (days.has(day)) {
    streak += 1;
    day -= 1;
  }

  let resume: LearnStats["resume"] = null;
  for (const t of tutorials) {
    const p = progress[t.slug];
    if (!inProgress(p) || !canWatchTutorial(access, t)) continue;
    if (!resume || p.updatedAt > (progress[resume.slug]?.updatedAt ?? 0)) {
      resume = { slug: t.slug, title: t.title, section: t.section, position: p.position, share: shareOf(p, t.duration) };
    }
  }

  return {
    total: tutorials.length,
    watched: tutorials.filter((t) => progress[t.slug]?.watched).length,
    sections,
    streak,
    resume,
  };
}
