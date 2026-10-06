"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState, type InputHTMLAttributes, type ReactNode, type Ref } from "react";
import { ArrowRight, Check, Eye, EyeOff, Info, LockKeyhole, Mail, TriangleAlert, UserRound, type LucideIcon } from "lucide-react";
import { GoogleIcon, LogoMark, TelegramIcon } from "@/components/icons";
import { routes } from "@/config/routes";
import { site } from "@/config/site";
import { pluralRu } from "@/lib/format";
import { cn } from "@/lib/utils";

type Mode = "login" | "register";

const copy: Record<Mode, { title: string; lead: string; submit: string; switchHint: string; switchAction: string }> = {
  login: {
    title: "С возвращением",
    lead: "Войди, чтобы смотреть туториалы и открыть свой пак.",
    submit: "Войти",
    switchHint: "Ещё нет профиля?",
    switchAction: "Создать",
  },
  register: {
    title: "Создай профиль",
    lead: "Профиль хранит просмотренные разборы и доступ к паку.",
    submit: "Создать профиль",
    switchHint: "Уже есть профиль?",
    switchAction: "Войти",
  },
};

const MIN_PASSWORD = 8;

/** Password strength: 0 — empty, 1 — too short or one kind of characters … 4 — long and varied. */
function strength(password: string) {
  if (!password) return 0;
  if (password.length < MIN_PASSWORD) return 1;
  const kinds = [/[a-zа-яё]/, /[A-ZА-ЯЁ]/, /\d/, /[^\p{L}\d]/u].filter((re) => re.test(password)).length;
  return Math.min(4, 1 + (password.length >= 12 ? 1 : 0) + Math.max(0, kinds - 1));
}

const levels = [
  { bar: "", text: "text-dim" },
  { bar: "bg-pink", text: "text-pink" },
  { bar: "bg-amber", text: "text-amber" },
  { bar: "bg-accent", text: "text-accent-soft" },
  { bar: "bg-neon", text: "text-neon" },
];

function strengthLabel(password: string, level: number) {
  if (!password) return `Минимум ${MIN_PASSWORD} символов`;
  const left = MIN_PASSWORD - password.length;
  if (left > 0) return `Ещё ${left} ${pluralRu(left, ["символ", "символа", "символов"])}`;
  return ["", "Слабый: добавь цифры или заглавные", "Средний пароль", "Хороший пароль", "Надёжный пароль"][level];
}

/**
 * Sign-in / sign-up form — a design stub. Nothing is sent or stored anywhere: submitting shows a
 * note that accounts are coming. When auth is ready, replace `onSubmit` (and the provider buttons'
 * `onClick`) with the real calls and pass the user to <SiteShell user={…}> (see README → «Авторизацию»).
 *
 * One card for both modes: the switch is a link under the form, the extra registration fields
 * slide in and out. Floating labels, show-password, Caps Lock warning, a strength meter on sign-up;
 * Telegram and Google sign-in as two icon buttons.
 */
export function AuthForm() {
  const [mode, setMode] = useState<Mode>("login");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [notice, setNotice] = useState(false);
  const id = useId();
  const field = (name: string) => `${id}-${name}`;
  const text = copy[mode];
  const isRegister = mode === "register";
  const level = strength(password);

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  /** Set by the mode switch: focus goes to the form's first field after the re-render. */
  const focusAfterSwitch = useRef(false);

  const switchMode = () => {
    setMode(isRegister ? "login" : "register");
    setNotice(false);
    focusAfterSwitch.current = true;
  };

  useEffect(() => {
    if (!focusAfterSwitch.current) return;
    focusAfterSwitch.current = false;
    (mode === "register" ? nameRef : emailRef).current?.focus({ preventScroll: true });
  }, [mode]);

  const onCaps = (e: React.KeyboardEvent<HTMLInputElement>) => setCapsLock(e.getModifierState("CapsLock"));

  return (
    <div className="glass relative w-full max-w-[26rem] animate-rise-in rounded-[2rem] p-7 sm:p-9">
      {/* Light falling on the card from above, and a bright seam on its top edge */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-44 rounded-t-[inherit] bg-[radial-gradient(70%_100%_at_50%_0%,rgb(107_91_255/0.24),transparent)]"
      />
      <div aria-hidden className="pointer-events-none absolute inset-x-14 -top-px h-px bg-gradient-to-r from-transparent via-accent-soft/70 to-transparent" />

      <div className="text-center">
        <div className="relative mx-auto w-fit">
          <span aria-hidden className="absolute -inset-3 rounded-full bg-accent-strong/30 blur-xl" />
          <LogoMark size={52} className="relative" />
        </div>
        <p className="mt-5 font-mono text-[10px] tracking-[0.2em] text-dim uppercase">IDELUXE · Личный кабинет</p>
        {/* Re-mounts on switch, so the new title glides in */}
        <div key={mode} className="animate-fade-up">
          <h1 className="mt-3 font-display text-[1.65rem] leading-tight font-semibold">{text.title}</h1>
          <p className="mx-auto mt-2 max-w-[19rem] text-sm leading-relaxed text-muted">{text.lead}</p>
        </div>
      </div>

      <form
        className="mt-8"
        aria-label={isRegister ? "Регистрация" : "Вход"}
        onSubmit={(e) => {
          e.preventDefault();
          setNotice(true);
        }}
      >
        <Collapse open={isRegister}>
          <div className="pb-3">
            <Field
              ref={nameRef}
              id={field("name")}
              label="Имя или ник"
              icon={UserRound}
              name="name"
              type="text"
              autoComplete="nickname"
              required
              maxLength={60}
              disabled={!isRegister}
            />
          </div>
        </Collapse>

        <Field ref={emailRef} id={field("email")} label="Email" icon={Mail} name="email" type="email" autoComplete="email" inputMode="email" required maxLength={120} />

        <div className="mt-3">
          <Field
            id={field("password")}
            label="Пароль"
            icon={LockKeyhole}
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete={isRegister ? "new-password" : "current-password"}
            required
            minLength={isRegister ? MIN_PASSWORD : undefined}
            maxLength={128}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={onCaps}
            onKeyUp={onCaps}
            onBlur={() => setCapsLock(false)}
            aria-describedby={cn(isRegister && field("strength"), capsLock && field("caps")) || undefined}
            action={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                aria-pressed={showPassword}
                className="absolute top-1/2 right-2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-xl text-dim transition hover:bg-white/5 hover:text-fg"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            }
          />
        </div>

        <div aria-live="polite">
          {capsLock && (
            <p id={field("caps")} className="mt-2 flex animate-fade-in items-center gap-1.5 text-xs text-amber">
              <TriangleAlert size={13} aria-hidden /> Включён Caps Lock
            </p>
          )}
        </div>

        {/* Sign-up: strength meter */}
        <Collapse open={isRegister}>
          <div id={field("strength")} className="pt-3">
            <div aria-hidden className="flex gap-1.5">
              {[1, 2, 3, 4].map((i) => (
                <span key={i} className={cn("h-1 flex-1 rounded-full transition-colors duration-300", level >= i ? levels[level].bar : "bg-white/10")} />
              ))}
            </div>
            <p className={cn("mt-2 text-xs transition-colors", levels[level].text)}>{strengthLabel(password, level)}</p>
          </div>
        </Collapse>

        {/* Sign-in: password reset */}
        <Collapse open={!isRegister}>
          <div className="flex justify-end pt-2.5">
            <button type="button" onClick={() => setNotice(true)} className="rounded-md text-xs text-accent-soft transition hover:text-fg">
              Забыли пароль?
            </button>
          </div>
        </Collapse>

        <Collapse open={isRegister}>
          <label className="flex cursor-pointer items-start gap-3 pt-5 text-[13px] leading-relaxed text-muted">
            <span className="relative mt-0.5 inline-flex shrink-0">
              <input
                type="checkbox"
                name="terms"
                required
                disabled={!isRegister}
                className="peer size-[18px] cursor-pointer appearance-none rounded-[6px] border border-white/20 bg-white/[0.04] transition checked:border-accent checked:bg-accent-strong"
              />
              <Check size={13} strokeWidth={3} aria-hidden className="pointer-events-none absolute inset-0 m-auto text-white opacity-0 transition peer-checked:opacity-100" />
            </span>
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
        </Collapse>

        <button type="submit" className="group/submit btn btn-primary btn-md mt-6 h-12 w-full">
          {text.submit}
          <ArrowRight size={17} className="transition-transform duration-300 group-hover/submit:translate-x-0.5" />
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 font-mono text-[10px] tracking-[0.18em] text-dim uppercase" aria-hidden>
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" /> или <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
      </div>

      {/* Providers: icons only, the name is in the label and the tooltip */}
      <div className="grid grid-cols-2 gap-3">
        <ProviderButton label="Войти через Telegram" onClick={() => setNotice(true)}>
          <span className="inline-flex size-7 items-center justify-center rounded-full bg-[linear-gradient(180deg,#3fb6ec,#1d93d2)] shadow-[0_4px_14px_-4px_rgb(42_171_238/0.8)]">
            <TelegramIcon size={15} className="-ml-0.5 text-white" />
          </span>
        </ProviderButton>
        <ProviderButton label="Войти через Google" onClick={() => setNotice(true)}>
          <GoogleIcon size={24} />
        </ProviderButton>
      </div>

      <p className="mt-7 text-center text-sm text-muted">
        {text.switchHint}{" "}
        <button type="button" onClick={switchMode} className="rounded-md font-semibold text-accent-soft underline-offset-4 transition hover:text-fg hover:underline">
          {text.switchAction}
        </button>
      </p>

      {/* Stub notice; aria-live, so screen readers hear it after submitting */}
      <div aria-live="polite">
        {notice && (
          <p className="mt-6 flex animate-fade-up gap-3 rounded-2xl border border-accent/25 bg-accent/10 p-4 text-left text-[13px] leading-relaxed text-muted">
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
  );
}

type FieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "placeholder"> & {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Button inside the field on the right (show password). */
  action?: ReactNode;
  ref?: Ref<HTMLInputElement>;
};

/**
 * Input with a floating label: the label sits in the field like a placeholder and moves up when
 * the field is focused or filled (the `placeholder=" "` trick: :placeholder-shown = empty).
 */
function Field({ id, label, icon: Icon, action, className, ref, ...input }: FieldProps) {
  return (
    <div className="group relative">
      <Icon
        size={18}
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-4 z-10 -translate-y-1/2 text-dim transition-colors duration-200 group-focus-within:text-accent-soft"
      />
      <input ref={ref} id={id} placeholder=" " className={cn("field peer h-14 pt-5 pb-1.5 pl-11", action ? "pr-14" : undefined, className)} {...input} />
      <label
        htmlFor={id}
        className={cn(
          "pointer-events-none absolute top-1/2 left-11 origin-left -translate-y-1/2 text-[15px] text-dim transition-[translate,scale,color] duration-200 ease-out",
          "peer-focus:-translate-y-[1.3rem] peer-focus:scale-[0.78] peer-focus:text-accent-soft",
          "peer-[:not(:placeholder-shown)]:-translate-y-[1.3rem] peer-[:not(:placeholder-shown)]:scale-[0.78]",
        )}
      >
        {label}
      </label>
      {action}
    </div>
  );
}

/**
 * Slides its content open and closed (grid rows 0fr → 1fr). Closed content is inert; inputs in it
 * must also be `disabled`, so the browser doesn't validate or submit them.
 */
function Collapse({ open, children }: { open: boolean; children: ReactNode }) {
  return (
    <div
      inert={!open}
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
      )}
    >
      {/* Negative margin + padding: room for the fields' focus ring inside the clipped box */}
      <div className="-m-1 min-h-0 overflow-hidden p-1">{children}</div>
    </div>
  );
}

function ProviderButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="group/provider inline-flex h-13 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] shadow-[inset_0_1px_0_rgb(255_255_255/0.08)] transition duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.08] hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.12),0_12px_28px_-14px_rgb(107_91_255/0.9)] active:translate-y-0 active:scale-[0.98]"
    >
      <span className="transition-transform duration-300 group-hover/provider:scale-110">{children}</span>
    </button>
  );
}
