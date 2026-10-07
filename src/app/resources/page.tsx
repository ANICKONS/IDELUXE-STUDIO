import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ComingSoon } from "@/components/ui/coming-soon";
import { routes } from "@/config/routes";

export const metadata: Metadata = { title: "Ресурсы" };

export default function ResourcesPage() {
  return (
    <ComingSoon
      title="Ресурсы"
      description={
        <>
          Программы, плагины и расширения с инструкциями по установке, с фильтром Windows / macOS. Весь раздел — в подписках{" "}
          <span className="text-fg">IDX LITE</span> и <span className="text-fg">IDX PRO</span>, программы и часть плагинов открыты бесплатно
          после регистрации. Каталог готовится.
        </>
      }
      actions={
        <Link href={routes.pricing} className="btn btn-primary btn-md">
          Тарифы <ArrowRight size={16} />
        </Link>
      }
    />
  );
}
