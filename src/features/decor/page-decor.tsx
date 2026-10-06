"use client";

import { usePathname } from "next/navigation";
import { Decor3D } from "@/features/decor/decor-3d";
import { pageDecor } from "@/features/decor/presets";
import { routes } from "@/config/routes";

/**
 * Page-wide decor layer for inner pages (lives in <main>, behind the content).
 * The landing places its objects block by block (src/features/landing/decor.ts), so it gets nothing here.
 */
export function PageDecor() {
  const pathname = usePathname();
  if (pathname === routes.home) return null;
  // key: new set of observed nodes when the route changes
  return <Decor3D key={pathname} items={pageDecor} className="-z-10" />;
}
