import { categoryOf, type TutorialSection } from "@/content/tutorial-categories";
import { decorSrc } from "@/features/decor/assets";
import { cn } from "@/lib/utils";

/** Where the object sits: its height (% of the cover), sideways and vertical offset (% of its own size). */
const COMPOSITIONS = [
  { size: 84, shift: 0, lift: 0 },
  { size: 128, shift: 16, lift: 14 },
  { size: 62, shift: -14, lift: -14 },
];

/** A stable number 0–1 from a lesson's slug: every cover of a section is turned its own way. */
function seed(slug: string, salt: number): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < slug.length; i++) h = Math.imul(h ^ slug.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

/**
 * A lesson's cover, 16:9, filling its box. Its own poster when it has one; otherwise drawn: the
 * section's light, its 3D object (content/tutorial-categories.ts → decor) floating at the side,
 * turned and placed by the slug, and the section's name as a big outlined word. `size`: "thumb" for
 * the small lists (no word), "stage" for the player before it starts (a safe frame on top).
 */
export function LessonCover({
  slug,
  section,
  poster,
  size = "card",
  className,
}: {
  slug: string;
  section: TutorialSection;
  poster?: string;
  size?: "thumb" | "card" | "stage";
  className?: string;
}) {
  const c = categoryOf(section);
  if (poster) {
    return (
      <span aria-hidden className={cn("absolute inset-0 block overflow-hidden bg-ink-900", className)}>
        {/* eslint-disable-next-line @next/next/no-img-element -- a lesson's poster, sized by CSS */}
        <img src={poster} alt="" loading="lazy" decoding="async" className="size-full object-cover" />
      </span>
    );
  }
  // One of three framings (in the middle, a close-up cut by the edge, small and high), then a jitter
  const framing = COMPOSITIONS[Math.floor(seed(slug, 6) * COMPOSITIONS.length)];
  const turn = Math.round(seed(slug, 1) * 60 - 30);
  const lift = framing.lift + Math.round(seed(slug, 2) * 12 - 6);
  const scale = 0.9 + seed(slug, 3) * 0.2;
  const shift = framing.shift + Math.round(seed(slug, 4) * 8 - 4);
  const flip = seed(slug, 5) > 0.5 ? -1 : 1;
  return (
    <span
      aria-hidden
      className={cn("lesson-cover absolute inset-0 block overflow-hidden", size === "stage" && "lesson-cover-stage", className)}
      style={{ "--tint": c.tint } as React.CSSProperties}
    >
      {size !== "thumb" && (
        <span className="lesson-cover-word font-display font-bold">{c.title}</span>
      )}
      <span
        className="lesson-cover-object"
        style={
          { "--turn": `${turn}deg`, "--lift": `${lift}%`, "--scale": scale, "--shift": `${shift}%`, "--flip": flip, "--size": `${framing.size}%` } as React.CSSProperties
        }
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- pre-rendered decor, sized by CSS */}
        <img src={decorSrc(c.decor)} alt="" loading="lazy" decoding="async" className="lesson-cover-glow" />
        {/* eslint-disable-next-line @next/next/no-img-element -- pre-rendered decor, sized by CSS */}
        <img src={decorSrc(c.decor)} alt="" loading="lazy" decoding="async" className="lesson-cover-img" />
      </span>
    </span>
  );
}
