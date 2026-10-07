import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, Clapperboard, FolderDown, Lock, Package, Sparkles, Ticket } from "lucide-react";
import { TelegramIcon } from "@/components/icons";
import { routes } from "@/config/routes";
import { site } from "@/config/site";
import { freeTier, plans } from "@/content/plans";
import { planName, untilText } from "@/features/account/format";
import { OpenChatButton } from "@/features/chat";
import { can, type Feature } from "@/lib/access-rules";
import { cn } from "@/lib/utils";
import type { AccessInfo, Viewer } from "@/types/session";

/**
 * «Моя студия» — "/" for a signed-in account (proxy.ts → app/home): the plan and how long it runs,
 * then the four parts of the platform, each open or showing what opens it. Rendered on the server
 * from the account's real access.
 */
export function Dashboard({ viewer }: { viewer: Viewer }) {
  const { user, access } = viewer;
  const firstName = user.name.split(/\s+/)[0] || user.name;

  return (
    <section className="px-4 pt-32 pb-8 sm:pt-36">
      <div className="mx-auto max-w-6xl">
        <header>
          <span className="eyebrow arrive">Моя студия</span>
          <h1 className="arrive mt-5 font-display text-[2.35rem] leading-[1.08] font-semibold tracking-tight text-balance [--i:1] sm:text-6xl">
            Привет, <span className="text-gradient">{firstName}</span>
          </h1>
          <p className="arrive mt-4 max-w-2xl text-muted [--i:2] sm:text-lg">{lead(access)}</p>
        </header>

        <div className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <PlanCard access={access} />
          <ul className="grid gap-5 sm:grid-cols-2">
            {tiles.map((tile, i) => (
              <li key={tile.feature} className="flex">
                <Tile {...tile} open={can(access, tile.feature)} index={4 + i} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function lead(access: AccessInfo): string {
  if (access.admin) return "Аккаунт администратора: открыто всё.";
  if (access.tier === "pro") return "Вся платформа открыта: туториалы, ресурсы и ассистент.";
  if (access.tier === "lite") return "Открыт раздел «Ресурсы». Туториалы и ассистент — в IDX PRO.";
  return access.pack
    ? "IDX PACK твой. Сайт в бесплатном режиме: вводные туториалы, программы и часть плагинов."
    : "Бесплатный режим: вводные туториалы, программы и часть плагинов. Остальное открывают PACK и подписки.";
}

function openNow(access: AccessInfo): string[] {
  if (access.admin) return ["Туториалы, ресурсы и ассистент", "Материалы IDX PACK"];
  if (access.tier === "pro") return plans.pro.bullets;
  if (access.tier === "lite") return plans.lite.bullets;
  return freeTier.bullets;
}

function PlanCard({ access }: { access: AccessInfo }) {
  const until = access.tier === "pro" ? access.proUntil : access.tier === "lite" ? access.liteUntil : null;
  const subscribed = access.tier !== "free" && !access.admin;
  return (
    <article className={cn("glass arrive flex flex-col rounded-[2rem] p-7 sm:p-8 [--i:3]", access.tier === "pro" && "plan-featured")}>
      <p className="font-mono text-[11px] tracking-[0.18em] text-accent-soft uppercase">Мой тариф</p>
      <h2 className="mt-3 font-display text-3xl font-bold tracking-tight">{planName(access)}</h2>
      {until && <p className="mt-2 text-sm text-muted">{untilText(until)}</p>}
      {access.tier === "pro" && access.liteUntil && access.liteUntil > (access.proUntil ?? 0) && (
        <p className="mt-1 text-xs text-dim">Потом IDX LITE {untilText(access.liteUntil)}</p>
      )}

      {/* What the plan opens: the same lines as its card on /pricing */}
      <ul className="mt-6 space-y-2 border-t border-white/8 pt-6 text-[14.5px] text-muted">
        {openNow(access).map((line) => (
          <li key={line} className="flex gap-2.5">
            <Check size={17} className="mt-0.5 shrink-0 text-accent" aria-hidden />
            {line}
          </li>
        ))}
      </ul>

      <p className={cn("mt-5 flex items-center gap-2 text-sm", access.pack ? "text-fg" : "text-dim")}>
        <FolderDown size={17} className={access.pack ? "text-accent" : ""} aria-hidden />
        {access.pack ? "IDX PACK — твой навсегда" : "IDX PACK не куплен"}
      </p>

      <div className="mt-auto flex flex-col gap-2.5 pt-8 sm:flex-row lg:flex-col xl:flex-row">
        {access.tier !== "pro" && !access.admin && (
          <Link href={routes.pricing} className="btn btn-primary btn-md">
            {access.tier === "lite" ? "Перейти на PRO" : "Открыть PRO"} <ArrowRight size={16} />
          </Link>
        )}
        {subscribed && (
          <a href={site.telegram.bot.url} target="_blank" rel="noopener noreferrer" className="btn btn-glass btn-md">
            <TelegramIcon size={16} /> Продлить
          </a>
        )}
        <Link href={routes.profile} className="btn btn-glass btn-md">
          <Ticket size={16} /> Промокод
        </Link>
      </div>
    </article>
  );
}

type TileProps = {
  feature: Feature;
  icon: React.ReactNode;
  title: string;
  /** The tag on a locked tile: the plan that opens it (PRO includes LITE). */
  plan: string;
  /** With access / without it. */
  text: [string, string];
};

const tiles: TileProps[] = [
  {
    feature: "tutorials",
    icon: <Clapperboard size={22} />,
    plan: "PRO",
    title: "Туториалы",
    text: ["Все разборы по разделам и новые уроки.", "Вводные разборы открыты, все — в IDX PRO."],
  },
  {
    feature: "resources",
    icon: <Package size={22} />,
    plan: "LITE",
    title: "Ресурсы",
    text: ["Программы, плагины и расширения с инструкциями.", "Программы и часть плагинов открыты, весь каталог — в LITE и PRO."],
  },
  {
    feature: "ai",
    icon: <Sparkles size={22} />,
    plan: "PRO",
    title: "ИИ-ассистент",
    text: ["Вопрос по монтажу, экспорту или ошибке рендера — ответ сразу.", "Ассистент по монтажу 24/7 — в подписке IDX PRO."],
  },
  {
    feature: "pack",
    icon: <FolderDown size={22} />,
    plan: "PACK",
    title: "IDX PACK",
    text: ["Футажи, пресеты, звуки и текстуры с обновлениями.", "Футажи, пресеты, звуки и текстуры — навсегда, одним платежом."],
  },
];

function Tile({ feature, icon, title, plan, text, open, index }: TileProps & { open: boolean; index: number }) {
  return (
    <article className="glass arrive flex w-full flex-col rounded-[2rem] p-6" style={{ "--i": index } as React.CSSProperties}>
      <div className="flex items-center gap-3.5">
        <span
          aria-hidden
          className={cn(
            "inline-flex size-11 shrink-0 items-center justify-center rounded-2xl border shadow-[inset_0_1px_0_rgb(255_255_255/0.15)]",
            open ? "border-accent/30 bg-accent/10 text-accent-soft" : "border-white/10 bg-white/5 text-dim",
          )}
        >
          {icon}
        </span>
        <h2 className="font-display text-lg font-semibold whitespace-nowrap">{title}</h2>
        {!open && (
          <span className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-full border border-white/10 px-2 py-1 font-mono text-[10px] tracking-[0.12em] whitespace-nowrap text-dim">
            <Lock size={11} aria-hidden /> {plan}
          </span>
        )}
      </div>
      <p className="mt-4 text-[14.5px] leading-relaxed text-muted">{open ? text[0] : text[1]}</p>
      <div className="mt-auto pt-6">
        <TileAction feature={feature} open={open} />
      </div>
    </article>
  );
}

const linkClass = "inline-flex items-center gap-1.5 text-sm font-semibold text-accent-soft transition hover:text-fg";

function TileAction({ feature, open }: { feature: Feature; open: boolean }) {
  if (feature === "ai") {
    return open ? (
      <OpenChatButton className={cn(linkClass, "rounded-md")}>
        Задать вопрос <ArrowUpRight size={16} />
      </OpenChatButton>
    ) : (
      <Link href={routes.pricing} className={linkClass}>
        Открыть с PRO <ArrowUpRight size={16} />
      </Link>
    );
  }
  if (feature === "pack") {
    // Pack files are handed out by the bot until downloads move to the site
    return open ? (
      <a href={site.telegram.bot.url} target="_blank" rel="noopener noreferrer" className={linkClass}>
        <TelegramIcon size={14} /> Скачать в боте
      </a>
    ) : (
      <Link href={routes.pricing} className={linkClass}>
        Купить PACK <ArrowUpRight size={16} />
      </Link>
    );
  }
  const href = feature === "tutorials" ? routes.learn : routes.resources;
  return (
    <Link href={href} className={linkClass}>
      {open ? "Открыть" : "Бесплатная часть"} <ArrowUpRight size={16} />
    </Link>
  );
}
