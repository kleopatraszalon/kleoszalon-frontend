// src/components/DailyScheduleBoard.tsx
import React, { useEffect, useMemo, useState } from "react";

const API_BASE =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000/api"
    : "https://kleoszalon-api-jon.onrender.com/api";

interface Appointment {
  id: string;
  title: string;
  start: string;
  end: string;
  status?: string | null;
  price?: number | null;
  notes?: string | null;
  location_id?: string | null;
  location_name?: string | null;
  client_name?: string | null;
  service_name?: string | null;
}

interface EmployeeSchedule {
  id: string;
  full_name: string;
  location_id: string | null;
  location_name: string | null;
  appointments: Appointment[];
}

interface LocationSchedule {
  id: string | null;
  name: string;
  employees: EmployeeSchedule[];
}

interface DayScheduleResponse {
  date: string;
  locations: LocationSchedule[];
}

interface User {
  id: string;
  full_name?: string;
  role?: string | null;
  location_id?: string | null;
}

interface DailyScheduleBoardProps {
  user: User | null;
}

/**
 * Napi beosztás tábla:
 *  - admin: minden telephely, minden dolgozó
 *  - nem admin: csak saját location_id-s dolgozók
 * A dátumot a SidebarCalendar `kleo.selectedDate` localStorage + event alapján veszi.
 */
const DailyScheduleBoard: React.FC<DailyScheduleBoardProps> = ({ user }) => {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const stored = localStorage.getItem("kleo.selectedDate");
    if (stored && /^\d{4}-\d{2}-\d{2}$/.test(stored)) return stored;
    return new Date().toISOString().slice(0, 10);
  });

  const [data, setData] = useState<DayScheduleResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // SidebarCalendar event figyelése
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ date: string }>;
      if (ce.detail?.date && /^\d{4}-\d{2}-\d{2}$/.test(ce.detail.date)) {
        setSelectedDate(ce.detail.date);
        localStorage.setItem("kleo.selectedDate", ce.detail.date);
      }
    };

    window.addEventListener("kleo:selectedDate", handler as EventListener);
    return () =>
      window.removeEventListener(
        "kleo:selectedDate",
        handler as EventListener
      );
  }, []);

  // Adatok lekérése
  useEffect(() => {
    const token =
      localStorage.getItem("token") || localStorage.getItem("kleo_token");

    setLoading(true);
    setErrorMsg(null);

    const url = `${API_BASE}/schedule/day?date=${selectedDate}`;

    fetch(url, {
      method: "GET",
      credentials: "include",
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {},
    })
      .then(async (res) => {
        const text = await res.text();
        let json: any = null;
        try {
          json = text ? JSON.parse(text) : null;
        } catch {
          throw new Error("Érvénytelen JSON válasz (schedule/day)");
        }

        if (!res.ok) {
          const errMsg =
            json?.error ||
            `Hiba történt a napi beosztás lekérésekor (HTTP ${res.status})`;
          throw new Error(errMsg);
        }

        setData(json as DayScheduleResponse);
      })
      .catch((err: any) => {
        console.error("❌ Napi beosztás betöltési hiba:", err);
        setErrorMsg(err?.message || "Ismeretlen hiba a napi beosztásnál");
      })
      .finally(() => setLoading(false));
  }, [selectedDate]);

  // Órák skála – itt lehet majd nyitvatartáshoz igazítani
  const hours = useMemo(() => {
    const from = 8; // 08:00
    const to = 20; // 20:00 (nem inclusive a +1 miatt)
    const arr: number[] = [];
    for (let h = from; h <= to; h++) {
      arr.push(h);
    }
    return arr;
  }, []);

  const prettyDate = useMemo(() => {
    if (!selectedDate) return "";
    const [y, m, d] = selectedDate.split("-");
    return `${d}.${m}.${y}.`;
  }, [selectedDate]);

  return (
    <section className="kleo-daily-wrapper">
      <div className="kleo-daily-header">
        <div className="kleo-daily-title-block">
          <h2 className="kleo-daily-title">Napi munkaidő-beosztás</h2>
          <p className="kleo-daily-subtitle">
            {prettyDate} &middot;{" "}
            {user?.role === "admin"
              ? "Admin nézet (összes szalon)"
              : "Saját telephely"}{" "}
            {/* később: location név kiírva */}
          </p>
        </div>
      </div>

      {loading && (
        <div className="kleo-daily-status kleo-daily-status--loading">
          Beosztás betöltése…
        </div>
      )}

      {errorMsg && !loading && (
        <div className="kleo-daily-status kleo-daily-status--error">
          {errorMsg}
        </div>
      )}

      {!loading && !errorMsg && data && data.locations.length === 0 && (
        <div className="kleo-daily-status kleo-daily-status--empty">
          Nincs aktív dolgozó a kiválasztott napra.
        </div>
      )}

      {!loading &&
        !errorMsg &&
        data &&
        data.locations.map((loc) => (
          <div key={loc.id ?? "null"} className="kleo-daily-location-card">
            <div className="kleo-daily-location-header">
              <div className="kleo-daily-location-name">{loc.name}</div>
              <div className="kleo-daily-location-count">
                Dolgozók: {loc.employees.length}
              </div>
            </div>

            <div className="kleo-daily-grid-wrapper">
              {/* Fejléc sor – órák */}
              <div className="kleo-daily-grid-row kleo-daily-grid-row--header">
                <div className="kleo-daily-cell kleo-daily-cell--employee-header">
                  Dolgozó
                </div>
                {hours.map((h) => (
                  <div
                    key={h}
                    className="kleo-daily-cell kleo-daily-cell--hour-header"
                  >
                    {h.toString().padStart(2, "0")}:00
                  </div>
                ))}
              </div>

              {/* Dolgozó sorok */}
              {loc.employees.map((emp) => (
                <div
                  key={emp.id}
                  className="kleo-daily-grid-row kleo-daily-grid-row--body"
                >
                  <div className="kleo-daily-cell kleo-daily-cell--employee">
                    <div className="kleo-daily-employee-name">
                      {emp.full_name}
                    </div>
                    <div className="kleo-daily-employee-count">
                      {emp.appointments.length} foglalás
                    </div>
                  </div>

                  {hours.map((h) => {
                    const slotEvents = emp.appointments.filter((a) => {
                      const start = new Date(a.start);
                      return start.getHours() === h;
                    });

                    return (
                      <div
                        key={`${emp.id}-${h}`}
                        className="kleo-daily-cell kleo-daily-cell--slot"
                        data-employee-id={emp.id}
                        data-hour={h}
                      >
                        {slotEvents.map((ev) => (
                          <div
                            key={ev.id}
                            className={`kleo-daily-event kleo-daily-event--status-${
                              (ev.status || "default").toLowerCase()
                            }`}
                            title={`${ev.title} (${new Date(
                              ev.start
                            ).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })} - ${new Date(ev.end).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })})`}
                          >
                            <div className="kleo-daily-event-title">
                              {ev.service_name || ev.title}
                            </div>
                            {ev.client_name && (
                              <div className="kleo-daily-event-client">
                                {ev.client_name}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        ))}
    </section>
  );
};

export default DailyScheduleBoard;
