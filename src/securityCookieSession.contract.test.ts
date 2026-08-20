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

  test("private route uses the cookie-session routing helper", () => {
    const source = read("PrivateRoute.tsx");
    expect(source).toContain("hasStoredAuthToken");
    expect(source).not.toMatch(/localStorage\.getItem\(\s*["']kleo_token["']/);
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
