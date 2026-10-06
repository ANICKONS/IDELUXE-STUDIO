import type { Metadata } from "next";
import { ComingSoon } from "@/components/ui/coming-soon";

export const metadata: Metadata = { title: "Ресурсы" };

export default function ResourcesPage() {
  return (
    <ComingSoon
      title="Ресурсы"
      description="Программы, плагины и расширения с инструкциями по установке, с фильтром Windows / macOS. Каталог готовится."
    />
  );
}
