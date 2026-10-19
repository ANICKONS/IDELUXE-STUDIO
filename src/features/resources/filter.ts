import { categories, forms, programName, type AddonForm, type OS, type ProgramId, type ResourceKind } from "@/content/resource-taxonomy";
import type { Addon, CatalogItem, ProgramItem } from "@/features/resources/types";

/**
 * What narrows the open section down. The section (Программы / Плагины / Расширения) is chosen in
 * the sidebar; `form` and `host` only apply to plugins and extensions.
 *  - form "all": the section as it's laid out — modules, collections and add-ons on their own;
 *  - "module" / "collection": just those;
 *  - "single": every plugin (or extension) one by one, the ones inside collections too.
 */
export type FormFilter = "all" | AddonForm;

export type Filters = {
  q: string;
  os: "all" | OS;
  host: "all" | ProgramId;
  form: FormFilter;
  /** Hide what this account can't download (free mode). */
  onlyOpen: boolean;
  sort: "popular" | "name";
};

export const defaultFilters: Filters = { q: "", os: "all", host: "all", form: "all", onlyOpen: false, sort: "popular" };

/** A card in the grid; `hint` — what inside a module the search found («Twixtor Pro»). */
export type Result = { item: CatalogItem; hint?: string };

/** Lower case, «ё» as «е», single spaces: «Ёлка  After» → «елка after». */
const norm = (s: string) => s.toLowerCase().replace(/ё/g, "е").replace(/\s+/g, " ").trim();
const words = (q: string) => norm(q).split(" ").filter(Boolean);

const hostWords: Record<ProgramId, string> = {
  ae: "after effects ae",
  pr: "premiere pro pr",
  me: "media encoder me",
  ps: "photoshop ps",
  vg: "sony vegas pro vg",
};

function haystack(item: CatalogItem): string {
  const extra = item.kind === "program" ? `${item.role} ${hostWords[item.programId]}` : `${categories[item.category].label} ${item.hosts.map((h) => hostWords[h]).join(" ")}`;
  return norm(`${item.name} ${item.vendor ?? ""} ${item.summary} ${extra}`);
}

/** Does the item match the search? With a module, also its contents (`hint` names the one found). */
export function search(item: CatalogItem, q: string): { match: boolean; hint?: string } {
  const ws = words(q);
  if (!ws.length) return { match: true };
  const own = haystack(item);
  if (ws.every((w) => own.includes(w))) return { match: true };
  if (item.kind !== "program" && item.form === "module") {
    for (const c of item.contents ?? []) {
      const text = `${own} ${norm(`${c.name} ${c.note ?? ""}`)}`;
      if (ws.every((w) => text.includes(w))) return { match: true, hint: c.name };
    }
  }
  return { match: false };
}

/** Everything but the search and the form. */
function passes(item: CatalogItem, f: Filters, skip: (keyof Filters)[] = []): boolean {
  const on = (k: keyof Filters) => !skip.includes(k);
  if (on("os") && f.os !== "all" && !item.os.includes(f.os)) return false;
  if (on("onlyOpen") && f.onlyOpen && !item.open) return false;
  if (item.kind !== "program" && on("host") && f.host !== "all" && !item.hosts.includes(f.host)) return false;
  return true;
}

const byName = (a: Result, b: Result) => a.item.name.localeCompare(b.item.name, "ru");

/** Items of a section that a form shows (before any filter). */
function pool(section: ResourceKind, form: FormFilter, programs: ProgramItem[], addons: Addon[]): CatalogItem[] {
  if (section === "program") return programs;
  const own = addons.filter((a) => a.kind === section);
  if (form === "all") return own.filter((a) => !(a.form === "single" && a.collection));
  return own.filter((a) => a.form === form);
}

/**
 * The grid. In the «all» view a search also looks inside collections: an add-on found there shows
 * up on its own, unless its collection matched the search too.
 */
export function results(section: ResourceKind, programs: ProgramItem[], addons: Addon[], f: Filters, skip: (keyof Filters)[] = []): Result[] {
  const form = skip.includes("form") ? "all" : f.form;
  const out: Result[] = [];
  const found = new Set<string>();
  for (const item of pool(section, form, programs, addons)) {
    if (!passes(item, f, skip)) continue;
    const s = skip.includes("q") ? { match: true } : search(item, f.q);
    if (!s.match) continue;
    out.push(s.hint ? { item, hint: s.hint } : { item });
    found.add(item.id);
  }
  if (form === "all" && section !== "program" && words(f.q).length && !skip.includes("q")) {
    for (const a of addons) {
      if (a.kind !== section || a.form !== "single" || !a.collection || found.has(a.collection)) continue;
      if (passes(a, f, skip) && search(a, f.q).match) out.push({ item: a });
    }
  }
  return f.sort === "name" ? out.sort(byName) : out;
}

/** The sidebar's numbers: each section as laid out, with the search and the system applied. */
export function sectionCounts(programs: ProgramItem[], addons: Addon[], f: Filters): Record<ResourceKind, number> {
  const out = {} as Record<ResourceKind, number>;
  for (const s of ["program", "plugin", "extension"] as const) out[s] = results(s, programs, addons, f, ["form", "host", "onlyOpen"]).length;
  return out;
}

/** The forms a section has at all, in the sidebar's order (fixed: the list doesn't jump while filtering). */
export function formsOf(section: ResourceKind, addons: Addon[]): AddonForm[] {
  if (section === "program") return [];
  const own = new Set(addons.filter((a) => a.kind === section).map((a) => a.form));
  return forms.filter((x) => own.has(x));
}

/** How many cards each form would show, everything else applied. */
export function formCounts(section: ResourceKind, programs: ProgramItem[], addons: Addon[], f: Filters): Record<FormFilter, number> {
  const out = { all: 0, module: 0, collection: 0, single: 0 } as Record<FormFilter, number>;
  if (section === "program") return out;
  for (const form of ["all", ...forms] as FormFilter[]) out[form] = results(section, programs, addons, { ...f, form }).length;
  return out;
}

/** The programs a section's add-ons plug into (the «Программа» filter shows only when there are several). */
export function hostsOf(section: ResourceKind, addons: Addon[]): ProgramId[] {
  const own = new Set(addons.filter((a) => a.kind === section).flatMap((a) => a.hosts));
  return (Object.keys(programName) as ProgramId[]).filter((h) => own.has(h));
}

export function hostCounts(section: ResourceKind, programs: ProgramItem[], addons: Addon[], f: Filters): Record<string, number> {
  const out: Record<string, number> = { all: results(section, programs, addons, { ...f, host: "all" }).length };
  for (const h of hostsOf(section, addons)) out[h] = results(section, programs, addons, { ...f, host: h }).length;
  return out;
}

/** Anything narrowed down within the section (the system is a preference, not counted). */
export function isFiltered(f: Filters): boolean {
  return f.q.trim() !== "" || f.host !== "all" || f.form !== "all" || f.onlyOpen;
}
