import type { Metadata } from "next";
import { TelegramIcon } from "@/components/icons";
import { ComingSoon } from "@/components/ui/coming-soon";
import { site } from "@/config/site";
import { PackCard } from "@/features/pack/pack-card";
import { PackLockedCard } from "@/features/pack/pack-locked-card";

export const metadata: Metadata = { title: "Тарифы" };

export default function PricingPage() {
  return (
    <ComingSoon
      title="Тарифы"
      description="Оплата на сайте скоро появится. Пока IDX PACK можно получить через Telegram-бота: он примет оплату и выдаст доступ."
      actions={
        <a href={site.telegram.bot.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-md">
          <TelegramIcon size={17} /> Купить в боте
        </a>
      }
    >
      <div className="grid gap-6 md:grid-cols-2">
        <PackCard titleAs="h2" />
        <PackLockedCard titleAs="h2" />
      </div>
    </ComingSoon>
  );
}
