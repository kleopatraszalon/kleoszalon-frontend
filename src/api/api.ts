import axios from "axios";

function norm(v?: string) {
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
  if (host === "kleoszalon-frontend.onrender.com") {
    return "https://kleoszalon-api-1.onrender.com";
  }
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

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("kleo_token") || localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      console.warn("API 401: a munkamenet lejárt vagy a token hiányzik.");
    }
    return Promise.reject(error);
  }
);

export default api;
