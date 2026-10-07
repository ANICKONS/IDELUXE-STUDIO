import type { Metadata } from "next";
import { TelegramIcon } from "@/components/icons";
import { FaqList } from "@/components/ui/faq-list";
import { SectionHeading } from "@/components/ui/section-heading";
import { site } from "@/config/site";
import { fullSaving, pricingFaq } from "@/content/plans";
import { PackLockedCard } from "@/features/pack/pack-locked-card";
import { CompareTable, FreeTierBar, PlanCards, ReturningOfferCard } from "@/features/pricing";
import { formatRub } from "@/lib/format";

export const metadata: Metadata = {
  title: "Тарифы",
  description: "IDX PACK с материалами навсегда, подписки IDX LITE и IDX PRO, всё вместе в IDX FULL: цены, скидки и что входит в каждый тариф.",
};

/**
 * Plans (content/plans.ts): the four options with a month / year switch, the free account, the
 * full comparison, offers and questions about buying. The space camera hangs the planet on the
 * right (features/backdrop/camera.ts → "right"), IDX FULL stands next to it.
 */
export default function PricingPage() {
  return (
    <>
      <section className="px-4 pt-32 sm:pt-36">
        <div className="mx-auto max-w-6xl">
          <header className="mx-auto max-w-4xl text-center">
            <span className="eyebrow arrive">Тарифы IDELUXE</span>
            <h1 className="arrive mt-5 font-display text-[2.35rem] leading-[1.08] font-semibold tracking-tight text-balance [--i:1] sm:text-6xl">
              Материалы навсегда или <span className="text-gradient">вся платформа</span>
            </h1>
            <p className="arrive mx-auto mt-5 max-w-2xl leading-relaxed text-pretty text-muted [--i:2] sm:text-lg">
              PACK — футажи, пресеты, звуки и текстуры, твои навсегда. Подписка открывает туториалы, ресурсы и ИИ-ассистента. Или всё сразу в
              IDX FULL с выгодой {formatRub(fullSaving())}.
            </p>
          </header>

          <div className="mt-10">
            <PlanCards firstIndex={3} />
          </div>
          <FreeTierBar className="arrive mt-6 [--i:8]" />
          <p className="mt-4 text-center text-xs text-dim">
            Оплата на сайте появится вместе с личным кабинетом. Сейчас PACK и подписки оформляет Telegram-бот.
          </p>
        </div>
      </section>

      <section className="px-4 pt-24 sm:pt-32">
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            comp="COMPARE"
            timecode="00:00:08:00"
            ghost={false}
            align="center"
            title={
              <>
                Что входит <span className="text-gradient">в каждый тариф</span>
              </>
            }
            description="Без аккаунта открыт только лендинг. После регистрации — вводные туториалы и базовые ресурсы, остальное открывают PACK и подписки."
          />
          <CompareTable className="mt-10" />
        </div>
      </section>

      <section className="px-4 pt-24 sm:pt-32">
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2">
          <ReturningOfferCard className="reveal" />
          <PackLockedCard className="reveal" />
        </div>
      </section>

      <section className="px-4 pt-24 pb-8 sm:pt-32">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)]">
          <div>
            <SectionHeading comp="FAQ" timecode="00:00:16:00" ghost="FAQ" title="Про оплату и доступ" description="Не нашёл ответ? Напиши в бот или IDELUXE в Telegram." />
            <a href={site.telegram.bot.url} target="_blank" rel="noopener noreferrer" className="btn btn-glass btn-md mt-8">
              <TelegramIcon size={16} /> Открыть бота
            </a>
          </div>
          <FaqList items={pricingFaq} name="pricing-faq" />
        </div>
      </section>
    </>
  );
}
