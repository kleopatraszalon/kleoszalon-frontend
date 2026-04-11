import api from "./api";

export type VirTargetsResponse = {
  ok: boolean;
  targets: Record<string, number>;
};

export async function getVirTargets(locationId?: string) {
  try {
    const r = await api.get<VirTargetsResponse>("/vir-targets", {
      params: { locationId },
    });

    if (!r.data?.ok) return {};
    return r.data.targets || {};
  } catch (err: any) {
    if (err?.response?.status === 404) {
      return {};
    }
    throw err;
  }
}
