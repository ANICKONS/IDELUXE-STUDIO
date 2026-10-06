import { ChevronDown } from "lucide-react";
import { SectionHeading } from "@/components/ui/section-heading";
import { OpenChatButton } from "@/features/chat";
import { Decor3D } from "@/features/decor";
import { sectionDecor } from "@/features/landing/decor";
import { landingAnchors } from "@/config/routes";
import { faq } from "@/content/landing";

/** Native <details> accordion (one answer open at a time): accessible and works without JavaScript. */
export function FaqSection() {
  return (
    // No section-screen here: the final CTA card follows right after the questions
    <section id={landingAnchors.faq} className="section relative px-4">
      <Decor3D items={sectionDecor.faq} className="-z-10" />
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 lg:grid-cols-[minmax(0,4fr)_minmax(0,7fr)]">
        <div>
          <SectionHeading
            comp="COMP 05"
            timecode="00:01:36:00"
            ghost="FAQ"
            title="Частые вопросы"
            description="Не нашёл ответ? Спроси ИИ-ассистента или напиши IDELUXE в Telegram."
          />
          <OpenChatButton className="btn btn-glass btn-md mt-8">Спросить ассистента</OpenChatButton>
        </div>

        {/* lg: questions get roomier on tall screens (spacing follows the screen height), so the
            list spreads over the category's screen instead of leaving it half empty */}
        <ul className="space-y-3 lg:space-y-[clamp(0.75rem,1.3svh,1.25rem)]">
          {faq.map((item, i) => (
            <li key={item.q}>
              {/* Same `name` → exclusive accordion: opening one answer closes the others (native, no JS).
                  `reveal` sits on the glass itself: on a parent its opacity/filter would cut the glass
                  off from the page behind it (no blur). */}
              <details name="faq" className="disclosure glass reveal group rounded-3xl" open={i === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-3xl px-6 py-5 text-left font-semibold text-fg lg:py-[clamp(1.25rem,2.4svh,2rem)] [&::-webkit-details-marker]:hidden">
                  <span>{item.q}</span>
                  <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-open:rotate-180">
                    <ChevronDown size={16} />
                  </span>
                </summary>
                {/* disclosure-body: slides open and closed (components.css) */}
                <div className="disclosure-body">
                  <p className="px-6 pb-6 leading-relaxed text-muted">{item.a}</p>
                </div>
              </details>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
