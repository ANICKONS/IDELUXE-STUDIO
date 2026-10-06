import Link from "next/link";
import { ArrowRight, Infinity as InfinityIcon, Play, ShieldCheck, Sparkles } from "lucide-react";
import { EditorMock } from "@/features/landing/sections/hero/editor/editor-mock";
import { StatCounter } from "@/features/landing/sections/hero/stat-counter";
import { heroDecor } from "@/features/landing/decor";
import { HERO_REEL_ORIGIN, ReelButton } from "@/features/reel";
import { Decor3D } from "@/features/decor";
import { reels } from "@/config/media";
import { landingAnchors, routes } from "@/config/routes";
import { packStats } from "@/content/pack";
import { formatClock } from "@/lib/format";

export function HeroSection() {
  return (
    // id="top": the very top (logo link). The «Главная» tab targets the #home anchor at the editor below.
    <section id={landingAnchors.top} className="relative isolate px-4 pt-32 sm:pt-40 lg:pt-36">
      {/* 3D objects float behind the content */}
      <Decor3D items={heroDecor} className="-z-[5]" />

      <div className="mx-auto max-w-6xl">
        <div className="relative mx-auto max-w-3xl text-center">
          <span className="eyebrow animate-fade-up sm:hidden">
            <Sparkles size={12} /> Туториалы и материалы для монтажа
          </span>

          <h1 className="mt-6 animate-fade-up font-display text-[2.35rem] leading-[1.05] font-semibold tracking-tight text-balance [animation-delay:80ms] sm:mt-0 sm:text-6xl lg:text-7xl">
            Монтаж, который <span className="text-gradient">цепляет с первого кадра</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl animate-fade-up text-base leading-relaxed text-muted [animation-delay:160ms] sm:text-lg">
            Туториалы IDELUXE с разбором эффектов в After Effects, Premiere Pro и Vegas Pro, пак с тысячами футажей, пресетов и
            звуков и ИИ-ассистент, который отвечает на вопросы по монтажу 24/7.
          </p>

          <div className="mt-9 flex animate-fade-up flex-col items-center justify-center gap-3 [animation-delay:240ms] sm:flex-row">
            <Link href={routes.pricing} className="btn btn-primary btn-lg w-full sm:w-auto">
              Выбрать тариф <ArrowRight size={18} />
            </Link>
            <ReelButton reel="showreel" origin={`#${HERO_REEL_ORIGIN}`} className="btn btn-glass btn-lg w-full sm:w-auto">
              <Play size={16} className="fill-current" /> Смотреть шоурил
              <span className="font-mono text-xs text-dim">{formatClock(reels.showreel.duration)}</span>
            </ReelButton>
          </div>

          <ul className="mt-7 flex animate-fade-up flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-dim [animation-delay:320ms]">
            <li className="inline-flex items-center gap-1.5">
              <InfinityIcon size={15} className="text-accent" /> Пожизненный доступ
            </li>
            <li className="inline-flex items-center gap-1.5">
              <ShieldCheck size={15} className="text-accent" /> Безопасная оплата ЮKassa
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Sparkles size={15} className="text-accent" /> Обновления включены
            </li>
          </ul>
        </div>

        {/* On desktop the editor's width follows the screen height, so the whole window fits under the
            header (its height ≈ 0.49 × width + 160 px, solved for 100svh − 104 px). */}
        <div className="relative mx-auto mt-12 max-w-6xl animate-fade-up [animation-delay:380ms] lg:max-w-[clamp(44rem,calc(204svh-540px),72rem)]">
          <div
            aria-hidden
            className="absolute -inset-x-10 -top-10 -bottom-16 -z-10 rounded-[3rem] bg-[radial-gradient(ellipse_at_50%_40%,rgb(107_91_255/0.35),transparent_65%)] blur-2xl"
          />
          {/* «Главная» anchor. The jump puts this point 24 px above the screen's bottom edge:
              - editor + stats row (≈ 9.5rem with its margin) fit under the header → the anchor is at the stats' bottom,
                so the whole editor and the stats are on screen, with the buttons above;
              - they don't fit → the anchor moves up so the editor's top lands right under the header.
              (top: 100% = editor height; 100svh − 7rem = screen minus header space and bottom gap.) */}
          <span
            id={landingAnchors.home}
            aria-hidden
            className="pointer-events-none absolute left-0 h-px w-px"
            style={{ top: "calc(100% + min(9.5rem, 100svh - 7rem - 100%))", scrollMarginTop: "calc(100svh - 1.5rem)" }}
          />
          {/* Platform the editor hovers above: a light pool and two breathing rings (flat, not tilted) */}
          <div aria-hidden className="pointer-events-none absolute inset-x-0 -bottom-10 -z-10 h-20">
            <div className="absolute top-1/2 left-1/2 h-[180%] w-[118%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgb(107_91_255/0.42),rgb(107_91_255/0.1)_60%,transparent)] blur-xl" />
            <div className="absolute top-0 left-1/2 h-full w-[106%] animate-pedestal rounded-[50%] border border-accent/60 shadow-[0_0_34px_rgb(143_128_255/0.6),inset_0_0_26px_rgb(143_128_255/0.4)]" />
            <div className="absolute top-[22%] left-1/2 h-[56%] w-[94%] animate-pedestal rounded-[50%] border border-pink/40 shadow-[0_0_20px_rgb(233_168_255/0.35)] [animation-delay:-2.5s]" />
          </div>
          {/* The showreel plays in the program monitor; the player flies out of it.
              hero-tilt: stands tilted back on the platform, straightens up as you scroll to it. */}
          <div className="hero-tilt">
            <EditorMock />
          </div>
        </div>

        <dl className="mx-auto mt-10 grid max-w-6xl grid-cols-2 gap-3 sm:grid-cols-4 lg:mt-12">
          {packStats.map((s) => (
            <div key={s.label} className="glass reveal rounded-3xl px-5 py-5 text-center">
              <dt className="sr-only">{s.label}</dt>
              <dd>
                <span className="block font-display text-2xl font-semibold text-fg sm:text-3xl">
                  <StatCounter value={s.value} suffix={s.suffix} />
                </span>
                <span className="mt-1 block text-sm text-muted">{s.label}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
