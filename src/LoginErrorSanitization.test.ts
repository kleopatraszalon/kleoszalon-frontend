import fs from "fs";
import path from "path";

const source = fs.readFileSync(path.join(process.cwd(), "src/pages/Login.tsx"), "utf8");

test("login page does not expose browser or Axios diagnostics to users", () => {
  expect(source).not.toMatch(/Belépési diagnosztika/);
  expect(source).not.toMatch(/browserDiagnostic/);
  expect(source).not.toMatch(/navigator\.userAgent/);
  expect(source).not.toMatch(/LOGIN_ERROR/);
  expect(source).not.toMatch(/sessionStorage=OK/);
});

test("login page maps server outages to a stable user-facing message", () => {
  expect(source).toMatch(/A szerver átmenetileg nem elérhető/);
  expect(source).toMatch(/The server is temporarily unavailable/);
  expect(source).toMatch(/status === 429/);
});
