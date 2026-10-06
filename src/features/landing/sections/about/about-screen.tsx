import { BackgroundVideo } from "@/components/ui/background-video";
import { ClickHint } from "@/features/reel/click-hint";
import { ReelButton } from "@/features/reel/reel-button";
import { landingVideos, reels } from "@/config/media";
import { formatClock } from "@/lib/format";
import { ABOUT_REEL_ORIGIN } from "@/features/reel/origins";

/**
 * «о нас»: frameless floating screen. The video's edges fully dissolve into the page,
 * so the IDX interface seems to hang in the air. Click → the same video with sound in the player.
 */
export function AboutScreen() {
  const reel = reels.about;

  // pointer-events-none on the wrapper: :hover (and the hint's hover state) only kicks in over the
  // clickable area, not over the glow around the screen.
  return (
    <div className="group/hint pointer-events-none relative mx-auto w-full max-w-[560px] lg:max-w-none">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-[4%] -z-10 rounded-full bg-[radial-gradient(closest-side,rgb(64_84_255/0.5),rgb(107_91_255/0.16)_62%,transparent)] blur-2xl"
      />

      <div className="[perspective:1800px]">
        <div className="[transform:rotateY(-7deg)_rotateX(3deg)] lg:[transform:rotateY(-11deg)_rotateX(4deg)]">
          <div className="animate-reel-float">
            <div id={ABOUT_REEL_ORIGIN} className="relative aspect-[6/5]">
              <BackgroundVideo
                video={landingVideos.aboutLoop}
                className="absolute inset-0"
                mediaClassName="mask-dissolve-screen"
              />
              {/* Rides the float + tilt together with the video */}
              <ClickHint label="Смотреть со звуком" className="max-sm:scale-[0.85]" />
            </div>
          </div>
        </div>
      </div>

      <ReelButton
        reel="about"
        origin={`#${ABOUT_REEL_ORIGIN}`}
        aria-label={`Смотреть обзор IDELUXE PACK со звуком, ${formatClock(reel.duration)}`}
        className="pointer-events-auto absolute inset-[16%] cursor-pointer rounded-[2rem]"
      />
    </div>
  );
}
