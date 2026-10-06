import { env } from "@/config/env";

/**
 * Landing page videos.
 *
 * Files live in /public/videos by default. To serve them from a CDN / object storage
 * (recommended once traffic grows), set NEXT_PUBLIC_MEDIA_URL=https://cdn.example.com
 * and upload the same file names to <MEDIA_URL>/videos/.
 *
 * Sources: original renders are kept (git-ignored) in /media-source; README → «Видео»
 * has the ffmpeg commands used to produce the web versions below.
 */

export type VideoSource = { src: string; type: string };
/** Muted decorative loop. Browsers take the first source they can play, so the smaller file goes first. */
export type VideoAsset = { sources: VideoSource[]; poster: string };

export const mediaUrl = (file: string) => `${env.mediaUrl}/videos/${file}`;
const url = mediaUrl;

const WEBM = 'video/webm; codecs="vp9"';
const MP4 = 'video/mp4; codecs="avc1.640028"';

function loop(name: string, order: Array<"webm" | "mp4">): VideoAsset {
  return {
    sources: order.map((ext) => ({ src: url(`${name}.${ext}`), type: ext === "webm" ? WEBM : MP4 })),
    poster: url(`${name}.jpg`),
  };
}

export const landingVideos = {
  /** «бэк»: background of the final CTA card. 16 s seamless loop, 960 px, 15 fps. */
  back: loop("back", ["webm", "mp4"]),
  /** Showreel highlights (27.3–43.3 s of the reel, 16 s loop, 960 px): editor's program monitor. */
  reelTeaser: loop("reel-teaser", ["webm", "mp4"]),
  /** «о нас»: platform walkthrough, 6:5, muted loop inside the «О нас» block. */
  aboutLoop: loop("about-loop", ["webm", "mp4"]),
} satisfies Record<string, VideoAsset>;

/* ───────────────────────── Reels: full videos with sound ───────────────────────── */

export type ReelId = "showreel" | "about";

export type Reel = {
  id: ReelId;
  title: string;
  subtitle: string;
  /** width / height */
  aspect: number;
  fps: number;
  /** Seconds, shown on buttons before metadata loads. */
  duration: number;
  poster: string;
  /** Highest quality first. The player picks by screen size and connection. */
  renditions: { label: string; src: string; minWidth: number }[];
  headphones?: boolean;
};

export const reels: Record<ReelId, Reel> = {
  showreel: {
    id: "showreel",
    title: "Шоурил IDELUXE",
    subtitle: "Монтаж · VFX · 3D · саунд-дизайн",
    aspect: 16 / 9,
    fps: 23.976,
    duration: 57,
    poster: url("showreel.jpg"),
    renditions: [
      { label: "1080p", src: url("showreel-1080.mp4"), minWidth: 1400 },
      { label: "720p", src: url("showreel-720.mp4"), minWidth: 0 },
    ],
    headphones: true,
  },
  about: {
    id: "about",
    title: "IDELUXE PACK изнутри",
    subtitle: "Бот, туториалы, пресеты, звуки и эффекты",
    aspect: 6 / 5,
    fps: 24,
    duration: 37,
    poster: url("about-full.jpg"),
    renditions: [{ label: "1080p", src: url("about-full.mp4"), minWidth: 0 }],
  },
};
