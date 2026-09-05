/**
 * Everything a game module needs, in one import.
 *
 * A game in this directory should import from `@/games/engine` and nowhere else in
 * the engine, so the surface it depends on stays small enough to change safely.
 */
export {
  ACTION_LABEL_KEYS,
  DEFAULT_BINDINGS,
  LONG_PRESS_MS,
  PAUSE_KEYS,
  RESTART_KEYS,
  SWIPE_THRESHOLD,
  keyCapLabel,
  resolveBindings,
  type ActionId,
  type ControlSpec,
  type GameEvent,
  type GameEventHandler,
  type HeldKeys,
  type InputSource,
} from "./actions";

export { GameShell, type GameShellProps, type Readout } from "./GameShell";
export { useGameSession, type GamePhase, type GameSession, type RunValues } from "./useGameSession";
export { useGameInterval, useGameLoop, type GameLoopOptions } from "./useGameLoop";
export { useGameCanvas, type CanvasPainter, type CanvasSize, type UseGameCanvasOptions } from "./useGameCanvas";
export { useGamePalette, withAlpha, type GamePalette } from "./useGamePalette";
export { useBoardNavigation, type BoardNavigation } from "./useBoardNavigation";
