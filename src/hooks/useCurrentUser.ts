// src/hooks/useCurrentUser.ts
import { useCallback, useEffect, useState } from "react";
import withBase from "../utils/apiBase";
import {
  clearAuthenticatedSession,
  getSessionBearerToken,
  markAuthenticatedSession,
} from "../utils/authSession";

type CurrentUser = {
  id?: string | number | null;
  full_name?: string | null;
  email?: string | null;
  role?: string | null;
  location_id?: string | number | null;
  location_name?: string | null;
};

type HookResult = {
  user: CurrentUser | null;
  loading: boolean;
  authError: string | null;
  error?: string | null;
  refresh: () => Promise<void>;
};

class UnauthenticatedError extends Error {
  constructor() {
    super("unauthenticated");
    this.name = "UnauthenticatedError";
  }
}

let cachedUser: CurrentUser | null | undefined;
let userRequest: Promise<CurrentUser | null> | null = null;

function syncUiSessionMetadata(user: CurrentUser): void {
  if (typeof window === "undefined") return;
  try {
    markAuthenticatedSession();
    if (user.role != null) localStorage.setItem("kleo_role", String(user.role));
    else localStorage.removeItem("kleo_role");
    if (user.full_name) localStorage.setItem("kleo_full_name", String(user.full_name));
    else localStorage.removeItem("kleo_full_name");
    if (user.location_id != null) localStorage.setItem("kleo_location_id", String(user.location_id));
    else localStorage.removeItem("kleo_location_id");
    if (user.location_name) localStorage.setItem("kleo_location_name", String(user.location_name));
    else localStorage.removeItem("kleo_location_name");
    if (user.email) localStorage.setItem("email", String(user.email));
  } catch {
    // UI metadata is optional and never authoritative for access control.
  }
}

async function requestCurrentUser(): Promise<CurrentUser | null> {
  if (cachedUser !== undefined) return cachedUser;
  if (userRequest) return userRequest;
  userRequest = (async () => {
    const bearer = getSessionBearerToken();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (bearer) headers.Authorization = `Bearer ${bearer}`;

    const res = await fetch(withBase("me"), {
      method: "GET",
      headers,
      credentials: "include",
      cache: "no-store",
    });
    if (res.status === 401 || res.status === 403) throw new UnauthenticatedError();
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    const json = await res.json().catch(() => ({} as any));
    const payload = json?.user ?? json?.data ?? json;
    if (!payload) throw new Error("Üres vagy értelmezhetetlen válasz a /me végponttól");
    const current: CurrentUser = {
      id: payload.id ?? payload.user_id ?? payload.userId ?? null,
      full_name: payload.full_name ?? payload.name ?? null,
      email: payload.email ?? null,
      role: payload.role ?? null,
      location_id: payload.location_id ?? null,
      location_name: payload.location_name ?? payload.location ?? null,
    };
    syncUiSessionMetadata(current);
    return current;
  })();
  try {
    cachedUser = await userRequest;
    return cachedUser;
  } finally {
    userRequest = null;
  }
}

/**
 * Browser authentication bootstrap. The HttpOnly cookie is preferred, while a
 * tab-scoped Bearer token covers Render cross-origin cookie restrictions.
 * /api/me remains authoritative for the current identity.
 */
export function useCurrentUser(): HookResult {
  const [user, setUser] = useState<CurrentUser | null>(() => cachedUser ?? null);
  const [loading, setLoading] = useState(cachedUser === undefined);
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setAuthError(null);

    try {
      const found = await requestCurrentUser();
      if (found) {
        setUser(found);
        setAuthError(null);
      } else {
        setUser(null);
        setAuthError("Nem sikerült betölteni a felhasználói adatokat.");
      }
    } catch (e) {
      setUser(null);
      if (e instanceof UnauthenticatedError) {
        cachedUser = null;
        clearAuthenticatedSession();
        setAuthError("A munkamenet lejárt. Jelentkezzen be újra.");
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
          window.location.replace("/login");
        }
      } else {
        setAuthError(String(e));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    loading,
    authError,
    error: authError,
    refresh: async () => { cachedUser = undefined; await fetchUser(); },
  };
}
