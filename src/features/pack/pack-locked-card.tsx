import { Lock } from "lucide-react";
import { TelegramIcon } from "@/components/icons";
import { site } from "@/config/site";
import { products } from "@/content/pack";
import { cn } from "@/lib/utils";

/** Widths of the blurred "lines" in the preview: the shape of a pack card, without real content. */
const previewRows = ["w-40", "w-48", "w-36", "w-44"];

/**
 * IDX PACK 3D — not on sale yet. The card shows the outline of a pack card under a heavy blur,
 * with a lock and a «Скоро» badge over it, and points to the Telegram channel for the launch news.
 * `compact` — a short strip under IDX PACK on the landing; the full card sits next to it on /pricing.
 * When the pack launches: set `available: true` in content/pack.ts and show a PackCard instead.
 */
export function PackLockedCard({
  compact = false,
  titleAs: Title = "h3",
  className,
}: {
  compact?: boolean;
  titleAs?: "h2" | "h3";
  className?: string;
}) {
  const pack = products["idx-pack-3d"];
  const badge = (
    <span className="rounded-full border border-pink/40 bg-pink/10 px-2.5 py-0.5 font-mono text-[10px] tracking-[0.16em] text-pink uppercase">Скоро</span>
  );
  const lock = (size: "md" | "lg") => (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-2xl border border-accent/35 bg-accent/12 text-accent-soft shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_0_30px_-6px_rgb(143_128_255/0.7)]",
        size === "lg" ? "size-14" : "size-12",
      )}
    >
      <Lock size={size === "lg" ? 22 : 19} />
    </span>
  );
  // A blurred 3D object behind the card: a hint of what the pack is about
  const cube = (cls: string) => (
    // eslint-disable-next-line @next/next/no-img-element -- decorative pre-rendered WebP
    <img src="/decor/cube.webp" alt="" aria-hidden width={618} height={661} loading="lazy" decoding="async" className={cn("pointer-events-none absolute -z-10 select-none", cls)} />
  );

  if (compact) {
    return (
      <article className={cn("glass relative flex items-center gap-4 overflow-hidden rounded-[2rem] p-5 sm:gap-5 sm:p-6", className)}>
        {cube("-top-8 -right-6 w-36 rotate-12 opacity-50 blur-[5px]")}
        {lock("md")}
        <div className="min-w-0 flex-1 lg:flex-none">
          <div className="flex flex-wrap items-center gap-2.5">
            <Title className="font-display text-xl font-bold tracking-tight">{pack.title}</Title>
            {badge}
          </div>
          <p className="mt-1 text-[13px] leading-snug text-muted">{pack.tagline}</p>
        </div>
        {/* Wide strip: the pack's future contents, blurred out */}
        <div aria-hidden className="hidden min-w-0 flex-1 items-center justify-center gap-3 overflow-hidden opacity-55 blur-[5px] select-none lg:flex">
          {previewRows.map((w, i) => (
            <span key={i} className="flex h-10 shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3">
              <span className="h-3 w-10 rounded bg-fg/60" />
              <span className={cn("h-2.5 rounded bg-muted/50", i % 2 ? "w-16" : "w-20")} />
            </span>
          ))}
        </div>
        <a
          href={site.telegram.channel.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-glass btn-sm shrink-0 max-sm:size-10 max-sm:p-0"
          aria-label={`Узнать о запуске ${pack.title} в Telegram`}
        >
          <TelegramIcon size={16} />
          <span className="hidden sm:inline">Узнать о запуске</span>
        </a>
      </article>
    );
  }

  return (
    <article className={cn("glass relative flex h-full min-h-[30rem] flex-col overflow-hidden rounded-[2rem] p-8 sm:p-10", className)}>
      {cube("-top-10 -right-10 w-56 rotate-12 opacity-45 blur-[7px]")}

      {/* The future card, unreadable on purpose */}
      <div aria-hidden className="pointer-events-none flex flex-1 flex-col opacity-60 blur-[6px] select-none">
        <span className="h-9 w-56 rounded-xl bg-fg/70" />
        <span className="mt-3 h-3 w-64 rounded-full bg-accent-soft/40" />
        <div className="mt-8 space-y-3">
          {previewRows.map((w, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="h-5 w-20 rounded-lg bg-fg/60" />
              <span className={cn("h-4 rounded-lg bg-muted/40", w)} />
            </div>
          ))}
        </div>
        <div className="mt-auto pt-10">
          <span className="block h-8 w-44 rounded-xl bg-fg/60" />
          <span className="mt-6 block h-11 w-full rounded-full bg-accent-strong/60" />
        </div>
      </div>

      {/* Over it: lock, name, «Скоро», where to follow the launch */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(60%_50%_at_50%_50%,rgb(4_3_13/0.6),transparent)] p-8 text-center">
        {lock("lg")}
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          <Title className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{pack.title}</Title>
          {badge}
        </div>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-muted">{pack.tagline}</p>
        <a href={site.telegram.channel.url} target="_blank" rel="noopener noreferrer" className="btn btn-glass btn-md mt-7">
          <TelegramIcon size={17} /> Узнать о запуске
        </a>
      </div>
    </article>
  );
}
