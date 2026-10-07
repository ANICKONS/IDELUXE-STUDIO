import { NextResponse, type NextRequest } from "next/server";
import { isAiConfigured, serverEnv } from "@/config/env.server";
import { buildSystemPrompt } from "@/features/chat/system-prompt";
import { can } from "@/lib/access-rules";
import { clientIp } from "@/lib/server/client-ip";
import { consumeDailyQuota, hashKey } from "@/lib/server/rate-limit";
import { isSameOrigin, readJsonBody } from "@/lib/server/request";
import { getViewer } from "@/lib/server/session";

export const maxDuration = 60;

const MAX_MESSAGES = 12;
const MAX_CHARS = 2000;
/** All messages together: keeps one request's token bill bounded. */
const MAX_TOTAL_CHARS = 8000;
const MAX_BODY_BYTES = 64 * 1024;
/** Upstream errors are logged, but only the start (some providers echo the user's text). */
const LOG_CHARS = 300;

type ChatMessage = { role: "user" | "assistant"; content: string };

function parseMessages(body: unknown): ChatMessage[] | null {
  if (!body || typeof body !== "object" || !Array.isArray((body as { messages?: unknown }).messages)) return null;
  const raw = (body as { messages: unknown[] }).messages;
  const messages: ChatMessage[] = [];
  for (const m of raw.slice(-MAX_MESSAGES)) {
    if (!m || typeof m !== "object") return null;
    const { role, content } = m as Record<string, unknown>;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") return null;
    const trimmed = content.trim().slice(0, MAX_CHARS);
    if (trimmed) messages.push({ role, content: trimmed });
  }
  if (!messages.length || messages[messages.length - 1].role !== "user") return null;
  // Oldest messages go first once the total is over budget; a conversation can't start with a
  // made-up assistant turn (the client writes the history, so it's only a hint of context)
  let total = messages.reduce((n, m) => n + m.content.length, 0);
  while (messages.length > 1 && (total > MAX_TOTAL_CHARS || messages[0].role === "assistant")) {
    total -= messages.shift()!.content.length;
  }
  return messages;
}

function textStream(text: string) {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    },
  });
}

const streamHeaders = {
  "Content-Type": "text/plain; charset=utf-8",
  "Cache-Control": "no-store",
  "X-Accel-Buffering": "no",
};

/**
 * AI assistant — part of IDX PRO (content/plans.ts). Protected by:
 * - same-origin check (only this site's pages; requests without Origin are refused);
 * - the session and the plan: no account → 401 `auth`, no PRO → 403 `plan` (the widget shows a lock);
 * - body size (counted while reading), message count, per-message and total length limits;
 * - daily quotas: per account, per IP and for the whole site (in memory, see lib/server/rate-limit.ts).
 */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const viewer = await getViewer();
  if (!viewer) {
    return NextResponse.json({ error: "Войди в аккаунт, чтобы спросить ассистента.", code: "auth" }, { status: 401 });
  }
  if (!can(viewer.access, "ai")) {
    return NextResponse.json({ error: "ИИ-ассистент открывается с подпиской IDX PRO.", code: "plan" }, { status: 403 });
  }

  const read = await readJsonBody(request, MAX_BODY_BYTES);
  if (!read.ok) {
    return read.status === 413
      ? NextResponse.json({ error: "Слишком длинный запрос" }, { status: 413 })
      : NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }
  const body = read.value;

  const messages = parseMessages(body);
  if (!messages) return NextResponse.json({ error: "Некорректный формат сообщений" }, { status: 400 });

  if (!isAiConfigured()) {
    return new Response(
      textStream(
        "ИИ-ассистент пока работает в демо-режиме: не задан ключ **AI_API_KEY**.\n\nДобавь ключ OpenAI-совместимого API в `.env.local` (см. `.env.example`) — и я начну отвечать на вопросы по монтажу.",
      ),
      { headers: streamHeaders },
    );
  }

  const tooMany = () => NextResponse.json({ error: "Лимит сообщений на сегодня исчерпан. Возвращайся завтра!" }, { status: 429 });
  if (!consumeDailyQuota(`chat:user:${viewer.user.id}`, serverEnv.chatUserDailyLimit).allowed) return tooMany();
  if (!consumeDailyQuota(`chat:${hashKey(clientIp(request))}`, serverEnv.chatDailyLimit).allowed) return tooMany();
  // Site-wide ceiling: rotating IPs can't run up the bill
  if (!consumeDailyQuota("chat:global", serverEnv.chatGlobalDailyLimit).allowed) {
    return NextResponse.json({ error: "Ассистент на сегодня отдыхает. Возвращайся завтра!" }, { status: 429 });
  }

  let extraBody: Record<string, unknown> = {};
  if (serverEnv.aiExtraBody) {
    try {
      extraBody = JSON.parse(serverEnv.aiExtraBody);
    } catch {
      console.error("[chat] AI_EXTRA_BODY is not valid JSON, ignoring");
    }
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${serverEnv.aiBaseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${serverEnv.aiApiKey}`,
      },
      // Provider extras first: they must not override the fixed fields (e.g. stream: false
      // would break the SSE parsing below)
      body: JSON.stringify({
        ...extraBody,
        model: serverEnv.aiModel,
        messages: [{ role: "system", content: buildSystemPrompt() }, ...messages],
        stream: true,
        temperature: 0.5,
        max_tokens: 900,
      }),
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(55_000)]),
    });
  } catch (error) {
    console.error("[chat] upstream request failed", error);
    return NextResponse.json({ error: "Ассистент временно недоступен. Попробуй ещё раз." }, { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    console.error("[chat] upstream error", upstream.status, detail.slice(0, LOG_CHARS));
    return NextResponse.json({ error: "Ассистент временно недоступен. Попробуй ещё раз." }, { status: 502 });
  }

  // Convert OpenAI-style SSE into a plain text stream of answer tokens.
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  const emit = (line: string, controller: TransformStreamDefaultController<Uint8Array>) => {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) return;
    const data = trimmed.slice(5).trim();
    if (!data || data === "[DONE]") return;
    try {
      const json = JSON.parse(data);
      const delta: unknown = json?.choices?.[0]?.delta?.content;
      if (typeof delta === "string" && delta) controller.enqueue(encoder.encode(delta));
    } catch {
      // Partial/keep-alive line — skip.
    }
  };

  const stream = upstream.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) emit(line, controller);
      },
      // The last line may come without a trailing newline
      flush(controller) {
        buffer += decoder.decode();
        if (buffer) emit(buffer, controller);
        buffer = "";
      },
    }),
  );

  return new Response(stream, { headers: streamHeaders });
}
