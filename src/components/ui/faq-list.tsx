import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Questions and answers as a native <details> accordion: accessible and works without JavaScript.
 * One `name` per list → opening an answer closes the others. Used by the landing's FAQ and /pricing.
 * `reveal` sits on each glass card itself: on a parent its opacity/filter would cut the glass off
 * from the page behind it (no blur).
 */
export function FaqList({
  items,
  name,
  openFirst = true,
  className,
  summaryClassName,
}: {
  items: { q: string; a: string }[];
  name: string;
  openFirst?: boolean;
  className?: string;
  /** Extra classes for each question row (e.g. roomier rows on tall screens). */
  summaryClassName?: string;
}) {
  return (
    <ul className={cn("space-y-3", className)}>
      {items.map((item, i) => (
        <li key={item.q}>
          <details name={name} className="disclosure glass reveal group rounded-3xl" open={openFirst && i === 0}>
            <summary
              className={cn(
                "flex cursor-pointer list-none items-center justify-between gap-4 rounded-3xl px-6 py-5 text-left font-semibold text-fg [&::-webkit-details-marker]:hidden",
                summaryClassName,
              )}
            >
              <span>{item.q}</span>
              <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-open:rotate-180">
                <ChevronDown size={16} />
              </span>
            </summary>
            {/* disclosure-body: slides open and closed (components.css) */}
            <div className="disclosure-body">
              <p className="px-6 pb-6 leading-relaxed text-muted">{item.a}</p>
            </div>
          </details>
        </li>
      ))}
    </ul>
  );
}
