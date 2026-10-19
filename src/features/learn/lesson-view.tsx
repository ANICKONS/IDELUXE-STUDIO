"use client";

import "@/features/learn/learn.css";
import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowRight, ArrowUpRight, Check, ChevronRight, Clock3, FileDown, Hourglass, ListVideo, Lock, LockOpen, Sparkles, UserRoundPlus } from "lucide-react";
import { AppTile } from "@/components/ui/app-tile";
import { learnSectionHref, lessonHref, loginHref, registerHrefTo, resourceHref, routes } from "@/config/routes";
import { categoryOf } from "@/content/tutorial-categories";
import { OpenChatButton } from "@/features/chat";
import { LessonCover } from "@/features/learn/cover";
import { chaptersCount, lessonsCount, minutes, ProgramTiles, SectionGlyph } from "@/features/learn/glyphs";
import { AccessChip, ProgressLine } from "@/features/learn/lesson-card";
import { chapterAt, LessonPlayer, type PlayerHandle } from "@/features/learn/player";
import { inProgress, shareOf } from "@/features/learn/progress";
import { reportProgress, useProgress } from "@/features/learn/progress-store";
import type { Audience, LessonCard, LessonPage, ProgressMap } from "@/features/learn/types";
import { formatClock } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * A lesson's page: the player (or what opens it), the title and what to do with it, the chapters
 * beside the player (follow the video, a click jumps), «О разборе», «Что понадобится» (links into
 * «Ресурсы») and the files, and the section's other lessons. Progress is saved as it plays.
 */
export function LessonView({
  lesson,
  section,
  progress: serverProgress,
  audience,
}: {
  lesson: LessonPage;
  section: LessonCard[];
  progress: ProgressMap;
  audience: Audience;
}) {
  const progress = useProgress(serverProgress);
  const mine = progress[lesson.slug];
  const playerRef = useRef<PlayerHandle>(null);
  // Where it stopped, as it was when the page opened (the offer on the cover doesn't move while it plays)
  const [resumeAt] = useState(() => (lesson.open && inProgress(serverProgress[lesson.slug]) ? Math.floor(serverProgress[lesson.slug].position) : null));
  const [time, setTime] = useState<number | null>(null);
  const c = categoryOf(lesson.section);
  const signedIn = audience !== "guest";

  const index = section.findIndex((l) => l.slug === lesson.slug);
  const next = index >= 0 ? section[index + 1] : undefined;
  const current = time === null ? -1 : chapterAt(lesson.chapters, time);
  const playable = lesson.open && Boolean(lesson.video);

  const seek = (t: number) => {
    playerRef.current?.seek(t);
    setTime(t);
  };

  return (
    <div className="lesson-grid mt-6">
      {/* The player, or what opens it */}
      <div className="lesson-area-stage arrive min-w-0 [--i:2]">
        {playable && lesson.video ? (
          <LessonPlayer
            ref={playerRef}
            title={lesson.title}
            video={lesson.video}
            chapters={lesson.chapters}
            cover={<LessonCover slug={lesson.slug} section={lesson.section} poster={lesson.poster} size="stage" />}
            fallbackDuration={lesson.video.length ?? lesson.duration}
            resumeAt={resumeAt}
            next={next ? { href: lessonHref(next.slug), title: next.title, open: next.open } : null}
            onReport={(r) => reportProgress(lesson.slug, mine, r)}
            onTime={setTime}
          />
        ) : (
          <Stage lesson={lesson} audience={audience} />
        )}
      </div>

      {/* Title, facts, what to do */}
      <header className="lesson-area-head arrive min-w-0 px-1 [--i:3]">
        <div className="flex flex-wrap items-center gap-1.5">
          <Link
            href={learnSectionHref(lesson.section)}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] py-1 pr-3 pl-2 font-mono text-[10.5px] tracking-[0.16em] text-fg/75 uppercase transition hover:border-white/20 hover:text-fg"
          >
            <span style={{ color: `rgb(${c.tint})` }}>
              <SectionGlyph section={lesson.section} size={13} />
            </span>
            {c.title}
          </Link>
          {lesson.intro && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[11.5px] text-accent-soft">
              <LockOpen size={12} aria-hidden /> Вводный · бесплатно с аккаунтом
            </span>
          )}
          {!lesson.intro && audience !== "full" && <AccessChip lesson={lesson} audience={audience} size="md" />}
          {lesson.isNew && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11.5px] text-fg/80">
              <span aria-hidden className="size-[5px] rotate-45 rounded-[1px] bg-accent shadow-[0_0_6px_rgb(var(--rgb-accent)/0.8)]" /> Новое
            </span>
          )}
        </div>
        <h1 className="mt-4 font-display text-[1.7rem] leading-[1.12] font-semibold tracking-tight text-balance sm:text-[2.2rem]">{lesson.title}</h1>
        <p className="mt-2.5 max-w-3xl text-[15px] leading-relaxed text-muted">{lesson.summary}</p>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-[13px] text-fg/75">
          <span className="inline-flex items-center gap-1.5">
            <Clock3 size={15} aria-hidden className="text-dim" /> {minutes(lesson.duration)}
          </span>
          {lesson.chapterCount > 0 && (
            <span className="inline-flex items-center gap-1.5">
              <ListVideo size={15} aria-hidden className="text-dim" /> {chaptersCount(lesson.chapterCount)}
            </span>
          )}
          <span className="inline-flex items-center gap-2">
            <ProgramTiles programs={lesson.programs} size={22} />
          </span>
        </div>

        <div className="mt-6 flex flex-wrap gap-2.5">
          {signedIn && lesson.open && (
            <button
              type="button"
              onClick={() => reportProgress(lesson.slug, mine, { watched: !mine?.watched })}
              aria-pressed={Boolean(mine?.watched)}
              className={cn("btn btn-sm", mine?.watched ? "btn-glass border-accent/40 text-accent-soft" : "btn-glass")}
            >
              <Check size={15} strokeWidth={mine?.watched ? 2.75 : 2} /> {mine?.watched ? "Просмотрено" : "Отметить просмотренным"}
            </button>
          )}
          <OpenChatButton prompt={`Вопрос по разбору «${lesson.title}»: `} className="btn btn-glass btn-sm">
            <Sparkles size={15} /> <span className="sm:hidden">Спросить ИИ</span>
            <span className="hidden sm:inline">Спросить ассистента</span>
          </OpenChatButton>
        </div>
      </header>

      {/* Chapters: beside the player on desktop, following the video */}
      <section aria-labelledby="lesson-chapters" className="lesson-area-chapters arrive min-w-0 [--i:3]">
        <div className="glass flex h-full max-h-[26rem] flex-col rounded-[1.6rem] lg:max-h-none">
          <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
            <h2 id="lesson-chapters" className="font-display text-[15px] font-semibold">
              Главы <span className="ml-1 font-mono text-[11px] font-normal text-dim">{lesson.chapters.length}</span>
            </h2>
            {mine && lesson.open && (
              <span className="font-mono text-[11px] text-dim tabular-nums">{mine.watched ? "просмотрено" : `${Math.round(shareOf(mine, lesson.duration) * 100)}%`}</span>
            )}
          </div>
          {lesson.chapters.length ? (
            <ol className="min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain px-2 pb-2">
              {lesson.chapters.map((ch, i) => {
                const active = i === current;
                const passed = current > i;
                return (
                  <li key={ch.at}>
                    <button
                      type="button"
                      disabled={!playable}
                      onClick={() => seek(ch.at)}
                      aria-current={active ? "true" : undefined}
                      className={cn(
                        "group/ch relative flex w-full items-start gap-3 rounded-[1rem] border px-3 py-2.5 text-left transition-colors",
                        active ? "border-white/12 bg-white/[0.07]" : "border-transparent enabled:hover:bg-white/[0.04]",
                        !playable && "cursor-default",
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          "mt-[5px] size-[7px] shrink-0 rotate-45 rounded-[1.5px] border transition-colors",
                          active ? "border-accent bg-accent shadow-[0_0_8px_1px_rgb(var(--rgb-accent)/0.55)]" : passed ? "border-accent/50 bg-accent/40" : "border-white/25",
                        )}
                      />
                      <span className="min-w-0 flex-1">
                        <span className={cn("block text-[13.5px] leading-snug", active ? "font-semibold text-fg" : passed ? "text-fg/60" : "text-fg/85")}>{ch.title}</span>
                      </span>
                      <span className={cn("mt-px font-mono text-[11px] tabular-nums", active ? "text-accent-soft" : "text-dim")}>{formatClock(ch.at)}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="px-5 pb-5 text-[13px] text-muted">У этого разбора нет глав: он короткий и смотрится целиком.</p>
          )}
          {!playable && lesson.chapters.length > 0 && (
            <p className="flex items-center gap-2 border-t border-white/6 px-5 py-3 text-[12px] text-dim">
              <Lock size={12} aria-hidden /> Переход по главам — когда разбор открыт
            </p>
          )}
        </div>
      </section>

      {/* About, what's needed, files */}
      <div className="lesson-area-body min-w-0 space-y-4">
        <section aria-labelledby="lesson-about" className="arrive px-1 [--i:4]">
          <h2 id="lesson-about" className="font-mono text-[10.5px] tracking-[0.18em] text-dim uppercase">
            О разборе
          </h2>
          <div className="mt-3 max-w-3xl space-y-3 text-[15px] leading-relaxed text-fg/85">
            {lesson.about.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        </section>

        {(lesson.materials.length > 0 || lesson.files.length > 0) && (
          <section aria-labelledby="lesson-materials" className="glass arrive rounded-[1.6rem] p-3 sm:p-4 [--i:5]">
            <h2 id="lesson-materials" className="px-2 pt-1 font-display text-[15px] font-semibold">
              Что понадобится
            </h2>
            {lesson.materials.length > 0 && (
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {lesson.materials.map((m) => (
                  <li key={m.id}>
                    <Link
                      href={resourceHref(m.id)}
                      className="group/m flex items-center gap-3 rounded-2xl border border-white/6 bg-white/[0.025] p-2 pr-3 transition hover:border-white/14 hover:bg-white/[0.05]"
                    >
                      {m.code ? <AppTile code={m.code} size={40} /> : <AppTile mark={m.mark} tint={m.tint} size={40} />}
                      <span className="min-w-0 flex-1 leading-tight">
                        <span className="block truncate text-[14px] font-semibold text-fg">{m.name}</span>
                        <span className="mt-0.5 block truncate text-[12px] text-dim">{m.note}</span>
                      </span>
                      {signedIn && !m.open && <Lock size={13} aria-label="в «Ресурсах» откроется с IDX LITE" className="shrink-0 text-dim" />}
                      <ArrowUpRight size={16} aria-hidden className="shrink-0 text-dim transition group-hover/m:translate-x-0.5 group-hover/m:-translate-y-0.5 group-hover/m:text-fg/80" />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {lesson.files.length > 0 && (
              <ul className="mt-2 space-y-2">
                {lesson.files.map((f) => (
                  <li key={f.href}>
                    <a
                      href={f.href}
                      download
                      className="flex items-center gap-3 rounded-2xl border border-white/6 bg-white/[0.025] p-3 transition hover:border-white/14 hover:bg-white/[0.05]"
                    >
                      <span aria-hidden className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 text-accent-soft">
                        <FileDown size={18} />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[14px] font-semibold text-fg">{f.label}</span>
                      {f.size && <span className="font-mono text-[11px] text-dim">{f.size}</span>}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>

      {/* The section's other lessons */}
      <section aria-labelledby="lesson-section" className="lesson-area-list glass arrive min-w-0 rounded-[1.6rem] p-2 [--i:4]">
        <div className="flex items-center justify-between gap-3 px-3 pt-2.5 pb-2">
          <h2 id="lesson-section" className="font-display text-[15px] font-semibold">
            Раздел {c.title}
          </h2>
          <span className="font-mono text-[11px] text-dim">{lessonsCount(section.length)}</span>
        </div>
        <ol className="space-y-1">
          {section.map((l, i) => (
            <li key={l.slug}>
              <SectionRow lesson={l} number={i + 1} current={l.slug === lesson.slug} share={l.open ? shareOf(progress[l.slug], l.duration) : 0} watched={l.open && Boolean(progress[l.slug]?.watched)} />
            </li>
          ))}
        </ol>
        <Link href={learnSectionHref(lesson.section)} className="mt-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[13px] font-semibold text-accent-soft transition hover:text-fg">
          Все разборы раздела <ArrowRight size={14} />
        </Link>
      </section>
    </div>
  );
}

/** A lesson in the section's list: a small cover with its progress, the number, the title, the length. */
function SectionRow({ lesson, number, current, share, watched }: { lesson: LessonCard; number: number; current: boolean; share: number; watched: boolean }) {
  const body = (
    <>
      <span className="relative block aspect-video w-24 shrink-0 overflow-hidden rounded-[0.8rem] border border-white/6">
        <LessonCover slug={lesson.slug} section={lesson.section} poster={lesson.poster} size="thumb" />
        <ProgressLine share={share} />
        {current && (
          <span className="absolute inset-0 z-[2] flex items-center justify-center bg-ink-950/40" aria-hidden>
            <span className="flex items-end gap-[3px]">
              <span className="h-2.5 w-[3px] animate-pulse rounded-full bg-accent-soft" />
              <span className="h-4 w-[3px] animate-pulse rounded-full bg-accent-soft [animation-delay:150ms]" />
              <span className="h-3 w-[3px] animate-pulse rounded-full bg-accent-soft [animation-delay:300ms]" />
            </span>
          </span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className={cn("line-clamp-2 text-[13px] leading-snug", current ? "font-semibold text-fg" : lesson.open ? "text-fg/85" : "text-fg/60")}>{lesson.title}</span>
        <span className="mt-1 flex items-center gap-1.5 font-mono text-[10.5px] text-dim tabular-nums">
          <span>{String(number).padStart(2, "0")}</span>
          <span aria-hidden>·</span>
          <span>{formatClock(lesson.duration)}</span>
          {watched && <Check size={11} strokeWidth={2.75} className="text-accent" aria-label="просмотрено" />}
          {!lesson.open && <Lock size={10} aria-label="закрыт" />}
          {current && <span className="text-accent-soft">· сейчас</span>}
        </span>
      </span>
    </>
  );
  const rowClass = cn("lesson-row flex items-center gap-3 rounded-[1.1rem] border p-1.5 pr-2.5 transition-colors", current ? "border-white/12 bg-white/[0.06]" : "border-transparent hover:bg-white/[0.04]");
  return current ? (
    <div className={rowClass} aria-current="page">
      {body}
    </div>
  ) : (
    <Link href={lessonHref(lesson.slug)} className={rowClass}>
      {body}
      <ChevronRight size={15} aria-hidden className="shrink-0 text-dim" />
    </Link>
  );
}

/** Instead of the player: what opens the lesson (sign in / PRO), or that its video is on the way. */
function Stage({ lesson, audience }: { lesson: LessonPage; audience: Audience }) {
  const soon = lesson.open && !lesson.video;
  return (
    <div className="glass overflow-hidden rounded-[1.6rem] p-1.5 sm:p-2">
      <div className="relative aspect-video overflow-hidden rounded-[1.15rem] bg-black">
        <LessonCover slug={lesson.slug} section={lesson.section} poster={lesson.poster} size="stage" />
        <div className="absolute inset-0 z-[3] flex flex-col items-center justify-center bg-ink-950/60 p-5 text-center backdrop-blur-[6px] sm:p-8">
          <span aria-hidden className="inline-flex size-12 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.06] text-accent-soft sm:size-14">
            {soon ? <Hourglass size={22} /> : audience === "guest" && lesson.intro ? <UserRoundPlus size={22} /> : <Lock size={22} />}
          </span>
          {soon ? (
            <>
              <p className="mt-4 font-display text-lg font-semibold sm:text-2xl">Видео скоро появится</p>
              <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-muted sm:text-[14.5px]">Разбор уже готовится к публикации. Новости — в Telegram-канале.</p>
            </>
          ) : audience === "guest" ? (
            <>
              <p className="mt-4 font-display text-lg font-semibold text-balance sm:text-2xl">{lesson.intro ? "Бесплатно — нужен только аккаунт" : "Войди, чтобы смотреть"}</p>
              <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-muted sm:text-[14.5px]">
                {lesson.intro
                  ? "Вводные разборы открыты всем, у кого есть аккаунт. Регистрация — минута."
                  : "Этот разбор — в подписке IDX PRO. Вводные разборы открыты бесплатно с аккаунтом."}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2.5">
                {/* Both come back to this lesson once signed in */}
                <Link href={registerHrefTo(lessonHref(lesson.slug))} className="btn btn-primary btn-md">
                  Создать аккаунт
                </Link>
                <Link href={loginHref(lessonHref(lesson.slug))} className="btn btn-glass btn-md">
                  Войти
                </Link>
              </div>
            </>
          ) : (
            <>
              <p className="mt-4 font-display text-lg font-semibold sm:text-2xl">Разбор входит в IDX PRO</p>
              <p className="mt-2 max-w-md text-[13.5px] leading-relaxed text-muted sm:text-[14.5px]">
                В подписке — все туториалы и новые уроки, весь раздел «Ресурсы» и ИИ-ассистент.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2.5">
                <Link href={routes.pricing} className="btn btn-primary btn-md">
                  Открыть PRO <ArrowRight size={16} />
                </Link>
                <Link href={routes.learn} className="btn btn-glass btn-md">
                  Бесплатные разборы
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
