import fs from "fs";
import path from "path";
import { resolveCurrentPageHu } from "./layouts/appLayoutModel";

const read = (relativePath: string) => fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

describe("P3-P5 VIR surface cleanup", () => {
  const guide = read("src/components/VirHungarianPageGuide.tsx");
  const routes = read("src/routing/adminRoutes.tsx");

  test("uses user-facing module names without VIR prefixes", () => {
    expect(resolveCurrentPageHu("/admin/vir/p3", "services")).toBe("Bevétel- és vendégmegtartási intelligencia");
    expect(resolveCurrentPageHu("/admin/vir/p4", "services")).toBe("Működési intelligencia");
    expect(resolveCurrentPageHu("/admin/vir/p5", "services")).toBe("Fejlett vezetői intelligencia");
    expect(guide).toContain('p3:{title:"Bevétel- és vendégmegtartási intelligencia"');
    expect(guide).toContain('p4:{title:"Működési intelligencia"');
    expect(guide).toContain('p5:{title:"Fejlett vezetői intelligencia"');
    expect(guide).not.toContain('p3:{title:"VIR ·');
    expect(guide).not.toContain('p4:{title:"VIR ·');
    expect(guide).not.toContain('p5:{title:"VIR ·');
  });

  test("keeps one shared module header and normalized tab navigation", () => {
    expect(guide).toContain(".p4-hero .p4-hero-copy{display:none}");
    expect(guide).toContain(".vir-management-page .vir-tabs,");
    expect(guide).toContain(".vir-management-page .p4-tabs{display:flex");
  });

  test("does not rename internal VIR routes", () => {
    expect(routes).toContain('path: "/admin/vir/p3"');
    expect(routes).toContain('path: "/admin/vir/p4"');
    expect(routes).toContain('path: "/admin/vir/p5"');
    expect(routes).toContain('path: "/admin/vir/p3/revenue-leakage"');
  });
});
