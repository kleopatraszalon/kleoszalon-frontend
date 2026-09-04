import fs from "node:fs";
import path from "node:path";

describe("non-admin idle-session policy", () => {
  const hook = fs.readFileSync(path.resolve(__dirname, "hooks/useSessionIdleGuard.ts"), "utf8");

  test("non-admin sessions never create a five-minute timer", () => {
    const nonAdmin = hook.match(/if \(!isAdmin\) \{([\s\S]*?)\n[ ]{4}\}/)?.[1] || "";
    expect(nonAdmin).toContain("clearAdminIdleActivity()");
    expect(nonAdmin).toContain("return;");
    expect(nonAdmin).not.toContain("setTimeout");
    expect(nonAdmin).not.toContain("logout");
  });

  test("idle expiry is a lock, not logout", () => {
    expect(hook).not.toContain('logout("idle")');
    expect(hook).toMatch(/elapsed >= ADMIN_IDLE_LOCK_MS[\s\S]*setLocked\(true\)/);
  });
});
