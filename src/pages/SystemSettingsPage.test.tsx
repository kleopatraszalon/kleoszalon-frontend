import fs from "fs";
import path from "path";

describe("SystemSettingsPage contract",()=>{
  const read=(file:string)=>fs.readFileSync(path.join(process.cwd(),file),"utf8");

  test("management route renders the dedicated settings center",()=>{
    const routes=read("src/routing/adminRoutes.tsx");
    const pages=read("src/routing/routePages.ts");
    expect(pages).toContain('export const SystemSettingsPage = lazy(() => import("../pages/SystemSettingsPage"))');
    expect(routes).toMatch(/path:\s*"\/settings"[^\n]*R\(MANAGEMENT,\s*<SystemSettingsPage\s*\/>\)/);
  });

  test("page is wired to the central settings API and critical controls",()=>{
    const page=read("src/pages/SystemSettingsPage.tsx");
    expect(page).toContain('/system-settings/catalog');
    expect(page).toContain('/system-settings/alerts/summary');
    expect(page).toContain('/system-settings/audit/recent');
    expect(page).toContain('apply_to_all');
    expect(page).toContain('Kasszaeltérés');
    expect(page).toContain('Szervizfigyelmeztetés');
    expect(page).toContain('Beállításmódosítási napló');
  });
});
