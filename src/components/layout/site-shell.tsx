import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header/header";
import { MAIN_ID } from "@/components/layout/layout-ids";
import { SpotlightTracker } from "@/components/ui/spotlight-tracker";
import { Backdrop } from "@/features/backdrop";
import { ChatWidget } from "@/features/chat";
import { PageDecor } from "@/features/decor";
import type { SessionUser } from "@/types/session";

/**
 * Page chrome shared by every page: space backdrop, floating header, decor, footer, assistant.
 * If some future pages need another shell (e.g. a bare auth screen), move this into a route
 * group layout: app/(site)/layout.tsx.
 */
export function SiteShell({ user = null, children }: { user?: SessionUser | null; children: React.ReactNode }) {
  return (
    <>
      <a
        href={`#${MAIN_ID}`}
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-full focus:bg-accent-strong focus:px-4 focus:py-2"
      >
        Перейти к содержимому
      </a>
      <Backdrop />
      <SpotlightTracker />
      <Header user={user} />
      {/* overflow-x-clip: decorative glows can't cause sideways scroll; unlike `hidden` it keeps position: sticky working */}
      <main id={MAIN_ID} className="relative overflow-x-clip">
        <PageDecor />
        {children}
      </main>
      <Footer />
      <ChatWidget />
    </>
  );
}
