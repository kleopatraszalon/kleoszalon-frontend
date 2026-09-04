import fs from "node:fs";
import path from "node:path";

describe("admin-only idle policy source contract", () => {
  const root = path.resolve(__dirname, "..");
  const guard = fs.readFileSync(path.join(root, "src/hooks/useSessionIdleGuard.ts"), "utf8");

  test("non-admin exits before timer setup and inactivity never logs out", () => {
    expect(guard).toMatch(/if \(!isAdmin\)[\s\S]*clearAdminIdleActivity\(\)[\s\S]*return;/);
    expect(guard).not.toMatch(/logout\("idle"\)/);
  });

  test("five-minute rule locks only admins", () => {
    expect(guard).toMatch(/elapsed >= ADMIN_IDLE_LOCK_MS[\s\S]*setLocked\(true\)/);
  });
});