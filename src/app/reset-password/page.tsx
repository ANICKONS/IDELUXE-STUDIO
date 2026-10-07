import type { Metadata } from "next";
import { ResetPasswordForm } from "@/features/auth";

export const metadata: Metadata = { title: "Новый пароль", robots: { index: false } };

/*
 * Where the reset letter lands: Better Auth checks the token at /api/auth/reset-password/<token>
 * and redirects here with it in the query. The token is only passed to the form — the new password
 * goes straight to the server, which checks the token again.
 */
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const { token, error } = await searchParams;

  return (
    <section className="flex min-h-dvh items-center justify-center px-4 pt-28 pb-12">
      <ResetPasswordForm token={error ? null : (token ?? null)} />
    </section>
  );
}
