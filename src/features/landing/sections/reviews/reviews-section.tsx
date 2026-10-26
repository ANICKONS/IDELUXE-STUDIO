import { ArrowUpRight } from "lucide-react";
import { TelegramIcon } from "@/components/icons";
import { SectionHeading } from "@/components/ui/section-heading";
import { Stars } from "@/features/landing/sections/reviews/review-card";
import { ReviewWall } from "@/features/landing/sections/reviews/review-wall";
import { landingAnchors } from "@/config/routes";
import { site } from "@/config/site";
import { publishedReviews } from "@/content/reviews";
import { pluralRu } from "@/lib/format";

/** The average is shown once there are a few ratings to average. */
const MIN_RATED = 3;

/**
 * «Отзывы» before the final card (content/reviews.ts): the heading with the average rating and a
 * way to leave one, then every review as a wall (review-wall.tsx). Not a menu category: the «Обо
 * мне» card links here (#reviews). Without reviews to show the block isn't rendered at all.
 */
export function ReviewsSection() {
  const reviews = publishedReviews;
  if (!reviews.length) return null;
  const rated = reviews.filter((r) => r.rating);
  const average = rated.length >= MIN_RATED ? rated.reduce((sum, r) => sum + (r.rating ?? 0), 0) / rated.length : null;
  const count = `${reviews.length} ${pluralRu(reviews.length, ["отзыв", "отзыва", "отзывов"])}`;

  return (
    <section id={landingAnchors.reviews} className="section relative px-4">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
          <SectionHeading
            comp="COMP 05"
            timecode="00:01:36:00"
            className="max-w-2xl"
            title={
              <>
                Говорят те, кто <span className="text-gradient">уже монтирует</span>
              </>
            }
            description="Монтажёры, блогеры и заказчики — о паке, разборах, ресурсах и совместной работе."
          />

          {/* The rating at a glance and a way to add to it */}
          <div className="glass reveal flex shrink-0 items-center gap-5 self-start rounded-[1.75rem] py-5 pr-6 pl-5 lg:self-auto">
            {average !== null ? (
              <div className="text-center">
                <p className="font-display text-[2.6rem] leading-none font-semibold text-fg tabular-nums">{average.toFixed(1).replace(".", ",")}</p>
                <Stars value={Math.round(average)} size={13} className="mt-2" />
              </div>
            ) : (
              <p className="font-display text-[2.6rem] leading-none font-semibold text-fg tabular-nums">{reviews.length}</p>
            )}
            <div className="border-l border-white/8 pl-5">
              <p className="text-sm text-muted">{average !== null ? `Средняя оценка · ${count}` : count}</p>
              <a
                href={site.telegram.personal.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-soft transition hover:text-fg"
              >
                <TelegramIcon size={14} /> Оставить отзыв <ArrowUpRight size={14} aria-hidden />
              </a>
            </div>
          </div>
        </div>

        <ReviewWall reviews={reviews} className="mt-12" />
      </div>
    </section>
  );
}
