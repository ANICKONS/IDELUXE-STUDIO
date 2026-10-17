/**
 * The New Year theme's master switch. On by default (the site launches for the holidays);
 * `NEXT_PUBLIC_NEW_YEAR=off` in the environment turns all of it off. A build-time value: change it,
 * then rebuild / restart the dev server.
 *
 * Everything seasonal lives in this folder; the rest of the site only plugs in its slots
 * (slots.tsx). With the theme off every slot renders nothing and the site looks as it did before.
 */
export const NEW_YEAR = process.env.NEXT_PUBLIC_NEW_YEAR !== "off";
