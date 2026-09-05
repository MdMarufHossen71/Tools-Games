/**
 * A `<canvas>` that is always the right size.
 *
 * Three things go wrong with a hand-rolled canvas and all three are handled here:
 *
 *  1. On a high-DPI screen a canvas sized only in CSS pixels is upscaled by the
 *     compositor and looks blurred. The backing store is sized by
 *     `devicePixelRatio` and the context is pre-scaled, so drawing code keeps
 *     working in CSS pixels and gets a sharp result for free.
 *  2. A canvas with a fixed pixel width clips or overflows on a narrow phone. The
 *     element is measured with a `ResizeObserver` and follows its container.
 *  3. Resizing normally destroys the drawing. Game state lives in the caller's
 *     refs, not in the canvas, so a resize re-runs `draw` against the new size and
 *     the run continues untouched — including across an orientation change.
 */
import { useCallback, useEffect, useRef, useState } from "react";

export type CanvasSize = {
  /** Logical width in CSS pixels. Draw using this, not `canvas.width`. */
  width: number;
  /** Logical height in CSS pixels. */
  height: number;
  /** The ratio already applied to the context transform. Rarely needed by callers. */
  dpr: number;
};

export type CanvasPainter = (context: CanvasRenderingContext2D, size: CanvasSize) => void;

export type UseGameCanvasOptions = {
  /**
   * Width divided by height. The canvas takes the full width available and derives
   * its height, so the board keeps its proportions from a 320 px phone to a desktop.
   */
  aspect: number;
  /** Never draw taller than this many CSS pixels, so a tall board still fits a laptop. */
  maxHeight?: number;
  draw: CanvasPainter;
  /**
   * Any value that changes when the board must be repainted from state the animation
   * loop is not advancing. Pass `session.repaintKey` straight through.
   *
   * Required rather than optional on purpose. A game's `draw` usually closes over refs,
   * so its identity does not change when the game's state does; the loop hides that
   * while it is ticking and stops hiding it the moment it halts. Without this, pressing
   * Restart left the previous round's finished board on screen while every readout
   * showed zero.
   */
  repaintKey: string | number;
};

/**
 * Capped because a handful of Android devices report ratios above 4, where the
 * backing store cost outweighs any visible sharpness.
 */
const MAX_DPR = 3;

/** The parent's left plus right padding, in CSS pixels. */
function horizontalPadding(element: HTMLElement): number {
  const styles = getComputedStyle(element);
  const left = Number.parseFloat(styles.paddingLeft) || 0;
  const right = Number.parseFloat(styles.paddingRight) || 0;
  return left + right;
}

export function useGameCanvas(options: UseGameCanvasOptions) {
  const { aspect, maxHeight = 640, draw, repaintKey } = options;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sizeRef = useRef<CanvasSize>({ width: 0, height: 0, dpr: 1 });
  const [size, setSize] = useState<CanvasSize>(sizeRef.current);

  const drawRef = useRef(draw);
  drawRef.current = draw;

  /** Repaints immediately from current game state. Call at the end of a tick. */
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const current = sizeRef.current;
    if (current.width <= 0 || current.height <= 0) return;
    context.setTransform(current.dpr, 0, 0, current.dpr, 0, 0);
    drawRef.current(context, current);
  }, []);

  const measure = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    // `clientWidth` counts the parent's padding, and the board sits inside that padding,
    // so using it directly sized the backing store wider than the element ever renders.
    // CSS then squashed the result — the blur the DPR handling above exists to avoid.
    const available = parent ? parent.clientWidth - horizontalPadding(parent) : canvas.clientWidth;
    if (available <= 0) return;

    // `maxHeight` alone would silently break the aspect ratio on a wide screen: the
    // board would keep the full width while its height stopped growing. Capping the
    // width too keeps the proportions the caller asked for at every size.
    const width = Math.floor(Math.min(available, maxHeight * aspect));
    const height = Math.round(width / aspect);
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);

    const backingWidth = Math.max(1, Math.round(width * dpr));
    const backingHeight = Math.max(1, Math.round(height * dpr));

    // Assigning `width`/`height` clears the canvas even when the value is unchanged,
    // so both are guarded. Without the guard every measure would flash the board.
    if (canvas.width !== backingWidth) canvas.width = backingWidth;
    if (canvas.height !== backingHeight) canvas.height = backingHeight;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const next: CanvasSize = { width, height, dpr };
    const changed = next.width !== sizeRef.current.width || next.height !== sizeRef.current.height || next.dpr !== sizeRef.current.dpr;
    sizeRef.current = next;
    if (changed) setSize(next);
    redraw();
  }, [aspect, maxHeight, redraw]);

  useEffect(() => {
    measure();
    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    if (!parent || typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver(() => measure());
    observer.observe(parent);
    // `ResizeObserver` fires for the layout change that follows a rotation, but not
    // reliably before the browser has settled on the new viewport, so the event is
    // also listened for directly. Both paths are idempotent.
    window.addEventListener("orientationchange", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("orientationchange", measure);
    };
  }, [measure]);

  // Any change to the painter — new score, new level, a paused overlay — repaints, and
  // so does any change to `repaintKey`, which covers the transitions a painter built on
  // refs cannot signal by itself.
  useEffect(() => {
    redraw();
  }, [draw, redraw, repaintKey]);

  return { canvasRef, size, redraw };
}
