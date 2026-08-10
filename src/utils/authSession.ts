export const IDLE_TIMEOUT_MS = 5 * 60 * 1000;
export const LAST_ACTIVITY_KEY = "kleo_last_activity_at";

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

export function hasStoredAuthToken(): boolean {
  try {
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
