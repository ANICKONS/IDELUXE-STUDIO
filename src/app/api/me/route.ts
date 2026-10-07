import { NextResponse } from "next/server";
import { getViewer } from "@/lib/server/session";

/**
 * The signed-in account and its access, for the browser (lib/viewer.ts: header, assistant, locks).
 * Pages stay static: they ask here instead of reading the session while rendering.
 * Never cached: it's per person.
 */
export async function GET() {
  const viewer = await getViewer();
  return NextResponse.json({ viewer }, { headers: { "Cache-Control": "private, no-store" } });
}
