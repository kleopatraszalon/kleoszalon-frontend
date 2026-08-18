export const IDLE_TIMEOUT_MS = 5 * 60 * 1000;
export const LAST_ACTIVITY_KEY = "kleo_last_activity_at";
export const COOKIE_SESSION_MARKER = "cookie-session-v1";

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

/**
 * Keep the historic token keys as non-secret compatibility flags because older
 * route guards only test whether they are present. The value is never a JWT and
 * must never be sent as an Authorization credential.
 */
export function markAuthenticatedSession(): void {
  try {
    localStorage.setItem("kleo_token", COOKIE_SESSION_MARKER);
    localStorage.setItem("token", COOKIE_SESSION_MARKER);
  } catch {
    // Restricted storage contexts can still rely on the HttpOnly cookie until
    // navigation; the API remains the authority for authentication.
  }
}

export function hasStoredAuthToken(): boolean {
  try {
    const current = localStorage.getItem("kleo_token") || localStorage.getItem("token");
    if (!current) return false;
    if (current !== COOKIE_SESSION_MARKER) {
      // One-time migration of a legacy browser JWT. Previous login versions set
      // the HttpOnly cookie as well, so replace the readable bearer value with a
      // harmless marker immediately.
      markAuthenticatedSession();
    }
    return true;
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
  // The backend owns the credential in an HttpOnly cookie. Keepalive makes the
  // cookie invalidation survive an immediate redirect to /login.
  if (typeof fetch === "function") {
    void fetch(logoutEndpoint(), {
      method: "POST",
      credentials: "include",
      cache: "no-store",
      keepalive: true,
      headers: {
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
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
