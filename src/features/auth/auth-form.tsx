"use client";

import Link from "next/link";
import { useId, useState } from "react";
import { ArrowRight, Eye, EyeOff, Info } from "lucide-react";
import { LogoMark, TelegramIcon } from "@/components/icons";
import { routes } from "@/config/routes";
import { site } from "@/config/site";
import { cn } from "@/lib/utils";

type Mode = "login" | "register";

const copy: Record<Mode, { title: string; lead: string; submit: string }> = {
  login: { title: "С возвращением", lead: "Войди, чтобы смотреть туториалы и открыть свой пак.", submit: "Войти" },
  register: { title: "Создай профиль", lead: "Профиль хранит просмотренные разборы и доступ к паку.", submit: "Зарегистрироваться" },
};

/**
 * Sign-in / sign-up form — a design stub. Nothing is sent or stored anywhere: submitting shows a
 * note that accounts are coming. When auth is ready, replace `onSubmit` with the real call and
 * pass the user to <SiteShell user={…}> (see README → «Авторизацию»).
 */
export function AuthForm() {
  const [mode, setMode] = useState<Mode>("login");
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState(false);
  const id = useId();
  const field = (name: string) => `${id}-${name}`;
  const text = copy[mode];

  const switchTo = (next: Mode) => {
    setMode(next);
    setNotice(false);
  };

  return (
    <div className="glass w-full max-w-md animate-fade-up rounded-[2rem] p-7 sm:p-9">
      <div className="flex items-center gap-3">
        <LogoMark size={40} />
        <div>
          <p className="font-display text-sm font-semibold tracking-[0.08em]">IDELUXE</p>
          <p className="font-mono text-[10px] tracking-[0.18em] text-dim uppercase">Личный кабинет</p>
        </div>
      </div>

      {/* Segmented switch, styled like the header's active-tab pill */}
      <div role="tablist" aria-label="Вход или регистрация" className="relative mt-8 grid grid-cols-2 rounded-full border border-white/10 bg-white/[0.03] p-1">
        <span
          aria-hidden
          className={cn(
            "absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-full border border-white/12 bg-white/[0.08] shadow-[inset_0_1px_0_rgb(255_255_255/0.16),0_6px_18px_-8px_rgb(107_91_255/0.8)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            mode === "register" && "translate-x-full",
          )}
        />
        {(["login", "register"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            aria-controls={field("panel")}
            onClick={() => switchTo(m)}
            className={cn(
              "relative z-10 h-10 rounded-full text-[12px] font-semibold tracking-[0.14em] uppercase transition-colors duration-300",
              mode === m ? "text-fg" : "text-fg/50 hover:text-fg",
            )}
          >
            {m === "login" ? "Вход" : "Регистрация"}
          </button>
        ))}
      </div>

      <div id={field("panel")} role="tabpanel">
        <h1 className="mt-8 font-display text-2xl font-semibold">{text.title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">{text.lead}</p>

        <form
          className="mt-7 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setNotice(true);
          }}
        >
          {mode === "register" && (
            <div>
              <label htmlFor={field("name")} className="mb-1.5 block text-sm font-medium text-fg/90">
                Имя или ник
              </label>
              <input id={field("name")} name="name" type="text" autoComplete="nickname" required maxLength={60} className="field" placeholder="Например, IDELUXE" />
            </div>
          )}

          <div>
            <label htmlFor={field("email")} className="mb-1.5 block text-sm font-medium text-fg/90">
              Email
            </label>
            <input id={field("email")} name="email" type="email" autoComplete="email" required maxLength={120} className="field" placeholder="you@example.com" />
          </div>

          <div>
            <div className="mb-1.5 flex items-baseline justify-between">
              <label htmlFor={field("password")} className="text-sm font-medium text-fg/90">
                Пароль
              </label>
              {mode === "login" && (
                <button type="button" onClick={() => setNotice(true)} className="text-xs text-accent-soft transition hover:text-fg">
                  Забыли пароль?
                </button>
              )}
            </div>
            <div className="relative">
              <input
                id={field("password")}
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                required
                minLength={mode === "register" ? 8 : undefined}
                maxLength={128}
                className="field pr-12"
                placeholder={mode === "register" ? "Минимум 8 символов" : "••••••••"}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                aria-pressed={showPassword}
                className="absolute top-1/2 right-2 inline-flex size-9 -translate-y-1/2 items-center justify-center rounded-xl text-dim transition hover:bg-white/5 hover:text-fg"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>

          {mode === "register" && (
            <label className="flex items-start gap-3 text-[13px] leading-relaxed text-muted">
              <input type="checkbox" name="terms" required className="mt-1 size-4 shrink-0 accent-accent-strong" />
              <span>
                Принимаю{" "}
                <Link href={routes.legal.offer} className="text-accent-soft underline-offset-2 hover:underline">
                  оферту
                </Link>{" "}
                и{" "}
                <Link href={routes.legal.privacy} className="text-accent-soft underline-offset-2 hover:underline">
                  политику конфиденциальности
                </Link>
              </span>
            </label>
          )}

          <button type="submit" className="btn btn-primary btn-md mt-2 w-full">
            {text.submit} <ArrowRight size={17} />
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 font-mono text-[10px] tracking-[0.18em] text-dim uppercase" aria-hidden>
          <span className="h-px flex-1 bg-white/8" /> или <span className="h-px flex-1 bg-white/8" />
        </div>

        <button type="button" onClick={() => setNotice(true)} className="btn btn-glass btn-md w-full">
          <TelegramIcon size={17} /> Войти через Telegram
        </button>

        {/* Stub notice; aria-live, so screen readers hear it after submitting */}
        <div aria-live="polite">
          {notice && (
            <p className="mt-6 flex animate-fade-up gap-3 rounded-2xl border border-accent/25 bg-accent/10 p-4 text-[13px] leading-relaxed text-muted">
              <Info size={18} className="mt-0.5 shrink-0 text-accent-soft" aria-hidden />
              <span>
                Вход и регистрация появятся вместе с личным кабинетом, сейчас форма только для вида и никуда ничего не отправляет. Доступ к IDX PACK
                выдаёт{" "}
                <a href={site.telegram.bot.url} target="_blank" rel="noopener noreferrer" className="text-accent-soft underline-offset-2 hover:underline">
                  Telegram-бот
                </a>
                .
              </span>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
