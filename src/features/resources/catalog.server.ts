import "server-only";
import { ADDON_YEAR, addons, installSteps, programs, type AddonEntry, type BuildEntry, type CollectionEntry, type ProgramEntry } from "@/content/resources";
import type { Addon, AddonItem, Build, Catalog, CollectionItem, Compat, ProgramItem } from "@/features/resources/types";
import { can, canOpenResource } from "@/lib/access-rules";
import type { AccessInfo } from "@/types/session";

/**
 * The catalog as this account may see it. Every item is listed (a locked one too: what it is and
 * where it works), but the direct links go out only with the items open to it — the browser never
 * gets a link it isn't entitled to. Fields are copied one by one (an allowlist), so whatever is
 * added to content/resources.ts later stays on the server until it's added here.
 */
export function catalogFor(access: AccessInfo | null): Catalog {
  const builds = (list: BuildEntry[], open: boolean, compat: Compat[]): Build[] =>
    list.map((b) => ({
      id: b.id,
      label: b.label,
      ...(b.hint ? { hint: b.hint } : {}),
      compat: b.compat ?? compat,
      ...(open && b.downloads ? { downloads: b.downloads } : {}),
    }));

  const common = (e: ProgramEntry | AddonEntry) => ({
    id: e.id,
    name: e.name,
    ...(e.vendor ? { vendor: e.vendor } : {}),
    os: e.os,
    ...(e.license ? { license: e.license } : {}),
    ...(e.site ? { site: e.site } : {}),
    summary: e.summary,
    about: e.about,
    steps: installSteps(e),
  });

  const program = (p: ProgramEntry): ProgramItem => {
    const open = canOpenResource(access, p);
    return { ...common(p), kind: "program", form: "single", programId: p.programId, code: p.code, role: p.role, open, free: true, builds: builds(p.versions, open, []) };
  };

  const addon = (a: AddonEntry, collection?: string): AddonItem => {
    const hosts = a.hosts ?? ["ae"];
    const open = canOpenResource(access, a);
    const list = a.builds ?? [{ id: "main", label: a.name, downloads: a.downloads }];
    return {
      ...common(a),
      kind: a.kind,
      form: a.contents ? "module" : "single",
      hosts,
      category: a.category,
      mark: a.mark,
      open,
      free: a.free === true,
      builds: builds(
        list,
        open,
        hosts.map((program) => ({ program, year: ADDON_YEAR })),
      ),
      ...(collection ? { collection } : {}),
      ...(a.contents ? { contents: a.contents.map((c) => ({ name: c.name, ...(c.note ? { note: c.note } : {}) })) } : {}),
    };
  };

  const collection = (c: CollectionEntry, items: AddonItem[]): CollectionItem => ({
    id: c.id,
    name: c.name,
    ...(c.vendor ? { vendor: c.vendor } : {}),
    os: [...new Set(items.flatMap((i) => i.os))],
    summary: c.summary,
    about: c.about,
    kind: c.kind,
    form: "collection",
    hosts: [...new Set(items.flatMap((i) => i.hosts))],
    category: c.category,
    mark: c.mark,
    children: items.map((i) => i.id),
    open: items.some((i) => i.open),
    free: items.some((i) => i.free),
  });

  const list: Addon[] = [];
  for (const e of addons) {
    if ("items" in e) {
      const items = e.items.map((i) => addon(i, e.id));
      list.push(collection(e, items), ...items);
    } else list.push(addon(e));
  }

  return {
    programs: programs.map(program),
    addons: list,
    audience: !access ? "guest" : can(access, "resources") ? "full" : "free",
    admin: access?.admin ?? false,
  };
}
