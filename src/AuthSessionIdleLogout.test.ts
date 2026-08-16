import { clearAuthenticatedSession, IDLE_TIMEOUT_MS, markSessionActivity } from "./utils/authSession";

describe("KLEO idle logout", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    (global as any).fetch = jest.fn(() => Promise.resolve({ ok: true }));
  });

  test("idle timeout is exactly five minutes", () => {
    expect(IDLE_TIMEOUT_MS).toBe(300_000);
  });

  test("activity timestamp is persisted", () => {
    markSessionActivity(123456);
    expect(localStorage.getItem("kleo_last_activity_at")).toBe("123456");
  });

  test("logout invalidates the HttpOnly cookie on the API and clears local credentials", () => {
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
