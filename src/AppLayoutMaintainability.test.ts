import fs from "fs";
import path from "path";
import { deriveRoleFlags, resolveCurrentPageHu } from "./layouts/appLayoutModel";

const source = (relativePath: string) => fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

describe("VIR AppLayout maintainability contracts", () => {
  test("AppLayout stays a composition shell", () => {
    const layout = source("src/layouts/AppLayout.tsx");
    expect(layout).toContain('import AppTopbar from "../components/AppTopbar"');
    expect(layout).toContain('import { useSessionIdleGuard } from "../hooks/useSessionIdleGuard"');
    expect(layout).toContain('import { deriveRoleFlags, resolveCurrentPageHu } from "./appLayoutModel"');
    expect(layout).not.toContain("modern-topbar");
    expect(layout).not.toContain("clearAuthenticatedSession");
    expect(layout).not.toContain("const pageNames");
  });

  test("topbar typography uses scalable tokens and 100 percent is the baseline", () => {
    const css = source("src/layouts/AppLayout.css");
    const scaleCss = source("src/styles/vir-font-scale.css");
    const scaleRuntime = source("src/utils/fontScale.ts");

    expect(css).toContain("--topbar-font-sm: .8125rem");
    expect(css).toContain("font-size:var(--topbar-font-sm)");
    expect(scaleCss).toMatch(/--vir-font-scale\s*:\s*100%/);
    expect(scaleRuntime).toMatch(/DEFAULT_FONT_SCALE\s*=\s*100/);
  });

  test("role and page metadata behavior remains intact after extraction", () => {
    expect(deriveRoleFlags("admin").isElevated).toBe(true);
    expect(deriveRoleFlags("könyvelés").isAccounting).toBe(true);
    expect(deriveRoleFlags("receptionist").isStaff).toBe(true);
    expect(resolveCurrentPageHu("/appointments/calendar", "services")).toBe("Naptár");
    expect(resolveCurrentPageHu("/masterdata/services", "categories")).toBe("Szolgáltatási kategóriák");
  });
});
