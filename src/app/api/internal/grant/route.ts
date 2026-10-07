import { NextResponse, type NextRequest } from "next/server";
import { findUserIdByEmail, findUserIdByTelegram, getAccessFor, grant, type Grant } from "@/lib/server/access";
import { getAuth } from "@/lib/server/auth";
import { internalApiEnabled, isInternalRequest } from "@/lib/server/internal-auth";
import { readJsonBody } from "@/lib/server/request";

const PLANS = new Set<Grant>(["pack", "lite", "pro", "full"]);

/**
 * Gives an account a plan after a purchase (the Telegram bot) or by hand.
 *   POST /api/internal/grant
 *   Authorization: Bearer <INTERNAL_API_SECRET>
 *   { "telegramId": "12345678", "plan": "pack" | "lite" | "pro" | "full", "months": 1, "note": "order 123" }
 * The account is found by `telegramId` (the user id the bot sees — works for accounts that signed
 * in with Telegram) or by `email`; one of the two is required. `months` is for lite / pro (1–36;
 * a year = 12). The account must exist — the person signs up on the site first.
 * Answers with the account's access after the grant.
 */
export async function POST(request: NextRequest) {
  if (!internalApiEnabled()) return new NextResponse(null, { status: 404 });
  if (!isInternalRequest(request)) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const read = await readJsonBody(request, 4 * 1024);
  if (!read.ok) return NextResponse.json({ error: "bad_request" }, { status: 400 });
  const body = read.value as { email?: unknown; telegramId?: unknown; plan?: unknown; months?: unknown; note?: unknown };

  const email = typeof body.email === "string" ? body.email.trim() : "";
  // The bot may hand it over as a number
  const telegramId = typeof body.telegramId === "string" || typeof body.telegramId === "number" ? String(body.telegramId).trim() : "";
  const plan = body.plan as Grant;
  const months = body.months === undefined ? 1 : Number(body.months);
  const note = typeof body.note === "string" ? body.note.slice(0, 200) : undefined;
  if ((!email && !telegramId) || !PLANS.has(plan) || !Number.isInteger(months) || months < 1 || months > 36) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }
  if (telegramId && !/^\d{1,20}$/.test(telegramId)) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  await getAuth(); // makes sure the schema exists
  const userId = telegramId ? findUserIdByTelegram(telegramId) : findUserIdByEmail(email);
  if (!userId) return NextResponse.json({ error: "user_not_found" }, { status: 404 });

  grant(userId, plan, { months, source: "internal", note });
  return NextResponse.json({ ok: true, access: getAccessFor(userId) });
}
