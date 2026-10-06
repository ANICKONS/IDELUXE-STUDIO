import { NextResponse, type NextRequest } from "next/server";
import { isAiConfigured, serverEnv } from "@/config/env.server";
import { buildSystemPrompt } from "@/features/chat/system-prompt";
import { clientIp } from "@/lib/server/client-ip";
import { consumeDailyQuota, hashKey } from "@/lib/server/rate-limit";
import { isSameOrigin } from "@/lib/server/request";

export const maxDuration = 60;

const MAX_MESSAGES = 12;
const MAX_CHARS = 2000;
const MAX_BODY_BYTES = 64 * 1024;

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
 * AI assistant. Public endpoint (no auth), protected by:
 * - same-origin check (other sites can't call it from a browser);
 * - body size and message limits;
 * - daily per-IP quota (in memory, see lib/server/rate-limit.ts).
 */
export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Слишком длинный запрос" }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Некорректный запрос" }, { status: 400 });
  }

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

  const quota = consumeDailyQuota(`chat:${hashKey(clientIp(request))}`, serverEnv.chatDailyLimit);
  if (!quota.allowed) {
    return NextResponse.json({ error: "Лимит сообщений на сегодня исчерпан. Возвращайся завтра!" }, { status: 429 });
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
      body: JSON.stringify({
        model: serverEnv.aiModel,
        messages: [{ role: "system", content: buildSystemPrompt() }, ...messages],
        stream: true,
        temperature: 0.5,
        max_tokens: 1200,
        ...extraBody,
      }),
      signal: AbortSignal.any([request.signal, AbortSignal.timeout(55_000)]),
    });
  } catch (error) {
    console.error("[chat] upstream request failed", error);
    return NextResponse.json({ error: "Ассистент временно недоступен. Попробуй ещё раз." }, { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    console.error("[chat] upstream error", upstream.status, await upstream.text().catch(() => ""));
    return NextResponse.json({ error: "Ассистент временно недоступен. Попробуй ещё раз." }, { status: 502 });
  }

  // Convert OpenAI-style SSE into a plain text stream of answer tokens.
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";

  const stream = upstream.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const data = trimmed.slice(5).trim();
          if (!data || data === "[DONE]") continue;
          try {
            const json = JSON.parse(data);
            const delta: unknown = json?.choices?.[0]?.delta?.content;
            if (typeof delta === "string" && delta) controller.enqueue(encoder.encode(delta));
          } catch {
            // Partial/keep-alive line — skip.
          }
        }
      },
    }),
  );

  return new Response(stream, { headers: streamHeaders });
}
