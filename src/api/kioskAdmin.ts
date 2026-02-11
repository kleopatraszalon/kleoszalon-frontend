import api from "./api"; // existing axios instance

export type ApiOk<T> = { ok: true } & T;
export type ApiErr = { ok: false; error?: string };
export type ApiResp<T> = ApiOk<T> | ApiErr;

function ensureOk<T>(r: ApiResp<T>): asserts r is ApiOk<T> {
  if (!r.ok) throw new Error(r.error || "request_failed");
}

export type KioskTheme = {
  welcomeText?: string;
  primaryColor?: string;
  logoUrl?: string;
  background?: string;
};

export type KioskMenu = {
  id: string;
  locationId: string;
  name: string;
  theme?: KioskTheme;
  isActive?: boolean;
};

export type KioskService = {
  id: string;
  name: string;
  // Support both schema variants used across the app
  price?: number | string | null;
  base_price?: number | string | null;
  duration_min?: number | null;
  duration_minutes?: number | null;
  type_id?: string | null;
  service_type_id?: string | null;
  type_name?: string | null;
  service_type_name?: string | null;
};

export async function getKioskAdminMenu(locationId: string) {
  const r = await api.get<ApiResp<{ menu: KioskMenu | null; sections: any[]; services: KioskService[] }>>(
    `/admin/kiosk/menu`,
    { params: { locationId } }
  );
  ensureOk(r.data);
  return r.data;
}

export async function initKioskMenu(locationId: string, name?: string) {
  const r = await api.post<ApiResp<{ menuId: string }>>(`/admin/kiosk/menu/init`, { locationId, name });
  ensureOk(r.data);
  return r.data.menuId;
}

export async function saveKioskTheme(menuId: string, theme: any) {
  const r = await api.put<ApiResp<{}>>(`/admin/kiosk/menu/${menuId}/theme`, { theme });
  ensureOk(r.data);
  return true;
}

export async function saveKioskItems(menuId: string, sections: any[]) {
  const r = await api.put<ApiResp<{}>>(`/admin/kiosk/menu/${menuId}/items`, { sections });
  ensureOk(r.data);
  return true;
}
