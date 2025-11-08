// src/utils/apiBase.ts
// FEJLESZTÉSBEN: minden API hívás a 5000-es backendre megy.
//
//   Backend:  http://localhost:5000
//   API:      http://localhost:5000/api/...

const API_BASE = "http://localhost:5000/api";

/**
 * Alap API URL (ha valahol csak ez kell)
 */
export const apiBase = (): string => API_BASE;

/**
 * withBase("login")       -> http://localhost:5000/api/login
 * withBase("verify-code") -> http://localhost:5000/api/verify-code
 * withBase("me")          -> http://localhost:5000/api/me
 *
 * FONTOS:
 * - I DE   N E   ADJ   OLYAT, HOGY "api/..."  (pl. "api/login")!
 *   Mindig csak a végpontot add: "login", "verify-code", "me", "dashboard", "locations" stb.
 */
export const withBase = (path: string = ""): string => {
  const clean = String(path).replace(/^\/+/, ""); // levágjuk az elején a /-t
  return clean ? `${API_BASE}/${clean}` : API_BASE;
};

// A legtöbb helyen default importtal használjuk:
export default withBase;
