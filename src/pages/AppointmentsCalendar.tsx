import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch } from "../utils/api";
import { AppointmentNewModal } from "../components/AppointmentNewModal";
// UGYANONNAN importáld, mint a Home.tsx-ben!
import Sidebar from "../components/Sidebar";

type Appt = {
  id: string;
  employee_name?: string | null;
  client_name?: string | null;
  service_name?: string | null;
  title?: string | null;
  start_time: string; // ISO
  end_time: string;   // ISO
  status?: string | null;
  employee_id?: string | null;
  location_id?: string | null;
};

const HUNGARIAN_DAYS = [
  "Vasárnap",
  "Hétfő",
  "Kedd",
  "Szerda",
  "Csütörtök",
  "Péntek",
  "Szombat",
];

// 06:00–20:00 óránként
const HOURS = Array.from({ length: 15 }, (_, i) => 6 + i);

// ==== Segédfüggvények ====
function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function todayISODate(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function safeJson<T>(txt: string, fallback: T): T {
  try {
    return JSON.parse(txt) as T;
  } catch {
    return fallback;
  }
}

function toArray<T>(x: unknown): T[] {
  if (Array.isArray(x)) return x as T[];
  if (x && typeof x === "object") {
    const anyx: any = x;
    if (Array.isArray(anyx.items)) return anyx.items as T[];
    if (Array.isArray(anyx.data)) return anyx.data as T[];
    const vals = Object.values(anyx);
    if (vals.length && vals.every((v) => typeof v === "object")) {
      return vals as T[];
    }
  }
  return [];
}

function parseISODateOnly(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function startOfWeekMondayFromISO(dateISO: string): Date {
  const d = parseISODateOnly(dateISO);
  const day = d.getDay(); // 0=vasárnap, 1=hétfő...
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function isoDateFromDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function formatDateShortHU(d: Date): string {
  return `${d.getFullYear()}.${pad2(d.getMonth() + 1)}.${pad2(d.getDate())}.`;
}

function formatWeekLabel(monday: Date, saturday: Date): string {
  return `${formatDateShortHU(monday)} – ${formatDateShortHU(saturday)}`;
}

function parseDateTimeToLocal(value: string): Date {
  if (!value) return new Date(NaN);
  const s = value.trim();
  if (s.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  }
  if (s.includes("T")) return new Date(s);
  return new Date(s.replace(" ", "T"));
}

function formatHM(d: Date): string {
  if (Number.isNaN(d.getTime())) return "";
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getStatusStyle(status?: string | null): React.CSSProperties {
  const base: React.CSSProperties = {
    borderRadius: 6,
    padding: "2px 4px",
    fontSize: "11px",
    marginBottom: 2,
    border: "1px solid transparent",
    backgroundColor: "#dbeafe",
    color: "#111827",
  };

  const s = (status || "").toLowerCase();

  if (["booked", "foglalt", "confirmed"].includes(s)) {
    return {
      ...base,
      backgroundColor: "#fed7aa",
      borderColor: "#fdba74",
    };
  }
  if (["completed", "done", "teljesítve"].includes(s)) {
    return {
      ...base,
      backgroundColor: "#bbf7d0",
      borderColor: "#86efac",
    };
  }
  if (["cancelled", "canceled", "törölve"].includes(s)) {
    return {
      ...base,
      backgroundColor: "#fecaca",
      borderColor: "#fca5a5",
      textDecoration: "line-through",
    };
  }

  return base;
}

// ==== Komponens ====
export default function AppointmentsCalendar() {
  const location = useLocation();
  const navigate = useNavigate();

  const [anchorDay, setAnchorDay] = useState<string>(() => {
    const params = new URLSearchParams(location.search);
    return params.get("date") || todayISODate();
  });

  const [items, setItems] = useState<Appt[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  // Sidebar kis naptár: ha az URL-ben változik a ?date=, kövessük
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const fromURL = params.get("date");
    if (fromURL && fromURL !== anchorDay) {
      setAnchorDay(fromURL);
    }
  }, [location.search, anchorDay]);

  const monday = useMemo(
    () => startOfWeekMondayFromISO(anchorDay),
    [anchorDay]
  );

  const saturday = useMemo(() => {
    const d = new Date(monday);
    d.setDate(d.getDate() + 5); // hétfő + 5 = szombat
    return d;
  }, [monday]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [monday]);

  const mondayISO = useMemo(() => isoDateFromDate(monday), [monday]);
  const saturdayISO = useMemo(() => isoDateFromDate(saturday), [saturday]);

  // Heti bejelentkezések betöltése
  useEffect(() => {
    let cancelled = false;

    async function loadWeek() {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch(
          `/api/appointments?from=${mondayISO} 00:00&to=${saturdayISO} 23:59`
        );
        const text = await res.text();
        const raw = safeJson<any>(text, []);
        const arr = toArray<Appt>(raw);
        if (!cancelled) {
          setItems(arr);
        }
      } catch (e) {
        console.error("appointments week load error:", e);
        if (!cancelled) {
          setError("A heti bejelentkezések betöltése sikertelen.");
          setItems([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadWeek();
    return () => {
      cancelled = true;
    };
  }, [mondayISO, saturdayISO, reloadToken]);

  const weekLabel = formatWeekLabel(monday, saturday);

  const changeAnchorDay = (newDate: string) => {
    if (!newDate) return;
    setAnchorDay(newDate);
    const params = new URLSearchParams(location.search);
    params.set("date", newDate);
    navigate({
      pathname: location.pathname,
      search: `?${params.toString()}`,
    });
  };

  const goToday = () => changeAnchorDay(todayISODate());

  const shiftWeek = (delta: number) => {
    const d = parseISODateOnly(anchorDay);
    d.setDate(d.getDate() + delta * 7);
    changeAnchorDay(isoDateFromDate(d));
  };

  // Rács cellák (1 oszlop időnek + 6 nap)
  const cells: React.ReactNode[] = [];

  // Fejléc: "Idő" + napok
  cells.push(
    <div
      key="header-time"
      className="appointments-grid-header-cell appointments-grid-header-time"
    >
      Idő
    </div>
  );

  weekDays.forEach((d, idx) => {
    const dayName = HUNGARIAN_DAYS[d.getDay()] ?? "";
    cells.push(
      <div
        key={`header-day-${idx}`}
        className="appointments-grid-header-cell"
      >
        <div>{dayName}</div>
        <div className="appointments-grid-header-date">
          {pad2(d.getMonth() + 1)}.{pad2(d.getDate())}.
        </div>
      </div>
    );
  });

  // Óránkénti sorok
  HOURS.forEach((hour) => {
    // Bal oldali idő oszlop
    cells.push(
      <div
        key={`time-${hour}`}
        className="appointments-grid-time-cell"
      >
        {pad2(hour)}:00
      </div>
    );

    weekDays.forEach((day, dayIdx) => {
      const apptsForCell = items.filter((a) => {
        const start = parseDateTimeToLocal(a.start_time);
        return sameDay(start, day) && start.getHours() === hour;
      });

      cells.push(
        <div
          key={`cell-${hour}-${dayIdx}`}
          className="appointments-grid-cell"
        >
          {apptsForCell.map((a) => {
            const start = parseDateTimeToLocal(a.start_time);
            const end = parseDateTimeToLocal(a.end_time);
            const title = a.title || a.service_name || "Időpont";
            const client = a.client_name || "";
            const employee = a.employee_name || "";
            const style = getStatusStyle(a.status);

            return (
              <div key={a.id} className="appointments-event" style={style}>
                <div className="appointments-event-title">{title}</div>
                <div className="appointments-event-line">
                  {formatHM(start)}–{formatHM(end)}
                  {client ? ` • ${client}` : ""}
                </div>
                {employee && (
                  <div className="appointments-event-line appointments-event-line--secondary">
                    {employee}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    });
  });

  return (
    <div className="home-container">
      {/* Bal oldalt a meglévő sidebar (logo + menü + kis naptár) */}
      <Sidebar />

      {/* Jobb oldalt a naptár nézet */}
      <div className="calendar-container">
        <div className="appointments-page">
          <div className="appointments-card">
            {/* Fejléc gombokkal */}
            <div className="appointments-header">
              <div className="appointments-header-left">
                <button
                  type="button"
                  className="appointments-button"
                  onClick={goToday}
                >
                  Mai nap
                </button>

                <button
                  type="button"
                  className="appointments-circle-button"
                  onClick={() => shiftWeek(-1)}
                  aria-label="Előző hét"
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="appointments-circle-button"
                  onClick={() => shiftWeek(1)}
                  aria-label="Következő hét"
                >
                  ›
                </button>

                <div className="appointments-week-label">{weekLabel}</div>
              </div>

              <div className="appointments-header-right">
                <input
                  type="date"
                  value={anchorDay}
                  onChange={(e) => changeAnchorDay(e.target.value)}
                  className="appointments-date-input"
                />
                <button
                  type="button"
                  className="appointments-button appointments-button--primary"
                  onClick={() => setShowNew(true)}
                >
                  Új időpont
                </button>
              </div>
            </div>

            {loading && (
              <div className="appointments-info-row">Betöltés…</div>
            )}
            {error && (
              <div className="appointments-info-row appointments-info-row--error">
                {error}
              </div>
            )}

            {/* Heti rács */}
            <div className="appointments-grid-wrapper">
              <div
                className="appointments-grid"
                style={{
                  display: "grid",
                  gridTemplateColumns: `80px repeat(${weekDays.length}, minmax(
                    160px,
                    1fr
                  ))`,
                }}
              >
                {cells}
              </div>
            </div>
          </div>

          {showNew && (
            <AppointmentNewModal
              onClose={() => setShowNew(false)}
              onSaved={() => {
                setShowNew(false);
                setReloadToken((x) => x + 1);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
