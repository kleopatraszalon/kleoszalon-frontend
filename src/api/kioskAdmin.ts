import api from "./api";

export type KioskLocation = { id: string; name: string };
export type KioskService = {
  id: string;
  name: string;
  base_price: number | string | null;
  duration_minutes: number | null;
  service_type_id: string | null;
  service_type_name: string | null;
};
export type KioskMenu = {
  id: string;
  location_id: string | null;
  name: string;
  theme: Record<string, any>;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};
export type KioskSection = {
  id: string;
  title: string;
  order: number;
  items: { serviceId: string; enabled: boolean; order: number }[];
};
export type KioskStats = {
  total_services: number;
  enabled_services: number;
  disabled_services: number;
  section_count: number;
};

type ApiOkResponse = { ok: boolean; error?: string };

export async function getKioskAdminLocations() {
  const r = await api.get<ApiOkResponse & { locations: KioskLocation[] }>("/admin/kiosk/locations");
  if (!r.data.ok) throw new Error(r.data.error || "kiosk_locations_failed");
  return r.data.locations || [];
}

export async function getKioskAdminMenu(locationId: string) {
  const r = await api.get<ApiOkResponse & {
    location?: KioskLocation;
    menu: KioskMenu | null;
    sections: KioskSection[];
    services: KioskService[];
    stats?: KioskStats;
  }>("/admin/kiosk/menu", { params: { locationId } });
  if (!r.data.ok) throw new Error(r.data.error || "kiosk_menu_failed");
  return r.data;
}

export async function initKioskMenu(locationId: string, name?: string) {
  const r = await api.post<ApiOkResponse & { menuId?: string; existing?: boolean }>("/admin/kiosk/menu/init", { locationId, name });
  if (!r.data.ok || !r.data.menuId) throw new Error(r.data.error || "kiosk_init_failed");
  return r.data as ApiOkResponse & { menuId: string; existing?: boolean };
}

export async function saveKioskSettings(menuId: string, input: {
  name: string;
  is_active: boolean;
  theme: Record<string, any>;
  sections: { id: string; title: string; order: number }[];
}) {
  const r = await api.put<ApiOkResponse>(`/admin/kiosk/menu/${menuId}/settings`, input);
  if (!r.data.ok) throw new Error(r.data.error || "kiosk_settings_failed");
  return true;
}

export async function saveKioskItems(menuId: string, sections: { sectionId: string; items: { serviceId: string; enabled: boolean; order: number }[] }[]) {
  const r = await api.put<ApiOkResponse>(`/admin/kiosk/menu/${menuId}/items`, { sections });
  if (!r.data.ok) throw new Error(r.data.error || "kiosk_items_failed");
  return true;
}
