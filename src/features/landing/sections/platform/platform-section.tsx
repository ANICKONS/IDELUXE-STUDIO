import Link from "next/link";
import { ArrowUpRight, Clapperboard, Infinity as InfinityIcon, Package, Users } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { AppTile } from "@/components/ui/app-tile";
import { OpenChatButton } from "@/features/chat";
import { Decor3D } from "@/features/decor";
import { sectionDecor } from "@/features/landing/decor";
import { landingAnchors, learnSectionHref, routes } from "@/config/routes";
import { site } from "@/config/site";
import { software } from "@/content/landing";
import { tutorialCategories } from "@/content/tutorial-categories";
import { cn } from "@/lib/utils";

export function PlatformSection() {
  return (
    // section-screen: a menu category — on desktop it takes the whole screen under the header
    <section id={landingAnchors.platform} className="section section-screen relative px-4">
      <Decor3D items={sectionDecor.platform} className="-z-10" />
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          comp="COMP 04"
          timecode="00:01:12:00"
          title={
            <>
              Всё в одном: <span className="text-gradient">универсальная платформа</span>
            </>
          }
          description="Не нужно собирать туториалы, пресеты и плагины по разным каналам и облакам. Всё, что нужно монтажёру, лежит в одном месте и разложено по разделам."
        />

        <div className="mt-14 grid gap-5 md:grid-cols-6">
          {/* Resources */}
          <BentoCard className="md:col-span-4" icon={<Package size={22} />} title="Программы, плагины, расширения">
            <p>Прямые ссылки на программы и плагины, проверенные расширения и скрипты — с инструкциями по установке.</p>
            {/* Programs taught in the pack; names wrap instead of being cut */}
            <ul className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {software.map((s) => (
                <li key={s.code} className="glass-soft flex min-w-0 items-center gap-3 rounded-2xl p-2.5 pr-3">
                  <AppTile code={s.code} size={40} className="shrink-0" />
                  <span className="min-w-0 leading-tight">
                    <span className="block text-[13px] font-semibold text-fg">{s.name}</span>
                    <span className="mt-0.5 hidden truncate text-[11px] text-dim sm:block">{s.role}</span>
                  </span>
                </li>
              ))}
            </ul>
            <Link href={routes.resources} className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-soft hover:text-fg">
              Перейти к ресурсам <ArrowUpRight size={16} />
            </Link>
          </BentoCard>

          {/* Unlimited */}
          <BentoCard className="md:col-span-2" icon={<InfinityIcon size={22} />} title="Безлимитный доступ">
            <p>Платишь один раз — пользуешься всегда. Все обновления пака уже включены в стоимость.</p>
            <div className="mt-6 flex items-end gap-2" aria-hidden>
              <span className="font-display text-5xl leading-none font-bold text-gradient">∞</span>
              <span className="pb-1 font-mono text-xs text-dim">дней доступа</span>
            </div>
          </BentoCard>

          {/* Tutorials: sections by topic, not a course plan */}
          <BentoCard className="md:col-span-2" icon={<Clapperboard size={22} />} title="Туториалы по разделам">
            <p>Разборы конкретных эффектов и приёмов. Выбираешь раздел и смотришь в любом порядке — просмотренное отмечается в профиле.</p>
            <ul className="mt-6 flex flex-wrap gap-2" aria-label="Разделы туториалов">
              {tutorialCategories.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={learnSectionHref(c.slug)}
                    className="glass-soft inline-flex rounded-full px-3 py-1.5 font-mono text-[12px] text-accent-soft transition hover:text-fg"
                  >
                    {c.title}
                  </Link>
                </li>
              ))}
            </ul>
          </BentoCard>

          {/* 1-on-1 */}
          <BentoCard className="md:col-span-2" icon={<Users size={22} />} title="Индивидуальные занятия">
            <p>Разбор твоего проекта один на один с IDELUXE: ошибки, ритм, цвет, подача.</p>
            <a
              href={site.telegram.personal.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-soft hover:text-fg"
            >
              Записаться в Telegram <ArrowUpRight size={16} />
            </a>
          </BentoCard>

          {/* AI */}
          <BentoCard
            className="md:col-span-2"
            icon={<span className="font-mono text-sm font-bold">AI</span>}
            title="ИИ-ассистент по монтажу"
            highlight
          >
            <p>Знает After Effects, Premiere Pro и Vegas Pro. Подскажет настройки экспорта, эффект или горячую клавишу.</p>
            <OpenChatButton className="btn btn-glass btn-sm mt-6 self-start">Задать вопрос</OpenChatButton>
          </BentoCard>
        </div>
      </div>
    </section>
  );
}

function BentoCard({
  icon,
  title,
  children,
  className,
  highlight,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  className?: string;
  highlight?: boolean;
}) {
  return (
    <article
      className={cn(
        "glass reveal flex flex-col rounded-[2rem] p-7 text-[15px] leading-relaxed text-muted",
        highlight && "bg-[radial-gradient(120%_100%_at_100%_0%,rgb(143_128_255/0.22),transparent_60%)]",
        className,
      )}
    >
      <div className="mb-4 flex items-center gap-4">
        <span
          aria-hidden
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10 text-accent-soft shadow-[inset_0_1px_0_rgb(255_255_255/0.15)]"
        >
          {icon}
        </span>
        <h3 className="font-display text-lg leading-tight font-semibold text-fg">{title}</h3>
      </div>
      {children}
    </article>
  );
}
