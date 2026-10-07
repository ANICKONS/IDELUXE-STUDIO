import { cn } from "@/lib/utils";

export type AppCode = "Ae" | "Pr" | "Vg" | "Me" | "3D";

/** Graphite glass for every app; only the letters and the faint glow carry a muted tint. */
const palettes: Record<AppCode, { from: string; to: string; letter: [string, string]; glow: string }> = {
  Ae: { from: "#2c2f38", to: "#0a0b0e", letter: ["#ffffff", "#c3cbe4"], glow: "150 168 214" },
  Pr: { from: "#302c33", to: "#0b0a0d", letter: ["#ffffff", "#e2c6d2"], glow: "204 160 182" },
  Vg: { from: "#27303a", to: "#090b0e", letter: ["#ffffff", "#b9d0e6"], glow: "140 180 222" },
  Me: { from: "#2e2c28", to: "#0b0a09", letter: ["#ffffff", "#e8d8ba"], glow: "214 181 131" },
  "3D": { from: "#312d27", to: "#0c0a08", letter: ["#ffffff", "#ecd1a4"], glow: "214 181 131" },
};

/**
 * Glossy 3D-style software icon (inspired by the IDELUXE PACK artwork).
 * Pure CSS — no images, crisp at any size.
 */
export function AppTile({
  code,
  size = 96,
  float = false,
  className,
}: {
  code: AppCode;
  size?: number;
  float?: boolean;
  className?: string;
}) {
  const p = palettes[code];
  const radius = size * 0.26;

  return (
    <div className={cn("relative", className)} style={{ width: size, height: size, perspective: size * 8 }} aria-hidden>
      <div
        className={cn("relative size-full", float && "animate-float")}
        style={{
          transformStyle: "preserve-3d",
          transform: float ? undefined : "rotateX(8deg) rotateY(-12deg)",
        }}
      >
        {/* Depth / side face */}
        <div
          className="absolute inset-0"
          style={{
            borderRadius: radius,
            transform: `translate3d(${size * 0.03}px, ${size * 0.05}px, -${size * 0.08}px)`,
            background: `linear-gradient(160deg, rgb(${p.glow} / 0.35), #060709 70%)`,
            filter: "blur(0.5px)",
          }}
        />
        {/* Front face */}
        <div
          className="absolute inset-0 flex items-center justify-center overflow-hidden"
          style={{
            borderRadius: radius,
            background: `radial-gradient(130% 120% at 28% 18%, ${p.from} 0%, ${p.to} 62%, #030304 100%)`,
            boxShadow: [
              `inset 0 ${size * 0.02}px ${size * 0.01}px rgb(255 255 255 / 0.4)`,
              `inset 0 -${size * 0.09}px ${size * 0.2}px rgb(0 0 0 / 0.55)`,
              `inset 0 0 0 ${Math.max(1, size * 0.014)}px rgb(${p.glow} / 0.32)`,
              `0 ${size * 0.3}px ${size * 0.55}px -${size * 0.12}px rgb(0 0 0 / 0.7)`,
              `0 0 ${size * 0.8}px rgb(${p.glow} / 0.1)`,
            ].join(", "),
          }}
        >
          <span
            className="relative font-display leading-none font-bold tracking-tight"
            style={{
              fontSize: size * (code.length > 2 ? 0.34 : 0.42),
              background: `linear-gradient(170deg, ${p.letter[0]} 20%, ${p.letter[1]} 100%)`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              filter: `drop-shadow(0 0 ${size * 0.06}px rgb(${p.glow} / 0.45))`,
            }}
          >
            {code}
          </span>
          {/* Glass sheen */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
            style={{
              borderRadius: `${radius}px ${radius}px 50% 50% / ${radius}px ${radius}px 18% 18%`,
              background: "linear-gradient(180deg, rgb(255 255 255 / 0.2), rgb(255 255 255 / 0))",
            }}
          />
        </div>
      </div>
    </div>
  );
}
