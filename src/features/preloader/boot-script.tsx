import { BOOT_SEEN_KEY } from "@/lib/boot";

/** Failsafe, ms: if the app never takes over (a script failed to load), the page opens anyway. */
const FAILSAFE = 10000;

/*
 * Runs while the HTML is parsed, before the first paint: html[data-boot] shows the preloader and
 * holds the entrance animations (styles/components.css → «Preloader»). "first" — the first load in
 * this tab (full sequence), "repeat" — a reload (short one). Without JavaScript the attribute is
 * never set, so the preloader never shows.
 */
const script = `(function(){var d=document.documentElement,s;try{s=sessionStorage.getItem(${JSON.stringify(BOOT_SEEN_KEY)})}catch(e){}d.setAttribute("data-boot",s?"repeat":"first");setTimeout(function(){d.removeAttribute("data-boot")},${FAILSAFE})})();`;

/** Put it first in <body>, before <Preloader />. `<html>` needs suppressHydrationWarning. */
export function BootScript() {
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
