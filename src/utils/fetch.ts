// src/utils/fetch.ts

const rawBase =
  (process.env.REACT_APP_API_BASE as string | undefined) ||
  (process.env.REACT_APP_API_URL as string | undefined) ||
  "";

const defaultBase =
  typeof window !== "undefined" && window.location && window.location.origin
    ? window.location.origin
    : "";

// Ha nincs env-ben API base, akkor same-origin
const API_BASE = (rawBase || defaultBase || "").replace(/\/+$/, "");

export function getBaseUrl(): string {
  return API_BASE;
}

export function withBase(path: string): string {
  const base = API_BASE;
  if (!path) return base;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;

  let p = path;
  if (!p.startsWith("/")) p = "/" + p;

  const lowerBase = base.toLowerCase();
  const lowerPath = p.toLowerCase();

  // Ha a BASE már /api-ra végződik, és az útvonal is /api/-val indul,
  // akkor az útvonal elejéről levesszük a /api-t, hogy ne legyen duplikáció (/api/api/...).
  if (lowerBase.endsWith("/api") && lowerPath.startsWith("/api/")) {
    p = p.slice(4); // "/api" = 4 karakter
  }

  return base + p;
}

export function authHeaders(): Record<string, string> {
  try {
    // 🔹 Itt volt a gond: csak "token"-t nézett
    const token =
      localStorage.getItem("token") || localStorage.getItem("kleo_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  } catch {
    return {};
  }
}

export async function apiFetch(
  input: string | Request,
  init: RequestInit = {}
): Promise<Response> {
  const url = typeof input === "string" ? withBase(input) : input;

  const headers: HeadersInit = {
    ...(init.headers || {}),
    ...authHeaders(),
  };

  const res = await fetch(url as RequestInfo, { ...init, headers });

  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    try {
      const data = await res.json();
      if (data && (data as any).error) msg = (data as any).error;
      else if (data && (data as any).message) msg = (data as any).message;
    } catch {
      // ignore JSON parse error
    }
    throw new Error(`API hiba: ${msg}`);
  }

  return res;
}

export function safeJson<T>(text: string, fallback: T): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    return fallback;
  }
}

export function safeParse<T>(text: string, fallback: T): T {
  return safeJson(text, fallback);
}

export function toArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (!value) return [];
  const v: any = value;
  if (Array.isArray(v.data)) return v.data as T[];
  if (Array.isArray(v.items)) return v.items as T[];
  return [];
}

export async function fetchJSON<T>(
  input: string | Request,
  init?: RequestInit,
  fallback?: T
): Promise<T> {
  try {
    const res = await apiFetch(input, init || {});
    const text = await res.text();
    if (fallback === undefined) {
      return JSON.parse(text) as T;
    }
    return safeJson<T>(text, fallback);
  } catch (err: any) {
    const msg = String(err?.message || "");
    if ((msg.includes("404") || msg.toLowerCase().includes("not found")) && fallback !== undefined) {
      return fallback;
    }
    throw err;
  }
}

export async function fetchArray<T>(
  input: string | Request,
  init?: RequestInit
): Promise<T[]> {
  try {
    const res = await apiFetch(input, init || {});
    const text = await res.text();
    const raw = safeJson<unknown>(text, []);
    return toArray<T>(raw);
  } catch (err: any) {
    const msg = String(err?.message || "");
    if (msg.includes("404") || msg.toLowerCase().includes("not found")) {
      return [];
    }
    throw err;
  }
}

export default apiFetch;
