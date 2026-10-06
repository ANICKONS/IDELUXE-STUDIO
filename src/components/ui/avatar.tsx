import { cn } from "@/lib/utils";

/** Avatar with gradient-initials fallback. Plain <img> keeps remote avatars (Google/Telegram) simple. */
export function Avatar({
  name,
  src,
  size = 40,
  className,
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const initials =
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "ID";

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-display font-semibold text-white",
        "bg-[linear-gradient(135deg,#a497ff,#5241f0)] shadow-[inset_0_1px_0_rgb(255_255_255/0.4),0_0_0_1px_rgb(180_170_255/0.35)]",
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.max(10, size * 0.36) }}
      aria-hidden
    >
      {initials}
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="absolute inset-0 size-full object-cover" referrerPolicy="no-referrer" />
      )}
    </span>
  );
}
