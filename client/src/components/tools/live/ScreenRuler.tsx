/** Screen ruler: a measuring overlay with live pixel readout. */
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/contexts/AppSettingsContext";

export function ScreenRuler() {
  const { t } = useTranslation();
  const [measuring, setMeasuring] = useState(false);
  const [start, setStart] = useState<{ x: number; y: number } | null>(null);
  const [end, setEnd] = useState<{ x: number; y: number } | null>(null);
  const [dpr, setDpr] = useState(1);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDpr(window.devicePixelRatio || 1);
  }, []);

  useEffect(() => {
    if (!measuring) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMeasuring(false);
        setStart(null);
        setEnd(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [measuring]);

  const distance = start && end ? Math.round(Math.hypot(end.x - start.x, end.y - start.y)) : 0;

  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "center" }}>
      <p className="game-turn" role="status">
        {t("game.moves")}: {distance}px · ×{dpr} = {Math.round(distance * dpr)}px
      </p>
      <div className="bench-actions">
        <Button size="sm" onClick={() => setMeasuring((m) => !m)}>
          {measuring ? t("common.close") : t("tool.live.measure")}
        </Button>
      </div>
      {measuring && (
        <div
          ref={overlayRef}
          role="application"
          aria-label={t("tool.live.ruler")}
          onPointerDown={(event) => {
            (event.target as HTMLElement).setPointerCapture?.(event.pointerId);
            setStart({ x: event.clientX, y: event.clientY });
            setEnd({ x: event.clientX, y: event.clientY });
          }}
          onPointerMove={(event) => {
            if (start) setEnd({ x: event.clientX, y: event.clientY });
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 60,
            cursor: "crosshair",
            touchAction: "none",
            background: "repeating-linear-gradient(0deg, transparent 0 23px, rgba(50,100,255,.12) 23px 24px), repeating-linear-gradient(90deg, transparent 0 23px, rgba(50,100,255,.12) 23px 24px)",
          }}
        >
          {start && end && (
            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
              <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="var(--primary)" strokeWidth="2" />
              <circle cx={start.x} cy={start.y} r="4" fill="var(--primary)" />
              <circle cx={end.x} cy={end.y} r="4" fill="var(--primary)" />
            </svg>
          )}
        </div>
      )}
    </div>
  );
}
