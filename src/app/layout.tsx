import type { Metadata, Viewport } from "next";
import "./globals.css";
import { fontVariables } from "@/app/fonts";
import { SiteShell } from "@/components/layout/site-shell";
import { env } from "@/config/env";
import { site } from "@/config/site";

const title = `${site.name} — туториалы и материалы для монтажа`;

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: { default: title, template: `%s · ${site.name}` },
  description: site.description,
  openGraph: {
    type: "website",
    locale: site.locale,
    siteName: site.name,
    title,
    description: site.description,
    images: [{ url: "/videos/showreel.jpg", width: 1280, height: 720, alt: "Шоурил IDELUXE" }],
  },
};

export const viewport: Viewport = {
  themeColor: site.themeColor,
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // data-scroll-behavior: Next turns the CSS smooth scrolling off while switching pages (new page
    // opens at the top instantly); anchor jumps within the page stay smooth.
    // suppressHydrationWarning: the preloader's inline script sets data-boot before React loads.
    <html lang="ru" data-scroll-behavior="smooth" className={fontVariables} suppressHydrationWarning>
      <body>
        <SiteShell>{children}</SiteShell>
      </body>
    </html>
  );
}
