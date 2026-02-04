import axios from "axios";

/**
 * Frontend Axios instance (CRA / webpack) – NO Node polyfills.
 *
 * Priority:
 *  1) REACT_APP_API_ORIGIN / REACT_APP_API_URL (e.g. https://kleoszalon-api-jon.onrender.com)
 *  2) Auto-detect by hostname (Render frontend -> Render API)
 *  3) Local dev -> http://localhost:5000
 *  4) Fallback -> window.location.origin
 */
function norm(v?: string) {
  // normalize: remove trailing slashes AND a trailing "/api" if the user accidentally includes it
  return (v ?? "")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api\/?$/, "");
}

function detectApiOrigin(): string {
  const env =
    norm(process.env.REACT_APP_API_ORIGIN) ||
    norm(process.env.REACT_APP_API_URL);

  if (env) return env;

  const host = window.location.hostname;

  // Render frontend -> Render backend
  if (host === "kleoszalon-frontend.onrender.com") {
    return "https://kleoszalon-api-jon.onrender.com";
  }

  // Local dev default
  if (host === "localhost" || host === "127.0.0.1") {
    return "http://localhost:5000";
  }

  return norm(window.location.origin) || "";
}

const apiOrigin = detectApiOrigin();
const baseURL = apiOrigin ? `${apiOrigin}/api` : "/api";

const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export default api;
