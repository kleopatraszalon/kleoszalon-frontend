import React, { useState } from "react";
import { useLanguage } from "../i18n/LanguageProvider";
import {
  FONT_SCALE_OPTIONS,
  loadFontScale,
  saveFontScale,
  type FontScale,
} from "../utils/fontScale";
import "./FontScaleControl.css";

export default function FontScaleControl() {
  const { language } = useLanguage();
  const [scale, setScale] = useState<FontScale>(() => loadFontScale());
  const index = FONT_SCALE_OPTIONS.indexOf(scale);
  const isMinimum = index <= 0;
  const isMaximum = index >= FONT_SCALE_OPTIONS.length - 1;
  const hu = language !== "en";

  const choose = (next: FontScale) => setScale(saveFontScale(next));
  const decrease = () => {
    if (!isMinimum) choose(FONT_SCALE_OPTIONS[index - 1]);
  };
  const increase = () => {
    if (!isMaximum) choose(FONT_SCALE_OPTIONS[index + 1]);
  };

  return (
    <div
      className="font-scale-control"
      role="group"
      aria-label={hu ? "Betűméret" : "Text size"}
      title={hu ? "Betűméret állítása" : "Adjust text size"}
    >
      <button
        className="font-scale-button"
        type="button"
        onClick={decrease}
        disabled={isMinimum}
        aria-label={hu ? "Betűméret csökkentése" : "Decrease text size"}
      >
        A−
      </button>
      <output className="font-scale-value" aria-live="polite" aria-label={hu ? "Aktuális betűméret" : "Current text size"}>
        {scale}%
      </output>
      <button
        className="font-scale-button"
        type="button"
        onClick={increase}
        disabled={isMaximum}
        aria-label={hu ? "Betűméret növelése" : "Increase text size"}
      >
        A+
      </button>
    </div>
  );
}
