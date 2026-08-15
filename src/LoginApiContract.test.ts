import fs from "fs";
import path from "path";

const source = fs.readFileSync(path.join(process.cwd(), "src/pages/Login.tsx"), "utf8");

test("login page uses the canonical API client", () => {
  expect(source).toMatch(/import api from "\.\.\/api\/api"/);
  expect(source).toMatch(/api\.post<LoginResponse>\("\/login"/);
  expect(source).not.toMatch(/kleoszalon-api-1\.onrender\.com\/api/);
  expect(source).not.toMatch(/function apiUrl/);
  expect(source).not.toMatch(/function apiFetch/);
});
