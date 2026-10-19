"use client";

import { useState } from "react";
import { Lock, LockOpen } from "lucide-react";
import { formLabel, kindLabel } from "@/content/resource-taxonomy";
import type { Result } from "@/features/resources/filter";
import { FormGlyph, ItemIcon, itemTint, subtitle } from "@/features/resources/glyphs";
import type { Audience } from "@/features/resources/types";
import { cn } from "@/lib/utils";

/**
 * An item in the grid, like an app in a store: its icon in the middle, the name, the developer and
 * a line about it. Top left: «Модуль» / «Коллекция», or the versions it comes in; top right a lock
 * when this account can't download it. A collection lies on a little deck of cards. Opens the
 * item's window, which grows out of this card (item-dialog.tsx finds it by `data-res-card`, its icon
 * by `data-res-icon`).
 * `fresh`: a card that shows up after the first render comes in with a short fade instead of the
 * page entrance (read once, so typing in the search never replays it on the cards already there).
 */
export function ResourceCard({
  result: { item, hint },
  index,
  fresh,
  audience,
  onOpen,
}: {
  result: Result;
  index: number;
  fresh: boolean;
  audience: Audience;
  onOpen: (id: string) => void;
}) {
  const [entrance] = useState(() => (fresh ? "res-card-in" : "arrive"));
  const locked = audience === "free" && !item.open;
  const freeHint = audience === "guest" && item.free && item.kind !== "program";
  const n = Math.min(index, 11);
  const collection = item.kind !== "program" && item.form === "collection";

  // Top-left badge: a module / a collection, or the versions to choose from
  let badge: React.ReactNode = null;
  if (item.kind !== "program" && item.form !== "single") {
    badge = (
      <>
        <FormGlyph kind={item.kind} form={item.form} size={11} /> {formLabel[item.form].one}
      </>
    );
  } else if (item.builds.length > 1) {
    badge = item.kind === "program" ? item.builds.map((b) => b.label.replace(/^Pro /, "")).join(" · ") : `${item.builds.length} версии`;
  }

  return (
    <div className={cn("relative h-full", collection && "res-deck")} style={{ "--n": n } as React.CSSProperties}>
      <button
        type="button"
        data-res-card={item.id}
        onClick={() => onOpen(item.id)}
        aria-haspopup="dialog"
        aria-label={`${item.name}, ${item.kind !== "program" && item.form !== "single" ? formLabel[item.form].one.toLowerCase() : kindLabel[item.kind].one.toLowerCase()}${locked ? ", закрыт" : ""}`}
        className={cn("glass res-card group relative z-[1] flex h-full w-full flex-col items-center rounded-[1.5rem] px-4 pt-8 pb-5 text-center", entrance)}
        style={{ "--i": 5 + n * 0.5, "--tint": itemTint(item) } as React.CSSProperties}
      >
        {/* The item's light behind its icon, brighter on hover */}
        <span aria-hidden className="res-card-glow" />

        {badge && (
          <span
            aria-hidden
            className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full border border-white/10 bg-ink-950/50 px-2 py-0.5 font-mono text-[9.5px] tracking-[0.1em] text-fg/65 uppercase"
          >
            {badge}
          </span>
        )}
        {(locked || freeHint) && (
          <span
            aria-hidden
            title={locked ? "Открывается в IDX LITE и PRO" : "Открыт в бесплатном аккаунте"}
            className={cn(
              "absolute top-3 right-3 inline-flex size-6 items-center justify-center rounded-full border",
              locked ? "border-white/10 bg-ink-950/50 text-dim" : "border-accent/30 bg-accent/10 text-accent-soft",
            )}
          >
            {locked ? <Lock size={11} /> : <LockOpen size={11} />}
          </span>
        )}

        <span data-res-icon={item.id} className="transition-[scale] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.07]">
          <ItemIcon item={item} size={60} />
        </span>
        <h3 className={cn("mt-4 w-full truncate text-[15px] leading-tight font-semibold", locked ? "text-fg/70" : "text-fg")}>{item.name}</h3>
        <p className="mt-1 w-full truncate text-[12px] text-dim">{item.vendor ?? (collection ? formLabel.collection.one : "\u00A0")}</p>
        <p className={cn("mt-2.5 w-full truncate text-[12px]", hint ? "text-accent-soft" : "text-muted")}>{hint ? `Внутри: ${hint}` : subtitle(item)}</p>
      </button>
    </div>
  );
}
