// src/hooks/useCurrentUser.ts
import { useCallback, useEffect, useState } from "react";
import withBase from "../utils/apiBase";

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
  // Ha valahol "error"-ként hivatkozol rá, azt is kiszolgáljuk
  error?: string | null;
  refresh: () => Promise<void>;
};

let cachedUser: CurrentUser | null | undefined;
let userRequest: Promise<CurrentUser | null> | null = null;

async function requestCurrentUser(): Promise<CurrentUser | null> {
  if (cachedUser !== undefined) return cachedUser;
  if (userRequest) return userRequest;
  userRequest = (async () => {
    const token = typeof window !== "undefined"
      ? localStorage.getItem("kleo_token") || localStorage.getItem("token")
      : null;
    if (!token) return null;
    const res = await fetch(withBase("me"), {
      method: "GET",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      credentials: "include",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    const json = await res.json().catch(() => ({} as any));
    const payload = json?.user ?? json?.data ?? json;
    if (!payload) throw new Error("Üres vagy értelmezhetetlen válasz a /me végponttól");
    return {
      id: payload.id ?? payload.user_id ?? payload.userId ?? null,
      full_name: payload.full_name ?? payload.name ?? null,
      email: payload.email ?? null,
      role: payload.role ?? null,
      location_id: payload.location_id ?? null,
      location_name: payload.location_name ?? payload.location ?? null,
    };
  })();
  try { cachedUser = await userRequest; return cachedUser; }
  finally { userRequest = null; }
}

/**
 * Aktuális bejelentkezett user lekérése.
 * A token-t localStorage-ből olvassa, a backend felé pedig:
 *   - először:  GET /api/auth/me
 *   - ha az hibázik: GET /api/me
 *
 * FONTOS: itt is csak 'auth/me' és 'me' stringeket használunk,
 * az '/api' részt a withBase teszi hozzá.
 */
export function useCurrentUser(): HookResult {
  const [user, setUser] = useState<CurrentUser | null>(() => cachedUser ?? null);
  const [loading, setLoading] = useState(cachedUser === undefined);
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setAuthError(null);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("kleo_token") || localStorage.getItem("token") : null;

      if (!token) {
        setUser(null);
        setAuthError("Nincs token – nem vagy bejelentkezve.");
        setLoading(false);
        return;
      }

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
      setAuthError(String(e));
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
