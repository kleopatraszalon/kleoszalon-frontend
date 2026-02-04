import api from "./api";

export type Professional = {
  id: string;
  name: string;
  title?: string | null;
  note?: string | null;

  photo_url?: string | null;
  show?: boolean | null;
  /** Szabad pipa */
  is_free?: boolean | null;
  /** Legacy / fallback */
  available?: boolean | null;
  priority?: number | null;
};

export async function listProfessionals(): Promise<Professional[]> {
  const r = await api.get<{ professionals?: Professional[]; items?: Professional[]; rows?: Professional[] }>(
    "/admin/signage/professionals"
  );
  return r.data?.professionals ?? r.data?.items ?? r.data?.rows ?? [];
}

export async function createProfessional(payload: Partial<Professional>) {
  const r = await api.post<{ professional?: Professional; item?: Professional; row?: Professional }>(
    "/admin/signage/professionals",
    payload
  );
  return r.data?.professional ?? r.data?.item ?? r.data?.row;
}

export async function updateProfessional(id: string, payload: Partial<Professional>) {
  const r = await api.put<{ professional?: Professional; item?: Professional; row?: Professional }>(
    `/admin/signage/professionals/${encodeURIComponent(id)}`,
    payload
  );
  return r.data?.professional ?? r.data?.item ?? r.data?.row;
}

export async function deleteProfessional(id: string): Promise<boolean> {
  const r = await api.delete<{ ok?: boolean }>(`/admin/signage/professionals/${encodeURIComponent(id)}`);
  return r.data?.ok ?? true;
}
