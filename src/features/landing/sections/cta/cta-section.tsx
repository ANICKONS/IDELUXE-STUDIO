import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TelegramIcon } from "@/components/icons";
import { AppTile } from "@/components/ui/app-tile";
import { BackgroundVideo } from "@/components/ui/background-video";
import { Decor3D } from "@/features/decor";
import { sectionDecor } from "@/features/landing/decor";
import { landingVideos } from "@/config/media";
import { routes } from "@/config/routes";
import { site } from "@/config/site";

export function CtaSection() {
  return (
    // Continues the FAQ screen (same menu category), so it sits closer than the usual block gap
    <section className="section relative px-4 [--section-gap:4.5rem]">
      <Decor3D items={sectionDecor.cta} className="-z-10" />
      <div className="glass reveal relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] px-6 py-16 text-center sm:px-12 sm:py-24">
        {/* «бэк», recoloured into the palette.
            -z-20 keeps the video under the glass rim (::before) but above the card background. */}
        <BackgroundVideo video={landingVideos.back} tone="duotone" className="absolute inset-0 -z-20" mediaClassName="opacity-75">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_65%_at_50%_50%,rgb(4_3_13/0.72),rgb(4_3_13/0.3)_100%)]" />
        </BackgroundVideo>
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_50%_0%,rgb(107_91_255/0.3),transparent_70%)]"
        />
        <div aria-hidden className="pointer-events-none absolute -top-6 -left-6 hidden rotate-[-14deg] opacity-70 md:block">
          <AppTile code="Pr" size={96} />
        </div>
        <div aria-hidden className="pointer-events-none absolute -right-4 -bottom-6 hidden rotate-[12deg] opacity-70 md:block">
          <AppTile code="Ae" size={110} />
        </div>

        <p className="font-mono text-[11px] tracking-[0.18em] text-accent-soft uppercase">Render queue · готово к экспорту</p>
        <h2 className="mx-auto mt-5 max-w-3xl font-display text-3xl leading-tight font-semibold text-balance sm:text-5xl">
          Готов смонтировать свой <span className="text-gradient">лучший ролик</span>?
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-muted">
          Открой туториалы, IDX PACK и ассистента уже сегодня. Один платёж — и всё остаётся с тобой навсегда.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href={routes.pricing} className="btn btn-primary btn-lg w-full sm:w-auto">
            Получить доступ <ArrowRight size={18} />
          </Link>
          <a href={site.telegram.personal.url} target="_blank" rel="noopener noreferrer" className="btn btn-glass btn-lg w-full sm:w-auto">
            <TelegramIcon size={18} /> Задать вопрос
          </a>
        </div>
      </div>
    </section>
  );
}
