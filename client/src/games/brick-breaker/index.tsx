/**
 * Brick Breaker — a paddle, a ball, and eight rows to clear.
 *
 * This is the first game in the directory that needs *continuous* input rather than
 * discrete presses: a paddle has to move for as long as a key or a button is held.
 * That is what `ControlSpec.held` and `session.held` are for. The paddle position is
 * computed from `held.axisX()` inside the fixed-timestep tick, so holding a key and
 * holding a touch button produce exactly the same motion, and a slow frame cannot
 * make the paddle travel further than it should.
 *
 * Dragging works too — a finger or a mouse on the board moves the paddle straight to
 * that x — because on a phone that is the control everyone reaches for first. The
 * buttons stay, for anyone who does not.
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

/** World units. The board is 100 wide by 130 tall and scales to whatever fits. */
const WORLD_WIDTH = 100;
const WORLD_HEIGHT = 130;

const PADDLE_WIDTH = 20;
const PADDLE_HEIGHT = 2.6;
const PADDLE_Y = WORLD_HEIGHT - 8;
const PADDLE_SPEED = 78;

const BALL_RADIUS = 1.7;
const BASE_BALL_SPEED = 52;
const SPEED_PER_LEVEL = 5;
const MAX_BALL_SPEED = 92;
/** Ceiling on the horizontal share of the ball's velocity, so it can never stall flat. */
const MAX_BOUNCE_ANGLE = 1.05;

const BRICK_COLUMNS = 10;
const BRICK_ROWS = 6;
const BRICK_TOP = 14;
const BRICK_HEIGHT = 5;
const BRICK_GAP = 1;
const POINTS_PER_BRICK = 10;
const STARTING_LIVES = 3;

/**
 * Left and right are held, not tapped. `primary` launches the ball, and `pointer:
 * "drag"` lets a finger drag the paddle — three ways in, one paddle.
 */
const SPEC: ControlSpec = {
  actions: ["left", "right", "primary"],
  surface: "canvas",
  dpad: "horizontal",
  pointer: "drag",
  held: ["left", "right"],
};

type Brick = { alive: boolean; row: number; column: number };

type BreakerState = {
  paddleX: number;
  ballX: number;
  ballY: number;
  ballVx: number;
  ballVy: number;
  /** True before the launch: the ball rides the paddle. */
  docked: boolean;
  bricks: Brick[];
  lives: number;
  score: number;
  level: number;
  cleared: number;
  /** Seconds left on the hit flash. Decorative only. */
  flash: number;
  /** Paddle x the pointer asked for, or null when no pointer is down. */
  dragTo: number | null;
};

const makeBricks = (): Brick[] => {
  const bricks: Brick[] = [];
  for (let row = 0; row < BRICK_ROWS; row += 1) {
    for (let column = 0; column < BRICK_COLUMNS; column += 1) bricks.push({ alive: true, row, column });
  }
  return bricks;
};

const startState = (): BreakerState => ({
  paddleX: WORLD_WIDTH / 2,
  ballX: WORLD_WIDTH / 2,
  ballY: PADDLE_Y - PADDLE_HEIGHT / 2 - BALL_RADIUS,
  ballVx: 0,
  ballVy: 0,
  docked: true,
  bricks: makeBricks(),
  lives: STARTING_LIVES,
  score: 0,
  level: 1,
  cleared: 0,
  flash: 0,
  dragTo: null,
});

const brickWidth = (WORLD_WIDTH - BRICK_GAP * (BRICK_COLUMNS + 1)) / BRICK_COLUMNS;
const brickLeft = (column: number) => BRICK_GAP + column * (brickWidth + BRICK_GAP);
const brickTop = (row: number) => BRICK_TOP + row * (BRICK_HEIGHT + BRICK_GAP);

export default function BrickBreaker({ slug, title }: GameModuleProps) {
  const { t } = useTranslation();
  const palette = useGamePalette();
  const state = useRef<BreakerState>(startState());

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
      const at = (value: number) => value * scale;

      context.clearRect(0, 0, size.width, size.height);
      context.fillStyle = palette.sunken;
      context.fillRect(0, 0, size.width, size.height);

      // Rows are told apart by their outline weight as well as their shade, so the wall
      // still reads as six distinct rows in a monochrome theme.
      for (const brick of current.bricks) {
        if (!brick.alive) continue;
        const x = at(brickLeft(brick.column));
        const y = at(brickTop(brick.row));
        const w = at(brickWidth);
        const h = at(BRICK_HEIGHT);
        const strength = (BRICK_ROWS - brick.row) / BRICK_ROWS;
        context.fillStyle = withAlpha(palette.primary, 0.25 + strength * 0.5);
        context.fillRect(x, y, w, h);
        context.strokeStyle = palette.primary;
        context.lineWidth = Math.max(1, at(0.15) * (1 + strength * 2));
        context.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
      }

      const paddleLeft = at(current.paddleX - PADDLE_WIDTH / 2);
      const paddleW = at(PADDLE_WIDTH);
      const paddleH = at(PADDLE_HEIGHT);
      context.fillStyle = palette.text;
      context.fillRect(paddleLeft, at(PADDLE_Y - PADDLE_HEIGHT / 2), paddleW, paddleH);
      // Centre notch: the paddle's middle is where the ball comes off straight, and a
      // player needs to be able to see where that is.
      context.fillStyle = palette.accent;
      context.fillRect(at(current.paddleX) - Math.max(1, at(0.5)), at(PADDLE_Y - PADDLE_HEIGHT / 2), Math.max(2, at(1)), paddleH);

      if (current.flash > 0 && !reducedMotion) {
        context.strokeStyle = withAlpha(palette.accent, current.flash / 0.12);
        context.lineWidth = Math.max(1, at(0.4));
        context.beginPath();
        context.arc(at(current.ballX), at(current.ballY), at(BALL_RADIUS * 2.4), 0, Math.PI * 2);
        context.stroke();
      }

      context.fillStyle = palette.accent;
      context.beginPath();
      context.arc(at(current.ballX), at(current.ballY), at(BALL_RADIUS), 0, Math.PI * 2);
      context.fill();

      // Lives as pips, drawn as outlined circles. Countable, not a colour.
      context.strokeStyle = palette.text;
      context.lineWidth = Math.max(1, at(0.2));
      for (let index = 0; index < current.lives; index += 1) {
        context.beginPath();
        context.arc(at(4 + index * 4), at(6), at(1.4), 0, Math.PI * 2);
        context.stroke();
      }
    },
    [palette, reducedMotion],
  );

  const { canvasRef, redraw } = useGameCanvas({ aspect: WORLD_WIDTH / WORLD_HEIGHT, maxHeight: 560, draw, repaintKey: session.repaintKey });

  const launch = useCallback(() => {
    const current = state.current;
    if (!current.docked) return;
    current.docked = false;
    const speed = Math.min(MAX_BALL_SPEED, BASE_BALL_SPEED + (current.level - 1) * SPEED_PER_LEVEL);
    // Always upward, slightly to one side, so the first shot is never a vertical
    // stalemate down the middle.
    const angle = (Math.random() < 0.5 ? -1 : 1) * (0.35 + Math.random() * 0.3);
    current.ballVx = Math.sin(angle) * speed;
    current.ballVy = -Math.cos(angle) * speed;
    // Reported at the launch rather than at the first brick, so the lives readout is
    // correct from the moment the ball is live instead of a brick or two later.
    session.commit({ score: current.score, level: current.level, resources: current.lives });
  }, [session]);

  const loseLife = useCallback(() => {
    const current = state.current;
    current.lives -= 1;
    current.docked = true;
    current.ballVx = 0;
    current.ballVy = 0;
    current.ballX = current.paddleX;
    current.ballY = PADDLE_Y - PADDLE_HEIGHT / 2 - BALL_RADIUS;
    const values = { score: current.score, level: current.level, resources: current.lives };
    if (current.lives <= 0) session.end(values);
    else session.commit(values);
  }, [session]);

  useGameLoop(
    session,
    (dt) => {
      const current = state.current;
      if (current.flash > 0) current.flash = Math.max(0, current.flash - dt);

      // Held keys and touch buttons, then a pointer drag, which wins because it is the
      // more direct instruction.
      const axis = session.held.axisX();
      if (axis !== 0) current.paddleX += axis * PADDLE_SPEED * dt;
      if (current.dragTo !== null) current.paddleX = current.dragTo;
      current.paddleX = Math.min(WORLD_WIDTH - PADDLE_WIDTH / 2, Math.max(PADDLE_WIDTH / 2, current.paddleX));

      if (current.docked) {
        current.ballX = current.paddleX;
        current.ballY = PADDLE_Y - PADDLE_HEIGHT / 2 - BALL_RADIUS;
        redraw();
        return;
      }

      current.ballX += current.ballVx * dt;
      current.ballY += current.ballVy * dt;

      if (current.ballX - BALL_RADIUS <= 0) {
        current.ballX = BALL_RADIUS;
        current.ballVx = Math.abs(current.ballVx);
      } else if (current.ballX + BALL_RADIUS >= WORLD_WIDTH) {
        current.ballX = WORLD_WIDTH - BALL_RADIUS;
        current.ballVx = -Math.abs(current.ballVx);
      }
      if (current.ballY - BALL_RADIUS <= 0) {
        current.ballY = BALL_RADIUS;
        current.ballVy = Math.abs(current.ballVy);
      }

      // Paddle. Only counted while the ball is moving down, so a ball that clips the
      // paddle's side on the way up is not batted twice.
      const paddleTop = PADDLE_Y - PADDLE_HEIGHT / 2;
      if (
        current.ballVy > 0 &&
        current.ballY + BALL_RADIUS >= paddleTop &&
        current.ballY - BALL_RADIUS <= PADDLE_Y + PADDLE_HEIGHT / 2 &&
        current.ballX >= current.paddleX - PADDLE_WIDTH / 2 - BALL_RADIUS &&
        current.ballX <= current.paddleX + PADDLE_WIDTH / 2 + BALL_RADIUS
      ) {
        const offset = (current.ballX - current.paddleX) / (PADDLE_WIDTH / 2);
        const speed = Math.hypot(current.ballVx, current.ballVy);
        const angle = Math.max(-MAX_BOUNCE_ANGLE, Math.min(MAX_BOUNCE_ANGLE, offset * MAX_BOUNCE_ANGLE));
        current.ballVx = Math.sin(angle) * speed;
        current.ballVy = -Math.cos(angle) * speed;
        current.ballY = paddleTop - BALL_RADIUS;
        current.flash = 0.12;
      }

      for (const brick of current.bricks) {
        if (!brick.alive) continue;
        const left = brickLeft(brick.column);
        const top = brickTop(brick.row);
        if (
          current.ballX + BALL_RADIUS < left ||
          current.ballX - BALL_RADIUS > left + brickWidth ||
          current.ballY + BALL_RADIUS < top ||
          current.ballY - BALL_RADIUS > top + BRICK_HEIGHT
        ) {
          continue;
        }
        brick.alive = false;
        current.cleared += 1;
        current.score += POINTS_PER_BRICK * current.level;
        current.flash = 0.12;
        // Bounced off whichever face the ball was closer to, so a shot along a row does
        // not tunnel through it.
        const overlapX = Math.min(Math.abs(current.ballX - left), Math.abs(current.ballX - (left + brickWidth)));
        const overlapY = Math.min(Math.abs(current.ballY - top), Math.abs(current.ballY - (top + BRICK_HEIGHT)));
        if (overlapX < overlapY) current.ballVx = -current.ballVx;
        else current.ballVy = -current.ballVy;
        session.commit({ score: current.score, level: current.level, resources: current.lives });
        break;
      }

      if (current.bricks.every((brick) => !brick.alive)) {
        // A cleared wall is a new level, not the end of the run: the ball re-docks and
        // speeds up. Lives carry over as the reward.
        current.level += 1;
        current.bricks = makeBricks();
        current.docked = true;
        current.ballVx = 0;
        current.ballVy = 0;
        session.commit({ score: current.score, level: current.level, resources: current.lives });
      }

      if (current.ballY - BALL_RADIUS > WORLD_HEIGHT) {
        loseLife();
        return;
      }
      redraw();
    },
    { hz: 60 },
  );

  const onEvent = useCallback(
    (event: GameEvent) => {
      const current = state.current;
      if (event.kind === "action" && event.id === "primary" && !event.repeat) {
        launch();
        return;
      }
      if (event.kind === "point") {
        if (event.phase === "end" || event.phase === "cancel") {
          current.dragTo = null;
          return;
        }
        // `x` arrives as a 0–1 fraction of the surface, so the game never needs to know
        // its own pixel size.
        current.dragTo = event.x * WORLD_WIDTH;
        if (event.phase === "start") launch();
      }
    },
    [launch],
  );

  // A fresh run's `resources` is 0 because nothing has been reported yet, not because
  // the player is out of lives. Losing the last life ends the run, so a real zero can
  // only ever appear in the `over` phase — everywhere else a zero means "none lost".
  const reported = session.run.resources ?? 0;
  const lives = session.phase === "over" || reported > 0 ? reported : STARTING_LIVES;

  const readouts = useMemo(
    () => [
      { labelKey: "game.level" as const, value: session.run.level ?? 1 },
      { labelKey: "game.lives" as const, value: lives },
    ],
    [session.run.level, lives],
  );

  // Level changes only. A brick every half-second would be unusable with a screen reader.
  const announcement = (session.run.level ?? 1) > 1 ? `${t("game.level")} ${session.run.level}` : undefined;

  return (
    <GameShell session={session} spec={SPEC} title={title} readouts={readouts} announcement={announcement} onEvent={onEvent}>
      <canvas ref={canvasRef} className="game-canvas" />
    </GameShell>
  );
}
