"use client";

import Link from "next/link";
import { ArrowRight, CircleCheck, Lock, LockOpen } from "lucide-react";
import { loginHref, registerHrefTo, routes } from "@/config/routes";
import { tutorialCategories, type TutorialSection } from "@/content/tutorial-categories";
import { lessonsCount, SectionGlyph } from "@/features/learn/glyphs";
import type { Audience } from "@/features/learn/types";
import { NewYearSnowCap } from "@/features/new-year";
import { pluralRu } from "@/lib/format";
import { cn } from "@/lib/utils";

export type SectionPick = TutorialSection | "all";

/** Per section: lessons with the other filters applied, and how many of them are watched. */
export type SectionCounts = Record<SectionPick, { total: number; watched: number }>;

export const sectionTitle = (s: SectionPick) => (s === "all" ? "Все разборы" : tutorialCategories.find((c) => c.slug === s)!.title);
export const sectionHint = (s: SectionPick) => (s === "all" ? "Все разделы по порядку" : tutorialCategories.find((c) => c.slug === s)!.hint);

/** A section's icon in its own tint. */
export function SectionIconTile({ section, active, size = "md" }: { section: SectionPick; active: boolean; size?: "sm" | "md" }) {
  const tint = section === "all" ? "var(--rgb-accent)" : tutorialCategories.find((c) => c.slug === section)!.tint;
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl border transition-[background-color,border-color,color] duration-300",
        size === "md" ? "size-9" : "size-7 rounded-lg",
        active ? "text-fg" : "border-white/8 bg-white/[0.03] text-fg/55",
      )}
      style={active ? { borderColor: `rgb(${tint} / 0.4)`, background: `rgb(${tint} / 0.14)`, color: `rgb(${tint})` } : undefined}
    >
      <SectionGlyph section={section} size={size === "md" ? 17 : 14} />
    </span>
  );
}

/**
 * The sections down the left (desktop): «Все разборы» and each topic with how many lessons it
 * holds — for a signed-in account how many of them are watched («2/4», a full one is lit). At the
 * bottom, one line about what this account can watch.
 */
export function Sidebar({
  section,
  counts,
  audience,
  admin,
  introCount,
  signedIn,
  onSection,
}: {
  section: SectionPick;
  counts: SectionCounts;
  audience: Audience;
  admin: boolean;
  introCount: number;
  signedIn: boolean;
  onSection: (s: SectionPick) => void;
}) {
  const picks: SectionPick[] = ["all", ...tutorialCategories.map((c) => c.slug)];
  return (
    <nav aria-label="Разделы туториалов" className="glass arrive relative rounded-[1.75rem] p-2 [--i:3] lg:sticky lg:top-[calc(var(--nav-space)+0.75rem)]">
      {/* New Year theme (features/new-year): a little snow on the panel */}
      <NewYearSnowCap variant="draped" radius={28} lumps={7} seed={47} />

      <ul className="space-y-1">
        {picks.map((s, i) => {
          const active = s === section;
          const { total, watched } = counts[s];
          const done = signedIn && total > 0 && watched === total;
          return (
            <li key={s} className={cn(i === 1 && "mt-2 border-t border-white/6 pt-2")}>
              <button
                type="button"
                onClick={() => onSection(s)}
                aria-current={active ? "true" : undefined}
                className={cn(
                  "flex w-full items-center gap-3 rounded-[1.15rem] border px-2.5 py-2 text-left transition-[background-color,border-color,color,opacity] duration-300",
                  active ? "border-white/12 bg-white/[0.07] text-fg shadow-[inset_0_1px_0_rgb(255_255_255/0.1)]" : "border-transparent text-fg/65 hover:bg-white/[0.035] hover:text-fg",
                  total === 0 && !active && "opacity-45",
                )}
              >
                <SectionIconTile section={s} active={active} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14.5px] font-semibold">{sectionTitle(s)}</span>
                  {s !== "all" && <span className="block truncate text-[11.5px] text-dim">{sectionHint(s)}</span>}
                </span>
                {signedIn ? (
                  <span
                    className={cn("inline-flex items-center gap-1 font-mono text-[11px] tabular-nums", done ? "text-accent-soft" : "text-dim")}
                    aria-label={`просмотрено ${watched} из ${total}`}
                  >
                    {done && <CircleCheck size={12} aria-hidden />}
                    {watched}/{total}
                  </span>
                ) : (
                  <span className="font-mono text-[11px] text-dim tabular-nums" aria-label={lessonsCount(total)}>
                    {total}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <AccessNote audience={audience} admin={admin} introCount={introCount} className="mt-2 border-t border-white/6 px-2.5 pt-3.5 pb-2" />
    </nav>
  );
}

/** What this account can watch, in a line or two (the sidebar's foot; above the grid on phones). */
export function AccessNote({ audience, admin, introCount, className }: { audience: Audience; admin: boolean; introCount: number; className?: string }) {
  const linkClass = "inline-flex items-center gap-1 font-semibold text-accent-soft transition hover:text-fg";
  return (
    <div className={cn("flex gap-2.5 text-[12.5px] leading-relaxed text-muted", className)}>
      <span aria-hidden className="mt-0.5 shrink-0 text-accent-soft">
        {audience === "full" ? <CircleCheck size={15} /> : audience === "free" ? <LockOpen size={15} /> : <Lock size={15} />}
      </span>
      {audience === "full" ? (
        <p>{admin ? "Аккаунт администратора: все разборы открыты." : "Все разборы открыты. Просмотренное отмечается само."}</p>
      ) : audience === "free" ? (
        <p>
          {pluralRu(introCount, ["Открыт", "Открыты", "Открыты"])} {introCount} {pluralRu(introCount, ["вводный разбор", "вводных разбора", "вводных разборов"])}. Все
          разборы и новые уроки — в IDX PRO.{" "}
          <Link href={routes.pricing} className={linkClass}>
            Тарифы <ArrowRight size={12} />
          </Link>
        </p>
      ) : (
        <p>
          Смотреть можно с аккаунтом: вводные разборы бесплатны.{" "}
          <Link href={loginHref(routes.learn)} className={linkClass}>
            Войти
          </Link>{" "}
          или{" "}
          <Link href={registerHrefTo(routes.learn)} className={linkClass}>
            создать аккаунт
          </Link>
        </p>
      )}
    </div>
  );
}
