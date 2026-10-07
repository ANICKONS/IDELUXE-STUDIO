import "server-only";
import type { NextRequest } from "next/server";
import { serverEnv } from "@/config/env.server";

/**
 * Client IP for rate limiting.
 *
 * X-Forwarded-For is "client, proxy1, proxy2…", and the client can write anything into it before
 * it reaches our proxy (nginx's proxy_add_x_forwarded_for only appends). So the address is taken
 * from the right: the entry added by the outermost proxy we trust (TRUSTED_PROXY_HOPS, default 1 —
 * one nginx in front of `next start`). Without any proxy the header is entirely client-made —
 * deploy behind one (README → «ИИ-ассистент»).
 */
export function clientIp(request: NextRequest): string {
  const hops = serverEnv.trustedProxyHops;
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded && hops > 0) {
    const parts = forwarded
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);
    const ip = parts[parts.length - hops];
    if (ip) return ip;
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}
