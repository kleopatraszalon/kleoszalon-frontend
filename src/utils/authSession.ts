export const IDLE_TIMEOUT_MS = 5 * 60 * 1000;
export const LAST_ACTIVITY_KEY = "kleo_last_activity_at";

// Compatibility marker for the existing synchronous router guard. This value is
// deliberately NOT a credential and must never be sent as an Authorization
// header. Authentication authority lives exclusively in the HttpOnly cookies.
export const COOKIE_SESSION_MARKER = "cookie-session";

const LOCAL_AUTH_KEYS = [
  "token",
  "kleo_token",
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
    // Overwrite any legacy JWT that may still be present from an older build.
    // The marker is only a UI routing hint; /api/me remains authoritative.
    localStorage.removeItem("token");
    localStorage.setItem("kleo_token", COOKIE_SESSION_MARKER);
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("kleo_token");
  } catch {
    // Storage is optional. Cookie authentication remains authoritative.
  }
}

export function hasStoredAuthToken(): boolean {
  try {
    // Legacy JWT values are accepted only as a temporary routing hint so an
    // already logged-in user can reach /api/me once and be migrated to the
    // non-secret marker by useCurrentUser().
    return Boolean(
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
