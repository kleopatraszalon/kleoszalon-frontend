import fs from "node:fs";
import path from "node:path";

describe("admin idle unlock security contract", () => {
  const root = path.resolve(__dirname, "..");
  const guard = fs.readFileSync(path.join(root, "src/hooks/useSessionIdleGuard.ts"), "utf8");
  const layout = fs.readFileSync(path.join(root, "src/layouts/AppLayout.tsx"), "utf8");

  test("only admin sessions use the five-minute idle lock", () => {
    expect(guard).toMatch(/if \(!isAdmin\)[\s\S]*clearAdminIdleActivity\(\)[\s\S]*return;/);
    expect(guard).toMatch(/elapsed >= ADMIN_IDLE_LOCK_MS[\s\S]*setLocked\(true\)/);
    expect(guard).not.toMatch(/logout\("idle"\)/);
  });

  test("unlock verification is explicitly marked for backend security alerting", () => {
    expect(guard).toMatch(/idle_unlock:\s*true/);
    expect(guard).toMatch(/logout\("lock_failed"\)/);
  });

  test("admin lock overlay is rendered from the application layout", () => {
    expect(layout).toMatch(/AdminIdleLock/);
    expect(layout).toMatch(/idleGuard\.locked/);
  });
});
