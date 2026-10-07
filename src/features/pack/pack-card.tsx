import { Check } from "lucide-react";
import { packStats } from "@/content/pack";
import { plans, type OneTimePlan } from "@/content/plans";
import { formatNumber, formatRub } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * IDX PACK on the landing («Обо мне», under the «Как устроен IDX PACK» video): what's inside, the
 * price and what the purchase means. The full choice of plans is on /pricing.
 */
export function PackCard({
  footer,
  titleAs: Title = "h3",
  className,
}: {
  footer?: React.ReactNode;
  titleAs?: "h2" | "h3";
  /** E.g. `reveal`: put effects with opacity/filter on the card itself, not on a wrapper (the glass would lose its blur). */
  className?: string;
}) {
  const pack = plans.pack as OneTimePlan;

  return (
    <article className={cn("glass flex flex-col rounded-[2rem] p-7", className)}>
      <header>
        <div className="flex items-start gap-2">
          <Title className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{pack.title}</Title>
          <span className="mt-1 rounded-md border border-accent/40 px-1.5 py-0.5 font-mono text-[10px] text-accent-soft">Ae</span>
        </div>
        <p className="mt-2 text-xs text-accent-soft/80">{pack.tagline}</p>
      </header>

      <ul className="mt-7 space-y-1 font-display text-lg text-fg sm:text-xl">
        {packStats.map((s) => (
          <li key={s.label}>
            {formatNumber(s.value)}
            {s.suffix} <span className="text-muted">{s.label}</span>
          </li>
        ))}
      </ul>

      <ul className="mt-6 space-y-2 text-[15px] text-muted">
        <li className="flex gap-2.5">
          <Check size={17} className="mt-0.5 shrink-0 text-accent" aria-hidden />
          Шаблоны и материалы для проектов
        </li>
        <li className="flex gap-2.5">
          <Check size={17} className="mt-0.5 shrink-0 text-accent" aria-hidden />
          Обновления пака бесплатно
        </li>
      </ul>

      <div className="mt-auto pt-8">
        <span className="font-display text-3xl font-semibold text-fg">{formatRub(pack.priceRub)}</span>
        <p className="mt-1 text-xs text-dim">{pack.note}</p>
        {footer && <div className="mt-6">{footer}</div>}
      </div>
    </article>
  );
}
