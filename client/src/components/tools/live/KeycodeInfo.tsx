/** Keycode info: shows the last key pressed, code and all. */
import { useEffect, useState } from "react";
import { useTranslation } from "@/contexts/AppSettingsContext";

type KeyInfo = { key: string; code: string; keyCode: number; ctrl: boolean; shift: boolean; alt: boolean; meta: boolean };

export function KeycodeInfo() {
  const { t } = useTranslation();
  const [info, setInfo] = useState<KeyInfo | null>(null);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      setInfo({ key: event.key, code: event.code, keyCode: event.keyCode, ctrl: event.ctrlKey, shift: event.shiftKey, alt: event.altKey, meta: event.metaKey });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div style={{ display: "grid", gap: 12, justifyItems: "center" }}>
      <p className="game-quiz-question" role="status">
        {info ? info.key === " " ? "Space" : info.key : "—"}
      </p>
      {info ? (
        <div className="tool-table-wrap" style={{ width: "100%", maxWidth: 420 }}>
          <table className="tool-table">
            <tbody>
              {[
                ["code", info.code],
                ["keyCode", String(info.keyCode)],
                ["Ctrl", String(info.ctrl)],
                ["Shift", String(info.shift)],
                ["Alt", String(info.alt)],
                ["Meta", String(info.meta)],
              ].map(([name, value]) => (
                <tr key={name}>
                  <td>{name}</td>
                  <td>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="game-turn">{t("tool.live.pressKey")}</p>
      )}
    </div>
  );
}
