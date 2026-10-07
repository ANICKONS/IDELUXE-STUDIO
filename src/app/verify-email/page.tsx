import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, MailWarning } from "lucide-react";
import { routes } from "@/config/routes";
import { AuthCard, ResendVerification } from "@/features/auth";

export const metadata: Metadata = { title: "Подтверждение email", robots: { index: false } };

/*
 * Where the link in the confirmation letter lands. Better Auth checks the token at
 * /api/auth/verify-email and only then sends the visitor here: without `error` the address is
 * confirmed and the session is already open (`autoSignInAfterVerification`), with `error` the link
 * is stale or has been used.
 */
export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;

  return (
    <section className="flex min-h-dvh items-center justify-center px-4 pt-28 pb-12">
      {error ? (
        <AuthCard title="Ссылка больше не работает" lead="Письмо живёт час, и перейти по ссылке можно один раз. Пришлём новое — впиши адрес профиля.">
          <div className="mt-7 flex justify-center">
            <span aria-hidden className="relative inline-flex">
              <span className="absolute -inset-4 rounded-full bg-amber/20 blur-xl" />
              <MailWarning size={40} className="relative text-amber" />
            </span>
          </div>
          <ResendVerification />
          <p className="mt-5 text-center text-sm">
            <Link href={routes.login} className="text-accent-soft underline-offset-4 transition hover:text-fg hover:underline">
              Вернуться к входу
            </Link>
          </p>
        </AuthCard>
      ) : (
        <AuthCard title="Email подтверждён" lead="Профиль открыт. Бесплатно уже доступны вводные туториалы, программы и часть плагинов.">
          <div className="mt-7 flex flex-col items-center gap-6">
            <span aria-hidden className="relative inline-flex">
              <span className="absolute -inset-4 rounded-full bg-teal/20 blur-xl" />
              <Check size={40} className="relative text-teal" />
            </span>
            <Link href={routes.home} className="btn btn-primary btn-md h-12 w-full">
              В мою студию <ArrowRight size={17} />
            </Link>
            <p className="text-center text-[13px] leading-relaxed text-dim">
              Полный доступ открывают PACK и подписки —{" "}
              <Link href={routes.pricing} className="text-accent-soft underline-offset-2 hover:underline">
                посмотреть тарифы
              </Link>
              .
            </p>
          </div>
        </AuthCard>
      )}
    </section>
  );
}
