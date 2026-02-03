// src/api.ts
import axios from "axios";

const API_BASE =
  (import.meta as any).env?.VITE_API_URL ||
  (process.env as any).REACT_APP_API_URL ||
  "https://kleoszalon-api-jon.onrender.com";

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
});

// Auth header (Bearer token) automatikus hozzáadása
api.interceptors.request.use((config) => {
  const t = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (t) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${t}`;
  }
  return config;
});

export default api;
