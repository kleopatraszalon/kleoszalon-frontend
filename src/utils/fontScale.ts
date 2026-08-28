export const FONT_SCALE_STORAGE_KEY = "kleo.font.scale.v1";
export const DEFAULT_FONT_SCALE = 150;
export const FONT_SCALE_OPTIONS = [100, 125, 150, 175, 200] as const;

export type FontScale = (typeof FONT_SCALE_OPTIONS)[number];

export function normalizeFontScale(value: unknown): FontScale {
  const parsed = typeof value === "number" ? value : Number(value);
  return (FONT_SCALE_OPTIONS as readonly number[]).includes(parsed)
    ? (parsed as FontScale)
    : DEFAULT_FONT_SCALE;
}

export function applyFontScale(value: unknown): FontScale {
  const scale = normalizeFontScale(value);
  document.documentElement.style.setProperty("--vir-font-scale", `${scale}%`);
  return scale;
}

export function loadFontScale(): FontScale {
  try {
    return normalizeFontScale(localStorage.getItem(FONT_SCALE_STORAGE_KEY));
  } catch {
    return DEFAULT_FONT_SCALE;
  }
}

export function saveFontScale(value: unknown): FontScale {
  const scale = applyFontScale(value);
  try {
    localStorage.setItem(FONT_SCALE_STORAGE_KEY, String(scale));
  } catch {
    // Storage restrictions must not prevent the visual preference from applying.
  }
  return scale;
}

export function initializeFontScale(): FontScale {
  return applyFontScale(loadFontScale());
}
