"use client";

import "@/features/learn/learn.css";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownUp, CircleDashed, CircleCheck, LayoutGrid, ListChecks, Play, RotateCcw, Search, SearchX, X } from "lucide-react";
import { AppTile } from "@/components/ui/app-tile";
import { Dropdown } from "@/components/ui/dropdown";
import { programCode, programName, type ProgramId } from "@/content/resource-taxonomy";
import { tutorialCategories, tutorialSections, type TutorialSection } from "@/content/tutorial-categories";
import { lessonsCount } from "@/features/learn/glyphs";
import { ContinueCard, LessonCard } from "@/features/learn/lesson-card";
import { inProgress } from "@/features/learn/progress";
import { useProgress } from "@/features/learn/progress-store";
import { AccessNote, SectionIconTile, sectionHint, sectionTitle, Sidebar, type SectionCounts, type SectionPick } from "@/features/learn/sidebar";
import type { Audience, LessonCard as Lesson, ProgressMap } from "@/features/learn/types";
import { cn } from "@/lib/utils";

const SECTION_PARAM = "s";

type Sort = "order" | "new" | "short";
type Status = "all" | "todo" | "started" | "watched";
type Filters = { q: string; program: ProgramId | "all"; status: Status; onlyOpen: boolean; sort: Sort };

const defaults: Filters = { q: "", program: "all", status: "all", onlyOpen: false, sort: "order" };

const isSection = (v: string | null): v is TutorialSection => tutorialSections.includes(v as TutorialSection);

/** Lowercase, «ё» as «е»: «Ёлка» finds «елка». */
const fold = (s: string) => s.toLowerCase().replace(/ё/g, "е");

/** Keeps the address in step with the picked section without a navigation. */
function syncUrl(section: SectionPick) {
  const url = new URL(window.location.href);
  if (section === "all") url.searchParams.delete(SECTION_PARAM);
  else url.searchParams.set(SECTION_PARAM, section);
  if (url.href !== window.location.href) window.history.replaceState(window.history.state, "", url);
}

/**
 * The tutorials hub: the sections on the left (on phones — a row of chips above), the open
 * section's title, a slim row of filters, «Продолжить просмотр» while something is half-watched,
 * and the lessons' cards. A card opens the lesson's page. `?s=vfx` opens a section (the landing's
 * links lead there).
 */
export function LearnCatalog({
  lessons,
  progress: serverProgress,
  audience,
  admin,
}: {
  lessons: Lesson[];
  progress: ProgressMap;
  audience: Audience;
  admin: boolean;
}) {
  const params = useSearchParams();
  const progress = useProgress(serverProgress);
  const signedIn = audience !== "guest";
  const [section, setSection] = useState<SectionPick>(() => {
    const s = params.get(SECTION_PARAM);
    return isSection(s) ? s : "all";
  });
  const [filters, setFilters] = useState<Filters>(defaults);
  const [touched, setTouched] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => syncUrl(section), [section]);

  // «/» jumps to the search (unless typing somewhere already)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const update = useCallback((patch: Partial<Filters>) => {
    setTouched(true);
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);
  const pickSection = useCallback((s: SectionPick) => {
    setTouched(true);
    setSection(s);
  }, []);

  /** Everything but the section: the counts beside the sections follow the other filters. */
  const passes = useCallback(
    (l: Lesson, f: Filters) => {
      if (f.program !== "all" && !l.programs.includes(f.program)) return false;
      if (f.onlyOpen && !l.intro) return false;
      const p = progress[l.slug];
      if (f.status === "watched" && !p?.watched) return false;
      if (f.status === "started" && !inProgress(p)) return false;
      if (f.status === "todo" && (p?.watched || inProgress(p))) return false;
      const words = fold(f.q).split(/\s+/).filter(Boolean);
      if (words.length) {
        const c = tutorialCategories.find((x) => x.slug === l.section)!;
        const hay = fold(`${l.title} ${l.summary} ${l.keywords} ${c.title} ${c.hint}`);
        if (!words.every((w) => hay.includes(w))) return false;
      }
      return true;
    },
    [progress],
  );

  const matching = useMemo(() => lessons.filter((l) => passes(l, filters)), [lessons, filters, passes]);

  const counts = useMemo(() => {
    const out = { all: { total: 0, watched: 0 } } as SectionCounts;
    for (const s of tutorialSections) out[s] = { total: 0, watched: 0 };
    for (const l of matching) {
      const w = progress[l.slug]?.watched ? 1 : 0;
      out.all.total += 1;
      out.all.watched += w;
      out[l.section].total += 1;
      out[l.section].watched += w;
    }
    return out;
  }, [matching, progress]);

  const list = useMemo(() => {
    const inSection = section === "all" ? matching : matching.filter((l) => l.section === section);
    if (filters.sort === "new") return [...inSection].sort((a, b) => b.published - a.published);
    if (filters.sort === "short") return [...inSection].sort((a, b) => a.duration - b.duration);
    return inSection;
  }, [matching, section, filters.sort]);

  const programs = useMemo(() => {
    const set = new Set(lessons.flatMap((l) => l.programs));
    return (Object.keys(programName) as ProgramId[]).filter((p) => set.has(p));
  }, [lessons]);
  const byProgram = useMemo(() => {
    const f = { ...filters, program: "all" as const };
    const pool = lessons.filter((l) => (section === "all" || l.section === section) && passes(l, f));
    const out: Record<string, number> = { all: pool.length };
    for (const l of pool) for (const p of l.programs) out[p] = (out[p] ?? 0) + 1;
    return out;
  }, [lessons, filters, section, passes]);
  const byStatus = useMemo(() => {
    const f = { ...filters, status: "all" as const };
    const pool = lessons.filter((l) => (section === "all" || l.section === section) && passes(l, f));
    const out: Record<Status, number> = { all: pool.length, todo: 0, started: 0, watched: 0 };
    for (const l of pool) {
      const p = progress[l.slug];
      out[p?.watched ? "watched" : inProgress(p) ? "started" : "todo"] += 1;
    }
    return out;
  }, [lessons, filters, section, passes, progress]);

  const filtered = filters.q.trim() !== "" || filters.program !== "all" || filters.status !== "all" || filters.onlyOpen;
  const resume = useMemo(
    () =>
      lessons
        .filter((l) => l.open && inProgress(progress[l.slug]))
        .sort((a, b) => progress[b.slug].updatedAt - progress[a.slug].updatedAt)
        .slice(0, 2),
    [lessons, progress],
  );
  const showResume = section === "all" && !filtered && resume.length > 0;
  const introCount = useMemo(() => lessons.filter((l) => l.intro).length, [lessons]);
  const reset = () => update({ q: "", program: "all", status: "all", onlyOpen: false });
  const gridKey = [section, filters.program, filters.status, filters.onlyOpen, filters.sort].join("|");

  return (
    <div className="mt-10 grid items-start gap-6 lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:gap-8">
      <div className="hidden lg:block">
        <Sidebar section={section} counts={counts} audience={audience} admin={admin} introCount={introCount} signedIn={signedIn} onSection={pickSection} />
      </div>

      <div className="min-w-0">
        {/* Phones and tablets: the sections as a row of chips, the access line under them */}
        <div className="arrive mb-6 space-y-4 lg:hidden [--i:3]">
          <div className="chip-scroller -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="Разделы туториалов">
            {(["all", ...tutorialSections] as SectionPick[]).map((s) => {
              const active = s === section;
              return (
                <button
                  key={s}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => pickSection(s)}
                  className={cn(
                    "inline-flex h-11 shrink-0 snap-start items-center gap-2 rounded-full border pr-3.5 pl-1.5 text-[13.5px] font-semibold transition-colors",
                    active ? "border-white/14 bg-white/[0.08] text-fg" : "border-white/8 bg-ink-950/40 text-fg/65",
                  )}
                >
                  <SectionIconTile section={s} active={active} size="sm" />
                  {s === "all" ? "Все" : sectionTitle(s)}
                  <span className="font-mono text-[10.5px] text-dim tabular-nums">{counts[s].total}</span>
                </button>
              );
            })}
          </div>
          <AccessNote audience={audience} admin={admin} introCount={introCount} className="px-1" />
        </div>

        {/* The section's title, its line and the order */}
        <div className="arrive flex flex-wrap items-end justify-between gap-3 [--i:4]">
          <div className="min-w-0">
            <h2 className="font-display text-[1.75rem] leading-none font-semibold tracking-tight sm:text-[2rem]">
              {sectionTitle(section)}
              <span className="ml-3 font-mono text-[15px] font-normal tracking-normal text-dim tabular-nums" aria-label={lessonsCount(list.length)}>
                {list.length}
              </span>
            </h2>
            <p className="mt-2 text-[13.5px] text-muted">{sectionHint(section)}</p>
          </div>
          <div className="flex items-center gap-3">
            {audience !== "full" && <OnlyFreeSwitch on={filters.onlyOpen} audience={audience} onChange={(onlyOpen) => update({ onlyOpen })} />}
            <Dropdown
              label="Порядок"
              align="right"
              icon={<ArrowDownUp size={14} aria-hidden />}
              value={filters.sort}
              onChange={(sort) => update({ sort })}
              options={[
                { value: "order", label: "По порядку" },
                { value: "new", label: "Сначала новые" },
                { value: "short", label: "Сначала короткие" },
              ]}
            />
          </div>
        </div>

        {/* Filters: search, program, what's watched */}
        <div className="arrive relative z-30 mt-5 flex flex-wrap items-center gap-2.5 [--i:5]">
          <label className="relative min-w-0 flex-1 basis-full sm:basis-60">
            <span className="sr-only">Поиск по туториалам</span>
            <Search size={16} aria-hidden className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-dim" />
            <input
              ref={searchRef}
              type="search"
              value={filters.q}
              onChange={(e) => update({ q: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === "Escape" && filters.q) {
                  e.stopPropagation();
                  update({ q: "" });
                }
              }}
              placeholder="Свечение, переход, экспорт…"
              autoComplete="off"
              spellCheck={false}
              className="learn-search field h-10 rounded-full pr-11 pl-10 text-[14px] [&::-webkit-search-cancel-button]:appearance-none"
            />
            {filters.q ? (
              <button
                type="button"
                onClick={() => {
                  update({ q: "" });
                  searchRef.current?.focus();
                }}
                aria-label="Очистить поиск"
                className="absolute top-1/2 right-1.5 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-fg/60 transition hover:bg-white/8 hover:text-fg"
              >
                <X size={14} />
              </button>
            ) : (
              <span aria-hidden className="kbd pointer-events-none absolute top-1/2 right-3 hidden -translate-y-1/2 sm:block">
                /
              </span>
            )}
          </label>

          {programs.length > 1 && (
            <Dropdown
              label="Программа"
              highlight={filters.program !== "all"}
              value={filters.program}
              onChange={(program) => update({ program })}
              options={[
                { value: "all" as const, label: "Все программы", icon: <LayoutGrid size={15} aria-hidden />, count: byProgram.all ?? 0 },
                ...programs.map((p) => ({ value: p, label: programName[p], icon: <AppTile code={programCode[p]} size={20} />, count: byProgram[p] ?? 0 })),
              ]}
            />
          )}
          {signedIn && (
            <Dropdown
              label="Просмотр"
              highlight={filters.status !== "all"}
              value={filters.status}
              onChange={(status) => update({ status })}
              options={[
                { value: "all", label: "Все разборы", icon: <ListChecks size={15} aria-hidden />, count: byStatus.all },
                { value: "todo", label: "Не начатые", icon: <CircleDashed size={15} aria-hidden />, count: byStatus.todo },
                { value: "started", label: "Начатые", icon: <Play size={15} aria-hidden />, count: byStatus.started },
                { value: "watched", label: "Просмотренные", icon: <CircleCheck size={15} aria-hidden />, count: byStatus.watched },
              ]}
            />
          )}
        </div>

        {filtered && (
          <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
            <ActiveFilters filters={filters} audience={audience} onChange={update} />
            <button type="button" onClick={reset} className="ml-1 inline-flex items-center gap-1.5 text-[12px] font-semibold text-dim transition hover:text-fg">
              <RotateCcw size={12} aria-hidden /> Сбросить
            </button>
          </div>
        )}

        {showResume && (
          <section aria-labelledby="learn-resume" className="mt-7">
            <h3 id="learn-resume" className="arrive font-display text-[15px] font-semibold text-fg [--i:5]">
              Продолжить просмотр
            </h3>
            <ul className="mt-3 grid gap-3 md:grid-cols-2">
              {resume.map((l, i) => (
                <li key={l.slug}>
                  <ContinueCard lesson={l} progress={progress[l.slug]} index={i} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <div key={gridKey} className={showResume ? "mt-8" : "mt-5"}>
          {showResume && <h3 className="arrive mb-3 font-display text-[15px] font-semibold text-fg [--i:6]">Все разборы</h3>}
          {list.length ? (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {list.map((l, i) => (
                <li key={l.slug}>
                  <LessonCard lesson={l} progress={progress[l.slug]} audience={audience} index={i} fresh={touched} />
                </li>
              ))}
            </ul>
          ) : (
            <Empty section={section} counts={counts} query={filters.q} onSection={pickSection} onReset={reset} />
          )}
        </div>
      </div>
    </div>
  );
}

/** Free mode and guests: only the lessons a free account opens. */
function OnlyFreeSwitch({ on, audience, onChange }: { on: boolean; audience: Audience; onChange: (on: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="inline-flex items-center gap-2.5 text-[12.5px] font-semibold text-fg/70 transition hover:text-fg"
    >
      <span
        aria-hidden
        className={cn("relative inline-flex h-5 w-9 shrink-0 rounded-full border transition-colors duration-300", on ? "border-accent/50 bg-accent/30" : "border-white/12 bg-white/[0.06]")}
      >
        <span
          className={cn(
            "absolute top-[2px] left-[2px] size-3.5 rounded-full bg-fg shadow transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            on && "translate-x-4",
          )}
        />
      </span>
      {audience === "free" ? "Только открытые" : "Только бесплатные"}
    </button>
  );
}

const statusLabel: Record<Exclude<Status, "all">, string> = { todo: "Не начатые", started: "Начатые", watched: "Просмотренные" };

/** The filters in play as small chips (✕ drops one). */
function ActiveFilters({ filters: f, audience, onChange }: { filters: Filters; audience: Audience; onChange: (patch: Partial<Filters>) => void }) {
  const chips: { key: string; label: string; drop: Partial<Filters> }[] = [];
  if (f.q.trim()) chips.push({ key: "q", label: `«${f.q.trim()}»`, drop: { q: "" } });
  if (f.program !== "all") chips.push({ key: "program", label: programName[f.program], drop: { program: "all" } });
  if (f.status !== "all") chips.push({ key: "status", label: statusLabel[f.status], drop: { status: "all" } });
  if (f.onlyOpen) chips.push({ key: "open", label: audience === "free" ? "Только открытые" : "Только бесплатные", drop: { onlyOpen: false } });
  return chips.map((c) => (
    <button
      key={c.key}
      type="button"
      onClick={() => onChange(c.drop)}
      className="inline-flex animate-fade-in items-center gap-1.5 rounded-full border border-accent/25 bg-accent/8 py-1 pr-2 pl-3 text-[12px] text-accent-soft transition hover:border-accent/45 hover:text-fg"
      aria-label={`Убрать фильтр: ${c.label}`}
    >
      {c.label} <X size={12} aria-hidden />
    </button>
  ));
}

/** Nothing here: where the search found something instead, or reset. */
function Empty({
  section,
  counts,
  query,
  onSection,
  onReset,
}: {
  section: SectionPick;
  counts: SectionCounts;
  query: string;
  onSection: (s: SectionPick) => void;
  onReset: () => void;
}) {
  const elsewhere = section !== "all" && counts.all.total > 0 ? tutorialSections.filter((s) => s !== section && counts[s].total > 0) : [];
  return (
    <div className="glass lesson-in flex flex-col items-center rounded-[1.75rem] px-6 py-14 text-center">
      <span aria-hidden className="inline-flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-fg/60">
        <SearchX size={24} />
      </span>
      <p className="mt-5 font-display text-xl font-semibold">{query.trim() ? "Ничего не нашлось" : "Здесь пока пусто"}</p>
      {elsewhere.length > 0 ? (
        <>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">Зато есть в других разделах:</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {elsewhere.map((s) => (
              <button key={s} type="button" onClick={() => onSection(s)} className="btn btn-glass btn-sm">
                {sectionTitle(s)} <span className="font-mono text-[11px] text-accent-soft">{counts[s].total}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
            Попробуй другое слово или убери часть фильтров. Нужен разбор, которого нет, — напиши IDELUXE в Telegram.
          </p>
          <button type="button" onClick={onReset} className="btn btn-glass btn-md mt-6">
            <RotateCcw size={15} /> Сбросить фильтры
          </button>
        </>
      )}
    </div>
  );
}
