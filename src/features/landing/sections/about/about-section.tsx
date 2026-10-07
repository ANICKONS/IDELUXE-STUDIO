import Link from "next/link";
import { ArrowRight, Briefcase, Headphones, Play, Wrench } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { PackCard } from "@/features/pack/pack-card";
import { AboutScreen } from "@/features/landing/sections/about/about-screen";
import { ABOUT_REEL_ORIGIN, ReelButton } from "@/features/reel";
import { landingAnchors, routes } from "@/config/routes";
import { approachPillars, clients } from "@/content/landing";

const pillarIcons = { briefcase: Briefcase, wrench: Wrench, headphones: Headphones } as const;
const pillars = approachPillars.map((p) => ({ ...p, icon: pillarIcons[p.icon] }));

/**
 * «Обо мне» (IDELUXE is one person) — a menu category: on desktop it takes the whole screen under the header.
 *   ┌ intro (7 cols) ───────────────┬ floating video (5) ┐
 *   │            (free space grows on tall screens)       │
 *   ├ «Мой подход» + clients (7)    ┼ IDX PACK card (5)  ┤  ← the pack card sits under its own video
 * Phones: intro → video → pack → approach → clients.
 * IDX PACK 3D («Скоро») is shown only on /pricing.
 */
export function AboutSection() {
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
          <div className="flex flex-col lg:col-span-5 lg:col-start-8 lg:row-start-1">
            <PackCard
              className="reveal flex-1"
              footer={
                <Link href={routes.pricing} className="btn btn-primary btn-md w-full">
                  PACK, подписка или всё вместе <ArrowRight size={16} />
                </Link>
              }
            />
          </div>

          <div className="flex min-w-0 flex-col gap-6 lg:col-span-7 lg:col-start-1 lg:row-start-1">
            <div className="glass reveal flex flex-1 flex-col rounded-[2rem] p-7 sm:p-8">
              <h3 className="font-display text-xl font-semibold">Мой подход</h3>
              <p className="mt-3 leading-relaxed text-muted">
                Эффект сам по себе ничего не решает — важно, как он работает на ритм и внимание зрителя. Поэтому в каждом разборе
                показываю не только «что нажать», но и «зачем»: откуда берётся приём и где он уместен.
              </p>
              <ul className="mt-auto grid gap-4 pt-7 sm:grid-cols-3">
                {pillars.map(({ icon: Icon, title, text }) => (
                  <li key={title} className="glass-soft rounded-2xl p-4">
                    <p className="flex items-center gap-2.5 text-sm leading-tight font-semibold text-fg">
                      <Icon size={20} className="shrink-0 text-accent" aria-hidden />
                      {title}
                    </p>
                    <p className="mt-2.5 text-[13px] leading-relaxed text-muted">{text}</p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Clients: one quiet marquee inside a card */}
            <div className="glass reveal overflow-hidden rounded-[2rem] py-7">
              <p className="px-7 font-mono text-[11px] tracking-[0.18em] text-dim uppercase sm:px-8">Опыт работы с</p>
              <ul className="sr-only">
                {clients.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
              <div aria-hidden className="relative mt-5 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
                <ul className="flex w-max animate-marquee gap-3 hover:[animation-play-state:paused]">
                  {[...clients, ...clients].map((name, i) => (
                    <li key={`${name}-${i}`} className="glass-soft rounded-full px-4 py-2 text-sm whitespace-nowrap text-muted">
                      {name}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
