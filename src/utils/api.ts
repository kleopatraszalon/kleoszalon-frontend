// File: frontend/src/utils/api.ts
// Purpose: shared fetch helpers with strict HeadersInit typing
// Generated: 2025-11-12 16:21
export function authHeaders(token?: string): HeadersInit {
  const h: Record<string,string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h; // Always a Record<string,string>, safe for fetch
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers: HeadersInit = { ...authHeaders(), ...(init.headers || {}) };
  return fetch(path, { ...init, headers, credentials: "include", cache: "no-store" });
}
