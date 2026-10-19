import type { Metadata } from "next";
import { LearnCatalog } from "@/features/learn";
import { learnAudience, lessonCards } from "@/features/learn/catalog.server";
import { progressFor } from "@/features/learn/progress.server";
import { getViewer } from "@/lib/server/session";

export const metadata: Metadata = {
  title: "Туториалы",
  description: "Разборы эффектов и приёмов по разделам: VFX, звук, моушн, переходы, цвет и экспорт. Вводные разборы бесплатны с аккаунтом, все — в IDX PRO.",
};

/**
 * «Туториалы» (features/learn): the catalog of lessons by section. Checked on the server per
 * request: anyone sees what's in it, the account's progress comes along; what each lesson opens is
 * decided on its own page (lib/access-rules.ts → canWatchTutorial). The space camera hangs the
 * planet on the right (features/backdrop/camera.ts → "right").
 */
export default async function LearnPage() {
  const viewer = await getViewer();
  const access = viewer?.access ?? null;
  return (
    <section className="px-4 pt-32 pb-8 sm:pt-36">
      <div className="mx-auto max-w-6xl">
        <header className="max-w-3xl">
          <h1 className="arrive font-display text-[2.35rem] leading-[1.08] font-semibold tracking-tight text-balance sm:text-6xl">
            Разборы эффектов <span className="text-gradient">по разделам</span>
          </h1>
          <p className="arrive mt-5 max-w-2xl leading-relaxed text-pretty text-muted [--i:1] sm:text-lg">
            VFX, звук, моушн, переходы, цвет и экспорт. Смотри в любом порядке — просмотренное отмечается само.
          </p>
        </header>
        <LearnCatalog lessons={lessonCards(access)} progress={viewer ? progressFor(viewer.user.id) : {}} audience={learnAudience(access)} admin={access?.admin ?? false} />
      </div>
    </section>
  );
}
