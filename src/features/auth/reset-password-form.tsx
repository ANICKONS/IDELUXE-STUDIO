"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Check, Eye, EyeOff, LockKeyhole, TriangleAlert } from "lucide-react";
import { routes } from "@/config/routes";
import { AuthCard } from "@/features/auth/auth-card";
import { Field } from "@/features/auth/auth-form";
import { MIN_PASSWORD, PasswordMeter } from "@/features/auth/password-meter";
import { authClient } from "@/lib/auth-client";

/**
 * The new password, opened from the reset letter: /reset-password?token=…
 * The token is checked by the server; a missing or stale one means asking for a fresh letter.
 * Better Auth closes every other session of that account once the password changes.
 */
export function ResetPasswordForm({ token }: { token: string | null }) {
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <AuthCard title="Ссылка не подходит" lead="В ней нет метки, по которой мы узнаём запрос. Скорее всего, адрес скопировался не полностью.">
        <p className="mt-7 text-center text-[13px] leading-relaxed text-dim">Открой ссылку из письма целиком или попроси новое письмо на странице входа.</p>
        <Link href={routes.login} className="btn btn-primary btn-md mt-6 h-12 w-full">
          К странице входа <ArrowRight size={17} />
        </Link>
      </AuthCard>
    );
  }

  if (done) {
    return (
      <AuthCard title="Пароль обновлён" lead="Старый больше не работает. Входы на других устройствах мы закрыли.">
        <div className="mt-7 flex flex-col items-center gap-6">
          <span aria-hidden className="relative inline-flex">
            <span className="absolute -inset-4 rounded-full bg-teal/20 blur-xl" />
            <Check size={40} className="relative text-teal" />
          </span>
          <Link href={routes.login} className="btn btn-primary btn-md h-12 w-full">
            Войти с новым паролем <ArrowRight size={17} />
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Новый пароль" lead="Придумай пароль, которого ещё нигде не было. Остальные устройства после смены выйдут из профиля.">
      <form
        method="post"
        className="mt-8"
        aria-label="Новый пароль"
        onSubmit={async (e) => {
          e.preventDefault();
          if (pending) return;
          setPending(true);
          setError(null);
          const { error: failed } = await authClient.resetPassword({ newPassword: password, token });
          setPending(false);
          if (failed) {
            setError(
              failed.code === "INVALID_TOKEN" || failed.code === "TOKEN_EXPIRED"
                ? "Ссылка устарела или уже использована. Попроси новое письмо на странице входа."
                : "Не получилось сменить пароль. Попробуй ещё раз.",
            );
            return;
          }
          setDone(true);
        }}
      >
        <Field
          id="new-password"
          label="Новый пароль"
          icon={LockKeyhole}
          name="password"
          type={show ? "text" : "password"}
          autoComplete="new-password"
          required
          minLength={MIN_PASSWORD}
          maxLength={128}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          aria-describedby="new-password-strength"
          action={
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Скрыть пароль" : "Показать пароль"}
              aria-pressed={show}
              className="absolute top-1/2 right-2 inline-flex size-10 -translate-y-1/2 items-center justify-center rounded-xl text-dim transition hover:bg-white/5 hover:text-fg"
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          }
        />
        <PasswordMeter password={password} id="new-password-strength" className="pt-3" />

        <div aria-live="assertive">
          {error && (
            <p className="mt-5 flex animate-fade-up items-start gap-2 rounded-2xl border border-rose/35 bg-rose/10 px-4 py-3 text-[13px] leading-relaxed text-fg/90">
              <TriangleAlert size={16} className="mt-0.5 shrink-0 text-rose" aria-hidden />
              {error}
            </p>
          )}
        </div>

        <button type="submit" disabled={pending} aria-busy={pending} className="group/submit btn btn-primary btn-md mt-6 h-12 w-full">
          {pending ? "Меняем…" : "Сменить пароль"}
          <ArrowRight size={17} className="transition-transform duration-300 group-hover/submit:translate-x-0.5" />
        </button>
      </form>
    </AuthCard>
  );
}
