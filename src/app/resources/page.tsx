import type { Metadata } from "next";
import { ResourcesCatalog } from "@/features/resources";
import { catalogFor } from "@/features/resources/catalog.server";
import { getViewer } from "@/lib/server/session";

export const metadata: Metadata = {
  title: "Ресурсы",
  description: "Программы для монтажа, плагины и расширения для After Effects, Premiere Pro, Media Encoder и VEGAS Pro: где работают, как установить и где скачать.",
};

/**
 * «Ресурсы» (features/resources): the hub of programs, plugins and extensions. Checked on the server
 * per request: anyone sees what's in it, the direct links go only to the accounts an item is open
 * for (lib/access-rules.ts → canOpenResource). The space camera hangs the planet on the left
 * (features/backdrop/camera.ts → "left").
 */
export default async function ResourcesPage() {
  const viewer = await getViewer();
  const catalog = catalogFor(viewer?.access ?? null);
  return (
    <section className="px-4 pt-32 pb-8 sm:pt-36">
      <div className="mx-auto max-w-6xl">
        <header className="max-w-3xl">
          <h1 className="arrive font-display text-[2.35rem] leading-[1.08] font-semibold tracking-tight text-balance sm:text-6xl">
            Программы, плагины <span className="text-gradient">и расширения</span>
          </h1>
          <p className="arrive mt-5 max-w-2xl leading-relaxed text-pretty text-muted [--i:1] sm:text-lg">
            Всё для монтажа в одном месте: где работает, как установить и где скачать.
          </p>
        </header>
        <ResourcesCatalog catalog={catalog} />
      </div>
    </section>
  );
}
