/**
 * Minesweeper — the first consumer of the engine's `longPress` input.
 *
 * Owns only its rules: first-click-safe mine placement, flood opens, chorded
 * counts, and flagging. Reveal is a tap, Enter/Space, or left click; flag is
 * a long press, right click, or Shift+Enter/F. Pointer acts on press-down
 * through surface `point` events while the keyboard acts through grid
 * navigation, so one tap can never both reveal and flag: an alt press sets a
 * short guard window that swallows the press that follows it.
 */
import { useMemo, useRef, useState } from "react";
import { GameShell, useBoardNavigation, useGameSession, type ControlSpec, type GameEvent } from "@/games/engine";
import type { GameModuleProps } from "@/games/registry";

const SPEC: ControlSpec = { actions: [], surface: "board", pointer: "tap", longPress: true };

const SIZE = 9;
const CELLS = SIZE * SIZE;
const MINES = 10;

type MineState = {
  mines: number[];
  revealed: boolean[];
  flagged: boolean[];
  started: boolean;
  moves: number;
  over: boolean;
  won: boolean;
};

/** Neighbour indices of a cell. Pure. */
export function neighbours(index: number): number[] {
  const out: number[] = [];
  const row = Math.floor(index / SIZE);
  const col = index % SIZE;
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      const c = col + dc;
      if (r >= 0 && r < SIZE && c >= 0 && c < SIZE) out.push(r * SIZE + c);
    }
  }
  return out;
}

/** Mine count around a cell. Pure. */
export function adjacentMines(mines: number[], index: number): number {
  let count = 0;
  for (const n of neighbours(index)) if (mines.includes(n)) count += 1;
  return count;
}

/**
 * Mine placement that never touches the first cell or its neighbours, so the
 * opening tap always opens room. Pure.
 */
export function placeMines(safe: number, random: () => number = Math.random): number[] {
  const forbidden = new Set([safe, ...neighbours(safe)]);
  const mines: number[] = [];
  while (mines.length < MINES) {
    const candidate = Math.floor(random() * CELLS);
    if (forbidden.has(candidate) || mines.includes(candidate)) continue;
    mines.push(candidate);
  }
  return mines;
}

/** Flood open from `index`. Returns the newly revealed cells. Pure. */
export function floodOpen(mines: number[], revealed: boolean[], index: number): boolean[] {
  const open = revealed.slice();
  const queue = [index];
  while (queue.length > 0) {
    const cell = queue.pop() as number;
    if (open[cell]) continue;
    open[cell] = true;
    if (adjacentMines(mines, cell) === 0) {
      for (const n of neighbours(cell)) if (!open[n]) queue.push(n);
    }
  }
  return open;
}

const fresh = (): MineState => ({
  mines: [],
  revealed: Array(CELLS).fill(false),
  flagged: Array(CELLS).fill(false),
  started: false,
  moves: 0,
  over: false,
  won: false,
});

export default function Minesweeper({ slug, title }: GameModuleProps) {
  const [board, setBoard] = useState<MineState>(fresh);
  // Swallows the tap that a long-press or right-click leaves behind, so one
  // finger press can never flag and then instantly reveal the same cell.
  const altGuardUntil = useRef(0);

  const session = useGameSession({
    slug,
    onRestart: () => {
      altGuardUntil.current = 0;
      setBoard(fresh());
    },
  });

  const finish = (next: MineState, score: number) => {
    setBoard({ ...next, over: true });
    session.commit({ score, level: 1, resources: 0 });
    session.end({ score, level: 1, resources: 0 });
  };

  const reveal = (index: number) => {
    if (session.phase !== "playing" || board.over || board.flagged[index] || board.revealed[index]) return;
    let mines = board.mines;
    if (!board.started) mines = placeMines(index);
    if (mines.includes(index)) {
      finish({ ...board, mines, started: true, moves: board.moves + 1, won: false }, 0);
      return;
    }
    const revealed = floodOpen(mines, board.revealed, index);
    const moves = board.moves + 1;
    const safeTotal = CELLS - MINES;
    const openCount = revealed.filter(Boolean).length;
    if (openCount >= safeTotal) {
      const score = Math.max(100, 1000 - moves * 10);
      finish({ mines, revealed, flagged: board.flagged, started: true, moves, over: false, won: true }, score);
      return;
    }
    const next = { mines, revealed, flagged: board.flagged, started: true, moves, over: false, won: false };
    setBoard(next);
    session.commit({ score: 0, level: 1, resources: 0 });
  };

  const flag = (index: number) => {
    if (session.phase !== "playing" || board.over || board.revealed[index]) return;
    const flagged = board.flagged.slice();
    flagged[index] = !flagged[index];
    setBoard({ ...board, flagged });
  };

  const nav = useBoardNavigation({ rows: SIZE, cols: SIZE, onActivate: reveal, onAltActivate: flag });

  const onEvent = (event: GameEvent) => {
    // Pointer only — the keyboard arrives through navigation, which stops
    // propagation before the surface ever sees it.
    if (event.kind !== "point" || event.source === "keyboard" || event.phase !== "start") return;
    if (session.phase !== "playing" || board.over) return;
    const col = Math.min(SIZE - 1, Math.max(0, Math.floor(event.x * SIZE)));
    const row = Math.min(SIZE - 1, Math.max(0, Math.floor(event.y * SIZE)));
    const index = row * SIZE + col;
    if (event.alt) {
      altGuardUntil.current = performance.now() + 500;
      flag(index);
      return;
    }
    if (performance.now() < altGuardUntil.current) return;
    nav.setCursor(index);
    reveal(index);
  };

  const flagCount = useMemo(() => board.flagged.filter(Boolean).length, [board.flagged]);

  const readouts = useMemo(
    () => [
      { labelKey: "game.mines" as const, value: MINES - flagCount },
      { labelKey: "game.flags" as const, value: flagCount },
    ],
    [flagCount],
  );

  const cellContent = (i: number): string => {
    if (board.over && !board.won && board.mines.includes(i) && !board.flagged[i]) return "✸";
    if (board.flagged[i]) return "⚑";
    if (!board.revealed[i]) return "";
    const count = adjacentMines(board.mines, i);
    return count === 0 ? "" : String(count);
  };

  return (
    <GameShell session={session} spec={SPEC} title={title} readouts={readouts} onEvent={onEvent}>
      <div className="game-board-dense" style={{ ["--cols" as string]: SIZE }} aria-label={title}>
        {Array.from({ length: CELLS }, (_, i) => {
          const content = cellContent(i);
          return (
            <button
              key={i}
              type="button"
              className="game-cell"
              data-played={board.revealed[i]}
              data-win={board.over && board.won && board.revealed[i]}
              aria-disabled={board.over}
              aria-label={content === "" ? `${i + 1}` : `${i + 1}, ${content}`}
              {...nav.cellProps(i)}
            >
              {content}
            </button>
          );
        })}
      </div>
    </GameShell>
  );
}
