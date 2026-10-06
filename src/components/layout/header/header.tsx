"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Menu, Star, X } from "lucide-react";
import { LogoMark } from "@/components/icons";
import { Avatar } from "@/components/ui/avatar";
import { HashLink } from "@/components/layout/hash-link";
import { MobileNav } from "@/components/layout/header/mobile-nav";
import { TelegramMenu } from "@/components/layout/header/telegram-menu";
import { mainNav, type NavItem } from "@/config/navigation";
import { anchorHref, landingAnchors, routes } from "@/config/routes";
import type { SessionUser } from "@/types/session";
import { cn } from "@/lib/utils";

/** Scroll distance (px) where the bar detaches into a floating panel, with hysteresis to avoid flicker. */
const FLOAT_ON = 48;
const FLOAT_OFF = 16;
/** A section counts as "current" once its top passes this share of the viewport height. */
const PROBE = 0.38;

const navSections = new Set(mainNav.flatMap((n) => (n.section ? [n.section] : [])));

/**
 * Landing sections without their own menu item belong to the nearest menu section above them
 * (audience → «Обо мне», the final CTA → «FAQ»), so some tab is always highlighted. The hero
 * section has no menu id: everything above «Обо мне» counts as «Главная».
 */
function currentSection() {
  const probe = window.innerHeight * PROBE;
  let owner: string = landingAnchors.home;
  let current: string = landingAnchors.home;
  for (const el of document.querySelectorAll<HTMLElement>("main section[id]")) {
    if (navSections.has(el.id)) owner = el.id;
    if (el.getBoundingClientRect().top > probe) break;
    current = owner;
  }
  return current;
}

/**
 * At the top: a full-width glass bar. After scrolling it smoothly detaches into a floating
 * rounded panel. A glass pill slides to the active tab; the bottom edge shows scroll progress.
 */
export function Header({ user }: { user: SessionUser | null }) {
  const pathname = usePathname();
  const isLanding = pathname === routes.home;
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<string>(landingAnchors.home);

  const headerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLUListElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  /** After a menu click the target stays highlighted until the smooth scroll settles. */
  const lockUntilRef = useRef(0);

  // Scroll: floating state + progress (DOM only) and, on the landing, the current section.
  useEffect(() => {
    let frame = 0;
    const update = () => {
      const header = headerRef.current;
      if (header) {
        const y = window.scrollY;
        const floating = header.dataset.floating === "true";
        if (!floating && y > FLOAT_ON) header.dataset.floating = "true";
        else if (floating && y < FLOAT_OFF) header.dataset.floating = "false";
        const max = document.documentElement.scrollHeight - window.innerHeight;
        header.style.setProperty("--progress", String(max > 0 ? Math.min(1, Math.max(0, y / max)) : 0));
      }
      if (isLanding && performance.now() > lockUntilRef.current) setSection(currentSection());
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    const onScrollEnd = () => {
      lockUntilRef.current = 0;
      onScroll();
    };
    frame = requestAnimationFrame(update);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scrollend", onScrollEnd);
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scrollend", onScrollEnd);
      window.removeEventListener("resize", onScroll);
    };
  }, [isLanding]);

  // Mobile sheet: Escape closes it, page behind doesn't scroll, desktop width closes it.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const desktop = window.matchMedia("(min-width: 1024px)");
    const onDesktop = () => desktop.matches && setOpen(false);
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    desktop.addEventListener("change", onDesktop);
    return () => {
      root.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      desktop.removeEventListener("change", onDesktop);
    };
  }, [open]);

  const isActive = useCallback(
    (item: NavItem) => (item.section ? isLanding && section === item.section : pathname.startsWith(item.href)),
    [isLanding, section, pathname],
  );
  const activeHref = mainNav.find(isActive)?.href ?? null;

  /** Highlight a landing tab right away on click (the smooth scroll would pass other sections first). */
  const onNavClick = (item: NavItem) => {
    setOpen(false);
    if (!item.section || !isLanding) return;
    lockUntilRef.current = performance.now() + 1500;
    setSection(item.section);
  };

  // Slide the glass pill under the active tab (and follow it when the bar resizes while floating).
  const placePill = useCallback(() => {
    const pill = pillRef.current;
    const nav = navRef.current;
    if (!pill || !nav) return;
    const link = activeHref ? nav.querySelector<HTMLElement>(`a[href="${activeHref}"]`) : null;
    if (!link) {
      pill.style.opacity = "0";
      return;
    }
    // Offsets of the <li> (its offsetParent is the <ul>), not transforms/rects: stable during the bar's resize.
    const item = link.closest("li") ?? link;
    pill.style.opacity = "1";
    pill.style.width = `${item.offsetWidth}px`;
    pill.style.transform = `translateX(${item.offsetLeft}px)`;
  }, [activeHref]);

  useLayoutEffect(() => {
    placePill();
  }, [placePill]);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const observer = new ResizeObserver(() => placePill());
    observer.observe(nav);
    document.fonts?.ready.then(placePill).catch(() => {});
    return () => observer.disconnect();
  }, [placePill]);

  return (
    <header
      ref={headerRef}
      data-floating="false"
      className="group/header fixed inset-x-0 top-0 z-50 transition-[padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] data-[floating=true]:px-2 data-[floating=true]:pt-2 sm:data-[floating=true]:px-4 sm:data-[floating=true]:pt-3"
      style={{ ["--progress" as string]: 0 }}
    >
      <div
        className={cn(
          "relative mx-auto max-w-full border border-transparent border-b-white/[0.08] bg-ink-950/40 backdrop-blur-xl backdrop-saturate-150",
          "transition-[max-width,border-radius,background-color,border-color,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
          "group-data-[floating=true]/header:max-w-6xl group-data-[floating=true]/header:rounded-[1.75rem] group-data-[floating=true]/header:border-white/12",
          "group-data-[floating=true]/header:bg-ink-950/75 group-data-[floating=true]/header:shadow-[0_24px_60px_-20px_rgb(0_0_0/0.85),inset_0_1px_0_rgb(255_255_255/0.08)]",
        )}
      >
        <div
          className={cn(
            "mx-auto flex h-[72px] max-w-7xl items-center gap-4 px-4 sm:px-6",
            "transition-[height,padding] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            "group-data-[floating=true]/header:h-[58px] group-data-[floating=true]/header:px-3 sm:group-data-[floating=true]/header:px-4",
          )}
        >
          {/* Brand */}
          {/* The logo goes to the very top of the landing (the «Главная» tab goes to the editor) */}
          <HashLink href={anchorHref(landingAnchors.top)} onClick={() => onNavClick(mainNav[0])} className="flex min-w-0 flex-1 shrink-0 items-center gap-2.5 rounded-lg lg:flex-none" aria-label="IDELUXE — на главную">
            <LogoMark size={32} />
            <span className="font-display text-[15px] font-semibold tracking-[0.08em] text-fg">IDELUXE</span>
          </HashLink>

          {/* Desktop navigation */}
          <nav aria-label="Основная навигация" className="hidden flex-1 justify-center lg:flex">
            <ul ref={navRef} className="relative flex items-center gap-1 xl:gap-2">
              {/* Sliding "selected" pill with a keyframe diamond */}
              <span
                ref={pillRef}
                aria-hidden
                className="pointer-events-none absolute top-0 left-0 h-full rounded-full border border-white/12 bg-white/[0.08] opacity-0 shadow-[inset_0_1px_0_rgb(255_255_255/0.16),0_6px_18px_-8px_rgb(107_91_255/0.8)] transition-[transform,width,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
              >
                <span className="absolute -bottom-[4px] left-1/2 size-[7px] -translate-x-1/2 rotate-45 rounded-[1.5px] bg-accent-soft shadow-[0_0_10px_2px_rgb(160_148_255/0.85)]" />
              </span>
              {mainNav.map((item) => {
                const active = item.href === activeHref;
                return (
                  <li key={item.href} className="relative z-10">
                    <HashLink
                      href={item.href}
                      onClick={() => onNavClick(item)}
                      aria-current={active ? (item.section ? "location" : "page") : undefined}
                      className={cn(
                        "inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-[12px] font-semibold tracking-[0.14em] uppercase transition-colors duration-300",
                        item.highlight ? "text-neon-glow hover:brightness-125" : active ? "text-fg" : "text-fg/50 hover:text-fg",
                      )}
                    >
                      {item.highlight && <Star size={13} className="fill-current" aria-hidden />}
                      {item.label}
                    </HashLink>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Actions */}
          <div className="flex flex-1 items-center justify-end gap-2.5 lg:flex-none">
            <TelegramMenu className="hidden sm:block" />
            {user ? (
              <Link href={routes.profile} className="btn btn-glass h-10 gap-2 rounded-full pr-4 pl-1.5 text-sm" aria-label="Открыть профиль">
                <Avatar name={user.name} src={user.avatarUrl} size={28} />
                <span className="hidden max-w-28 truncate sm:inline">{user.name}</span>
              </Link>
            ) : (
              <Link href={routes.login} className="btn btn-primary h-10 px-6 font-display text-[12px] tracking-[0.12em] uppercase">
                Войти
              </Link>
            )}
            <button
              type="button"
              className="inline-flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-fg/80 transition hover:bg-white/10 lg:hidden"
              aria-label={open ? "Закрыть меню" : "Открыть меню"}
              aria-expanded={open}
              aria-controls="mobile-nav"
              onClick={() => setOpen((v) => !v)}
            >
              {open ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>

        {/* Scroll progress on the bottom edge; pulls in from the rounded corners when floating */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -bottom-px h-px transition-[left,right] duration-500 group-data-[floating=true]/header:inset-x-7"
        >
          <div className="h-full bg-gradient-to-r from-accent-strong/0 via-accent to-pink" style={{ width: "calc(var(--progress) * 100%)" }} />
          <div
            className="absolute -top-[4px] h-[9px] w-px bg-pink shadow-[0_0_8px_1px_rgb(233_168_255/0.9)]"
            style={{ left: "calc(var(--progress) * 100%)" }}
          />
        </div>
      </div>

      {open && <MobileNav items={mainNav} isActive={isActive} user={user} onNavigate={onNavClick} />}
    </header>
  );
}
