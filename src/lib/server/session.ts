import "server-only";
import { headers } from "next/headers";
import { cache } from "react";
import { getAccess } from "@/lib/server/access";
import { getAuth } from "@/lib/server/auth";
import type { Viewer } from "@/types/session";

/**
 * The signed-in account and its access for the current request, or null. Checked against the
 * database every time (the cookie alone proves nothing). `cache`: one lookup per request however
 * many components ask. Use it in server components, server actions and route handlers.
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  // Request headers first: they mark the page as per-request before anything else runs (a page
  // asking for the viewer is never prerendered at build time)
  const requestHeaders = await headers();
  const auth = await getAuth();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) return null;
  const { user } = session;
  return {
    user: { id: user.id, name: user.name, email: user.email, avatarUrl: user.image ?? null },
    access: getAccess(user.id, user.email),
  };
});
