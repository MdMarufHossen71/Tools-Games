/**
 * Fixed-timestep game loop.
 *
 * The callback is handed a constant `dt` regardless of the display's refresh rate,
 * so a game's speed is the same on a 60 Hz laptop and a 120 Hz phone and its
 * physics cannot change behaviour when a frame runs long.
 *
 * The loop only advances while `session.running` is true, which means the pause
 * button, the `Escape` key and the tab going to the background all stop it through
 * one path. The frame is always cancelled on unmount.
 */
import { useEffect, useRef } from "react";

export type GameLoopOptions = {
  /** Logic updates per second. Default 60. */
  hz?: number;
  /**
   * Largest amount of accumulated time spent catching up in one frame, in seconds.
   * A frame that took longer than this discards the excess instead of running a
   * hundred updates at once — which is what would otherwise happen on resume after
   * a long stall and would teleport the player into a wall.
   */
  maxCatchUp?: number;
};

export function useGameLoop(
  session: { running: boolean },
  tick: (dt: number, elapsed: number) => void,
  options: GameLoopOptions = {},
) {
  const { hz = 60, maxCatchUp = 0.25 } = options;
  const tickRef = useRef(tick);
  tickRef.current = tick;

  const running = session.running;

  useEffect(() => {
    if (!running) return;

    const step = 1 / hz;
    let frame = 0;
    let last = performance.now();
    let accumulator = 0;
    let elapsed = 0;
    let cancelled = false;

    const onFrame = (now: number) => {
      if (cancelled) return;
      // Clamped before it reaches the accumulator: a tab that was throttled rather
      // than hidden can hand us a multi-second delta.
      accumulator += Math.min((now - last) / 1000, maxCatchUp);
      last = now;
      while (accumulator >= step) {
        accumulator -= step;
        elapsed += step;
        tickRef.current(step, elapsed);
      }
      frame = requestAnimationFrame(onFrame);
    };

    frame = requestAnimationFrame(onFrame);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [running, hz, maxCatchUp]);
}

/**
 * A plain interval that stops with the session and cleans up on unmount. For
 * turn-based games whose only clock is a countdown, where a 60 Hz loop is wasteful.
 */
export function useGameInterval(session: { running: boolean }, ms: number, callback: () => void) {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  const running = session.running;

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => callbackRef.current(), ms);
    return () => window.clearInterval(id);
  }, [running, ms]);
}
