import { Sparkles } from "lucide-react";
import { EditorMock } from "@/features/landing/sections/hero/editor/editor-mock";
import { StatCounter } from "@/features/landing/sections/hero/stat-counter";
import { heroDecor } from "@/features/landing/decor";
import { Decor3D } from "@/features/decor";
import { landingAnchors } from "@/config/routes";
import { packStats } from "@/content/pack";

/**
 * First screen. On desktop everything fits the screen at the very top of the page (where
 * «Главная» and the logo lead, the header in its full state): the headline, a one-line lead, the
 * editor window in the middle and the pack's numbers with a little air below them. The editor's
 * width follows the screen height (see below); on short screens it also hides a few secondary
 * panels (editor-mock.tsx → `short:`). The showreel opens from its monitor.
 */
export function HeroSection() {
  return (
    <section id={landingAnchors.top} className="relative isolate px-4 pt-28 sm:pt-32 lg:pt-[5.5rem] lg:pb-[clamp(1.25rem,3svh,2.5rem)]">
      {/* 3D objects float behind the content */}
      <Decor3D items={heroDecor} className="-z-[5]" />

      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <span className="eyebrow arrive sm:hidden">
            <Sparkles size={12} /> Туториалы и материалы для монтажа
          </span>
          {/* Two lines on desktop; the size follows the screen height, so short screens keep room for the editor */}
          <h1 className="arrive mx-auto mt-6 max-w-5xl font-display text-[2.35rem] leading-[1.05] font-semibold tracking-tight text-balance [--i:1] sm:mt-0 sm:text-6xl lg:text-[clamp(2.5rem,5.4svh,4.25rem)]">
            Монтаж, который цепляет <span className="text-gradient">с первого кадра</span>
          </h1>
          {/* One line on desktop: it costs the editor no width */}
          <p className="arrive mx-auto mt-5 max-w-2xl text-base leading-relaxed text-pretty text-muted [--i:2] sm:text-lg lg:mt-[clamp(0.5rem,1.3svh,0.875rem)] lg:max-w-none lg:text-[clamp(0.95rem,1.85svh,1.0625rem)] lg:leading-normal">
            Туториалы по <span className="text-fg">After Effects, Premiere Pro и Vegas Pro</span>, пак с тысячами футажей, пресетов и звуков
            и ИИ-ассистент по монтажу 24/7.
          </p>
        </div>

        {/* The window is as wide as the row of numbers. Desktop: so that everything fits the first
            screen, only its program monitor follows the screen height (--editor-monitor, the width
            of its column; the side panels take the rest — editor-mock.tsx). The headline, the lead
            and the gaps scale with the height too; fitted on 1280×720 … 1920×1200 */}
        <div className="relative mt-10 lg:mt-[clamp(1rem,2.6svh,2rem)] lg:[--editor-monitor:min(max(15rem,calc(134svh_-_825px)),calc(100%_-_442px))]">
          <div
            aria-hidden
            className="arrive absolute -inset-x-10 -top-10 -bottom-16 -z-10 rounded-[3rem] bg-[radial-gradient(ellipse_at_50%_40%,rgb(var(--rgb-frost)/0.14),transparent_65%)] blur-2xl [--i:3]"
          />
          {/* Platform the editor hovers above: a light pool and two breathing rings (flat, not tilted);
              comes in together with the window */}
          <div aria-hidden className="arrive pointer-events-none absolute inset-x-0 -bottom-10 -z-10 h-20 [--i:3]">
            <div className="absolute top-1/2 left-1/2 h-[180%] w-[118%] -translate-x-1/2 -translate-y-1/2 rounded-[50%] bg-[radial-gradient(closest-side,rgb(var(--rgb-accent)/0.2),rgb(var(--rgb-accent)/0.05)_60%,transparent)] blur-xl" />
            <div className="absolute top-0 left-1/2 h-full w-[106%] animate-pedestal rounded-[50%] border border-accent/45 shadow-[0_0_34px_rgb(var(--rgb-accent)/0.3),inset_0_0_26px_rgb(var(--rgb-accent)/0.2)]" />
            <div className="absolute top-[22%] left-1/2 h-[56%] w-[94%] animate-pedestal rounded-[50%] border border-frost/30 shadow-[0_0_20px_rgb(var(--rgb-frost)/0.2)] [animation-delay:-2.5s]" />
          </div>
          {/* The showreel plays in the program monitor; the player flies out of it.
              hero-tilt: stands tilted back on the platform, straightens up as you scroll to it. */}
          <div className="hero-tilt">
            <EditorMock className="arrive [--i:3]" />
          </div>
        </div>

        {/* `arrive` on each glass card, not on the grid: an animated parent would switch their blur off */}
        <dl className="mx-auto mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:mt-[clamp(1.25rem,3svh,2.25rem)]">
          {packStats.map((s, i) => (
            <div
              key={s.label}
              className="glass arrive rounded-3xl px-5 py-5 text-center lg:py-[clamp(0.75rem,1.7svh,1.25rem)]"
              style={{ "--i": 4 + i } as React.CSSProperties}
            >
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
