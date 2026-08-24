import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Clock3, LayoutGrid, List, Plus, Search, Sparkles, Users } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { apiFetch } from "../utils/api";
import { appointmentOperationalStatus } from "../utils/appointmentOperationalStatus";
import { AppointmentNewModal } from "../components/AppointmentNewModal";
import AppointmentDrawer from "../components/AppointmentDrawer";
import BookingOperationsPanel from "./booking/BookingOperationsPanel";
import SmartSlotSuggestions from "./booking/SmartSlotSuggestions";
import BookingConflictPanel from "./booking/BookingConflictPanel";
import "./AppointmentsCalendar.css";
import "./InteractiveAppointmentsCalendar.css";
import "./ClassicAppointmentsCalendar.css";
import "./EmployeeCalendarHeader.css";
import "./ModernServiceCalendar.css";
import "./OperationalCalendarBoard.css";

type Employee = {
  id: string;
  full_name?: string | null;
  short_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  color?: string | null;
  photo_url?: string | null;
};

type Appointment = {
  id: string;
  title?: string | null;
  start_time: string;
  end_time: string;
  employee_id: string | null;
  client_name?: string | null;
  status?: string | null;
  operational_status?: string | null;
  service_names?: string[] | null;
  created_at?: string | null;
};

type CalendarMode = "days" | "staff" | "services";

type CalendarColumn = {
  id: string;
  title: string;
  subtitle?: string;
  date: string;
  employeeId?: string;
  serviceKey?: string;
};

type PositionedAppointment = {
  item: Appointment;
  startMinutes: number;
  endMinutes: number;
  lane: number;
  lanes: number;
};

type Props = {
  embedded?: boolean;
  initialMode?: CalendarMode;
  visibleDayCount?: number;
};

const START_MINUTES = 7 * 60;
const END_MINUTES = 21 * 60;
const SLOT_MINUTES = 15;
const SLOT_HEIGHT = 30;
const PX_PER_MINUTE = SLOT_HEIGHT / SLOT_MINUTES;
const TIMELINE_HEIGHT = (END_MINUTES - START_MINUTES) * PX_PER_MINUTE;

const SERVICE_PALETTE = [
  { background: "#bfe8dc", border: "#76c8b2", text: "#184c40" },
  { background: "#cfc0e4", border: "#aa8fce", text: "#412d59" },
  { background: "#f3c6c0", border: "#df9187", text: "#66322c" },
  { background: "#c8dfb7", border: "#8fbd70", text: "#315020" },
  { background: "#f2d28e", border: "#d9ac4f", text: "#5d4514" },
  { background: "#b9d8ee", border: "#79acd1", text: "#214c68" },
  { background: "#efc2d5", border: "#d989aa", text: "#633149" },
  { background: "#c3ddd9", border: "#83b8b0", text: "#234d47" },
  { background: "#d8d2a8", border: "#b8ad6f", text: "#4f4821" },
  { background: "#c8cef0", border: "#909bd2", text: "#313b68" },
  { background: "#e7c7a9", border: "#c99768", text: "#5d3a1f" },
  { background: "#bcd9c3", border: "#7eb18a", text: "#294f32" },
  { background: "#ddc1e8", border: "#b783cb", text: "#533060" },
  { background: "#f0bfc2", border: "#d77f85", text: "#672f34" },
  { background: "#bddfe9", border: "#7db9c9", text: "#244f5b" },
  { background: "#e5d3b5", border: "#c2a573", text: "#59472b" },
];

function toArray<T>(raw: any): T[] {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.data)) return raw.data;
  return [];
}

function isoDate(value: Date) {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatCreatedAt(value?: string | null) {
  if (!value) return "Felvétel ideje nem elérhető";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Felvétel ideje nem elérhető";
  return `Felvéve: ${new Intl.DateTimeFormat("hu-HU", {
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  }).format(date)}`;
}

function validIsoDate(value?: string | null) {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(`${value}T12:00:00`).getTime()));
}

function addDays(value: string, count: number) {
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + count);
  return isoDate(date);
}

function localDateAtMinutes(value: string, minutes: number) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, Math.floor(minutes / 60), minutes % 60, 0, 0);
}

function employeeName(employee: Employee) {
  return employee.short_name || employee.full_name || [employee.first_name, employee.last_name].filter(Boolean).join(" ") || "Munkatárs";
}

function appointmentServiceKey(item: Appointment) {
  return item.service_names?.find((name) => name?.trim())?.trim() || item.title?.trim() || "Általános szolgáltatás";
}

const DEPARTMENTS = ["Fodrászat", "Kéz- és lábápolás", "Kozmetika", "Masszázs"];
function appointmentDepartment(item: Appointment) {
  const value = [item.title, ...(item.service_names || [])].join(" ").toLocaleLowerCase("hu-HU");
  if (/massz|massage/.test(value)) return "Masszázs";
  if (/köröm|manik|pedik|kéz|láb|nail/.test(value)) return "Kéz- és lábápolás";
  if (/kozmet|arc|szempilla|szemöldök|smink|wax|gyanta/.test(value)) return "Kozmetika";
  return "Fodrászat";
}

function parseMode(raw: string | null | undefined): CalendarMode | null {
  if (raw === "days" || raw === "staff" || raw === "services") return raw;
  return null;
}

function roleList(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map(String).map((value) => value.toLocaleLowerCase("hu-HU"));
  const text = String(raw || "");
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed.map(String).map((value) => value.toLocaleLowerCase("hu-HU"));
  } catch {}
  return text
    .split(",")
    .map((value) => value.replace(/[[\]"]/g, "").trim().toLocaleLowerCase("hu-HU"))
    .filter(Boolean);
}

function minutesOfDay(value: string) {
  const date = new Date(value);
  return date.getHours() * 60 + date.getMinutes();
}

function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatDayHeader(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("hu-HU", { weekday: "long" });
}

function formatDaySubtitle(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("hu-HU", { month: "short", day: "numeric" });
}

function layoutAppointments(items: Appointment[]): PositionedAppointment[] {
  const source = [...items]
    .map((item) => ({
      item,
      startMinutes: minutesOfDay(item.start_time),
      endMinutes: minutesOfDay(item.end_time),
    }))
    .filter((entry) => entry.endMinutes > START_MINUTES && entry.startMinutes < END_MINUTES)
    .sort((a, b) => a.startMinutes - b.startMinutes || b.endMinutes - a.endMinutes);

  const placed: PositionedAppointment[] = [];
  let active: Array<{ endMinutes: number; lane: number }> = [];
  let cluster: number[] = [];
  let clusterLaneCount = 1;

  const finishCluster = () => {
    cluster.forEach((index) => {
      placed[index].lanes = clusterLaneCount;
    });
    cluster = [];
    clusterLaneCount = 1;
  };

  source.forEach((entry) => {
    active = active.filter((candidate) => candidate.endMinutes > entry.startMinutes);
    if (!active.length && cluster.length) finishCluster();

    const occupied = new Set(active.map((candidate) => candidate.lane));
    let lane = 0;
    while (occupied.has(lane)) lane += 1;

    const index = placed.length;
    placed.push({ ...entry, lane, lanes: 1 });
    active.push({ endMinutes: entry.endMinutes, lane });
    cluster.push(index);
    clusterLaneCount = Math.max(clusterLaneCount, lane + 1);
  });

  if (cluster.length) finishCluster();
  return placed;
}

export default function AppointmentsCalendarPage({ embedded = false, initialMode, visibleDayCount }: Props = {}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: userLoading } = (useCurrentUser() as any) || {};
  const draggedAppointmentId = useRef<string | null>(null);

  const urlParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const queryDate = urlParams.get("date");
  const savedDate = typeof window !== "undefined" ? localStorage.getItem("kleo.selectedDate") : null;
  const requestedDate = validIsoDate(queryDate)
    ? String(queryDate)
    : validIsoDate(savedDate)
      ? String(savedDate)
      : isoDate(new Date());
  const requestedMode = parseMode(urlParams.get("mode"));
  const isReceptionist = roleList(user?.role).some((role) =>
    ["receptionist", "reception", "recepciós", "recepcios"].includes(role),
  );

  const [anchorDate, setAnchorDate] = useState(embedded ? isoDate(new Date()) : requestedDate);
  const [mode, setMode] = useState<CalendarMode>(requestedMode || initialMode || (embedded ? "days" : "staff"));
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [statusNow, setStatusNow] = useState(() => Date.now());
  const [modal, setModal] = useState<{ open: boolean; employeeId?: string; date?: string; startMinutes?: number; duration?: number }>({ open: false });
  const [drawerId, setDrawerId] = useState<string | null>(null);

  const dayCount = visibleDayCount || (embedded ? 5 : 7);
  const range = useMemo(
    () => ({
      from: anchorDate,
      to: mode === "days" ? addDays(anchorDate, Math.max(0, dayCount - 1)) : anchorDate,
    }),
    [anchorDate, dayCount, mode],
  );

  useEffect(() => {
    const timer = window.setInterval(() => setStatusNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (embedded) return;
    localStorage.setItem("kleo.selectedDate", requestedDate);
    setAnchorDate(requestedDate);
  }, [embedded, requestedDate]);

  useEffect(() => {
    if (!embedded && requestedMode) setMode(requestedMode);
  }, [embedded, requestedMode]);

  useEffect(() => {
    if (embedded || !isReceptionist || requestedMode || initialMode) return;
    setMode("days");
    if (!validIsoDate(queryDate)) {
      const today = isoDate(new Date());
      setAnchorDate(today);
      localStorage.setItem("kleo.selectedDate", today);
    }
  }, [embedded, initialMode, isReceptionist, queryDate, requestedMode]);

  const loadCalendar = useCallback(async () => {
    if (!user) return;
    void reloadKey;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ from: range.from, to: range.to });
      if (user.location_id) params.set("location_id", String(user.location_id));
      const raw = await apiFetch<any>(`/api/timetable?${params}`);
      setEmployees(toArray<Employee>(raw?.employees));
      setAppointments(toArray<Appointment>(raw?.appointments));
    } catch (reason: any) {
      setError(reason?.message || "Nem sikerült betölteni a naptárat.");
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to, reloadKey, user]);

  useEffect(() => {
    void loadCalendar();
  }, [loadCalendar]);

  const employeeById = useMemo(
    () => new Map(employees.map((employee) => [String(employee.id), employeeName(employee)])),
    [employees],
  );

  const serviceColors = useMemo(() => {
    const keys = DEPARTMENTS;
    return new Map(keys.map((key, index) => [key, SERVICE_PALETTE[index % SERVICE_PALETTE.length]]));
  }, []);

  const normalizedSearch = search.trim().toLocaleLowerCase("hu-HU");
  const visibleEmployees = useMemo(() => {
    if (mode !== "staff" || !normalizedSearch) return employees;
    return employees.filter((item) => employeeName(item).toLocaleLowerCase("hu-HU").includes(normalizedSearch));
  }, [employees, mode, normalizedSearch]);

  const serviceKeys = useMemo(() => {
    const keys = Array.from(new Set(appointments.map(appointmentServiceKey))).sort((a, b) => a.localeCompare(b, "hu"));
    if (mode !== "services" || !normalizedSearch) return keys;
    return keys.filter((key) => key.toLocaleLowerCase("hu-HU").includes(normalizedSearch));
  }, [appointments, mode, normalizedSearch]);

  const displayedAppointments = useMemo(() => {
    if (mode !== "days" || !normalizedSearch) return appointments;
    return appointments.filter((item) => {
      const employee = item.employee_id ? employeeById.get(String(item.employee_id)) || "" : "";
      return [item.client_name, item.title, appointmentServiceKey(item), employee]
        .some((value) => String(value || "").toLocaleLowerCase("hu-HU").includes(normalizedSearch));
    });
  }, [appointments, employeeById, mode, normalizedSearch]);

  const columns = useMemo<CalendarColumn[]>(() => {
    if (mode === "days") {
      return Array.from({ length: dayCount }, (_, index) => {
        const date = addDays(anchorDate, index);
        return {
          id: date,
          title: formatDayHeader(date),
          subtitle: formatDaySubtitle(date),
          date,
        };
      });
    }

    if (mode === "staff") {
      return visibleEmployees.map((employee) => ({
        id: String(employee.id),
        title: employeeName(employee),
        subtitle: "Munkatárs",
        date: anchorDate,
        employeeId: String(employee.id),
      }));
    }

    return serviceKeys.map((serviceKey) => ({
      id: serviceKey,
      title: serviceKey,
      subtitle: "Részleg",
      date: anchorDate,
      serviceKey,
    }));
  }, [anchorDate, dayCount, mode, serviceKeys, visibleEmployees]);

  const appointmentsForColumn = useCallback((column: CalendarColumn) => {
    const source = mode === "days" ? displayedAppointments : appointments;
    return source.filter((item) => {
      const itemDate = isoDate(new Date(item.start_time));
      if (itemDate !== column.date) return false;
      if (mode === "staff") return String(item.employee_id || "") === String(column.employeeId || "");
      if (mode === "services") return appointmentDepartment(item) === column.serviceKey;
      return true;
    });
  }, [appointments, displayedAppointments, mode]);

  const syncUrl = useCallback((date: string, nextMode: CalendarMode) => {
    if (embedded) return;
    const params = new URLSearchParams(location.search);
    params.set("date", date);
    params.set("mode", nextMode);
    navigate({ pathname: "/appointments/calendar", search: `?${params.toString()}` }, { replace: true });
  }, [embedded, location.search, navigate]);

  const changeMode = (nextMode: CalendarMode) => {
    setMode(nextMode);
    setSearch("");
    syncUrl(anchorDate, nextMode);
  };

  const moveAnchor = (days: number) => {
    const next = addDays(anchorDate, days);
    setAnchorDate(next);
    if (!embedded) {
      localStorage.setItem("kleo.selectedDate", next);
      syncUrl(next, mode);
    }
  };

  const goToday = () => {
    const today = isoDate(new Date());
    setAnchorDate(today);
    if (!embedded) {
      localStorage.setItem("kleo.selectedDate", today);
      syncUrl(today, mode);
    }
  };

  const openNewAppointment = (column?: CalendarColumn, clientY?: number, currentTarget?: HTMLElement) => {
    const date = column?.date || anchorDate;
    let startMinutes = 9 * 60;
    if (typeof clientY === "number" && currentTarget) {
      const rect = currentTarget.getBoundingClientRect();
      const raw = START_MINUTES + (clientY - rect.top) / PX_PER_MINUTE;
      startMinutes = Math.round(raw / SLOT_MINUTES) * SLOT_MINUTES;
      startMinutes = Math.max(START_MINUTES, Math.min(END_MINUTES - SLOT_MINUTES, startMinutes));
    }
    setModal({
      open: true,
      employeeId: mode === "staff" ? column?.employeeId : undefined,
      date,
      startMinutes,
      duration: 30,
    });
  };

  const patchAppointment = async (item: Appointment, column: CalendarColumn, clientY: number, currentTarget: HTMLElement) => {
    if (appointmentOperationalStatus(item, statusNow).closed) {
      setError("Lezárt munkalaphoz tartozó időpont nem helyezhető át.");
      return;
    }
    if (mode === "services" && appointmentDepartment(item) !== column.serviceKey) {
      setError("Részlegek között húzással nem módosítható a szolgáltatás. Nyisd meg az időpontot vagy a munkalapot a szolgáltatás cseréjéhez.");
      return;
    }

    const rect = currentTarget.getBoundingClientRect();
    const raw = START_MINUTES + (clientY - rect.top) / PX_PER_MINUTE;
    const startMinutes = Math.max(
      START_MINUTES,
      Math.min(END_MINUTES - SLOT_MINUTES, Math.round(raw / SLOT_MINUTES) * SLOT_MINUTES),
    );
    const originalStart = new Date(item.start_time);
    const originalEnd = new Date(item.end_time);
    const duration = Math.max(SLOT_MINUTES, Math.round((originalEnd.getTime() - originalStart.getTime()) / 60000));
    const start = localDateAtMinutes(column.date, startMinutes);
    const end = new Date(start.getTime() + duration * 60000);
    const employeeId = mode === "staff" ? column.employeeId || item.employee_id : item.employee_id;

    try {
      await apiFetch(`/api/appointments/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_time: start.toISOString(),
          end_time: end.toISOString(),
          employee_id: employeeId,
        }),
      });
      setError("");
      setReloadKey((value) => value + 1);
    } catch (reason: any) {
      setError(reason?.message || "Az időpont nem helyezhető át. Ellenőrizd az ütközéseket.");
    }
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>, column: CalendarColumn) => {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/appointment-id") || draggedAppointmentId.current;
    draggedAppointmentId.current = null;
    if (!id) return;
    const item = appointments.find((candidate) => String(candidate.id) === String(id));
    if (!item) return;
    await patchAppointment(item, column, event.clientY, event.currentTarget);
  };

  const activeEmployees = new Set(appointments.map((item) => item.employee_id).filter(Boolean)).size;
  const plannedMinutes = appointments.reduce(
    (sum, item) => sum + Math.max(0, (new Date(item.end_time).getTime() - new Date(item.start_time).getTime()) / 60000),
    0,
  );
  const maxConcurrentLanes = useMemo(
    () => Math.max(1, ...columns.map((column) => layoutAppointments(appointmentsForColumn(column)).reduce((max, item) => Math.max(max, item.lanes), 1))),
    [appointmentsForColumn, columns],
  );
  const baseColumnWidth = mode === "days" ? 360 : mode === "services" ? 290 : 250;
  const columnWidth = Math.max(baseColumnWidth, maxConcurrentLanes * 170);
  const boardMinWidth = 76 + Math.max(1, columns.length) * columnWidth;
  const now = new Date(statusNow);
  const today = isoDate(now);
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowTop = (nowMinutes - START_MINUTES) * PX_PER_MINUTE;
  const timeLabels = Array.from(
    { length: Math.floor((END_MINUTES - START_MINUTES) / 30) + 1 },
    (_, index) => START_MINUTES + index * 30,
  );

  const calendarTitle = mode === "days"
    ? `${formatDaySubtitle(anchorDate)} – ${formatDaySubtitle(addDays(anchorDate, dayCount - 1))}`
    : new Date(`${anchorDate}T12:00:00`).toLocaleDateString("hu-HU", { year: "numeric", month: "long", day: "numeric", weekday: "long" });

  const searchPlaceholder = mode === "staff"
    ? "Munkatárs keresése…"
    : mode === "services"
      ? "Szolgáltatás keresése…"
      : "Vendég, munkatárs vagy szolgáltatás…";

  if (userLoading) {
    return <main className={`modern-calendar-page ${embedded ? "calendar-embedded" : ""}`}><div className="calendar-loading">Betöltés…</div></main>;
  }
  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <main className={`modern-calendar-page ${embedded ? "calendar-embedded" : ""}`}>
      {!embedded && (
        <header className="modern-calendar-hero calendar-classic-hero">
          <div className="modern-calendar-heading">
            <span className="modern-calendar-kicker"><Sparkles size={14}/> Naptár és digitális beosztás</span>
            <h1>Időpontnaptár</h1>
            <p>Napok, munkatársak vagy részlegek szerint rendezhető operatív naptár.</p>
          </div>
          <button className="modern-primary-button" onClick={() => openNewAppointment()}>
            <Plus size={18}/> Új időpont
          </button>
        </header>
      )}

      {!embedded && (
        <>
          <BookingOperationsPanel appointments={appointments} employeeCount={employees.length} onOpenAppointment={setDrawerId}/>
          <SmartSlotSuggestions
            employees={employees.map((item) => ({ id: item.id, name: employeeName(item) }))}
            appointments={appointments}
            selectedDate={anchorDate}
            onSelect={(slot, duration) => setModal({ open: true, employeeId: slot.employeeId, date: slot.date, startMinutes: slot.startMinutes, duration })}
          />
          <BookingConflictPanel
            employees={employees.map((item) => ({ id: item.id, name: employeeName(item) }))}
            appointments={appointments}
            onOpenAppointment={setDrawerId}
          />
        </>
      )}

      <section className="modern-calendar-board operational-calendar-section">
        {embedded && (
          <div className="operational-embedded-heading">
            <div>
              <span>Recepciós napi áttekintés</span>
              <h2>Időpontok napok szerint</h2>
            </div>
            <button onClick={() => navigate("/appointments/calendar?mode=days")}>Teljes naptár</button>
          </div>
        )}

        <header className="interactive-calendar-toolbar operational-calendar-toolbar">
          <div className="calendar-nav">
            <button onClick={() => moveAnchor(-1)} aria-label="Előző nap">‹</button>
            <button onClick={goToday}>Ma</button>
            <button onClick={() => moveAnchor(1)} aria-label="Következő nap">›</button>
            <strong className="operational-calendar-title">{calendarTitle}</strong>
          </div>

          <label className="calendar-employee-search">
            <Search size={16}/>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={searchPlaceholder}/>
          </label>

          <div className="calendar-compact-stats">
            <span><CalendarDays size={14}/><b>{appointments.length}</b> foglalás</span>
            <span><Users size={14}/><b>{activeEmployees}/{employees.length}</b> munkatárs</span>
            <span><Clock3 size={14}/><b>{Math.round(plannedMinutes / 60 * 10) / 10}</b> óra</span>
          </div>

          <div className="modern-view-switcher operational-mode-switcher">
            <button className={mode === "days" ? "active" : ""} onClick={() => changeMode("days")}>
              <CalendarDays size={15}/> Napok szerint
            </button>
            <button className={mode === "staff" ? "active" : ""} onClick={() => changeMode("staff")}>
              <Users size={15}/> Dolgozók szerint
            </button>
            <button className={mode === "services" ? "active" : ""} onClick={() => changeMode("services")}>
              <LayoutGrid size={15}/> Részlegek szerint
            </button>
            {!embedded && (
              <button onClick={() => navigate("/modules/appointments/list")}>
                <List size={15}/> Lista
              </button>
            )}
          </div>

          <button className="operational-add-button" onClick={() => openNewAppointment()}>
            <Plus size={16}/> Új időpont
          </button>
        </header>

        {error && <div className="interactive-calendar-error">{error}</div>}

        <div className={`operational-calendar-scroll ${loading ? "is-loading" : ""}`}>
          {columns.length ? (
            <div
              className="operational-calendar-grid"
              style={{
                gridTemplateColumns: `76px repeat(${columns.length}, minmax(${columnWidth}px, 1fr))`,
                minWidth: boardMinWidth,
              }}
            >
              <div className="operational-time-head">Idő</div>
              {columns.map((column) => (
                <div className="operational-column-header" key={`head-${column.id}`}>
                  <strong>{column.title}</strong>
                  <small>{column.subtitle}</small>
                </div>
              ))}

              <div className="operational-time-axis" style={{ height: TIMELINE_HEIGHT }}>
                {timeLabels.map((minutes) => (
                  <span
                    key={minutes}
                    style={{ top: Math.max(0, (minutes - START_MINUTES) * PX_PER_MINUTE - 9) }}
                  >
                    {String(Math.floor(minutes / 60)).padStart(2, "0")}:{String(minutes % 60).padStart(2, "0")}
                  </span>
                ))}
              </div>

              {columns.map((column) => {
                const positioned = layoutAppointments(appointmentsForColumn(column));
                const showNow = column.date === today && nowMinutes >= START_MINUTES && nowMinutes <= END_MINUTES;
                return (
                  <div
                    key={`body-${column.id}`}
                    className="operational-column-body"
                    style={{ height: TIMELINE_HEIGHT }}
                    onClick={(event) => {
                      if ((event.target as HTMLElement).closest(".operational-calendar-event")) return;
                      openNewAppointment(column, event.clientY, event.currentTarget);
                    }}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => void handleDrop(event, column)}
                  >
                    {showNow && <div className="operational-now-line" style={{ top: nowTop }}><i/></div>}

                    {positioned.map(({ item, startMinutes, endMinutes, lane, lanes }) => {
                      const clippedStart = Math.max(START_MINUTES, startMinutes);
                      const clippedEnd = Math.min(END_MINUTES, endMinutes);
                      const serviceLabel = appointmentServiceKey(item);
                      const palette = serviceColors.get(appointmentDepartment(item)) || SERVICE_PALETTE[0];
                      const left = (lane / lanes) * 100;
                      const width = 100 / lanes;
                      const employee = item.employee_id ? employeeById.get(String(item.employee_id)) : "";
                      const operational = appointmentOperationalStatus(item, statusNow);
                      const eventHeight = Math.max(40, (clippedEnd - clippedStart) * PX_PER_MINUTE - 4);
                      const compact = eventHeight < 68;
                      return (
                        <button
                          type="button"
                          key={item.id}
                          draggable={!operational.closed}
                          className={`operational-calendar-event ${operational.className} ${operational.closed ? "is-closed" : ""} ${compact ? "is-compact" : ""}`}
                          title={`${operational.label} · Kattintás: munkalap létrehozása / megnyitása`}
                          onDragStart={(event) => {
                            if (operational.closed) {
                              event.preventDefault();
                              return;
                            }
                            draggedAppointmentId.current = item.id;
                            event.dataTransfer.effectAllowed = "move";
                            event.dataTransfer.setData("text/appointment-id", item.id);
                          }}
                          onDragEnd={() => {
                            draggedAppointmentId.current = null;
                          }}
                          onClick={(event) => {
                            event.stopPropagation();
                            navigate(`/workorders/new?appointment_id=${encodeURIComponent(item.id)}`);
                          }}
                          style={{
                            top: (clippedStart - START_MINUTES) * PX_PER_MINUTE + 2,
                            height: eventHeight,
                            left: `calc(${left}% + 4px)`,
                            width: `calc(${width}% - 8px)`,
                            background: palette.background,
                            borderColor: palette.border,
                            color: palette.text,
                          }}
                        >
                          <div className="operational-event-topline">
                            <b>{formatTime(item.start_time)} – {formatTime(item.end_time)}</b>
                            <span className="operational-status-badge">{operational.label}</span>
                          </div>
                          <strong>{item.client_name || item.title || "Vendég"}</strong>
                          <div className="operational-event-details">
                            <small>{serviceLabel}</small>
                            {mode !== "staff" && employee && <small>{employee}</small>}
                          </div>
                          <small className="operational-event-created">{formatCreatedAt(item.created_at)}</small>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="operational-calendar-empty">
              {loading ? "Naptár betöltése…" : mode === "staff" ? "Nincs megjeleníthető munkatárs." : "Nincs megjeleníthető időpont vagy szolgáltatás."}
            </div>
          )}
        </div>
      </section>

      {modal.open && (
        <AppointmentNewModal
          onSaved={() => {
            setModal({ open: false });
            setReloadKey((value) => value + 1);
          }}
          onClose={() => setModal({ open: false })}
          initialEmployeeId={modal.employeeId}
          initialDate={modal.date}
          initialStartMinutes={modal.startMinutes}
          initialDurationMinutes={modal.duration || 30}
        />
      )}

      {!embedded && (
        <AppointmentDrawer
          open={Boolean(drawerId)}
          mode="edit"
          appointmentId={drawerId}
          employees={employees.map((item) => ({ id: item.id, full_name: employeeName(item), photo_url: item.photo_url || undefined }))}
          onClose={() => setDrawerId(null)}
          onChanged={() => {
            setDrawerId(null);
            setReloadKey((value) => value + 1);
          }}
        />
      )}
    </main>
  );
}
