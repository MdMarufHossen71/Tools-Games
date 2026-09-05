/**
 * One hook that owns everything every game needs and no game should reimplement:
 * run phase, pausing, automatic pause when the tab is hidden, reduced-motion
 * preference, the focusable play surface, and score persistence.
 *
 * A game calls this once at the top of its component, hands the returned session
 * to `GameShell`, and is then free to think only about its own rules.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGamePersistence, type GameSave } from "@/hooks/useGamePersistence";
import type { ActionId, HeldKeys } from "./actions";

export type GamePhase =
  /** Mounted, waiting for the player to start. Nothing is moving. */
  | "ready"
  /** Advancing. The only phase in which `useGameLoop` ticks. */
  | "playing"
  /** Deliberately or automatically suspended. Resumable with state intact. */
  | "paused"
  /** Finished. Score is final and has been written to storage. */
  | "over";

/** Values a game reports as its run progresses. */
export type RunValues = {
  score: number;
  level?: number;
  /** A game-defined counter — coins, lines, words, pairs. Persisted alongside the score. */
  resources?: number;
};

export type GameSession = {
  phase: GamePhase;
  /** True only while the game should be advancing. Checked by `useGameLoop`. */
  running: boolean;
  /** True when the player paused, or the tab went to the background mid-run. */
  paused: boolean;
  /** Set when the pause came from the tab being hidden rather than from the player. */
  pausedByVisibility: boolean;
  /** Honour this for decorative effects only. Core gameplay motion must not depend on it. */
  reducedMotion: boolean;
  /**
   * Changes whenever the board needs repainting from state that the animation loop is
   * not currently advancing — a restart, a forget, a pause, a game over. Pass it to
   * `useGameCanvas` as `repaintKey`. Without it a restart leaves the last frame of the
   * finished round on screen until the player presses Start, so the board and the
   * score readouts disagree.
   */
  repaintKey: string;

  /** Live run values. Cheap to update — persistence is throttled separately. */
  run: RunValues;
  /** The stored save, including the persisted high score. */
  save: GameSave;
  /** Best score to display: the stored high score, or the current run if it is ahead. */
  best: number;
  /** True when the browser refused to store progress. */
  storageWarning: boolean;

  /** Leave `ready`/`paused`/`over` and start advancing. Does not reset state on resume. */
  start(): void;
  /** Suspend. Safe to call when already paused. */
  pause(): void;
  /** Resume from a pause. No effect from `ready` or `over`. */
  resume(): void;
  togglePause(): void;
  /** Report progress. Call as often as you like; writes to storage are batched. */
  commit(values: RunValues): void;
  /** Finish the run. Persists immediately so a close or navigation cannot lose the score. */
  end(final?: RunValues): void;
  /** Fresh run: clears run values, keeps the high score, and re-enters the start phase. */
  restart(): void;
  /** Deletes this game's save entirely, high score included. */
  forget(): void;

  /** Attach to the element that owns keyboard focus and pointer input. `GameShell` does this. */
  surfaceRef: React.RefObject<HTMLDivElement | null>;
  /** Move keyboard focus to the play surface without scrolling the page. */
  focusSurface(): void;

  /**
   * Which actions are held down right now, for a game that needs continuous input.
   * Read it inside the tick, never during render: it is backed by a ref so that a
   * paddle sampling sixty times a second does not cause sixty renders.
   */
  held: HeldKeys;
  /**
   * The backing set. `useSurfaceInput` writes to it; nothing else should. It lives on
   * the session rather than inside the input hook because the hook runs inside
   * `GameShell` while the game that samples it sits outside.
   */
  heldRef: React.MutableRefObject<Set<ActionId>>;
};

export type UseGameSessionOptions = {
  slug: string;
  /**
   * Resets game-specific state. Called by `restart()` before the phase changes, and
   * must be safe to call repeatedly — the shell's restart button and the `R` key both
   * route here, and a player may hit either twice in a row.
   */
  onRestart: () => void;
  /** Phase entered on mount and after a restart. Defaults to `ready`. */
  startPhase?: "ready" | "playing";
};

/** How often a run in progress is allowed to touch storage. */
const PERSIST_INTERVAL_MS = 1500;

const prefersReducedMotion = () => {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
};

export function useGameSession({ slug, onRestart, startPhase = "ready" }: UseGameSessionOptions): GameSession {
  // Destructured rather than kept as one object: `useGamePersistence` returns a fresh
  // literal on every render, so depending on it would rebuild every callback below on
  // every render.
  const { save, update, reset: resetSave, forget: forgetSave, storageWarning } = useGamePersistence(slug);
  const [phase, setPhase] = useState<GamePhase>(startPhase);
  const [run, setRun] = useState<RunValues>({ score: 0, level: 1, resources: 0 });
  const [pausedByVisibility, setPausedByVisibility] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(prefersReducedMotion);
  // Bumped by `restart` and `forget`. The phase alone is not enough: restarting from
  // `ready` leaves the phase unchanged while the game's own state has been replaced.
  const [generation, setGeneration] = useState(0);

  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const heldRef = useRef<Set<ActionId>>(new Set());
  const runRef = useRef(run);
  runRef.current = run;
  const lastPersist = useRef(0);
  // `onRestart` is usually an inline closure, so it is read through a ref to keep
  // `restart` stable. An unstable restart would re-run the key handler effect in the
  // shell on every render.
  const restartHandler = useRef(onRestart);
  restartHandler.current = onRestart;

  // A live preference, not a mount-time snapshot: the player can flip the OS setting
  // while a game is open and the effects should stop without a reload.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReducedMotion(query.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const persist = useCallback(
    (values: RunValues) => {
      lastPersist.current = performance.now();
      update({
        score: values.score,
        level: Math.max(1, values.level ?? 1),
        resources: Math.max(0, values.resources ?? 0),
      });
    },
    [update],
  );
  const persistRef = useRef(persist);
  persistRef.current = persist;

  const commit = useCallback((values: RunValues) => {
    setRun(values);
    runRef.current = values;
    // Snake eating at ten cells a second would otherwise mean ten `localStorage`
    // writes a second. The score on screen is React state and always current; only
    // the write is deferred, and every exit path below flushes it.
    if (performance.now() - lastPersist.current >= PERSIST_INTERVAL_MS) persistRef.current(values);
  }, []);

  const start = useCallback(() => {
    setPausedByVisibility(false);
    setPhase((current) => (current === "over" ? current : "playing"));
  }, []);

  const pause = useCallback(() => {
    setPhase((current) => (current === "playing" ? "paused" : current));
  }, []);

  const resume = useCallback(() => {
    setPausedByVisibility(false);
    setPhase((current) => (current === "paused" ? "playing" : current));
  }, []);

  const togglePause = useCallback(() => {
    setPausedByVisibility(false);
    setPhase((current) => (current === "playing" ? "paused" : current === "paused" ? "playing" : current));
  }, []);

  const end = useCallback((final?: RunValues) => {
    const values = final ?? runRef.current;
    setRun(values);
    runRef.current = values;
    setPhase("over");
    // Written straight away rather than on the throttle: a game-over is exactly the
    // moment a player closes the tab, and a lost high score there is unforgivable.
    persistRef.current(values);
  }, []);

  const restart = useCallback(() => {
    const fresh: RunValues = { score: 0, level: 1, resources: 0 };
    restartHandler.current();
    setRun(fresh);
    runRef.current = fresh;
    setPausedByVisibility(false);
    setPhase(startPhase);
    resetSave();
    setGeneration((current) => current + 1);
    lastPersist.current = performance.now();
  }, [resetSave, startPhase]);

  const forget = useCallback(() => {
    const fresh: RunValues = { score: 0, level: 1, resources: 0 };
    restartHandler.current();
    setRun(fresh);
    runRef.current = fresh;
    setPausedByVisibility(false);
    setPhase(startPhase);
    setGeneration((current) => current + 1);
    forgetSave();
  }, [forgetSave, startPhase]);

  const focusSurface = useCallback(() => {
    surfaceRef.current?.focus({ preventScroll: true });
  }, []);

  const held: HeldKeys = useMemo(
    () => ({
      has: (id) => heldRef.current.has(id),
      axisX: () => (heldRef.current.has("right") ? 1 : 0) - (heldRef.current.has("left") ? 1 : 0),
      axisY: () => (heldRef.current.has("down") ? 1 : 0) - (heldRef.current.has("up") ? 1 : 0),
    }),
    [],
  );

  // Background the tab and the game stops. Without this, a game keeps running while
  // the player is elsewhere: rAF throttles but timers do not, and coming back to a
  // dead run is worse than coming back to a paused one.
  useEffect(() => {
    const onVisibility = () => {
      if (!document.hidden) return;
      setPhase((current) => {
        if (current !== "playing") return current;
        setPausedByVisibility(true);
        return "paused";
      });
      persistRef.current(runRef.current);
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  // Flush on unmount so navigating away mid-run keeps the score. The effect body is
  // empty on purpose; only the cleanup matters.
  useEffect(
    () => () => {
      if (runRef.current.score > 0) persistRef.current(runRef.current);
    },
    [],
  );

  const best = Math.max(save.highScore, run.score);

  return useMemo(
    () => ({
      phase,
      running: phase === "playing",
      paused: phase === "paused",
      pausedByVisibility,
      reducedMotion,
      repaintKey: `${phase}:${generation}`,
      run,
      save,
      best,
      storageWarning,
      start,
      pause,
      resume,
      togglePause,
      commit,
      end,
      restart,
      forget,
      surfaceRef,
      focusSurface,
      held,
      heldRef,
    }),
    [
      phase,
      generation,
      pausedByVisibility,
      reducedMotion,
      run,
      save,
      storageWarning,
      best,
      start,
      pause,
      resume,
      togglePause,
      commit,
      end,
      restart,
      forget,
      focusSurface,
      held,
    ],
  );
}
