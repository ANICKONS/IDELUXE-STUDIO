import { SpaceScene } from "@/features/backdrop/space-scene";

const noise =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.55'/></svg>\")";

/**
 * Fixed backdrop: deep violet space. Stars twinkle in the sky and a huge planet rises from the
 * bottom of the screen, lit from behind (SpaceScene); the site's panels and cards float in front
 * of it. Film grain on top.
 */
export function Backdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 130% 55% at 50% -12%, rgb(76 55 220 / 0.3), transparent 62%)," +
            "linear-gradient(180deg, #07051c 0%, #04030d 50%, #06041c 100%)",
        }}
      />

      <SpaceScene />

      {/* Vignette: the edges of space fall into darkness */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_75%_70%_at_50%_55%,transparent_55%,rgb(3_2_10/0.7)_100%)]" />

      {/* Film grain */}
      <div className="absolute inset-0 opacity-[0.07] mix-blend-overlay" style={{ backgroundImage: noise }} />
    </div>
  );
}
