/**
 * The space backdrop's frame clock (features/backdrop/space-scene.tsx), for extra layers that draw
 * on their own canvas in step with it (the seasonal snow, features/new-year). They render on exactly
 * the backdrop's frames — its pacing, pauses and still frames — so the glass panels over them
 * re-blur no more often than for the backdrop alone.
 *
 * Listeners are called synchronously inside the backdrop's animation frame. The frame object is
 * reused from frame to frame: read it right away, don't keep it.
 * A tiny external store like lib/video-hold.ts. No "use client": only client code reads it.
 */

export type BackdropFrame = {
  /** Seconds on the animation clock; step since the previous frame, s (0 on a still frame). */
  time: number;
  dt: number;
  /** Viewport size as the backdrop sees it, CSS px (ignores the phone URL bar), and its canvas DPR. */
  width: number;
  height: number;
  dpr: number;
  /** Accumulated scroll drift, px: smoothed, doesn't jump on a page switch. */
  drift: number;
  /** Shift of the nearest stars, px: camera pan plus pointer parallax. */
  panX: number;
  panY: number;
  /** The planet disc on screen: centre and radius, viewport CSS px (moves with the camera). */
  planetX: number;
  planetY: number;
  planetR: number;
  /** Rotation of the planet's surface, rad, and the camera orbit around it (camera.ts → Pose). */
  spin: number;
  yaw: number;
  pitch: number;
  /** A single static frame (reduced motion, paused): draw everything at rest. */
  still: boolean;
};

let last: BackdropFrame | null = null;
const listeners = new Set<(frame: BackdropFrame) => void>();

export function emitBackdropFrame(frame: BackdropFrame): void {
  last = frame;
  for (const listener of listeners) listener(frame);
}

/** The latest frame (null before the first): a layer mounted later can draw at once. */
export function readBackdropFrame(): BackdropFrame | null {
  return last;
}

/** Returns the unsubscribe function. */
export function subscribeBackdropFrame(listener: (frame: BackdropFrame) => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
