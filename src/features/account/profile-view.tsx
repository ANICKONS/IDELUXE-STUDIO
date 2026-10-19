import Link from "next/link";
import { ArrowUpRight, BadgeCheck, Check, Flame, Minus, Play, Trophy } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { learnSectionHref, lessonHref, routes } from "@/config/routes";
import { categoryOf } from "@/content/tutorial-categories";
import { planName, untilText } from "@/features/account/format";
import { PromoForm } from "@/features/account/promo-form";
import { SignOutButton } from "@/features/account/sign-out-button";
import { SectionGlyph } from "@/features/learn/glyphs";
import type { LearnStats } from "@/features/learn/stats.server";
import { returningOffer } from "@/content/plans";
import { pluralRu } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Viewer } from "@/types/session";

/** The profile: account, what's open and until when, the promo code field, sign-out, achievements. */
export function ProfileView({ viewer, learn }: { viewer: Viewer; learn: LearnStats }) {
  const { user, access } = viewer;
  const rows: { label: string; active: boolean; detail: string }[] = [
    { label: "IDX PACK", active: access.pack, detail: access.pack ? "Твой навсегда, с обновлениями" : "Не куплен" },
    {
      label: "IDX PRO",
      active: Boolean(access.proUntil) || access.admin,
      detail: access.admin ? "Аккаунт администратора" : access.proUntil ? untilText(access.proUntil) : "Не активна",
    },
    { label: "IDX LITE", active: Boolean(access.liteUntil), detail: access.liteUntil ? untilText(access.liteUntil) : "Не активна" },
  ];

  return (
    <section className="px-4 pt-32 pb-8 sm:pt-36">
      <div className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-2">
        {/* Account */}
        <article className="glass arrive flex flex-col rounded-[2rem] p-7 sm:p-8 lg:col-span-2 lg:flex-row lg:items-center lg:gap-8">
          <Avatar name={user.name} src={user.avatarUrl} size={72} />
          <div className="mt-5 min-w-0 flex-1 lg:mt-0">
            <p className="font-mono text-[11px] tracking-[0.18em] text-accent-soft uppercase">Профиль</p>
            <h1 className="mt-2 truncate font-display text-3xl font-bold tracking-tight">{user.name}</h1>
            <p className="mt-1 truncate text-sm text-muted">{user.email}</p>
          </div>
          <SignOutButton className="mt-6 self-start lg:mt-0 lg:self-center" />
        </article>

        {/* Access */}
        <article className="glass arrive flex flex-col rounded-[2rem] p-7 sm:p-8 [--i:1]">
          <h2 className="font-display text-xl font-semibold">Доступ</h2>
          <p className="mt-1 text-sm text-muted">Сейчас: {planName(access)}</p>
          <ul className="mt-6 divide-y divide-white/6">
            {rows.map((r) => (
              <li key={r.label} className="flex items-start gap-3 py-3.5">
                <span
                  aria-hidden
                  className={cn(
                    "mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full",
                    r.active ? "bg-accent/15 text-accent" : "bg-white/5 text-dim",
                  )}
                >
                  {r.active ? <Check size={14} strokeWidth={2.5} /> : <Minus size={14} />}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-fg">{r.label}</span>
                  <span className="block text-[13px] text-muted">{r.detail}</span>
                </span>
              </li>
            ))}
          </ul>
          <Link href={routes.pricing} className="mt-auto inline-flex items-center gap-1.5 pt-6 text-sm font-semibold text-accent-soft hover:text-fg">
            Сравнить тарифы <ArrowUpRight size={16} />
          </Link>
        </article>

        {/* Promo code */}
        <article className="glass arrive flex flex-col rounded-[2rem] p-7 sm:p-8 [--i:2]">
          <h2 className="font-display text-xl font-semibold">Промокод</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            Введи код — подписка продлится на его срок.
            {returningOffer.enabled && ` Покупал IDX PACK раньше? Приветственный код на ${returningOffer.liteMonths} месяца LITE выдаёт бот.`}
          </p>
          <PromoForm className="mt-6" />
        </article>

        <Achievements learn={learn} />
      </div>
    </section>
  );
}

/**
 * «Достижения»: how much of the tutorials is watched, the streak (days in a row with a lesson
 * finished), and each section — lit once every lesson in it is seen. Counted on the server from
 * the progress the player saves (features/learn/stats.server.ts).
 */
function Achievements({ learn }: { learn: LearnStats }) {
  const share = learn.total ? learn.watched / learn.total : 0;
  const done = learn.sections.filter((s) => s.watched === s.total).length;
  return (
    <article className="glass arrive rounded-[2rem] p-7 sm:p-8 lg:col-span-2 [--i:3]">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-4">
        <span
          aria-hidden
          className={cn(
            "inline-flex size-12 shrink-0 items-center justify-center rounded-2xl border",
            learn.watched ? "border-accent/35 bg-accent/12 text-accent-soft" : "border-white/10 bg-white/5 text-dim",
          )}
        >
          <Trophy size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-semibold">Достижения</h2>
          <p className="mt-1 text-sm text-muted">
            {learn.watched
              ? `Просмотрено ${learn.watched} из ${learn.total} ${pluralRu(learn.total, ["разбора", "разборов", "разборов"])}${done ? ` · ${pluralRu(done, ["пройден", "пройдено", "пройдено"])} ${done} ${pluralRu(done, ["раздел", "раздела", "разделов"])}` : ""}`
              : "Посмотри первый разбор — здесь появятся отметки, серии и пройденные разделы."}
          </p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[13px] font-semibold",
            learn.streak ? "border-accent/35 bg-accent/10 text-accent-soft" : "border-white/10 bg-white/[0.04] text-dim",
          )}
          title="Дни подряд, в которые ты досмотрел хотя бы один разбор"
        >
          <Flame size={15} aria-hidden />
          {learn.streak ? `${learn.streak} ${pluralRu(learn.streak, ["день", "дня", "дней"])} подряд` : "Серии пока нет"}
        </span>
      </div>

      <div aria-hidden className="mt-6 h-1.5 overflow-hidden rounded-full bg-white/8">
        <div className="h-full rounded-full bg-gradient-to-r from-accent-strong/70 via-accent to-accent-soft" style={{ width: `${share * 100}%` }} />
      </div>

      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {learn.sections.map((s) => {
          const c = categoryOf(s.slug);
          const complete = s.watched === s.total;
          return (
            <li key={s.slug}>
              <Link
                href={learnSectionHref(s.slug)}
                className={cn(
                  "flex h-full flex-col rounded-2xl border p-3.5 transition hover:border-white/18",
                  complete ? "border-accent/35 bg-accent/[0.07]" : "border-white/8 bg-white/[0.025]",
                )}
                aria-label={`${c.title}: просмотрено ${s.watched} из ${s.total}${complete ? ", раздел пройден" : ""}`}
              >
                <span className="flex items-center justify-between gap-2">
                  <span
                    aria-hidden
                    className="inline-flex size-8 items-center justify-center rounded-xl border"
                    style={
                      complete
                        ? { borderColor: `rgb(${c.tint} / 0.45)`, background: `rgb(${c.tint} / 0.16)`, color: `rgb(${c.tint})` }
                        : { borderColor: "rgb(255 255 255 / 0.08)", color: "var(--color-dim)" }
                    }
                  >
                    <SectionGlyph section={s.slug} size={15} />
                  </span>
                  {complete && <BadgeCheck size={17} aria-hidden className="text-accent" />}
                </span>
                <span className="mt-3 text-[14px] font-semibold text-fg">{c.title}</span>
                <span className="mt-0.5 font-mono text-[11px] text-dim tabular-nums">
                  {s.watched}/{s.total}
                  {complete && <span className="text-accent-soft"> · пройден</span>}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
        {learn.resume ? (
          <Link href={lessonHref(learn.resume.slug)} className="inline-flex min-w-0 items-center gap-1.5 text-sm font-semibold text-accent-soft hover:text-fg">
            <Play size={15} aria-hidden className="shrink-0" fill="currentColor" />
            <span className="truncate">Продолжить «{learn.resume.title}»</span>
          </Link>
        ) : null}
        <Link href={routes.learn} className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-soft hover:text-fg">
          К туториалам <ArrowUpRight size={16} />
        </Link>
      </div>
    </article>
  );
}
