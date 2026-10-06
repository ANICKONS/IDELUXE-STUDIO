import type { Metadata } from "next";
import { TelegramIcon } from "@/components/icons";
import { ComingSoon } from "@/components/ui/coming-soon";
import { site } from "@/config/site";

export const metadata: Metadata = { title: "Туториалы" };

export default function LearnPage() {
  return (
    <ComingSoon
      title="Туториалы"
      description="Разборы эффектов по разделам VFX, SFX, Motion, переходы, цвет и экспорт. Раздел переезжает на новую платформу, новости — в Telegram-канале."
      actions={
        <a href={site.telegram.channel.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-md">
          <TelegramIcon size={17} /> Канал IDELUXE
        </a>
      }
    />
  );
}
