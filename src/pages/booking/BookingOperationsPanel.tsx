import React, { useMemo } from "react";
import {
  AlertTriangle,
  CalendarCheck2,
  Clock3,
  Gauge,
  UserRoundCheck,
  UserRoundX,
  UsersRound,
} from "lucide-react";
import "./BookingOperationsPanel.css";

export type BookingOperationAppointment = {
  id: string;
  start_time: string;
  end_time: string;
  employee_id: string | null;
  client_name?: string | null;
  title?: string | null;
  status?: string | null;
};

type Props = {
  appointments: BookingOperationAppointment[];
  employeeCount: number;
  onOpenAppointment?: (id: string) => void;
};

const normalizeStatus = (value?: string | null) =>
  String(value || "confirmed").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");

const minutesBetween = (start: string, end: string) =>
  Math.max(0, (new Date(end).getTime() - new Date(start).getTime()) / 60000);

const timeText = (value: string) =>
  new Date(value).toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit" });

export default function BookingOperationsPanel({ appointments, employeeCount, onOpenAppointment }: Props) {
  const summary = useMemo(() => {
    const now = Date.now();
    const activeStatuses = new Set(["confirmed", "pending", "arrived", "in_progress", "booked"]);
    const cancelledStatuses = new Set(["cancelled", "canceled"]);
    const noShowStatuses = new Set(["no_show", "noshow"]);

    const active = appointments.filter((item) => activeStatuses.has(normalizeStatus(item.status)));
    const completed = appointments.filter((item) => normalizeStatus(item.status) === "completed");
    const cancelled = appointments.filter((item) => cancelledStatuses.has(normalizeStatus(item.status)));
    const noShow = appointments.filter((item) => noShowStatuses.has(normalizeStatus(item.status)));
    const plannedMinutes = appointments.reduce((sum, item) => sum + minutesBetween(item.start_time, item.end_time), 0);
    const availableMinutes = Math.max(1, employeeCount * 8 * 60);
    const utilization = Math.min(100, Math.round((plannedMinutes / availableMinutes) * 100));

    const upcoming = active
      .filter((item) => new Date(item.start_time).getTime() >= now)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .slice(0, 5);

    const overloadedEmployees = Array.from(
      appointments.reduce((map, item) => {
        if (!item.employee_id) return map;
        map.set(item.employee_id, (map.get(item.employee_id) || 0) + minutesBetween(item.start_time, item.end_time));
        return map;
      }, new Map<string, number>())
    ).filter(([, minutes]) => minutes > 8 * 60).length;

    const warnings = [
      overloadedEmployees > 0 ? `${overloadedEmployees} munkatársnál 8 órát meghaladó terhelés látható.` : "",
      noShow.length > 0 ? `${noShow.length} meg nem jelenés igényel utánkövetést.` : "",
      cancelled.length >= 3 ? `${cancelled.length} lemondás miatt érdemes várólistát aktiválni.` : "",
    ].filter(Boolean);

    return { active, completed, cancelled, noShow, plannedMinutes, utilization, upcoming, warnings };
  }, [appointments, employeeCount]);

  return (
    <section className="booking-operations" aria-label="Napi foglalási irányítóközpont">
      <header className="booking-operations__header">
        <div>
          <span>FOGLALÁSI IRÁNYÍTÓKÖZPONT</span>
          <h2>Napi működési áttekintés</h2>
          <p>Kapacitás, vendégállapotok és a következő foglalások egy helyen.</p>
        </div>
        <div className="booking-operations__capacity">
          <Gauge />
          <strong>{summary.utilization}%</strong>
          <small>tervezett kapacitás</small>
        </div>
      </header>

      <div className="booking-operations__metrics">
        <article><CalendarCheck2/><div><strong>{appointments.length}</strong><span>összes foglalás</span></div></article>
        <article><UserRoundCheck/><div><strong>{summary.completed.length}</strong><span>befejezett</span></div></article>
        <article><Clock3/><div><strong>{Math.round(summary.plannedMinutes / 6) / 10}</strong><span>tervezett óra</span></div></article>
        <article><UsersRound/><div><strong>{employeeCount}</strong><span>munkatárs</span></div></article>
        <article><UserRoundX/><div><strong>{summary.noShow.length}</strong><span>nem jelent meg</span></div></article>
      </div>

      <div className="booking-operations__content">
        <article className="booking-operations__upcoming">
          <header><div><span>KÖVETKEZŐ VENDÉGEK</span><h3>Aktuális sorrend</h3></div><b>{summary.active.length} aktív</b></header>
          {summary.upcoming.length ? summary.upcoming.map((item) => (
            <button key={item.id} type="button" onClick={() => onOpenAppointment?.(item.id)}>
              <time>{timeText(item.start_time)}</time>
              <span><b>{item.client_name || item.title || "Vendég"}</b><small>{normalizeStatus(item.status)}</small></span>
              <i>{Math.round(minutesBetween(item.start_time, item.end_time))} perc</i>
            </button>
          )) : <p className="booking-operations__empty">Nincs további aktív foglalás a megjelenített időszakban.</p>}
        </article>

        <aside className="booking-operations__alerts">
          <header><AlertTriangle/><div><span>OPERATÍV JELZÉSEK</span><h3>Figyelmet igényel</h3></div></header>
          {summary.warnings.length ? summary.warnings.map((warning) => <p key={warning}>{warning}</p>) : <p className="is-ok">Nincs kiemelt működési kockázat.</p>}
          <div className="booking-operations__statusline">
            <span><i className="is-confirmed"/> Aktív: {summary.active.length}</span>
            <span><i className="is-cancelled"/> Lemondott: {summary.cancelled.length}</span>
          </div>
        </aside>
      </div>
    </section>
  );
}
