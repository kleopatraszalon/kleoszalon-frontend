// frontend/src/utils/fetch.ts
// Robust fetch helpers: base URL handling, auth headers, safe JSON parsing, array normalization.

// --- Base URL (supports CRA and Vite) ---
const API_BASE: string =
  (typeof process !== "undefined" && (process as any)?.env?.REACT_APP_API_BASE) ||
  (typeof import.meta !== "undefined" && (import.meta as any)?.env?.VITE_API_BASE) ||
  "";

// Prefix relative API paths with API_BASE if provided
export function withBase(path: string): string {
  if (!API_BASE) return path;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  // Ensure single slash between base and path
  return API_BASE.replace(/\/+$/, "") + "/" + path.replace(/^\/+/, "");
}

// --- Auth headers ---
export function authHeaders(): HeadersInit {
  try {
    const token = typeof window !== "undefined" ? window.localStorage.getItem("token") : null;
    const headers: Record<string, string> = { Accept: "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
  } catch {
    return { Accept: "application/json" };
  }
}

// --- Safe JSON parse ---
export function safeJson<T>(txt: string, fallback: T): T {
  try {
    return JSON.parse(txt) as T;
  } catch {
    return fallback;
  }
}

// --- Normalize to array ---
export function toArray<T>(x: unknown): T[] {
  if (Array.isArray(x)) return x as T[];
  if (x && typeof x === "object") {
    const anyx: any = x;
    if (Array.isArray(anyx.items)) return anyx.items as T[];
    if (Array.isArray(anyx.data))  return anyx.data  as T[];
    const vals = Object.values(anyx);
    if (vals.length && vals.every((v) => typeof v === "object")) return vals as T[];
  }
  return [];
}

// --- apiFetch wrapper ---
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const url = withBase(input);
  // Merge/normalize headers
  const base = authHeaders();
  const passed = (init.headers || {}) as HeadersInit;
  let headers: HeadersInit;
  // Safely merge Record<string,string> variants
  if (Array.isArray(passed)) {
    headers = new Headers(base);
    for (const [k, v] of passed) (headers as any).append(k, v as any);
  } else if (passed instanceof Headers) {
    headers = new Headers(base);
    (passed as Headers).forEach((v, k) => (headers as any).set(k, v));
  } else {
    headers = { ...base, ...(passed as Record<string, string>) };
  }
  return fetch(url, {
    credentials: "include",
    cache: "no-store",
    ...init,
    headers,
  });
}

// --- Helpers: fetch and decode JSON / array ---
export async function fetchJSON<T>(path: string, init?: RequestInit, fallback?: T): Promise<T> {
  const res = await apiFetch(path, init);
  const txt = await res.text();
  return safeJson<T>(txt, (fallback as T | undefined) ?? ({} as T));
}

export async function fetchArray<T>(path: string, init?: RequestInit): Promise<T[]> {
  const res = await apiFetch(path, init);
  const txt = await res.text();
  const raw = safeJson<any>(txt, []);
  return toArray<T>(raw);
}
