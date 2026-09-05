/**
 * Keyboard navigation for a board made of real DOM cells.
 *
 * Games whose board is a grid of elements — Minesweeper, Sudoku, Memory Match,
 * Tic Tac Toe — get better accessibility from native focus and roles than from a
 * canvas, but only if the arrow keys move a focus point around the grid. This is
 * the standard roving-tabindex pattern: exactly one cell is tabbable at a time, so
 * the whole board is a single tab stop and the arrows move within it.
 *
 * A game using this must NOT declare `up`/`down`/`left`/`right` in its
 * `ControlSpec`. The arrows belong to grid navigation here, and declaring them as
 * game actions too would make one keypress both move the cursor and play a move.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type BoardNavigation = {
  /** Index of the cell that currently owns the board's single tab stop. */
  cursor: number;
  /** Move the cursor, and move focus with it when the board already has focus. */
  setCursor: (index: number) => void;
  /** Spread onto each cell element. Handles tab index, focus tracking and arrow keys. */
  cellProps: (index: number) => {
    ref: (element: HTMLElement | null) => void;
    tabIndex: number;
    onFocus: () => void;
    onKeyDown: (event: React.KeyboardEvent) => void;
  };
};

export type UseBoardNavigationOptions = {
  rows: number;
  cols: number;
  /** Wrap around at the edges. Off by default; a bounded board is easier to reason about. */
  wrap?: boolean;
  /** Enter or Space on the focused cell. */
  onActivate: (index: number) => void;
  /**
   * Secondary activation on the focused cell — the keyboard equivalent of a
   * right-click or a long press. Bound to Shift+Enter and to `F`, so Minesweeper can
   * be flagged without a mouse.
   */
  onAltActivate?: (index: number) => void;
};

export function useBoardNavigation({ rows, cols, wrap = false, onActivate, onAltActivate }: UseBoardNavigationOptions): BoardNavigation {
  const [cursor, setCursorState] = useState(0);
  const cells = useRef<Array<HTMLElement | null>>([]);
  const activateRef = useRef(onActivate);
  activateRef.current = onActivate;
  const altRef = useRef(onAltActivate);
  altRef.current = onAltActivate;

  const count = rows * cols;

  // A board that shrinks — a smaller difficulty, a new puzzle size — must not leave
  // the cursor pointing past the end, or nothing would be tabbable at all.
  useEffect(() => {
    setCursorState((current) => (current < count ? current : 0));
  }, [count]);

  const setCursor = useCallback((index: number) => {
    const clamped = Math.max(0, index);
    setCursorState(clamped);
    // Only steal focus if the board already had it. Otherwise a game that moves the
    // cursor programmatically would yank focus away from whatever the player is using.
    const board = cells.current[clamped]?.parentElement;
    const activeInBoard = board?.contains(document.activeElement) ?? false;
    if (activeInBoard) cells.current[clamped]?.focus({ preventScroll: true });
  }, []);

  const move = useCallback(
    (deltaRow: number, deltaCol: number) => {
      setCursorState((current) => {
        const row = Math.floor(current / cols);
        const col = current % cols;
        let nextRow = row + deltaRow;
        let nextCol = col + deltaCol;
        if (wrap) {
          nextRow = (nextRow + rows) % rows;
          nextCol = (nextCol + cols) % cols;
        } else {
          nextRow = Math.min(rows - 1, Math.max(0, nextRow));
          nextCol = Math.min(cols - 1, Math.max(0, nextCol));
        }
        const next = nextRow * cols + nextCol;
        cells.current[next]?.focus({ preventScroll: true });
        return next;
      });
    },
    [cols, rows, wrap],
  );

  const jump = useCallback((index: number) => {
    setCursorState(index);
    cells.current[index]?.focus({ preventScroll: true });
  }, []);

  const cellProps = useCallback(
    (index: number) => ({
      ref: (element: HTMLElement | null) => {
        cells.current[index] = element;
      },
      tabIndex: index === cursor ? 0 : -1,
      onFocus: () => setCursorState(index),
      onKeyDown: (event: React.KeyboardEvent) => {
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        switch (event.key) {
          case "ArrowUp":
            event.preventDefault();
            // Stopped here so the surface's own key handler never also sees it.
            event.stopPropagation();
            move(-1, 0);
            return;
          case "ArrowDown":
            event.preventDefault();
            event.stopPropagation();
            move(1, 0);
            return;
          case "ArrowLeft":
            event.preventDefault();
            event.stopPropagation();
            move(0, -1);
            return;
          case "ArrowRight":
            event.preventDefault();
            event.stopPropagation();
            move(0, 1);
            return;
          case "Home":
            event.preventDefault();
            event.stopPropagation();
            jump(Math.floor(index / cols) * cols);
            return;
          case "End":
            event.preventDefault();
            event.stopPropagation();
            jump(Math.floor(index / cols) * cols + cols - 1);
            return;
          case "Enter":
          case " ":
            event.preventDefault();
            event.stopPropagation();
            if (event.shiftKey && altRef.current) altRef.current(index);
            else activateRef.current(index);
            return;
          case "f":
          case "F":
            if (!altRef.current) return;
            event.preventDefault();
            event.stopPropagation();
            altRef.current(index);
            return;
          default:
            return;
        }
      },
    }),
    [cols, cursor, jump, move],
  );

  return useMemo(() => ({ cursor, setCursor, cellProps }), [cursor, setCursor, cellProps]);
}
