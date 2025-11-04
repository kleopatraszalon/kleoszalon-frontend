import { useEffect, useState } from "react";

export type CurrentUser = {
  id: string;
  full_name: string;
  role: string;
  active: boolean;
  location_id: string | null;
  location_name: string | null;
};

const BACKEND_URL = "http://localhost:5000"; // ide jön a backend port

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setAuthError("Nincs token");
      setLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/me`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          credentials: "include", // ha cookie-t is használsz
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          setAuthError(errorData.error || "Auth hiba");
          setLoading(false);
          return;
        }

        const data = await res.json();

        // localStorage frissítés
        localStorage.setItem("kleo_role", data.role ?? "");
        localStorage.setItem("kleo_location_id", data.location_id ?? "");
        localStorage.setItem("kleo_location_name", data.location_name ?? "");
        localStorage.setItem("kleo_full_name", data.full_name ?? "");

        setUser({
          id: data.id,
          full_name: data.full_name,
          role: data.role,
          active: data.active,
          location_id: data.location_id ?? null,
          location_name: data.location_name ?? null,
        });

        setLoading(false);
      } catch (err) {
        console.error("useCurrentUser fetch /api/me hiba:", err);
        setAuthError("Hálózati hiba");
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, loading, authError };
}
