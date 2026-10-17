import "@/features/new-year/ornaments.css";
import { cn } from "@/lib/utils";

/** Leg and foot (toe to the right), the fur cuff, heel and toe patches; viewBox 0 0 24 40. */
const BODY = "M6 12V27C6 33 10 37 15.5 37H18C21.5 37 23.3 34.8 23.3 32C23.3 29.2 21.3 27.4 18.6 27.4H17.5V12Z";
const CUFF = "M4 10.5C4 9.1 5.1 8 6.5 8H17C18.4 8 19.5 9.1 19.5 10.5V12.5C19.5 13.9 18.4 15 17 15H6.5C5.1 15 4 13.9 4 12.5Z";
const TOE = "M18.6 27.4C21.3 27.4 23.3 29.2 23.3 32C23.3 34.8 21.5 37 18 37H17C18.3 34.4 18.6 30.6 18.6 27.4Z";
const HEEL = "M6 28.6C6.3 33.2 9.4 36.6 13.4 37C11.4 34.6 10.9 31.4 11.2 28.6Z";

function Stocking({ body, patch, className, style }: { body: string; patch?: string; className?: string; style: React.CSSProperties }) {
  return (
    // data-loop: holds still during a page switch, like the hero's loops (styles/components.css)
    <span data-loop className={cn("ny-stocking", className)} style={style}>
      <svg viewBox="0 0 24 40" className="block h-auto w-full overflow-visible" style={{ filter: "drop-shadow(0 3px 3px rgb(0 0 0 / 0.5))" }}>
        {/* Gold hook on the edge and the ribbon down to the cuff */}
        <circle cx="11.75" cy="1.4" r="1.4" fill="none" stroke="#e5bd72" strokeWidth=".9" />
        <path d="M11.75 2.8V8.5" stroke="#d6b583" strokeWidth="1.1" strokeLinecap="round" />
        <path d={BODY} fill={body} />
        {patch && (
          <>
            <path d={TOE} fill={patch} />
            <path d={HEEL} fill={patch} />
          </>
        )}
        <path d={CUFF} fill="url(#ny-stk-fur)" />
      </svg>
    </span>
  );
}

/**
 * Two stockings hanging from a panel's top edge, like from a mantelpiece (the footer card):
 * a velvet red one and a champagne gold one, each swinging a little out of step. Put it inside the
 * positioned panel; `className` sets where along the edge (absolute, top 0).
 */
export function Stockings({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute top-0 flex items-start gap-1.5", className)}>
      {/* Shared gradients (one pair per page) */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="ny-stk-red" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#cf4a51" />
            <stop offset=".5" stopColor="#9c2530" />
            <stop offset="1" stopColor="#5e141b" />
          </linearGradient>
          <linearGradient id="ny-stk-gold" x1="0" y1="0" x2="1" y2="1">
            <stop stopColor="#fff6dc" />
            <stop offset=".3" stopColor="#f2d699" />
            <stop offset=".6" stopColor="#d2a45c" />
            <stop offset="1" stopColor="#9c6d2e" />
          </linearGradient>
          <linearGradient id="ny-stk-fur" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#fffdf8" />
            <stop offset="1" stopColor="#d9cfbf" />
          </linearGradient>
        </defs>
      </svg>
      <Stocking body="url(#ny-stk-red)" patch="#f4eee4" className="w-[22px]" style={{ "--a": "3deg", "--d": "5.6s", "--delay": "-1.2s" } as React.CSSProperties} />
      <Stocking body="url(#ny-stk-gold)" className="mt-1 w-[19px]" style={{ "--a": "-2.5deg", "--d": "6.4s", "--delay": "-3.5s" } as React.CSSProperties} />
    </div>
  );
}
