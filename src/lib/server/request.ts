import "server-only";
import type { NextRequest } from "next/server";
import { env } from "@/config/env";

/**
 * True only for a request sent by this site's own pages. Browsers always send Origin with a POST
 * fetch, so a missing Origin (curl, scripts) is refused unless the browser vouches for it with
 * `Sec-Fetch-Site: same-origin`. Accepts the public site host (NEXT_PUBLIC_SITE_URL) and the host
 * the request came in on (a proxy may rewrite Host).
 */
export function isSameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return request.headers.get("sec-fetch-site") === "same-origin";
  try {
    const host = new URL(origin).host;
    return host === request.nextUrl.host || host === new URL(env.siteUrl).host;
  } catch {
    return false;
  }
}

/**
 * Reads a JSON body of at most `limit` bytes. Content-Length can be missing (chunked upload) or
 * lie, so the bytes are counted while reading and the read stops as soon as they pass the limit.
 */
export async function readJsonBody(request: NextRequest, limit: number): Promise<{ ok: true; value: unknown } | { ok: false; status: 400 | 413 }> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > limit) return { ok: false, status: 413 };
  if (!request.body) return { ok: false, status: 400 };
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      return { ok: false, status: 413 };
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return { ok: true, value: JSON.parse(new TextDecoder().decode(bytes)) };
  } catch {
    return { ok: false, status: 400 };
  }
}
