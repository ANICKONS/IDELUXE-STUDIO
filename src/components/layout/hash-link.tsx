"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";
import { requestDeferredBlocks } from "@/lib/deferred-blocks";

/** How long to wait for a block that is still being built, in frames (~1 s). */
const WAIT_FRAMES = 60;

/**
 * next/link for anchors like "/#about". Next.js ignores a click on the URL you are already on,
 * so after «Главная» → manual scroll → «Главная» nothing happened. When the target is on the
 * current page, this link scrolls to it itself (smooth scrolling and scroll-margin come from CSS)
 * and updates the hash; links to other pages keep the normal navigation.
 * Right after a page switch the landing's lower blocks may not be built yet
 * (features/landing/after-arrival.tsx): the link asks for them and scrolls once its target is there.
 */
export function HashLink({ href, onClick, ...props }: Omit<ComponentProps<typeof Link>, "href"> & { href: string }) {
  const pathname = usePathname();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const [path, hash] = href.split("#");
    if (!hash || (path || pathname) !== pathname) return;

    e.preventDefault();
    if (window.location.hash !== `#${hash}`) window.history.pushState(null, "", `#${hash}`);
    if (!document.getElementById(hash)) requestDeferredBlocks();
    // Next frame: lets the mobile menu close first (it locks page scrolling while open) and
    // a block that's just been asked for get built
    let frames = WAIT_FRAMES;
    const scroll = () => {
      const target = document.getElementById(hash);
      if (target) target.scrollIntoView();
      else if (--frames > 0) requestAnimationFrame(scroll);
    };
    requestAnimationFrame(scroll);
  };

  return <Link href={href} onClick={handleClick} {...props} />;
}
