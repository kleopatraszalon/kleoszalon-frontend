import api from "./api";

export type VirActionPriority = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type VirActionStatus = "OPEN" | "IN_PROGRESS" | "BLOCKED" | "WAITING_APPROVAL" | "DONE";

export type VirActionItem = {
  id: string;
  location_id: string | null;
  source: string;
  source_ref?: string | null;
  title: string;
  description: string;
  priority: VirActionPriority;
  status: VirActionStatus;
  assignee_name?: string | null;
  due_at?: string | null;
  source_route?: string | null;
  evidence?: string | null;
  requires_approval: boolean;
  created_by?: string | null;
  created_at: string;
  updated_by?: string | null;
  updated_at: string;
  completed_at?: string | null;
};

export type VirCockpitResponse = {
  ok: boolean;
  date: string;
  location_id: string | null;
  kpis: {
    revenue_total: number;
    paid_total: number;
    appointments_count: number;
    completed_count: number;
    cancelled_count: number;
    no_show_count: number;
    avg_basket: number;
    cancellation_rate_percent: number;
    no_show_rate_percent: number;
    daily_revenue_target: number;
    revenue_target_percent: number | null;
    scheduled_hours: number;
  };
  actions: {
    open_count: number;
    critical_count: number;
    high_count: number;
    overdue_count: number;
    approval_count: number;
  };
  top_actions: VirActionItem[];
  source_health: Array<{ source: string; open_count: number; urgent_count: number }>;
};

export async function getVirManagerCockpit(params: { date?: string; locationId?: string } = {}) {
  const response = await api.get<VirCockpitResponse>("/vir/management/cockpit", { params });
  if (!response.data?.ok) throw new Error("vir_manager_cockpit_failed");
  return response.data;
}

export async function getVirActions(params: {
  date?: string;
  locationId?: string;
  status?: VirActionStatus | "";
  priority?: VirActionPriority | "";
  source?: string;
  limit?: number;
} = {}) {
  const response = await api.get<{ ok: boolean; rows: VirActionItem[] }>("/vir/management/actions", { params });
  if (!response.data?.ok) throw new Error("vir_action_center_failed");
  return response.data.rows;
}

export async function createVirAction(payload: Partial<VirActionItem> & { title: string }) {
  const response = await api.post<{ ok: boolean; item: VirActionItem }>("/vir/management/actions", payload);
  if (!response.data?.ok) throw new Error("vir_action_create_failed");
  return response.data.item;
}

export async function updateVirAction(id: string, payload: Partial<VirActionItem>) {
  const response = await api.patch<{ ok: boolean; item: VirActionItem }>(`/vir/management/actions/${id}`, payload);
  if (!response.data?.ok) throw new Error("vir_action_update_failed");
  return response.data.item;
}
