import "server-only";
import type { NextRequest } from "next/server";

/**
 * Client IP for rate limiting. x-forwarded-for is set by the reverse proxy (nginx, Vercel);
 * without a proxy in front the header can be forged, so treat the value as a hint, not identity.
 */
export function clientIp(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}
