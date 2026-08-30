import { describe, expect, it } from "vitest";
import { RECEPTION_DAILY_MENU, RECEPTION_SUPPORT_MENU } from "../components/ReceptionSidebar";
import { HR_CORE_MENU, HR_DEVELOPMENT_MENU } from "../components/HrSidebar";
import { bookingRoutes } from "./bookingRoutes";
import { hrRoutes } from "./hrRoutes";
import { inventoryRoutes } from "./inventoryRoutes";
import { HR_ROLES } from "./routeAccess";

const routePaths = new Set(
  [...bookingRoutes, ...hrRoutes, ...inventoryRoutes]
    .map((route) => route.path)
    .filter((path): path is string => Boolean(path)),
);

const exactPath = (to: string) => to.split("?")[0];

describe("role navigation integrity", () => {
  it("keeps Rebeka's reception workflow in the agreed order", () => {
    expect(RECEPTION_DAILY_MENU.map((item) => item.label)).toEqual([
      "Irányítópult",
      "Naptár",
      "Új időpont",
      "Vendégek",
      "Szolgáltatások",
      "Munkalap / elszámolás",
    ]);
  });

  it("has a concrete route behind every reception menu item", () => {
    for (const item of [...RECEPTION_DAILY_MENU, ...RECEPTION_SUPPORT_MENU]) {
      expect(routePaths.has(exactPath(item.to)), `${item.label}: ${item.to}`).toBe(true);
    }
  });

  it("has a concrete route behind every HR menu item", () => {
    for (const item of [...HR_CORE_MENU, ...HR_DEVELOPMENT_MENU]) {
      expect(routePaths.has(exactPath(item.to)), `${item.label}: ${item.to}`).toBe(true);
    }
  });

  it("allows the HR role on HR-specific guarded routes", () => {
    expect(HR_ROLES).toContain("hr");
  });
});
