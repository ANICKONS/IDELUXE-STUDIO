"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type InputHTMLAttributes, type ReactNode, type Ref } from "react";
import { ArrowRight, Check, Eye, EyeOff, Info, LockKeyhole, Mail, MailCheck, TriangleAlert, UserRound, type LucideIcon } from "lucide-react";
import { GoogleIcon, TelegramIcon } from "@/components/icons";
import { routes } from "@/config/routes";
import { site } from "@/config/site";
import { AuthCard } from "@/features/auth/auth-card";
import { MIN_PASSWORD, PasswordMeter } from "@/features/auth/password-meter";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { useViewer } from "@/lib/viewer";

type Mode = "login" | "register";
/** The note under the form: a sign-in way the server has no keys for, or a hint. */
type Notice = "telegram" | "google" | "need-email";
/** A letter is on its way: the form gives way to «проверь почту». */
type Sent = { kind: "verify" | "reset"; email: string };

/** Better Auth's error codes > what to tell the person. */
function errorText(error: { code?: string; status?: number; message?: string }): string {
  if (error.status === 429) return "Слишком много попыток. Подожди минуту и попробуй снова.";
  switch (error.code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return "Неверный email или пароль.";
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "Аккаунт с этим email уже есть. Войди в него.";
    case "INVALID_EMAIL":
      return "Проверь email: похоже, в нём опечатка.";
    case "PASSWORD_TOO_SHORT":
      return `Пароль слишком короткий: нужно от ${MIN_PASSWORD} символов.`;
    case "PASSWORD_TOO_LONG":
      return "Пароль слишком длинный.";
    default:
      return "Не получилось. Попробуй ещё раз.";
  }
}

const copy: Record<Mode, { title: string; lead: string; submit: string; switchHint: string; switchAction: string }> = {
  login: {
    title: "С возвращением",
    lead: "Войди, чтобы смотреть туториалы, скачивать ресурсы и свой пак.",
    submit: "Войти",
    switchHint: "Ещё нет профиля?",
    switchAction: "Создать",
  },
  register: {
    title: "Создай профиль",
    lead: "Бесплатно: вводные туториалы, программы и часть плагинов откроются сразу.",
    submit: "Создать профиль",
    switchHint: "Уже есть профиль?",
    switchAction: "Войти",
  },
};

/**
 * Three ways in, all through Better Auth (lib/auth-client.ts): e-mail with a password, Telegram and
 * Google. The two providers are redirects — the server decides whether it has their keys, and if a
 * button comes back with an error, the card says that way isn't connected yet.
 *
 * With mail set up (lib/server/mail.ts) a new account must confirm its address first: the form
 * then gives way to «проверь почту» with a resend button. The same screen appears when an
 * unconfirmed account tries to sign in, and after asking for a password reset.
 * On success the site reloads at "/", which is the account's home then.
 */
export function AuthForm() {
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState<Sent | null>(null);
  const id = useId();
  const field = (name: string) => `${id}-${name}`;
  const text = copy[mode];
  const isRegister = mode === "register";

  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  /** Set by the mode switch: focus goes to the form's first field after the re-render. */
  const focusAfterSwitch = useRef(false);

  const switchMode = () => {
    setMode(isRegister ? "login" : "register");
    setNotice(null);
    setError(null);
    focusAfterSwitch.current = true;
  };

  // Already signed in (e.g. an old tab): this page has nothing to do, go home
  const router = useRouter();
  const { viewer } = useViewer();
  useEffect(() => {
    if (viewer) router.replace(routes.home);
  }, [viewer, router]);

  // «Создать аккаунт» links open the card on sign-up (config/routes → registerHref: /login#register).
  // Read after mount: the page is static, the hash only exists in the browser
  useEffect(() => {
    const sync = () => {
      if (window.location.hash === "#register") setMode("register");
    };
    sync();
    // Also when only the hash changes on this page (no remount then)
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  useEffect(() => {
    if (!focusAfterSwitch.current) return;
    focusAfterSwitch.current = false;
    (mode === "register" ? nameRef : emailRef).current?.focus({ preventScroll: true });
  }, [mode]);

  const onCaps = (e: React.KeyboardEvent<HTMLInputElement>) => setCapsLock(e.getModifierState("CapsLock"));

  /** Asks for a password reset link; the answer is the same whether the account exists or not. */
  const requestReset = async () => {
    if (!email.trim()) {
      setNotice("need-email");
      emailRef.current?.focus({ preventScroll: true });
      return;
    }
    setPending(true);
    setNotice(null);
    setError(null);
    await authClient.requestPasswordReset({ email: email.trim(), redirectTo: routes.resetPassword });
    setPending(false);
    setSent({ kind: "reset", email: email.trim() });
  };

  if (sent) {
    return (
      <SentCard
        sent={sent}
        onBack={() => {
          setSent(null);
          setPassword("");
          setMode("login");
        }}
      />
    );
  }

  return (
    <AuthCard title={text.title} lead={text.lead} titleKey={mode}>
      {/* method="post": a submit before the page has hydrated must never put the password into the
          URL (a GET form would leave ?password=… in history and server logs) */}
      <form
        method="post"
        className="mt-8"
        aria-label={isRegister ? "Регистрация" : "Вход"}
        onSubmit={async (e) => {
          e.preventDefault();
          if (pending) return;
          const data = new FormData(e.currentTarget);
          const address = String(data.get("email") ?? "").trim();
          setPending(true);
          setError(null);
          setNotice(null);
          const { data: result, error: failed } = isRegister
            ? await authClient.signUp.email({
                name: String(data.get("name") ?? "").trim(),
                email: address,
                password,
                // Where the link in the letter lands
                callbackURL: routes.verifyEmail,
              })
            : await authClient.signIn.email({ email: address, password, rememberMe: true });

          if (failed) {
            setPending(false);
            // The address was never confirmed: offer the letter again instead of an error
            if (failed.code === "EMAIL_NOT_VERIFIED") {
              await authClient.sendVerificationEmail({ email: address, callbackURL: routes.verifyEmail });
              setSent({ kind: "verify", email: address });
              return;
            }
            setError(errorText(failed));
            return;
          }
          // A fresh account with no session: the server is waiting for the address to be confirmed
          if (isRegister && result && !("token" in result && result.token)) {
            setPending(false);
            setSent({ kind: "verify", email: address });
            return;
          }
          // A full reload: the header, the caches and "/" (now the account's home) start fresh
          window.location.assign(routes.home);
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

        <Field
          ref={emailRef}
          id={field("email")}
          label="Email"
          icon={Mail}
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          maxLength={120}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

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
          <PasswordMeter password={password} id={field("strength")} className="pt-3" />
        </Collapse>

        {/* Sign-in: password reset */}
        <Collapse open={!isRegister}>
          <div className="flex justify-end pt-2.5">
            <button type="button" onClick={requestReset} disabled={pending} className="rounded-md text-xs text-accent-soft transition hover:text-fg disabled:opacity-60">
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

        {/* Errors right above the button; aria-live, so screen readers hear them */}
        <div aria-live="assertive">
          {error && (
            <p className="mt-5 flex animate-fade-up items-start gap-2 rounded-2xl border border-rose/35 bg-rose/10 px-4 py-3 text-[13px] leading-relaxed text-fg/90">
              <TriangleAlert size={16} className="mt-0.5 shrink-0 text-rose" aria-hidden />
              {error}
            </p>
          )}
        </div>

        <button type="submit" disabled={pending} aria-busy={pending} className="group/submit btn btn-primary btn-md mt-6 h-12 w-full">
          {pending ? "Секунду…" : text.submit}
          <ArrowRight size={17} className="transition-transform duration-300 group-hover/submit:translate-x-0.5" />
        </button>
      </form>

      <div className="my-6 flex items-center gap-3 font-mono text-[10px] tracking-[0.18em] text-dim uppercase" aria-hidden>
        <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" /> или <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
      </div>

      {/* Providers: icons only, the name is in the label and the tooltip */}
      <div className="grid grid-cols-2 gap-3">
        <ProviderButton
          label="Войти через Telegram"
          onClick={async () => {
            setNotice(null);
            setError(null);
            // Leaves for Telegram and comes back to "/"; an error means the keys aren't set
            const { error: failed } = await authClient.signIn.social({ provider: "telegram", callbackURL: routes.home });
            if (failed) setNotice("telegram");
          }}
        >
          <span className="inline-flex size-7 items-center justify-center rounded-full bg-[linear-gradient(180deg,#3fb6ec,#1d93d2)] shadow-[0_4px_14px_-4px_rgb(42_171_238/0.8)]">
            <TelegramIcon size={15} className="-ml-0.5 text-white" />
          </span>
        </ProviderButton>
        <ProviderButton
          label="Войти через Google"
          onClick={async () => {
            setNotice(null);
            setError(null);
            const { error: failed } = await authClient.signIn.social({ provider: "google", callbackURL: routes.home });
            if (failed) setNotice("google");
          }}
        >
          <GoogleIcon size={24} />
        </ProviderButton>
      </div>

      <p className="mt-7 text-center text-sm text-muted">
        {text.switchHint}{" "}
        <button type="button" onClick={switchMode} className="rounded-md font-semibold text-accent-soft underline-offset-4 transition hover:text-fg hover:underline">
          {text.switchAction}
        </button>
      </p>

      {/* aria-live, so screen readers hear the note */}
      <div aria-live="polite">
        {notice && (
          <p className="mt-6 flex animate-fade-up gap-3 rounded-2xl border border-accent/25 bg-accent/10 p-4 text-left text-[13px] leading-relaxed text-muted">
            <Info size={18} className="mt-0.5 shrink-0 text-accent-soft" aria-hidden />
            <span>
              {notice === "telegram" && "Вход через Telegram пока не подключён. Войди по email — займёт минуту."}
              {notice === "google" && "Вход через Google пока не подключён. Войди по email — займёт минуту."}
              {notice === "need-email" && "Впиши email в поле выше и нажми «Забыли пароль?» ещё раз — пришлём ссылку на смену пароля."}
            </span>
          </p>
        )}
      </div>
    </AuthCard>
  );
}

/** «Проверь почту»: the form is done, the next step is in the letter. */
function SentCard({ sent, onBack }: { sent: Sent; onBack: () => void }) {
  const [again, setAgain] = useState(false);
  const [pending, setPending] = useState(false);
  const verify = sent.kind === "verify";

  const resend = async () => {
    setPending(true);
    if (verify) await authClient.sendVerificationEmail({ email: sent.email, callbackURL: routes.verifyEmail });
    else await authClient.requestPasswordReset({ email: sent.email, redirectTo: routes.resetPassword });
    setPending(false);
    setAgain(true);
  };

  return (
    <AuthCard
      title={verify ? "Остался один шаг" : "Письмо отправлено"}
      lead={
        <>
          {verify ? "Перейди по ссылке из письма — и профиль откроется." : "Если такой профиль есть, в письме будет ссылка на смену пароля."} Письмо ушло на{" "}
          <span className="text-fg">{sent.email}</span>.
        </>
      }
    >
      <div className="mt-7 flex flex-col items-center gap-5">
        <span aria-hidden className="relative inline-flex">
          <span className="absolute -inset-4 rounded-full bg-accent-strong/20 blur-xl" />
          <MailCheck size={40} className="relative text-accent-soft" />
        </span>
        <p className="text-center text-[13px] leading-relaxed text-dim">
          Ссылка действует час. Письма нет? Проверь «Спам» и «Рассылки» — иногда оно приходит туда.
        </p>

        <div aria-live="polite" className="w-full">
          {again && (
            <p className="flex animate-fade-up items-center justify-center gap-2 rounded-2xl border border-teal/30 bg-teal/10 px-4 py-3 text-[13px] text-fg/90">
              <Check size={15} className="shrink-0 text-teal" aria-hidden /> Отправили ещё раз
            </p>
          )}
        </div>

        <div className="flex w-full flex-col gap-2.5">
          <button type="button" onClick={resend} disabled={pending || again} className="btn btn-glass btn-md h-12 w-full">
            {pending ? "Отправляем…" : "Отправить письмо снова"}
          </button>
          <button type="button" onClick={onBack} className="rounded-md py-2 text-sm text-accent-soft transition hover:text-fg">
            Вернуться к входу
          </button>
        </div>

        <p className="text-center text-[13px] leading-relaxed text-dim">
          Что-то не так? Напиши{" "}
          <a href={site.telegram.personal.url} target="_blank" rel="noopener noreferrer" className="text-accent-soft underline-offset-2 hover:underline">
            IDELUXE в Telegram
          </a>
          .
        </p>
      </div>
    </AuthCard>
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
export function Field({ id, label, icon: Icon, action, className, ref, ...input }: FieldProps) {
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
      className="group/provider inline-flex h-13 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] shadow-[inset_0_1px_0_rgb(255_255_255/0.08)] transition duration-300 hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.08] hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.12),0_12px_28px_-14px_rgb(0_0_0/0.9)] active:translate-y-0 active:scale-[0.98]"
    >
      <span className="transition-transform duration-300 group-hover/provider:scale-110">{children}</span>
    </button>
  );
}
