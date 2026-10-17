import "@/features/new-year/garland.css";

/** Scallops rendered; garland.css shows as many as the screen fits (6 / 9 / 12 / 16). */
const SPANS = 16;
/**
 * Bulbs on a scallop: share of its width, how far down the wire hangs there (px, the wire's
 * curve below) and the tilt that keeps the bulb square to the wire.
 */
const BULBS = [
  { x: "20%", y: 6.6, tilt: 12 },
  { x: "50%", y: 10, tilt: 0 },
  { x: "80%", y: 6.6, tilt: -12 },
];
/** Bulb colours (RGB channels): champagne, ivory, frost, rose gold — the site's palette, lit up. */
const COLORS = ["242 205 140", "255 243 222", "178 206 242", "238 168 150"];

/**
 * String lights hanging from the header's bottom edge (put it inside the header's bar, which must
 * be positioned). Purely decorative: aria-hidden, no pointer events. When the header floats, the
 * garland pulls in from its rounded corners, like the scroll progress line.
 */
export function Garland() {
  return (
    <div
      aria-hidden
      className="ny-garland pointer-events-none absolute inset-x-0 top-full transition-[left,right] duration-500 group-data-[floating=true]/header:inset-x-7"
    >
      {Array.from({ length: SPANS }, (_, i) => (
        <div key={i} className="ny-garland-span">
          {/* (0, 0.5) → (100, 0.5) through (50, 19.5): sags 9.5 px in the middle */}
          <svg className="ny-garland-wire" viewBox="0 0 100 12" preserveAspectRatio="none">
            <path d="M0 0.5Q50 19.5 100 0.5" fill="none" stroke="rgb(var(--rgb-accent) / 0.45)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          </svg>
          {BULBS.map((b, j) => {
            const k = i * BULBS.length + j;
            return (
              <span
                key={j}
                className="ny-bulb"
                style={
                  {
                    "--x": b.x,
                    "--y": `${b.y}px`,
                    "--tilt": `${b.tilt}deg`,
                    "--c": COLORS[k % COLORS.length],
                    // Unrelated periods and phases: the lights never pulse in sync
                    "--d": `${(2.6 + ((k * 7) % 9) * 0.25).toFixed(2)}s`,
                    "--delay": `${(-((k * 1.37) % 5)).toFixed(2)}s`,
                  } as React.CSSProperties
                }
              >
                <span className="ny-bulb-glow" />
                <span className="ny-bulb-glass" />
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
