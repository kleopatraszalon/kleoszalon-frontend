// Backward-compatible API entry point.
// All frontend code must use the canonical client from src/api/api.ts so that
// origin detection, /api prefixing, auth headers and credential handling stay
// identical across the VIR admin and mobile/PWA surfaces.
export { default } from "./api/api";
