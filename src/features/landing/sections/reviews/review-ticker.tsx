import { ReviewChip } from "@/features/landing/sections/reviews/review-card";
import type { Review } from "@/content/reviews";
import { cn } from "@/lib/utils";

/** At least this many chips in one pass, so the strip never shows its end on a wide card. */
const MIN_PASS = 5;

/**
 * The reviews as a running strip (in «Обо мне», under the clients' one): short lines drifting the
 * other way and slower, pausing under the pointer. Decorative for assistive tech — the same reviews
 * are read in full in the «Отзывы» block, which the card links to. The pass is repeated so it's
 * always wider than the card, then doubled for a seamless loop (marquee: −50 %); each chip carries
 * its gap as padding, so the loop lands exactly on the next pass.
 */
export function ReviewTicker({ reviews, className }: { reviews: Review[]; className?: string }) {
  if (!reviews.length) return null;
  const pass = Array.from({ length: Math.ceil(MIN_PASS / reviews.length) }, () => reviews).flat();
  return (
    <div aria-hidden className={cn("relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]", className)}>
      <ul className="flex w-max animate-marquee-back hover:[animation-play-state:paused]">
        {[...pass, ...pass].map((r, i) => (
          <li key={`${r.name}-${i}`} className="pr-3">
            <ReviewChip review={r} />
          </li>
        ))}
      </ul>
    </div>
  );
}
