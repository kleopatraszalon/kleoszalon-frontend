// src/pages/AppointmentsCalendar.tsx

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { apiFetch } from "../utils/api";
import { AppointmentNewModal } from "../components/AppointmentNewModal";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  LayoutGrid,
  Plus,
  Search,
  SlidersHorizontal,
  Sparkles,
  Users,
} from "lucide-react";
import "./AppointmentsCalendar.css";
type Employee = {
  id: string;
  full_name?: string | null;
  short_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  color?: string | null;
  photo_url?: string | null;
};

type Appt = {
  id: string;
  start_time: string; // ISO
  end_time: string;   // ISO
  employee_id: string | null;
  employee_name?: string | null;
  client_name?: string | null;
  status?: string | null;
  service_names?: string[] | null;
};

// --- Helpers -------------------------------------------------------

function todayISODate(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function minutesSinceMidnight(dateOrIso: string | Date): number {
  const d = typeof dateOrIso === "string" ? new Date(dateOrIso) : dateOrIso;
  return d.getHours() * 60 + d.getMinutes();
}

function timeLabelFromMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function toArray<T>(raw: any): T[] {
  if (Array.isArray(raw)) return raw as T[];
  if (raw && Array.isArray(raw.items)) return raw.items as T[];
  if (raw && Array.isArray(raw.data)) return raw.data as T[];
  return [];
}

// --- Main page -----------------------------------------------------

const MINUTES_START = 8 * 60; // 08:00
const MINUTES_END = 20 * 60;  // 20:00
const SLOT_MIN = 30;

const AppointmentsCalendarPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: userLoading } = (useCurrentUser() as any) || {};

  const [day, setDay] = useState<string>(todayISODate());
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [appointments, setAppointments] = useState<Appt[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [loadingAppts, setLoadingAppts] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [employeeSearch, setEmployeeSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [modalEmployeeId, setModalEmployeeId] = useState<string | undefined>();
  const [modalStartMinutes, setModalStartMinutes] = useState<number | undefined>();

  // --- effects: load employees / appointments ----------------------

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    setLoadingEmployees(true);

    (async () => {
      try {
        const qs =
          user.location_id && typeof user.location_id === "string"
            ? `?location_id=${encodeURIComponent(user.location_id)}`
            : "";
        const raw = await apiFetch<any>(`/api/employees${qs}`);
        if (!cancelled) {
          setEmployees(toArray<Employee>(raw));
        }
      } catch (err) {
        console.error("Employees load error", err);
        if (!cancelled) setEmployees([]);
      } finally {
        if (!cancelled) setLoadingEmployees(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    setLoadingAppts(true);

    (async () => {
      try {
        const qs = (() => {
          const parts: string[] = [];
          parts.push(`from=${encodeURIComponent(day)}`);
          parts.push(`to=${encodeURIComponent(day)}`);
          if (user?.location_id && typeof user.location_id === "string") {
            parts.push(`location_id=${encodeURIComponent(user.location_id)}`);
          }
          return `?${parts.join("&")}`;
        })();

        const raw = await apiFetch<any>(`/api/timetable${qs}`);
        if (!cancelled) {
          const emps = toArray<Employee>(raw?.employees);
          const appts = toArray<Appt>(raw?.appointments);
          // Ha employees effect is fut, nem gond, de itt garantáltan lesz szinkron a naptárhoz.
          if (emps.length) setEmployees(emps);
          setAppointments(appts);
        }
      } catch (err) {
        console.error("Appointments load error", err);
        if (!cancelled) setAppointments([]);
      } finally {
        if (!cancelled) setLoadingAppts(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [day, user, reloadKey]);

  // --- derived: id -> employee, slots, appointments per cell -------

  const slots = useMemo(() => {
    const out: number[] = [];
    for (let m = MINUTES_START; m < MINUTES_END; m += SLOT_MIN) {
      out.push(m);
    }
    return out;
  }, []);

  const apptsByCell = useMemo(() => {
    const map = new Map<string, Appt[]>();
    for (const a of appointments) {
      if (!a.employee_id) continue;
      const startMin = minutesSinceMidnight(a.start_time);
      const key = `${a.employee_id}|${startMin}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    // idő szerint rendezés cellán belül
    map.forEach((list) => {
      list.sort(
        (a: Appt, b: Appt) =>
          minutesSinceMidnight(a.start_time) - minutesSinceMidnight(b.start_time)
      );
    });
    return map;
  }, [appointments]);

  const visibleEmployees = useMemo(() => {
    const needle = employeeSearch.trim().toLocaleLowerCase("hu-HU");
    if (!needle) return employees;
    return employees.filter((employee) =>
      [employee.short_name, employee.full_name, employee.first_name, employee.last_name]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("hu-HU")
        .includes(needle)
    );
  }, [employees, employeeSearch]);

  const activeEmployeeCount = useMemo(
    () => new Set(appointments.map((appointment) => appointment.employee_id).filter(Boolean)).size,
    [appointments]
  );

  const plannedMinutes = useMemo(
    () => appointments.reduce((total, appointment) => {
      const duration = minutesSinceMidnight(appointment.end_time) - minutesSinceMidnight(appointment.start_time);
      return total + Math.max(duration, 0);
    }, 0),
    [appointments]
  );

  // --- actions ------------------------------------------------------

  const changeDay = (delta: number) => {
    const d = new Date(day + "T00:00:00");
    d.setDate(d.getDate() + delta);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    setDay(`${yyyy}-${mm}-${dd}`);
  };

  const openCell = (employeeId: string, startMinutes: number) => {
    setModalEmployeeId(employeeId);
    setModalStartMinutes(startMinutes);
    setShowModal(true);
  };

  const handleSaved = () => {
    setShowModal(false);
    setReloadKey((current) => current + 1);
  };

  // --- render helpers -----------------------------------------------

  const formatDayLabel = () => {
    const d = new Date(day + "T00:00:00");
    return d.toLocaleDateString("hu-HU", {
      weekday: "long",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  const renderAppointmentCell = (employeeId: string, startMinutes: number) => {
    const key = `${employeeId}|${startMinutes}`;
    const list = apptsByCell.get(key) || [];
    if (list.length === 0) return null;

    return (
      <div className="cell-appointments">
        {list.map((a) => {
          const dur =
            minutesSinceMidnight(a.end_time) - minutesSinceMidnight(a.start_time);
          const labelClient = a.client_name || "";
          const labelService =
            Array.isArray(a.service_names) && a.service_names.length > 0
              ? a.service_names.join(", ")
              : "";
          return (
            <div
              key={a.id}
              className={`appt-pill appt-status-${a.status || "other"}`}
              style={{
                minHeight: `${(dur / SLOT_MIN) * 24}px`,
              }}
            >
              <div className="appt-pill-time">
                {timeLabelFromMinutes(startMinutes)} –{" "}
                {timeLabelFromMinutes(startMinutes + dur)}
              </div>
              <div className="appt-pill-title">{labelClient || "Vendég"}</div>
              {labelService && <div className="appt-pill-service">{labelService}</div>}
            </div>
          );
        })}
      </div>
    );
  };

  // --- main render --------------------------------------------------

  if (userLoading) {
    return (
      <div className="home-container app-shell app-shell--collapsed">
        <main className="calendar-container">
          <div className="calendar-loading">Betöltés...</div>
        </main>
      </div>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  return (
    <div className="modern-calendar-page">
      <main className="modern-calendar-main">
        <header className="modern-calendar-hero">
          <div className="modern-calendar-heading">
            <span className="modern-calendar-kicker"><Sparkles size={14}/> Intelligens időbeosztás</span>
            <h1>Naptár és digitális beosztás</h1>
            <p>Foglalások, munkatársak és szabad kapacitások valós időben.</p>
          </div>
          <button className="modern-primary-button" onClick={() => { setModalEmployeeId(undefined); setModalStartMinutes(undefined); setShowModal(true); }}>
            <Plus size={18}/> Új időpont
          </button>
        </header>

        <section className="modern-calendar-summary">
          <article><span><CalendarDays size={18}/></span><div><strong>{appointments.length}</strong><small>Napi foglalás</small></div></article>
          <article><span><Users size={18}/></span><div><strong>{activeEmployeeCount}/{employees.length}</strong><small>Foglalt munkatárs</small></div></article>
          <article><span><Clock3 size={18}/></span><div><strong>{plannedMinutes} perc</strong><small>Tervezett idő</small></div></article>
        </section>

        <section className="modern-calendar-board">
          <header className="modern-calendar-toolbar">
            <div className="modern-date-controls">
              <button onClick={() => changeDay(-1)} aria-label="Előző nap"><ChevronLeft size={19}/></button>
              <button className="modern-today-button" onClick={() => setDay(todayISODate())}>Ma</button>
              <button onClick={() => changeDay(1)} aria-label="Következő nap"><ChevronRight size={19}/></button>
              <label className="modern-date-picker"><CalendarDays size={16}/><input type="date" value={day} onChange={(e) => setDay(e.target.value)}/></label>
            </div>

            <div className="modern-current-date">
              <strong>{formatDayLabel()}</strong>
              {(loadingEmployees || loadingAppts) && <span>Adatok frissítése…</span>}
            </div>

            <div className="modern-view-switcher">
              <button className="active"><LayoutGrid size={15}/> Nap</button>
              <button onClick={() => navigate("/modules/appointments/list")}>Lista</button>
              <button disabled>Hét</button>
              <button disabled>Hónap</button>
            </div>
          </header>

          <div className="modern-calendar-filters">
            <label><Search size={16}/><input value={employeeSearch} onChange={(event) => setEmployeeSearch(event.target.value)} placeholder="Munkatárs keresése..."/></label>
            <button><Filter size={16}/> Szűrés</button>
            <button><SlidersHorizontal size={16}/> Megjelenítés</button>
            <span>{visibleEmployees.length} munkatárs látható</span>
          </div>

        {/* Tábla */}
        <div className="calendar-grid-wrapper">
          <table className="appointments-table modern-appointments-table" style={{ minWidth: `${84 + Math.max(visibleEmployees.length, 1) * 184}px` }}>
            <thead>
              <tr>
                <th className="time-col">Idő</th>
                {visibleEmployees.map((e) => {
                  const name =
                    e.short_name ||
                    e.full_name ||
                    [e.first_name, e.last_name].filter(Boolean).join(" ") ||
                    "Munkatárs";
                  return (
                    <th key={e.id} className="employee-col">
                      <div className="employee-header">
                        {e.photo_url ? (
                          <div
                            className="employee-avatar"
                            style={{
                              backgroundImage: `url(${e.photo_url})`,
                            }}
                          />
                        ) : <div className="employee-avatar employee-avatar-fallback" style={{ background: e.color || undefined }}>{name.split(/\s+/).slice(0, 2).map(part => part[0]).join("")}</div>}
                        <div className="employee-info">
                          <div className="employee-name">{name}</div>
                          <div className="employee-state"><i/> Elérhető</div>
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {slots.map((m) => {
                const now = new Date();
                const isCurrentSlot = day === todayISODate() && minutesSinceMidnight(now) >= m && minutesSinceMidnight(now) < m + SLOT_MIN;
                return (
                <tr key={m} className={isCurrentSlot ? "current-time-row" : ""}>
                  <td className="time-col">
                    <span>{timeLabelFromMinutes(m)}</span>
                  </td>
                  {visibleEmployees.map((e) => (
                    <td
                      key={e.id + "|" + m}
                      className="calendar-cell"
                      onClick={() => openCell(e.id, m)}
                    >
                      {renderAppointmentCell(e.id, m)}
                      <span className="cell-add"><Plus size={14}/></span>
                    </td>
                  ))}
                </tr>
              )})}
            </tbody>
          </table>
        </div>
        </section>

        {/* Új időpont modal */}
        {showModal && (
          <AppointmentNewModal
            onSaved={handleSaved}
            onClose={() => setShowModal(false)}
            initialEmployeeId={modalEmployeeId}
            initialDate={day}
            initialStartMinutes={modalStartMinutes}
            initialDurationMinutes={30}
          />
        )}
      </main>
    </div>
  );
};

export default AppointmentsCalendarPage;
