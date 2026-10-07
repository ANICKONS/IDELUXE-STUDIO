import type { ReactNode } from "react";
import { LogoMark } from "@/components/icons";

/**
 * The glass card every auth screen lives in: sign-in and sign-up (auth-form.tsx), confirming an
 * address, setting a new password. One place for the light falling from above, the mark and the
 * heading, so the screens can't drift apart.
 */
export function AuthCard({
  title,
  lead,
  /** Changing it replays the heading's entrance (switching sign-in ↔ sign-up). */
  titleKey,
  children,
}: {
  title: string;
  lead: ReactNode;
  titleKey?: string;
  children: ReactNode;
}) {
  return (
    <div className="glass arrive relative w-full max-w-[26rem] rounded-[2rem] p-7 sm:p-9">
      {/* Light falling on the card from above, and a bright seam on its top edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-44 rounded-t-[inherit] bg-[radial-gradient(70%_100%_at_50%_0%,rgb(var(--rgb-accent)/0.1),transparent)]"
      />
      <div aria-hidden className="pointer-events-none absolute inset-x-14 -top-px h-px bg-gradient-to-r from-transparent via-accent-soft/70 to-transparent" />

      <div className="text-center">
        <div className="relative mx-auto w-fit">
          <span aria-hidden className="absolute -inset-3 rounded-full bg-accent-strong/30 blur-xl" />
          <LogoMark size={52} className="relative" />
        </div>
        <p className="mt-5 font-mono text-[10px] tracking-[0.2em] text-dim uppercase">IDELUXE · Личный кабинет</p>
        {/* Re-mounts when titleKey changes, so the new title glides in */}
        <div key={titleKey} className="animate-fade-up">
          <h1 className="mt-3 font-display text-[1.65rem] leading-tight font-semibold">{title}</h1>
          <p className="mx-auto mt-2 max-w-[19rem] text-sm leading-relaxed text-muted">{lead}</p>
        </div>
      </div>

      {children}
    </div>
  );
}
