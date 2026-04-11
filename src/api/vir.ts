import api from "./api";

export type VirDashboardSummary = {
  revenue_total: number;
  paid_total: number;
  appointments_count: number;
  completed_count: number;
  cancelled_count: number;
  no_show_count: number;
  avg_basket: number;
  cancellation_rate_percent: number;
  no_show_rate_percent: number;
};

export type VirRevenueRow = {
  day: string;
  revenue_total: number;
  paid_total: number;
  appointments_count: number;
};

export type VirTopServiceRow = {
  service_id: string;
  service_name: string;
  bookings_count: number;
  revenue_total: number;
  avg_price: number;
};

export type VirTopStaffRow = {
  employee_id: string;
  full_name: string;
  short_name: string | null;
  appointments_count: number;
  completed_count: number;
  revenue_total: number;
  revenue_per_hour: number;
};

export type VirSourcePerformanceRow = {
  source_channel: string;
  location_id: string | null;
  appointments_count: number;
  completed_count: number;
  cancelled_count: number;
  no_show_count: number;
  revenue_total: number;
  paid_total: number;
};

export type VirCancellationStatsRow = {
  day: string;
  location_id: string | null;
  total_appointments: number;
  cancelled_count: number;
  no_show_count: number;
  cancellation_rate_percent: number;
  no_show_rate_percent: number;
};

export type VirKioskConversionRow = {
  day: string;
  location_id: string | null;
  kiosk_appointments: number;
  kiosk_completed: number;
  kiosk_revenue: number;
};

export type VirSignageImpactRow = {
  deal_id: string;
  title: string;
  location_id: string | null;
  active_from: string;
  active_to: string;
  appointments_during_campaign: number;
  revenue_during_campaign: number;
};

export type VirDashboardResponse = {
  ok: boolean;
  summary: VirDashboardSummary;
};

type VirRowsResponse<T> = {
  ok: boolean;
  rows: T[];
};

export async function getVirDashboard(params: {
  from?: string;
  to?: string;
  locationId?: string;
}) {
  const r = await api.get<VirDashboardResponse>("/vir/dashboard", { params });
  if (!r.data?.ok) throw new Error("vir_dashboard_failed");
  return r.data.summary;
}

export async function getVirRevenueSeries(params: {
  from?: string;
  to?: string;
  locationId?: string;
}) {
  const r = await api.get<VirRowsResponse<VirRevenueRow>>("/vir/revenue-series", { params });
  if (!r.data?.ok) throw new Error("vir_revenue_series_failed");
  return r.data.rows;
}

export async function getVirTopServices(limit = 10) {
  const r = await api.get<VirRowsResponse<VirTopServiceRow>>("/vir/top-services", {
    params: { limit },
  });
  if (!r.data?.ok) throw new Error("vir_top_services_failed");
  return r.data.rows;
}

export async function getVirTopStaff(limit = 10) {
  const r = await api.get<VirRowsResponse<VirTopStaffRow>>("/vir/top-staff", {
    params: { limit },
  });
  if (!r.data?.ok) throw new Error("vir_top_staff_failed");
  return r.data.rows;
}

export async function getVirSourcePerformance(params: { locationId?: string }) {
  const r = await api.get<VirRowsResponse<VirSourcePerformanceRow>>("/vir/source-performance", {
    params,
  });
  if (!r.data?.ok) throw new Error("vir_source_performance_failed");
  return r.data.rows;
}

export async function getVirCancellationStats(params: {
  from?: string;
  to?: string;
  locationId?: string;
}) {
  const r = await api.get<VirRowsResponse<VirCancellationStatsRow>>("/vir/cancellation-stats", {
    params,
  });
  if (!r.data?.ok) throw new Error("vir_cancellation_stats_failed");
  return r.data.rows;
}

export async function getVirKioskConversion(params: {
  from?: string;
  to?: string;
  locationId?: string;
}) {
  const r = await api.get<VirRowsResponse<VirKioskConversionRow>>("/vir/kiosk-conversion", {
    params,
  });
  if (!r.data?.ok) throw new Error("vir_kiosk_conversion_failed");
  return r.data.rows;
}

export async function getVirSignageImpact(params: { locationId?: string }) {
  const r = await api.get<VirRowsResponse<VirSignageImpactRow>>("/vir/signage-impact", {
    params,
  });
  if (!r.data?.ok) throw new Error("vir_signage_impact_failed");
  return r.data.rows;
}
