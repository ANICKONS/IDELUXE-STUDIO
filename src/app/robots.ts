import type { MetadataRoute } from "next";
import { env } from "@/config/env";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/login"] }],
    sitemap: `${env.siteUrl}/sitemap.xml`,
  };
}
