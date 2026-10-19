import { AudioLines, Blend, LayoutGrid, MonitorUp, Palette, Spline, WandSparkles } from "lucide-react";
import { AppTile } from "@/components/ui/app-tile";
import { programCode, programName, type ProgramId } from "@/content/resource-taxonomy";
import type { TutorialSection } from "@/content/tutorial-categories";
import { formatClock, pluralRu } from "@/lib/format";
import { cn } from "@/lib/utils";

/** A section's icon («all» — every lesson). A component, not a lookup: lint forbids creating components while rendering. */
export function SectionGlyph({ section, size = 16, className }: { section: TutorialSection | "all"; size?: number; className?: string }) {
  const props = { size, className, "aria-hidden": true } as const;
  switch (section) {
    case "vfx":
      return <WandSparkles {...props} />;
    case "sfx":
      return <AudioLines {...props} />;
    case "motion":
      return <Spline {...props} />;
    case "transitions":
      return <Blend {...props} />;
    case "color":
      return <Palette {...props} />;
    case "export":
      return <MonitorUp {...props} />;
    default:
      return <LayoutGrid {...props} />;
  }
}

/** The programs a lesson is made in: their tiles side by side (names for screen readers and on hover). */
export function ProgramTiles({ programs, size = 20, className }: { programs: ProgramId[]; size?: number; className?: string }) {
  const names = programs.map((p) => programName[p]).join(", ");
  return (
    <span className={cn("inline-flex items-center gap-1", className)} title={names}>
      <span className="sr-only">{names}</span>
      {programs.map((p) => (
        <AppTile key={p} code={programCode[p]} size={size} />
      ))}
    </span>
  );
}

const lessonForms = ["разбор", "разбора", "разборов"] as const;
/** «1 разбор», «4 разбора», «16 разборов». */
export const lessonsCount = (n: number) => `${n} ${pluralRu(n, lessonForms)}`;

/** «6 глав». */
export const chaptersCount = (n: number) => `${n} ${pluralRu(n, ["глава", "главы", "глав"])}`;

/** A lesson's length for people: «9 мин», «1 ч 05 мин»; under a minute — «0:45». */
export function minutes(seconds: number): string {
  if (seconds < 60) return formatClock(seconds);
  const m = Math.round(seconds / 60);
  return m >= 60 ? `${Math.floor(m / 60)} ч ${String(m % 60).padStart(2, "0")} мин` : `${m} мин`;
}
