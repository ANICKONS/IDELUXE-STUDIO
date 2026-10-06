"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps, MouseEvent } from "react";

/**
 * next/link for anchors like "/#about". Next.js ignores a click on the URL you are already on,
 * so after «Главная» → manual scroll → «Главная» nothing happened. When the target is on the
 * current page, this link scrolls to it itself (smooth scrolling and scroll-margin come from CSS)
 * and updates the hash; links to other pages keep the normal navigation.
 */
export function HashLink({ href, onClick, ...props }: Omit<ComponentProps<typeof Link>, "href"> & { href: string }) {
  const pathname = usePathname();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

    const [path, hash] = href.split("#");
    if (!hash || (path || pathname) !== pathname) return;
    const target = document.getElementById(hash);
    if (!target) return;

    e.preventDefault();
    if (window.location.hash !== `#${hash}`) window.history.pushState(null, "", `#${hash}`);
    // Next frame: lets the mobile menu close first (it locks page scrolling while open).
    requestAnimationFrame(() => target.scrollIntoView());
  };

  return <Link href={href} onClick={handleClick} {...props} />;
}
