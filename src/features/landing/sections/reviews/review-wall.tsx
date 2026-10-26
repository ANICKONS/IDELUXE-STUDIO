"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { ReviewCard } from "@/features/landing/sections/reviews/review-card";
import type { Review } from "@/content/reviews";
import { pluralRu } from "@/lib/format";
import { cn } from "@/lib/utils";

/** The fold's open and close, ms (matches the duration class below). */
const FOLD_MS = 800;

/**
 * The reviews as a wall: a grid of cards (one column on phones, two, three on wide screens), the
 * cards of a row as tall as the longest, their authors lined up at the foot. A grid, not CSS
 * columns: Chromium paints the glass's backdrop blur wrongly inside a multi-column layout.
 * A long wall is folded to about two rows with a soft fade and «Показать все отзывы»; it unfolds
 * smoothly to its full height and folds back («Свернуть», then the block's top is brought back
 * into view). Screen readers read every review either way; a keyboard reaching a card under the
 * fold unfolds it. `overflow: clip`, not hidden: hidden would make the wall a scroll container,
 * and the cards' scroll-driven entrance (`reveal`) would follow it instead of the page.
 */
export function ReviewWall({ reviews, className }: { reviews: Review[]; className?: string }) {
  const wallRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef(0);
  const [open, setOpen] = useState(false);
  /** Taller than the fold: the fade and the button are needed (assumed until measured). */
  const [folds, setFolds] = useState(true);

  // The content against the fold's height (--fold, per breakpoint) — not against the wall's own
  // height, which is mid-way through its transition while it opens or closes
  useLayoutEffect(() => {
    const wall = wallRef.current;
    const list = wall?.firstElementChild;
    if (!wall || !list) return;
    const foldPx = () => {
      const value = getComputedStyle(wall).getPropertyValue("--fold").trim();
      const n = parseFloat(value);
      return value.endsWith("rem") ? n * parseFloat(getComputedStyle(document.documentElement).fontSize) : n;
    };
    const measure = () => setFolds(list.getBoundingClientRect().height > foldPx() + 8);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(wall);
    observer.observe(list);
    return () => observer.disconnect();
  }, []);

  useEffect(() => () => window.clearTimeout(timerRef.current), []);

  const unfold = useCallback(() => {
    const wall = wallRef.current;
    if (!wall) return;
    window.clearTimeout(timerRef.current);
    wall.style.maxHeight = `${wall.clientHeight}px`;
    void wall.offsetHeight; // the start height is set before the target
    wall.style.maxHeight = `${wall.scrollHeight}px`;
    setOpen(true);
    // Then no limit at all: the wall follows its content (resizes, fonts)
    timerRef.current = window.setTimeout(() => (wall.style.maxHeight = "none"), FOLD_MS);
  }, []);

  const fold = useCallback(() => {
    const wall = wallRef.current;
    if (!wall) return;
    window.clearTimeout(timerRef.current);
    wall.style.maxHeight = `${wall.scrollHeight}px`;
    void wall.offsetHeight;
    wall.style.maxHeight = ""; // back to the fold's own height (the class)
    setOpen(false);
    // The block's top back on screen if the fold leaves the visitor below it
    const section = wall.closest("section");
    if (section && section.getBoundingClientRect().top < 0) section.scrollIntoView({ block: "start" });
  }, []);

  return (
    <div className={className}>
      <div
        ref={wallRef}
        // A keyboard reaching a card under the fold opens the wall
        onFocus={(e) => {
          if (open || !folds) return;
          const wall = wallRef.current;
          if (wall && e.target.getBoundingClientRect().bottom > wall.getBoundingClientRect().bottom - 24) unfold();
        }}
        className={cn(
          "relative overflow-clip transition-[max-height] duration-[800ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
          "max-h-[var(--fold)] [--fold:52rem] md:[--fold:44rem] lg:[--fold:40rem]",
        )}
      >
        {/* pt-3: room for the «Пример» marks sticking out above the first row's cards */}
        <ul className="grid gap-5 pt-3 pb-1 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((r, i) => (
            <li key={`${r.name}-${i}`}>
              <ReviewCard review={r} className="reveal" />
            </li>
          ))}
        </ul>

        {/* The fold: the cards sink into the page's dark */}
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-ink-950 via-ink-950/75 to-transparent transition-opacity duration-500",
            open || !folds ? "opacity-0" : "opacity-100",
          )}
        />
      </div>

      {folds && (
        <div className={cn("relative z-10 flex justify-center", open ? "mt-4" : "-mt-8")}>
          <button type="button" onClick={open ? fold : unfold} aria-expanded={open} className="btn btn-glass btn-md">
            {open ? "Свернуть" : `Показать все ${reviews.length} ${pluralRu(reviews.length, ["отзыв", "отзыва", "отзывов"])}`}
            <ChevronDown size={16} aria-hidden className={cn("transition-transform duration-500", open && "rotate-180")} />
          </button>
        </div>
      )}
    </div>
  );
}
