import api from "./api";

export type CurrentUser = {
  id: string | number | null;
  email?: string | null;
  role?: string | null;
  location_id?: string | number | null;
};

type MeResponse = {
  ok: boolean;
  user: CurrentUser;
};

const TTL_MS = 15_000;
let cachedUser: CurrentUser | null = null;
let cachedAt = 0;
let inflight: Promise<CurrentUser> | null = null;

export async function getCurrentUser(options: { force?: boolean } = {}) {
  const now = Date.now();
  if (!options.force && cachedUser && now - cachedAt < TTL_MS) return cachedUser;
  if (!options.force && inflight) return inflight;

  inflight = api
    .get<MeResponse>("/me")
    .then((r) => {
      if (!r.data?.ok) throw new Error("me_failed");
      cachedUser = r.data.user;
      cachedAt = Date.now();
      return cachedUser;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

export function invalidateCurrentUserCache() {
  cachedUser = null;
  cachedAt = 0;
}
