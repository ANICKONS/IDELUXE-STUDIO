import Link from "next/link";
import { routes } from "@/config/routes";

export default function NotFound() {
  return (
    <section className="flex min-h-[80dvh] items-center justify-center px-4 pt-32">
      <div className="glass max-w-lg rounded-[2rem] p-10 text-center">
        <p className="font-mono text-xs tracking-[0.2em] text-accent-soft">MEDIA OFFLINE · 404</p>
        <h1 className="mt-5 font-display text-3xl font-semibold">Кадр не найден</h1>
        <p className="mt-3 text-muted">Похоже, этот клип удалили с таймлайна или ссылка устарела.</p>
        <Link href={routes.home} className="btn btn-primary btn-md mt-8">
          На главную
        </Link>
      </div>
    </section>
  );
}
