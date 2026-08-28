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

  test("defaults invalid or missing values to 150 percent", () => {
    expect(normalizeFontScale(null)).toBe(DEFAULT_FONT_SCALE);
    expect(normalizeFontScale("999")).toBe(DEFAULT_FONT_SCALE);
    expect(initializeFontScale()).toBe(150);
    expect(document.documentElement.style.getPropertyValue("--vir-font-scale")).toBe("150%");
  });

  test("A plus and A minus update the global scale and persist the preference", () => {
    localStorage.setItem("kleo_language", "hu");
    initializeFontScale();
    render(
      <LanguageProvider>
        <FontScaleControl />
      </LanguageProvider>,
    );

    expect(screen.getByText("150%")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Betűméret növelése" }));
    expect(screen.getByText("175%")).toBeInTheDocument();
    expect(localStorage.getItem(FONT_SCALE_STORAGE_KEY)).toBe("175");
    expect(document.documentElement.style.getPropertyValue("--vir-font-scale")).toBe("175%");

    fireEvent.click(screen.getByRole("button", { name: "Betűméret csökkentése" }));
    expect(screen.getByText("150%")).toBeInTheDocument();
  });

  test("restores a saved font scale before the application starts", () => {
    localStorage.setItem(FONT_SCALE_STORAGE_KEY, "125");
    expect(initializeFontScale()).toBe(125);
    expect(document.documentElement.style.getPropertyValue("--vir-font-scale")).toBe("125%");
  });
});
