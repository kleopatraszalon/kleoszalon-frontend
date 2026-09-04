import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import withBase from "../utils/apiBase";
import {
  clearAuthenticatedSession,
  getLastActivityAt,
  getSessionBearerToken,
  hasStoredAuthToken,
  IDLE_TIMEOUT_MS,
  LAST_ACTIVITY_KEY,
  markSessionActivity,
} from "../utils/authSession";

const ADMIN_ROLES = new Set(["admin", "administrator", "rendszergazda", "superadmin", "super_admin"]);

function parseRoles(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String).map((value) => value.trim().toLowerCase()).filter(Boolean);
  const text = String(raw ?? "").trim();
  if (!text) return [];
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.map(String).map((value) => value.trim().toLowerCase()).filter(Boolean);
  } catch {}
  return text.split(",").map((value) => value.replace(/[\[\]"]/g, "").trim().toLowerCase()).filter(Boolean);
}

export function useSessionIdleGuard(role?: unknown, email?: string | null) {
  const navigate = useNavigate();
  const [locked, setLocked] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const isAdmin = useMemo(() => parseRoles(role).some((item) => ADMIN_ROLES.has(item)), [role]);

  const logout = useCallback((reason?: "idle" | "lock_failed") => {
    clearAuthenticatedSession();
    if (reason) {
      try { sessionStorage.setItem("kleo_logout_reason", reason); } catch {}
    }
    navigate(reason ? `/login?reason=${reason}` : "/login", { replace: true });
  }, [navigate]);

  const unlock = useCallback(async (password: string) => {
    if (!isAdmin || !locked || unlocking) return false;
    const identifier = String(email || localStorage.getItem("email") || "").trim();
    if (!identifier || !password) {
      setUnlockError("Add meg az adminisztrátori jelszót.");
      return false;
    }
    setUnlocking(true);
    setUnlockError(null);
    try {
      const bearer = getSessionBearerToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (bearer) headers.Authorization = `Bearer ${bearer}`;
      const response = await fetch(withBase("login"), {
        method: "POST",
        credentials: "include",
        cache: "no-store",
        headers,
        body: JSON.stringify({ identifier, password }),
      });
      if (!response.ok) {
        // Hibás admin jelszó esetén a zárolt munkamenetet nem hagyjuk aktívan.
        logout("lock_failed");
        return false;
      }
      markSessionActivity(Date.now());
      setLocked(false);
      setUnlockError(null);
      return true;
    } catch {
      setUnlockError("A jelszó ellenőrzése nem sikerült. Próbáld újra.");
      return false;
    } finally {
      setUnlocking(false);
    }
  }, [email, isAdmin, locked, logout, unlocking]);

  useEffect(() => {
    if (!hasStoredAuthToken()) return;

    // Az 5 perces inaktivitási szabály kizárólag adminisztrátorra vonatkozik.
    // Recepciós, szalonvezető, munkatárs, HR, könyvelés stb. nem kap időzített
    // automatikus kiléptetést és nem kap idle zárolást sem.
    if (!isAdmin) {
      setLocked(false);
      try { localStorage.removeItem(LAST_ACTIVITY_KEY); } catch {}
      return;
    }

    let timer: number | undefined;
    let lastWriteAt = 0;
    let fallbackActivityAt = Date.now();
    const currentLastActivity = () => getLastActivityAt() ?? fallbackActivityAt;

    const lockIfIdle = () => {
      if (!hasStoredAuthToken()) return;
      const elapsed = Date.now() - currentLastActivity();
      if (elapsed >= IDLE_TIMEOUT_MS) {
        setLocked(true);
        return;
      }
      schedule();
    };

    const schedule = () => {
      if (timer !== undefined) window.clearTimeout(timer);
      const elapsed = Date.now() - currentLastActivity();
      const remaining = Math.max(0, IDLE_TIMEOUT_MS - elapsed);
      timer = window.setTimeout(lockIfIdle, remaining + 50);
    };

    const registerActivity = () => {
      if (locked) return;
      const now = Date.now();
      fallbackActivityAt = now;
      if (now - lastWriteAt >= 1000) {
        markSessionActivity(now);
        lastWriteAt = now;
      }
      schedule();
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === LAST_ACTIVITY_KEY && !locked) schedule();
    };

    const onVisibility = () => {
      if (document.visibilityState !== "visible" || locked) return;
      const elapsed = Date.now() - currentLastActivity();
      if (elapsed >= IDLE_TIMEOUT_MS) setLocked(true);
      else registerActivity();
    };

    if (!getLastActivityAt()) markSessionActivity(fallbackActivityAt);
    schedule();

    const passive: AddEventListenerOptions = { passive: true };
    window.addEventListener("pointerdown", registerActivity, passive);
    window.addEventListener("keydown", registerActivity);
    window.addEventListener("touchstart", registerActivity, passive);
    window.addEventListener("scroll", registerActivity, passive);
    window.addEventListener("focus", onVisibility);
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
      window.removeEventListener("pointerdown", registerActivity);
      window.removeEventListener("keydown", registerActivity);
      window.removeEventListener("touchstart", registerActivity);
      window.removeEventListener("scroll", registerActivity);
      window.removeEventListener("focus", onVisibility);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isAdmin, locked]);

  return { logout, locked: isAdmin && locked, unlock, unlocking, unlockError, isAdmin };
}
