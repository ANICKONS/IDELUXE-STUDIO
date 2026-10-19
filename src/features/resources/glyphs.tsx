import { Apple, AppWindow, Blocks, Layers, LayoutGrid, Package, Puzzle, type LucideIcon } from "lucide-react";
import { AppTile } from "@/components/ui/app-tile";
import { categories, programName, programTint, type AddonForm, type OS, type ResourceKind } from "@/content/resource-taxonomy";
import type { CatalogItem, Compat } from "@/features/resources/types";
import { pluralRu } from "@/lib/format";

export const sectionIcon: Record<ResourceKind, LucideIcon> = { program: AppWindow, plugin: Puzzle, extension: Blocks };

/** A form's icon in the sidebar and on badges («all» — a grid; «single» takes its section's). */
export function FormGlyph({ kind, form, size = 14, className }: { kind: ResourceKind; form: AddonForm | "all"; size?: number; className?: string }) {
  if (form === "all") return <LayoutGrid size={size} aria-hidden className={className} />;
  if (form === "module") return <Package size={size} aria-hidden className={className} />;
  if (form === "collection") return <Layers size={size} aria-hidden className={className} />;
  return <SectionGlyph kind={kind} size={size} className={className} />;
}

/** A section's icon. */
export function SectionGlyph({ kind, size = 14, className }: { kind: ResourceKind; size?: number; className?: string }) {
  if (kind === "plugin") return <Puzzle size={size} aria-hidden className={className} />;
  if (kind === "extension") return <Blocks size={size} aria-hidden className={className} />;
  return <AppWindow size={size} aria-hidden className={className} />;
}

/** An item's light: a program's own glow, an add-on's category tint (RGB channels). */
export function itemTint(item: CatalogItem): string {
  return item.kind === "program" ? programTint[item.programId] : categories[item.category].tint;
}

/** An item's icon: a program's tile, or an add-on's monogram in its tint. */
export function ItemIcon({ item, size }: { item: CatalogItem; size: number }) {
  return item.kind === "program" ? <AppTile code={item.code} size={size} /> : <AppTile mark={item.mark} tint={itemTint(item)} size={size} />;
}

const kindForms = {
  plugin: ["плагин", "плагина", "плагинов"],
  extension: ["расширение", "расширения", "расширений"],
} as const;

/** «2 плагина», «17 плагинов», «1 расширение». */
export function countOf(n: number, kind: "plugin" | "extension"): string {
  return `${n} ${pluralRu(n, kindForms[kind])}`;
}

/** The line under an item's name: what a program is for, how big a module or a collection is, an add-on's category. */
export function subtitle(item: CatalogItem): string {
  if (item.kind === "program") return item.role;
  if (item.form === "collection") return countOf(item.children.length, item.kind);
  if (item.form === "module") return countOf(item.contents?.length ?? 0, "plugin");
  return categories[item.category].label;
}

/** «After Effects 2026», several joined. */
export function compatText(compat: Compat[]): string {
  return compat.map((c) => `${programName[c.program]} ${c.year}`).join(", ");
}

/** The Windows logo: four tiles. */
function WindowsGlyph({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden className={className} fill="currentColor">
      <path d="M1 2.6 6.7 1.8v5.6H1ZM7.5 1.7 15 .6v6.8H7.5ZM1 8.2h5.7v5.6L1 13ZM7.5 8.2H15V15l-7.5-1.1Z" />
    </svg>
  );
}

export function OsGlyph({ os, size = 14, className }: { os: OS; size?: number; className?: string }) {
  return os === "win" ? <WindowsGlyph size={size} className={className} /> : <Apple size={size + 1} className={className} aria-hidden />;
}
