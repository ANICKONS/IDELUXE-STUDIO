import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header/header";
import { MAIN_ID } from "@/components/layout/layout-ids";
import { SpotlightTracker } from "@/components/ui/spotlight-tracker";
import { Backdrop } from "@/features/backdrop";
import { ChatWidget } from "@/features/chat";
import { BootScript, Preloader } from "@/features/preloader";
import { PageTransitions } from "@/features/transitions";

/**
 * Page chrome shared by every page: first-load preloader, space backdrop, floating header,
 * footer, assistant. Static: whoever is signed in, the header, footer and assistant learn it in
 * the browser (lib/viewer.ts). If some future pages need another shell (e.g. a bare auth screen),
 * move this into a route group layout: app/(site)/layout.tsx (the preloader belongs to the root one).
 */
export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Must come first in <body>: sets html[data-boot] before anything paints */}
      <BootScript />
      <Preloader />
      <a
        href={`#${MAIN_ID}`}
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-full focus:bg-accent-strong focus:px-4 focus:py-2"
      >
        Перейти к содержимому
      </a>
      <Backdrop />
      <PageTransitions />
      <SpotlightTracker />
      <Header />
      {/* overflow-x-clip: decorative glows can't cause sideways scroll; unlike `hidden` it keeps position: sticky working */}
      <main id={MAIN_ID} className="relative overflow-x-clip">
        {children}
      </main>
      <Footer />
      <ChatWidget />
    </>
  );
}
