import { FaqList } from "@/components/ui/faq-list";
import { SectionHeading } from "@/components/ui/section-heading";
import { OpenChatButton } from "@/features/chat";
import { landingAnchors } from "@/config/routes";
import { faq } from "@/content/landing";

/** Questions about the platform and buying (FaqList: one answer open at a time, works without JavaScript). */
export function FaqSection() {
  return (
    // No section-screen here: the final CTA card follows right after the questions
    <section id={landingAnchors.faq} className="section relative px-4">
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
        <FaqList
          items={faq}
          name="faq"
          className="lg:space-y-[clamp(0.75rem,1.3svh,1.25rem)]"
          summaryClassName="lg:py-[clamp(1.25rem,2.4svh,2rem)]"
        />
      </div>
    </section>
  );
}
