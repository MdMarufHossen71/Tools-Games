/** Shared bits for live tools: ticking clock, beep, and time formatting. */
import { useEffect, useState } from "react";

/** Re-renders every `ms` while `running`. Cleans up on pause/unmount. */
export function useNow(running: boolean, ms: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(Date.now()), ms);
    return () => window.clearInterval(id);
  }, [running, ms]);
  return now;
}

/** Short WebAudio beep. Created on user gesture; silent failure elsewhere. */
export function beep(frequency = 880, seconds = 0.15): void {
  try {
    const Context = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Context) return;
    const context = new Context();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = frequency;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    gain.gain.setValueAtTime(0.001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.4, context.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + seconds);
    oscillator.stop(context.currentTime + seconds + 0.05);
    window.setTimeout(() => void context.close().catch(() => undefined), (seconds + 0.2) * 1000);
  } catch {
    // Audio is decoration; a tool must never fail because of it.
  }
}

export function formatClock(totalSeconds: number): string {
  const clamped = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(clamped / 3600);
  const minutes = Math.floor((clamped % 3600) / 60);
  const seconds = clamped % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return hours > 0 ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
}
