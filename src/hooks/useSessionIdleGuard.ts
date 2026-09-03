import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ADMIN_IDLE_TIMEOUT_MS,
  clearAuthenticatedSession,
  getLastActivityAt,
  hasStoredAuthToken,
  LAST_ACTIVITY_KEY,
  markSessionActivity,
} from "../utils/authSession";

export function useSessionIdleGuard(isAdmin = false) {
  const navigate = useNavigate();
  const [isLocked, setIsLocked] = useState(false);
  const lockedRef = useRef(false);
  const wrongKeyCountRef = useRef(0);

  const logout = useCallback((reason?: "idle") => {
    lockedRef.current = false;
    wrongKeyCountRef.current = 0;
    setIsLocked(false);
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

    // Only admin accounts have an inactivity lock. All other roles stay signed in
    // until the normal authenticated-session lifetime or an explicit logout.
    if (!isAdmin) {
      lockedRef.current = false;
      wrongKeyCountRef.current = 0;
      setIsLocked(false);
      return;
    }

    let timer: number | undefined;
    let lastWriteAt = 0;
    let fallbackActivityAt = Date.now();
    const currentLastActivity = () => getLastActivityAt() ?? fallbackActivityAt;

    const lockAdmin = () => {
      if (timer !== undefined) window.clearTimeout(timer);
      timer = undefined;
      lockedRef.current = true;
      wrongKeyCountRef.current = 0;
      setIsLocked(true);
    };

    const schedule = () => {
      if (lockedRef.current) return;
      if (timer !== undefined) window.clearTimeout(timer);
      const elapsed = Date.now() - currentLastActivity();
      const remaining = Math.max(0, ADMIN_IDLE_TIMEOUT_MS - elapsed);
      timer = window.setTimeout(expireIfIdle, remaining + 50);
    };

    function expireIfIdle() {
      if (!hasStoredAuthToken()) {
        logout();
        return;
      }
      const elapsed = Date.now() - currentLastActivity();
      if (elapsed >= ADMIN_IDLE_TIMEOUT_MS) {
        lockAdmin();
        return;
      }
      schedule();
    }

    const registerActivity = () => {
      if (lockedRef.current) return;
      const now = Date.now();
      fallbackActivityAt = now;
      if (now - lastWriteAt >= 1000) {
        markSessionActivity(now);
        lastWriteAt = now;
      }
      schedule();
    };

    const verifyThenRegisterActivity = () => {
      if (lockedRef.current) return;
      const elapsed = Date.now() - currentLastActivity();
      if (elapsed >= ADMIN_IDLE_TIMEOUT_MS) {
        lockAdmin();
        return;
      }
      registerActivity();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (!lockedRef.current) {
        registerActivity();
        return;
      }

      // While locked, key presses must never reach the underlying admin UI.
      event.preventDefault();
      event.stopPropagation();
      if (event.repeat) return;

      if (event.key.toLowerCase() === "r") {
        const now = Date.now();
        lockedRef.current = false;
        wrongKeyCountRef.current = 0;
        setIsLocked(false);
        fallbackActivityAt = now;
        lastWriteAt = now;
        markSessionActivity(now);
        schedule();
        return;
      }

      wrongKeyCountRef.current += 1;
      if (wrongKeyCountRef.current >= 3) logout();
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === LAST_ACTIVITY_KEY) {
        if (!lockedRef.current) schedule();
        return;
      }
      if ((event.key === "kleo_token" || event.key === "token") && !hasStoredAuthToken()) logout();
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") verifyThenRegisterActivity();
    };

    if (!getLastActivityAt()) markSessionActivity(fallbackActivityAt);
    verifyThenRegisterActivity();

    const passive: AddEventListenerOptions = { passive: true };
    window.addEventListener("pointerdown", registerActivity, passive);
    window.addEventListener("keydown", onKeyDown, true);
    window.addEventListener("touchstart", registerActivity, passive);
    window.addEventListener("scroll", registerActivity, passive);
    window.addEventListener("focus", verifyThenRegisterActivity);
    window.addEventListener("storage", onStorage);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (timer !== undefined) window.clearTimeout(timer);
      window.removeEventListener("pointerdown", registerActivity);
      window.removeEventListener("keydown", onKeyDown, true);
      window.removeEventListener("touchstart", registerActivity);
      window.removeEventListener("scroll", registerActivity);
      window.removeEventListener("focus", verifyThenRegisterActivity);
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
      lockedRef.current = false;
      wrongKeyCountRef.current = 0;
      setIsLocked(false);
    };
  }, [isAdmin, logout]);

  return { logout, isLocked };
}
