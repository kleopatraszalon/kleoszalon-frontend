import { useCallback, useEffect, useState } from "react";
import { withBase } from "../utils/apiBase";

type CurrentUser = {
  id?: string | number;
  email?: string;
  role?: string;
  location_id?: string | number | null;
  location_name?: string;
  full_name?: string;
  name?: string;
  [k: string]: any;
};

type HookResult = {
  user: CurrentUser | null;
  loading: boolean;
  authError: boolean;
  refresh: () => Promise<void>;
};

async function readBody(res: Response): Promise<{ json: any | null; raw: string }> {
  const txt = await res.text();
  try { return { json: JSON.parse(txt), raw: txt }; } catch { return { json: null, raw: txt }; }
}

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const headers: HeadersInit = { Accept: "application/json", ...(init?.headers || {}) };
  let res = await fetch(withBase(path), { ...init, headers });
  if (res.status === 404 && path.startsWith("/api/") && !path.startsWith("/api/auth/")) {
    const alt = path.replace(/^\/api\//, "/api/auth/");
    const retry = await fetch(withBase(alt), { ...init, headers });
    if (retry.ok || retry.status !== 404) res = retry;
  }
  return res;
}

export function useCurrentUser(): HookResult {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<boolean>(false);

  const load = useCallback(async () => {
    setLoading(true);
    setAuthError(false);

    let token = "";
    try {
      token = localStorage.getItem("token") || localStorage.getItem("kleo_token") || "";
    } catch { token = ""; }

    if (!token) {
      setUser(null);
      setAuthError(true);
      setLoading(false);
      return;
    }

    try {
      const res = await apiFetch("/api/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { json } = await readBody(res);
      if (!res.ok) {
        setUser(null);
        setAuthError(res.status === 401 || res.status === 403);
      } else {
        const u = json?.user ?? json ?? null;
        setUser(u);
        setAuthError(!u);
      }
    } catch {
      setUser(null);
      setAuthError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => { if (!cancelled) await load(); })();
    return () => { cancelled = true; };
  }, [load]);

  return { user, loading, authError, refresh: load };
}

export type { CurrentUser };
