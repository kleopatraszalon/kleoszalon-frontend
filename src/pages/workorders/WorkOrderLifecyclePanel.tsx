import React, { useMemo } from "react";
import { CheckCircle2, Clock3, Play, RotateCcw, UserCheck, XCircle } from "lucide-react";
import "./WorkOrderLifecyclePanel.css";

export type WorkOrderLifecycleStatus =
  | "waiting"
  | "arrived"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show";

type Props = {
  status: WorkOrderLifecycleStatus;
  startedAt?: string | null;
  completedAt?: string | null;
  onChange: (status: WorkOrderLifecycleStatus) => void;
  disabled?: boolean;
};

const STEPS: Array<{
  value: WorkOrderLifecycleStatus;
  label: string;
  description: string;
  icon: React.ReactNode;
}> = [
  { value: "waiting", label: "Várakozik", description: "A vendég még nem érkezett meg.", icon: <Clock3 /> },
  { value: "arrived", label: "Megérkezett", description: "A vendég fogadásra került.", icon: <UserCheck /> },
  { value: "in_progress", label: "Folyamatban", description: "A szolgáltatás végrehajtása zajlik.", icon: <Play /> },
  { value: "completed", label: "Befejezve", description: "A munkalap lezárásra kész.", icon: <CheckCircle2 /> },
];

const statusLabel = (status: WorkOrderLifecycleStatus) => {
  if (status === "cancelled") return "Visszavonva";
  if (status === "no_show") return "Nem jelent meg";
  return STEPS.find((step) => step.value === status)?.label || status;
};

const formatTime = (value?: string | null) =>
  value ? new Date(value).toLocaleString("hu-HU", { hour: "2-digit", minute: "2-digit", year: "numeric", month: "2-digit", day: "2-digit" }) : "—";

export default function WorkOrderLifecyclePanel({ status, startedAt, completedAt, onChange, disabled }: Props) {
  const activeIndex = useMemo(() => STEPS.findIndex((step) => step.value === status), [status]);
  const exceptional = status === "cancelled" || status === "no_show";

  return (
    <section className="workorder-lifecycle" aria-label="Munkalap folyamatvezérlés">
      <header className="workorder-lifecycle__header">
        <div>
          <span>DIGITÁLIS MUNKALAP</span>
          <h2>Szolgáltatási folyamat</h2>
          <p>A vendég érkezésétől a munkalap lezárásáig egy helyen kezelhető.</p>
        </div>
        <strong className={`workorder-lifecycle__state is-${status}`}>{statusLabel(status)}</strong>
      </header>

      <div className={`workorder-lifecycle__steps ${exceptional ? "is-exceptional" : ""}`}>
        {STEPS.map((step, index) => {
          const active = step.value === status;
          const completed = !exceptional && activeIndex > index;
          return (
            <button
              key={step.value}
              type="button"
              disabled={disabled}
              className={`${active ? "is-active" : ""} ${completed ? "is-complete" : ""}`}
              onClick={() => onChange(step.value)}
            >
              <i>{completed ? <CheckCircle2 /> : step.icon}</i>
              <span><b>{step.label}</b><small>{step.description}</small></span>
            </button>
          );
        })}
      </div>

      <div className="workorder-lifecycle__meta">
        <span><Clock3 /> Megkezdve: <b>{formatTime(startedAt)}</b></span>
        <span><CheckCircle2 /> Befejezve: <b>{formatTime(completedAt)}</b></span>
      </div>

      <footer className="workorder-lifecycle__actions">
        <button type="button" disabled={disabled} onClick={() => onChange("no_show")}><XCircle /> Nem jelent meg</button>
        <button type="button" disabled={disabled} onClick={() => onChange("cancelled")}><XCircle /> Visszavonás</button>
        {exceptional && <button type="button" disabled={disabled} onClick={() => onChange("waiting")}><RotateCcw /> Visszaállítás</button>}
      </footer>
    </section>
  );
}
