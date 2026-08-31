import { describe, expect, it } from "vitest";
import { VIR_HUNGARIAN_GUIDES } from "./components/VirHungarianPageGuide";

const expectedPages = [
  "cockpit", "actions", "p0", "p1", "p2", "p3", "revenue-leakage", "p4", "p5", "p6",
  "p7", "p8", "p9", "p10", "p11", "p12", "p13", "p14", "p15", "p16",
] as const;
const prefixFreePages = new Set(["p3", "revenue-leakage", "p4", "p5"] as const);

describe("VIR magyar üzleti magyarázatok", () => {
  it("minden vezetői VIR Intelligence oldalhoz ad magyar címet és rövid Mire jó magyarázatot", () => {
    expect(Object.keys(VIR_HUNGARIAN_GUIDES)).toEqual(expect.arrayContaining([...expectedPages]));
    for (const page of expectedPages) {
      const guide = VIR_HUNGARIAN_GUIDES[page];
      if (prefixFreePages.has(page as "p3" | "revenue-leakage" | "p4" | "p5")) {
        expect(guide.title).not.toMatch(/^VIR/);
      } else {
        expect(guide.title).toMatch(/^VIR/);
      }
      expect(guide.purpose.length).toBeGreaterThan(80);
      expect(guide.features.length).toBeGreaterThanOrEqual(3);
    }
  });

  it("a P1-P16 oldalak magyar megnevezést kapnak", () => {
    expect(VIR_HUNGARIAN_GUIDES.p1.title).toContain("Üzleti intelligencia");
    expect(VIR_HUNGARIAN_GUIDES.p8.title).toContain("Kommunikációs");
    expect(VIR_HUNGARIAN_GUIDES.p10.title).toContain("Bevételi autopilóta");
    expect(VIR_HUNGARIAN_GUIDES.p16.title).toContain("Vezetői intelligencia");
  });
});
