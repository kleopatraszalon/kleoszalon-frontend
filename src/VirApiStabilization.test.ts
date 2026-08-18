import fs from "fs";
import path from "path";

const read = (p: string) => fs.readFileSync(path.join(process.cwd(), p), "utf8");

test("all legacy frontend API imports converge on the canonical client", () => {
  const legacy = read("src/api.ts");
  const canonical = read("src/api/api.ts");
  expect(legacy).toMatch(/export \{ default \} from "\.\/api\/api"/);
  expect(canonical).toMatch(/const baseURL = apiOrigin \? `\$\{apiOrigin\}\/api` : "\/api"/);
  expect(canonical).toMatch(/withCredentials:\s*true/);
  expect(canonical).toMatch(/delete \(config\.headers as any\)\.Authorization/);
  expect(canonical).not.toMatch(/Authorization\s*=\s*`Bearer/);
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
