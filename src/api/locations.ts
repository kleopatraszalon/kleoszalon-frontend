import api from "./api";

export type LocationRow = {
  id: string;
  name: string;
};

export async function getLocations() {
  const r = await api.get<{ ok: boolean; rows: LocationRow[] }>("/locations");
  if (!r.data?.ok) throw new Error("locations_failed");
  return r.data.rows || [];
}
