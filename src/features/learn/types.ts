import type { AppCode } from "@/components/ui/app-tile";
import type { ProgramId } from "@/content/resource-taxonomy";
import type { TutorialSection } from "@/content/tutorial-categories";

/*
 * What the tutorials hand to the browser (built on the server by catalog.server.ts): every lesson's
 * public facts, and only for the lessons open to this account — the video and the files.
 */

/** Who is looking: no account / free mode (intro lessons) / everything open (PRO, admin). */
export type Audience = "guest" | "free" | "full";

export type Chapter = { at: number; title: string };

/** A lesson as the catalog and the lists show it. */
export type LessonCard = {
  slug: string;
  section: TutorialSection;
  title: string;
  summary: string;
  /** Seconds. */
  duration: number;
  /** ms since epoch. */
  published: number;
  isNew: boolean;
  /** Open with a free account. */
  intro: boolean;
  /** This account may watch it. */
  open: boolean;
  programs: ProgramId[];
  chapterCount: number;
  poster?: string;
  /** What the search also looks through: the chapters, what it uses. */
  keywords: string;
};

/** «Что понадобится»: an item of «Ресурсы» the lesson uses. */
export type Material = {
  id: string;
  name: string;
  /** The line under the name: the developer, or what a program is for. */
  note: string;
  /** This account may download it in «Ресурсы». */
  open: boolean;
} & ({ code: AppCode; mark?: never; tint?: never } | { code?: never; mark: string; tint: string });

export type LessonVideo = {
  renditions: { label: string; src: string; minWidth: number }[];
  aspect: number;
  /** A stand-in (the lesson isn't uploaded yet). */
  demo: boolean;
  /** The video's own length when it isn't the lesson's (a stand-in), s. */
  length?: number;
};

export type LessonFile = { label: string; href: string; size?: string };

/** A lesson's page. `video` and `files` only when it's open to this account. */
export type LessonPage = LessonCard & {
  about: string[];
  chapters: Chapter[];
  materials: Material[];
  files: LessonFile[];
  video?: LessonVideo;
};

/** Where an account stopped in a lesson. */
export type Progress = {
  /** Seconds. */
  position: number;
  /** The video's own length, seconds (0 until it was played). */
  duration: number;
  watched: boolean;
  /** ms since epoch. */
  updatedAt: number;
};

/** By lesson slug. */
export type ProgressMap = Record<string, Progress>;
