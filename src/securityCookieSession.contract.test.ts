import fs from "fs";
import path from "path";

describe("browser session security contract", () => {
  const read = (relative: string) => fs.readFileSync(path.join(__dirname, relative), "utf8");

  test("login keeps fallback JWT out of localStorage", () => {
    const source = read("pages/Login.tsx");
    expect(source).toContain("markAuthenticatedSession()");
    expect(source).toContain("setSessionBearerToken");
    expect(source).not.toMatch(/localStorage\.setItem\(\s*["'](?:token|kleo_token)["']/);
  });

  test("login attempts /me readback and can continue with signed session token on Safari", () => {
    const source = read("pages/Login.tsx");
    expect(source).toContain('api.get<LoginResponse>("/me")');
    expect(source).toContain("invalidateCurrentUserCache()");
    expect(source).toContain("setSessionBearerToken(token)");
    expect(source).toContain("persistAuthAndGoHome(merged)");
    expect(source).not.toMatch(/api\.get<LoginResponse>\(\s*["']\/me["']\s*,\s*\{[^}]*Cache-Control/s);
  });

  test("canonical axios client prefers cookies and supports session-only bearer fallback", () => {
    const source = read("api/api.ts");
    expect(source).toMatch(/withCredentials:\s*true/);
    expect(source).toContain("getSessionBearerToken");
    expect(source).toMatch(/Authorization\s*=\s*`Bearer/);
    expect(source).not.toMatch(/localStorage\.getItem\(\s*["'](?:token|kleo_token)["']/);
  });

  test("canonical fetch client always includes cookies and emits no legacy bearer header", () => {
    const source = read("utils/fetch.ts");
    expect(source).toMatch(/credentials:\s*["']include["']/);
    expect(source).not.toMatch(/localStorage\.getItem\(\s*["'](?:token|kleo_token)["']/);
    expect(source).not.toMatch(/Authorization\s*:\s*`Bearer/);
  });

  test("current user bootstrap prefers cookies and supports Safari session-only bearer fallback", () => {
    const source = read("hooks/useCurrentUser.ts");
    expect(source).toMatch(/credentials:\s*["']include["']/);
    expect(source).toContain("markAuthenticatedSession()");
    expect(source).toContain("getSessionBearerToken");
    expect(source).toContain("headers.Authorization = `Bearer ${bearer}`");
    expect(source).not.toMatch(/localStorage\.getItem\(\s*["'](?:token|kleo_token)["']/);
  });

  test("management dashboard never gates a session on legacy bearer keys", () => {
    const source = read("pages/Home.tsx");
    expect(source).toContain('import { clearLocalAuthenticatedSession } from "../utils/authSession"');
    expect(source).toContain("clearLocalAuthenticatedSession()");
    expect(source).not.toMatch(/localStorage\.getItem\(\s*["'](?:token|kleo_token)["']/);
    expect(source).not.toMatch(/const\s+token\s*=\s*localStorage\.getItem/);
  });

  test("authentication failure cannot send a delayed server logout", () => {
    const currentUser = read("hooks/useCurrentUser.ts");
    const session = read("utils/authSession.ts");
    expect(currentUser).toContain("clearLocalAuthenticatedSession()");
    expect(currentUser).not.toContain("clearAuthenticatedSession()");
    expect(currentUser).toContain("if (res.status === 401)");
    expect(currentUser).not.toMatch(/res\.status\s*===\s*401\s*\|\|\s*res\.status\s*===\s*403/);
    expect(session).toContain("export function clearLocalAuthenticatedSession()");
    expect(session).toContain("export function clearAuthenticatedSession()");
    expect(session).toContain("clearLocalAuthenticatedSession();");
  });

  test("session markers and Safari fallback are isolated from legacy bearer token keys", () => {
    const source = read("utils/authSession.ts");
    expect(source).toContain('COOKIE_SESSION_KEY = "kleo_cookie_session"');
    expect(source).toContain('COOKIE_SESSION_MARKER = "active"');
    expect(source).toContain('SESSION_BEARER_KEY = "kleo_session_bearer"');
    expect(source).toContain('localStorage.removeItem("token")');
    expect(source).toContain('localStorage.removeItem("kleo_token")');
    expect(source).toContain("sessionStorage.setItem(SESSION_BEARER_KEY, value)");
    expect(source).toContain("localStorage.setItem(COOKIE_SESSION_KEY, COOKIE_SESSION_MARKER)");
    expect(source).not.toMatch(/localStorage\.setItem\(\s*["']kleo_token["']/);
    expect(source).not.toMatch(/localStorage\.setItem\(\s*SESSION_BEARER_KEY/);
    expect(source).not.toContain('COOKIE_SESSION_MARKER = "cookie-session"');
    expect(source).toMatch(/credentials:\s*["']include["']/);
  });

  test("application router guards use the shared session routing helper", () => {
    const source = read("App.tsx");
    expect(source).toContain('import { hasStoredAuthToken } from "./utils/authSession"');
    expect(source).not.toMatch(/localStorage\.getItem\(\s*["'](?:token|kleo_token)["']/);
    expect(source).not.toContain("function getToken()");
    expect((source.match(/hasStoredAuthToken\(\)/g) || []).length).toBeGreaterThanOrEqual(4);
  });

  test("private route uses the shared session routing helper", () => {
    const source = read("PrivateRoute.tsx");
    expect(source).toContain("hasStoredAuthToken");
    expect(source).not.toMatch(/localStorage\.getItem\(\s*["']kleo_token["']/);
  });

  test("Kleo Team uses the HttpOnly cookie session instead of legacy bearer storage", () => {
    const source = read("pages/EmployeeMobileApp.tsx");
    expect(source).toContain("withCredentials: true");
    expect(source).toContain("requestError?.response?.status === 401");
    expect(source).not.toMatch(/localStorage\.getItem\(\s*["'](?:token|kleo_token)["']/);
    expect(source).not.toMatch(/Authorization\s*:\s*`Bearer/);
    expect(source).not.toMatch(/Bearer\s+\$\{/);
  });

  test("Booking 4 route bridge catches SPA navigation and keeps a router context", () => {
    const source = read("index.tsx");
    expect(source).toContain('BOOKING_V4_PATH = "/admin/booking-v4"');
    expect(source).toContain('ROUTE_CHANGE_EVENT = "kleo:route-change"');
    expect(source).toContain("window.history.pushState");
    expect(source).toContain("window.history.replaceState");
    expect(source).toContain("<BrowserRouter>");
    expect(source).toContain("<BookingV4TaxonomyOptimizerPage />");
    expect(source).toContain("if (!hasStoredAuthToken())");
    expect(source).not.toMatch(/const\s+token\s*=\s*localStorage\.getItem\(\s*["']kleo_token["']/);
  });

  test("the cookie session marker cannot masquerade as a bearer credential", () => {
    const authSession = read("utils/authSession.ts");
    const sidebar = read("components/Sidebar.tsx");
    const websiteAdmin = read("pages/WebsiteAdminPage.tsx");

    expect(authSession).not.toContain('localStorage.setItem("kleo_token", COOKIE_SESSION_MARKER)');
    expect(authSession).toContain('localStorage.removeItem("kleo_token")');
    expect(sidebar).not.toContain("kleo_cookie_session");
    expect(websiteAdmin).not.toContain("kleo_cookie_session");
  });

  test("frontend role guards do not decode browser JWTs", () => {
    const source = read("utils/roles.ts");
    expect(source).toContain('localStorage.getItem("kleo_role")');
    expect(source).not.toContain("decodePayload");
    expect(source).not.toMatch(/split\(\s*["']\.["']\s*\)\s*\[1\]/);
  });
});
