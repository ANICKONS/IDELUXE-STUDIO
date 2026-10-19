import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { learnSectionHref, routes } from "@/config/routes";
import { categoryOf } from "@/content/tutorial-categories";
import { LessonView } from "@/features/learn";
import { findTutorial, learnAudience, lessonPage } from "@/features/learn/catalog.server";
import { progressFor } from "@/features/learn/progress.server";
import { getViewer } from "@/lib/server/session";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const lesson = findTutorial(slug);
  return lesson ? { title: lesson.title, description: lesson.summary } : { title: "Разбор не найден" };
}

/**
 * A lesson (features/learn → LessonView). The server decides what goes out: the video and the
 * files only when the lesson is open to this account (features/learn/catalog.server.ts); a locked
 * lesson still shows what it's about and what opens it.
 */
export default async function LessonRoute({ params }: Props) {
  const { slug } = await params;
  const viewer = await getViewer();
  const access = viewer?.access ?? null;
  const page = lessonPage(slug, access);
  if (!page) notFound();
  const section = categoryOf(page.lesson.section);
  return (
    <section className="px-4 pt-28 pb-8 sm:pt-32">
      <div className="mx-auto max-w-7xl">
        <nav aria-label="Где ты" className="arrive flex items-center gap-1.5 px-1 text-[13px] text-dim">
          <Link href={routes.learn} className="transition hover:text-fg">
            Туториалы
          </Link>
          <ChevronRight size={14} aria-hidden />
          <Link href={learnSectionHref(section.slug)} className="transition hover:text-fg">
            {section.title}
          </Link>
        </nav>
        <LessonView key={slug} lesson={page.lesson} section={page.section} progress={viewer ? progressFor(viewer.user.id) : {}} audience={learnAudience(access)} />
      </div>
    </section>
  );
}
