import { cn } from "@/lib/utils";

/**
 * Section header styled like a composition marker in an editor:
 * «COMP 02 · 00:00:24:00 ─────» followed by the title, over a huge outlined word — «IDX» by
 * default (`ghost`, e.g. «FAQ»; `false` — none).
 */
export function SectionHeading({
  comp,
  timecode,
  title,
  description,
  ghost = "IDX",
  align = "left",
  className,
  as: Tag = "h2",
}: {
  comp: string;
  timecode: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  ghost?: string | false;
  align?: "left" | "center";
  className?: string;
  as?: "h1" | "h2";
}) {
  const centered = align === "center";
  return (
    <div className={cn("reveal relative isolate", centered && "mx-auto text-center", className)}>
      {ghost && (
        <span
          aria-hidden
          className={cn(
            // lg: the ghost only slightly sticks out above the heading, so after a menu jump it
            // doesn't disappear under the floating header
            "ghost-text pointer-events-none absolute -top-12 -z-10 font-display text-[5.5rem] leading-none font-bold whitespace-nowrap select-none sm:-top-20 sm:text-[10rem] lg:-top-4",
            centered ? "left-1/2 -translate-x-1/2" : "-left-2",
          )}
        >
          {ghost}
        </span>
      )}
      <div className={cn("flex items-center gap-3 font-mono text-[11px] tracking-[0.16em] text-dim", centered && "justify-center")}>
        <span className="rounded-md border border-accent/25 bg-accent/10 px-2 py-1 text-accent-soft">{comp}</span>
        <span className="tabular-nums">{timecode}</span>
        {!centered && <span aria-hidden className="h-px max-w-40 flex-1 bg-gradient-to-r from-accent/40 to-transparent" />}
      </div>
      <Tag className="mt-5 font-display text-[2rem] leading-[1.1] font-semibold tracking-tight text-balance sm:text-5xl">
        {title}
      </Tag>
      {description && (
        <p className={cn("mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg", centered && "mx-auto")}>{description}</p>
      )}
    </div>
  );
}
