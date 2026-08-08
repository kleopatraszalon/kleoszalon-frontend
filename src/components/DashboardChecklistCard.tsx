import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CalendarClock, CheckCircle2, ChevronRight, ClipboardCheck, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";
import "./DashboardChecklistCard.css";

type Frequency = "daily" | "weekly" | "monthly";
type State = "green" | "amber" | "red";
type Status = {
  frequency: Frequency;
  total: number;
  completed: number;
  missing: number;
  percent: number;
  warning: boolean;
  state: State;
};
type ChecklistResponse = {
  employee?: { full_name?: string; position_name?: string | null };
  summary?: Partial<Record<Frequency, Status>>;
};

const label: Record<Frequency, string> = { daily: "Napi", weekly: "Heti", monthly: "Havi" };

function MiniStatus({ status, frequency }: { status?: Status; frequency: Frequency }) {
  const safe = status || { frequency, total: 0, completed: 0, missing: 0, percent: 100, warning: false, state: "green" as State };
  return <div className={`dashboard-checklist-mini is-${safe.state}`}>
    <span>{label[frequency]}</span>
    <b>{safe.completed}/{safe.total}</b>
    <small>{safe.missing ? `${safe.missing} hiányzik` : "kész"}</small>
  </div>;
}

export default function DashboardChecklistCard() {
  const navigate = useNavigate();
  const [data, setData] = useState<ChecklistResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [hidden, setHidden] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get<ChecklistResponse>("/checklists/my");
      setData(response.data || null);
      setHidden(false);
    } catch (error: any) {
      const status = Number(error?.response?.status || 0);
      if ([404, 409].includes(status)) setHidden(true);
      else setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const daily = data?.summary?.daily;
  const weekly = data?.summary?.weekly;
  const monthly = data?.summary?.monthly;
  const overallState: State = useMemo(() => {
    if ([daily, weekly, monthly].some(x => x?.state === "red")) return "red";
    if ([daily, weekly, monthly].some(x => x?.state === "amber")) return "amber";
    return "green";
  }, [daily, weekly, monthly]);

  if (hidden) return null;
  if (loading && !data) return <section className="dashboard-checklist-card is-loading"><RefreshCw className="spin" size={18}/><span>Mai feladatok betöltése…</span></section>;
  if (!data?.summary) return null;

  const headline = daily?.total
    ? daily.missing
      ? `${daily.completed}/${daily.total} napi feladat kész – ${daily.missing} hiányzik`
      : `${daily.completed}/${daily.total} napi feladat kész – minden rendben`
    : "Nincs mára kiosztott napi feladat";
  const message = overallState === "red"
    ? "Van határidős, még nem teljesített feladat. Nyissa meg a check listát."
    : overallState === "amber"
      ? "A feladatok folyamatban vannak. A rendszer a határidő közeledtével pirosan figyelmeztet."
      : "A kötelező feladatok az aktuális időszakban teljesítve vannak.";

  return <section className={`dashboard-checklist-card is-${overallState}`}>
    <div className="dashboard-checklist-main">
      <div className="dashboard-checklist-icon">
        {overallState === "green" ? <CheckCircle2 size={24}/> : overallState === "red" ? <AlertTriangle size={24}/> : <CalendarClock size={24}/>}
      </div>
      <div className="dashboard-checklist-copy">
        <div className="dashboard-checklist-eyebrow"><ClipboardCheck size={14}/> MAI FELADATOK</div>
        <h2>{headline}</h2>
        <p>{message}</p>
        {data.employee?.position_name && <small>{data.employee.full_name} · {data.employee.position_name}</small>}
      </div>
    </div>
    <div className="dashboard-checklist-side">
      <div className="dashboard-checklist-minis">
        <MiniStatus frequency="daily" status={daily}/>
        <MiniStatus frequency="weekly" status={weekly}/>
        <MiniStatus frequency="monthly" status={monthly}/>
      </div>
      <div className="dashboard-checklist-actions">
        <button type="button" className="dashboard-checklist-refresh" onClick={() => void load()} title="Check lista frissítése"><RefreshCw size={16}/></button>
        <button type="button" className="dashboard-checklist-open" onClick={() => navigate("/knowledge-base/checklists")}>Check lista megnyitása <ChevronRight size={17}/></button>
      </div>
    </div>
  </section>;
}
