import fs from "fs";
import path from "path";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

test("all legacy frontend API imports converge on the canonical session-aware client", () => {
  const legacy = read("src/api.ts");
  const canonical = read("src/api/api.ts");
  expect(legacy).toMatch(/export \{ default \} from "\.\/api\/api"/);
  expect(canonical).toMatch(/const baseURL = apiOrigin \? `\$\{apiOrigin\}\/api` : "\/api"/);
  expect(canonical).toMatch(/withCredentials:\s*true/);
  expect(canonical).toContain("getSessionBearerToken");
  expect(canonical).toMatch(/Authorization\s*=\s*`Bearer/);
  expect(canonical).not.toMatch(/localStorage\.getItem\(\s*["'](?:token|kleo_token)["']/);
});

test("login uses the canonical API origin instead of the frontend origin", () => {
  const auth = read("src/auth.ts");
  expect(auth).toMatch(/import api from "\.\/api\/api"/);
  expect(auth).toMatch(/api\.post<LoginResponse>\("\/login"/);
  expect(auth).not.toMatch(/fetch\(['"]\/api\/login/);
});

test("capability checks do not duplicate the canonical /api prefix", () => {
  const capabilities = read("src/hooks/useCapabilities.ts");
  expect(capabilities).toMatch(/api\.get\("\/access-control\/me\/capabilities"\)/);
  expect(capabilities).not.toMatch(/api\.get\("\/api\/access-control\/me\/capabilities"\)/);
});

test("mobile/PWA surface uses the same API client and production endpoints", () => {
  const mobile = read("src/pages/KleopatraMobileApp.tsx");
  expect(mobile).toMatch(/import api from"\.\.\/api\/api"/);
  expect(mobile).toMatch(/\/public\/marketing\/daily-actions/);
  expect(mobile).toMatch(/api\.post\("\/login"/);
  expect(mobile).toMatch(/\/customer-portal\/dashboard/);
});

test("management dashboard uses the canonical API client instead of a hard-coded Render origin", () => {
  const home = read("src/pages/Home.tsx");
  expect(home).toMatch(/api\.get<DashboardData>\("\/dashboard"/);
  expect(home).not.toMatch(/const API_BASE=/);
  expect(home).not.toMatch(/fetch\(`\$\{API_BASE\}\/dashboard/);
});

test("admin dashboard renders only one workorder summary surface", () => {
  const roleDashboard = read("src/pages/RoleDashboardPage.tsx");
  const home = read("src/pages/Home.tsx");
  expect(home).toMatch(/<WorkOrderDashboardWidget\/>/);
  expect(roleDashboard).not.toMatch(/<Delayed ms=\{300\}><WorkOrderDashboardPanel\/>/);
  expect(roleDashboard).toMatch(/function WithWorkOrders/);
});

test("workorder dashboard does not classify cancellations and no-shows as completed", () => {
  const widget = read("src/pages/dashboard/WorkOrderDashboardWidget.tsx");
  expect(widget).toMatch(/x\?\.status==='completed'\?'completed':'cancelled'/);
  expect(widget).toMatch(/'Folyamatban'/);
  expect(widget).toMatch(/'Lemondott \/ no-show'/);
});
