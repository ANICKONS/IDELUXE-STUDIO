"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type DropdownOption<T extends string> = { value: T; label: string; icon?: React.ReactNode; count?: number };

/**
 * A pill button and a small glass menu under it (category, program, order). Menu semantics: arrow
 * keys / Home / End move, Enter or Space picks, Escape or a click outside closes and gives focus
 * back to the button. `highlight`: the button glows when something other than the default is picked.
 */
export function Dropdown<T extends string>({
  label,
  value,
  options,
  onChange,
  highlight = false,
  align = "left",
  icon,
  className,
}: {
  label: string;
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  highlight?: boolean;
  align?: "left" | "right";
  /** Shown in the button instead of the picked option's icon (e.g. the order's arrows). */
  icon?: React.ReactNode;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const current = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const items = () => [...(rootRef.current?.querySelectorAll<HTMLElement>('[role="menuitemradio"]') ?? [])];
    requestAnimationFrame(() => items().find((el) => el.getAttribute("aria-checked") === "true")?.focus());
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        setOpen(false);
        buttonRef.current?.focus();
        return;
      }
      if (e.key === "Tab") {
        setOpen(false);
        return;
      }
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp" && e.key !== "Home" && e.key !== "End") return;
      e.preventDefault();
      const list = items();
      const i = list.indexOf(document.activeElement as HTMLElement);
      const next = e.key === "Home" ? 0 : e.key === "End" ? list.length - 1 : (i + (e.key === "ArrowDown" ? 1 : -1) + list.length) % list.length;
      list[next]?.focus();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  const pick = (v: T) => {
    onChange(v);
    setOpen(false);
    buttonRef.current?.focus();
  };

  return (
    <div ref={rootRef} className={cn("relative shrink-0", className)}>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`${label}: ${current.label}`}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex h-10 max-w-full items-center gap-2 rounded-full border px-3.5 text-[13px] font-semibold transition",
          highlight ? "border-accent/35 bg-accent/10 text-accent-soft" : "border-white/9 bg-white/[0.035] text-fg/75 hover:border-white/16 hover:text-fg",
        )}
      >
        {icon ?? current.icon}
        <span className="truncate">{current.label}</span>
        <ChevronDown size={14} aria-hidden className={cn("shrink-0 transition-transform duration-300", open && "rotate-180")} />
      </button>

      <div
        id={menuId}
        role="menu"
        aria-label={label}
        data-open={open || undefined}
        inert={!open}
        className={cn(
          "menu-pop glass glass-strong absolute top-[calc(100%+0.5rem)] z-40 max-h-[min(24rem,70svh)] w-max min-w-56 overflow-y-auto rounded-[1.25rem] p-1.5",
          align === "right" ? "right-0 origin-top-right" : "left-0 origin-top-left",
        )}
      >
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="menuitemradio"
              aria-checked={active}
              tabIndex={-1}
              onClick={() => pick(o.value)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-[13.5px] transition outline-none focus-visible:bg-white/[0.08]",
                active ? "bg-white/[0.07] text-fg" : "text-fg/75 hover:bg-white/[0.05] hover:text-fg",
                o.count === 0 && !active && "opacity-45",
              )}
            >
              {o.icon}
              <span className="flex-1 truncate">{o.label}</span>
              {o.count !== undefined && <span className="font-mono text-[11px] text-dim tabular-nums">{o.count}</span>}
              <Check size={14} aria-hidden className={cn("shrink-0 text-accent transition-opacity", active ? "opacity-100" : "opacity-0")} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
