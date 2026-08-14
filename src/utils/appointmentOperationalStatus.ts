export type AppointmentOperationalStatusKey =
  | "waiting"
  | "late"
  | "arrived"
  | "in_progress"
  | "closed"
  | "cancelled"
  | "no_show";

export type AppointmentStatusSource = {
  status?: string | null;
  operational_status?: string | null;
  start_time?: string | null;
  start?: string | null;
};

export type AppointmentOperationalStatus = {
  key: AppointmentOperationalStatusKey;
  label: string;
  className: string;
  closed: boolean;
};

function normalized(value: unknown) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

export function appointmentOperationalStatus(
  item: AppointmentStatusSource,
  now: Date | number = new Date(),
): AppointmentOperationalStatus {
  const raw = normalized(item.operational_status || item.status || "waiting");

  if (["work_order_closed", "closed", "completed", "done", "finished", "paid"].includes(raw)) {
    return { key: "closed", label: "Munkalap lezárva", className: "status-closed", closed: true };
  }
  if (["cancelled", "canceled"].includes(raw)) {
    return { key: "cancelled", label: "Lemondva", className: "status-cancelled", closed: false };
  }
  if (["no_show", "noshow", "missed"].includes(raw)) {
    return { key: "no_show", label: "Nem jelent meg", className: "status-no-show", closed: false };
  }
  if (["in_progress", "started", "working"].includes(raw)) {
    return { key: "in_progress", label: "Folyamatban", className: "status-in-progress", closed: false };
  }
  if (["arrived", "checked_in", "checkin"].includes(raw)) {
    return { key: "arrived", label: "Megérkezett", className: "status-arrived", closed: false };
  }

  const startRaw = item.start_time || item.start;
  const startMs = startRaw ? new Date(startRaw).getTime() : Number.NaN;
  const nowMs = now instanceof Date ? now.getTime() : Number(now);
  if (Number.isFinite(startMs) && Number.isFinite(nowMs) && nowMs > startMs) {
    return { key: "late", label: "Késésben", className: "status-late", closed: false };
  }

  return { key: "waiting", label: "Várakozás", className: "status-waiting", closed: false };
}
