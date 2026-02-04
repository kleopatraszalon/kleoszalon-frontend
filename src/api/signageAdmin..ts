import api from "./api";
import type { AxiosResponse } from "axios";

/**
 * Frontend (browser) API client for Signage Admin.
 * IMPORTANT: This file MUST NOT import any Node modules (express, crypto, fs, db, etc.)
 */

// -------------------- Types --------------------
export type Id = string;

export interface SignageService {
  id: Id;
  name: string;
  category?: string | null;
  duration_min?: number | null;
  price_text?: string | null;
  show?: boolean | null;
  priority?: number | null;

  // optional override fields (if you use them in UI)
  enabled?: boolean | null;
  price_text_override?: string | null;
}

export interface Deal {
  id: Id;
  title: string;
  subtitle?: string | null;
  price_text?: string | null;
  valid_from?: string | null; // YYYY-MM-DD
  valid_to?: string | null;   // YYYY-MM-DD
  active?: boolean | null;
  priority?: number | null;
}

export interface Professional {
  id: Id;
  name: string;
  title?: string | null;
  note?: string | null;

  // UI expects these:
  photo_url?: string | null;
  show?: boolean | null;
  available?: boolean | null;
  priority?: number | null;
}

export interface VideoItem {
  id: Id;
  youtube_id: string;
  title?: string | null;
  enabled?: boolean | null;
  duration_sec?: number | null;

  // UI expects this:
  priority?: number | null;
}

export type QuoteCategory = "fitness" | "beauty" | "general" | string;

export interface Quote {
  id: Id;
  category: QuoteCategory;
  text: string;
  author?: string | null;
  active?: boolean | null;
  priority?: number | null;
}

// -------------------- Helpers --------------------
function pickList<T>(data: any, key: string): T[] {
  const v = data?.[key];
  if (Array.isArray(v)) return v as T[];
  if (Array.isArray(data)) return data as T[];
  return [];
}

function pickOne<T>(data: any, key: string): T | null {
  const v = data?.[key];
  if (v && typeof v === "object") return v as T;
  if (data && typeof data === "object") return data as T;
  return null;
}

// -------------------- Services --------------------
export async function listSignageServices(): Promise<SignageService[]> {
  const res: AxiosResponse<any> = await api.get("/admin/signage/services");
  return pickList<SignageService>(res.data, "services");
}

export async function createSignageService(payload: Partial<SignageService>): Promise<SignageService | null> {
  const res: AxiosResponse<any> = await api.post("/admin/signage/services", payload);
  return pickOne<SignageService>(res.data, "service");
}

export async function updateSignageService(id: string, payload: Partial<SignageService>): Promise<SignageService | null> {
  const res: AxiosResponse<any> = await api.put(`/admin/signage/services/${id}`, payload);
  return pickOne<SignageService>(res.data, "service");
}

export async function deleteSignageService(id: string): Promise<boolean> {
  const res: AxiosResponse<any> = await api.delete(`/admin/signage/services/${id}`);
  return Boolean(res.data?.ok ?? true);
}

// -------------------- Deals --------------------
export async function listDeals(): Promise<Deal[]> {
  const res: AxiosResponse<any> = await api.get("/admin/signage/deals");
  return pickList<Deal>(res.data, "deals");
}

export async function createDeal(payload: Partial<Deal>): Promise<Deal | null> {
  const res: AxiosResponse<any> = await api.post("/admin/signage/deals", payload);
  return pickOne<Deal>(res.data, "deal");
}

export async function updateDeal(id: string, payload: Partial<Deal>): Promise<Deal | null> {
  const res: AxiosResponse<any> = await api.put(`/admin/signage/deals/${id}`, payload);
  return pickOne<Deal>(res.data, "deal");
}

export async function deleteDeal(id: string): Promise<boolean> {
  const res: AxiosResponse<any> = await api.delete(`/admin/signage/deals/${id}`);
  return Boolean(res.data?.ok ?? true);
}

// -------------------- Professionals --------------------
export async function listProfessionals(): Promise<Professional[]> {
  const res: AxiosResponse<any> = await api.get("/admin/signage/professionals");
  return pickList<Professional>(res.data, "professionals");
}

export async function createProfessional(payload: Partial<Professional>): Promise<Professional | null> {
  const res: AxiosResponse<any> = await api.post("/admin/signage/professionals", payload);
  return pickOne<Professional>(res.data, "professional");
}

export async function updateProfessional(id: string, payload: Partial<Professional>): Promise<Professional | null> {
  const res: AxiosResponse<any> = await api.put(`/admin/signage/professionals/${id}`, payload);
  return pickOne<Professional>(res.data, "professional");
}

export async function deleteProfessional(id: string): Promise<boolean> {
  const res: AxiosResponse<any> = await api.delete(`/admin/signage/professionals/${id}`);
  return Boolean(res.data?.ok ?? true);
}

// -------------------- Videos --------------------
export async function listVideos(): Promise<VideoItem[]> {
  const res: AxiosResponse<any> = await api.get("/admin/signage/videos");
  return pickList<VideoItem>(res.data, "videos");
}

export async function createVideo(payload: Partial<VideoItem>): Promise<VideoItem | null> {
  const res: AxiosResponse<any> = await api.post("/admin/signage/videos", payload);
  return pickOne<VideoItem>(res.data, "video");
}

export async function updateVideo(id: string, payload: Partial<VideoItem>): Promise<VideoItem | null> {
  const res: AxiosResponse<any> = await api.put(`/admin/signage/videos/${id}`, payload);
  return pickOne<VideoItem>(res.data, "video");
}

export async function deleteVideo(id: string): Promise<boolean> {
  const res: AxiosResponse<any> = await api.delete(`/admin/signage/videos/${id}`);
  return Boolean(res.data?.ok ?? true);
}

// -------------------- Quotes --------------------
export async function listQuotes(): Promise<Quote[]> {
  const res: AxiosResponse<any> = await api.get("/admin/signage/quotes");
  return pickList<Quote>(res.data, "quotes");
}

export async function createQuote(payload: Partial<Quote>): Promise<Quote | null> {
  const res: AxiosResponse<any> = await api.post("/admin/signage/quotes", payload);
  return pickOne<Quote>(res.data, "quote");
}

export async function updateQuote(id: string, payload: Partial<Quote>): Promise<Quote | null> {
  const res: AxiosResponse<any> = await api.put(`/admin/signage/quotes/${id}`, payload);
  return pickOne<Quote>(res.data, "quote");
}

export async function deleteQuote(id: string): Promise<boolean> {
  const res: AxiosResponse<any> = await api.delete(`/admin/signage/quotes/${id}`);
  return Boolean(res.data?.ok ?? true);
}
