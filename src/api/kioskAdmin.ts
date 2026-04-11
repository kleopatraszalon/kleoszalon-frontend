import api from "./api";

export type KioskService = {
  id: string;
  name: string;
  base_price: number | null;
  duration_minutes: number | null;
  service_type_id: string | null;
  service_type_name: string | null;
};

export type KioskMenu = {
  id: string;
  location_id: string | null;
  name: string;
  theme: any;
  is_active: boolean;
};

type ApiOkResponse = {
  ok: boolean;
  error?: string;
};

type KioskAdminMenuResponse = ApiOkResponse & {
  menu: KioskMenu | null;
  sections: any[];
  services: KioskService[];
};

type KioskInitResponse = ApiOkResponse & {
  menuId?: string;
};

export async function getKioskAdminMenu(locationId: string) {
  const r = await api.get<KioskAdminMenuResponse>(`/admin/kiosk/menu`, {
    params: { locationId },
  });
  if (!r.data.ok) throw new Error(r.data.error || "kiosk_menu_failed");
  return r.data;
}

export async function initKioskMenu(locationId: string, name?: string) {
  const r = await api.post<KioskInitResponse>(`/admin/kiosk/menu/init`, {
    locationId,
    name,
  });
  if (!r.data.ok) throw new Error(r.data.error || "kiosk_init_failed");
  return r.data as KioskInitResponse & { ok: true; menuId: string };
}

export async function saveKioskTheme(menuId: string, theme: any) {
  const r = await api.put<ApiOkResponse>(`/admin/kiosk/menu/${menuId}/theme`, { theme });
  if (!r.data.ok) throw new Error(r.data.error || "kiosk_theme_failed");
  return true;
}

export async function saveKioskItems(menuId: string, sections: any[]) {
  const r = await api.put<ApiOkResponse>(`/admin/kiosk/menu/${menuId}/items`, { sections });
  if (!r.data.ok) throw new Error(r.data.error || "kiosk_items_failed");
  return true;
}
