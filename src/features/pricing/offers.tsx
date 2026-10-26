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

/** What the offer gives, in numbers: the card on /pricing and the panel on the landing show the same. */
function offerTerms() {
  const pack = plans.pack as OneTimePlan;
  return {
    fullPrice: pack.priceRub,
    price: Math.round(pack.priceRub * (1 - returningOffer.packDiscount / 100)),
    discount: returningOffer.packDiscount,
    liteMonths: `${returningOffer.liteMonths} ${pluralRu(returningOffer.liteMonths, ["месяц", "месяца", "месяцев"])}`,
  };
}

/** The gift tile: a warm icon in an accent frame. */
function GiftMark({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-2xl border border-accent/35 bg-accent/12 text-accent-soft shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_0_30px_-6px_rgb(var(--rgb-accent)/0.35)]",
        size === "md" ? "size-14" : "size-12",
      )}
    >
      <Gift size={size === "md" ? 24 : 22} />
    </span>
  );
}

/**
 * The same offer on the landing («Обо мне», beside the IDX PACK card, where «Мой подход» was): a
 * wide panel — who it's for, the two gifts side by side as tiles, the bot button. A big outlined
 * «−50%» sits in the corner beside the button, like the ghost words behind the section titles.
 */
export function ReturningOfferPanel({ titleAs: Title = "h3", className }: { titleAs?: "h2" | "h3"; className?: string }) {
  if (!returningOffer.enabled) return null;
  const { fullPrice, price, discount, liteMonths } = offerTerms();

  return (
    <article className={cn("glass relative flex flex-col overflow-hidden rounded-[2rem] p-7 sm:p-8", className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute -top-28 -left-20 -z-10 size-80 rounded-full bg-[radial-gradient(closest-side,rgb(var(--rgb-accent)/0.16),transparent)] blur-2xl"
      />
      {/* In the free corner beside the button, cut by the card's bottom edge */}
      <span
        aria-hidden
        className="ghost-text pointer-events-none absolute right-5 -bottom-6 -z-10 hidden font-display text-[7rem] leading-none font-bold select-none sm:block"
      >
        −{discount}%
      </span>

      <header className="flex items-center gap-4">
        <GiftMark size="sm" />
        <div className="min-w-0">
          <p className="kicker">Для тех, кто уже с нами</p>
          <Title className="mt-1.5 font-display text-xl font-semibold sm:text-2xl">Уже покупал IDX{"\u00A0"}PACK?</Title>
        </div>
      </header>
      <p className="mt-3.5 max-w-md leading-relaxed text-muted">Спасибо, что ты с первых версий. Бот проверит прошлую покупку и выдаст скидку и промокод.</p>

      <ul className="mt-auto grid gap-4 pt-6 sm:grid-cols-2">
        <li className="glass-soft rounded-2xl p-4">
          <p className="label">Новый IDX PACK</p>
          <p className="mt-2 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <span className="font-display text-2xl font-semibold text-fg">{formatRub(price)}</span>
            <span className="text-sm text-dim line-through decoration-1">{formatRub(fullPrice)}</span>
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-semibold text-accent-soft">−{discount}%</span>
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">За полцены, со всеми обновлениями</p>
        </li>
        <li className="glass-soft rounded-2xl p-4">
          <p className="label">Подписка в подарок</p>
          <p className="mt-2 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <span className="font-display text-2xl font-semibold text-fg">{liteMonths}</span>
            <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent-soft">IDX LITE</span>
          </p>
          <p className="mt-2 text-[13px] leading-relaxed text-muted">Промокод вводишь в профиле — и раздел «Ресурсы» открыт</p>
        </li>
      </ul>

      <div className="pt-5">
        <a href={site.telegram.bot.url} target="_blank" rel="noopener noreferrer" className="btn btn-glass btn-md w-full sm:w-auto">
          <TelegramIcon size={16} /> Получить в боте
        </a>
      </div>
    </article>
  );
}

/** For those who bought IDX PACK before: half price on the pack + LITE by a welcome promo code. */
export function ReturningOfferCard({ className }: { className?: string }) {
  if (!returningOffer.enabled) return null;
  const { fullPrice, price, discount, liteMonths } = offerTerms();

  return (
    <article className={cn("glass relative flex flex-col overflow-hidden rounded-[2rem] p-8 sm:p-10", className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 -left-16 -z-10 size-72 rounded-full bg-[radial-gradient(closest-side,rgb(var(--rgb-accent)/0.2),transparent)] blur-2xl"
      />
      <GiftMark />
      <p className="kicker mt-6">Для тех, кто уже с нами</p>
      <h2 className="mt-2 font-display text-3xl font-bold tracking-tight">Уже покупал IDX{"\u00A0"}PACK?</h2>

      <ul className="mt-7 space-y-5">
        <li>
          <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-display text-3xl font-semibold text-fg">{formatRub(price)}</span>
            <span className="text-dim line-through decoration-1">{formatRub(fullPrice)}</span>
            <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-accent-soft">−{discount}%</span>
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
