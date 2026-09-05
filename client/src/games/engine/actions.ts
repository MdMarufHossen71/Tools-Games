/**
 * The shared input vocabulary.
 *
 * Every game in this directory reacts to `GameEvent` values and nothing else. A
 * keyboard press, a tap on an on-screen button, a swipe and a mouse drag all
 * arrive through the same callback in the same shape, which is what makes a game
 * playable on a desktop keyboard and on a phone without two parallel
 * implementations of its rules.
 *
 * Held state is deliberately *not* an event. A game that needs "is the left key
 * down right now" (a paddle, a thruster) reads it from `HeldKeys` inside its
 * fixed-timestep tick instead, because sampling on a frame boundary is the only
 * way to get smooth continuous movement from a discrete event stream.
 */
import type { TranslationKey } from "@/i18n/translations";

/** Discrete things a player can ask for. Not every game uses every one. */
export type ActionId =
  | "up"
  | "down"
  | "left"
  | "right"
  | "primary"
  | "secondary"
  | "rotateCw"
  | "rotateCcw"
  | "drop"
  | "erase";

/** Where an event came from. A few games treat a tap and a keypress differently. */
export type InputSource = "keyboard" | "pointer" | "touchControl";

export type GameEvent =
  /** A discrete action. `repeat` is true for OS key auto-repeat. */
  | { kind: "action"; id: ActionId; repeat: boolean; source: InputSource }
  /** One typed character, already normalised to a single upper-case letter or digit. */
  | { kind: "text"; value: string; source: InputSource }
  /**
   * A position on the play surface, in surface-relative fractions (0–1 on both
   * axes) so a game does not need to know the pixel size of its own canvas.
   * `alt` marks a secondary activation: right mouse button, or a long press.
   */
  | { kind: "point"; phase: "start" | "move" | "end" | "cancel"; x: number; y: number; alt: boolean; source: InputSource }
  /** A flick on the play surface, already resolved to a direction. */
  | { kind: "swipe"; id: "up" | "down" | "left" | "right"; source: InputSource };

export type GameEventHandler = (event: GameEvent) => void;

/**
 * Default key bindings, matched against both `KeyboardEvent.code` and
 * `KeyboardEvent.key`.
 *
 * `code` is used for the letter keys so W/A/S/D stay under the same fingers on a
 * layout where those letters sit elsewhere (AZERTY, Dvorak). Arrow keys and the
 * named keys are identical either way.
 *
 * Some entries collide on purpose — `ArrowUp` is both `up` and `rotateCw`, and
 * `Space` is both `primary` and `drop`. Collisions are resolved per game by
 * declaration order in `ControlSpec.actions`, so Tetris (which declares
 * `rotateCw` and no `up`) gets rotation from `ArrowUp` while Snake gets movement.
 */
export const DEFAULT_BINDINGS: Record<ActionId, string[]> = {
  up: ["ArrowUp", "KeyW"],
  down: ["ArrowDown", "KeyS"],
  left: ["ArrowLeft", "KeyA"],
  right: ["ArrowRight", "KeyD"],
  primary: ["Space", "Enter"],
  secondary: ["ShiftLeft", "ShiftRight", "KeyF"],
  rotateCw: ["ArrowUp", "KeyX"],
  rotateCcw: ["KeyZ"],
  drop: ["Space"],
  erase: ["Backspace", "Delete"],
};

/** Keys the shell itself owns, so no game can rebind them out from under a player. */
export const PAUSE_KEYS = ["Escape", "KeyP"];
export const RESTART_KEYS = ["KeyR"];

/** Label shown in the on-screen legend and used as the touch button's accessible name. */
export const ACTION_LABEL_KEYS: Record<ActionId, TranslationKey> = {
  up: "control.up",
  down: "control.down",
  left: "control.left",
  right: "control.right",
  primary: "control.primary",
  secondary: "control.secondary",
  rotateCw: "control.rotateCw",
  rotateCcw: "control.rotateCcw",
  drop: "control.drop",
  erase: "control.erase",
};

/**
 * Key caps that need translating. Everything else — `A`, `Z`, `1` — is a physical
 * label printed on the hardware and is left exactly as it is in both languages.
 */
const KEY_NAME_KEYS: Record<string, TranslationKey> = {
  Space: "key.space",
  Enter: "key.enter",
  Escape: "key.escape",
  ShiftLeft: "key.shift",
  ShiftRight: "key.shift",
  Backspace: "key.backspace",
  Delete: "key.delete",
};

/**
 * Arrows are drawn as glyphs rather than words. A glyph is the same in both
 * languages, is instantly recognisable, and fits a `<kbd>` in a way that "Up arrow"
 * or "উপরের তির" does not. The row's own label already says which direction it is.
 */
const ARROW_GLYPHS: Record<string, string> = {
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
};

/**
 * Human-readable cap for a `KeyboardEvent.code`, given a translator.
 *
 * Returns `null` for a code with no sensible short label rather than printing the
 * raw code, so the legend never shows a player the string `ShiftLeft`.
 */
export function keyCapLabel(code: string, t: (key: TranslationKey) => string): string | null {
  const arrow = ARROW_GLYPHS[code];
  if (arrow) return arrow;
  const named = KEY_NAME_KEYS[code];
  if (named) return t(named);
  if (/^Key[A-Z]$/.test(code)) return code.slice(3);
  if (/^Digit[0-9]$/.test(code)) return code.slice(5);
  return null;
}

/** Shape of the on-screen touch controls, and which keys the game listens for. */
export type ControlSpec = {
  /**
   * Actions this game consumes, in priority order. Order decides which action
   * wins a shared key, and it is also the order the touch buttons appear in.
   */
  actions: ActionId[];
  /**
   * `canvas` gives the play surface `role="application"`, so a screen reader passes
   * arrow keys through to the game instead of using them to move its own cursor.
   * `board` leaves native grid and button semantics in place, which is far more
   * useful than key forwarding when the board is real DOM. Default `board`.
   */
  surface?: "canvas" | "board";
  /** Directional cluster drawn on touch. `four` is a d-pad, the others a single row/column. */
  dpad?: "none" | "horizontal" | "vertical" | "four";
  /** Draw a 1–9 keypad with an erase key. Games that take numeric entry set this. */
  keypad?: boolean;
  /** Draw an A–Z keyboard. Word games set this; it also enables `text` events from typing. */
  letters?: boolean;
  /** Turn flicks on the play surface into `swipe` events. */
  swipe?: boolean;
  /** Emit `point` events from the play surface: `tap` for start/end only, `drag` for the full stream. */
  pointer?: "none" | "tap" | "drag";
  /**
   * Treat a press held past `LONG_PRESS_MS` as `alt: true`. Used by Minesweeper so
   * one finger can both reveal and flag.
   */
  longPress?: boolean;
  /** Actions to track as held-down state for `HeldKeys`. */
  held?: ActionId[];
};

export const LONG_PRESS_MS = 420;

/** How far a finger must travel, in surface fractions, before a press counts as a swipe. */
export const SWIPE_THRESHOLD = 0.06;

/** Live held-key state, sampled inside a game's tick rather than delivered as events. */
export type HeldKeys = {
  /** True while any key bound to `id` is down, including a held touch button. */
  has(id: ActionId): boolean;
  /** −1 (left) to 1 (right), 0 when neither or both are held. */
  axisX(): number;
  /** −1 (up) to 1 (down), matching screen coordinates rather than maths convention. */
  axisY(): number;
};

/**
 * Resolves a game's declared actions into the key list each one answers to, with
 * shared keys assigned to whichever action was declared first.
 */
export function resolveBindings(spec: ControlSpec): Array<{ id: ActionId; keys: string[] }> {
  const taken = new Set<string>();
  const resolved: Array<{ id: ActionId; keys: string[] }> = [];
  for (const id of spec.actions) {
    const keys = DEFAULT_BINDINGS[id].filter((key) => !taken.has(key));
    keys.forEach((key) => taken.add(key));
    if (keys.length > 0) resolved.push({ id, keys });
  }
  return resolved;
}
