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
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setAuthError(null);

    try {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("kleo_token") || localStorage.getItem("token")
          : null;

      if (!token) {
        setUser(null);
        setAuthError("Nincs token – nem vagy bejelentkezve.");
        setLoading(false);
        return;
      }

      // Csak relatív útvonalak, NINCS "api/" prefix!
      const endpoints = ["me"];

      let lastErr: any = null;
      let found: CurrentUser | null = null;

      for (const ep of endpoints) {
        try {
          const res = await fetch(withBase(ep), {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
          });

          if (!res.ok) {
            lastErr = new Error(`HTTP ${res.status} ${res.statusText}`);
            continue;
          }

          const json = await res.json().catch(() => ({} as any));
          const payload = json?.user ?? json?.data ?? json;

          if (!payload) {
            lastErr = new Error("Üres vagy értelmezhetetlen válasz a /me végponttól");
            continue;
          }

          const normalized: CurrentUser = {
            id: payload.id ?? payload.user_id ?? payload.userId ?? null,
            full_name: payload.full_name ?? payload.name ?? null,
            email: payload.email ?? null,
            role: payload.role ?? null,
            location_id: payload.location_id ?? null,
            location_name: payload.location_name ?? payload.location ?? null,
          };

          found = normalized;
          lastErr = null;
          break;
        } catch (e) {
          lastErr = e;
        }
      }

      if (found) {
        setUser(found);
        setAuthError(null);
      } else {
        setUser(null);
        setAuthError(
          lastErr
            ? String(lastErr)
            : "Nem sikerült betölteni a felhasználói adatokat."
        );
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
    refresh: fetchUser,
  };
}
