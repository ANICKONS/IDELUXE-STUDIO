import { NextResponse, type NextRequest } from "next/server";
import { findTutorial } from "@/features/learn/catalog.server";
import type { ProgressInput } from "@/features/learn/progress";
import { saveProgress } from "@/features/learn/progress.server";
import { canWatchTutorial } from "@/lib/access-rules";
import { consumeDailyQuota } from "@/lib/server/rate-limit";
import { isSameOrigin, readJsonBody } from "@/lib/server/request";
import { getViewer } from "@/lib/server/session";

const MAX_BODY_BYTES = 1024;
/** A lesson is never longer than this, s (anything above is a broken report). */
const MAX_SECONDS = 6 * 3600;
/** Reports per account per day: the player sends one every ~15 s of watching, plus pauses and seeks. */
const DAILY_REPORTS = 6000;

const seconds = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 && v <= MAX_SECONDS ? Math.round(v * 10) / 10 : null);

function parse(body: unknown): { lesson: string; input: ProgressInput } | null {
  if (!body || typeof body !== "object") return null;
  const { lesson, position, duration, watched } = body as Record<string, unknown>;
  if (typeof lesson !== "string" || !/^[a-z0-9-]{1,80}$/.test(lesson)) return null;
  const input: ProgressInput = {};
  if (position !== undefined) {
    const s = seconds(position);
    if (s === null) return null;
    input.position = s;
  }
  if (duration !== undefined) {
    const s = seconds(duration);
    if (s === null) return null;
    input.duration = s;
  }
  if (watched !== undefined) {
    if (typeof watched !== "boolean") return null;
    input.watched = watched;
  }
  if (input.position === undefined && input.watched === undefined) return null;
  if (input.position !== undefined && input.duration && input.position > input.duration + 1) input.position = input.duration;
  return { lesson, input };
}

/**
 * Where the account stopped in a lesson (features/learn/player.tsx reports while it plays) and the
 * «Просмотрено» mark. Only this site's pages (Origin / Sec-Fetch-Site), only a signed-in account,
 * only a lesson that exists and is open to it; a tiny body, checked numbers, a daily cap.
 */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "Войди в аккаунт, чтобы сохранять прогресс.", code: "auth" }, { status: 401 });

  const read = await readJsonBody(request, MAX_BODY_BYTES);
  if (!read.ok) return NextResponse.json({ error: "Некорректный запрос" }, { status: read.status });
  const parsed = parse(read.value);
  if (!parsed) return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });

  const lesson = findTutorial(parsed.lesson);
  if (!lesson) return NextResponse.json({ error: "Нет такого урока" }, { status: 404 });
  if (!canWatchTutorial(viewer.access, lesson)) {
    return NextResponse.json({ error: "Урок открывается с подпиской IDX PRO.", code: "plan" }, { status: 403 });
  }

  if (!consumeDailyQuota(`learn:user:${viewer.user.id}`, DAILY_REPORTS).allowed) {
    return NextResponse.json({ error: "Слишком много запросов" }, { status: 429 });
  }

  const progress = saveProgress(viewer.user.id, lesson.slug, parsed.input);
  return NextResponse.json({ progress }, { headers: { "Cache-Control": "private, no-store" } });
}
