// src/pages/AppointmentsCalendar.tsx

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { apiFetch } from "../utils/api";
import { AppointmentNewModal } from "../components/AppointmentNewModal";
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
        const from = `${day} 00:00`;
        const to = `${day} 23:59`;
        const qs = `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;

        const raw = await apiFetch<any>(`/api/appointments${qs}`);
        if (!cancelled) {
          setAppointments(toArray<Appt>(raw));
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
  }, [day, user]);

  // --- derived: id -> employee, slots, appointments per cell -------

  const slots = useMemo(() => {
    const out: number[] = [];
    for (let m = MINUTES_START; m < MINUTES_END; m += SLOT_MIN) {
      out.push(m);
    }
    return out;
  }, []);

  const employeesById = useMemo(() => {
    const map = new Map<string, Employee>();
    for (const e of employees) {
      if (e.id) map.set(e.id, e);
    }
    return map;
  }, [employees]);

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
    const from = `${day} 00:00`;
    const to = `${day} 23:59`;
    const qs = `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
    apiFetch<any>(`/api/appointments${qs}`)
      .then((raw) => setAppointments(toArray<Appt>(raw)))
      .catch((err) => console.error("Reload appointments error", err));
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
          const label =
            labelClient && labelService
              ? `${labelClient} – ${labelService}`
              : labelClient || labelService || "Időpont";

          return (
            <div
              key={a.id}
              className={`appt-pill appt-status-${a.status || "other"}`}
              style={{
                minHeight: `${(dur / SLOT_MIN) * 24}px`,
              }}
            >
              <div className="appt-pill-title">{label}</div>
              <div className="appt-pill-time">
                {timeLabelFromMinutes(startMinutes)} –{" "}
                {timeLabelFromMinutes(startMinutes + dur)}
              </div>
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
        <Sidebar />
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
    <div className="home-container app-shell app-shell--collapsed">
      <Sidebar user={user} />

      <main className="calendar-container">
        {/* Fejléc + gombsor */}
        <header className="calendar-header">
          <div className="calendar-header-left">
            <button
              className="btn btn-sm"
              onClick={() => changeDay(-1)}
            >
              ◀ Előző nap
            </button>
            <button
              className="btn btn-sm"
              onClick={() => setDay(todayISODate())}
            >
              Mai nap
            </button>
            <button
              className="btn btn-sm"
              onClick={() => changeDay(1)}
            >
              Következő nap ▶
            </button>
            <input
              type="date"
              value={day}
              onChange={(e) => setDay(e.target.value)}
              className="calendar-date-input"
            />
          </div>

          <div className="calendar-header-center">
            <h1 className="calendar-title">{formatDayLabel()}</h1>
            {(loadingEmployees || loadingAppts) && (
              <span className="calendar-subtitle">Betöltés...</span>
            )}
          </div>

          <div className="calendar-header-right">
            <button className="btn btn-sm btn-outline">Napi nézet</button>
            <button className="btn btn-sm btn-outline" disabled>
              Heti nézet
            </button>
            <button className="btn btn-sm btn-outline" disabled>
              Havi nézet
            </button>
          </div>
        </header>

        {/* Tábla */}
        <div className="calendar-grid-wrapper">
          <table className="appointments-table">
            <thead>
              <tr>
                <th className="time-col">Idő</th>
                {employees.map((e) => {
                  const name =
                    e.short_name ||
                    e.full_name ||
                    [e.first_name, e.last_name].filter(Boolean).join(" ") ||
                    "Munkatárs";
                  return (
                    <th key={e.id} className="employee-col">
                      <div className="employee-header">
                        {e.photo_url && (
                          <div
                            className="employee-avatar"
                            style={{
                              backgroundImage: `url(${e.photo_url})`,
                            }}
                          />
                        )}
                        <div className="employee-info">
                          <div className="employee-name">{name}</div>
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {slots.map((m) => (
                <tr key={m}>
                  <td className="time-col">
                    <span>{timeLabelFromMinutes(m)}</span>
                  </td>
                  {employees.map((e) => (
                    <td
                      key={e.id + "|" + m}
                      className="calendar-cell"
                      onClick={() => openCell(e.id, m)}
                    >
                      {renderAppointmentCell(e.id, m)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
