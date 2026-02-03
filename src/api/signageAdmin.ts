import api from "../api";

export type SignageService = {
  id: string;
  name: string;
  category: string;
  duration_min: number | null;
  price_text: string;
  show: boolean;
  priority: number;
};

export type Deal = {
  id: string;
  title: string;
  subtitle: string;
  price_text: string;
  valid_from: string | null;
  valid_to: string | null;
  active: boolean;
  priority: number;
};

export type Professional = {
  id: string;
  name: string;
  title: string;
  note: string;
  photo_url: string;
  show: boolean;
  available: boolean;
  priority: number;
};

export type Quote = {
  id: string;
  category: "fitness" | "beauty" | "general";
  text: string;
  author: string;
  active: boolean;
  priority: number;
};

export type VideoItem = {
  id: string;
  youtube_id: string;
  title: string;
  enabled: boolean;
  priority: number;
  duration_sec: number;
};

/**
 * FONTOS:
 * A projekt axios baseURL-je gyakran már tartalmazza az "/api" prefixet.
 * Ezért itt NEM használunk "/api/..." kezdetű URL-eket, különben "/api/api/..." lesz belőle.
 */

// Services
export async function listSignageServices(): Promise<SignageService[]> {
  const r = await api.get<{ services: SignageService[] }>("/admin/signage/services");
  return r.data?.services ?? [];
}
export async function createSignageService(payload: Partial<SignageService>) {
  const r = await api.post<{ service: SignageService }>("/admin/signage/services", payload);
  return r.data?.service;
}
export async function updateSignageService(id: string, payload: Partial<SignageService>) {
  const r = await api.put<{ service: SignageService }>(`/admin/signage/services/${id}`, payload);
  return r.data?.service;
}
export async function deleteSignageService(id: string) {
  const r = await api.delete<{ ok: boolean }>(`/admin/signage/services/${id}`);
  return r.data?.ok;
}

// Deals
export async function listDeals(): Promise<Deal[]> {
  const r = await api.get<{ deals: Deal[] }>("/admin/signage/deals");
  return r.data?.deals ?? [];
}
export async function createDeal(payload: Partial<Deal>) {
  const r = await api.post<{ deal: Deal }>("/admin/signage/deals", payload);
  return r.data?.deal;
}
export async function updateDeal(id: string, payload: Partial<Deal>) {
  const r = await api.put<{ deal: Deal }>(`/admin/signage/deals/${id}`, payload);
  return r.data?.deal;
}
export async function deleteDeal(id: string) {
  const r = await api.delete<{ ok: boolean }>(`/admin/signage/deals/${id}`);
  return r.data?.ok;
}

// Professionals
export async function listProfessionals(): Promise<Professional[]> {
  const r = await api.get<{ professionals: Professional[] }>("/admin/signage/professionals");
  return r.data?.professionals ?? [];
}
export async function createProfessional(payload: Partial<Professional>) {
  const r = await api.post<{ professional: Professional }>("/admin/signage/professionals", payload);
  return r.data?.professional;
}
export async function updateProfessional(id: string, payload: Partial<Professional>) {
  const r = await api.put<{ professional: Professional }>(`/admin/signage/professionals/${id}`, payload);
  return r.data?.professional;
}
export async function deleteProfessional(id: string) {
  const r = await api.delete<{ ok: boolean }>(`/admin/signage/professionals/${id}`);
  return r.data?.ok;
}

// Quotes
export async function listQuotes(): Promise<Quote[]> {
  const r = await api.get<{ quotes: Quote[] }>("/admin/signage/quotes");
  return r.data?.quotes ?? [];
}
export async function createQuote(payload: Partial<Quote>) {
  const r = await api.post<{ quote: Quote }>("/admin/signage/quotes", payload);
  return r.data?.quote;
}
export async function updateQuote(id: string, payload: Partial<Quote>) {
  const r = await api.put<{ quote: Quote }>(`/admin/signage/quotes/${id}`, payload);
  return r.data?.quote;
}
export async function deleteQuote(id: string) {
  const r = await api.delete<{ ok: boolean }>(`/admin/signage/quotes/${id}`);
  return r.data?.ok;
}

// Videos
export async function listVideos(): Promise<VideoItem[]> {
  const r = await api.get<{ videos: VideoItem[] }>("/admin/signage/videos");
  return r.data?.videos ?? [];
}
export async function createVideo(payload: Partial<VideoItem>) {
  const r = await api.post<{ video: VideoItem }>("/admin/signage/videos", payload);
  return r.data?.video;
}
export async function updateVideo(id: string, payload: Partial<VideoItem>) {
  const r = await api.put<{ video: VideoItem }>(`/admin/signage/videos/${id}`, payload);
  return r.data?.video;
}
export async function deleteVideo(id: string) {
  const r = await api.delete<{ ok: boolean }>(`/admin/signage/videos/${id}`);
  return r.data?.ok;
}
