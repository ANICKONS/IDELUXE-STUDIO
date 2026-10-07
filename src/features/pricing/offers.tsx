import Link from "next/link";
import { ArrowRight, Gift, UserRound } from "lucide-react";
import { TelegramIcon } from "@/components/icons";
import { registerHref } from "@/config/routes";
import { site } from "@/config/site";
import { freeTier, plans, returningOffer, type OneTimePlan } from "@/content/plans";
import { formatRub, pluralRu } from "@/lib/format";
import { cn } from "@/lib/utils";

/** The free account under the plans: what it opens and the sign-up button. */
export function FreeTierBar({ className }: { className?: string }) {
  return (
    <div className={cn("glass flex flex-col gap-5 rounded-[1.75rem] p-5 sm:flex-row sm:items-center sm:gap-6 sm:px-6", className)}>
      <span
        aria-hidden
        className="hidden size-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-fg/80 sm:inline-flex"
      >
        <UserRound size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-lg font-semibold">{freeTier.title}</p>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          Без оплаты, нужна только регистрация: {freeTier.bullets.map((b) => b.toLowerCase()).join(", ")}.
        </p>
      </div>
      <Link href={registerHref} className="btn btn-glass btn-md shrink-0">
        Создать аккаунт <ArrowRight size={16} />
      </Link>
    </div>
  );
}

/** For those who bought IDX PACK before: half price on the pack + LITE by a welcome promo code. */
export function ReturningOfferCard({ className }: { className?: string }) {
  if (!returningOffer.enabled) return null;
  const pack = plans.pack as OneTimePlan;
  const price = Math.round(pack.priceRub * (1 - returningOffer.packDiscount / 100));
  const liteMonths = `${returningOffer.liteMonths} ${pluralRu(returningOffer.liteMonths, ["месяц", "месяца", "месяцев"])}`;

  return (
    <article className={cn("glass relative flex flex-col overflow-hidden rounded-[2rem] p-8 sm:p-10", className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-16 -z-10 size-72 rounded-full bg-[radial-gradient(closest-side,rgb(var(--rgb-accent)/0.2),transparent)] blur-2xl"
      />
      <span
        aria-hidden
        className="inline-flex size-14 items-center justify-center rounded-2xl border border-accent/35 bg-accent/12 text-accent-soft shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_0_30px_-6px_rgb(var(--rgb-accent)/0.35)]"
      >
        <Gift size={24} />
      </span>
      <p className="mt-6 font-mono text-[11px] tracking-[0.18em] text-accent-soft uppercase">Для тех, кто уже с нами</p>
      <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">Уже покупал IDX PACK?</h2>

      <ul className="mt-7 space-y-5">
        <li>
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-display text-3xl font-semibold text-fg">{formatRub(price)}</span>
            <span className="text-dim line-through decoration-1">{formatRub(pack.priceRub)}</span>
            <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-accent-soft">−{returningOffer.packDiscount}%</span>
          </p>
          <p className="mt-1 text-sm text-muted">Новый IDX PACK за полцены, со всеми обновлениями</p>
        </li>
        <li>
          <p className="font-display text-xl font-semibold text-fg">{liteMonths} LITE в подарок</p>
          <p className="mt-1 text-sm text-muted">Приветственный промокод: вводишь в профиле — и раздел «Ресурсы» открыт</p>
        </li>
      </ul>

      <div className="mt-auto pt-9">
        <a href={site.telegram.bot.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-md w-full sm:w-auto">
          <TelegramIcon size={16} /> Получить в боте
        </a>
        <p className="mt-3 text-xs text-dim">Бот проверит покупку и выдаст скидку и промокод.</p>
      </div>
    </article>
  );
}
