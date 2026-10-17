import Link from "next/link";
import { ArrowRight, Check, Smartphone, Sprout, Wallet, WandSparkles } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { AppTile } from "@/components/ui/app-tile";
import { landingAnchors, routes } from "@/config/routes";
import { audience } from "@/content/landing";
import { NewYearSnowCap } from "@/features/new-year";

const icons = { sprout: Sprout, phone: Smartphone, wand: WandSparkles } as const;

/**
 * «Для кого» — a menu category: on desktop it takes the whole screen under the header, so after a
 * jump nothing of «Обо мне» or «Платформа» shows.
 *   ┌ heading ───────────────────────────────────────────────┐
 *   │ three audience cards: who, what's for them, where to start │
 *   │ wide «Монтаж как профессия» card                           │
 *   └ (tall screens: the rest of the screen stays over the planet) ┘
 * The blocks keep together (the gap grows with the screen a little, then stops), so there is no
 * hole in the middle of the screen. Phones: everything one after another.
 */
export function AudienceSection() {
  return (
    <section id={landingAnchors.audience} className="section section-screen relative px-4">
      <div className="mx-auto max-w-6xl lg:pb-6">
        <SectionHeading comp="COMP 03" timecode="00:00:48:00" title="Для кого подойдёт" />

        <ul className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3 lg:mt-[clamp(2rem,5svh,3.5rem)]">
          {audience.map((a) => {
            const Icon = icons[a.icon];
            return (
              <li key={a.title} className="glass reveal flex flex-col rounded-[2rem] p-7">
                <div className="flex items-center gap-4">
                  <span className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10 text-accent-soft shadow-[inset_0_1px_0_rgb(255_255_255/0.15)]">
                    <Icon size={22} aria-hidden />
                  </span>
                  <h3 className="font-display text-xl leading-tight font-semibold">{a.title}</h3>
                </div>
                <p className="mt-5 leading-relaxed text-muted">{a.text}</p>
                {/* Short desktop screens (laptops up to 800 px tall) skip the list: the screen keeps
                    the cards and the wide one in view */}
                <ul className="mt-5 mb-6 space-y-2 text-[14px] text-fg/85 lg:[@media(max-height:50rem)]:hidden">
                  {a.points.map((p) => (
                    <li key={p} className="flex gap-2.5">
                      <Check size={16} className="mt-0.5 shrink-0 text-accent" aria-hidden />
                      {p}
                    </li>
                  ))}
                </ul>
                {/* Where to start: pinned to the card's bottom (the list's mb-6 is the least gap), so the three line up */}
                <p className="mt-auto flex items-center justify-between gap-3 border-t border-white/8 pt-4">
                  <span className="font-mono text-[10px] tracking-[0.16em] text-dim uppercase">С чего начать</span>
                  <span className="rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 font-mono text-[10px] tracking-[0.12em] whitespace-nowrap text-accent-soft uppercase">
                    {a.start}
                  </span>
                </p>
              </li>
            );
          })}
        </ul>

        {/* Wide highlighted card. The wrapper is for the New Year snow: the card clips its overflow */}
        <div className="relative mt-5 lg:mt-[clamp(1.25rem,4svh,2.5rem)]">
        <div className="glass reveal relative overflow-hidden rounded-[2rem] p-7 sm:p-9">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[radial-gradient(70%_140%_at_0%_0%,rgb(var(--rgb-accent)/0.16),transparent_60%),radial-gradient(50%_120%_at_100%_100%,rgb(var(--rgb-frost)/0.1),transparent_60%)]"
          />
          <div aria-hidden className="pointer-events-none absolute top-1/2 right-[27%] hidden -translate-y-1/2 rotate-[16deg] opacity-70 xl:block">
            <AppTile code="Pr" size={70} />
          </div>
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.16em] text-accent uppercase">
                <Wallet size={14} /> Монтаж как профессия
              </p>
              <h3 className="mt-3 font-display text-2xl font-semibold sm:text-3xl">Тем, кто хочет зарабатывать на любимом деле</h3>
              <p className="mt-3 leading-relaxed text-muted">
                В разборах — приёмы из реальных коммерческих проектов для артистов и брендов. Повторяй их в своих роликах, собирай
                портфолио и доводи работу до уровня заказчика.
              </p>
            </div>
            <Link href={routes.pricing} className="btn btn-primary btn-lg shrink-0">
              Выбрать тариф <ArrowRight size={18} />
            </Link>
          </div>
        </div>
        {/* New Year theme (features/new-year): snow blown into a heap on the card's left corner; same
            box and scroll entrance (reveal) as the card */}
        <NewYearSnowCap variant="heap" side="left" radius={32} lumps={30} seed={9} overlay className="reveal" />
        </div>
      </div>
    </section>
  );
}
