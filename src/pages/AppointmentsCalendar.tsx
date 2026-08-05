import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { DateClickArg, EventResizeDoneArg } from "@fullcalendar/interaction";
import resourceTimeGridPlugin from "@fullcalendar/resource-timegrid";
import type { DatesSetArg, DateSelectArg, EventClickArg, EventDropArg, EventInput } from "@fullcalendar/core";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Clock3, LayoutGrid, List, Plus, Search, Sparkles, Users } from "lucide-react";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { apiFetch } from "../utils/api";
import { AppointmentNewModal } from "../components/AppointmentNewModal";
import AppointmentDrawer from "../components/AppointmentDrawer";
import "./AppointmentsCalendar.css";
import "./InteractiveAppointmentsCalendar.css";
import "./ClassicAppointmentsCalendar.css";

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
  service_names?: string[] | null;
};

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

function employeeName(employee: Employee) {
  return employee.short_name || employee.full_name || [employee.first_name, employee.last_name].filter(Boolean).join(" ") || "Munkatárs";
}

function eventColor(status?: string | null) {
  const key = (status || "confirmed").toLowerCase();
  if (["completed", "done", "finished"].includes(key)) return "#2fa86f";
  if (["cancelled", "canceled", "no_show"].includes(key)) return "#dc5969";
  if (["waiting", "planned"].includes(key)) return "#d59b36";
  return "#7d58df";
}

const EMPLOYEE_COLORS = ["#8f6ad8", "#d58273", "#4a9a8a", "#ca9646", "#5f83c7", "#b96386", "#6c9a52", "#96735f"];
function stableEmployeeColor(id: string, preferred?: string | null) {
  if (preferred) return preferred;
  const hash = Array.from(id).reduce((sum, char) => ((sum * 31) + char.charCodeAt(0)) >>> 0, 0);
  return EMPLOYEE_COLORS[hash % EMPLOYEE_COLORS.length];
}

export default function AppointmentsCalendarPage() {
  const navigate = useNavigate();
  const calendarRef = useRef<FullCalendar | null>(null);
  const { user, loading: userLoading } = (useCurrentUser() as any) || {};
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [range, setRange] = useState({ from: isoDate(new Date()), to: isoDate(new Date()) });
  const [view, setView] = useState("resourceTimeGridDay");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [modal, setModal] = useState<{ open: boolean; employeeId?: string; date?: string; startMinutes?: number; duration?: number }>({ open: false });
  const [drawerId, setDrawerId] = useState<string | null>(null);

  const loadCalendar = useCallback(async () => {
    if (!user) return;
    void reloadKey;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ from: range.from, to: range.to });
      if (user.location_id) params.set("location_id", user.location_id);
      const raw = await apiFetch<any>(`/api/timetable?${params}`);
      setEmployees(toArray<Employee>(raw?.employees));
      setAppointments(toArray<Appointment>(raw?.appointments));
    } catch (reason: any) {
      setError(reason?.message || "Nem sikerült betölteni a naptárat.");
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to, reloadKey, user]);

  useEffect(() => { loadCalendar(); }, [loadCalendar]);

  const visibleEmployees = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase("hu-HU");
    return needle ? employees.filter((item) => employeeName(item).toLocaleLowerCase("hu-HU").includes(needle)) : employees;
  }, [employees, search]);

  const resources = useMemo(() => visibleEmployees.map((item) => ({
    id: item.id,
    title: employeeName(item),
    eventColor: stableEmployeeColor(item.id, item.color),
    extendedProps: { photoUrl: item.photo_url, color: stableEmployeeColor(item.id, item.color) },
  })), [visibleEmployees]);

  const events = useMemo<EventInput[]>(() => appointments
    .filter((item) => !item.employee_id || visibleEmployees.some((employee) => employee.id === item.employee_id))
    .map((item) => ({
      id: item.id,
      resourceId: item.employee_id || undefined,
      start: item.start_time,
      end: item.end_time,
      title: item.client_name || item.title || "Foglalás",
      backgroundColor: eventColor(item.status),
      borderColor: eventColor(item.status),
      extendedProps: item,
    })), [appointments, visibleEmployees]);

  const plannedMinutes = useMemo(() => appointments.reduce((sum, item) => {
    return sum + Math.max(0, (new Date(item.end_time).getTime() - new Date(item.start_time).getTime()) / 60000);
  }, 0), [appointments]);

  const datesSet = (info: DatesSetArg) => {
    const inclusiveEnd = new Date(info.end);
    inclusiveEnd.setDate(inclusiveEnd.getDate() - 1);
    const next = { from: isoDate(info.start), to: isoDate(inclusiveEnd) };
    setRange((current) => current.from === next.from && current.to === next.to ? current : next);
    setView(info.view.type);
  };

  const selectSlot = (info: DateSelectArg) => {
    const start = info.start;
    const duration = Math.max(15, Math.round((info.end.getTime() - start.getTime()) / 60000));
    setModal({ open: true, employeeId: info.resource?.id, date: isoDate(start), startMinutes: start.getHours() * 60 + start.getMinutes(), duration });
    calendarRef.current?.getApi().unselect();
  };

  const clickEmptyDay = (info: DateClickArg) => {
    if (view !== "dayGridMonth") return;
    setModal({ open: true, date: isoDate(info.date), startMinutes: 9 * 60, duration: 30 });
  };

  const saveMove = async (info: EventDropArg | EventResizeDoneArg) => {
    const resourceId = info.event.getResources()[0]?.id || info.event.extendedProps.employee_id;
    try {
      await apiFetch(`/api/appointments/${info.event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start_time: info.event.start?.toISOString(),
          end_time: info.event.end?.toISOString(),
          employee_id: resourceId,
        }),
      });
      setError("");
      setReloadKey((value) => value + 1);
    } catch (reason: any) {
      info.revert();
      setError(reason?.message || "Az időpont nem helyezhető át. Ellenőrizze az ütközéseket.");
    }
  };

  const changeView = (next: string) => calendarRef.current?.getApi().changeView(next);
  const activeEmployees = new Set(appointments.map((item) => item.employee_id).filter(Boolean)).size;

  if (userLoading) return <main className="modern-calendar-page"><div className="calendar-loading">Betöltés…</div></main>;
  if (!user) { navigate("/login"); return null; }

  return <main className="modern-calendar-page">
    <header className="modern-calendar-hero calendar-classic-hero">
      <div className="modern-calendar-heading"><span className="modern-calendar-kicker"><Sparkles size={14}/> Naptár és digitális beosztás</span><h1>Időpontnaptár</h1><p>Munkatársak napi beosztása és foglalásai egy áttekinthető felületen.</p></div>
      <button className="modern-primary-button" onClick={() => setModal({ open: true })}><Plus size={18}/> Új időpont</button>
    </header>

    <section className="modern-calendar-board">
      <header className="interactive-calendar-toolbar">
        <div className="calendar-nav"><button onClick={() => calendarRef.current?.getApi().prev()}>‹</button><button onClick={() => calendarRef.current?.getApi().today()}>Ma</button><button onClick={() => calendarRef.current?.getApi().next()}>›</button></div>
        <label className="calendar-employee-search"><Search size={16}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Munkatárs keresése…"/></label>
        <div className="calendar-compact-stats"><span><CalendarDays size={14}/><b>{appointments.length}</b> foglalás</span><span><Users size={14}/><b>{activeEmployees}/{employees.length}</b> munkatárs</span><span><Clock3 size={14}/><b>{Math.round(plannedMinutes / 60 * 10) / 10}</b> óra</span></div>
        <div className="modern-view-switcher">
          <button className={view === "resourceTimeGridDay" ? "active" : ""} onClick={() => changeView("resourceTimeGridDay")}><LayoutGrid size={15}/> Nap</button>
          <button className={view === "resourceTimeGridWeek" ? "active" : ""} onClick={() => changeView("resourceTimeGridWeek")}>Hét</button>
          <button className={view === "dayGridMonth" ? "active" : ""} onClick={() => changeView("dayGridMonth")}>Hónap</button>
          <button onClick={() => navigate("/modules/appointments/list")}><List size={15}/> Lista</button>
        </div>
      </header>
      {error && <div className="interactive-calendar-error">{error}</div>}
      <div className={`interactive-fullcalendar ${loading ? "is-loading" : ""}`}>
        <FullCalendar
          ref={calendarRef}
          plugins={[resourceTimeGridPlugin, timeGridPlugin, dayGridPlugin, interactionPlugin]}
          initialView="resourceTimeGridDay"
          headerToolbar={{ left: "", center: "title", right: "" }}
          locale="hu"
          firstDay={1}
          resources={resources}
          resourceLabelContent={(info: any) => {
            const title = info.resource.title || "Munkatárs";
            const photo = info.resource.extendedProps?.photoUrl;
            const color = info.resource.extendedProps?.color || "#8f6ad8";
            const initials = title.split(/\s+/).slice(0, 2).map((part: string) => part[0]).join("");
            return <div className="classic-resource-label">{photo ? <img src={photo} alt=""/> : <span style={{ background: color }}>{initials}</span>}<div><b>{title}</b><small><i/> Foglalható</small></div></div>;
          }}
          events={events}
          datesSet={datesSet}
          selectable
          selectMirror
          editable
          eventStartEditable
          eventDurationEditable
          eventResourceEditable
          select={selectSlot}
          dateClick={clickEmptyDay}
          eventClick={(info: EventClickArg) => setDrawerId(info.event.id)}
          eventDrop={saveMove}
          eventResize={saveMove}
          slotDuration="00:15:00"
          snapDuration="00:15:00"
          slotMinTime="07:00:00"
          slotMaxTime="21:00:00"
          scrollTime="08:00:00"
          allDaySlot={false}
          nowIndicator
          height="auto"
          eventTimeFormat={{ hour: "2-digit", minute: "2-digit", hour12: false }}
          eventContent={(info) => <div className="classic-calendar-event"><b>{info.timeText}</b><span>{info.event.title}</span><small>{(info.event.extendedProps.service_names || []).join(", ")}</small></div>}
        />
      </div>
    </section>

    {modal.open && <AppointmentNewModal onSaved={() => { setModal({ open: false }); setReloadKey((value) => value + 1); }} onClose={() => setModal({ open: false })} initialEmployeeId={modal.employeeId} initialDate={modal.date} initialStartMinutes={modal.startMinutes} initialDurationMinutes={modal.duration || 30}/>} 
    <AppointmentDrawer open={Boolean(drawerId)} mode="edit" appointmentId={drawerId} employees={employees.map((item) => ({ id: item.id, full_name: employeeName(item), photo_url: item.photo_url || undefined }))} onClose={() => setDrawerId(null)} onChanged={() => { setDrawerId(null); setReloadKey((value) => value + 1); }}/>
  </main>;
}
