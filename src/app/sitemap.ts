import type { MetadataRoute } from "next";
import { env } from "@/config/env";
import { routes } from "@/config/routes";

/** Public pages. Add new ones here when they replace their placeholders. */
const pages = [routes.home, routes.pricing, routes.learn, routes.resources, routes.legal.offer, routes.legal.privacy];

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.map((path) => ({
    url: `${env.siteUrl}${path === routes.home ? "" : path}`,
    changeFrequency: path === routes.home ? "weekly" : "monthly",
    priority: path === routes.home ? 1 : 0.6,
  }));
}
