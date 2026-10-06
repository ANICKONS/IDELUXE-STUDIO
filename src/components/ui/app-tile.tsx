import { cn } from "@/lib/utils";

export type AppCode = "Ae" | "Pr" | "Vg" | "Me" | "3D";

const palettes: Record<AppCode, { from: string; to: string; letter: [string, string]; glow: string }> = {
  Ae: { from: "#3b33b8", to: "#0a0830", letter: ["#f1efff", "#9d93ff"], glow: "110 90 255" },
  Pr: { from: "#4b2aa8", to: "#12062e", letter: ["#fbeaff", "#d99bff"], glow: "170 90 255" },
  Vg: { from: "#23408f", to: "#060b2a", letter: ["#eaf3ff", "#8ec5ff"], glow: "80 140 255" },
  Me: { from: "#2f2a7a", to: "#080620", letter: ["#eeecff", "#b3a9ff"], glow: "130 110 255" },
  "3D": { from: "#3a2a8a", to: "#0b0726", letter: ["#fff3fb", "#e9a8ff"], glow: "210 120 255" },
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
            background: `linear-gradient(160deg, rgb(${p.glow} / 0.5), #05031a 70%)`,
            filter: "blur(0.5px)",
          }}
        />
        {/* Front face */}
        <div
          className="absolute inset-0 flex items-center justify-center overflow-hidden"
          style={{
            borderRadius: radius,
            background: `radial-gradient(130% 120% at 28% 18%, ${p.from} 0%, ${p.to} 62%, #03020f 100%)`,
            boxShadow: [
              `inset 0 ${size * 0.02}px ${size * 0.01}px rgb(255 255 255 / 0.55)`,
              `inset 0 -${size * 0.09}px ${size * 0.2}px rgb(0 0 0 / 0.55)`,
              `inset 0 0 0 ${Math.max(1, size * 0.014)}px rgb(${p.glow} / 0.55)`,
              `0 ${size * 0.3}px ${size * 0.55}px -${size * 0.12}px rgb(${p.glow} / 0.55)`,
              `0 0 ${size * 0.8}px rgb(${p.glow} / 0.28)`,
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
              filter: `drop-shadow(0 0 ${size * 0.06}px rgb(${p.glow} / 0.9))`,
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
