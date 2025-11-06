import { useEffect, useState, useCallback, useRef } from "react";

export type CurrentUser = {
  id: string;
  full_name: string;
  role: string;
  active: boolean;
  location_id: string | null;
  location_name: string | null;
};

type MeResponse = {
  id: string;
  full_name: string;
  role: string;
  active: boolean;
  location_id?: string | null;
  location_name?: string | null;
  // egyéb mezők jöhetnek, de nem kötelezők
};

function getToken(): string {
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("kleo_token") ||
    ""
  );
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);

  const fetchUser = useCallback(async () => {
    // ha korábbi kérés fut, szakítsuk meg
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setAuthError(null);

    const token = getToken();
    if (!token) {
      setUser(null);
      setAuthError("Nincs token");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/me`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        // ha sütit is használsz, maradhat; ha csak JWT header megy, nem szükséges
        credentials: "include",
        signal: controller.signal,
      });

      const text = await res.text();
      const data: Partial<MeResponse> =
        text ? (JSON.parse(text) as MeResponse) : {};

      if (!res.ok) {
        // tipikusan 401/403
        setUser(null);
        setAuthError(
          (data as any)?.error || `Auth hiba (${res.status})`
        );
        setLoading(false);
        return;
      }

      // localStorage szinkron
      localStorage.setItem("kleo_role", data.role ?? "");
      localStorage.setItem("kleo_location_id", (data.location_id ?? "") as string);
      localStorage.setItem("kleo_location_name", (data.location_name ?? "") as string);
      localStorage.setItem("kleo_full_name", data.full_name ?? "");

      setUser({
        id: String(data.id),
        full_name: String(data.full_name || ""),
        role: String(data.role || ""),
        active: Boolean(data.active),
        location_id:
          data.location_id === null || data.location_id === undefined
            ? null
            : String(data.location_id),
        location_name:
          data.location_name === null || data.location_name === undefined
            ? null
            : String(data.location_name),
      });
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        console.error("useCurrentUser /api/me hiba:", err);
        setUser(null);
        setAuthError("Hálózati hiba");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();

    // ha másik fülben változik a token, itt újra lekérjük
    const onStorage = (e: StorageEvent) => {
      if (e.key === "token" || e.key === "kleo_token") {
        fetchUser();
      }
    };
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      abortRef.current?.abort();
    };
  }, [fetchUser]);

  // manuális újratöltés lehetősége
  const reload = useCallback(() => {
    fetchUser();
  }, [fetchUser]);

  return { user, loading, authError, reload };
}
