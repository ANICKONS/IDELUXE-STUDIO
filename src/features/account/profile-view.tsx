import Link from "next/link";
import { ArrowUpRight, Check, Minus, Trophy } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { routes } from "@/config/routes";
import { planName, untilText } from "@/features/account/format";
import { PromoForm } from "@/features/account/promo-form";
import { SignOutButton } from "@/features/account/sign-out-button";
import { returningOffer } from "@/content/plans";
import { cn } from "@/lib/utils";
import type { Viewer } from "@/types/session";

/** The profile: account, what's open and until when, the promo code field, sign-out. */
export function ProfileView({ viewer }: { viewer: Viewer }) {
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

        {/* Achievements */}
        <article className="glass arrive flex items-center gap-5 rounded-[2rem] p-7 sm:p-8 lg:col-span-2 [--i:3]">
          <span
            aria-hidden
            className="inline-flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-dim"
          >
            <Trophy size={22} />
          </span>
          <div>
            <h2 className="font-display text-lg font-semibold">Достижения</h2>
            <p className="mt-1 text-sm text-muted">Скоро: отметки о просмотренных разборах, серии и награды за пройденные разделы.</p>
          </div>
        </article>
      </div>
    </section>
  );
}
