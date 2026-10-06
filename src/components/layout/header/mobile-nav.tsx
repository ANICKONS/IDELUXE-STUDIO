"use client";

import Link from "next/link";
import { Star } from "lucide-react";
import { TelegramIcon } from "@/components/icons";
import { HashLink } from "@/components/layout/hash-link";
import { telegramLinks, type NavItem } from "@/config/navigation";
import { routes } from "@/config/routes";
import type { SessionUser } from "@/types/session";
import { cn } from "@/lib/utils";

/** Full-screen sheet under the header on phones and tablets (below lg). */
export function MobileNav({
  items,
  isActive,
  user,
  onNavigate,
}: {
  items: NavItem[];
  isActive: (item: NavItem) => boolean;
  user: SessionUser | null;
  onNavigate: (item: NavItem) => void;
}) {
  return (
    // Header bottom is 72px in both states (72px bar, or 12px offset + 58px floating panel + margin).
    <div id="mobile-nav" className="fixed inset-x-0 top-[72px] bottom-0 animate-fade-up overflow-y-auto bg-ink-950/90 backdrop-blur-2xl lg:hidden">
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-80 bg-[radial-gradient(60%_100%_at_50%_0%,rgb(107_91_255/0.35),transparent_70%)]" />
      <nav aria-label="Мобильная навигация" className="relative mx-auto max-w-lg px-4 pt-6 pb-12">
        <Link
          href={user ? routes.profile : routes.login}
          onClick={() => onNavigate(items[0])}
          className="btn btn-primary h-13 w-full font-display text-[13px] tracking-[0.12em] uppercase"
        >
          {user ? "Мой профиль" : "Войти"}
        </Link>

        <ul className="mt-5 grid gap-2">
          {items.map((item) => (
            <li key={item.href}>
              <HashLink
                href={item.href}
                onClick={() => onNavigate(item)}
                aria-current={isActive(item) ? (item.section ? "location" : "page") : undefined}
                className={cn(
                  "flex h-14 items-center justify-between rounded-2xl border px-5 font-display text-[13px] tracking-[0.12em] uppercase transition",
                  isActive(item) ? "border-accent/40 bg-accent/10 text-fg" : "border-white/8 bg-white/[0.04] text-fg/70",
                )}
              >
                <span className={cn("inline-flex items-center gap-2", item.highlight && "text-neon-glow")}>
                  {item.highlight && <Star size={14} className="fill-current" aria-hidden />}
                  {item.label}
                </span>
                {isActive(item) && <span aria-hidden className="size-[7px] rotate-45 rounded-[1.5px] bg-accent-soft shadow-[0_0_10px_2px_rgb(160_148_255/0.85)]" />}
              </HashLink>
            </li>
          ))}
        </ul>

        <p className="mt-8 mb-3 px-1 font-mono text-[11px] tracking-[0.18em] text-dim uppercase">Telegram</p>
        <ul className="grid gap-2">
          {telegramLinks.map((l) => (
            <li key={l.handle}>
              <a
                href={l.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3"
              >
                <TelegramIcon size={18} className="text-[#2aabee]" />
                <span className="text-sm font-semibold text-fg">{l.label}</span>
                <span className="ml-auto text-xs text-dim">{l.handle}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
