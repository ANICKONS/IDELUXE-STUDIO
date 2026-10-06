import type { NextRequest } from "next/server";

/** True when the request has no Origin header (same-origin navigation / server) or the Origin matches this host. */
export function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === request.nextUrl.host;
  } catch {
    return false;
  }
}
