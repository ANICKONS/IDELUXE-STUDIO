import { JetBrains_Mono, Manrope, Unbounded } from "next/font/google";

/* The variables are picked up by --font-display / --font-sans / --font-mono in src/styles/tokens.css */

export const unbounded = Unbounded({
  subsets: ["latin", "cyrillic"],
  variable: "--font-unbounded",
  display: "swap",
});

export const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
  display: "swap",
});

// Only small labels and timecodes: not worth a preload on the critical path
export const jetbrains = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  variable: "--font-jetbrains",
  display: "swap",
  preload: false,
});

export const fontVariables = `${unbounded.variable} ${manrope.variable} ${jetbrains.variable}`;
