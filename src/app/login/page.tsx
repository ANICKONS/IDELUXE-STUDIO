import type { Metadata } from "next";
import { AuthForm } from "@/features/auth";

export const metadata: Metadata = { title: "Вход", robots: { index: false } };

/* The space camera rises over the planet on this page (features/backdrop/camera.ts → "above"):
   the card floats alone in open space, centred on the screen. */
export default function LoginPage() {
  return (
    <section className="flex min-h-dvh items-center justify-center px-4 pt-28 pb-12">
      <AuthForm />
    </section>
  );
}
