import { createAuthClient } from "better-auth/react";

/**
 * Better Auth in the browser: sign-up, sign-in, sign-out (same origin, /api/auth). After any of
 * them the page is reloaded from scratch (see auth-form.tsx), so every cache and the header pick
 * up the new state. Who's signed in is read from /api/me (lib/viewer.ts), not from here.
 */
export const authClient = createAuthClient();
