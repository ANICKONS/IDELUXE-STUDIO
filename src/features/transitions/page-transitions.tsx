"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef } from "react";
import { FOOTER_ID, MAIN_ID } from "@/components/layout/layout-ids";
import { announceLeave } from "@/lib/page-leave";
import { setLeaveHold } from "@/lib/transit-hold";

/** How long the old page takes to ease away before the switch, ms. */
const LEAVE = 280;
/** Small stagger between the leaving blocks, ms per block (capped). */
const STAGGER = 22;
/** If the new page never shows up (navigation failed), the old one comes back after this, ms. */
const GIVE_UP = 6000;

/** Anything with a backdrop blur: an ancestor with opacity < 1 would switch that blur off. */
const GLASSY = ".glass, .btn-glass";

/**
 * Picks the on-screen blocks to fade: the biggest blocks that hold no glass, and glass cards
 * themselves (their own opacity doesn't break their blur — only an ancestor's would).
 */
function collect(root: Element, out: Element[], vh: number) {
  for (const child of root.children) {
    const r = child.getBoundingClientRect();
    if (r.height === 0 || r.bottom < -40 || r.top > vh + 40) continue;
    if (child.matches(GLASSY) || !child.querySelector(GLASSY)) out.push(child);
    else collect(child, out, vh);
  }
}

/**
 * Page switches with an exit: a click on an internal link first lets the visible blocks of the
 * current page ease away (ease-in, ~0.3 s) while the space camera already starts flying to the
 * next page's shot, then navigates; the new page's blocks come in with the camera (`.arrive`,
 * SpaceScene). Back/forward, new tabs, downloads, same-page anchors and reduced motion keep the
 * plain behaviour. Opt out on a link with `data-no-transition`.
 */
export function PageTransitions() {
  const router = useRouter();
  const pathname = usePathname();
  const leaving = useRef<{ anims: Animation[]; persistent: Animation[]; timer: number } | null>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    const leave = (href: string, to: string, hash: string) => {
      // Read the layout before anything changes it (the reads are free while it's clean)
      const vh = window.innerHeight;
      const blocks: Element[] = [];
      const main = document.getElementById(MAIN_ID);
      if (main) collect(main, blocks, vh);
      const footer = document.getElementById(FOOTER_ID);
      const footerVisible = footer && footer.getBoundingClientRect().top < vh;
      // The old page's heavy work stops (editor, videos), the camera sets off
      setLeaveHold(true);
      announceLeave(to, hash);
      const animate = (el: Element, i: number) =>
        el.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "perspective(1200px) translate3d(0, -14px, -70px)" }], {
          duration: LEAVE,
          delay: Math.min(i, 8) * STAGGER,
          easing: "cubic-bezier(0.4, 0, 1, 1)",
          fill: "forwards",
        });
      const anims = blocks.map(animate);
      // The footer lives in the layout and stays: its animation is cancelled after the switch
      const persistent = footerVisible ? [animate(footer, blocks.length)] : [];
      const done = Math.min(blocks.length, 8) * STAGGER + LEAVE;
      const timer = window.setTimeout(() => {
        router.push(href);
        // Safety net: if the switch never happens, bring the page back
        if (leaving.current) leaving.current.timer = window.setTimeout(restore, GIVE_UP);
      }, done);
      leaving.current = { anims, persistent, timer };
    };

    const restore = () => {
      const state = leaving.current;
      if (!state) return;
      window.clearTimeout(state.timer);
      for (const a of [...state.anims, ...state.persistent]) a.cancel();
      setLeaveHold(false);
      leaving.current = null;
    };

    // Capture phase on window: runs before next/link's own click handler, which skips the
    // navigation when the event is already defaultPrevented
    const onClick = (e: MouseEvent) => {
      // The old page is easing away: it no longer takes clicks. (Not `pointer-events: none` on
      // <main>: an inherited property, it would restyle the whole page right on the click.)
      if (leaving.current && document.getElementById(MAIN_ID)?.contains(e.target as Node)) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement)) return;
      if ((link.target && link.target !== "_self") || link.hasAttribute("download") || link.hasAttribute("data-no-transition")) return;
      const url = new URL(link.href, window.location.href);
      if (url.origin !== window.location.origin || url.pathname === window.location.pathname) return;
      if (reduced.matches) return;
      e.preventDefault();
      if (leaving.current) return; // already on the way out
      leave(url.pathname + url.search + url.hash, url.pathname, url.hash);
    };

    window.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("click", onClick, true);
      restore();
    };
  }, [router]);

  // The new page is in: drop the leaving state (the old blocks are gone with their animations;
  // the footer's is cancelled, so it's back in place)
  useLayoutEffect(() => {
    const state = leaving.current;
    if (!state) return;
    window.clearTimeout(state.timer);
    for (const a of state.persistent) a.cancel();
    // The new page's entrance takes over the hold (SpaceScene → lib/transit-hold.ts)
    setLeaveHold(false);
    leaving.current = null;
  }, [pathname]);

  return null;
}
