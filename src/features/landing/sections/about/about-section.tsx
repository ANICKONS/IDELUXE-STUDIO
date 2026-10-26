import Link from "next/link";
import { ArrowDown, ArrowRight, Play } from "lucide-react";
import { HashLink } from "@/components/layout/hash-link";
import { SectionHeading } from "@/components/ui/section-heading";
import { PackCard } from "@/features/pack/pack-card";
import { AboutScreen } from "@/features/landing/sections/about/about-screen";
import { ReviewTicker } from "@/features/landing/sections/reviews/review-ticker";
import { NewYearSnowCap } from "@/features/new-year";
import { ReturningOfferPanel } from "@/features/pricing";
import { ABOUT_REEL_ORIGIN, ReelButton } from "@/features/reel";
import { anchorHref, landingAnchors, routes } from "@/config/routes";
import { clients } from "@/content/landing";
import { publishedReviews } from "@/content/reviews";

/**
 * «Обо мне» (IDELUXE is one person) — a menu category: on desktop it takes the whole screen under the header.
 *   ┌ intro (7 cols) ───────────────────┬ floating video (5) ┐
 *   │            (free space grows on tall screens)           │
 *   ├ old pack's offer (7)              ┼ IDX PACK card (5)  ┤  ← the pack card sits under its own video
 *   ├ clients + reviews strips (7)      ┤                    │
 * The offer for those who bought the pack before (content/plans.ts → returningOffer, the same as
 * on /pricing) stands beside the pack card: its price, and next to it the half price for them.
 * Under it, the clients and the reviews (content/reviews.ts) drift past; «Все отзывы» leads to the
 * full ones before the final card.
 * Phones: intro → video → pack → offer → clients and reviews.
 * IDX PACK 3D («Скоро») is shown only on /pricing.
 */
export function AboutSection() {
  const withReviews = publishedReviews.length > 0;
  return (
    <section id={landingAnchors.about} className="section section-screen relative px-4">
      <div className="mx-auto flex max-w-6xl flex-1 flex-col lg:pb-6">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-7">
            <SectionHeading
              comp="COMP 02"
              timecode="00:00:24:00"
              title={
                <>
                  Ремесло, отточенное <span className="text-gradient">на реальных проектах</span>
                </>
              }
              description="IDELUXE — мой никнейм. Я монтажёр и моушн-дизайнер: делаю клипы, рекламу и контент для артистов, брендов и блогеров. Здесь собрал всё, чем пользуюсь сам, — разборы эффектов и пак материалов для работы."
            />
            <p className="reveal mt-6 max-w-xl font-display text-lg text-fg/90">
              Монтаж — это не резать кадры, а <span className="text-glow">создавать эмоции</span>.
            </p>
            <div className="reveal mt-8 flex flex-wrap gap-3">
              <ReelButton reel="about" origin={`#${ABOUT_REEL_ORIGIN}`} className="btn btn-primary btn-md">
                <Play size={15} className="fill-current" /> Как устроен IDX PACK
              </ReelButton>
              <Link href={routes.pricing} className="btn btn-glass btn-md">
                Тарифы <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          {/* The screen's edges dissolve, so on desktop it may spill a little past its column */}
          <div className="lg:col-span-5 lg:-mr-10 lg:-ml-4">
            <AboutScreen />
          </div>
        </div>

        {/* On tall screens the cards sit at the bottom of the screen (mt-auto), never closer than pt-12 */}
        <div className="mt-16 grid grid-cols-1 gap-6 lg:mt-auto lg:grid-cols-12 lg:pt-12">
          <div className="relative flex flex-col lg:col-span-5 lg:col-start-8 lg:row-start-1">
            <PackCard
              className="reveal flex-1"
              footer={
                <Link href={routes.pricing} className="btn btn-primary btn-md w-full">
                  PACK, подписка или всё вместе <ArrowRight size={16} />
                </Link>
              }
            />
            {/* New Year theme (features/new-year): snow draped over the card's corners. The card fills
                this column, so the overlay has its box and the same scroll entrance (reveal) */}
            <NewYearSnowCap variant="draped" radius={32} lumps={12} seed={21} overlay className="reveal" />
          </div>

          {/* justify-end: with the offer switched off (returningOffer.enabled) the clients card still
              lines up with the bottom of the pack card */}
          <div className="flex min-w-0 flex-col justify-end gap-6 lg:col-span-7 lg:col-start-1 lg:row-start-1">
            <ReturningOfferPanel className="reveal flex-1" />

            {/* Clients and reviews: two quiet strips drifting opposite ways inside one card */}
            <div className="glass reveal overflow-hidden rounded-[2rem] py-6">
              <div className="flex items-baseline justify-between gap-4 px-7 sm:px-8">
                <h3 className="font-display text-[15px] font-semibold text-fg">{withReviews ? "Опыт работы и отзывы" : "Опыт работы с"}</h3>
                {withReviews && (
                  <HashLink
                    href={anchorHref(landingAnchors.reviews)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-md text-sm font-semibold text-accent-soft transition hover:text-fg"
                  >
                    Все отзывы <ArrowDown size={15} aria-hidden />
                  </HashLink>
                )}
              </div>
              <ul className="sr-only">
                {clients.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
              <div aria-hidden className="relative mt-4 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
                <ul className="flex w-max animate-marquee hover:[animation-play-state:paused]">
                  {[...clients, ...clients].map((name, i) => (
                    <li key={`${name}-${i}`} className="pr-3">
                      <span className="glass-soft block rounded-full px-4 py-2 text-sm whitespace-nowrap text-muted">{name}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <ReviewTicker reviews={publishedReviews} className="mt-2.5" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
