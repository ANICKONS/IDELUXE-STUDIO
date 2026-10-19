import type { MetadataRoute } from "next";
import { env } from "@/config/env";
import { lessonHref, routes } from "@/config/routes";
import { tutorials } from "@/content/tutorials";

/** Public pages. Add new ones here when they replace their placeholders. */
const pages = [routes.home, routes.pricing, routes.learn, routes.resources, routes.legal.offer, routes.legal.privacy];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...pages.map((path) => ({
      url: `${env.siteUrl}${path === routes.home ? "" : path}`,
      changeFrequency: path === routes.home ? ("weekly" as const) : ("monthly" as const),
      priority: path === routes.home ? 1 : 0.6,
    })),
    // Every lesson has a public page (a locked one shows what it's about and what opens it)
    ...tutorials.map((t) => ({ url: `${env.siteUrl}${lessonHref(t.slug)}`, changeFrequency: "monthly" as const, priority: 0.5 })),
  ];
}
