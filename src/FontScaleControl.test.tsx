import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import FontScaleControl from "./components/FontScaleControl";
import { LanguageProvider } from "./i18n/LanguageProvider";
import {
  DEFAULT_FONT_SCALE,
  FONT_SCALE_STORAGE_KEY,
  initializeFontScale,
  normalizeFontScale,
} from "./utils/fontScale";

describe("VIR header font scale control", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.style.removeProperty("--vir-font-scale");
  });

  test("defaults invalid or missing values to 100 percent", () => {
    expect(DEFAULT_FONT_SCALE).toBe(100);
    expect(normalizeFontScale(null)).toBe(DEFAULT_FONT_SCALE);
    expect(normalizeFontScale("999")).toBe(DEFAULT_FONT_SCALE);
    expect(initializeFontScale()).toBe(100);
    expect(document.documentElement.style.getPropertyValue("--vir-font-scale")).toBe("100%");
  });

  test("A plus and A minus update the global scale and persist the preference", () => {
    localStorage.setItem("kleo_language", "hu");
    initializeFontScale();
    render(
      <LanguageProvider>
        <FontScaleControl />
      </LanguageProvider>,
    );

    expect(screen.getByText("100%")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Betűméret csökkentése" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Betűméret növelése" }));
    expect(screen.getByText("125%")).toBeInTheDocument();
    expect(localStorage.getItem(FONT_SCALE_STORAGE_KEY)).toBe("125");
    expect(document.documentElement.style.getPropertyValue("--vir-font-scale")).toBe("125%");

    fireEvent.click(screen.getByRole("button", { name: "Betűméret csökkentése" }));
    expect(screen.getByText("100%")).toBeInTheDocument();
  });

  test("restores a saved font scale before the application starts", () => {
    localStorage.setItem(FONT_SCALE_STORAGE_KEY, "150");
    expect(initializeFontScale()).toBe(150);
    expect(document.documentElement.style.getPropertyValue("--vir-font-scale")).toBe("150%");
  });
});
