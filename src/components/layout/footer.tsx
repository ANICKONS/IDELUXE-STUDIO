import Link from "next/link";
import { LogoMark, TelegramIcon } from "@/components/icons";
import { HashLink } from "@/components/layout/hash-link";
import { FOOTER_ID } from "@/components/layout/layout-ids";
import { footerContacts, footerNav, legalNav, type NavLink } from "@/config/navigation";
import { anchorHref, landingAnchors } from "@/config/routes";
import { site } from "@/config/site";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer id={FOOTER_ID} className="relative mt-24 px-3 pb-6 sm:px-4">
      <div className="glass mx-auto max-w-6xl rounded-[2rem] px-6 py-10 sm:px-10">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          <div>
            <HashLink href={anchorHref(landingAnchors.top)} className="inline-flex items-center gap-2.5">
              <LogoMark size={34} />
              <span className="font-display text-base font-semibold tracking-[0.08em]">{site.name}</span>
            </HashLink>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              Платформа монтажёра IDELUXE: разборы эффектов, пак материалов и ассистент — в одном месте.
            </p>
          </div>

          {footerNav.map((column) => (
            <FooterColumn key={column.title} title={column.title} links={column.links} />
          ))}

          <div>
            <h2 className="font-mono text-[11px] tracking-[0.18em] text-dim uppercase">Связь</h2>
            <ul className="mt-4 space-y-2.5">
              {footerContacts.map((c) => (
                <li key={c.handle}>
                  <a
                    href={c.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-fg"
                  >
                    <TelegramIcon size={15} className="text-accent" />
                    {c.handle}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-dim">По всем вопросам — в личные сообщения.</p>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-white/6 pt-6 text-xs text-dim md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {site.name}. Все права защищены.
          </p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {legalNav.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="transition hover:text-muted">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <p className="mt-4 text-[11px] leading-relaxed text-dim/80">
          Adobe, After Effects, Premiere Pro, Media Encoder — товарные знаки Adobe Inc. Vegas Pro — товарный знак MAGIX. Проект
          не аффилирован с правообладателями.
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: NavLink[] }) {
  return (
    <div>
      <h2 className="font-mono text-[11px] tracking-[0.18em] text-dim uppercase">{title}</h2>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.href}>
            <HashLink href={l.href} className="text-sm text-muted transition hover:text-fg">
              {l.label}
            </HashLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
