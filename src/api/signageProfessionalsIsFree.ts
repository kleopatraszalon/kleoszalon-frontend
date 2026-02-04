import api from "./api";

/**
 * Signage Professionals API (admin) – includes the `is_free` flag.
 *
 * IMPORTANT:
 * - If your axios instance has `baseURL: '/api'`, then these paths MUST start with `/admin/...` (no extra `/api`).
 * - If your axios instance has a full origin baseURL, the same still holds.
 */

export type Professional = {
  id: string;
  name: string;

  title?: string | null;
  note?: string | null;

  photo_url?: string | null;

  /** Megjelenjen a signage-on / listában */
  show?: boolean;

  /** Szabad / foglalt állapot (zöld/piros) */
  is_free?: boolean;

  /** Régi fallback mező (ha a backend ezt adja): */
  available?: boolean;

  priority?: number | null;
};

type ListProfessionalsResp = { professionals?: Professional[] };
type OneProfessionalResp = { professional?: Professional };

const BASE = "/admin/signage/professionals";

export async function listProfessionals(): Promise<Professional[]> {
  const r = await api.get<ListProfessionalsResp>(BASE);
  return r.data?.professionals ?? [];
}

export async function createProfessional(payload: Partial<Professional>): Promise<Professional | null> {
  const r = await api.post<OneProfessionalResp>(BASE, payload);
  return r.data?.professional ?? null;
}

export async function updateProfessional(
  id: string,
  payload: Partial<Professional>
): Promise<Professional | null> {
  const r = await api.put<OneProfessionalResp>(`${BASE}/${encodeURIComponent(id)}`, payload);
  return r.data?.professional ?? null;
}

export async function deleteProfessional(id: string): Promise<boolean> {
  const r = await api.delete<{ ok?: boolean }>(`${BASE}/${encodeURIComponent(id)}`);
  return Boolean(r.data?.ok ?? true);
}
