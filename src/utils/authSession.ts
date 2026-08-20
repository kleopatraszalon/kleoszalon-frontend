export const IDLE_TIMEOUT_MS = 5 * 60 * 1000;
export const LAST_ACTIVITY_KEY = "kleo_last_activity_at";

// Browser authentication is cookie-only. This dedicated storage marker is only
// a synchronous UI routing hint and deliberately lives outside the legacy token
// keys so old components can never mistake it for a Bearer credential.
export const COOKIE_SESSION_KEY = "kleo_cookie_session";
export const COOKIE_SESSION_MARKER = "active";

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

export function markAuthenticatedSession(): void {
  try {
    // /api/me and the HttpOnly cookie are authoritative. Remove every legacy
    // browser-readable token key, then retain only the isolated non-token marker.
    localStorage.removeItem("token");
    localStorage.removeItem("kleo_token");
    localStorage.setItem(COOKIE_SESSION_KEY, COOKIE_SESSION_MARKER);
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("kleo_token");
    sessionStorage.removeItem(COOKIE_SESSION_KEY);
  } catch {
    // Storage is optional. Cookie authentication remains authoritative.
  }
}

export function hasStoredAuthToken(): boolean {
  try {
    // The dedicated marker is the normal path. Legacy JWT keys are accepted only
    // as a temporary routing hint so /api/me can migrate an older live session.
    return Boolean(
      localStorage.getItem(COOKIE_SESSION_KEY) ||
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
  } catch {
    // Storage can be unavailable in restricted browser contexts; the caller's
    // in-memory timer still protects the active tab.
  }
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

export function clearAuthenticatedSession(): void {
  // The backend owns the authentication state through HttpOnly cookies.
  // keepalive makes cookie invalidation survive an immediate redirect.
  if (typeof fetch === "function") {
    void fetch(logoutEndpoint(), {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
    }).catch(() => undefined);
  }

  try {
    LOCAL_AUTH_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Ignore storage failures during logout; navigation still proceeds.
  }
  try {
    SESSION_AUTH_KEYS.forEach((key) => sessionStorage.removeItem(key));
  } catch {
    // Do not clear unrelated session state owned by other application features.
  }
}
