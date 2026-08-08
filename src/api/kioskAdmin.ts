import api from "./api";

export type KioskLocation = { id: string; name: string; is_device_location?: boolean };
export type KioskDevice = { id: string; device_key: string; name: string; location_id: string; is_active: boolean; updated_at?: string; location?: KioskLocation };
export type KioskService = {
  id: string;
  name: string;
  description?: string | null;
  base_price: number | string | null;
  duration_minutes: number | null;
  service_type_id: string | null;
  service_type_name: string | null;
};
export type KioskProduct = {
  id: string;
  name: string;
  description?: string | null;
  price: number | string | null;
  image_url?: string | null;
  group_key: string;
  group_name: string;
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
export type KioskMenuItem = {
  serviceId: string;
  enabled: boolean;
  order: number;
  imageUrl?: string;
  badgeText?: string;
  featured?: boolean;
  displayName?: string;
};
export type KioskProductItem = {
  productId: string;
  enabled: boolean;
  order: number;
  imageUrl?: string;
  badgeText?: string;
  featured?: boolean;
  displayName?: string;
};
export type KioskSection = {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  enabled?: boolean;
  order: number;
  items: KioskMenuItem[];
};
export type KioskProductSection = {
  id: string;
  groupKey?: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  enabled?: boolean;
  order: number;
  items: KioskProductItem[];
};
export type KioskStats = {
  total_services: number;
  enabled_services: number;
  disabled_services: number;
  section_count: number;
  total_products?: number;
  enabled_products?: number;
  disabled_products?: number;
  product_section_count?: number;
};

type ApiOkResponse = { ok: boolean; error?: string };

export async function getKioskAdminLocations() {
  const r = await api.get<ApiOkResponse & { locations: KioskLocation[]; device?: KioskDevice }>("/admin/kiosk/locations");
  if (!r.data.ok) throw new Error(r.data.error || "kiosk_locations_failed");
  return { locations: r.data.locations || [], device: r.data.device || null };
}

export async function getKioskAdminMenu(locationId?: string) {
  const r = await api.get<ApiOkResponse & {
    location?: KioskLocation;
    device?: KioskDevice;
    menu: KioskMenu | null;
    sections: KioskSection[];
    services: KioskService[];
    productSections: KioskProductSection[];
    products: KioskProduct[];
    stats?: KioskStats;
    defaults?: Record<string, any>;
  }>("/admin/kiosk/menu", { params: locationId ? { locationId } : {} });
  if (!r.data.ok) throw new Error(r.data.error || "kiosk_menu_failed");
  return r.data;
}

export async function initKioskMenu(locationId?: string, name?: string) {
  const r = await api.post<ApiOkResponse & { menuId?: string; existing?: boolean }>("/admin/kiosk/menu/init", { locationId, name });
  if (!r.data.ok || !r.data.menuId) throw new Error(r.data.error || "kiosk_init_failed");
  return r.data as ApiOkResponse & { menuId: string; existing?: boolean };
}

export async function saveKioskSettings(menuId: string, input: {
  name: string;
  is_active: boolean;
  theme: Record<string, any>;
  sections: { id: string; title: string; subtitle?: string; imageUrl?: string; enabled?: boolean; order: number }[];
  productSections: { id: string; title: string; subtitle?: string; imageUrl?: string; enabled?: boolean; order: number }[];
}) {
  const r = await api.put<ApiOkResponse>(`/admin/kiosk/menu/${menuId}/settings`, input);
  if (!r.data.ok) throw new Error(r.data.error || "kiosk_settings_failed");
  return true;
}

export async function saveKioskItems(menuId: string, input: {
  sections: { sectionId: string; items: KioskMenuItem[] }[];
  productSections: { sectionId: string; items: KioskProductItem[] }[];
}) {
  const r = await api.put<ApiOkResponse>(`/admin/kiosk/menu/${menuId}/items`, input);
  if (!r.data.ok) throw new Error(r.data.error || "kiosk_items_failed");
  return true;
}
