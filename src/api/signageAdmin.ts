import api from "./api";

/**
 * Frontend (browser) API client for the Signage Admin module.
 *
 * IMPORTANT:
 *  - This file MUST NOT import Node-only modules (express, crypto, fs, db, etc.)
 *  - Only use HTTP calls to the backend.
 */

// -----------------------------
// Types
// -----------------------------
export type SignageService = {
  id: string;
  name: string;
  category?: string | null;
  duration_min?: number | null;
  price_text?: string | null;
  priority?: number | null;
  show?: boolean | null; // whether to show on signage
  // optional override fields if backend returns them
  enabled?: boolean | null;
  price_text_override?: string | null;
  priority_override?: number | null;
};

export type Deal = {
  id: string;
  title: string;
  subtitle?: string | null;
  price_text?: string | null;
  valid_from?: string | null; // YYYY-MM-DD
  valid_to?: string | null;   // YYYY-MM-DD
  priority?: number | null;
  active?: boolean | null;
};

export type Professional = {
  id: string;
  name: string;
  title?: string | null;
  note?: string | null;

  // UI mezők (admin + kijelző)
  photo_url?: string | null;
  show?: boolean | null;

  // „szabad” állapot (régi: available, új: is_free)
  is_free?: boolean | null;
  available?: boolean | null;

  priority?: number | null;
};

export type VideoItem = {
  id: string;
  youtube_id: string;
  title?: string | null;
  duration_sec?: number | null;

  enabled?: boolean | null;
  priority?: number | null;
};


export type FlashPromo = {
      id: string;
      title: string;
      body: string;
      start_at?: string | null;
      end_at?: string | null;
      enabled?: boolean;
      priority?: number;
      created_at?: string;
      updated_at?: string;
    };

export type QuoteCategory = "fitness" | "beauty" | "general";

export type Quote = {
  id: string;
  category: QuoteCategory;
  text: string;
  author?: string | null;
  priority?: number | null;
  active?: boolean | null;
};

// -----------------------------
// Helpers
// -----------------------------
function pickArray<T>(data: any, keys: string[]): T[] {
  for (const k of keys) {
    const v = data?.[k];
    if (Array.isArray(v)) return v as T[];
  }
  return [];
}

function pickOne<T>(data: any, keys: string[]): T | null {
  for (const k of keys) {
    const v = data?.[k];
    if (v) return v as T;
  }
  return null;
}

// -----------------------------
// Services
// -----------------------------
export async function listSignageServices(): Promise<SignageService[]> {
  const res = await api.get("/admin/signage/services");
  return pickArray<SignageService>(res.data, ["services", "items", "rows"]);
}

export async function createSignageService(payload: Partial<SignageService>) {
  const res = await api.post("/admin/signage/services", payload);
  return pickOne<SignageService>(res.data, ["service", "item", "row"]) ?? res.data;
}

export async function updateSignageService(id: string, payload: Partial<SignageService>) {
  const res = await api.put(`/admin/signage/services/${encodeURIComponent(id)}`, payload);
  return pickOne<SignageService>(res.data, ["service", "item", "row"]) ?? res.data;
}

export async function deleteSignageService(id: string) {
  const res = await api.delete<{ ok?: boolean }>(`/admin/signage/services/${encodeURIComponent(id)}`);
  return res.data?.ok ?? true;
}

// Optional: override endpoint (if used by your UI)
export async function upsertServiceOverride(
  id: string,
  payload: { enabled?: boolean; price_text_override?: string | null; priority?: number | null }
) {
  const res = await api.put(`/admin/signage/services/${encodeURIComponent(id)}/override`, payload);
  return res.data;
}

// -----------------------------
// Deals
// -----------------------------
export async function listDeals(): Promise<Deal[]> {
  const res = await api.get("/admin/signage/deals");
  return pickArray<Deal>(res.data, ["deals", "items", "rows"]);
}

export async function createDeal(payload: Partial<Deal>) {
  const res = await api.post("/admin/signage/deals", payload);
  return pickOne<Deal>(res.data, ["deal", "item", "row"]) ?? res.data;
}

export async function updateDeal(id: string, payload: Partial<Deal>) {
  const res = await api.put(`/admin/signage/deals/${encodeURIComponent(id)}`, payload);
  return pickOne<Deal>(res.data, ["deal", "item", "row"]) ?? res.data;
}

export async function deleteDeal(id: string) {
  const res = await api.delete<{ ok?: boolean }>(`/admin/signage/deals/${encodeURIComponent(id)}`);
  return res.data?.ok ?? true;
}

// -----------------------------
// Professionals
// -----------------------------
export async function listProfessionals(): Promise<Professional[]> {
  const res = await api.get("/admin/signage/professionals");
  return pickArray<Professional>(res.data, ["professionals", "items", "rows"]);
}

export async function createProfessional(payload: Partial<Professional>) {
  const res = await api.post("/admin/signage/professionals", payload);
  return pickOne<Professional>(res.data, ["professional", "item", "row"]) ?? res.data;
}

export async function updateProfessional(id: string, payload: Partial<Professional>) {
  const res = await api.put(`/admin/signage/professionals/${encodeURIComponent(id)}`, payload);
  return pickOne<Professional>(res.data, ["professional", "item", "row"]) ?? res.data;
}

export async function deleteProfessional(id: string) {
  const res = await api.delete<{ ok?: boolean }>(`/admin/signage/professionals/${encodeURIComponent(id)}`);
  return res.data?.ok ?? true;
}

// Kép feltöltés szakemberhez (backend: /api/admin/signage/professionals/:id/photo)
export async function uploadProfessionalPhoto(id: string, file: File) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await api.post(`/admin/signage/professionals/${encodeURIComponent(id)}/photo`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

// -----------------------------
// Videos
// -----------------------------
export async function listVideos(): Promise<VideoItem[]> {
  const res = await api.get("/admin/signage/videos");
  return pickArray<VideoItem>(res.data, ["videos", "items", "rows"]);
}

export async function createVideo(payload: Partial<VideoItem>) {
  const res = await api.post("/admin/signage/videos", payload);
  return pickOne<VideoItem>(res.data, ["video", "item", "row"]) ?? res.data;
}

export async function updateVideo(id: string, payload: Partial<VideoItem>) {
  const res = await api.put(`/admin/signage/videos/${encodeURIComponent(id)}`, payload);
  return pickOne<VideoItem>(res.data, ["video", "item", "row"]) ?? res.data;
}

export async function deleteVideo(id: string) {
  const res = await api.delete<{ ok?: boolean }>(`/admin/signage/videos/${encodeURIComponent(id)}`);
  return res.data?.ok ?? true;
}

// -----------------------------
// Quotes
// -----------------------------
export async function listQuotes(): Promise<Quote[]> {
  const res = await api.get("/admin/signage/quotes");
  return pickArray<Quote>(res.data, ["quotes", "items", "rows"]);
}

export async function createQuote(payload: Partial<Quote>) {
  const res = await api.post("/admin/signage/quotes", payload);
  return pickOne<Quote>(res.data, ["quote", "item", "row"]) ?? res.data;
}

export async function updateQuote(id: string, payload: Partial<Quote>) {
  const res = await api.put(`/admin/signage/quotes/${encodeURIComponent(id)}`, payload);
  return pickOne<Quote>(res.data, ["quote", "item", "row"]) ?? res.data;
}

export async function deleteQuote(id: string) {
  const res = await api.delete<{ ok?: boolean }>(`/admin/signage/quotes/${encodeURIComponent(id)}`);
  return res.data?.ok ?? true;
}


// ----------------------------
// Villám akciók (admin)
// ----------------------------
export async function listFlashPromos(): Promise<FlashPromo[]> {
  const res = await api.get<{ flashPromos: FlashPromo[] }>("/admin/signage/flash-promos");
  return res.data?.flashPromos ?? [];
}

export async function createFlashPromo(payload: Partial<FlashPromo>) {
  const res = await api.post<{ flashPromo: FlashPromo }>("/admin/signage/flash-promos", payload);
  return res.data?.flashPromo;
}

export async function updateFlashPromo(id: string, payload: Partial<FlashPromo>) {
  const res = await api.put<{ flashPromo: FlashPromo }>(`/admin/signage/flash-promos/${id}`, payload);
  return res.data?.flashPromo;
}

export async function deleteFlashPromo(id: string) {
  const res = await api.delete<{ ok: boolean }>(`/admin/signage/flash-promos/${id}`);
  return !!res.data?.ok;
}

// ----------------------------
// Névnap üzenet sablon (admin)
// ----------------------------
export async function getNamedayTemplate(): Promise<string> {
  const res = await api.get<{ template: string }>("/admin/signage/nameday-template");
  return res.data?.template ?? "";
}

export async function setNamedayTemplate(template: string) {
  const res = await api.put<{ ok: boolean; template: string }>("/admin/signage/nameday-template", { template });
  return res.data;
}
