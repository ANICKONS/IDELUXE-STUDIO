import { ArrowUpRight, Quote, Star } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { reviewExcerpt, topicLabel, type Review } from "@/content/reviews";
import { formatMonth } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Stars out of five: lit for the rating, the rest as faint outlines. */
export function Stars({ value, size = 15, className }: { value: number; size?: number; className?: string }) {
  return (
    <span role="img" aria-label={`Оценка ${value} из 5`} className={cn("inline-flex items-center gap-0.5", className)}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} size={size} aria-hidden className={i <= value ? "fill-accent text-accent" : "text-white/20"} strokeWidth={i <= value ? 0 : 1.5} />
      ))}
    </span>
  );
}

/** «Монтажёр клипов · сентябрь 2026». */
const byline = (r: Review) => [r.role, r.date && formatMonth(r.date)].filter(Boolean).join(" · ");

/** «Пример»: marks the layout's examples (content/reviews.ts → sample), never seen in production. */
function SampleMark({ className }: { className?: string }) {
  return (
    <span
      className={cn("rounded-full border border-dashed border-accent/45 bg-ink-950/80 px-2 py-0.5 text-[11px] font-semibold text-accent-soft", className)}
      title="Пример из content/reviews.ts: в продакшене не показывается"
    >
      Пример
    </span>
  );
}

/**
 * A review in full (the «Отзывы» block): its stars and what it's about, the text, who wrote it and
 * where it was published. A featured one (`featured`) is lit warm, with a large quote mark.
 */
export function ReviewCard({ review: r, className }: { review: Review; className?: string }) {
  return (
    <figure className={cn("glass relative flex h-full flex-col rounded-[1.75rem] p-6 sm:p-7", r.featured && "plan-featured", className)}>
      {r.featured && <Quote aria-hidden size={46} className="pointer-events-none absolute top-5 right-6 text-accent/25" fill="currentColor" strokeWidth={0} />}
      {r.sample && <SampleMark className="absolute -top-2.5 left-6" />}

      {(r.rating || r.about) && (
        <div className={cn("flex flex-wrap items-center gap-2.5", r.featured && "pr-12")}>
          {r.rating && <Stars value={r.rating} />}
          {r.about && (
            <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-0.5 text-xs font-semibold text-fg/80">{topicLabel[r.about]}</span>
          )}
        </div>
      )}

      <blockquote className={cn("mb-6 text-pretty text-fg/90", r.rating || r.about ? "mt-4" : "", r.featured ? "text-[16.5px] leading-relaxed" : "text-[15px] leading-relaxed")}>
        <p>{r.text}</p>
      </blockquote>

      {/* At the card's foot: in a row of cards the authors line up whatever the text's length */}
      <figcaption className="mt-auto flex items-center gap-3 border-t border-white/[0.07] pt-5">
        <Avatar name={r.name} src={r.avatar} size={40} />
        <span className="min-w-0 flex-1 leading-tight">
          <span className="block truncate text-[14.5px] font-semibold text-fg">{r.name}</span>
          {byline(r) && <span className="mt-1 block truncate text-[12.5px] text-dim">{byline(r)}</span>}
        </span>
        {r.link && (
          <a
            href={r.link}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Отзыв: ${r.name}, открыть источник`}
            className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[12.5px] font-semibold text-accent-soft transition hover:text-fg"
          >
            Источник <ArrowUpRight size={14} aria-hidden />
          </a>
        )}
      </figcaption>
    </figure>
  );
}

/**
 * A short review on the running strip in «Обо мне», compact so the card stays low: the avatar,
 * then who and the stars, and under them one line of the review.
 */
export function ReviewChip({ review: r }: { review: Review }) {
  return (
    // Plain blocks, not a figure: the strip is decorative (the full reviews are in «Отзывы»)
    // As wide as its line (up to 34rem), like the clients' pills above: short reviews fit whole
    <div className="glass-soft relative flex w-max max-w-[34rem] min-w-[17rem] items-center gap-3 rounded-2xl py-3 pr-4 pl-3">
      <Avatar name={r.name} src={r.avatar} size={34} />
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-[12.5px] leading-tight">
          <span className="min-w-0 truncate">
            <span className="font-semibold text-fg">{r.name}</span>
            {r.role && <span className="text-dim"> · {r.role}</span>}
          </span>
          {r.sample && <SampleMark className="shrink-0 py-0 text-[10.5px]" />}
          {r.rating && <Stars value={r.rating} size={11} className="ml-auto shrink-0" />}
        </p>
        <p className="mt-1 truncate text-[13.5px] leading-snug text-fg/90">«{reviewExcerpt(r, 70)}»</p>
      </div>
    </div>
  );
}
