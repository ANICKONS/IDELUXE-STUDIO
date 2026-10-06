import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { routes } from "@/config/routes";

/**
 * Placeholder for pages that are planned but not built yet: the landing links to them, so a visitor
 * gets a styled "in the render queue" screen instead of a 404. Replace the page file when it's ready.
 */
export function ComingSoon({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description: React.ReactNode;
  /** Extra buttons next to «На главную». */
  actions?: React.ReactNode;
  /** Content under the card (e.g. the pack card on /pricing). */
  children?: React.ReactNode;
}) {
  return (
    <section className="px-4 pt-32 pb-8 sm:pt-40">
      <div className="glass mx-auto max-w-2xl animate-fade-up rounded-[2rem] p-8 text-center sm:p-12">
        <p className="font-mono text-xs tracking-[0.2em] text-accent-soft">RENDER QUEUE · В РАБОТЕ</p>
        <h1 className="mt-5 font-display text-3xl font-semibold text-balance sm:text-4xl">{title}</h1>
        <p className="mx-auto mt-4 max-w-lg leading-relaxed text-muted">{description}</p>

        {/* A render progress bar that never quite finishes */}
        <div aria-hidden className="mx-auto mt-8 h-1.5 max-w-sm overflow-hidden rounded-full bg-white/[0.07]">
          <div className="h-full w-[72%] rounded-full bg-gradient-to-r from-accent-strong via-accent to-pink" />
        </div>

        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {actions}
          <Link href={routes.home} className="btn btn-glass btn-md">
            <ArrowLeft size={16} /> На главную
          </Link>
        </div>
      </div>
      {children && <div className="mx-auto mt-6 max-w-5xl">{children}</div>}
    </section>
  );
}
