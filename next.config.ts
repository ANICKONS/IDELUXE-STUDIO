import type { NextConfig } from "next";

const production = process.env.NODE_ENV === "production";
/** Videos/posters may come from a CDN (NEXT_PUBLIC_MEDIA_URL): allow its origin for media and images. */
const mediaOrigin = (() => {
  try {
    return process.env.NEXT_PUBLIC_MEDIA_URL ? new URL(process.env.NEXT_PUBLIC_MEDIA_URL).origin : "";
  } catch {
    return "";
  }
})();

/*
 * Content-Security-Policy. Scripts: 'unsafe-inline' is needed while the pages stay static — Next
 * inlines its RSC payload and the preloader has an inline boot script; a strict nonce policy would
 * make every page dynamic (README → «Безопасность»). Everything else is locked to this origin:
 * no foreign scripts, frames, plugins, form targets or <base> tricks.
 * Production only: the dev server needs eval and a websocket for hot reload.
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${mediaOrigin}`.trim(),
  `media-src 'self' blob: ${mediaOrigin}`.trim(),
  "font-src 'self'",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
  // Pages opened from here (all external links have rel=noopener) can't reach back into this window
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-site" },
  ...(production
    ? [
        { key: "Content-Security-Policy", value: csp },
        // HTTPS only from now on (the site must be served over HTTPS in production)
        { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
      ]
    : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // The project may sit inside another project's folder (e.g. next to v4): pin the root,
  // so Next doesn't pick the parent's lockfile as the workspace root.
  turbopack: { root: __dirname },
  outputFileTracingRoot: __dirname,
  async headers() {
    return [
      { source: "/(.*)", headers: securityHeaders },
      // Videos, posters and decor never change under the same name (decor bumps a ?v= after
      // re-rendering): let browsers keep them for a week.
      {
        source: "/:dir(videos|decor)/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
    ];
  },
};

export default nextConfig;
