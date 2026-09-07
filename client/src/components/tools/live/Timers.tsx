/** Live clocks: stopwatch, countdown, alarm timer, pomodoro, world clock. */
import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "@/contexts/AppSettingsContext";
import { beep, formatClock, useNow } from "./useLive";

function Controls({ running, onToggle, onReset, paused }: { running: boolean; onToggle: () => void; onReset: () => void; paused: boolean }) {
  const { t } = useTranslation();
  return (
    <div className="bench-actions">
      <Button size="sm" onClick={onToggle}>
        {running ? <Pause className="mr-2 size-3.5" aria-hidden="true" /> : <Play className="mr-2 size-3.5" aria-hidden="true" />}
        {running ? t("game.pause") : paused ? t("game.resume") : t("game.start")}
      </Button>
      <Button variant="ghost" size="sm" onClick={onReset}>
        <RotateCcw className="mr-2 size-3.5" aria-hidden="true" />
        {t("common.reset")}
      </Button>
    </div>
  );
}

/** Beeps once when `done` flips true. Side effects belong in effects. */
function useDoneBeep(done: boolean, repeat = 1): void {
  const announced = useRef(false);
  useEffect(() => {
    if (done && !announced.current) {
      announced.current = true;
      for (let i = 0; i < repeat; i += 1) window.setTimeout(() => beep(880, 0.35), i * 500);
    }
    if (!done) announced.current = false;
  }, [done, repeat]);
}

export function Stopwatch() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const startedAt = useRef(0);
  const { t } = useTranslation();
  useNow(running, 47);
  const shown = running ? elapsed + (Date.now() - startedAt.current) / 1000 : elapsed;

  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "center" }}>
      <p className="game-quiz-question" role="timer" aria-live="off">
        {formatClock(shown)}
      </p>
      <Controls
        running={running}
        paused={elapsed > 0}
        onToggle={() => {
          if (running) {
            setElapsed(shown);
            setRunning(false);
          } else {
            startedAt.current = Date.now();
            setRunning(true);
          }
        }}
        onReset={() => {
          setRunning(false);
          setElapsed(0);
          setLaps([]);
        }}
      />
      <div className="bench-actions">
        <Button
          variant="outline"
          size="sm"
          disabled={!running}
          onClick={() => {
            setLaps((current) => [...current, shown].slice(-20));
          }}
        >
          {t("tool.live.lap")}
        </Button>
      </div>
      {laps.length > 0 && (
        <ol className="game-found-list" style={{ listStyle: "decimal" }}>
          {laps.map((lap, i) => (
            <li key={i}>
              {i + 1}. {formatClock(lap)}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function useCountdown(initialSeconds: number) {
  const [total] = useState(initialSeconds);
  const [left, setLeft] = useState(initialSeconds);
  const [running, setRunning] = useState(false);
  const deadline = useRef(0);
  useNow(running, 200);
  const shown = running ? Math.max(0, (deadline.current - Date.now()) / 1000) : left;

  const start = (seconds: number) => {
    deadline.current = Date.now() + seconds * 1000;
    setLeft(seconds);
    setRunning(true);
  };
  const toggle = () => {
    if (running) {
      setLeft(Math.max(0, (deadline.current - Date.now()) / 1000));
      setRunning(false);
    } else if (left > 0) {
      deadline.current = Date.now() + left * 1000;
      setRunning(true);
    }
  };
  const reset = () => {
    setRunning(false);
    setLeft(total);
  };
  return { shown, running, left, start, toggle, reset };
}

export function CountdownTimer() {
  const { t } = useTranslation();
  const countdown = useCountdown(300);
  const [minutes, setMinutes] = useState("5");
  const expired = !countdown.running && countdown.left <= 0;
  useDoneBeep(expired);

  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "center" }}>
      <p className="game-quiz-question" role="timer" aria-live="off">
        {formatClock(countdown.shown)}
      </p>
      <div className="bench-actions">
        <Input type="number" min="1" max="1440" value={minutes} onChange={(event) => setMinutes(event.target.value)} aria-label={t("tool.live.minutes")} style={{ maxWidth: 110 }} />
        <Button
          size="sm"
          onClick={() => {
            countdown.start(Math.min(86400, Math.max(1, Math.round(Number(minutes) * 60 || 300))));
          }}
        >
          <Play className="mr-2 size-3.5" aria-hidden="true" />
          {t("game.start")}
        </Button>
      </div>
      <Controls running={countdown.running} paused={countdown.left > 0} onToggle={countdown.toggle} onReset={countdown.reset} />
    </div>
  );
}

export function AlarmTimer() {
  const { t } = useTranslation();
  const countdown = useCountdown(60);
  const [minutes, setMinutes] = useState("1");
  const done = !countdown.running && countdown.left <= 0;
  useDoneBeep(done, 2);

  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "center" }}>
      <p className="game-quiz-question" role={done ? "alert" : "timer"} aria-live="off">
        {done ? "⏰" : formatClock(countdown.shown)}
      </p>
      <div className="bench-actions">
        <Input type="number" min="1" max="1440" value={minutes} onChange={(event) => setMinutes(event.target.value)} aria-label={t("tool.live.minutes")} style={{ maxWidth: 110 }} />
        <Button
          size="sm"
          onClick={() => {
            countdown.start(Math.min(86400, Math.max(1, Math.round(Number(minutes) * 60 || 60))));
          }}
        >
          <Play className="mr-2 size-3.5" aria-hidden="true" />
          {t("game.start")}
        </Button>
      </div>
      <Controls running={countdown.running} paused={countdown.left > 0} onToggle={countdown.toggle} onReset={countdown.reset} />
    </div>
  );
}

export function PomodoroTimer() {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<"work" | "break">("work");
  const [rounds, setRounds] = useState(0);
  const countdown = useCountdown(25 * 60);

  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "center" }}>
      <p className="game-turn">
        {phase === "work" ? t("tool.live.work") : t("game.pause")} · ×{rounds}
      </p>
      <p className="game-quiz-question" role="timer" aria-live="off">
        {formatClock(countdown.shown)}
      </p>
      <div className="bench-actions">
        <Button
          size="sm"
          onClick={() => {
            if (phase === "work") {
              setRounds((r) => r + 1);
              setPhase("break");
              countdown.start(5 * 60);
            } else {
              setPhase("work");
              countdown.start(25 * 60);
            }
            beep();
          }}
        >
          <Play className="mr-2 size-3.5" aria-hidden="true" />
          {phase === "work" ? t("game.pause") : t("tool.live.work")}
        </Button>
      </div>
      <Controls running={countdown.running} paused={countdown.left > 0} onToggle={countdown.toggle} onReset={countdown.reset} />
    </div>
  );
}

const WORLD_ZONES = ["Asia/Dhaka", "UTC", "Europe/London", "America/New_York", "Asia/Dubai", "Asia/Singapore", "Australia/Sydney", "Asia/Kolkata"];

export function WorldClock() {
  useNow(true, 1000);
  const now = new Date();
  return (
    <div className="game-choice-list">
      {WORLD_ZONES.map((zone) => {
        let time = "—";
        try {
          time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: zone }).format(now);
        } catch {
          time = "—";
        }
        return (
          <div key={zone} className="game-choice" aria-label={`${zone} ${time}`}>
            <strong>{zone.replace("_", " ")}</strong> · {time}
          </div>
        );
      })}
    </div>
  );
}
