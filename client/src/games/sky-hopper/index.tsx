/**
 * Sky Hopper — one button, endless gaps, gravity that never lets up.
 *
 * The whole game is a single action, which makes it the clearest possible test of the
 * engine's input contract: the same `primary` action arrives from Space, from Enter,
 * from a tap on the on-screen button and from a tap anywhere on the board, and the
 * game cannot tell the difference and does not need to.
 *
 * Physics run in the fixed-timestep tick rather than per animation frame, so a slow
 * frame cannot change how high a hop goes. Everything mutable lives in refs so that a
 * mid-run rotation on a phone is a pure re-measure.
 */
import { useCallback, useMemo, useRef } from "react";
import {
  GameShell,
  useGameCanvas,
  useGameLoop,
  useGamePalette,
  useGameSession,
  withAlpha,
  type CanvasSize,
  type ControlSpec,
  type GameEvent,
} from "@/games/engine";
import { useTranslation } from "@/contexts/AppSettingsContext";
import type { GameModuleProps } from "@/games/registry";

/**
 * The world is measured in its own units, not pixels: 100 wide by 140 tall. Every
 * dimension below is in those units, and `draw` scales them to whatever the canvas
 * turned out to be. That is what keeps the game identical on a phone and a desktop
 * instead of "easier because the screen is bigger".
 */
const WORLD_WIDTH = 100;
const WORLD_HEIGHT = 140;

/**
 * Gravity is deliberately gentle. A hop rises about 16 of the world's 140 units and
 * takes 0.4 s to reach the top of its arc, which leaves a player time to see a gap
 * and react to it rather than having to memorise the pattern.
 */
const GRAVITY = 200;
const HOP_SPEED = -80;
const MAX_FALL = 120;

const HOPPER_X = 26;
const HOPPER_RADIUS = 4.4;

const GAP_HEIGHT = 40;
const GAP_MIN_MARGIN = 16;
const COLUMN_WIDTH = 12;
const COLUMN_SPACING = 52;
const BASE_SPEED = 34;
const SPEED_PER_LEVEL = 3.2;
const MAX_SPEED = 62;
const POINTS_PER_COLUMN = 1;
const COLUMNS_PER_LEVEL = 5;

/**
 * One action. A tap on the board does the same thing as the button, so `pointer: "tap"`
 * is on as well — but the button still exists, because a first-time player on a phone
 * has no way to know the board itself is tappable.
 */
const SPEC: ControlSpec = {
  actions: ["primary"],
  surface: "canvas",
  dpad: "none",
  pointer: "tap",
};

type Column = { x: number; gapTop: number; passed: boolean };

type HopperState = {
  y: number;
  velocity: number;
  columns: Column[];
  score: number;
  level: number;
  passed: number;
  /** Seconds left on the wing flourish. Decorative only. */
  flap: number;
  /** Distance travelled, in world units. Drives the ground stripes. */
  travelled: number;
};

const gapTopFor = () => GAP_MIN_MARGIN + Math.random() * (WORLD_HEIGHT - GAP_HEIGHT - GAP_MIN_MARGIN * 2);

const startState = (): HopperState => ({
  y: WORLD_HEIGHT / 2,
  velocity: 0,
  columns: [
    { x: WORLD_WIDTH + 10, gapTop: gapTopFor(), passed: false },
    { x: WORLD_WIDTH + 10 + COLUMN_SPACING, gapTop: gapTopFor(), passed: false },
    { x: WORLD_WIDTH + 10 + COLUMN_SPACING * 2, gapTop: gapTopFor(), passed: false },
  ],
  score: 0,
  level: 1,
  passed: 0,
  flap: 0,
  travelled: 0,
});

export default function SkyHopper({ slug, title }: GameModuleProps) {
  const { t } = useTranslation();
  const palette = useGamePalette();
  const state = useRef<HopperState>(startState());

  const session = useGameSession({
    slug,
    onRestart: () => {
      state.current = startState();
    },
  });

  const { reducedMotion } = session;

  const draw = useCallback(
    (context: CanvasRenderingContext2D, size: CanvasSize) => {
      const current = state.current;
      const scale = size.height / WORLD_HEIGHT;
      const worldX = (value: number) => value * scale;
      const worldY = (value: number) => value * scale;

      context.clearRect(0, 0, size.width, size.height);
      context.fillStyle = palette.sunken;
      context.fillRect(0, 0, size.width, size.height);

      // Ground stripes that scroll with the world. They are the only cue that the
      // hopper is moving forward rather than the columns moving back, and they are
      // frozen rather than removed under reduced motion so the ground still reads.
      const stripeWidth = worldX(10);
      const offset = reducedMotion ? 0 : (current.travelled * scale) % (stripeWidth * 2);
      context.fillStyle = withAlpha(palette.border, 0.5);
      for (let x = -offset; x < size.width; x += stripeWidth * 2) {
        context.fillRect(x, size.height - worldY(3), stripeWidth, worldY(3));
      }

      for (const column of current.columns) {
        const left = worldX(column.x);
        const width = worldX(COLUMN_WIDTH);
        const gapTop = worldY(column.gapTop);
        const gapBottom = worldY(column.gapTop + GAP_HEIGHT);

        // Filled body with a hard stroked edge. The edge is what makes the gap
        // unmistakable in a low-contrast theme, where two fills could read as one.
        context.fillStyle = withAlpha(palette.primary, 0.55);
        context.fillRect(left, 0, width, gapTop);
        context.fillRect(left, gapBottom, width, size.height - gapBottom);
        context.strokeStyle = palette.primary;
        context.lineWidth = Math.max(1.5, scale * 0.6);
        context.strokeRect(left + 0.5, -1, width - 1, gapTop + 1);
        context.strokeRect(left + 0.5, gapBottom, width - 1, size.height - gapBottom + 1);
      }

      const cx = worldX(HOPPER_X);
      const cy = worldY(current.y);
      const radius = worldX(HOPPER_RADIUS);

      if (current.flap > 0 && !reducedMotion) {
        context.strokeStyle = withAlpha(palette.accent, current.flap / 0.22);
        context.lineWidth = Math.max(1.5, scale * 0.5);
        context.beginPath();
        context.arc(cx, cy, radius * (1.5 + (1 - current.flap / 0.22)), 0, Math.PI * 2);
        context.stroke();
      }

      context.fillStyle = palette.accent;
      context.beginPath();
      context.arc(cx, cy, radius, 0, Math.PI * 2);
      context.fill();
      // A beak, so which way the hopper faces is a shape rather than a shade.
      context.beginPath();
      context.moveTo(cx + radius * 0.6, cy - radius * 0.35);
      context.lineTo(cx + radius * 1.8, cy);
      context.lineTo(cx + radius * 0.6, cy + radius * 0.35);
      context.closePath();
      context.fill();
      context.fillStyle = palette.ink;
      context.beginPath();
      context.arc(cx + radius * 0.3, cy - radius * 0.3, Math.max(1, radius * 0.2), 0, Math.PI * 2);
      context.fill();
    },
    [palette, reducedMotion],
  );

  const { canvasRef, redraw } = useGameCanvas({ aspect: WORLD_WIDTH / WORLD_HEIGHT, maxHeight: 560, draw, repaintKey: session.repaintKey });

  const hop = useCallback(() => {
    const current = state.current;
    current.velocity = HOP_SPEED;
    current.flap = 0.22;
  }, []);

  useGameLoop(
    session,
    (dt) => {
      const current = state.current;
      if (current.flap > 0) current.flap = Math.max(0, current.flap - dt);

      current.velocity = Math.min(MAX_FALL, current.velocity + GRAVITY * dt);
      current.y += current.velocity * dt;

      const speed = Math.min(MAX_SPEED, BASE_SPEED + (current.level - 1) * SPEED_PER_LEVEL);
      current.travelled += speed * dt;

      let ended = false;
      // The ceiling is a wall, not a bounce: a hopper that could rest against the top
      // would make the whole game trivial.
      if (current.y - HOPPER_RADIUS <= 0 || current.y + HOPPER_RADIUS >= WORLD_HEIGHT - 3) ended = true;

      for (const column of current.columns) {
        column.x -= speed * dt;

        const withinX = HOPPER_X + HOPPER_RADIUS > column.x && HOPPER_X - HOPPER_RADIUS < column.x + COLUMN_WIDTH;
        if (withinX && (current.y - HOPPER_RADIUS < column.gapTop || current.y + HOPPER_RADIUS > column.gapTop + GAP_HEIGHT)) ended = true;

        if (!column.passed && column.x + COLUMN_WIDTH < HOPPER_X - HOPPER_RADIUS) {
          column.passed = true;
          current.passed += 1;
          current.score += POINTS_PER_COLUMN;
          current.level = Math.floor(current.passed / COLUMNS_PER_LEVEL) + 1;
          session.commit({ score: current.score, level: current.level, resources: current.passed });
        }

        // Recycled rather than reallocated, so a long run does not grow the array.
        if (column.x + COLUMN_WIDTH < -4) {
          const rightmost = current.columns.reduce((max, other) => Math.max(max, other.x), 0);
          column.x = rightmost + COLUMN_SPACING;
          column.gapTop = gapTopFor();
          column.passed = false;
        }
      }

      if (ended) {
        session.end({ score: current.score, level: current.level, resources: current.passed });
        return;
      }
      redraw();
    },
    { hz: 60 },
  );

  const onEvent = useCallback(
    (event: GameEvent) => {
      if (event.kind === "action" && event.id === "primary" && !event.repeat) hop();
      // A tap anywhere on the board hops too. Only the press, never the release, so one
      // tap is one hop.
      else if (event.kind === "point" && event.phase === "start") hop();
    },
    [hop],
  );

  const readouts = useMemo(
    () => [
      { labelKey: "game.level" as const, value: session.run.level ?? 1 },
      { labelKey: "game.gaps" as const, value: session.run.resources ?? 0 },
    ],
    [session.run.level, session.run.resources],
  );

  const announcement = (session.run.level ?? 1) > 1 ? `${t("game.level")} ${session.run.level}` : undefined;

  return (
    <GameShell session={session} spec={SPEC} title={title} readouts={readouts} announcement={announcement} onEvent={onEvent}>
      <canvas ref={canvasRef} className="game-canvas" />
    </GameShell>
  );
}
