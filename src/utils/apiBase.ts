// src/utils/apiBase.ts
// CRA-val: hagyd üresen az env BASE-t és használj proxy-t (2. lépés)
// Vite-tal: VITE_API_BASE-t adj meg, pl. http://localhost:5000
const viteBase =
  (typeof import.meta !== "undefined" && (import.meta as any)?.env?.VITE_API_BASE) || "";
const craBase =
  (typeof process !== "undefined" && (process as any)?.env?.REACT_APP_API_BASE) || "";

// Ha nincs BASE megadva, hagyjuk relatívnak a /api utat (proxy kezeli)
const BASE = String(viteBase || craBase || "").replace(/\/$/, "");

export default function withBase(path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!BASE) return p;                // proxy mód (CRA)
  if (/^https?:\/\//i.test(p)) return p;
  return `${BASE}${p}`;               // direkt backend elérés (Vite/CRA env-vel)
}
