import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

export function LogoMark({ size = 32, ...props }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden {...props}>
      <defs>
        <linearGradient id="lm-bg" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#2b2380" />
          <stop offset="1" stopColor="#0c0930" />
        </linearGradient>
        <linearGradient id="lm-fg" x1="8" y1="12" x2="32" y2="28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ffffff" />
          <stop offset=".55" stopColor="#b3a8ff" />
          <stop offset="1" stopColor="#e9a8ff" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="38" height="38" rx="11" fill="url(#lm-bg)" />
      <rect x="1.5" y="1.5" width="37" height="37" rx="10.5" stroke="#b5aaff" strokeOpacity=".45" />
      {/* «IDX» in round strokes, white → violet → pink like the site's gradient text (same as app/icon.svg) */}
      <path
        d="M8.5 13v14M13 13v14h1.4a6.4 7 0 0 0 0-14ZM24.2 13l7.3 14M31.5 13l-7.3 14"
        stroke="url(#lm-fg)"
        strokeWidth="2.7"
        strokeLinecap="round"
        strokeLinejoin="round"
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
