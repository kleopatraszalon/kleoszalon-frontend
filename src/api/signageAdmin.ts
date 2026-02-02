import api from "../api";

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

export type Quote = {
  id: string;
  category: "fitness" | "beauty" | "general";
  text: string;
  author: string;
  active: boolean;
  priority: number;
};

export type ServiceItem = {
  id: string;
  name: string;
  category: string;
  durationMin: number | null;
  price_text: string;
  enabled: boolean;
  priority: number;
};

export type Professional = {
  id: string;
  name: string;
  title: string;
  note: string;
  photo_url: string;
  available: boolean;
  priority: number;
};

type ServicesResp = { services: ServiceItem[] };
type DealsResp = { deals: Deal[] };
type DealResp = { deal: Deal };
type QuotesResp = { quotes: Quote[] };
type QuoteResp = { quote: Quote };
type ProfessionalsResp = { professionals: Professional[] };
type ProfessionalResp = { professional: Professional };
type OkResp = { ok: boolean };

export async function listServices(): Promise<ServiceItem[]> {
  const res = await api.get<ServicesResp>("/api/admin/signage/services");
  return res.data?.services ?? [];
}
export async function upsertServiceOverride(id: string, payload: { enabled?: boolean; price_text_override?: string | null; priority?: number }) {
  const res = await api.put(`/api/admin/signage/services/${id}/override`, payload);
  return res.data;
}

export async function listDeals(): Promise<Deal[]> {
  const res = await api.get<DealsResp>("/api/admin/signage/deals");
  return res.data?.deals ?? [];
}
export async function createDeal(payload: Partial<Deal>) {
  const res = await api.post<DealResp>("/api/admin/signage/deals", payload);
  return res.data?.deal;
}
export async function updateDeal(id: string, payload: Partial<Deal>) {
  const res = await api.put<DealResp>(`/api/admin/signage/deals/${id}`, payload);
  return res.data?.deal;
}
export async function deleteDeal(id: string) {
  const res = await api.delete<OkResp>(`/api/admin/signage/deals/${id}`);
  return res.data?.ok;
}

export async function listQuotes(): Promise<Quote[]> {
  const res = await api.get<QuotesResp>("/api/admin/signage/quotes");
  return res.data?.quotes ?? [];
}
export async function createQuote(payload: Partial<Quote>) {
  const res = await api.post<QuoteResp>("/api/admin/signage/quotes", payload);
  return res.data?.quote;
}
export async function updateQuote(id: string, payload: Partial<Quote>) {
  const res = await api.put<QuoteResp>(`/api/admin/signage/quotes/${id}`, payload);
  return res.data?.quote;
}
export async function deleteQuote(id: string) {
  const res = await api.delete<OkResp>(`/api/admin/signage/quotes/${id}`);
  return res.data?.ok;
}

export async function listProfessionals(): Promise<Professional[]> {
  const res = await api.get<ProfessionalsResp>("/api/admin/signage/professionals");
  return res.data?.professionals ?? [];
}
export async function createProfessional(payload: Partial<Professional>) {
  const res = await api.post<ProfessionalResp>("/api/admin/signage/professionals", payload);
  return res.data?.professional;
}
export async function updateProfessional(id: string, payload: Partial<Professional>) {
  const res = await api.put<ProfessionalResp>(`/api/admin/signage/professionals/${id}`, payload);
  return res.data?.professional;
}
export async function deleteProfessional(id: string) {
  const res = await api.delete<OkResp>(`/api/admin/signage/professionals/${id}`);
  return res.data?.ok;
}
