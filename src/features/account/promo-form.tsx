"use client";

import { useActionState, useEffect } from "react";
import { Check, Ticket, TriangleAlert } from "lucide-react";
import { redeemPromo, type PromoState } from "@/features/account/actions";
import { refreshViewer } from "@/lib/viewer";
import { cn } from "@/lib/utils";

const initial: PromoState = { status: "idle", message: "" };

/** Promo code field: a server action checks and applies it (features/account/actions.ts). */
export function PromoForm({ className }: { className?: string }) {
  const [state, action, pending] = useActionState(redeemPromo, initial);

  // The header and the assistant read the access in the browser: let them know it changed
  useEffect(() => {
    if (state.status === "ok") void refreshViewer();
  }, [state]);

  return (
    <form action={action} className={cn("flex flex-col gap-3", className)}>
      <label htmlFor="promo-code" className="sr-only">
        Промокод
      </label>
      <div className="flex flex-col gap-2.5 sm:flex-row">
        <div className="relative flex-1">
          <Ticket size={18} aria-hidden className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-dim" />
          <input
            id="promo-code"
            name="code"
            required
            maxLength={32}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            placeholder="IDX-XXXX-XXXX"
            className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] pr-4 pl-11 font-mono text-sm tracking-[0.12em] text-fg uppercase outline-none transition placeholder:text-dim/70 focus:border-accent/60 focus:bg-white/[0.06]"
          />
        </div>
        <button type="submit" disabled={pending} aria-busy={pending} className="btn btn-primary btn-md h-12 shrink-0">
          {pending ? "Проверяем…" : "Активировать"}
        </button>
      </div>
      <div aria-live="polite">
        {state.status !== "idle" && (
          <p
            className={cn(
              "flex animate-fade-up items-start gap-2 text-[13px] leading-relaxed",
              state.status === "ok" ? "text-teal" : "text-rose",
            )}
          >
            {state.status === "ok" ? <Check size={16} className="mt-0.5 shrink-0" aria-hidden /> : <TriangleAlert size={16} className="mt-0.5 shrink-0" aria-hidden />}
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
