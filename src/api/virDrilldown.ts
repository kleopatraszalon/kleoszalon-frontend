import api from "./api";

export type VirStaffDetailResponse = {
  staff: {
    employee_id: string;
    full_name: string;
    short_name?: string | null;
    appointments_count: number;
    completed_count: number;
    revenue_total: number;
    revenue_per_hour: number;
  };
  services: Array<{
    service_id: string;
    service_name: string;
    bookings_count: number;
    revenue_total: number;
  }>;
  recent_appointments: Array<{
    appointment_id: string;
    day: string;
    client_name?: string | null;
    status: string;
    revenue_total: number;
  }>;
};

export type VirServiceDetailResponse = {
  service: {
    service_id: string;
    service_name: string;
    bookings_count: number;
    revenue_total: number;
    avg_price: number;
  };
  staff: Array<{
    employee_id: string;
    staff_name: string;
    bookings_count: number;
    revenue_total: number;
  }>;
  recent_appointments: Array<{
    appointment_id: string;
    day: string;
    client_name?: string | null;
    staff_name?: string | null;
    revenue_total: number;
  }>;
};

export async function getVirStaffDetail(staffId: string) {
  const r = await api.get<{ ok: boolean; data: VirStaffDetailResponse }>(`/vir-drilldown/staff/${staffId}`);
  if (!r.data?.ok) throw new Error("vir_staff_detail_failed");
  return r.data.data;
}

export async function getVirServiceDetail(serviceId: string) {
  const r = await api.get<{ ok: boolean; data: VirServiceDetailResponse }>(`/vir-drilldown/service/${serviceId}`);
  if (!r.data?.ok) throw new Error("vir_service_detail_failed");
  return r.data.data;
}
