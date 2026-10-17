import { NEW_YEAR } from "@/features/new-year/config";
import { Garland } from "@/features/new-year/garland";
import { heroDecor } from "@/features/new-year/hero-decor";
import { LogoSnow } from "@/features/new-year/logo-snow";
import { SantaHat } from "@/features/new-year/santa-hat";
import { SnowCap } from "@/features/new-year/snow-cap";
import { Snowfall } from "@/features/new-year/snowfall";
import { Stockings } from "@/features/new-year/stockings";

/*
 * Everything the rest of the site takes from the New Year theme. While the theme is off
 * (config.ts) every slot renders nothing or gives back the "no change" value, so switching it off
 * needs no edits anywhere else. Each place that uses a slot is marked «New Year theme».
 */

/** Snow over the space backdrop and the fir on the planet: right after <Backdrop /> (site-shell.tsx). */
export function NewYearSnowfall() {
  return NEW_YEAR ? <Snowfall /> : null;
}

/** String lights under the header (components/layout/header/header.tsx). */
export function NewYearGarland() {
  return NEW_YEAR ? <Garland /> : null;
}

/** Snow caps on the IDX mark, inside its <svg> (components/icons.tsx → LogoMark). */
export function NewYearLogoSnow() {
  return NEW_YEAR ? <LogoSnow /> : null;
}

/**
 * Snow on a panel's top edge (snow-cap.tsx), one panel per screen, a different look on neighbouring
 * screens: a soft drift on the hero editor, draped over the IDX PACK card's corners, a heap blown
 * onto the audience card, icicles on the platform's big card, a soft drift on the footer; on other
 * pages draped over the auth card, a heap on the featured plan.
 */
export function NewYearSnowCap(props: React.ComponentProps<typeof SnowCap>) {
  return NEW_YEAR ? <SnowCap {...props} /> : null;
}

/** A Santa hat on the assistant's launcher (features/chat/chat-widget.tsx). */
export function NewYearSantaHat({ className }: { className?: string }) {
  return NEW_YEAR ? <SantaHat className={className} /> : null;
}

/** Two stockings hanging from the footer card's top edge (components/layout/footer.tsx). */
export function NewYearStockings({ className }: { className?: string }) {
  return NEW_YEAR ? <Stockings className={className} /> : null;
}

/** The hero's 3D objects for the holidays, or null for the usual ones (features/landing/decor.ts). */
export const newYearHeroDecor = NEW_YEAR ? heroDecor : null;

/** Snow cover on the planet's land, 0–1 (Backdrop → `snow`). */
export const newYearPlanetSnow = NEW_YEAR ? 1 : 0;
