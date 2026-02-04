import api from "../api";

export type Professional = {
  id: string;
  name: string;
  title?: string | null;
  note?: string | null;

  photo_url?: string | null;   // ✅ EZ HIÁNYZIK

  show: boolean;
  available: boolean;
  priority: number;
};

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
