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
 *  - tehát:
 *      • automatikus Authorization header (token / kleo_token)
 *      • API_BASE / REACT_APP_API_BASE figyelembevétele
 *      • ugyanaz az "API hiba: ..." hibaüzenet
 *  - viszont itt már JSON-t adunk vissza generikus T típussal
 */
export async function apiFetch<T>(
  input: string | Request,
  init?: RequestInit
): Promise<T> {
  const res = await apiFetchRaw(input, init || {});
  const text = await res.text();

  if (!text) {
    // ha üres a body, adunk egy "üres" értéket
    return {} as T;
  }

  return JSON.parse(text) as T;
}
