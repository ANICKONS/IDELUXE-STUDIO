"use client";

import { useEffect, useRef, useState } from "react";
import { TelegramIcon } from "@/components/icons";
import { telegramLinks } from "@/config/navigation";
import { cn } from "@/lib/utils";

/** Telegram button in the header with a dropdown of the channel, the bot and personal messages. */
export function TelegramMenu({ className }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="telegram-menu"
        aria-label="Telegram IDELUXE"
        className="inline-flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.05] text-fg/75 transition hover:bg-white/10 hover:text-fg aria-expanded:bg-white/10 aria-expanded:text-fg"
      >
        <TelegramIcon size={19} />
      </button>

      {open && (
        <div
          id="telegram-menu"
          // Solid color + gradient as separate utilities (a combined bg-[…] value is invalid CSS).
          // No backdrop-blur: it can't see the page from inside the header's own backdrop-filter.
          className="absolute top-[calc(100%+14px)] right-0 w-72 animate-fade-up rounded-2xl border border-white/10 bg-[#070517] bg-[radial-gradient(120%_90%_at_50%_-30%,rgb(160_131_247/0.42),transparent_70%)] p-2 shadow-[0_24px_60px_-12px_rgb(0_0_0/0.8)]"
        >
          <ul className="grid gap-1">
            {telegramLinks.map((l) => (
              <li key={l.handle}>
                <a
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 transition hover:border-white/10 hover:bg-white/[0.06]"
                >
                  <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.05] text-[#2aabee]">
                    <TelegramIcon size={17} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-fg">{l.label}</span>
                    <span className="block truncate text-xs text-dim">
                      {l.handle} · {l.hint}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
