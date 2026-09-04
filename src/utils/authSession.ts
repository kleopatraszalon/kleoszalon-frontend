export const ADMIN_IDLE_LOCK_MS = 5 * 60 * 1000;
export const LAST_ACTIVITY_KEY = "kleo_last_activity_at";
export const COOKIE_SESSION_KEY = "kleo_cookie_session";
export const COOKIE_SESSION_MARKER = "active";
export const SESSION_BEARER_KEY = "kleo_session_bearer";

const LOCAL_AUTH_KEYS = [
  "token",
  "kleo_token",
  COOKIE_SESSION_KEY,
  "kleo_role",
  "kleo_location_id",
  "kleo_location_name",
  "kleo_full_name",
  "kleo_account_type",
  "email",
  "userId",
  LAST_ACTIVITY_KEY,
] as const;

const SESSION_AUTH_KEYS = [
  "token",
  "kleo_token",
  SESSION_BEARER_KEY,
  COOKIE_SESSION_KEY,
  "kleo_role",
  "kleo_location_id",
  "kleo_location_name",
  "kleo_full_name",
  "kleo_account_type",
  "email",
  "userId",
  LAST_ACTIVITY_KEY,
] as const;

function logoutEndpoint(): string {
  if (typeof window === "undefined") return "/api/logout";
  const host = window.location.hostname;
  if (host === "kleoszalon-frontend.onrender.com") return "https://kleoszalon-api-1.onrender.com/api/logout";
  if (host === "localhost" || host === "127.0.0.1") return "http://localhost:5000/api/logout";
  return `${window.location.origin.replace(/\/$/, "")}/api/logout`;
}

export function setSessionBearerToken(token: string): void {
  try {
    const value = String(token || "").trim();
    if (value) sessionStorage.setItem(SESSION_BEARER_KEY, value);
    else sessionStorage.removeItem(SESSION_BEARER_KEY);
  } catch {}
}

export function getSessionBearerToken(): string {
  try {
    return String(sessionStorage.getItem(SESSION_BEARER_KEY) || "").trim();
  } catch {
    return "";
  }
}

export function markAuthenticatedSession(): void {
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("kleo_token");
    localStorage.setItem(COOKIE_SESSION_KEY, COOKIE_SESSION_MARKER);
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("kleo_token");
    sessionStorage.removeItem(COOKIE_SESSION_KEY);
  } catch {}
}

export function hasStoredAuthToken(): boolean {
  try {
    return Boolean(
      localStorage.getItem(COOKIE_SESSION_KEY) ||
      getSessionBearerToken() ||
      localStorage.getItem("kleo_token") ||
      localStorage.getItem("token") ||
      sessionStorage.getItem("kleo_token") ||
      sessionStorage.getItem("token")
    );
  } catch {
    return false;
  }
}

export function markSessionActivity(at = Date.now()): number {
  try {
    localStorage.setItem(LAST_ACTIVITY_KEY, String(at));
  } catch {}
  return at;
}

export function getLastActivityAt(): number | null {
  try {
    const raw = localStorage.getItem(LAST_ACTIVITY_KEY);
    if (!raw) return null;
    const value = Number(raw);
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

export function clearAdminIdleActivity(): void {
  try { localStorage.removeItem(LAST_ACTIVITY_KEY); } catch {}
  try { sessionStorage.removeItem(LAST_ACTIVITY_KEY); } catch {}
}

export function clearLocalAuthenticatedSession(): void {
  try {
    LOCAL_AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {}
  try {
    SESSION_AUTH_KEYS.forEach((key) => sessionStorage.removeItem(key));
  } catch {}
}

export function clearAuthenticatedSession(): void {
  const bearer = getSessionBearerToken();
  clearLocalAuthenticatedSession();

  if (typeof fetch === "function") {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (bearer) headers.Authorization = `Bearer ${bearer}`;
    void fetch(logoutEndpoint(), {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      keepalive: true,
      headers,
    }).catch(() => undefined);
  }
}