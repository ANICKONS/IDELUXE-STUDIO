/**
 * Public environment variables (safe for the browser bundle).
 * Every integration is optional: without a key the related feature switches to a safe
 * "not configured" mode instead of crashing the site.
 * Server-only secrets live in src/config/env.server.ts.
 */
export const env = {
  siteUrl: (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, ""),
  /** CDN for the landing videos (files are looked up in <MEDIA_URL>/videos/). Empty → /public/videos. */
  mediaUrl: (process.env.NEXT_PUBLIC_MEDIA_URL ?? "").replace(/\/$/, ""),
};
