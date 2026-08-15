import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useSettings } from "@/contexts/AppSettingsContext";
import { desktopEffectsAllowed } from "@/lib/playfulEffects";
import "@/playful-effects.css";

type Particle = { id: number; x: number; y: number; kind: "sparkle" | "bubble" };
const buddyMessages = ["Need a shortcut? Press / to search.", "A fresh tool is only a few clicks away.", "Your browser-local work stays on your device.", "Take a small break after a big task."];

export default function PlayfulEffects() {
  const { playfulEffects } = useSettings();
  const [allowed, setAllowed] = useState(desktopEffectsAllowed);
  const [cat, setCat] = useState({ x: -64, y: -64 });
  const [particles, setParticles] = useState<Particle[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const sequence = useRef(0);

  useEffect(() => {
    const hoverQuery = window.matchMedia("(hover: hover) and (pointer: fine)");
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setAllowed(desktopEffectsAllowed());
    hoverQuery.addEventListener("change", update); motionQuery.addEventListener("change", update);
    return () => { hoverQuery.removeEventListener("change", update); motionQuery.removeEventListener("change", update); };
  }, []);

  useEffect(() => {
    if (!allowed || !playfulEffects.cat) return;
    const follow = (event: PointerEvent) => setCat({ x: event.clientX + 18, y: event.clientY + 18 });
    window.addEventListener("pointermove", follow, { passive: true });
    return () => window.removeEventListener("pointermove", follow);
  }, [allowed, playfulEffects.cat]);

  useEffect(() => {
    if (!allowed || !playfulEffects.trail) return;
    const createTrail = (event: PointerEvent) => {
      const particlesForClick = Array.from({ length: 4 }, (_, index) => ({ id: ++sequence.current, x: event.clientX + ((index % 2) ? 12 : -12), y: event.clientY + (index < 2 ? -10 : 10), kind: index % 2 ? "bubble" as const : "sparkle" as const }));
      window.requestAnimationFrame(() => setParticles(current => [...current, ...particlesForClick].slice(-20)));
      window.setTimeout(() => setParticles(current => current.filter(item => !particlesForClick.some(particle => particle.id === item.id))), 850);
    };
    window.addEventListener("pointerdown", createTrail, { passive: true });
    return () => window.removeEventListener("pointerdown", createTrail);
  }, [allowed, playfulEffects.trail]);

  useEffect(() => {
    if (!allowed || !playfulEffects.buddy) { setMessage(null); return; }
    let timeout = 0;
    const schedule = () => { timeout = window.setTimeout(() => { setMessage(buddyMessages[Math.floor(Math.random() * buddyMessages.length)]); schedule(); }, 180_000 + Math.floor(Math.random() * 120_000)); };
    schedule();
    return () => window.clearTimeout(timeout);
  }, [allowed, playfulEffects.buddy]);

  if (!allowed || !Object.values(playfulEffects).some(Boolean)) return null;
  return <div className="playful-effects" aria-hidden="true">
    {playfulEffects.cat && <span className="cursor-cat" style={{ transform: `translate3d(${cat.x}px, ${cat.y}px, 0)` }}>🐈</span>}
    {particles.map(particle => <span className={`trail-particle ${particle.kind}`} key={particle.id} style={{ left: particle.x, top: particle.y }}>{particle.kind === "sparkle" ? "✦" : "●"}</span>)}
    {playfulEffects.buddy && <div className="floating-buddy" aria-hidden="false"><span className="buddy-face">🪄</span>{message && <div className="buddy-message" role="status">{message}<button type="button" onClick={() => setMessage(null)} aria-label="Dismiss message"><X size={13} /></button></div>}</div>}
  </div>;
}
