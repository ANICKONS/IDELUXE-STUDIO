"use client";

import "@/features/resources/resources.css";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownUp, LayoutGrid, RotateCcw, Search, SearchX, X } from "lucide-react";
import { AppTile } from "@/components/ui/app-tile";
import { kindLabel, programName, sections, type AddonForm, type ProgramId, type ResourceKind } from "@/content/resource-taxonomy";
import { Dropdown } from "@/components/ui/dropdown";
import { defaultFilters, formCounts, formsOf, hostCounts, hostsOf, isFiltered, results, sectionCounts, type Filters, type FormFilter } from "@/features/resources/filter";
import { FormGlyph, OsGlyph, sectionIcon } from "@/features/resources/glyphs";
import { ItemDialog, type NavMove } from "@/features/resources/item-dialog";
import { useOsPref } from "@/features/resources/prefs";
import { ResourceCard } from "@/features/resources/resource-card";
import { Segmented } from "@/components/ui/segmented";
import { AccessNote, formName, Sidebar } from "@/features/resources/sidebar";
import type { Catalog, CatalogItem } from "@/features/resources/types";
import { cn } from "@/lib/utils";

/** `?s=plugin` — the open section; `?r=<id>` — an item's window: both can be shared as a link. */
const SECTION_PARAM = "s";
const ITEM_PARAM = "r";

/** Keeps the address in step with the hub without a navigation (Next keeps its own history state). */
function syncUrl(section: ResourceKind, item: string | null) {
  const url = new URL(window.location.href);
  if (section === "program") url.searchParams.delete(SECTION_PARAM);
  else url.searchParams.set(SECTION_PARAM, section);
  if (item) url.searchParams.set(ITEM_PARAM, item);
  else url.searchParams.delete(ITEM_PARAM);
  if (url.href !== window.location.href) window.history.replaceState(window.history.state, "", url);
}

const isSection = (v: string | null): v is ResourceKind => sections.includes(v as ResourceKind);

type Nav = { stack: string[]; move: NavMove };

/**
 * «Ресурсы» as a hub: the sections on the left (Программы, Плагины, Расширения with their groups;
 * on phones — tabs above), the open section's title, a slim row of filters and its cards. A card
 * opens the item's window, which grows out of it (item-dialog.tsx); from a program's or a
 * collection's window its add-ons open in the same window, «Назад» steps back.
 */
export function ResourcesCatalog({ catalog }: { catalog: Catalog }) {
  const { programs, addons, audience } = catalog;
  const params = useSearchParams();
  const byId = useMemo(() => new Map<string, CatalogItem>([...programs, ...addons].map((item) => [item.id, item])), [programs, addons]);
  const lookup = useMemo(() => ({ byId, programs, addons }), [byId, programs, addons]);

  const [section, setSection] = useState<ResourceKind>(() => {
    const s = params.get(SECTION_PARAM);
    if (isSection(s)) return s;
    return byId.get(params.get(ITEM_PARAM) ?? "")?.kind ?? "program";
  });
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [os, setOs] = useOsPref();
  const [nav, setNav] = useState<Nav>(() => {
    const r = params.get(ITEM_PARAM);
    return { stack: r && byId.has(r) ? [r] : [], move: "open" };
  });
  /** Anything picked since the page came in: new cards then fade in instead of the page entrance. */
  const [touched, setTouched] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const f = useMemo<Filters>(() => ({ ...filters, os }), [filters, os]);
  const list = useMemo(() => results(section, programs, addons, f), [section, programs, addons, f]);
  const counts = useMemo(() => sectionCounts(programs, addons, f), [programs, addons, f]);
  const byForm = useMemo(() => formCounts(section, programs, addons, f), [section, programs, addons, f]);
  const byHost = useMemo(() => hostCounts(section, programs, addons, f), [section, programs, addons, f]);
  /** Fixed per section: the sidebar's groups and the «Программа» filter don't jump while filtering. */
  const formsBySection = useMemo(() => {
    const out = {} as Record<ResourceKind, AddonForm[]>;
    for (const s of sections) out[s] = formsOf(s, addons);
    return out;
  }, [addons]);
  const hosts = useMemo(() => hostsOf(section, addons), [section, addons]);
  const openCount = useMemo(() => addons.filter((a) => a.form !== "collection" && a.open).length, [addons]);

  useEffect(() => syncUrl(section, nav.stack[nav.stack.length - 1] ?? null), [section, nav.stack]);

  const update = useCallback((patch: Partial<Filters>) => {
    setTouched(true);
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);
  const pickSection = useCallback((s: ResourceKind) => {
    setTouched(true);
    setSection(s);
    // Groups and programs belong to their section
    setFilters((prev) => ({ ...prev, form: "all", host: "all" }));
  }, []);
  const pickOs = useCallback(
    (v: typeof os) => {
      setTouched(true);
      setOs(v);
    },
    [setOs],
  );

  const openItem = useCallback((id: string) => setNav({ stack: [id], move: "open" }), []);
  // Stepping to an item already on the way here goes back to it instead of looping
  const pushItem = useCallback(
    (id: string) =>
      setNav((n) => {
        const at = n.stack.indexOf(id);
        if (at === n.stack.length - 1) return n;
        return at >= 0 ? { stack: n.stack.slice(0, at + 1), move: "back" } : { stack: [...n.stack, id], move: "fwd" };
      }),
    [],
  );
  const backItem = useCallback(() => setNav((n) => ({ stack: n.stack.slice(0, -1), move: "back" })), []);
  const closedItem = useCallback(() => setNav({ stack: [], move: "open" }), []);

  // «/» jumps to the search (unless typing somewhere already or a window is open)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const groups = formsBySection[section];
  const reset = () => update({ q: "", host: "all", form: "all", onlyOpen: false });
  // Discrete choices bring the cards in anew; typing in the search only adds and removes them
  const gridKey = [section, f.form, f.host, f.os, f.sort, f.onlyOpen].join("|");

  return (
    <div className="mt-10 grid items-start gap-6 lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:gap-8">
      <div className="hidden lg:block">
        <Sidebar
          section={section}
          form={filters.form}
          sectionCounts={counts}
          formCounts={byForm}
          formsBySection={formsBySection}
          audience={audience}
          admin={catalog.admin}
          openCount={openCount}
          onSection={pickSection}
          onForm={(form) => update({ form })}
        />
      </div>

      <div className="min-w-0">
        {/* Phones and tablets: the sections as tabs, the access line under them */}
        <div className="arrive mb-6 space-y-4 lg:hidden [--i:3]">
          <Segmented
            label="Раздел"
            block
            value={section}
            onChange={pickSection}
            options={sections.map((s) => {
              const Icon = sectionIcon[s];
              // Phones: no icons, so the three tabs fit side by side
              return { value: s, label: kindLabel[s].many, icon: <Icon size={15} className="hidden sm:block" />, count: counts[s] };
            })}
          />
          <AccessNote audience={audience} admin={catalog.admin} openCount={openCount} className="px-1" />
        </div>

        {/* The section's title and order */}
        <div className="arrive flex flex-wrap items-end justify-between gap-3 [--i:4]">
          <h2 className="font-display text-[1.75rem] leading-none font-semibold tracking-tight sm:text-[2rem]">
            {kindLabel[section].many}
            {filters.form !== "all" && filters.form !== "single" && <span className="text-fg/45"> · {formName(section, filters.form)}</span>}
            <span className="ml-3 font-mono text-[15px] font-normal tracking-normal text-dim tabular-nums" aria-label={`${list.length} шт.`}>
              {list.length}
            </span>
          </h2>
          <div className="flex items-center gap-3">
            {audience === "free" && <OnlyOpenSwitch on={filters.onlyOpen} onChange={(onlyOpen) => update({ onlyOpen })} />}
            <Dropdown
              label="Порядок"
              align="right"
              icon={<ArrowDownUp size={14} aria-hidden />}
              value={filters.sort}
              onChange={(sort) => update({ sort })}
              options={[
                { value: "popular", label: "Популярные" },
                { value: "name", label: "По алфавиту" },
              ]}
            />
          </div>
        </div>

        {/* Filters: search, group (phones), program (when the section spans several), system */}
        <div className="arrive relative z-30 mt-5 flex flex-wrap items-center gap-2.5 [--i:5]">
          <label className="relative min-w-0 flex-1 basis-full sm:basis-60">
            <span className="sr-only">Поиск в разделе</span>
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
              placeholder={section === "program" ? "Найти программу" : section === "plugin" ? "Twixtor, свечение, глитч…" : "Пресеты, звуки, анимация…"}
              autoComplete="off"
              spellCheck={false}
              className="res-search field h-10 rounded-full pr-11 pl-10 text-[14px]"
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

          {groups.length > 1 && (
            <Dropdown
              label="Группа"
              className="lg:hidden"
              highlight={filters.form !== "all"}
              value={filters.form}
              onChange={(form) => update({ form })}
              options={(["all", ...groups] as FormFilter[]).map((g) => ({
                value: g,
                label: g === "all" ? `Все ${kindLabel[section].many.toLowerCase()}` : formName(section, g),
                icon: <FormGlyph kind={section} form={g} size={15} />,
                count: byForm[g],
              }))}
            />
          )}
          {hosts.length > 1 && (
            <Dropdown
              label="Программа"
              highlight={filters.host !== "all"}
              value={filters.host}
              onChange={(host) => update({ host })}
              options={[
                { value: "all" as const, label: "Все программы", icon: <LayoutGrid size={15} aria-hidden />, count: byHost.all ?? 0 },
                ...hosts.map((h) => {
                  const p = programs.find((x) => x.programId === h);
                  return { value: h as ProgramId, label: programName[h], icon: p ? <AppTile code={p.code} size={20} /> : undefined, count: byHost[h] ?? 0 };
                }),
              ]}
            />
          )}
          <Segmented
            label="Система"
            size="sm"
            value={os}
            onChange={pickOs}
            options={[
              { value: "all", label: "Все ОС" },
              { value: "win", label: <span className="hidden sm:inline">Windows</span>, icon: <OsGlyph os="win" size={12} />, title: "Windows" },
              { value: "mac", label: <span className="hidden sm:inline">macOS</span>, icon: <OsGlyph os="mac" size={12} />, title: "macOS" },
            ]}
          />
        </div>

        {isFiltered(f) && <ActiveFilters filters={f} section={section} onChange={update} onReset={reset} />}

        <div key={gridKey} className="mt-5">
          {list.length ? (
            <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
              {list.map((r, i) => (
                <li key={r.item.id}>
                  <ResourceCard result={r} index={i} fresh={touched} audience={audience} onOpen={openItem} />
                </li>
              ))}
            </ul>
          ) : (
            <Empty section={section} counts={counts} query={f.q} onSection={pickSection} onReset={reset} />
          )}
        </div>
      </div>

      {nav.stack.length > 0 && (
        <ItemDialog
          key={nav.stack[0]}
          stack={nav.stack}
          move={nav.move}
          lookup={lookup}
          audience={audience}
          os={os}
          onPush={pushItem}
          onBack={backItem}
          onClosed={closedItem}
        />
      )}
    </div>
  );
}

/** «Только открытые» (free mode): hides what this account can't download. */
function OnlyOpenSwitch({ on, onChange }: { on: boolean; onChange: (on: boolean) => void }) {
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
      <span className="hidden sm:inline">Только открытые</span>
      <span className="sm:hidden">Открытые</span>
    </button>
  );
}

/** The filters in play as small chips (✕ drops one) and «Сбросить». */
function ActiveFilters({ filters: f, section, onChange, onReset }: { filters: Filters; section: ResourceKind; onChange: (patch: Partial<Filters>) => void; onReset: () => void }) {
  const chips: { key: string; label: string; drop: Partial<Filters> }[] = [];
  if (f.q.trim()) chips.push({ key: "q", label: `«${f.q.trim()}»`, drop: { q: "" } });
  if (section !== "program" && f.form !== "all") chips.push({ key: "form", label: formName(section, f.form), drop: { form: "all" } });
  if (section !== "program" && f.host !== "all") chips.push({ key: "host", label: `Для ${programName[f.host]}`, drop: { host: "all" } });
  if (f.onlyOpen) chips.push({ key: "open", label: "Только открытые", drop: { onlyOpen: false } });
  if (!chips.length) return null;
  return (
    <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => onChange(c.drop)}
          className="inline-flex animate-fade-in items-center gap-1.5 rounded-full border border-accent/25 bg-accent/8 py-1 pr-2 pl-3 text-[12px] text-accent-soft transition hover:border-accent/45 hover:text-fg"
          aria-label={`Убрать фильтр: ${c.label}`}
        >
          {c.label} <X size={12} aria-hidden />
        </button>
      ))}
      <button type="button" onClick={onReset} className="ml-1 inline-flex items-center gap-1.5 text-[12px] font-semibold text-dim transition hover:text-fg">
        <RotateCcw size={12} aria-hidden /> Сбросить
      </button>
    </div>
  );
}

/** Nothing here: where the search found something instead, or reset. */
function Empty({
  section,
  counts,
  query,
  onSection,
  onReset,
}: {
  section: ResourceKind;
  counts: Record<ResourceKind, number>;
  query: string;
  onSection: (s: ResourceKind) => void;
  onReset: () => void;
}) {
  const elsewhere = query.trim() ? sections.filter((s) => s !== section && counts[s] > 0) : [];
  return (
    <div className="glass res-card-in flex flex-col items-center rounded-[1.75rem] px-6 py-14 text-center">
      <span aria-hidden className="inline-flex size-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-fg/60">
        <SearchX size={24} />
      </span>
      <p className="mt-5 font-display text-xl font-semibold">Здесь ничего не нашлось</p>
      {elsewhere.length > 0 ? (
        <>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">Зато есть в других разделах:</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {elsewhere.map((s) => {
              const Icon = sectionIcon[s];
              return (
                <button key={s} type="button" onClick={() => onSection(s)} className="btn btn-glass btn-sm">
                  <Icon size={15} /> {kindLabel[s].many} <span className="font-mono text-[11px] text-accent-soft">{counts[s]}</span>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">Попробуй другое слово или убери часть фильтров. Не хватает плагина — напиши IDELUXE в Telegram, добавим.</p>
          <button type="button" onClick={onReset} className="btn btn-glass btn-md mt-6">
            <RotateCcw size={15} /> Сбросить фильтры
          </button>
        </>
      )}
    </div>
  );
}
