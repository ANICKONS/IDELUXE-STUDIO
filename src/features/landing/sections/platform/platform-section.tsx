import Link from "next/link";
import { ArrowUpRight, Clapperboard, Infinity as InfinityIcon, Package, Sparkles, Users } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { AppTile } from "@/components/ui/app-tile";
import { OpenChatButton } from "@/features/chat";
import { landingAnchors, learnSectionHref, routes } from "@/config/routes";
import { site } from "@/config/site";
import { software } from "@/content/landing";
import { tutorialCategories } from "@/content/tutorial-categories";
import { cn } from "@/lib/utils";

export function PlatformSection() {
  return (
    // section-screen: a menu category — on desktop it takes the whole screen under the header
    <section id={landingAnchors.platform} className="section section-screen relative px-4">
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
          <BentoCard className="md:col-span-4" icon={<Package size={22} />} title="Программы, плагины, расширения" plan="LITE · PRO">
            <p>Прямые ссылки на программы и плагины, проверенные расширения и скрипты — с инструкциями по установке.</p>
            {/* Programs taught in the pack: name and purpose beside the icon. Two per row, so both
                lines fit without cutting */}
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {software.map((s) => (
                <li key={s.code} className="glass-soft flex min-w-0 items-center gap-3.5 rounded-2xl p-3 pr-4">
                  <AppTile code={s.code} size={44} className="shrink-0" />
                  <span className="min-w-0 leading-snug">
                    <span className="block text-[15px] font-semibold text-fg">{s.name}</span>
                    <span className="mt-0.5 block text-[13px] text-muted">{s.role}</span>
                  </span>
                </li>
              ))}
            </ul>
            <Link href={routes.resources} className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-soft hover:text-fg">
              Перейти к ресурсам <ArrowUpRight size={16} />
            </Link>
          </BentoCard>

          {/* The subscription: the platform keeps growing while it's on */}
          <BentoCard className="md:col-span-2" icon={<InfinityIcon size={22} />} title="Платформа растёт">
            <p>
              Подписка открывает сайт: LITE — ресурсы, PRO — ещё туториалы и ИИ. Пока она действует, новые разборы, программы и плагины
              появляются у тебя сами.
            </p>
            {/* A drawn infinity sign (the font's glyph looked blobby) with a caption under it, in the
                middle of the card's free space */}
            <div className="flex flex-1 flex-col items-center justify-center gap-3 pt-8 pb-2 text-center">
              <svg aria-hidden viewBox="0 0 48 24" fill="none" className="h-12 w-24 shrink-0 drop-shadow-[0_0_14px_rgb(var(--rgb-accent)/0.35)]">
                <defs>
                  <linearGradient id="inf-gold" x1="0" y1="0" x2="48" y2="24" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#ffffff" />
                    <stop offset=".45" stopColor="#ecdcbd" />
                    <stop offset="1" stopColor="#b8925a" />
                  </linearGradient>
                </defs>
                <path
                  d="M24 12c-3.6-4.6-7.2-7-10.6-7a7 7 0 0 0 0 14c3.4 0 7-2.4 10.6-7Zm0 0c3.6 4.6 7.2 7 10.6 7a7 7 0 0 0 0-14c-3.4 0-7 2.4-10.6 7Z"
                  stroke="url(#inf-gold)"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="leading-snug">
                <span className="block text-[15px] font-semibold text-fg">Новое каждый раз</span>
                <span className="block text-[13px] text-muted">уроки, программы и плагины</span>
              </span>
              <Link href={routes.pricing} className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-soft hover:text-fg">
                Сравнить тарифы <ArrowUpRight size={16} />
              </Link>
            </div>
          </BentoCard>

          {/* Tutorials: sections by topic, not a course plan */}
          <BentoCard className="md:col-span-2" icon={<Clapperboard size={22} />} title="Туториалы по разделам" plan="PRO">
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

          {/* AI: same icon as the assistant's launcher, same link style as the other cards */}
          <BentoCard className="md:col-span-2" icon={<Sparkles size={22} />} title="ИИ-ассистент по монтажу" plan="PRO">
            <p>Знает After Effects, Premiere Pro и Vegas Pro. Подскажет настройки экспорта, эффект или горячую клавишу.</p>
            <OpenChatButton className="mt-6 inline-flex items-center gap-1.5 self-start rounded-md text-sm font-semibold text-accent-soft hover:text-fg">
              Задать вопрос ассистенту <ArrowUpRight size={16} />
            </OpenChatButton>
          </BentoCard>
        </div>
      </div>
    </section>
  );
}

/** `plan`: the subscriptions that open this part of the platform (content/plans.ts), a tag in the corner. */
function BentoCard({
  icon,
  title,
  plan,
  children,
  className,
}: {
  icon: React.ReactNode;
  title: string;
  plan?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <article className={cn("glass reveal flex flex-col rounded-[2rem] p-7 text-[15px] leading-relaxed text-muted", className)}>
      <div className="mb-4 flex items-center gap-4">
        <span
          aria-hidden
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10 text-accent-soft shadow-[inset_0_1px_0_rgb(255_255_255/0.15)]"
        >
          {icon}
        </span>
        <h3 className="font-display text-lg leading-tight font-semibold text-fg">{title}</h3>
        {plan && (
          <span className="ml-auto shrink-0 self-start rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] whitespace-nowrap text-accent-soft">
            <span className="sr-only">Входит в подписку </span>
            {plan}
          </span>
        )}
      </div>
      {children}
    </article>
  );
}
