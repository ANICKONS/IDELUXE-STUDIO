"use client";

import Link from "next/link";
import { useEffect } from "react";
import { routes } from "@/config/routes";

/** A page crashed while rendering: keep the site's shell and offer a retry instead of a blank screen. */
export default function PageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="flex min-h-[80dvh] items-center justify-center px-4 pt-32">
      <div className="glass arrive max-w-lg rounded-[2rem] p-10 text-center">
        <p className="font-mono text-xs tracking-[0.2em] text-accent-soft">RENDER FAILED</p>
        <h1 className="mt-5 font-display text-3xl font-semibold">Кадр не отрендерился</h1>
        <p className="mt-3 text-muted">Что-то пошло не так при загрузке страницы. Попробуй ещё раз.</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button type="button" onClick={reset} className="btn btn-primary btn-md">
            Повторить
          </button>
          <Link href={routes.home} className="btn btn-glass btn-md">
            На главную
          </Link>
        </div>
      </div>
    </section>
  );
}
