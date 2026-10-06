import Link from "next/link";
import { ArrowRight, Smartphone, Sprout, Wallet, WandSparkles } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { AppTile } from "@/components/ui/app-tile";
import { Decor3D } from "@/features/decor";
import { sectionDecor } from "@/features/landing/decor";
import { landingAnchors, routes } from "@/config/routes";
import { audience } from "@/content/landing";

const icons = { sprout: Sprout, phone: Smartphone, wand: WandSparkles } as const;

export function AudienceSection() {
  return (
    <section id={landingAnchors.audience} className="section relative px-4">
      <Decor3D items={sectionDecor.audience} className="-z-10" />
      <div className="mx-auto max-w-6xl">
        <SectionHeading comp="COMP 03" timecode="00:00:48:00" ghost="IDX" title="Для кого подойдёт" />

        <ul className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-3">
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
              </li>
            );
          })}
        </ul>

        {/* Wide highlighted card */}
        <div className="glass reveal relative mt-5 overflow-hidden rounded-[2rem] p-7 sm:p-9">
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[radial-gradient(70%_140%_at_0%_0%,rgb(107_91_255/0.45),transparent_60%),radial-gradient(50%_120%_at_100%_100%,rgb(233_168_255/0.2),transparent_60%)]"
          />
          <div aria-hidden className="pointer-events-none absolute top-1/2 right-[27%] hidden -translate-y-1/2 rotate-[16deg] opacity-70 xl:block">
            <AppTile code="Pr" size={70} />
          </div>
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="max-w-2xl">
              <p className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.16em] text-neon uppercase">
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
      </div>
    </section>
  );
}
