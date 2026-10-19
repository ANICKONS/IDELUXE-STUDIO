/**
 * «Ресурсы»: the hub of programs, plugins and extensions (app/resources/page.tsx).
 * The server-only part (which links this account gets) is imported directly from
 * catalog.server.ts, not through this barrel.
 */
export { ResourcesCatalog } from "@/features/resources/catalog";
export type { Catalog } from "@/features/resources/types";
