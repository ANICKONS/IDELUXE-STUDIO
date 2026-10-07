import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import { serverEnv } from "@/config/env.server";

/**
 * Server-to-server calls (the Telegram bot → /api/internal/*): `Authorization: Bearer <INTERNAL_API_SECRET>`.
 * Compared in constant time over digests (equal length whatever was sent). Without a secret of
 * 32+ characters the internal endpoints are off.
 */
export function internalApiEnabled(): boolean {
  return serverEnv.internalApiSecret.length >= 32;
}

export function isInternalRequest(request: Request): boolean {
  if (!internalApiEnabled()) return false;
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const digest = (s: string) => createHash("sha256").update(s).digest();
  return token.length > 0 && timingSafeEqual(digest(token), digest(serverEnv.internalApiSecret));
}
