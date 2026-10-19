"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Lock, LockOpen, Play } from "lucide-react";
import { lessonHref } from "@/config/routes";
import { categoryOf } from "@/content/tutorial-categories";
import { LessonCover } from "@/features/learn/cover";
import { chaptersCount, minutes, ProgramTiles, SectionGlyph } from "@/features/learn/glyphs";
import { inProgress, shareOf } from "@/features/learn/progress";
import type { Audience, LessonCard as Lesson, Progress } from "@/features/learn/types";
import { formatClock } from "@/lib/format";
import { cn } from "@/lib/utils";

/** What the corner of a cover says about access: free with an account, or the plan that opens it. */
export function AccessChip({ lesson, audience, size = "sm" }: { lesson: Lesson; audience: Audience; size?: "sm" | "md" }) {
  if (audience === "full" || (lesson.open && audience === "free")) return null;
  const free = lesson.intro;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border font-mono tracking-[0.12em] uppercase backdrop-blur-md",
        size === "sm" ? "px-2 py-0.5 text-[9.5px]" : "px-2.5 py-1 text-[10.5px]",
        free ? "border-accent/35 bg-accent/12 text-accent-soft" : "border-white/12 bg-ink-950/55 text-fg/70",
      )}
      title={free ? "Открыт в бесплатном аккаунте" : "Открывается в IDX PRO"}
    >
      {free ? <LockOpen size={10} aria-hidden /> : <Lock size={10} aria-hidden />}
      {free ? "Бесплатно" : "PRO"}
    </span>
  );
}

/** The progress line along the bottom of a cover. */
export function ProgressLine({ share, className }: { share: number; className?: string }) {
  if (share <= 0) return null;
  return (
    <span aria-hidden className={cn("absolute inset-x-0 bottom-0 z-[2] block h-[3px] bg-white/12", className)}>
      <span className="block h-full rounded-r-full bg-gradient-to-r from-accent-strong/70 via-accent to-accent-soft" style={{ width: `${share * 100}%` }} />
    </span>
  );
}

/** «Осталось 5 мин» / «Просмотрено» / nothing. */
function status(lesson: Lesson, p: Progress | undefined): string | null {
  if (p?.watched) return "Просмотрено";
  if (inProgress(p)) {
    const left = Math.max(0, (p.duration || lesson.duration) - p.position);
    return left < 60 ? "Почти всё" : `Осталось ${minutes(left)}`;
  }
  return null;
}

/**
 * A lesson in the grid: its cover (the section's light and object, or its poster) with the length,
 * access and progress on it; the section, the title, a line about it, the programs it's made in.
 * Opens the lesson's page. `fresh`: a card that shows up after the first render comes in with a
 * short fade instead of the page entrance (read once, so typing in the search never replays it).
 */
export function LessonCard({
  lesson,
  progress,
  audience,
  index,
  fresh,
}: {
  lesson: Lesson;
  progress?: Progress;
  audience: Audience;
  index: number;
  fresh: boolean;
}) {
  const [entrance] = useState(() => (fresh ? "lesson-in" : "arrive"));
  const n = Math.min(index, 11);
  const share = lesson.open ? shareOf(progress, lesson.duration) : 0;
  const line = lesson.open ? status(lesson, progress) : null;
  const c = categoryOf(lesson.section);

  return (
    <Link
      href={lessonHref(lesson.slug)}
      className={cn("glass lesson-card group flex h-full flex-col rounded-[1.5rem] p-2", entrance)}
      style={{ "--i": 5 + n * 0.5, "--n": n } as React.CSSProperties}
    >
      <span className="relative block aspect-video overflow-hidden rounded-[1.1rem] border border-white/6">
        <LessonCover slug={lesson.slug} section={lesson.section} poster={lesson.poster} />

        <span className="absolute top-2.5 left-2.5 z-[2] flex gap-1.5">
          {lesson.isNew && !progress?.watched && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-ink-950/55 px-2 py-0.5 font-mono text-[9.5px] tracking-[0.12em] text-fg/85 uppercase backdrop-blur-md">
              <span aria-hidden className="size-[5px] rotate-45 rounded-[1px] bg-accent shadow-[0_0_6px_rgb(var(--rgb-accent)/0.8)]" />
              Новое
            </span>
          )}
          <AccessChip lesson={lesson} audience={audience} />
        </span>
        {lesson.open && progress?.watched && (
          <span
            title="Просмотрено"
            className="absolute top-2.5 right-2.5 z-[2] inline-flex size-6 items-center justify-center rounded-full border border-accent/40 bg-accent/20 text-accent-soft backdrop-blur-md"
          >
            <Check size={13} strokeWidth={2.5} aria-hidden />
          </span>
        )}

        <span className="lesson-play absolute inset-0 z-[2] flex items-center justify-center" aria-hidden>
          <span className="inline-flex size-12 items-center justify-center rounded-full border border-white/25 bg-ink-950/45 text-fg shadow-[0_10px_30px_-8px_rgb(0_0_0/0.8)] backdrop-blur-md">
            {lesson.open ? <Play size={18} className="translate-x-px" fill="currentColor" /> : <Lock size={17} />}
          </span>
        </span>

        <span className="absolute right-2.5 bottom-2.5 z-[2] rounded-md border border-white/10 bg-ink-950/65 px-1.5 py-0.5 font-mono text-[10.5px] text-fg/85 tabular-nums backdrop-blur-md">
          {formatClock(lesson.duration)}
        </span>
        <ProgressLine share={share} />
      </span>

      <span className="flex flex-1 flex-col px-2.5 pt-3.5 pb-2">
        <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.16em] text-dim uppercase">
          <span style={{ color: `rgb(${c.tint})` }}>
            <SectionGlyph section={lesson.section} size={12} />
          </span>
          {c.title}
          {lesson.chapterCount > 0 && <span className="tracking-[0.08em] normal-case"> · {chaptersCount(lesson.chapterCount)}</span>}
        </span>
        <span className={cn("mt-2 line-clamp-2 text-[15.5px] leading-snug font-semibold text-balance", lesson.open || audience === "guest" ? "text-fg" : "text-fg/75")}>
          {lesson.title}
        </span>
        <span className="mt-1.5 line-clamp-2 text-[13px] leading-relaxed text-muted">{lesson.summary}</span>
        <span className="mt-auto flex items-center gap-2 pt-3.5">
          <ProgramTiles programs={lesson.programs} />
          {line && <span className={cn("ml-auto truncate text-[12px] font-semibold", progress?.watched ? "text-accent-soft" : "text-fg/70")}>{line}</span>}
        </span>
      </span>
    </Link>
  );
}

/** «Продолжить просмотр»: a wide row — the cover, where it stopped, how much is left. */
export function ContinueCard({ lesson, progress, index }: { lesson: Lesson; progress: Progress; index: number }) {
  const share = shareOf(progress, lesson.duration);
  return (
    <Link
      href={lessonHref(lesson.slug)}
      className="glass lesson-card lesson-row arrive group flex items-center gap-3.5 rounded-[1.35rem] p-2 pr-4"
      style={{ "--i": 5 + index * 0.5 } as React.CSSProperties}
    >
      <span className="relative block aspect-video w-32 shrink-0 overflow-hidden rounded-[0.95rem] border border-white/6 sm:w-40">
        <LessonCover slug={lesson.slug} section={lesson.section} poster={lesson.poster} size="thumb" />
        <span className="absolute inset-0 z-[2] flex items-center justify-center" aria-hidden>
          <span className="inline-flex size-9 items-center justify-center rounded-full border border-white/25 bg-ink-950/45 text-fg backdrop-blur-md transition-transform duration-500 group-hover:scale-110">
            <Play size={14} className="translate-x-px" fill="currentColor" />
          </span>
        </span>
        <ProgressLine share={share} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.16em] text-dim uppercase">
          <SectionGlyph section={lesson.section} size={12} className="text-accent-soft" />
          {categoryOf(lesson.section).title}
        </span>
        <span className="mt-1 line-clamp-2 text-[14.5px] leading-snug font-semibold text-fg">{lesson.title}</span>
        <span className="mt-1 block text-[12px] text-muted">
          Остановился на <span className="font-mono text-fg/80 tabular-nums">{formatClock(progress.position)}</span>
          <span className="hidden sm:inline"> · осталось {minutes(Math.max(0, (progress.duration || lesson.duration) - progress.position))}</span>
        </span>
      </span>
    </Link>
  );
}
