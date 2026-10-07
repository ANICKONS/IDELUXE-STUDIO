import Link from "next/link";
import { ArrowRight, UserRoundPlus } from "lucide-react";
import { TelegramIcon } from "@/components/icons";
import { AppTile } from "@/components/ui/app-tile";
import { BackgroundVideo } from "@/components/ui/background-video";
import { landingVideos } from "@/config/media";
import { registerHref, routes } from "@/config/routes";
import { site } from "@/config/site";

export function CtaSection() {
  return (
    // Continues the FAQ screen (same menu category), so it sits closer than the usual block gap
    <section className="section relative px-4 [--section-gap:4.5rem]">
      <div className="glass reveal relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] px-6 py-16 text-center sm:px-12 sm:py-24">
        {/* «бэк», recoloured into the palette.
            -z-20 keeps the video under the glass rim (::before) but above the card background. */}
        <BackgroundVideo video={landingVideos.back} tone="duotone" className="absolute inset-0 -z-20" mediaClassName="opacity-75">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_65%_at_50%_50%,rgb(var(--rgb-ink)/0.72),rgb(var(--rgb-ink)/0.3)_100%)]" />
        </BackgroundVideo>
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_50%_0%,rgb(var(--rgb-accent)/0.12),transparent_70%)]"
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
          Начни с бесплатного аккаунта: вводные туториалы и программы откроются сразу. Нужно больше — бери IDX PACK, подписку или всё
          вместе.
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href={routes.pricing} className="btn btn-primary btn-lg w-full sm:w-auto">
            Выбрать тариф <ArrowRight size={18} />
          </Link>
          <Link href={registerHref} className="btn btn-glass btn-lg w-full sm:w-auto">
            <UserRoundPlus size={18} /> Создать аккаунт
          </Link>
        </div>
        <p className="mt-6 text-sm text-dim">
          Есть вопрос?{" "}
          <a href={site.telegram.personal.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent-soft hover:text-fg">
            <TelegramIcon size={14} /> Напиши IDELUXE
          </a>
        </p>
      </div>
    </section>
  );
}
