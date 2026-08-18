// src/utils/fetch.ts
import { idempotencyKeyFor } from "./financialIdempotency";
import { hasStoredAuthToken } from "./authSession";

const rawBase =
  (process.env.REACT_APP_API_BASE as string | undefined) ||
  (process.env.REACT_APP_API_URL as string | undefined) ||
  "";

const defaultBase =
  typeof window !== "undefined" && window.location && window.location.origin
    ? window.location.origin
    : "";

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

  if (lowerBase.endsWith("/api") && lowerPath.startsWith("/api/")) {
    p = p.slice(4);
  }

  return base + p;
}

/**
 * Legacy name kept for compatibility. Authentication is no longer returned
 * here; the browser credential is the HttpOnly cookie and the custom header is
 * only a CSRF/browser-origin signal allowed by the API CORS policy.
 */
export function authHeaders(): Record<string, string> {
  hasStoredAuthToken();
  return { "X-Requested-With": "XMLHttpRequest" };
}

function parsedBody(init:RequestInit){
  if(typeof init.body!=="string")return null;
  try{return JSON.parse(init.body)}catch{return null}
}

export async function apiFetch(
  input: string | Request,
  init: RequestInit = {}
): Promise<Response> {
  const url = typeof input === "string" ? withBase(input) : input;

  const headers = new Headers(typeof input === "string" ? undefined : input.headers);
  new Headers(init.headers).forEach((value,key)=>headers.set(key,value));
  Object.entries(authHeaders()).forEach(([key,value])=>headers.set(key,value));
  headers.delete("Authorization");
  const requestMethod=init.method||(typeof input === "string" ? "GET" : input.method);
  const idempotencyKey=idempotencyKeyFor(typeof url === "string" ? url : url.url,requestMethod);
  if(idempotencyKey&&!headers.has("Idempotency-Key"))headers.set("Idempotency-Key",idempotencyKey);

  const res = await fetch(url as RequestInfo, { ...init, credentials: "include", headers });

  if (!res.ok) {
    let msg = `${res.status} ${res.statusText}`;
    let data:any=null;
    try {
      data = await res.json();
      if (data && data.error) {
        msg = data.error;
        if (data.detail) msg += ` — ${data.detail}`;
      }
      else if (data && data.message) msg = data.message;
    } catch {
      // ignore JSON parse error
    }

    // A pénztári műszak hiánya nem teheti használhatatlanná a végleges munkalaplezárást.
    // A normál pénztári útvonal marad az elsődleges; kizárólag a 409-es műszakblokkolásnál,
    // és csak close_financially=true esetén használjuk az auditált recovery végpontot.
    const requestUrl=typeof url==="string"?url:String((url as Request)?.url||"");
    const match=requestUrl.match(/\/transactions\/(?:loyalty-)?cashier\/workorders\/([^/?]+)\/settle/i);
    const body=parsedBody(init);
    const shiftBlocked=res.status===409&&/(pénztár|műszak|nyitópénz|átadás)/i.test(String(msg));
    if(match&&shiftBlocked&&body?.close_financially===true){
      const recovery=withBase(`/api/workorders/${encodeURIComponent(decodeURIComponent(match[1]))}/settle-recovery`);
      const recoveryHeaders=new Headers(headers);
      recoveryHeaders.set("X-Kleo-Settlement-Recovery","cashier-shift-409");
      const retry=await fetch(recovery,{...init,credentials:"include",headers:recoveryHeaders});
      if(retry.ok)return retry;
      try{const recoveryData=await retry.json();msg=recoveryData?.message||recoveryData?.error||`${retry.status} ${retry.statusText}`}catch{msg=`${retry.status} ${retry.statusText}`}
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
