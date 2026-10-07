import { Check, Minus } from "lucide-react";
import { compareColumns, compareGroups, type Access } from "@/content/plans";
import { cn } from "@/lib/utils";

/**
 * What each option opens, row by row (content/plans.ts → compareGroups): a free account, PACK,
 * LITE, PRO, FULL. Phones scroll it sideways, the row names stay pinned on the left (`max-md:sticky`).
 */
export function CompareTable({ className }: { className?: string }) {
  return (
    <div className={cn("glass reveal overflow-hidden rounded-[2rem]", className)}>
      <div className="overflow-x-auto overscroll-x-contain">
        <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
          <caption className="sr-only">Сравнение тарифов IDELUXE</caption>
          <thead>
            <tr className="border-b border-white/8">
              <th scope="col" className="z-10 px-5 py-5 font-normal text-dim max-md:sticky max-md:left-0 max-md:bg-ink-950/90 max-md:backdrop-blur-md sm:px-6">
                <span className="sr-only">Возможность</span>
              </th>
              {compareColumns.map((c) => (
                <th key={c.id} scope="col" className={cn("px-3 py-5 text-center align-bottom", c.id === "full" && "bg-accent/[0.07]")}>
                  <span className={cn("block font-display text-base font-semibold", c.id === "full" ? "text-accent-soft" : "text-fg")}>{c.title}</span>
                  <span className="mt-0.5 block text-xs font-normal whitespace-nowrap text-dim">{c.hint}</span>
                </th>
              ))}
            </tr>
          </thead>
          {compareGroups.map((group) => (
            <tbody key={group.title}>
              <tr>
                {/* Spans every column but FULL's, so its highlighted column runs unbroken */}
                <th
                  scope="colgroup"
                  colSpan={compareColumns.length}
                  className="px-5 pt-6 pb-2 font-mono text-[11px] font-normal tracking-[0.16em] text-accent-soft uppercase sm:px-6"
                >
                  {group.title}
                </th>
                <td aria-hidden className="bg-accent/[0.07]" />
              </tr>
              {group.rows.map((r) => (
                <tr key={r.label} className="border-t border-white/[0.05]">
                  <th scope="row" className="z-10 px-5 py-3.5 font-normal text-muted max-md:sticky max-md:left-0 max-md:bg-ink-950/90 max-md:backdrop-blur-md sm:px-6">
                    {r.label}
                  </th>
                  {compareColumns.map((c) => (
                    <td key={c.id} className={cn("px-3 py-3.5 text-center", c.id === "full" && "bg-accent/[0.07]")}>
                      <Cell value={r.values[c.id]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </div>
  );
}

function Cell({ value }: { value: Access }) {
  if (value === true)
    return (
      <span className="inline-flex size-6 items-center justify-center rounded-full bg-accent/15 text-accent">
        <Check size={14} strokeWidth={2.5} aria-hidden />
        <span className="sr-only">Есть</span>
      </span>
    );
  if (value === false)
    return (
      <span className="inline-flex text-dim/60">
        <Minus size={16} aria-hidden />
        <span className="sr-only">Нет</span>
      </span>
    );
  return <span className="text-[13px] leading-snug text-fg/80">{value}</span>;
}
