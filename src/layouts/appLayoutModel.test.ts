import { describe, expect, it } from "vitest";
import { resolveBackFallback } from "./appLayoutModel";

describe("global VIR back navigation", () => {
  it("returns to the dashboard from module landing pages", () => {
    expect(resolveBackFallback("/appointments/calendar")).toBe("/");
    expect(resolveBackFallback("/workorders")).toBe("/");
    expect(resolveBackFallback("/finance")).toBe("/");
    expect(resolveBackFallback("/warehouse")).toBe("/");
    expect(resolveBackFallback("/employees")).toBe("/");
  });

  it("returns deep pages to their sensible module parent", () => {
    expect(resolveBackFallback("/appointments/new")).toBe("/appointments/calendar");
    expect(resolveBackFallback("/workorders/123")).toBe("/workorders");
    expect(resolveBackFallback("/finance/cashier")).toBe("/finance");
    expect(resolveBackFallback("/warehouse/lots")).toBe("/warehouse");
    expect(resolveBackFallback("/hr/positions")).toBe("/employees");
    expect(resolveBackFallback("/settings/roles")).toBe("/settings");
  });

  it("uses the dashboard as the safe fallback for uncategorized internal pages", () => {
    expect(resolveBackFallback("/some-future-module/page")).toBe("/");
  });
});
