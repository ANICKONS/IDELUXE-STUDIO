"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { VideoAsset } from "@/config/media";
import { useMediaQuery } from "@/lib/hooks/use-media-query";
import { readVideoHold, subscribeVideoHold } from "@/lib/video-hold";
import { cn } from "@/lib/utils";

/** Slow connections and «data saver» get the poster only. */
function isLowData() {
  const c = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  return Boolean(c?.saveData) || c?.effectiveType === "slow-2g" || c?.effectiveType === "2g";
}

/**
 * Decorative looping video for backgrounds.
 * - Sources are attached only when the block approaches the viewport (lazy).
 * - Plays only while visible, pauses off-screen and while the reel player is open.
 * - prefers-reduced-motion / data saver → static poster (no motion for those who asked the OS for it).
 * - `tone="duotone"` recolours any footage into the site palette (violet → pink).
 */
export function BackgroundVideo({
  video,
  priority = false,
  tone = "natural",
  paused = false,
  onVideo,
  className,
  mediaClassName,
  videoClassName,
  children,
}: {
  video: VideoAsset;
  /** Above the fold: start loading right away. */
  priority?: boolean;
  tone?: "natural" | "duotone";
  /** Pause this video (e.g. the editor's own play/pause button). */
  paused?: boolean;
  /** Receives the <video> element when it mounts (null when it unmounts), e.g. to sync a timeline. */
  onVideo?: (video: HTMLVideoElement | null) => void;
  /** Positioning of the whole layer (usually `absolute inset-0 -z-10`). */
  className?: string;
  /** Mask / opacity for video + overlays. */
  mediaClassName?: string;
  /** Extra classes for poster + video (object-position, scale…). */
  videoClassName?: string;
  /** Overlays (tints, gradients) rendered above the video, inside the mask. */
  children?: React.ReactNode;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const held = useSyncExternalStore(subscribeVideoHold, readVideoHold, () => false);

  const [near, setNear] = useState(false);
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const active = near && !reducedMotion && !failed;
  const duotone = tone === "duotone";

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const loadObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        loadObserver.disconnect();
        if (!isLowData()) setNear(true);
      },
      { rootMargin: "400px 0px" },
    );
    const playObserver = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.01 });
    loadObserver.observe(el);
    playObserver.observe(el);
    return () => {
      loadObserver.disconnect();
      playObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !active) return;
    if (visible && !held && !paused) {
      v.play().catch(() => {
        /* Autoplay blocked (e.g. iOS low-power mode): the poster stays visible. */
      });
    } else {
      v.pause();
    }
  }, [active, visible, held, paused]);

  const footageClass = cn("absolute inset-0 size-full object-cover", duotone && "grayscale contrast-125 brightness-90", videoClassName);

  // overflow-clip (not hidden): hidden creates a scroll container and breaks scroll-driven animations.
  return (
    <div ref={wrapRef} className={cn("pointer-events-none overflow-clip", className)}>
      <div aria-hidden className={cn("absolute inset-0 isolate", mediaClassName)}>
        {/* eslint-disable-next-line @next/next/no-img-element -- decorative poster, sized by CSS */}
        <img src={video.poster} alt="" decoding="async" fetchPriority={priority ? "high" : "auto"} className={footageClass} />
        {active && (
          <video
            ref={(el) => {
              videoRef.current = el;
              onVideo?.(el);
            }}
            muted
            loop
            playsInline
            disablePictureInPicture
            disableRemotePlayback
            preload={priority ? "auto" : "metadata"}
            poster={video.poster}
            tabIndex={-1}
            onPlaying={() => setReady(true)}
            className={cn(footageClass, "transition-opacity duration-1000", ready ? "opacity-100" : "opacity-0")}
          >
            {video.sources.map((s, i) => (
              <source
                key={s.src}
                src={s.src}
                type={s.type}
                // All sources failed → keep the poster.
                onError={i === video.sources.length - 1 ? () => setFailed(true) : undefined}
              />
            ))}
          </video>
        )}
        {duotone && (
          <>
            {/* Shadows → deep violet, highlights → lilac/pink: any footage matches the palette */}
            <div className="absolute inset-0 bg-[linear-gradient(135deg,#4b2fe0_0%,#8f80ff_55%,#e9a8ff_100%)] mix-blend-multiply" />
            <div className="absolute inset-0 bg-[#140c46] mix-blend-screen" />
          </>
        )}
        {children}
      </div>
    </div>
  );
}
