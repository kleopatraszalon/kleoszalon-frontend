// src/utils/fetch.ts
import { idempotencyKeyFor } from "./financialIdempotency";
import {
  clearLocalAuthenticatedSession,
  getSessionBearerToken,
  hasStoredAuthToken,
} from "./authSession";

function normalizeBase(value?: string): string {
  return String(value || "").trim().replace(/\/+$/, "");
}

function detectApiBase(): string {
  const configured =
    normalizeBase(process.env.REACT_APP_API_ORIGIN as string | undefined) ||
    normalizeBase(process.env.REACT_APP_API_BASE as string | undefined) ||
    normalizeBase(process.env.REACT_APP_API_URL as string | undefined);
  if (configured) return configured;
  if (typeof window === "undefined") return "";
  const host = window.location.hostname;
  if (host === "kleoszalon-frontend.onrender.com") return "https://kleoszalon-api-1.onrender.com";
  if (host === "localhost" || host === "127.0.0.1") return "http://localhost:5000";
  return normalizeBase(window.location.origin);
}

const API_BASE = detectApiBase();

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

// Kept as a compatibility export for legacy callers. Long-lived/localStorage
// Authorization headers remain forbidden; the canonical request helper may attach
// only the current-tab session bearer when cross-site cookies are unavailable.
export function authHeaders(): Record<string, string> {
  return {};
}

function parsedBody(init:RequestInit){
  if(typeof init.body!=="string")return null;
  try{return JSON.parse(init.body)}catch{return null}
}

function isPublicBookingPage(){
  if(typeof window==="undefined")return false;
  return /^\/(booking|foglalas|idopontfoglalas)(?:\/|$)/.test(window.location.pathname);
}

function isLoginRequest(url:string){return /\/login(?:\?|$)/i.test(url)}

function recoverExpiredSession(requestUrl:string,status:number){
  if(status!==401||isLoginRequest(requestUrl)||isPublicBookingPage()||!hasStoredAuthToken())return;
  clearLocalAuthenticatedSession();
  if(typeof window!=="undefined"&&window.location.pathname!=="/login"){
    window.location.replace("/login?reason=session-expired");
  }
}

export async function apiFetch(
  input: string | Request,
  init: RequestInit = {}
): Promise<Response> {
  const url = typeof input === "string" ? withBase(input) : input;

  const headers = new Headers(typeof input === "string" ? undefined : input.headers);
  new Headers(init.headers).forEach((value,key)=>headers.set(key,value));
  const requestMethod=init.method||(typeof input === "string" ? "GET" : input.method);
  const requestUrl=typeof url==="string"?url:String((url as Request)?.url||"");
  if(!isLoginRequest(requestUrl)&&!headers.has("Authorization")){
    const bearer=getSessionBearerToken();
    if(bearer)headers.set("Authorization",`Bearer ${bearer}`);
  }
  const idempotencyKey=idempotencyKeyFor(requestUrl,requestMethod);
  if(idempotencyKey&&!headers.has("Idempotency-Key"))headers.set("Idempotency-Key",idempotencyKey);

  const res = await fetch(url as RequestInfo, {
    ...init,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    recoverExpiredSession(requestUrl,res.status);
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
    const match=requestUrl.match(/\/transactions\/(?:loyalty-)?cashier\/workorders\/([^/?]+)\/settle/i);
    const body=parsedBody(init);
    const shiftBlocked=res.status===409&&/(pénztár|műszak|nyitópénz|átadás)/i.test(String(msg));
    if(match&&shiftBlocked&&body?.close_financially===true){
      const recovery=withBase(`/api/workorders/${encodeURIComponent(decodeURIComponent(match[1]))}/settle-recovery`);
      const recoveryHeaders=new Headers(headers);
      recoveryHeaders.set("X-Kleo-Settlement-Recovery","cashier-shift-409");
      const retry=await fetch(recovery,{...init,headers:recoveryHeaders,credentials:"include"});
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

export function preferActiveLocation<T>(input: string | Request, items: T[]): T[] {
  const requestUrl = typeof input === "string" ? input : String(input.url || "");
  if (!/\/api\/locations(?:\?|$)/i.test(requestUrl) || typeof window === "undefined") return items;

  let activeLocationId = "";
  try {
    activeLocationId = String(window.localStorage.getItem("kleo_location_id") || "").trim();
  } catch {
    return items;
  }
  if (!activeLocationId) return items;

  const index = items.findIndex((item: any) => String(item?.id || "") === activeLocationId);
  if (index <= 0) return items;
  return [items[index], ...items.slice(0, index), ...items.slice(index + 1)];
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
    return preferActiveLocation(input, toArray<T>(raw));
  } catch (err: any) {
    const msg = String(err?.message || "");
    if (msg.includes("404") || msg.toLowerCase().includes("not found")) {
      return [];
    }
    throw err;
  }
}

export default apiFetch;
