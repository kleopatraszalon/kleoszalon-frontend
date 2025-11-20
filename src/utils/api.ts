// src/utils/api.ts

import apiFetchRaw, {
  fetchJSON,
  fetchArray,
  safeJson,
  safeParse,
  toArray,
  getBaseUrl,
  withBase,
  authHeaders,
} from "./fetch";

// Re-export helper függvények, hogy a régi importok is működjenek:
export {
  fetchJSON,
  fetchArray,
  safeJson,
  safeParse,
  toArray,
  getBaseUrl,
  withBase,
  authHeaders,
};

// Alacsony szintű default export: Response-t ad vissza (ha valahol erre számítasz)
export default apiFetchRaw;

/**
 * Magasabb szintű helper:
 *  - ugyanazt a `apiFetchRaw`-t használja, mint a fetch.ts-ben
 *  - automatikusan `credentials: "include"`-dal hívja, hogy a "token" süti menjen
 *  - JSON-t próbál visszaadni generikus T típussal
 *  - 204 / üres body esetén `null`-t ad vissza
 *  - ha nem JSON a válasz, sima szövegként adja vissza
 */
export async function apiFetch<T = any>(
  input: string | Request,
  init?: RequestInit
): Promise<T> {
  // 🔹 mindig küldjük a sütiket (token cookie miatt fontos)
  const res = await apiFetchRaw(input, {
    credentials: "include",
    ...(init || {}),
  });

  // 204 No Content → nincs mit parsolni
  if (res.status === 204) {
    return null as T;
  }

  const text = await res.text();

  // üres body
  if (!text) {
    return null as T;
  }

  // Próbáljuk JSON-ként értelmezni
  try {
    return JSON.parse(text) as T;
  } catch (err) {
    console.warn("apiFetch: nem JSON válasz, sima szövegként adom vissza", {
      input,
      status: res.status,
      text,
    });

    // ha nem JSON, adjuk vissza a textet
    return text as unknown as T;
  }
}
