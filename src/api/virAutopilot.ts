import { fetchJSON } from "../utils/fetch";

const WAVE1 = "/api/admin/booking-v4/automation/autopilot";
const WAVE2 = `${WAVE1}/wave2`;

const qs = (params: Record<string, string | number | undefined | null>) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value) !== "") search.set(key, String(value));
  });
  return search.toString();
};

export type Wave1Preview = {
  run?: { id: string; created_at?: string };
  summary?: Record<string, number | boolean | string>;
  gaps?: any[];
  waitlist_matches?: any[];
  no_show?: any[];
  rebooking?: { candidates?: any[]; ai_used?: boolean; ai_status?: string };
  policy?: Record<string, any>;
};

export async function getWave1Preview(locationId: string, days = 7) {
  return fetchJSON<Wave1Preview>(`${WAVE1}/preview?${qs({ location_id: locationId, days })}`);
}
export async function prepareWave1(locationId: string, runId: string) {
  return fetchJSON<any>(`${WAVE1}/prepare`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location_id: locationId, run_id: runId }) });
}
export async function approveWave1(locationId: string, runId: string) {
  return fetchJSON<any>(`${WAVE1}/approve-all`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ location_id: locationId, run_id: runId }) });
}
export async function getDeposits(locationId: string) {
  return fetchJSON<{ deposits: any[] }>(`${WAVE1}/deposits?${qs({ location_id: locationId })}`, undefined, { deposits: [] });
}
export async function setDepositStatus(id: string, status: "paid" | "waived" | "expired" | "cancelled") {
  return fetchJSON<any>(`${WAVE1}/deposits/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
}

export async function getProfitEngine(locationId: string, from?: string, to?: string, targetMargin = 35) {
  return fetchJSON<any>(`${WAVE2}/profit?${qs({ location_id: locationId, from, to, target_margin: targetMargin })}`);
}
export async function getRecipes(locationId: string, serviceId?: string) {
  return fetchJSON<{ recipes: any[] }>(`${WAVE2}/recipes?${qs({ location_id: locationId, service_id: serviceId })}`, undefined, { recipes: [] });
}
export async function saveRecipe(serviceId: string, materials: any[]) {
  return fetchJSON<any>(`${WAVE2}/recipes/${encodeURIComponent(serviceId)}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ materials }) });
}
export async function getClientBrief(clientId: string, forceAi = false) {
  return fetchJSON<any>(`${WAVE2}/client-brief/${encodeURIComponent(clientId)}?${qs({ force_ai: forceAi ? 1 : undefined })}`);
}
export async function getWorkflows(locationId: string) {
  return fetchJSON<{ rules: any[] }>(`${WAVE2}/workflows?${qs({ location_id: locationId })}`, undefined, { rules: [] });
}
export async function createWorkflow(payload: any) {
  return fetchJSON<any>(`${WAVE2}/workflows`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
}
export async function updateWorkflow(id: string, payload: any) {
  return fetchJSON<any>(`${WAVE2}/workflows/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
}
export async function processWorkflows(limit = 80) {
  return fetchJSON<any>(`${WAVE2}/workflows/process`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ limit }) });
}
export async function getWorkflowEvents(locationId: string) {
  return fetchJSON<{ events: any[] }>(`${WAVE2}/workflow-events?${qs({ location_id: locationId })}`, undefined, { events: [] });
}
export async function getWorkflowActions(locationId: string) {
  return fetchJSON<{ actions: any[] }>(`${WAVE2}/workflow-actions?${qs({ location_id: locationId })}`, undefined, { actions: [] });
}
