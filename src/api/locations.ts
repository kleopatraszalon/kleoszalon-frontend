import api from "./api";

export type LocationRow = {
  id: string;
  name: string;
};

const TTL_MS = 60_000;
let cachedRows: LocationRow[] | null = null;
let cachedAt = 0;
let inflight: Promise<LocationRow[]> | null = null;

export async function getLocations(options: { force?: boolean } = {}) {
  const now = Date.now();
  if (!options.force && cachedRows && now - cachedAt < TTL_MS) return cachedRows;
  if (!options.force && inflight) return inflight;

  inflight = api
    .get<{ ok: boolean; rows: LocationRow[] }>("/locations")
    .then((r) => {
      if (!r.data?.ok) throw new Error("locations_failed");
      cachedRows = r.data.rows || [];
      cachedAt = Date.now();
      return cachedRows;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

export function invalidateLocationsCache() {
  cachedRows = null;
  cachedAt = 0;
}
