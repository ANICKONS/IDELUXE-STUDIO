import "server-only";
import { programName } from "@/content/resource-taxonomy";
import { NEW_DAYS, tutorials, type TutorialEntry } from "@/content/tutorials";
import { catalogFor } from "@/features/resources/catalog.server";
import { itemTint } from "@/features/resources/glyphs";
import type { CatalogItem } from "@/features/resources/types";
import type { Audience, LessonCard, LessonPage, Material } from "@/features/learn/types";
import { can, canWatchTutorial } from "@/lib/access-rules";
import type { AccessInfo } from "@/types/session";

/*
 * The tutorials as this account may see them. Every lesson is listed (a locked one too: what it's
 * about, its chapters, what it uses), but the video and the files go out only with the lessons open
 * to it — the browser never gets a link it isn't entitled to. Fields are copied one by one (an
 * allowlist), so whatever is added to content/tutorials.ts later stays on the server until it's
 * added here.
 */

const DAY = 86_400_000;

export function learnAudience(access: AccessInfo | null): Audience {
  return !access ? "guest" : can(access, "tutorials") ? "full" : "free";
}

export function findTutorial(slug: string): TutorialEntry | undefined {
  return tutorials.find((t) => t.slug === slug);
}

function card(t: TutorialEntry, access: AccessInfo | null, now: number): LessonCard {
  const published = Date.parse(`${t.published}T00:00:00+03:00`);
  return {
    slug: t.slug,
    section: t.section,
    title: t.title,
    summary: t.summary,
    duration: t.duration,
    published,
    isNew: now - published < NEW_DAYS * DAY,
    intro: t.intro === true,
    open: canWatchTutorial(access, t),
    programs: t.programs,
    chapterCount: t.chapters?.length ?? 0,
    ...(t.poster ? { poster: t.poster } : {}),
    keywords: [...(t.chapters ?? []).map((c) => c.title), ...t.programs.map((p) => programName[p]), ...(t.resources ?? [])].join(" "),
  };
}

/** Every lesson, in the content's order. */
export function lessonCards(access: AccessInfo | null): LessonCard[] {
  const now = Date.now();
  return tutorials.map((t) => card(t, access, now));
}

function material(item: CatalogItem): Material {
  const note = item.kind === "program" ? item.role : (item.vendor ?? item.summary);
  return item.kind === "program"
    ? { id: item.id, name: item.name, note, open: item.open, code: item.code }
    : { id: item.id, name: item.name, note, open: item.open, mark: item.mark, tint: itemTint(item) };
}

/** A lesson's page and the other lessons of its section (for the list beside it), or null. */
export function lessonPage(slug: string, access: AccessInfo | null): { lesson: LessonPage; section: LessonCard[] } | null {
  const t = findTutorial(slug);
  if (!t) return null;
  const now = Date.now();
  const base = card(t, access, now);

  const catalog = catalogFor(access);
  const items = new Map<string, CatalogItem>([...catalog.programs, ...catalog.addons].map((i) => [i.id, i]));
  const materials = (t.resources ?? []).flatMap((id) => {
    const item = items.get(id);
    return item ? [material(item)] : [];
  });

  // A stand-in video (content/tutorials.ts → demo): whoever gets it gets the chapters squeezed into its length
  const squeeze = base.open && t.video?.demo && t.video.length ? t.video.length / t.duration : 1;

  const lesson: LessonPage = {
    ...base,
    about: t.about.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean),
    chapters: (t.chapters ?? []).map((c) => ({ at: Math.round(c.at * squeeze), title: c.title })),
    materials,
    files: base.open ? (t.files ?? []).map((f) => ({ label: f.label, href: f.href, ...(f.size ? { size: f.size } : {}) })) : [],
    ...(base.open && t.video
      ? {
          video: {
            renditions: t.video.renditions.map((r) => ({ label: r.label, src: r.src, minWidth: r.minWidth })),
            aspect: t.video.aspect ?? 16 / 9,
            demo: t.video.demo === true,
            ...(t.video.length ? { length: t.video.length } : {}),
          },
        }
      : {}),
  };

  return { lesson, section: tutorials.filter((x) => x.section === t.section).map((x) => card(x, access, now)) };
}
