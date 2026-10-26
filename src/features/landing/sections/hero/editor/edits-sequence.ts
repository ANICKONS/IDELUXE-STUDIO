/**
 * «Шоурил эдитов» as a sequence: the edits of content/edits.ts stand on the timeline one after
 * another, like clips. The playhead's position on it picks the edit in the feed and the time
 * inside it, so scrubbing the timeline switches the videos.
 */
import { editMedia, type Reel } from "@/config/media";
import { edits, softwareName, type Edit } from "@/content/edits";

export type FeedEdit = Edit & { start: number; end: number; src: string; poster: string };

export const feed: FeedEdit[] = (() => {
  let start = 0;
  return edits.map((edit) => {
    const item = { ...edit, start, end: start + edit.duration, ...editMedia(edit.video) };
    start = item.end;
    return item;
  });
})();

/** Length of the whole sequence, seconds. */
export const FEED_TOTAL = feed.length ? feed[feed.length - 1].end : 0;

/** Index of the edit under sequence time `t` (clamped to the first / last one). */
export function feedIndexAt(t: number) {
  for (let i = 0; i < feed.length; i++) if (t < feed[i].end) return i;
  return Math.max(0, feed.length - 1);
}

/**
 * Where card `i` stands relative to the current one in a looped feed: 0 — in the middle, ±1 — its
 * neighbours, … The feed wraps around, so after the last edit comes the first one.
 */
export function feedOffset(i: number, current: number, count = feed.length) {
  let o = (((i - current) % count) + count) % count;
  if (o > Math.floor(count / 2)) o -= count;
  return o;
}

/** The player window (features/reel) for an edit: vertical, with sound. */
export function editReel(edit: FeedEdit): Reel {
  return {
    id: `edit:${edit.id}`,
    title: edit.title,
    subtitle: `${edit.author} · ${softwareName[edit.software]}`,
    aspect: 9 / 16,
    fps: 24,
    duration: edit.duration,
    poster: edit.poster,
    renditions: [{ label: "HD", src: edit.src, minWidth: 0 }],
  };
}

/** Deterministic noise (the same on the server and in the browser). */
function hash(n: number) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** SVG path (viewBox 0 0 100 20) of an edit's audio on A1: beats with a few accents of its own. */
export function editWaveformPath(seed: number, samples = 72) {
  const top: string[] = [];
  const bottom: string[] = [];
  for (let i = 0; i <= samples; i++) {
    const beat = Math.exp(-((i % 9) / 9) * 4) * 0.5;
    let amp = 0.2 + 0.22 * hash(seed * 31 + i) + beat;
    if (hash(seed * 7 + Math.floor(i / 9)) > 0.72 && i % 9 < 2) amp += 0.25;
    amp = Math.min(0.95, amp);
    const x = ((i / samples) * 100).toFixed(2);
    top.push(`${x},${(10 - amp * 9.5).toFixed(2)}`);
    bottom.unshift(`${x},${(10 + amp * 9.5).toFixed(2)}`);
  }
  return `M${top.join(" L")} L${bottom.join(" L")} Z`;
}
