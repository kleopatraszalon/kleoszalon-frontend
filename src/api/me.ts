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

export async function getCurrentUser() {
  const r = await api.get<MeResponse>("/me");
  if (!r.data?.ok) throw new Error("me_failed");
  return r.data.user;
}
