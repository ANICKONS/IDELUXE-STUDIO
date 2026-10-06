import type { Metadata } from "next";
import { ComingSoon } from "@/components/ui/coming-soon";

export const metadata: Metadata = { title: "Политика конфиденциальности" };

export default function PrivacyPage() {
  return (
    <ComingSoon
      title="Политика конфиденциальности"
      description="Документ будет опубликован вместе с личным кабинетом и оплатой на сайте."
    />
  );
}
