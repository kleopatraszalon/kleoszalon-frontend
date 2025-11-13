// frontend/src/utils/api.ts
// Compatibility shim: re-export from fetch.ts so existing imports keep working.
export { withBase, authHeaders, safeJson, toArray, apiFetch, fetchJSON, fetchArray } from "./fetch";
