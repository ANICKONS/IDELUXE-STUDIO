import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";
import { routes } from "@/config/routes";

/**
 * Routing by "signed in or not", from the session cookie alone (no database here: fast, and the
 * pages check the session for real):
 *  - "/" with a session cookie → the account's home (app/home) at the same URL; guests get the
 *    static landing;
 *  - the account's pages (home, profile) without a cookie → the sign-in page.
 * A stale cookie (expired session) is harmless: the home page then shows the landing, and the
 * profile sends to sign-in, which this proxy never bounces back.
 */
export function proxy(request: NextRequest) {
  const signedIn = Boolean(getSessionCookie(request));
  const { pathname } = request.nextUrl;

  if (pathname === routes.home) {
    return signedIn ? NextResponse.rewrite(new URL(routes.dashboard, request.url)) : NextResponse.next();
  }
  if (!signedIn) return NextResponse.redirect(new URL(routes.login, request.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/home", "/profile"],
};
