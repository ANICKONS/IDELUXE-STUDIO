"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, ArrowUp, Lock, RotateCcw, Sparkles, Square, X } from "lucide-react";
import { Markdown } from "@/features/chat/markdown";
import { OPEN_CHAT_EVENT, type OpenChatDetail } from "@/features/chat/events";
import { routes } from "@/config/routes";
import { can } from "@/lib/access-rules";
import { useViewer } from "@/lib/viewer";
import { cn } from "@/lib/utils";

type Message = { id: string; role: "user" | "assistant"; content: string; error?: boolean };

const STORAGE_KEY = "idx-chat-v1";
const MAX_STORED = 30;
/** What goes to /api/chat with each question — the same limits the server applies. */
const SEND_LAST = 12;
const SEND_CHARS = 2000;

/** Saved history is outside data: keep only well-formed messages (a broken entry must not crash every page). */
function restore(value: unknown): Message[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (m): m is Message =>
        !!m && typeof m === "object" && typeof m.id === "string" && (m.role === "user" || m.role === "assistant") && typeof m.content === "string",
    )
    .slice(-MAX_STORED)
    .map(({ id, role, content, error }) => ({ id, role, content, error: error === true || undefined }));
}

const suggestions = [
  "Как сделать плавный зум в After Effects?",
  "Настройки экспорта для Reels и TikTok",
  "Почему лагает превью в Premiere Pro?",
  "Что входит в IDX PACK?",
];

const uid = () => Math.random().toString(36).slice(2, 10);

/**
 * The AI assistant: a launcher in the corner and a panel that grows out of it. Part of IDX PRO:
 * without it (or without an account) the panel shows what the assistant does and how to open it;
 * the server checks the same on every message (/api/chat → 401 / 403).
 */
export function ChatWidget() {
  const { status, viewer } = useViewer();
  // The server may know better (access ended since the page loaded): its answer locks the panel too
  const [lockedByServer, setLockedByServer] = useState<"auth" | "plan" | null>(null);
  const lock: "auth" | "plan" | null = lockedByServer ?? (status !== "ready" ? null : !viewer ? "auth" : can(viewer.access, "ai") ? null : "plan");
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  // Restore history once on mount.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage
      if (saved) setMessages(restore(JSON.parse(saved)));
    } catch {
      /* ignore corrupted storage */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || streaming) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_STORED)));
    } catch {
      /* storage full or disabled */
    }
  }, [messages, streaming, hydrated]);

  // Open from anywhere via OpenChatButton.
  useEffect(() => {
    const onOpen = (e: Event) => {
      const prompt = (e as CustomEvent<OpenChatDetail>).detail?.prompt;
      setOpen(true);
      if (prompt) setInput(prompt);
    };
    window.addEventListener(OPEN_CHAT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, onOpen);
  }, []);

  // While open: Escape or a click anywhere outside the panel closes it. Buttons that open the chat
  // (OpenChatButton, data-chat-open) and the launcher itself don't count as "outside".
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        launcherRef.current?.focus();
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (!target || panelRef.current?.contains(target) || launcherRef.current?.contains(target)) return;
      if (target.closest?.("[data-chat-open]")) return;
      setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  // Newest message in view — only while open, so nothing scrolls inside the panel as it closes
  useEffect(() => {
    if (open) listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, open]);

  const send = useCallback(
    async (text: string) => {
      const content = text.trim();
      if (!content || streaming) return;

      const userMsg: Message = { id: uid(), role: "user", content };
      const assistantId = uid();
      const history = [...messages.filter((m) => !m.error), userMsg];
      setMessages([...messages, userMsg, { id: assistantId, role: "assistant", content: "" }]);
      setInput("");
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      const patch = (fn: (m: Message) => Message) =>
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? fn(m) : m)));

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // Only what the server reads (last 12, 2000 chars each): a long chat never outgrows the body limit
          body: JSON.stringify({ messages: history.slice(-SEND_LAST).map(({ role, content }) => ({ role, content: content.slice(0, SEND_CHARS) })) }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => null);
          if (data?.code === "auth" || data?.code === "plan") {
            setLockedByServer(data.code);
            setMessages((prev) => prev.filter((m) => m.id !== assistantId && m.id !== userMsg.id));
            setInput(content);
            return;
          }
          patch((m) => ({ ...m, content: data?.error ?? "Не удалось получить ответ. Попробуй ещё раз.", error: true }));
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          patch((m) => ({ ...m, content: m.content + chunk }));
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          patch((m) => ({ ...m, content: m.content || "Соединение прервалось. Попробуй ещё раз.", error: !m.content }));
        }
      } finally {
        patch((m) => (m.content ? m : { ...m, content: "Ответ остановлен.", error: true }));
        setStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, streaming],
  );

  const stop = () => abortRef.current?.abort();
  const clear = () => {
    stop();
    setMessages([]);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send(input);
    }
  };

  // The launcher stays put in the corner, also over the footer: where the footer card would run
  // under it, the footer leaves an empty strip at the bottom for it (footer.tsx)
  const baseBottom = 16;

  return (
    <>
      {/* Always mounted: it grows out of the launcher and shrinks back into it. While closed it's
          invisible (after the transition) and inert — no focus, no clicks, hidden from screen readers. */}
      <section
        ref={panelRef}
        id="chat-panel"
        role="dialog"
        aria-label="ИИ-ассистент по монтажу"
        inert={!open}
        data-open={open || undefined}
        className="pop-panel glass glass-strong fixed right-3 z-[60] flex w-[min(410px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-[1.75rem] sm:right-6"
        style={{
          bottom: baseBottom + 72,
          height: `min(620px, calc(100dvh - ${baseBottom + 72 + 88}px))`,
          minHeight: 320,
        }}
      >
          <header className="flex items-center gap-3 border-b border-white/6 px-4 py-3.5">
            <span className="relative inline-flex size-10 items-center justify-center rounded-2xl border border-accent/25 bg-[linear-gradient(135deg,#2c2f38,#0e0f12)] shadow-[inset_0_1px_0_rgb(255_255_255/0.14)]">
              <Sparkles size={18} className="text-accent" />
              <span className="absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-ink-900 bg-teal" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-semibold">IDX Ассистент</p>
              <p className="truncate text-xs text-dim">Эксперт по монтажу · отвечает 24/7</p>
            </div>
            <button type="button" onClick={clear} className="btn btn-glass size-8 p-0" aria-label="Очистить диалог" title="Очистить диалог">
              <RotateCcw size={14} />
            </button>
          </header>

          {lock ? (
            <LockedPanel reason={lock} />
          ) : (
          <>
          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
            <Bubble role="assistant">
              Привет! Я помогу с After Effects, Premiere Pro, Vegas Pro, экспортом, цветом и звуком. Спрашивай что угодно по
              монтажу.
            </Bubble>

            {messages.map((m) => (
              <Bubble key={m.id} role={m.role} error={m.error}>
                {m.role === "assistant" ? (
                  m.content ? (
                    <Markdown text={m.content} />
                  ) : (
                    <TypingDots />
                  )
                ) : (
                  <span className="whitespace-pre-wrap">{m.content}</span>
                )}
              </Bubble>
            ))}

            {messages.length === 0 && (
              <div className="pt-2">
                <p className="mb-2 font-mono text-[10px] tracking-[0.16em] text-dim uppercase">Популярные вопросы</p>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => void send(s)}
                      className="glass-soft rounded-full px-3 py-1.5 text-left text-[12.5px] text-muted transition hover:border-accent/40 hover:text-fg"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <form
            className="border-t border-white/6 p-3"
            onSubmit={(e) => {
              e.preventDefault();
              void send(input);
            }}
          >
            <div className="flex items-end gap-2 rounded-2xl border border-white/8 bg-black/30 p-1.5 pl-3.5 focus-within:border-accent/50">
              <label htmlFor="chat-input" className="sr-only">
                Сообщение ассистенту
              </label>
              <textarea
                id="chat-input"
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value.slice(0, 2000))}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder="Спроси про монтаж…"
                className="field-sizing-content max-h-32 min-h-9 flex-1 resize-none bg-transparent py-2 text-sm text-fg outline-none placeholder:text-dim"
              />
              {streaming ? (
                <button type="button" onClick={stop} className="btn btn-glass size-9 shrink-0 p-0" aria-label="Остановить ответ">
                  <Square size={14} />
                </button>
              ) : (
                <button type="submit" disabled={!input.trim()} className="btn btn-primary size-9 shrink-0 p-0" aria-label="Отправить">
                  <ArrowUp size={17} />
                </button>
              )}
            </div>
            <p className="mt-2 px-1 text-[10.5px] text-dim">ИИ может ошибаться. Не отправляй пароли и личные данные.</p>
          </form>
          </>
          )}
      </section>

      <button
        ref={launcherRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="chat-panel"
        aria-label={open ? "Закрыть ИИ-ассистента" : "Открыть ИИ-ассистента по монтажу"}
        className="group glass glass-strong fixed right-3 z-[60] flex size-14 items-center justify-center rounded-full sm:right-6"
        style={{ bottom: baseBottom }}
      >
        {/* Until the first question: a soft ring keeps spreading out of the launcher */}
        {!open && messages.length === 0 && (
          <span aria-hidden className="pointer-events-none absolute inset-0 animate-ping-soft rounded-full border border-accent/60" />
        )}
        {/* Ivory key, like the primary buttons */}
        <span className="absolute inset-1.5 -z-10 rounded-full bg-[linear-gradient(180deg,#fdfbf7,#ddd5c6)] opacity-95 shadow-[inset_0_1px_0_#fff,inset_0_-3px_8px_rgb(150_125_85/0.22)] transition group-hover:opacity-100" />
        {open ? <X size={22} className="text-ink-950" /> : <Sparkles size={22} className="text-ink-950" />}
        {!open && (
          <span className="pointer-events-none absolute right-full mr-3 hidden rounded-full glass-soft bg-ink-900/80 px-3 py-1.5 text-xs whitespace-nowrap text-muted opacity-0 transition group-hover:opacity-100 md:block">
            Вопрос по монтажу?
          </span>
        )}
      </button>
    </>
  );
}

/** Instead of the conversation: what the assistant does and how to get it. */
function LockedPanel({ reason }: { reason: "auth" | "plan" }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-7 py-8 text-center">
      <span
        aria-hidden
        className="inline-flex size-14 items-center justify-center rounded-2xl border border-accent/35 bg-accent/12 text-accent-soft shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_0_30px_-6px_rgb(var(--rgb-accent)/0.35)]"
      >
        <Lock size={22} />
      </span>
      <p className="mt-5 font-mono text-[10px] tracking-[0.18em] text-accent-soft uppercase">В подписке IDX PRO</p>
      <h2 className="mt-2 font-display text-xl font-semibold text-balance">Ассистент по монтажу 24/7</h2>
      <p className="mt-3 text-sm leading-relaxed text-muted">
        Подскажет эффект, настройки экспорта и горячие клавиши, разберёт ошибку рендера в After Effects, Premiere Pro и Vegas Pro.
        Открывается с IDX PRO или IDX FULL.
      </p>
      <div className="mt-7 flex w-full flex-col gap-2.5">
        <Link href={routes.pricing} className="btn btn-primary btn-md w-full">
          {reason === "auth" ? "Смотреть тарифы" : "Открыть IDX PRO"} <ArrowRight size={16} />
        </Link>
        {reason === "auth" ? (
          <Link href={routes.login} className="btn btn-glass btn-md w-full">
            Войти
          </Link>
        ) : (
          <Link href={routes.profile} className="btn btn-glass btn-md w-full">
            Есть промокод?
          </Link>
        )}
      </div>
    </div>
  );
}

function Bubble({ role, error, children }: { role: "user" | "assistant"; error?: boolean; children: React.ReactNode }) {
  const isUser = role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13.5px] leading-relaxed",
          isUser
            ? "rounded-br-md border border-white/10 bg-white/[0.1] text-fg shadow-[inset_0_1px_0_rgb(255_255_255/0.12)]"
            : "glass-soft rounded-bl-md text-muted",
          error && "border-rose/40 text-rose",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex gap-1 py-1" aria-label="Ассистент печатает">
      {[0, 150, 300].map((d) => (
        <span key={d} className="size-1.5 animate-bounce rounded-full bg-accent-soft" style={{ animationDelay: `${d}ms` }} />
      ))}
    </span>
  );
}
