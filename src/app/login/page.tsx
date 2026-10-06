import type { Metadata } from "next";
import { AuthForm } from "@/features/auth";

export const metadata: Metadata = { title: "Вход", robots: { index: false } };

export default function LoginPage() {
  return (
    <section className="flex min-h-[80dvh] items-start justify-center px-4 pt-32 pb-8 sm:pt-36">
      <AuthForm />
    </section>
  );
}
