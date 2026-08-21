// src/utils/apiBase.ts
// Legacy fetch-based VIR pages still use this helper while newer code uses the
// canonical Axios client. Keep their transport semantics aligned: authenticated
// browser requests must carry the HttpOnly session cookie and an empty obsolete
// Bearer header must never shadow that cookie on the API.

const isLocal =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

const API_ORIGIN = isLocal ? "http://localhost:5000" : "https://kleoszalon-api-1.onrender.com";
const API_BASE = `${API_ORIGIN}/api`;
const FETCH_PATCH_KEY = "__kleoCookieFetchPatched";

function isRequestObject(input: unknown): input is Request {
  return typeof Request !== "undefined" && input instanceof Request;
}

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (typeof URL !== "undefined" && input instanceof URL) return input.toString();
  return isRequestObject(input) ? input.url : String(input);
}

function isKleoApiRequest(input: RequestInfo | URL): boolean {
  const raw = requestUrl(input);
  try {
    const resolved = new URL(raw, window.location.origin);
    return resolved.origin === API_ORIGIN && (resolved.pathname === "/api" || resolved.pathname.startsWith("/api/"));
  } catch {
    return raw.startsWith(API_BASE);
  }
}

function installLegacyCookieFetchCompatibility(): void {
  if (typeof window === "undefined" || typeof window.fetch !== "function") return;
  const state = window as Window & typeof globalThis & { [FETCH_PATCH_KEY]?: boolean };
  if (state[FETCH_PATCH_KEY]) return;

  const nativeFetch = window.fetch.bind(window);
  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    if (!isKleoApiRequest(input)) return nativeFetch(input, init);

    const inheritedHeaders = isRequestObject(input) ? input.headers : undefined;
    const headers = new Headers(init?.headers ?? inheritedHeaders);
    const authorization = headers.get("Authorization");

    // Several legacy pages still construct `Authorization: Bearer ` after the
    // migration to cookie-only sessions. The backend correctly treats that as no
    // token; remove only the empty value so the HttpOnly cookie can authenticate.
    if (authorization && /^Bearer\s*$/i.test(authorization)) {
      headers.delete("Authorization");
    }

    return nativeFetch(input, {
      ...init,
      credentials: "include",
      headers,
    });
  }) as typeof window.fetch;

  state[FETCH_PATCH_KEY] = true;
}

installLegacyCookieFetchCompatibility();

const withBase = (path: string) => `${API_BASE}/${path.replace(/^\/+/, "")}`;

export default withBase;
