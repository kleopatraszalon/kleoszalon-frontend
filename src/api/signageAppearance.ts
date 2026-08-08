import api from "./api";

export type SignageAppearanceConfig = {
  template: "classic" | "neon" | "luxe" | "glass";
  colors: {
    background: string; surface: string; surfaceAlt: string; text: string; muted: string;
    gold: string; accent: string; success: string;
  };
  effects: { glow: number; blur: number; radius: number; contrast: number; motion: string; ambient: boolean; scanlines: boolean };
  popup: { enabled: boolean; intervalSec: number; durationSec: number; initialDelaySec: number; source: string; animation: string; showPrice: boolean };
};

export async function getSignageAppearance() {
  const r = await api.get<{ok:boolean;config:SignageAppearanceConfig;updated_at?:string|null}>("/admin/signage-appearance");
  if (!r.data.ok) throw new Error("appearance_read_failed");
  return r.data;
}

export async function saveSignageAppearance(config: SignageAppearanceConfig) {
  const r = await api.put<{ok:boolean;config:SignageAppearanceConfig;updated_at?:string|null}>("/admin/signage-appearance", { config });
  if (!r.data.ok) throw new Error("appearance_save_failed");
  return r.data;
}

export async function resetSignageAppearance() {
  const r = await api.post<{ok:boolean;config:SignageAppearanceConfig;updated_at?:string|null}>("/admin/signage-appearance/reset");
  if (!r.data.ok) throw new Error("appearance_reset_failed");
  return r.data;
}
