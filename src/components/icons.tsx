import type { SVGProps } from "react";
import { NewYearLogoSnow } from "@/features/new-year";
import { cn } from "@/lib/utils";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

/**
 * The IDX mark, drawn for the screen after the original artwork (assets/brand/idx-icon.png, whose
 * glassy details turn to mush at logo sizes): a gold «i», a gold «D» with a black counter and a
 * gold «X» in it. Flat shapes on a 32 grid with even 4–5 unit strokes, so it reads from 16 px (the
 * browser tab) up. Shared by LogoMark, the preloader (which draws it line by line) and
 * app/icon.svg — keep them in sync.
 */
export const IDX_MARK = {
  dot: { cx: 5.75, cy: 6.75, r: 2.75 },
  stem: "M3 14.25a2.75 2.75 0 0 1 5.5 0v11a2.75 2.75 0 0 1-5.5 0Z",
  d: "M11.75 4H17.5a12 12 0 0 1 0 24H11.75a1.25 1.25 0 0 1-1.25-1.25V5.25A1.25 1.25 0 0 1 11.75 4Z",
  counter: "M14.75 8.25H17.5a7.75 7.75 0 0 1 0 15.5H14.75Z",
  x: "M17 12.8l5.2 6.4M22.2 12.8l-5.2 6.4",
  /** Light catching the top of the «D», like the polished metal of the original. */
  gloss: "M12 5.4H17.5c3.4 0 6.5 1.3 8.7 3.4-4.4-1.4-9.6-1.4-14.2.3Z",
} as const;

/** Gradients of the mark; `id` prefixes keep the logo and the preloader's copy apart. */
function MarkDefs({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`${id}-gold`} x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#fff6dc" />
        <stop offset=".25" stopColor="#f2d699" />
        <stop offset=".52" stopColor="#d2a45c" />
        <stop offset=".8" stopColor="#9c6d2e" />
        <stop offset="1" stopColor="#e9c57f" />
      </linearGradient>
      <linearGradient id={`${id}-x`} x1="17" y1="12.8" x2="22.2" y2="19.2" gradientUnits="userSpaceOnUse">
        <stop stopColor="#fff6dc" />
        <stop offset=".5" stopColor="#e5bd72" />
        <stop offset="1" stopColor="#a8783a" />
      </linearGradient>
    </defs>
  );
}

/** The logo (header, footer, sign-in card). Decorative: the link around it carries the name. */
export function LogoMark({ size = 32, className, ...props }: IconProps) {
  const id = "idx-logo";
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden className={cn("shrink-0", className)} {...props}>
      <MarkDefs id={id} />
      <g fill={`url(#${id}-gold)`}>
        <circle {...IDX_MARK.dot} />
        <path d={IDX_MARK.stem} />
        <path d={IDX_MARK.d} />
      </g>
      <path d={IDX_MARK.gloss} fill="#fff" fillOpacity=".28" />
      <path d={IDX_MARK.counter} fill="#08090b" />
      <path d={IDX_MARK.x} stroke={`url(#${id}-x)`} strokeWidth="2.3" strokeLinecap="round" />
      {/* New Year theme (features/new-year): snow caps on the mark */}
      <NewYearLogoSnow />
    </svg>
  );
}

/**
 * The mark for the preloader: its gold outlines draw themselves (pathLength = 1 for the dash
 * animation), then the gold and the black fill in under them and the outlines melt into the fill;
 * the «X» is a line itself and stays (styles/components.css → .preloader-*).
 */
export function LogoMarkDrawn({ size = 88 }: { size?: number }) {
  const id = "idx-pl";
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden className="relative block">
      <MarkDefs id={id} />
      <g className="preloader-plate">
        <g fill={`url(#${id}-gold)`}>
          <circle {...IDX_MARK.dot} />
          <path d={IDX_MARK.stem} />
          <path d={IDX_MARK.d} />
        </g>
        <path d={IDX_MARK.gloss} fill="#fff" fillOpacity=".28" />
        <path d={IDX_MARK.counter} fill="#08090b" />
      </g>
      <path d={IDX_MARK.d} stroke={`url(#${id}-gold)`} strokeWidth="0.7" pathLength={1} className="preloader-stroke" />
      <path d={IDX_MARK.stem} stroke={`url(#${id}-gold)`} strokeWidth="0.7" pathLength={1} className="preloader-stroke" />
      <circle {...IDX_MARK.dot} stroke={`url(#${id}-gold)`} strokeWidth="0.7" pathLength={1} className="preloader-stroke" />
      <path d={IDX_MARK.counter} stroke={`url(#${id}-gold)`} strokeWidth="0.5" pathLength={1} className="preloader-stroke preloader-stroke-late" />
      <path
        d={IDX_MARK.x}
        stroke={`url(#${id}-x)`}
        strokeWidth="2.3"
        strokeLinecap="round"
        pathLength={1}
        className="preloader-stroke preloader-stroke-late preloader-stroke-keep"
      />
    </svg>
  );
}

export function GoogleIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden {...props}>
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.2-.1-2.3-.4-3.5z"
      />
    </svg>
  );
}

export function TelegramIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M21.94 4.3a1.5 1.5 0 0 0-1.6-.23L2.9 11.05c-.9.37-.87 1.66.04 1.99l4.37 1.57 1.7 5.33c.2.62.98.82 1.45.37l2.47-2.36 4.6 3.4c.57.42 1.38.12 1.54-.57l3.36-14.9a1.5 1.5 0 0 0-.49-1.58zM9.9 14.37l-.53 3.2-1.13-3.55 9.63-6.1-7.97 6.45z" />
    </svg>
  );
}

/** Discord's logo (Simple Icons, CC0): links to the IDELUXE server. */
export function DiscordIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.865-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}
