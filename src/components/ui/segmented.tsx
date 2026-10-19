"use client";

import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export type SegmentOption<T extends string> = {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  /** A small number beside the label (how many items this option gives). */
  count?: number;
  /** For screen readers when the label is an icon only. */
  title?: string;
};

/**
 * A row of options with a glass pill sliding under the picked one (like the header's menu). A radio
 * group for assistive tech: one tab stop, arrow keys move the choice. `size`: "sm" for the toolbar's
 * second row.
 */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  size = "md",
  block = false,
  className,
}: {
  label: string;
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: "sm" | "md";
  /** Full width, the options sharing it equally. */
  block?: boolean;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);

  // Offsets, not rects: stable while the toolbar itself moves (sticky, entrance)
  const place = useCallback(() => {
    const root = rootRef.current;
    const pill = pillRef.current;
    const active = root?.querySelector<HTMLElement>('[aria-checked="true"]');
    if (!pill || !active) return;
    pill.style.width = `${active.offsetWidth}px`;
    pill.style.transform = `translateX(${active.offsetLeft}px)`;
    pill.style.opacity = "1";
  }, []);

  useLayoutEffect(place, [place, value, options]);
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new ResizeObserver(place);
    observer.observe(root);
    document.fonts?.ready.then(place).catch(() => {});
    return () => observer.disconnect();
  }, [place]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const step = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!step) return;
    e.preventDefault();
    const i = options.findIndex((o) => o.value === value);
    const next = options[(i + step + options.length) % options.length];
    onChange(next.value);
    requestAnimationFrame(() => rootRef.current?.querySelector<HTMLElement>('[aria-checked="true"]')?.focus());
  };

  return (
    <div
      ref={rootRef}
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn("relative items-center rounded-full border border-white/8 bg-ink-950/40 p-1", block ? "flex w-full" : "inline-flex shrink-0", className)}
    >
      <span
        ref={pillRef}
        aria-hidden
        className="pointer-events-none absolute top-1 bottom-1 left-0 rounded-full border border-white/14 bg-white/[0.09] opacity-0 shadow-[inset_0_1px_0_rgb(255_255_255/0.16),0_6px_16px_-10px_rgb(0_0_0/0.9)] transition-[transform,width,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]"
      />
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={o.title}
            title={o.title}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative z-10 inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap transition-colors duration-300",
              block && "flex-1 justify-center",
              size === "sm" ? "h-8 px-3 text-[12.5px]" : "h-9 px-3.5 text-[13px]",
              active ? "text-fg" : "text-fg/50 hover:text-fg/85",
            )}
          >
            {o.icon}
            {o.label}
            {o.count !== undefined && (
              <span className={cn("font-mono text-[10.5px] tabular-nums transition-colors", active ? "text-accent-soft" : "text-dim")}>{o.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
