import api from "./api";

export type VirReportSubscription = {
  id: string;
  email: string;
  frequency: "daily" | "weekly";
  is_enabled: boolean;
  location_id?: string | null;
  weekday?: number | null;
  send_hour: number;
  send_minute: number;
  timezone: string;
  recipient_name?: string | null;
};

export async function getVirReportSubscriptions() {
  const r = await api.get<{ ok: boolean; rows: VirReportSubscription[] }>("/vir-reports/subscriptions");
  if (!r.data?.ok) throw new Error("vir_report_subscriptions_failed");
  return r.data.rows || [];
}

export async function createVirReportSubscription(payload: Partial<VirReportSubscription>) {
  const r = await api.post<{ ok: boolean; row: VirReportSubscription }>("/vir-reports/subscriptions", payload);
  if (!r.data?.ok) throw new Error("vir_report_subscription_create_failed");
  return r.data.row;
}

export async function updateVirReportSubscription(id: string, payload: Partial<VirReportSubscription>) {
  const r = await api.put<{ ok: boolean; row: VirReportSubscription }>(`/vir-reports/subscriptions/${id}`, payload);
  if (!r.data?.ok) throw new Error("vir_report_subscription_update_failed");
  return r.data.row;
}

export async function deleteVirReportSubscription(id: string) {
  const r = await api.delete<{ ok: boolean }>(`/vir-reports/subscriptions/${id}`);
  if (!r.data?.ok) throw new Error("vir_report_subscription_delete_failed");
}

export async function sendVirReportNow(payload: { email: string; frequency: "daily" | "weekly"; location_id?: string | null; recipient_name?: string | null }) {
  const r = await api.post<{ ok: boolean }>("/vir-reports/send-now", payload);
  if (!r.data?.ok) throw new Error("vir_report_send_now_failed");
}
