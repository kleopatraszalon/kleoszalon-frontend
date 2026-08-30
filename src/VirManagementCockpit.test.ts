import fs from "fs";
import path from "path";
const read=(p:string)=>fs.readFileSync(path.join(process.cwd(),p),"utf8");

test("Manager Cockpit is the primary management VIR route",()=>{
  const routes=read("src/routing/adminRoutes.tsx");
  expect(routes).toContain('path: "/admin/vir", element: R(MANAGEMENT, <VirManagerCockpitPage />)');
  expect(routes).toContain('path: "/admin/vir/dashboard", element: R(MANAGEMENT, <VirDashboardPage />)');
  expect(routes).toContain('path: "/admin/vir/actions", element: R(MANAGEMENT, <VirActionCenterPage />)');
});

test("Manager Cockpit exposes business KPIs and executive action signals",()=>{
  const page=read("src/pages/VirManagerCockpitPage.tsx");
  for(const marker of ["VIR vezetői irányítópult","VIR Management Cockpit","Mai árbevétel","Időpontok","Átlagos kosár","No-show","Kritikus akciók","Lejárt / jóváhagyás","Ami ma vezetői figyelmet kér","Források terheltsége"])expect(page).toContain(marker);
  expect(page).toContain("getVirManagerCockpit");
  expect(page).toContain('/admin/vir/actions');
});

test("Unified action center supports ownership SLA workflow and evidence",()=>{
  const page=read("src/pages/VirActionCenterPage.tsx");
  for(const marker of ["Egységes VIR Akcióközpont","Új vezetői feladat","Felelős","Határidő","Bizonyíték / megjegyzés","Jóváhagyást igényel","Kritikus","Folyamatban","Blokkolt","Jóváhagyásra vár"])expect(page).toContain(marker);
  expect(page).toContain("createVirAction");
  expect(page).toContain("updateVirAction");
});

test("VIR management API stays on the authenticated shared api client",()=>{
  const api=read("src/api/virManagement.ts");
  expect(api).toContain('import api from "./api"');
  expect(api).toContain('/vir/management/cockpit');
  expect(api).toContain('/vir/management/actions');
  expect(api).not.toContain("onrender.com");
});
