import type { Metadata } from "next";
import { ComingSoon } from "@/components/ui/coming-soon";

export const metadata: Metadata = { title: "Публичная оферта" };

export default function OfferPage() {
  return <ComingSoon title="Публичная оферта" description="Текст оферты будет опубликован до запуска оплаты на сайте." />;
}
