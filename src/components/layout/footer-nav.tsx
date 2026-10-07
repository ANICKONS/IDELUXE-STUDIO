"use client";

import { HashLink } from "@/components/layout/hash-link";
import { appFooterLinks, type NavLink } from "@/config/navigation";
import { useViewer } from "@/lib/viewer";

/**
 * A footer link column. `guestOnly`: the landing's blocks — a signed-in account has no landing at
 * "/" (proxy.ts), so it gets its home and profile there instead.
 */
export function FooterNav({ title, links, guestOnly = false }: { title: string; links: NavLink[]; guestOnly?: boolean }) {
  const signedIn = Boolean(useViewer().viewer);
  const shown = guestOnly && signedIn ? appFooterLinks : links;
  return (
    <div>
      <h2 className="font-mono text-[11px] tracking-[0.18em] text-dim uppercase">{title}</h2>
      <ul className="mt-4 space-y-2.5">
        {shown.map((l) => (
          <li key={l.href}>
            <HashLink href={l.href} className="text-sm text-muted transition hover:text-fg">
              {l.label}
            </HashLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
