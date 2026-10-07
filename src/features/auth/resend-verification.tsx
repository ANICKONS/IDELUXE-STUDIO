"use client";

import { useState } from "react";
import { Check, Mail, Send } from "lucide-react";
import { routes } from "@/config/routes";
import { Field } from "@/features/auth/auth-form";
import { authClient } from "@/lib/auth-client";

/**
 * A fresh confirmation letter when the one from before no longer works (the link is good for an
 * hour). Asks for the address, because a stale link tells us nothing about who followed it.
 * The answer is the same whatever the address: an account's existence isn't something to leak.
 */
export function ResendVerification() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <p className="mt-7 flex animate-fade-up items-center justify-center gap-2 rounded-2xl border border-teal/30 bg-teal/10 px-4 py-3.5 text-[13px] text-fg/90">
        <Check size={15} className="shrink-0 text-teal" aria-hidden /> Отправили письмо на {email}
      </p>
    );
  }

  return (
    <form
      className="mt-7"
      aria-label="Новое письмо с подтверждением"
      onSubmit={async (e) => {
        e.preventDefault();
        if (pending) return;
        setPending(true);
        await authClient.sendVerificationEmail({ email: email.trim(), callbackURL: routes.verifyEmail });
        setPending(false);
        setSent(true);
      }}
    >
      <Field
        id="resend-email"
        label="Email профиля"
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
      <button type="submit" disabled={pending} aria-busy={pending} className="btn btn-primary btn-md mt-4 h-12 w-full">
        {pending ? "Отправляем…" : "Прислать новое письмо"} <Send size={16} />
      </button>
    </form>
  );
}
