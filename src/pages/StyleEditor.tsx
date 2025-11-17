// src/pages/StyleEditor.tsx
import React, { useEffect, useState } from "react";

type ThemeVarKey =
  | "--color-bg"
  | "--color-surface"
  | "--color-text"
  | "--color-gold"
  | "--color-magenta";

type ThemeState = Record<ThemeVarKey, string>;

const DEFAULT_THEME: ThemeState = {
  "--color-bg": "#f5f5f5",
  "--color-surface": "#ffffff",
  "--color-text": "#120c08",
  "--color-gold": "#b69861",
  "--color-magenta": "#ec008c",
};

const STORAGE_KEY = "kleo-theme-vars";

function applyTheme(vars: ThemeState) {
  Object.entries(vars).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });
}

const StyleEditor: React.FC = () => {
  const [theme, setTheme] = useState<ThemeState>(DEFAULT_THEME);

  // Betöltés localStorage-ból
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ThemeState;
        setTheme({ ...DEFAULT_THEME, ...parsed });
        applyTheme({ ...DEFAULT_THEME, ...parsed });
      } else {
        applyTheme(DEFAULT_THEME);
      }
    } catch {
      applyTheme(DEFAULT_THEME);
    }
  }, []);

  const handleChange = (key: ThemeVarKey, value: string) => {
    const next = { ...theme, [key]: value };
    setTheme(next);
    applyTheme(next);
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
    alert("Arculati beállítások elmentve a böngészőben.");
  };

  const handleReset = () => {
    setTheme(DEFAULT_THEME);
    applyTheme(DEFAULT_THEME);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div className="app-content">
      <div className="card">
        <h1 style={{ marginTop: 0 }}>Arculat / Stílus szerkesztő</h1>
        <p style={{ fontSize: "0.9rem", color: "#5d5a55" }}>
          Itt tudod a Kleopátra vállalatirányítási rendszer színeit az arculati
          kézikönyv szerint finomhangolni. A módosítás azonnal látszik az
          egész admin felületen, és a böngésződben elmentjük.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "1rem",
            marginTop: "1.5rem",
          }}
        >
          {(
            [
              [
                "--color-bg",
                "Háttér",
                "Oldal háttere, dashboard alap",
              ],
              [
                "--color-surface",
                "Kártyák háttere",
                "Kártyák, panelek, modalok",
              ],
              ["--color-text", "Alap szöveg", "Sötét szövegszín"],
              ["--color-gold", "Arany", "Gombok, keretek, kiemelések"],
              ["--color-magenta", "Magenta", "Brand kiemelő szín"],
            ] as [ThemeVarKey, string, string][]
          ).map(([key, label, desc]) => (
            <div
              key={key}
              style={{
                borderRadius: "12px",
                border: "1px solid rgba(182,152,97,0.6)",
                padding: "0.75rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.5rem",
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      fontWeight: 600,
                      letterSpacing: "0.14em",
                      textTransform: "uppercase",
                    }}
                  >
                    {label}
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "#5d5a55",
                    }}
                  >
                    {desc}
                  </div>
                </div>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "999px",
                    border: "1px solid #d4d4d4",
                    background: theme[key],
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <input
                  type="color"
                  value={theme[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  style={{
                    width: 40,
                    height: 32,
                    borderRadius: "6px",
                    border: "1px solid #d4d4d4",
                    padding: 0,
                    background: "transparent",
                  }}
                />
                <input
                  className="input"
                  style={{ fontFamily: "monospace", fontSize: "0.75rem" }}
                  value={theme[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "0.75rem",
            marginTop: "1.5rem",
          }}
        >
          <button type="button" className="btn-ghost" onClick={handleReset}>
            Alaphelyzet
          </button>
          <button type="button" className="btn-primary" onClick={handleSave}>
            Mentés
          </button>
        </div>
      </div>
    </div>
  );
};

export default StyleEditor;
