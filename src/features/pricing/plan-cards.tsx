"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { TelegramIcon } from "@/components/icons";
import { site } from "@/config/site";
import {
  fullSaving,
  planOrder,
  plans,
  yearDiscount,
  yearGift,
  yearPerMonth,
  type Billing,
  type OneTimePlan,
  type Plan,
  type SubscriptionPlan,
} from "@/content/plans";
import { formatRub, pluralRu } from "@/lib/format";
import { cn } from "@/lib/utils";

const months = (n: number) => `${n} ${pluralRu(n, ["месяц", "месяца", "месяцев"])}`;
/** The big figure: one size on every card, on one line even with «/ год» in a 4-column row. */
const PRICE = "font-display text-[2.15rem] leading-tight font-semibold tracking-tight whitespace-nowrap text-fg";

/**
 * The four plans side by side (content/plans.ts), with a month / year switch for the
 * subscriptions. IDX FULL — the most complete option — stands last, lit up. Until payments are on
 * the site every button leads to the Telegram bot.
 */
export function PlanCards({ firstIndex = 0 }: { /** `--i` of the first card's entrance (.arrive). */ firstIndex?: number }) {
  const [billing, setBillingState] = useState<Billing>("month");
  // The figures glide in on a switch, not on the first render (the cards come in on their own)
  const [switched, setSwitched] = useState(false);
  const setBilling = (next: Billing) => {
    setBillingState(next);
    setSwitched(true);
  };
  const lite = plans.lite as SubscriptionPlan;

  return (
    <div>
      {/* Billing switch: only the subscriptions change */}
      <div className="arrive flex justify-center" style={{ "--i": firstIndex } as React.CSSProperties}>
        <div role="group" aria-label="Оплата подписки" className="glass-soft inline-flex items-center gap-1 rounded-full p-1">
          <BillingButton active={billing === "month"} onClick={() => setBilling("month")}>
            Помесячно
          </BillingButton>
          <BillingButton active={billing === "year"} onClick={() => setBilling("year")}>
            За год
            <span
              className={cn(
                "rounded-full px-2 py-0.5 font-mono text-[10px] tracking-wide transition-colors duration-300",
                billing === "year" ? "bg-ink-950/10 text-ink-950/75" : "bg-accent/20 text-accent-soft",
              )}
            >
              −{yearDiscount(lite)}% · {months(yearGift(lite))} в подарок
            </span>
          </BillingButton>
        </div>
      </div>

      <ul className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {planOrder.map((id, i) => (
          <li key={id} className="flex">
            <PlanCard plan={plans[id]} billing={billing} animate={switched} index={firstIndex + 1 + i} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function BillingButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-colors duration-300",
        active ? "bg-fg text-ink-950" : "text-muted hover:text-fg",
      )}
    >
      {children}
    </button>
  );
}

function PlanCard({ plan, billing, animate, index }: { plan: Plan; billing: Billing; animate: boolean; index: number }) {
  const featured = plan.id === "full";
  return (
    <article
      className={cn("glass arrive relative flex w-full flex-col rounded-[2rem] p-6 pt-7", featured && "plan-featured")}
      style={{ "--i": index } as React.CSSProperties}
    >
      {plan.badge && (
        <span
          className={cn(
            "absolute -top-3 left-6 rounded-full px-3 py-1 font-mono text-[10px] tracking-[0.16em] uppercase",
            featured ? "bg-accent text-ink-950 shadow-[0_6px_20px_-6px_rgb(var(--rgb-accent)/0.7)]" : "border border-white/12 bg-ink-900 text-accent-soft",
          )}
        >
          {plan.badge}
        </span>
      )}

      <h2 className="font-display text-2xl font-bold tracking-tight">{plan.title}</h2>
      <p className="mt-1.5 text-sm text-accent-soft/85">{plan.tagline}</p>

      <div className="mt-6 min-h-[6.5rem]">
        {plan.kind === "once" ? <OncePrice plan={plan} /> : <SubscriptionPrice plan={plan} billing={billing} animate={animate} />}
      </div>

      <ul className="mt-6 space-y-2.5 border-t border-white/8 pt-6 text-[14.5px] text-muted">
        {plan.bullets.map((b) => (
          <li key={b} className="flex gap-2.5">
            <Check size={17} className="mt-0.5 shrink-0 text-accent" aria-hidden />
            {b}
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-8">
        <a
          href={site.telegram.bot.url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn("btn btn-md w-full", featured ? "btn-primary" : "btn-glass")}
        >
          <TelegramIcon size={16} /> {plan.cta}
        </a>
      </div>
    </article>
  );
}

function OncePrice({ plan }: { plan: OneTimePlan }) {
  const saving = plan.id === "full" ? fullSaving() : 0;
  return (
    <>
      {plan.separateRub ? (
        <p className="text-sm text-dim">
          <span className="sr-only">По отдельности </span>
          <span className="line-through decoration-1">{formatRub(plan.separateRub)}</span>
        </p>
      ) : (
        <p aria-hidden className="text-sm text-transparent select-none">·</p>
      )}
      <p className={PRICE}>{formatRub(plan.priceRub)}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-dim">{plan.note}</p>
      {saving > 0 && (
        <p className="mt-2 inline-flex rounded-full bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent-soft">Выгода {formatRub(saving)}</p>
      )}
    </>
  );
}

function SubscriptionPrice({ plan, billing, animate }: { plan: SubscriptionPlan; billing: Billing; animate: boolean }) {
  const yearly = billing === "year";
  return (
    // key: the figures glide in again when the billing changes
    <div key={billing} className={cn(animate && "animate-fade-up")}>
      <p className="text-sm text-dim">
        {yearly ? (
          <>
            <span className="sr-only">Вместо </span>
            <span className="line-through decoration-1">{formatRub(plan.monthRub * 12)}</span> в год
          </>
        ) : (
          "в месяц"
        )}
      </p>
      <p className={PRICE}>
        {formatRub(yearly ? plan.yearRub : plan.monthRub)}
        <span className="text-base font-medium tracking-normal text-muted">{yearly ? " / год" : " / мес"}</span>
      </p>
      <p className="mt-1.5 text-xs leading-relaxed text-dim">
        {yearly ? `≈ ${formatRub(yearPerMonth(plan))} в месяц · ${months(yearGift(plan))} в подарок` : "Продлеваешь, когда нужно"}
      </p>
      {!yearly && plan.firstMonthRub && (
        <p className="mt-2 inline-flex rounded-full bg-accent/15 px-2.5 py-1 text-xs font-semibold text-accent-soft">
          Первый месяц — {formatRub(plan.firstMonthRub)}
        </p>
      )}
    </div>
  );
}
