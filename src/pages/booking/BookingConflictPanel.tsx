import React, { useMemo } from "react";
import { AlertOctagon, CalendarClock, CheckCircle2, ClockAlert, Users } from "lucide-react";
import "./BookingConflictPanel.css";

type Employee = { id: string; name: string };
type Appointment = {
  id: string;
  start_time: string;
  end_time: string;
  employee_id: string | null;
  client_name?: string | null;
  title?: string | null;
  status?: string | null;
};

type Props = {
  employees: Employee[];
  appointments: Appointment[];
  onOpenAppointment?: (id: string) => void;
};

type Conflict = {
  appointmentId: string;
  employeeName: string;
  label: string;
  detail: string;
  severity: "critical" | "warning";
};

const ignoredStatuses = new Set(["cancelled", "canceled", "no_show", "noshow"]);
const statusKey = (value?: string | null) => String(value || "confirmed").trim().toLowerCase();
const minutes = (start: string, end: string) => Math.max(0, (new Date(end).getTime() - new Date(start).getTime()) / 60000);
const time = (value: string) => new Date(value).toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit" });
const dayKey = (value: string) => value.slice(0, 10);

export default function BookingConflictPanel({ employees, appointments, onOpenAppointment }: Props) {
  const analysis = useMemo(() => {
    const employeeNames = new Map(employees.map((item) => [item.id, item.name]));
    const active = appointments.filter((item) => item.employee_id && !ignoredStatuses.has(statusKey(item.status)));
    const grouped = new Map<string, Appointment[]>();

    active.forEach((item) => {
      const key = `${item.employee_id}-${dayKey(item.start_time)}`;
      grouped.set(key, [...(grouped.get(key) || []), item]);
    });

    const conflicts: Conflict[] = [];
    let overtimeEmployees = 0;
    let shortTurnarounds = 0;
    let optimizableGaps = 0;

    grouped.forEach((items) => {
      const sorted = [...items].sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
      const employeeId = sorted[0]?.employee_id || "";
      const employeeName = employeeNames.get(employeeId) || "Munkatárs";
      const totalMinutes = sorted.reduce((sum, item) => sum + minutes(item.start_time, item.end_time), 0);

      if (totalMinutes > 8 * 60) {
        overtimeEmployees += 1;
        conflicts.push({
          appointmentId: sorted[sorted.length - 1].id,
          employeeName,
          label: "Túlóra kockázat",
          detail: `${Math.round(totalMinutes / 6) / 10} tervezett munkaóra ezen a napon.`,
          severity: "warning",
        });
      }

      for (let index = 0; index < sorted.length - 1; index += 1) {
        const current = sorted[index];
        const next = sorted[index + 1];
        const currentEnd = new Date(current.end_time).getTime();
        const nextStart = new Date(next.start_time).getTime();
        const gap = Math.round((nextStart - currentEnd) / 60000);

        if (gap < 0) {
          conflicts.push({
            appointmentId: next.id,
            employeeName,
            label: "Dupla foglalás",
            detail: `${time(current.start_time)}–${time(current.end_time)} és ${time(next.start_time)}–${time(next.end_time)} átfedi egymást.`,
            severity: "critical",
          });
        } else if (gap < 10) {
          shortTurnarounds += 1;
          conflicts.push({
            appointmentId: next.id,
            employeeName,
            label: "Rövid átállási idő",
            detail: `Csak ${gap} perc marad a két vendég között.`,
            severity: "warning",
          });
        } else if (gap >= 30 && gap <= 180) {
          optimizableGaps += 1;
          conflicts.push({
            appointmentId: next.id,
            employeeName,
            label: "Optimalizálható üres idő",
            detail: `${gap} perc üres idő van ${time(current.end_time)} és ${time(next.start_time)} között; az időpontok összerendezésével értékesíthető kapacitás szabadítható fel.`,
            severity: "warning",
          });
        }
      }
    });

    const criticalCount = conflicts.filter((item) => item.severity === "critical").length;
    return { conflicts, criticalCount, overtimeEmployees, shortTurnarounds, optimizableGaps };
  }, [appointments, employees]);

  return (
    <section className="booking-conflicts" aria-label="Foglalási kockázatok">
      <header>
        <div>
          <span><AlertOctagon size={14}/> AUTOMATIKUS ÜTKÖZÉSVIZSGÁLAT</span>
          <h2>Indokolatlan üres idő / optimalizálható időpontok</h2>
          <p>A rendszer az átfedések mellett a foglalások összerendezésével felszabadítható, értékesíthető időt is keresi.</p>
        </div>
        <div className={analysis.criticalCount ? "booking-conflicts__score is-danger" : "booking-conflicts__score is-ok"}>
          {analysis.criticalCount ? <ClockAlert/> : <CheckCircle2/>}
          <strong>{analysis.criticalCount}</strong>
          <small>kritikus ütközés</small>
        </div>
      </header>

      <div className="booking-conflicts__metrics">
        <article><AlertOctagon/><div><strong>{analysis.conflicts.length}</strong><span>összes jelzés</span></div></article>
        <article><Users/><div><strong>{analysis.overtimeEmployees}</strong><span>túlterhelt munkatárs</span></div></article>
        <article><CalendarClock/><div><strong>{analysis.optimizableGaps}</strong><span>optimalizálható üres idő</span></div></article>
      </div>

      <div className="booking-conflicts__list">
        {analysis.conflicts.length ? analysis.conflicts.slice(0, 8).map((item, index) => (
          <button key={`${item.appointmentId}-${index}`} type="button" className={`is-${item.severity}`} onClick={() => onOpenAppointment?.(item.appointmentId)}>
            <span>{item.severity === "critical" ? <AlertOctagon/> : <ClockAlert/>}</span>
            <div><b>{item.label}</b><small>{item.employeeName}</small><p>{item.detail}</p></div>
          </button>
        )) : <div className="booking-conflicts__empty"><CheckCircle2/><div><b>Nincs észlelt ütközés</b><span>A megjelenített időszak foglalásai megfelelően ütemezettek.</span></div></div>}
      </div>
    </section>
  );
}
