import fs from "fs";
import path from "path";

describe("browser cookie-session security contract", () => {
  const read = (relative: string) => fs.readFileSync(path.join(__dirname, relative), "utf8");

  test("login never persists response JWT credentials", () => {
    const source = read("pages/Login.tsx");
    expect(source).toContain("markAuthenticatedSession()");
    expect(source).not.toMatch(/body\.(?:token|refresh_token)/);
    expect(source).not.toMatch(/localStorage\.setItem\(\s*["'](?:token|kleo_token)["']\s*,\s*body\./);
  });

  test("login verifies the newly issued cookie before authenticated navigation", () => {
    const source = read("pages/Login.tsx");
    expect(source).toContain('api.get<LoginResponse>("/me")');
    expect(source).toContain("credentialsAccepted = true");
    expect(source).toContain("invalidateCurrentUserCache()");
    expect(source.indexOf('api.get<LoginResponse>("/me")')).toBeLessThan(source.indexOf("persistAuthAndGoHome({"));
    expect(source).not.toMatch(/api\.get<LoginResponse>\(\s*["']\/me["']\s*,\s*\{[^}]*Cache-Control/s);
  });

  test("canonical axios client authenticates only with cookies", () => {
    const source = read("api/api.ts");
    expect(source).toMatch(/withCredentials:\s*true/);
    expect(source).not.toMatch(/localStorage\.getItem\(\s*["'](?:token|kleo_token)["']/);
    expect(source).not.toMatch(/Authorization\s*=\s*`Bearer/);
  });

  test("canonical fetch client always includes cookies and emits no bearer header", () => {
    const source = read("utils/fetch.ts");
    expect(source).toMatch(/credentials:\s*["']include["']/);
    expect(source).not.toMatch(/localStorage\.getItem\(\s*["'](?:token|kleo_token)["']/);
    expect(source).not.toMatch(/Authorization\s*:\s*`Bearer/);
  });

  test("current user bootstrap is cookie-authoritative", () => {
    const source = read("hooks/useCurrentUser.ts");
    expect(source).toMatch(/credentials:\s*["']include["']/);
    expect(source).toContain("markAuthenticatedSession()");
    expect(source).not.toMatch(/localStorage\.getItem\(\s*["'](?:token|kleo_token)["']/);
    expect(source).not.toMatch(/Authorization\s*:\s*`Bearer/);
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

  test("session marker is isolated from every legacy bearer token key", () => {
    const source = read("utils/authSession.ts");
    expect(source).toContain('COOKIE_SESSION_KEY = "kleo_cookie_session"');
    expect(source).toContain('COOKIE_SESSION_MARKER = "active"');
    expect(source).toContain('localStorage.removeItem("token")');
    expect(source).toContain('localStorage.removeItem("kleo_token")');
    expect(source).toContain("localStorage.setItem(COOKIE_SESSION_KEY, COOKIE_SESSION_MARKER)");
    expect(source).not.toMatch(/localStorage\.setItem\(\s*["']kleo_token["']/);
    expect(source).not.toContain('COOKIE_SESSION_MARKER = "cookie-session"');
    expect(source).toMatch(/credentials:\s*["']include["']/);
  });

  test("application router guards use the cookie-session routing helper", () => {
    const source = read("App.tsx");
    expect(source).toContain('import { hasStoredAuthToken } from "./utils/authSession"');
    expect(source).not.toMatch(/localStorage\.getItem\(\s*["'](?:token|kleo_token)["']/);
    expect(source).not.toContain("function getToken()");
    expect((source.match(/hasStoredAuthToken\(\)/g) || []).length).toBeGreaterThanOrEqual(4);
  });

  test("private route uses the cookie-session routing helper", () => {
    const source = read("PrivateRoute.tsx");
    expect(source).toContain("hasStoredAuthToken");
    expect(source).not.toMatch(/localStorage\.getItem\(\s*["']kleo_token["']/);
  });

  test("special Booking 4 entry uses the cookie-session routing helper", () => {
    const source = read("index.tsx");
    expect(source).toContain('import { hasStoredAuthToken } from "./utils/authSession"');
    expect(source).toContain("if(!hasStoredAuthToken())");
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
