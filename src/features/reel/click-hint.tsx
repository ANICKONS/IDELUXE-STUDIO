"use client";

import { useEffect, useRef, useState } from "react";
import { MousePointer2, Play } from "lucide-react";
import { cn } from "@/lib/utils";

const CYCLE = 5.5; // seconds per hint loop (keyframes: hint-* in globals.css)

/**
 * "This video opens" hint. A minimal glass play button always sits in the centre; `delay` seconds
 * after the video scrolls into view a cursor starts gliding onto it and pressing it (ring burst +
 * caption), over and over. On hover the real cursor takes over: the button lights up and the
 * caption stays. Touch screens get the press without the cursor.
 * The parent must have the `group/hint` class; the hint itself never catches pointer events.
 */
export function ClickHint({ label, delay = 1.5, className }: { label: string; delay?: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [armed, setArmed] = useState(false);

  // Start the loop only once the video is actually on screen.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setArmed(true);
        observer.disconnect();
      },
      { threshold: 0.5 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const loop = (name: string, extraDelay = 0, easing = "ease-in-out"): React.CSSProperties | undefined =>
    armed ? { animation: `${name} ${CYCLE}s ${easing} ${delay + extraDelay}s infinite both` } : undefined;

  return (
    <span ref={ref} aria-hidden className={cn("pointer-events-none absolute inset-0 z-10 flex items-center justify-center", className)}>
      <span className="relative flex flex-col items-center">
        <span className="relative inline-flex size-14 transition duration-300 group-hover/hint:scale-110 sm:size-16">
          {/* Ring bursts on each press */}
          <span className="absolute inset-0 rounded-full border border-white/70 opacity-0" style={loop("hint-ripple", 0, "ease-out")} />
          <span className="absolute inset-0 rounded-full border border-white/40 opacity-0" style={loop("hint-ripple", 0.22, "ease-out")} />

          {/* Minimal glass button: the outer layer reacts to hover, the inner one to the fake press */}
          <span className="absolute inset-0 rounded-full border border-white/25 shadow-[0_10px_30px_-10px_rgb(0_0_0/0.7),inset_0_1px_0_rgb(255_255_255/0.22)] backdrop-blur-md transition duration-300 group-hover/hint:border-white/50 group-hover/hint:bg-white/15 group-focus-visible/hint:border-white/50 group-focus-visible/hint:bg-white/15">
            <span className="flex size-full items-center justify-center rounded-full bg-white/[0.08]" style={loop("hint-press")}>
              <Play size={20} strokeWidth={1.75} className="translate-x-0.5 fill-white/90 text-white/90" />
            </span>
          </span>

          {/* Fake cursor; hidden on touch screens and while the real one hovers */}
          <span className="absolute top-1/2 left-1/2 transition-opacity duration-200 group-hover/hint:opacity-0 pointer-coarse:hidden">
            <span className="block opacity-0" style={loop("hint-cursor")}>
              <MousePointer2 size={26} strokeWidth={1.5} className="fill-white text-ink-950 drop-shadow-[0_4px_10px_rgb(0_0_0/0.6)]" />
            </span>
          </span>
        </span>

        <span
          className="mt-3 rounded-full border border-white/10 bg-ink-950/45 px-3 py-1 text-xs font-medium whitespace-nowrap text-fg/90 opacity-0 backdrop-blur-md transition-opacity duration-300 group-hover/hint:opacity-100! group-focus-visible/hint:opacity-100!"
          style={loop("hint-caption")}
        >
          {label}
        </span>
      </span>
    </span>
  );
}
