/**
 * DOM ids of the video previews the reel player flies out of.
 * Kept in a plain module: constants exported from "use client" files become
 * client references on the server and can't be used as strings in Server Components.
 */
export const HERO_REEL_ORIGIN = "hero-reel-origin";
export const ABOUT_REEL_ORIGIN = "about-reel-origin";
