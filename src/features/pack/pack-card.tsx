import { Check } from "lucide-react";
import { packFeatures, packStats, products } from "@/content/pack";
import { formatNumber, formatRub } from "@/lib/format";
import { cn } from "@/lib/utils";

const appBadges: Record<string, string> = {
  "Adobe After Effects": "Ae",
  "Adobe Premiere Pro": "Pr",
  "Vegas Pro": "V",
};

/**
 * IDX PACK card — mirrors the original IDELUXE PACK artwork.
 * `compact` is used on the landing, the full version on /pricing.
 */
export function PackCard({
  compact = false,
  footer,
  titleAs: Title = "h3",
  className,
}: {
  compact?: boolean;
  footer?: React.ReactNode;
  titleAs?: "h2" | "h3";
  /** E.g. `reveal`: put effects with opacity/filter on the card itself, not on a wrapper (the glass would lose its blur). */
  className?: string;
}) {
  const pack = products["idx-pack"];

  return (
    <article className={cn("glass flex flex-col rounded-[2rem]", compact ? "p-7" : "p-8 sm:p-10", className)}>
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

      <div className="mt-7">
        <p className="text-sm font-semibold text-fg">Туториалы по:</p>
        <ul className="mt-2 space-y-1.5">
          {packFeatures.lessons.map((l) => (
            <li key={l} className="flex items-center gap-2.5 text-[15px] text-muted">
              <span className="inline-flex size-5 items-center justify-center rounded border border-accent/40 font-mono text-[9px] text-accent-soft">
                {appBadges[l]}
              </span>
              {l}
            </li>
          ))}
        </ul>
      </div>

      {!compact && (
        <ul className="mt-7 space-y-3 text-[15px] text-muted">
          <li className="flex gap-3">
            <Check size={18} className="mt-0.5 shrink-0 text-accent" />
            <span>
              Прямые ссылки на скачивание программ
              <span className="block text-xs text-dim">{packFeatures.downloads}</span>
            </span>
          </li>
          <li className="flex gap-3">
            <Check size={18} className="mt-0.5 shrink-0 text-accent" />
            {packFeatures.bonus}
          </li>
          <li className="flex gap-3">
            <Check size={18} className="mt-0.5 shrink-0 text-accent" />
            Разборы эффектов по разделам: VFX, SFX, Motion, переходы, цвет
          </li>
          <li className="flex gap-3">
            <Check size={18} className="mt-0.5 shrink-0 text-accent" />
            ИИ-ассистент по монтажу и поддержка в Telegram
          </li>
        </ul>
      )}

      <div className="mt-auto pt-8">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-display text-lg text-dim line-through decoration-1">
            {formatRub(pack.oldPriceRub)}
            {pack.oldPriceUsd ? ` / ${pack.oldPriceUsd}$` : ""}
          </span>
          <span aria-hidden className="text-dim">→</span>
          {/* compact (landing column is narrower): one size smaller, so the prices stay on one line */}
          <span className={cn("font-display text-3xl font-semibold text-fg", !compact && "sm:text-4xl")}>
            {formatRub(pack.priceRub)}
            {pack.priceUsd ? <span className={cn("text-xl text-muted", !compact && "sm:text-2xl")}> / {pack.priceUsd}$</span> : null}
          </span>
        </div>
        <p className="mt-1 text-xs text-dim">Разовый платёж · пожизненный доступ</p>
        {footer && <div className="mt-6">{footer}</div>}
      </div>
    </article>
  );
}
