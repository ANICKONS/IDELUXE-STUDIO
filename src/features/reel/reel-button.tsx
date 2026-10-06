"use client";

import { useRef, type ButtonHTMLAttributes } from "react";
import type { ReelId } from "@/config/media";
import { openReel } from "@/features/reel/events";

function isOnScreen(el: Element) {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.bottom > 0 && r.top < window.innerHeight && getComputedStyle(el).visibility !== "hidden";
}

/**
 * Opens the reel player. With `origin` (CSS selector of a video preview) the player window
 * flies out of that preview when it's on screen; otherwise it grows out of the button itself.
 */
export function ReelButton({
  reel,
  origin,
  children,
  ...props
}: { reel: ReelId; origin?: string } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "type">) {
  const ref = useRef<HTMLButtonElement>(null);

  return (
    <button
      ref={ref}
      type="button"
      aria-haspopup="dialog"
      onClick={() => {
        const preview = origin ? document.querySelector<HTMLElement>(origin) : null;
        openReel(reel, preview && isOnScreen(preview) ? preview : ref.current);
      }}
      {...props}
    >
      {children}
    </button>
  );
}
