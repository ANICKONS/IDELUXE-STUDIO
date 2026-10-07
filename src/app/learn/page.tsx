import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TelegramIcon } from "@/components/icons";
import { ComingSoon } from "@/components/ui/coming-soon";
import { routes } from "@/config/routes";
import { site } from "@/config/site";

export const metadata: Metadata = { title: "Туториалы" };

export default function LearnPage() {
  return (
    <ComingSoon
      title="Туториалы"
      description={
        <>
          Разборы эффектов по разделам VFX, SFX, Motion, переходы, цвет и экспорт. Все разборы — в подписке{" "}
          <span className="text-fg">IDX PRO</span>, вводные открыты бесплатно после регистрации. Раздел переезжает на новую платформу, новости
          — в Telegram-канале.
        </>
      }
      actions={
        <>
          <Link href={routes.pricing} className="btn btn-primary btn-md">
            Тарифы <ArrowRight size={16} />
          </Link>
          <a href={site.telegram.channel.url} target="_blank" rel="noopener noreferrer" className="btn btn-glass btn-md">
            <TelegramIcon size={17} /> Канал IDELUXE
          </a>
        </>
      }
    />
  );
}
