"use client";

import Link from "next/link";
import { ArrowRight, ChevronDown, CircleCheck, Lock, LockOpen } from "lucide-react";
import { registerHref, routes } from "@/config/routes";
import { formLabel, kindLabel, sections, type AddonForm, type ResourceKind } from "@/content/resource-taxonomy";
import type { FormFilter } from "@/features/resources/filter";
import { FormGlyph, sectionIcon } from "@/features/resources/glyphs";
import type { Audience } from "@/features/resources/types";
import { NewYearSnowCap } from "@/features/new-year";
import { pluralRu } from "@/lib/format";
import { cn } from "@/lib/utils";

/** A form's name in a section: «Модули», «Коллекции», and the section's own name for single add-ons. */
export function formName(section: ResourceKind, form: FormFilter): string {
  if (form === "all") return "Все";
  return form === "single" ? kindLabel[section].many : formLabel[form].many;
}

/**
 * The hub's sections down the left (desktop): Программы, Плагины, Расширения with how many each
 * holds. The picked one opens its groups under it — modules, collections, add-ons one by one
 * (sliding, resources.css → .res-collapse). At the bottom, one line about what this account can download.
 */
export function Sidebar({
  section,
  form,
  sectionCounts,
  formCounts,
  formsBySection,
  audience,
  admin,
  openCount,
  onSection,
  onForm,
}: {
  section: ResourceKind;
  form: FormFilter;
  sectionCounts: Record<ResourceKind, number>;
  /** Cards per form in the open section, with the other filters applied. */
  formCounts: Record<FormFilter, number>;
  /** The forms each section has at all (the list doesn't jump while filtering). */
  formsBySection: Record<ResourceKind, AddonForm[]>;
  audience: Audience;
  admin: boolean;
  openCount: number;
  onSection: (section: ResourceKind) => void;
  onForm: (form: FormFilter) => void;
}) {
  return (
    <nav aria-label="Разделы ресурсов" className="glass arrive relative rounded-[1.75rem] p-2 [--i:3] lg:sticky lg:top-[calc(var(--nav-space)+0.75rem)]">
      {/* New Year theme (features/new-year): a little snow on the panel */}
      <NewYearSnowCap variant="draped" radius={28} lumps={7} seed={31} />

      <ul className="space-y-1">
        {sections.map((s) => {
          const Icon = sectionIcon[s];
          const active = s === section;
          const groups = formsBySection[s];
          const expandable = groups.length > 1;
          return (
            <li key={s}>
              <button
                type="button"
                onClick={() => onSection(s)}
                aria-current={active ? "true" : undefined}
                aria-expanded={expandable ? active : undefined}
                className={cn(
                  "flex w-full items-center gap-3 rounded-[1.15rem] border px-2.5 py-2 text-left transition-[background-color,border-color,color] duration-300",
                  active ? "border-white/12 bg-white/[0.07] text-fg shadow-[inset_0_1px_0_rgb(255_255_255/0.1)]" : "border-transparent text-fg/65 hover:bg-white/[0.035] hover:text-fg",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "inline-flex size-9 shrink-0 items-center justify-center rounded-xl border transition-colors duration-300",
                    active ? "border-accent/35 bg-accent/12 text-accent-soft" : "border-white/8 bg-white/[0.03] text-fg/55",
                  )}
                >
                  <Icon size={17} />
                </span>
                <span className="flex-1 text-[14.5px] font-semibold">{kindLabel[s].many}</span>
                <span className="font-mono text-[11px] text-dim tabular-nums">{sectionCounts[s]}</span>
                {expandable && <ChevronDown size={15} aria-hidden className={cn("shrink-0 text-dim transition-transform duration-500", active && "rotate-180 text-fg/70")} />}
              </button>

              {expandable && (
                <div className="res-collapse" data-open={active || undefined} inert={!active}>
                  <div>
                    <ul className="space-y-0.5 py-1.5 pr-1 pl-[1.1rem]" aria-label={`Группы: ${kindLabel[s].many.toLowerCase()}`}>
                      {(["all", ...groups] as FormFilter[]).map((g) => {
                        const picked = active && g === form;
                        const count = active ? formCounts[g] : 0;
                        return (
                          <li key={g}>
                            <button
                              type="button"
                              onClick={() => onForm(g)}
                              aria-current={picked ? "true" : undefined}
                              className={cn(
                                "relative flex w-full items-center gap-2.5 rounded-xl py-1.5 pr-2 pl-3 text-left text-[13px] transition-colors",
                                picked ? "text-fg" : "text-fg/60 hover:text-fg",
                                count === 0 && !picked && "opacity-45",
                              )}
                            >
                              {/* The keyframe diamond marks the picked one, as in the header's menu */}
                              <span
                                aria-hidden
                                className={cn(
                                  "absolute left-0 size-[6px] rotate-45 rounded-[1.5px] bg-accent shadow-[0_0_8px_1px_rgb(var(--rgb-accent)/0.55)] transition-[opacity,scale] duration-300",
                                  picked ? "scale-100 opacity-100" : "scale-50 opacity-0",
                                )}
                              />
                              <FormGlyph kind={s} form={g} size={14} className={cn("shrink-0", picked ? "text-accent-soft" : "text-dim")} />
                              <span className="flex-1 truncate">{formName(s, g)}</span>
                              <span className="font-mono text-[10.5px] text-dim tabular-nums">{count}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <AccessNote audience={audience} admin={admin} openCount={openCount} className="mt-2 border-t border-white/6 px-2.5 pt-3.5 pb-2" />
    </nav>
  );
}

/** What this account can download, in a line or two (the sidebar's foot; above the grid on phones). */
export function AccessNote({ audience, admin, openCount, className }: { audience: Audience; admin: boolean; openCount: number; className?: string }) {
  const linkClass = "inline-flex items-center gap-1 font-semibold text-accent-soft transition hover:text-fg";
  return (
    <div className={cn("flex gap-2.5 text-[12.5px] leading-relaxed text-muted", className)}>
      <span aria-hidden className="mt-0.5 shrink-0 text-accent-soft">
        {audience === "full" ? <CircleCheck size={15} /> : audience === "free" ? <LockOpen size={15} /> : <Lock size={15} />}
      </span>
      {audience === "full" ? (
        <p>{admin ? "Аккаунт администратора: весь каталог открыт." : "Весь каталог открыт: ссылки и установка по шагам."}</p>
      ) : audience === "free" ? (
        <p>
          Открыты программы и {openCount} {pluralRu(openCount, ["бесплатная позиция", "бесплатные позиции", "бесплатных позиций"])}. Весь каталог — в IDX LITE.{" "}
          <Link href={routes.pricing} className={linkClass}>
            Тарифы <ArrowRight size={12} />
          </Link>
        </p>
      ) : (
        <p>
          Скачивание — с аккаунтом: программы и бесплатные плагины открываются сразу.{" "}
          <Link href={routes.login} className={linkClass}>
            Войти
          </Link>{" "}
          или{" "}
          <Link href={registerHref} className={linkClass}>
            создать аккаунт
          </Link>
        </p>
      )}
    </div>
  );
}
