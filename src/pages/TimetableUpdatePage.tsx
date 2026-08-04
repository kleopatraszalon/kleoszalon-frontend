import React, { useEffect, useMemo, useState } from "react";
import "./timetableUpdate.css";
import AppointmentDrawer from "../components/AppointmentDrawer";

type TimetableEmployee = {
  id: string;
  full_name?: string;
  short_name?: string;
  photo_url?: string;
  color?: string;
  role?: string;
  location_id?: string;
  location_name?: string;
};

type TimetableAppointment = {
  id: string;
  employee_id: string;
  client_id: string | null;
  client_name: string;
  location_id: string;
  location_name: string | null;
  title: string | null;
  start_time: string;
  end_time: string;
  status: string | null;
  notes: string | null;
  service_names?: string[];
  total?: number;
};

const START_HOUR = 7;
const END_HOUR = 20;
const PX_PER_30MIN = 28;

function pad2(n: number) { return String(n).padStart(2, "0"); }
function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  return `${y}-${m}-${day}`;
}
function weekdayHU(i: number) { return ["Hétfő","Kedd","Szerda","Csütörtök","Péntek","Szombat","Vasárnap"][i]; }
function formatHUDate(d: Date) {
  const months = ["jan","feb","márc","ápr","máj","jún","júl","aug","szept","okt","nov","dec"];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}
function getWeekDates(anchor: Date) {
  const d = new Date(anchor);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return Array.from({ length: 7 }).map((_, i) => {
    const x = new Date(d);
    x.setDate(d.getDate() + i);
    return x;
  });
}
function minToTime(m: number) {
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  return `${pad2(hh)}:${pad2(mm)}`;
}

async function apiJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    ...init,
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}${t ? ` — ${t}` : ""}`);
  }
  return (await res.json()) as T;
}

export default function TimetableUpdatePage() {
  const [anchor, setAnchor] = useState<Date>(new Date());
  const [search, setSearch] = useState("");
  const week = useMemo(() => getWeekDates(anchor), [anchor]);
  const from = useMemo(() => toISODate(week[0]), [week]);
  const to = useMemo(() => toISODate(week[6]), [week]);

  const [appointments, setAppointments] = useState<TimetableAppointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"create"|"edit">("edit");
  const [activeAppointmentId, setActiveAppointmentId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const data = await apiJson<{ employees: TimetableEmployee[]; appointments: TimetableAppointment[] }>(
          `/api/timetable?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
        );
        if (!mounted) return;
        setAppointments(data.appointments || []);
      } catch (e: any) {
        if (!mounted) return;
        setErr(e?.message || "Hiba a betöltésnél");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [from, to]);

  const filteredAppointments = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return appointments;
    return appointments.filter(a => `${a.client_name} ${a.title || ""}`.toLowerCase().includes(q));
  }, [appointments, search]);

  const gridHeightPx = useMemo(() => ((END_HOUR - START_HOUR) * 2) * PX_PER_30MIN, []);

  const apByDay = useMemo(() => {
    const map = new Map<number, TimetableAppointment[]>();
    for (let i = 0; i < 7; i++) map.set(i, []);
    for (const a of filteredAppointments) {
      const s = new Date(a.start_time);
      const dayIndex = Math.floor((Date.UTC(s.getFullYear(), s.getMonth(), s.getDate()) - Date.UTC(week[0].getFullYear(), week[0].getMonth(), week[0].getDate())) / 86400000);
      if (dayIndex < 0 || dayIndex > 6) continue;
      map.get(dayIndex)!.push(a);
    }
    for (const [k, arr] of map.entries()) {
      arr.sort((x, y) => +new Date(x.start_time) - +new Date(y.start_time));
      map.set(k, arr);
    }
    return map;
  }, [filteredAppointments, week]);

  function openAppointment(id: string) {
    setActiveAppointmentId(id);
    setDrawerMode("edit"); setDrawerOpen(true);
  }

  return (
    <div className="home-container app-shell app-shell--collapsed">
      <div className="page-content">
        <div className="tt-page">
          <div className="tt-topbar">
            <div className="tt-topbar-left">
              <button className="tt-btn" onClick={() => setAnchor(new Date())}>Mai nap</button>
              <button className="tt-btn" onClick={() => setAnchor(new Date(anchor.getTime() - 7 * 86400000))}>‹</button>
              <button className="tt-btn" onClick={() => setAnchor(new Date(anchor.getTime() + 7 * 86400000))}>›</button>
              <div className="tt-week-range">{formatHUDate(week[0])} – {formatHUDate(week[6])}</div>
            </div>
            <div className="tt-topbar-right">
              <input className="tt-input" placeholder="Keresés…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          <div className="tt-content">
            <div className="tt-calendar">
              {err ? <div className="tt-warn">{err}</div> : null}
              {loading ? <div className="tt-muted">Betöltés…</div> : null}

              <div className="tt-header-row">
                <div className="tt-time-col" />
                {week.map((d, i) => (
                  <div key={i} className="tt-day-header">
                    <div className="tt-day-name">{weekdayHU(i)}</div>
                    <div className="tt-day-date">{formatHUDate(d)}</div>
                  </div>
                ))}
              </div>

              <div className="tt-grid">
                <div className="tt-time-col">
                  <div style={{ height: 8 }} />
                  {Array.from({ length: ((END_HOUR - START_HOUR) * 2) + 1 }).map((_, idx) => {
                    const min = START_HOUR * 60 + idx * 30;
                    const show = min % 60 === 0;
                    return (
                      <div key={idx} className="tt-slot" style={{ height: PX_PER_30MIN }}>
                        {show ? <div className="tt-time-label">{minToTime(min)}</div> : null}
                      </div>
                    );
                  })}
                </div>

                {Array.from({ length: 7 }).map((_, dayIdx) => (
                  <div key={dayIdx} className="tt-day-col" style={{ height: gridHeightPx }}>
                    {Array.from({ length: ((END_HOUR - START_HOUR) * 2) + 1 }).map((__, idx) => (
                      <div key={idx} className="tt-line" style={{ top: idx * PX_PER_30MIN }} />
                    ))}

                    {(apByDay.get(dayIdx) ?? []).map((a) => {
                      const s = new Date(a.start_time);
                      const e = new Date(a.end_time);
                      const startMin = s.getHours() * 60 + s.getMinutes();
                      const endMin = e.getHours() * 60 + e.getMinutes();
                      const topPx = ((startMin - START_HOUR * 60) / 30) * PX_PER_30MIN;
                      const hPx = ((endMin - startMin) / 30) * PX_PER_30MIN;

                      return (
                        <div
                          key={a.id}
                          className="tt-event"
                          style={{ top: topPx, height: Math.max(28, hPx) }}
                          onClick={() => openAppointment(a.id)}
                          role="button"
                          tabIndex={0}
                        >
                          <div className="tt-event-bar" />
                          <div className="tt-event-body">
                            <div className="tt-event-title">
                              <span className="tt-ellipsis">{a.client_name || a.title || "Foglalás"}</span>
                              <span className="tt-event-time">{minToTime(startMin)}–{minToTime(endMin)}</span>
                            </div>
                            <div className="tt-event-sub tt-ellipsis">
                              {(a.service_names && a.service_names.length ? a.service_names.join(", ") : a.title) || ""}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* right panel kept as-is in your current version (optional). */}
          </div>
        </div>
      </div>

      <AppointmentDrawer
        mode={drawerMode}
        open={drawerOpen}
        appointmentId={activeAppointmentId}
        onClose={() => setDrawerOpen(false)}
        onChanged={() => {
          // refresh after save
          setAnchor(new Date(anchor));
        }}
      />
    </div>
  );
}
