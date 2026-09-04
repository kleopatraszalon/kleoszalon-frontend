import { ADMIN_IDLE_LOCK_MS, clearAdminIdleActivity, clearAuthenticatedSession, markSessionActivity } from "./utils/authSession";

describe("KLEO admin idle lock", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    (global as any).fetch = jest.fn(() => Promise.resolve({ ok: true }));
  });

  test("admin idle lock is exactly five minutes", () => {
    expect(ADMIN_IDLE_LOCK_MS).toBe(300_000);
  });

  test("admin activity timestamp is persisted and can be removed for non-admin sessions", () => {
    markSessionActivity(123456);
    expect(localStorage.getItem("kleo_last_activity_at")).toBe("123456");
    clearAdminIdleActivity();
    expect(localStorage.getItem("kleo_last_activity_at")).toBeNull();
  });

  test("explicit logout invalidates the HttpOnly cookie on the API and clears local credentials", () => {
    localStorage.setItem("kleo_token", "secret");
    localStorage.setItem("kleo_role", "admin");
    sessionStorage.setItem("token", "secret-session");

    clearAuthenticatedSession();

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = (global.fetch as jest.Mock).mock.calls[0];
    expect(String(url)).toContain("/api/logout");
    expect(options).toMatchObject({ method: "POST", credentials: "include", keepalive: true, cache: "no-store" });
    expect(localStorage.getItem("kleo_token")).toBeNull();
    expect(localStorage.getItem("kleo_role")).toBeNull();
    expect(sessionStorage.getItem("token")).toBeNull();
  });
});