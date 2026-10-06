"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, RotateCcw, Sparkles, Square, X } from "lucide-react";
import { Markdown } from "@/features/chat/markdown";
import { OPEN_CHAT_EVENT, type OpenChatDetail } from "@/features/chat/events";
import { FOOTER_ID } from "@/components/layout/layout-ids";
import { cn } from "@/lib/utils";

type Message = { id: string; role: "user" | "assistant"; content: string; error?: boolean };

const STORAGE_KEY = "idx-chat-v1";
const MAX_STORED = 30;

const suggestions = [
  "Как сделать плавный зум в After Effects?",
  "Настройки экспорта для Reels и TikTok",
  "Почему лагает превью в Premiere Pro?",
  "Что входит в IDX PACK?",
];

const uid = () => Math.random().toString(36).slice(2, 10);

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [bottomOffset, setBottomOffset] = useState(0);
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
      if (saved) setMessages(JSON.parse(saved) as Message[]);
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

  // Keep the launcher above the footer ("над футером").
  useEffect(() => {
    let frame = 0;
    const update = () => {
      const footer = document.getElementById(FOOTER_ID);
      if (!footer) return;
      const overlap = window.innerHeight - footer.getBoundingClientRect().top;
      setBottomOffset(overlap > 0 ? overlap : 0);
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

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
          body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })) }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) {
          const data = await res.json().catch(() => null);
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
          bottom: baseBottom + bottomOffset + 72,
          height: `min(620px, calc(100dvh - ${baseBottom + bottomOffset + 72 + 88}px))`,
          minHeight: 320,
        }}
      >
          <header className="flex items-center gap-3 border-b border-white/6 px-4 py-3.5">
            <span className="relative inline-flex size-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#a497ff,#5241f0)] shadow-[inset_0_1px_0_rgb(255_255_255/0.4)]">
              <Sparkles size={18} className="text-white" />
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
      </section>

      <button
        ref={launcherRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="chat-panel"
        aria-label={open ? "Закрыть ИИ-ассистента" : "Открыть ИИ-ассистента по монтажу"}
        className={cn(
          "group glass glass-strong fixed right-3 z-[60] flex size-14 items-center justify-center rounded-full transition-[bottom] duration-200 sm:right-6",
          !open && messages.length === 0 && "animate-pulse-ring",
        )}
        style={{ bottom: baseBottom + bottomOffset }}
      >
        <span className="absolute inset-1.5 -z-10 rounded-full bg-[linear-gradient(135deg,#a497ff,#5241f0)] opacity-90 shadow-[inset_0_1px_0_rgb(255_255_255/0.45)] transition group-hover:opacity-100" />
        {open ? <X size={22} className="text-white" /> : <Sparkles size={22} className="text-white" />}
        {!open && (
          <span className="pointer-events-none absolute right-full mr-3 hidden rounded-full glass-soft bg-ink-900/80 px-3 py-1.5 text-xs whitespace-nowrap text-muted opacity-0 transition group-hover:opacity-100 md:block">
            Вопрос по монтажу?
          </span>
        )}
      </button>
    </>
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
            ? "rounded-br-md bg-[linear-gradient(135deg,rgb(143_128_255/0.55),rgb(82_65_240/0.55))] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.25)]"
            : "glass-soft rounded-bl-md text-muted",
          error && "border-pink/40 text-pink",
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
