import { NextResponse, type NextRequest } from "next/server";
import { createPromoCode } from "@/lib/server/access";
import { getAuth } from "@/lib/server/auth";
import { internalApiEnabled, isInternalRequest } from "@/lib/server/internal-auth";
import { readJsonBody } from "@/lib/server/request";

const DAY = 24 * 60 * 60 * 1000;

/**
 * Creates a promo code (e.g. the welcome LITE for those who bought IDX PACK before: the bot
 * checks the purchase and hands out a personal code). The account enters it in its profile.
 *   POST /api/internal/promo
 *   Authorization: Bearer <INTERNAL_API_SECRET>
 *   { "kind": "lite" | "pro", "months": 3, "maxUses": 1, "expiresInDays": 90, "note": "..." }
 * `maxUses`: null — any number of accounts (each once). Answers { code }.
 */
export async function POST(request: NextRequest) {
  if (!internalApiEnabled()) return new NextResponse(null, { status: 404 });
  if (!isInternalRequest(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const read = await readJsonBody(request, 4 * 1024);
  if (!read.ok) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  const body = read.value as { kind?: unknown; months?: unknown; maxUses?: unknown; expiresInDays?: unknown; note?: unknown };

  const kind = body.kind;
  const months = Number(body.months);
  const maxUses = body.maxUses === null ? null : body.maxUses === undefined ? 1 : Number(body.maxUses);
  const days = body.expiresInDays === undefined ? null : Number(body.expiresInDays);
  if (
    (kind !== "lite" && kind !== "pro") ||
    !Number.isInteger(months) ||
    months < 1 ||
    months > 36 ||
    (maxUses !== null && (!Number.isInteger(maxUses) || maxUses < 1)) ||
    (days !== null && (!Number.isFinite(days) || days <= 0))
  ) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  await getAuth(); // makes sure the schema exists
  const code = createPromoCode({
    kind,
    months,
    maxUses,
    expiresAt: days === null ? null : Date.now() + days * DAY,
    note: typeof body.note === "string" ? body.note.slice(0, 200) : undefined,
  });
  return NextResponse.json({ code });
}
