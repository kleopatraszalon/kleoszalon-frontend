import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  clearAuthenticatedSession,
  getLastActivityAt,
  hasStoredAuthToken,
  IDLE_TIMEOUT_MS,
  LAST_ACTIVITY_KEY,
  markSessionActivity,
} from "../utils/authSession";

export type LogoutReason = "idle" | undefined;

export function useSessionIdleGuard() {
  const navigate = useNavigate();

  const logout = useCallback((reason?: "idle") => {
    clearAuthenticatedSession();
    if (reason === "idle") {
      try {
        sessionStorage.setItem("kleo_logout_reason", "idle");
      } catch {
        // Storage restrictions must not block logout.
      }
    }
    navigate(reason === "idle" ? "/login?reason=idle" : "/login", { replace: true });
  }, [navigate]);

  useEffect(() => {
    if (!hasStoredAuthToken()) return;

    let timer: number | undefined;
    let lastWriteAt = 0;
    let fallbackActivityAt = Date.now();
    const currentLastActivity = () => getLastActivityAt() ?? fallbackActivityAt;

    const schedule = () => {
      if (timer !== undefined) window.clearTimeout(timer);
      const elapsed = Date.now() - currentLastActivity();
      const remaining = Math.max(0, IDLE_TIMEOUT_MS - elapsed);
      timer = window.setTimeout(expireIfIdle, remaining + 50);
    };

    const expireIfIdle = () => {
      if (!hasStoredAuthToken()) {
        logout();
        return;
      }
      const elapsed = Date.now() - currentLastActivity();
      if (elapsed >= IDLE_TIMEOUT_MS) {
        logout("idle");
        return;
      }
      schedule();
    };

    const registerActivity = () => {
      const now = Date.now();
      fallbackActivityAt = now;
      if (now - lastWriteAt >= 1000) {
        markSessionActivity(now);
        lastWriteAt = now;
      }
      schedule();
    };

    const verifyThenRegisterActivity = () => {
      const elapsed = Date.now() - currentLastActivity();
      if (elapsed >= IDLE_TIMEOUT_MS) {
        logout("idle");
        return;
      }
      registerActivity();
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === LAST_ACTIVITY_KEY) {
        schedule();
        return;
      }
      if ((event.key === "kleo_token" || event.key === "token") && !hasStoredAuthToken()) logout();
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") verifyThenRegisterActivity();
    };

    if (!getLastActivityAt()) markSessionActivity(fallbackActivityAt);
    schedule();

    const passive: AddEventListenerOptions = { passive: true };
    window.addEventListener("pointerdown", registerActivity, passive);
    window.addEventListener("keydown", registerActivity);
    window.addEventListener("touchstart", registerActivity, passive);
    window.addEventListener("scroll", registerActivity, passive);
    window.addEventListener("focus", verifyThenRegisterActivity);
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
      window.removeEventListener("pointerdown", registerActivity);
      window.removeEventListener("keydown", registerActivity);
      window.removeEventListener("touchstart", registerActivity);
      window.removeEventListener("scroll", registerActivity);
      window.removeEventListener("focus", verifyThenRegisterActivity);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [logout]);

  return logout;
}
