import type { AppCode } from "@/components/ui/app-tile";
import type { AddonKind, Category, License, OS, ProgramId } from "@/content/resource-taxonomy";

/*
 * What the hub hands to the browser (built on the server by catalog.server.ts): the public
 * description of every item, plus, only for items open to this account, the direct links.
 */

export type Step = { text: string; path?: Partial<Record<OS, string>> };
export type Compat = { program: ProgramId; year: string };

/** A program's version or an add-on's variant; `downloads` only when the item is open to this account. */
export type Build = { id: string; label: string; hint?: string; compat: Compat[]; downloads?: Partial<Record<OS, string>> };

type Base = {
  id: string;
  name: string;
  vendor?: string;
  os: OS[];
  summary: string;
  about: string;
  /** This account may download it (a collection: at least one of its items). */
  open: boolean;
  /** Opens with a free account (shown to guests as a hint). */
  free: boolean;
};

type Downloadable = Base & { license?: License; site?: string; builds: Build[]; steps: Step[] };

export type ProgramItem = Downloadable & { kind: "program"; form: "single"; programId: ProgramId; code: AppCode; role: string };

export type AddonItem = Downloadable & {
  kind: AddonKind;
  form: "single" | "module";
  hosts: ProgramId[];
  category: Category;
  mark: string;
  /** The collection it belongs to, if any. */
  collection?: string;
  /** What a module holds. */
  contents?: { name: string; note?: string }[];
};

export type CollectionItem = Base & {
  kind: AddonKind;
  form: "collection";
  hosts: ProgramId[];
  category: Category;
  mark: string;
  /** Ids of its add-ons (each one is also in the catalog on its own). */
  children: string[];
};

export type CatalogItem = ProgramItem | AddonItem | CollectionItem;
export type Addon = AddonItem | CollectionItem;

/** Who is looking: no account / free mode / the whole catalog open. */
export type Audience = "guest" | "free" | "full";

/** `addons`: in the catalog's order, a collection followed by its own add-ons. */
export type Catalog = { programs: ProgramItem[]; addons: Addon[]; audience: Audience; admin: boolean };
