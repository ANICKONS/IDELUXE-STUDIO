"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, ChevronRight, Copy, Download, Layers, Lock, LockOpen, Package, UserRoundPlus, X } from "lucide-react";
import { AppTile } from "@/components/ui/app-tile";
import { registerHref, routes } from "@/config/routes";
import { plans, type SubscriptionPlan } from "@/content/plans";
import { addonKinds, formLabel, kindLabel, licenseLabel, osLabel, programName, type AddonKind, type OS } from "@/content/resource-taxonomy";
import { countOf, FormGlyph, ItemIcon, itemTint, OsGlyph, sectionIcon, subtitle } from "@/features/resources/glyphs";
import type { OsPref } from "@/features/resources/prefs";
import { Segmented } from "@/components/ui/segmented";
import type { Addon, AddonItem, Audience, Build, CatalogItem, CollectionItem, Compat, ProgramItem } from "@/features/resources/types";
import { formatRub } from "@/lib/format";
import { cn } from "@/lib/utils";

/** How the window got to the item on top: opened from a card, a step in, a step back. */
export type NavMove = "open" | "fwd" | "back";

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";
/** Corner radius of the cards the window grows out of, px (resource-card.tsx → rounded-[1.5rem]). */
const CARD_RADIUS = 24;

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const onScreen = (r: DOMRect) => r.width > 0 && r.bottom > 0 && r.top < window.innerHeight;
const px = (n: number) => `${Math.max(0, Math.round(n))}px`;
/** The window clipped down to a card's rectangle (both in viewport px). */
const clipTo = (panel: DOMRect, card: DOMRect) =>
  `inset(${px(card.top - panel.top)} ${px(panel.right - card.right)} ${px(panel.bottom - card.bottom)} ${px(card.left - panel.left)} round ${CARD_RADIUS}px ${CARD_RADIUS}px ${CARD_RADIUS}px ${CARD_RADIUS}px)`;

type Lookup = {
  byId: Map<string, CatalogItem>;
  programs: ProgramItem[];
  addons: Addon[];
};

/**
 * An item's window in the middle of the screen. It grows out of the card it was opened from (the
 * window is revealed from the card's rectangle and the icon flies over to its place), and folds
 * back into it on close. Inside: the cover, the name, the description; on the right what it is,
 * what it runs in and the download (with the version to pick). A program lists its plugins and
 * extensions, a collection its add-ons: opening one steps in, «Назад» steps back (`stack`: the way
 * here, the item on top is shown). Modal: focus stays inside, Escape, the backdrop and ✕ close it,
 * focus returns where it was.
 */
export function ItemDialog({
  stack,
  move,
  lookup,
  audience,
  os,
  onPush,
  onBack,
  onClosed,
}: {
  stack: string[];
  move: NavMove;
  lookup: Lookup;
  audience: Audience;
  os: OsPref;
  onPush: (id: string) => void;
  onBack: () => void;
  onClosed: () => void;
}) {
  const item = lookup.byId.get(stack[stack.length - 1]);
  const prev = stack.length > 1 ? lookup.byId.get(stack[stack.length - 2]) : undefined;

  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLSpanElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  /** The card it was opened from: the window grows out of it and folds back into it. */
  const originRef = useRef(stack[0]);
  const closingRef = useRef(false);
  const onClosedRef = useRef(onClosed);
  const titleId = useId();

  useEffect(() => {
    onClosedRef.current = onClosed;
  });

  const originCard = () => document.querySelector<HTMLElement>(`[data-res-card="${CSS.escape(originRef.current)}"]`);

  const close = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    const panel = panelRef.current;
    const card = originCard();
    const done = () => {
      if (card) delete card.dataset.lifted;
      onClosedRef.current();
    };
    if (!panel || reducedMotion()) return done();
    backdropRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 360, easing: "ease-in", fill: "forwards" });
    innerRef.current?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, easing: "ease-in", fill: "forwards" });
    const box = panel.getBoundingClientRect();
    const target = card?.getBoundingClientRect();
    let anim: Animation;
    if (card && target && onScreen(target)) {
      const radius = getComputedStyle(panel).borderRadius;
      anim = panel.animate([{ clipPath: `inset(0px 0px 0px 0px round ${radius})` }, { clipPath: clipTo(box, target), opacity: 0.35 }], {
        duration: 440,
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        fill: "forwards",
      });
      // The card comes back as the window lands on it
      window.setTimeout(() => delete card.dataset.lifted, 300);
    } else {
      anim = panel.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translate3d(0, 14px, 0) scale(0.98)" }], {
        duration: 280,
        easing: "ease-in",
        fill: "forwards",
      });
    }
    anim.onfinish = done;
  }, []);

  // Opening: the window is revealed out of its card, the icon flies over, the rest settles in
  useLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const card = originCard();
    if (reducedMotion()) return;
    if (card) card.dataset.lifted = "";
    backdropRef.current?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: "ease-out" });
    panel.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el, i) => {
      el.animate([{ opacity: 0, transform: "translate3d(0, 14px, 0)" }, { opacity: 1, transform: "none" }], {
        duration: 500,
        delay: 180 + i * 60,
        easing: EASE,
        fill: "backwards",
      });
    });
    const box = panel.getBoundingClientRect();
    const from = card?.getBoundingClientRect();
    if (card && from && onScreen(from)) {
      const radius = getComputedStyle(panel).borderRadius;
      panel.animate([{ clipPath: clipTo(box, from) }, { clipPath: `inset(0px 0px 0px 0px round ${radius})` }], { duration: 640, easing: EASE });
      const src = card.querySelector<HTMLElement>("[data-res-icon]")?.getBoundingClientRect();
      const dst = iconRef.current;
      const end = dst?.getBoundingClientRect();
      if (src && dst && end && end.width > 0) {
        dst.animate(
          [{ transform: `translate3d(${src.left - end.left}px, ${src.top - end.top}px, 0) scale(${src.width / end.width})` }, { transform: "none" }],
          { duration: 640, easing: EASE },
        );
      }
    } else {
      panel.animate([{ opacity: 0, transform: "translate3d(0, 18px, 0) scale(0.97)" }, { opacity: 1, transform: "none" }], { duration: 480, easing: EASE });
    }
  }, []);

  // While open: page scroll off, focus in and kept inside, Escape closes; focus back on the way out
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusable = [...panelRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled]), summary, [tabindex='0']")].filter(
        (el) => el.offsetParent !== null && !el.closest("[inert]"),
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      root.style.overflow = prevOverflow;
      opener?.focus?.({ preventScroll: true });
    };
  }, [close]);

  // A step in or back: to the top of the new item, its name announced
  const top = stack[stack.length - 1];
  const firstRef = useRef(true);
  useEffect(() => {
    if (firstRef.current) {
      firstRef.current = false;
      return;
    }
    scrollRef.current?.scrollTo({ top: 0 });
    document.getElementById(titleId)?.focus({ preventScroll: true });
  }, [top, titleId]);

  if (!item) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6">
      <div ref={backdropRef} aria-hidden className="absolute inset-0 bg-[rgb(3_4_6/0.66)] backdrop-blur-[4px]" onClick={close} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "glass glass-strong relative h-[calc(100svh-0.75rem)] w-full overflow-hidden rounded-t-[1.75rem] rounded-b-none",
          "sm:h-[min(48rem,calc(100svh-3rem))] sm:w-[min(62rem,100%)] sm:rounded-[1.75rem]",
        )}
      >
        <div ref={innerRef} className="flex h-full flex-col">
          {/* Top bar: the way back, or where this is; close */}
          <div className="flex h-16 shrink-0 items-center justify-between gap-3 px-4 sm:px-5">
            {prev ? (
              <button
                type="button"
                onClick={onBack}
                className="group/back inline-flex h-10 min-w-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] pr-4 pl-2.5 text-[13px] font-semibold text-fg/85 transition hover:border-white/18 hover:text-fg"
              >
                <ArrowLeft size={16} className="shrink-0 transition-transform group-hover/back:-translate-x-0.5" />
                Назад
                <span className="hidden truncate font-normal text-dim sm:inline">· {prev.name}</span>
              </button>
            ) : (
              <Crumbs item={item} lookup={lookup} />
            )}
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              aria-label="Закрыть"
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-fg/80 transition hover:bg-white/10 hover:text-fg"
            >
              <X size={18} />
            </button>
          </div>

          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-5 sm:px-5 sm:pb-6">
            <ItemView
              key={item.id}
              item={item}
              move={move}
              titleId={titleId}
              iconRef={iconRef}
              scrollRef={scrollRef}
              lookup={lookup}
              cameFrom={prev?.id}
              audience={audience}
              os={os}
              onPush={onPush}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Crumbs({ item, lookup }: { item: CatalogItem; lookup: Lookup }) {
  const Icon = sectionIcon[item.kind];
  const parent = item.kind !== "program" && item.form === "single" && item.collection ? lookup.byId.get(item.collection) : undefined;
  const tail = parent ? parent.name : item.kind !== "program" && item.form !== "single" ? formLabel[item.form].one : null;
  return (
    <p className="flex min-w-0 items-center gap-2 pl-1 font-mono text-[10.5px] tracking-[0.18em] text-dim uppercase">
      <Icon size={14} aria-hidden className="shrink-0 text-accent-soft" />
      <span className="truncate">
        {kindLabel[item.kind].many}
        {tail && ` · ${tail}`}
      </span>
    </p>
  );
}

/** The add-ons a program has (as they're laid out in the hub: modules, collections, single ones). */
function addonsFor(program: ProgramItem, kind: AddonKind, addons: Addon[]): Addon[] {
  return addons.filter((a) => a.kind === kind && a.hosts.includes(program.programId) && !(a.form === "single" && a.collection));
}

/** What a collection's add-ons run in, without repeats. */
function collectionCompat(c: CollectionItem, byId: Map<string, CatalogItem>): Compat[] {
  const seen = new Map<string, Compat>();
  for (const id of c.children) {
    const child = byId.get(id);
    if (!child || child.kind === "program" || child.form === "collection") continue;
    for (const x of child.builds[0]?.compat ?? []) seen.set(`${x.program}-${x.year}`, x);
  }
  return [...seen.values()];
}

/** One item's contents. Re-mounts per item: a step in slides in from the right, back — from the left. */
function ItemView({
  item,
  move,
  titleId,
  iconRef,
  scrollRef,
  lookup,
  cameFrom,
  audience,
  os,
  onPush,
}: {
  item: CatalogItem;
  move: NavMove;
  titleId: string;
  iconRef: React.RefObject<HTMLSpanElement | null>;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  lookup: Lookup;
  /** The item a step back returns to (no «Из коллекции» link to it then). */
  cameFrom?: string;
  audience: Audience;
  os: OsPref;
  onPush: (id: string) => void;
}) {
  const { byId, programs, addons } = lookup;
  const downloadable = item.kind === "program" || item.form !== "collection";
  const builds = downloadable ? (item as ProgramItem | AddonItem).builds : [];
  const [buildId, setBuildId] = useState(builds[0]?.id ?? "");
  const build = builds.find((b) => b.id === buildId) ?? builds[0];
  // The system the download and the steps are for: the visitor's, when the item runs on it
  const [target, setTarget] = useState<OS>(os !== "all" && item.os.includes(os) ? os : item.os[0]);
  const installRef = useRef<HTMLDetailsElement>(null);

  const parent = item.kind !== "program" && item.form === "single" && item.collection ? (byId.get(item.collection) as CollectionItem | undefined) : undefined;
  const compat = item.kind === "program" ? [] : item.form === "collection" ? collectionCompat(item, byId) : (build?.compat ?? []);

  const showInstall = () => {
    const details = installRef.current;
    if (!details) return;
    details.open = true;
    const scroller = scrollRef.current;
    if (scroller) {
      const y = details.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop - 12;
      scroller.scrollTo({ top: y, behavior: reducedMotion() ? "auto" : "smooth" });
    }
    details.querySelector("summary")?.focus({ preventScroll: true });
  };

  return (
    <div className={cn("res-dialog-grid", move === "fwd" && "res-swap-fwd", move === "back" && "res-swap-back")}>
      {/* Cover, icon, what kind of item, name */}
      <div className="res-area-head min-w-0">
        <div className="res-banner relative h-32 overflow-hidden rounded-[1.35rem] sm:h-40" style={{ "--tint": itemTint(item) } as React.CSSProperties} aria-hidden />
        <div className="relative -mt-11 px-4 sm:-mt-12 sm:px-5">
          {/* origin-top-left: the opening flight scales it from the card's icon */}
          <span ref={iconRef} className="inline-block origin-top-left drop-shadow-[0_16px_28px_rgb(0_0_0/0.55)]">
            <ItemIcon item={item} size={88} />
          </span>
        </div>
        <div data-reveal className="mt-4 px-1 sm:px-2">
          {item.kind !== "program" && (item.form !== "single" || (parent && parent.id !== cameFrom)) && (
            <p className="mb-2.5 flex flex-wrap gap-1.5">
              {item.form === "module" && (
                <Badge icon={<Package size={12} />}>Модуль · собран IDELUXE</Badge>
              )}
              {item.form === "collection" && <Badge icon={<Layers size={12} />}>Коллекция · {countOf(item.children.length, item.kind)}</Badge>}
              {parent && parent.id !== cameFrom && (
                <button
                  type="button"
                  onClick={() => onPush(parent.id)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/8 px-2.5 py-1 text-[12px] text-accent-soft transition hover:border-accent/45 hover:text-fg"
                >
                  <Layers size={12} aria-hidden /> Из коллекции «{parent.name}» <ChevronRight size={12} aria-hidden />
                </button>
              )}
            </p>
          )}
          <h2 id={titleId} tabIndex={-1} className="font-display text-[1.85rem] leading-[1.1] font-semibold tracking-tight outline-none sm:text-[2.35rem]">
            {item.name}
          </h2>
          <p className="mt-2 text-[15px] leading-relaxed text-muted">{item.summary}</p>
        </div>
      </div>

      {/* What it is, what it runs in, the download */}
      <aside data-reveal className="res-area-aside space-y-3">
        <dl className="space-y-4 rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-4 sm:p-5">
          {item.vendor && <Info title="Разработчик">{item.vendor}</Info>}
          <Info title="Системы">
            <span className="flex flex-wrap gap-x-3.5 gap-y-1.5">
              {item.os.map((o) => (
                <span key={o} className="inline-flex items-center gap-1.5">
                  <OsGlyph os={o} size={13} className="text-fg/70" /> {osLabel[o]}
                </span>
              ))}
            </span>
          </Info>
          {downloadable && (item as ProgramItem | AddonItem).license && <Info title="Доступ">{licenseLabel[(item as ProgramItem | AddonItem).license!]}</Info>}
          {compat.length > 0 && (
            <Info title="Совместимость">
              <span className="mt-0.5 flex flex-wrap gap-1.5">
                {compat.map((c) => (
                  <ProgramLink key={`${c.program}-${c.year}`} compat={c} programs={programs} onPush={onPush} />
                ))}
              </span>
            </Info>
          )}
          {item.kind === "program" && <Info title="Для чего">{item.role}</Info>}
        </dl>
        {downloadable && build ? (
          <DownloadCard
            item={item as ProgramItem | AddonItem}
            build={build}
            onBuild={setBuildId}
            audience={audience}
            target={target}
            onTarget={setTarget}
            onShowInstall={showInstall}
          />
        ) : (
          item.kind !== "program" &&
          item.form === "collection" && (
            <div className="flex gap-3 rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-4 text-[13px] leading-relaxed text-muted sm:p-5">
              <Layers size={16} aria-hidden className="mt-0.5 shrink-0 text-accent-soft" />
              <p>В коллекции {countOf(item.children.length, item.kind)}: каждый открывается и скачивается отдельно — выбери в списке.</p>
            </div>
          )
        )}
      </aside>

      {/* About, what's inside, installation */}
      <div className="res-area-body min-w-0 space-y-3">
        <section data-reveal className="px-1 pb-3 sm:px-2">
          <h3 className="font-mono text-[10.5px] tracking-[0.18em] text-dim uppercase">Описание</h3>
          <p className="mt-2.5 text-[15px] leading-relaxed text-fg/85">{item.about}</p>
        </section>

        {item.kind !== "program" && item.form === "module" && item.contents && (
          <details data-reveal open className="disclosure group rounded-[1.35rem] border border-white/8 bg-white/[0.025]">
            <Summary title="Что внутри" count={item.contents.length} icon={<GroupIcon icon={<Package size={15} />} />} />
            <div className="disclosure-body">
              <ul className="grid gap-x-4 gap-y-1 px-4 pb-4 sm:grid-cols-2 sm:px-5">
                {item.contents.map((c) => (
                  <li key={c.name} className="flex items-baseline gap-2.5 py-1.5 text-[14px]">
                    <Check size={14} aria-hidden className="shrink-0 translate-y-0.5 text-accent" />
                    <span className="min-w-0">
                      <span className="font-semibold text-fg">{c.name}</span>
                      {c.note && <span className="text-[12.5px] text-dim"> — {c.note}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </details>
        )}

        {item.kind !== "program" && item.form === "collection" && (
          <AddonGroup
            title={`${kindLabel[item.kind].many} в коллекции`}
            items={item.children.map((id) => byId.get(id)).filter((x): x is AddonItem => !!x && x.kind !== "program" && x.form !== "collection")}
            kind={item.kind}
            audience={audience}
            defaultOpen
            onPush={onPush}
          />
        )}

        {item.kind === "program" &&
          addonKinds.map((kind, i) => {
            const list = addonsFor(item, kind, addons);
            return list.length ? <AddonGroup key={kind} title={kindLabel[kind].many} items={list} kind={kind} audience={audience} defaultOpen={i === 0} onPush={onPush} /> : null;
          })}

        {downloadable && (
          <details ref={installRef} data-reveal className="disclosure group rounded-[1.35rem] border border-white/8 bg-white/[0.025]">
            <Summary title="Как установить" hint={`для ${osLabel[target]}`} />
            <div className="disclosure-body">
              <ol className="space-y-3 px-4 pb-5 sm:px-5">
                {(item as ProgramItem | AddonItem).steps.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full border border-accent/30 bg-accent/10 font-mono text-[11px] text-accent-soft">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1 text-[14px] leading-relaxed text-fg/85">
                      {step.text}
                      {step.path?.[target] && <CopyPath path={step.path[target]!} />}
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </details>
        )}
      </div>
    </div>
  );
}

function Badge({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[12px] text-fg/75">
      <span aria-hidden className="text-accent-soft">
        {icon}
      </span>
      {children}
    </span>
  );
}

function Info({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[12px] text-dim">{title}</dt>
      <dd className="mt-1 text-[14px] text-fg/90">{children}</dd>
    </div>
  );
}

/** «Ae After Effects 2026»: opens the program's window. */
function ProgramLink({ compat, programs, onPush }: { compat: Compat; programs: ProgramItem[]; onPush: (id: string) => void }) {
  const program = programs.find((p) => p.programId === compat.program);
  const label = `${programName[compat.program]} ${compat.year}`;
  if (!program) return <span>{label}</span>;
  return (
    <button
      type="button"
      onClick={() => onPush(program.id)}
      className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/[0.03] py-0.5 pr-2.5 pl-0.5 text-[12.5px] text-fg/85 transition hover:border-accent/35 hover:text-fg"
    >
      <AppTile code={program.code} size={20} /> {label}
    </button>
  );
}

function GroupIcon({ icon }: { icon: React.ReactNode }) {
  return (
    <span aria-hidden className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 text-accent-soft">
      {icon}
    </span>
  );
}

function Summary({ title, count, icon, hint }: { title: string; count?: number; icon?: React.ReactNode; hint?: string }) {
  return (
    <summary className="flex cursor-pointer list-none items-center gap-3 rounded-[1.35rem] px-4 py-3.5 text-left sm:px-5 [&::-webkit-details-marker]:hidden">
      {icon}
      <span className="flex-1 text-[14.5px] font-semibold text-fg">
        {title}
        {count !== undefined && <span className="ml-2 font-mono text-[11px] font-normal text-dim">{count}</span>}
        {hint && <span className="ml-2 text-[12.5px] font-normal text-dim">{hint}</span>}
      </span>
      <span
        aria-hidden
        className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-open:rotate-180"
      >
        <ChevronDown size={14} />
      </span>
    </summary>
  );
}

/** A list of add-ons folded under one heading (a program's plugins, a collection's items); each opens its own window. */
function AddonGroup({
  title,
  items,
  kind,
  audience,
  defaultOpen,
  onPush,
}: {
  title: string;
  items: Addon[];
  kind: AddonKind;
  audience: Audience;
  defaultOpen: boolean;
  onPush: (id: string) => void;
}) {
  const Icon = sectionIcon[kind];
  return (
    <details data-reveal open={defaultOpen} className="disclosure group rounded-[1.35rem] border border-white/8 bg-white/[0.025]">
      <Summary title={title} count={items.length} icon={<GroupIcon icon={<Icon size={15} />} />} />
      <div className="disclosure-body">
        <ul className="grid gap-2 px-3 pb-3 sm:grid-cols-2">
          {items.map((a) => {
            const locked = audience === "free" && !a.open;
            return (
              <li key={a.id}>
                <button
                  type="button"
                  onClick={() => onPush(a.id)}
                  className="group/row flex w-full items-center gap-3 rounded-2xl border border-transparent px-2 py-2 text-left transition hover:border-white/8 hover:bg-white/[0.04]"
                >
                  <ItemIcon item={a} size={38} />
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className={cn("block truncate text-[14px] font-semibold", locked ? "text-fg/65" : "text-fg")}>{a.name}</span>
                    <span className="mt-0.5 flex items-center gap-1 truncate text-[12px] text-dim">
                      {a.form !== "single" && <FormGlyph kind={a.kind} form={a.form} size={11} className="shrink-0" />}
                      {a.form !== "single" ? `${formLabel[a.form].one} · ${subtitle(a)}` : subtitle(a)}
                    </span>
                  </span>
                  {locked && <Lock size={13} aria-label="закрыт" className="shrink-0 text-dim" />}
                  {audience === "guest" && a.free && <LockOpen size={13} aria-label="бесплатно с аккаунтом" className="shrink-0 text-accent" />}
                  <ChevronRight size={16} aria-hidden className="shrink-0 text-dim transition-transform group-hover/row:translate-x-0.5 group-hover/row:text-fg/70" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </details>
  );
}

/** A folder path in a mono box with a copy button. */
function CopyPath({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timer);
  }, [copied]);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(path);
      setCopied(true);
    } catch {
      // No clipboard (insecure context): the path stays selectable by hand
    }
  };
  return (
    <span className="mt-2 flex items-start gap-2 rounded-xl border border-white/8 bg-ink-950/60 py-2 pr-2 pl-3">
      <code className="min-w-0 flex-1 font-mono text-[12px] leading-relaxed break-all text-accent-soft/90 select-all">{path}</code>
      <button
        type="button"
        onClick={copy}
        aria-label={copied ? "Скопировано" : "Скопировать путь"}
        className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-fg/60 transition hover:bg-white/8 hover:text-fg"
      >
        {copied ? <Check size={14} className="text-accent" /> : <Copy size={14} />}
      </button>
    </span>
  );
}

const lite = plans.lite as SubscriptionPlan;

/**
 * The download: the version (a program's year, an add-on's variant), the system, and the button —
 * the direct file, the developer's site while there's no link yet, or a note that the link is
 * coming; or what opens it for this account.
 */
function DownloadCard({
  item,
  build,
  onBuild,
  audience,
  target,
  onTarget,
  onShowInstall,
}: {
  item: ProgramItem | AddonItem;
  build: Build;
  onBuild: (id: string) => void;
  audience: Audience;
  target: OS;
  onTarget: (os: OS) => void;
  onShowInstall: () => void;
}) {
  const direct = item.open ? build.downloads?.[target] : undefined;
  const many = item.builds.length > 1;

  const versions = many && (
    <div>
      <p className="mb-2 text-[12px] text-dim">Версия</p>
      <Segmented
        label="Версия"
        size="sm"
        block
        value={build.id}
        onChange={onBuild}
        options={item.builds.map((b) => ({
          value: b.id,
          label: (
            <>
              {b.label}
              {b.hint && <span className="font-mono text-[10px] font-normal text-dim">{b.hint}</span>}
            </>
          ),
        }))}
      />
    </div>
  );

  return (
    <div className="space-y-3 rounded-[1.35rem] border border-white/8 bg-white/[0.03] p-4 sm:p-5">
      {item.open ? (
        <>
          {versions}
          {item.os.length > 1 && (
            <div>
              {many && <p className="mb-2 text-[12px] text-dim">Система</p>}
              <Segmented
                label="Система"
                size="sm"
                block
                value={target}
                onChange={onTarget}
                options={item.os.map((o) => ({ value: o, label: osLabel[o], icon: <OsGlyph os={o} size={12} /> }))}
              />
            </div>
          )}
          {direct ? (
            <a href={direct} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-md w-full">
              <Download size={17} /> Скачать для {osLabel[target]}
            </a>
          ) : item.site ? (
            <a href={item.site} target="_blank" rel="noopener noreferrer" className="btn btn-primary btn-md w-full">
              <Download size={17} /> Скачать с сайта <ArrowUpRight size={15} className="-ml-0.5" />
            </a>
          ) : (
            <button type="button" disabled className="btn btn-glass btn-md w-full">
              Ссылка появится скоро
            </button>
          )}
          <button type="button" onClick={onShowInstall} className="inline-flex w-full items-center justify-center gap-1.5 text-[12.5px] font-semibold text-accent-soft transition hover:text-fg">
            Как установить <ArrowDown size={13} />
          </button>
        </>
      ) : audience === "guest" ? (
        <>
          {versions}
          <Locked
            icon={item.free ? <LockOpen size={16} /> : <Lock size={16} />}
            title={item.free ? "Бесплатно с аккаунтом" : "Скачивание — после входа"}
            text={item.free ? "Создай аккаунт — и скачивай." : `Весь каталог — в IDX LITE от ${formatRub(lite.monthRub)} в месяц.`}
          />
          <Link href={routes.login} className="btn btn-primary btn-md w-full">
            Войти <ArrowRight size={16} />
          </Link>
          <Link href={registerHref} className="btn btn-glass btn-md w-full">
            <UserRoundPlus size={16} /> Создать аккаунт
          </Link>
        </>
      ) : (
        <>
          {versions}
          <Locked icon={<Lock size={16} />} title="Открывается в IDX LITE" text={`Весь раздел «Ресурсы» — от ${formatRub(lite.monthRub)} в месяц, или в IDX PRO.`} />
          <Link href={routes.pricing} className="btn btn-primary btn-md w-full">
            Тарифы <ArrowRight size={16} />
          </Link>
        </>
      )}
    </div>
  );
}

function Locked({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-3">
      <span aria-hidden className="mt-0.5 inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 text-accent-soft">
        {icon}
      </span>
      <div>
        <p className="text-[14px] font-semibold text-fg">{title}</p>
        <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">{text}</p>
      </div>
    </div>
  );
}
