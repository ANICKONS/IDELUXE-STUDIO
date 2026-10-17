import { cn } from "@/lib/utils";

/**
 * A small Santa hat: deep wine-red velvet, an ivory fur brim and pom-pom (the ivory of the
 * primary buttons). Decorative; size and placement come from `className` (absolute, a width).
 * Its gradient ids are fixed: one hat per page.
 */
export function SantaHat({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 44 38" className={cn("pointer-events-none", className)} style={{ filter: "drop-shadow(0 2px 2px rgb(0 0 0 / 0.45))" }}>
      <defs>
        <linearGradient id="ny-hat-red" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="#d9545a" />
          <stop offset=".45" stopColor="#a82a33" />
          <stop offset="1" stopColor="#5e141b" />
        </linearGradient>
        <linearGradient id="ny-hat-fur" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#fffdf8" />
          <stop offset=".6" stopColor="#efe8dc" />
          <stop offset="1" stopColor="#cfc4b2" />
        </linearGradient>
      </defs>
      {/* Body: up from the brim, over the top, the tip flopping down to the right */}
      <path
        d="M7.5 26C7.2 17.5 11.5 8.2 20.8 5.4C28.4 3.2 35.2 6.2 38.6 12.4C39.7 14.6 40.1 17.2 39.4 20.2C37.9 17.1 35.6 15.1 32.6 14.4C33.9 18.3 34.6 22.1 34.6 26Z"
        fill="url(#ny-hat-red)"
      />
      {/* Soft sheen of the velvet */}
      <path d="M11 22.5C11.2 16.5 14.2 10.6 20 8.4C16.6 11.6 14.3 16.6 13.6 22.8Z" fill="#fff" fillOpacity=".16" />
      {/* Fur brim and pom-pom */}
      <path
        d="M4 27.2C4 25 5.6 23.7 7.8 23.6C16.2 22.6 25.2 22.6 33.4 23.7C35.6 24 37.1 25.2 37.1 27.2C37.1 29.3 35.5 30.6 33.4 30.5C25.2 29.8 16.2 29.8 7.8 30.6C5.6 30.8 4 29.4 4 27.2Z"
        fill="url(#ny-hat-fur)"
      />
      <circle cx="39.2" cy="21.6" r="4.3" fill="url(#ny-hat-fur)" />
    </svg>
  );
}
