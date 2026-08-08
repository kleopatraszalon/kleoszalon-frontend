import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  CalendarPlus,
  CheckCircle2,
  ClipboardCheck,
  ClipboardPlus,
  PackagePlus,
  ReceiptText,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import api from "../../api/api";
import LoyaltyDashboardWidget from "./LoyaltyDashboardWidget";
import "./ExecutiveDashboardExtras.css";

type DashboardStats = Record<string, number | string | null | undefined>;
type DashboardAlert = { level?: string; title?: string; detail?: string };
type Props = { stats: DashboardStats; alerts?: DashboardAlert[] };
type ChecklistState = "green" | "amber" | "red";
type ChecklistPeriod = { total:number; completed:number; missing:number; percent:number; warning:boolean; state:ChecklistState } | null;
type ChecklistEmployee = {
  employee_id:string;
  full_name:string;
  location_name?:string|null;
  position_name?:string|null;
  daily:ChecklistPeriod;
  weekly:ChecklistPeriod;
  monthly:ChecklistPeriod;
};
type ChecklistStatusResponse = {
  summary?:{employees:number;red:number;amber:number;green:number};
  employees?:ChecklistEmployee[];
};

const money = (value: unknown) => `${Number(value || 0).toLocaleString("hu-HU", { maximumFractionDigits: 0 })} Ft`;
const number = (value: unknown) => Number(value || 0).toLocaleString("hu-HU", { maximumFractionDigits: 0 });
const stateRank:Record<ChecklistState,number>={red:0,amber:1,green:2};
const periodLabel={daily:"Napi",weekly:"Heti",monthly:"Havi"} as const;

function worstState(employee:ChecklistEmployee):ChecklistState {
  return ([employee.daily,employee.weekly,employee.monthly].filter(Boolean) as Exclude<ChecklistPeriod,null>[])
    .reduce<ChecklistState>((worst,current)=>stateRank[current.state]<stateRank[worst]?current.state:worst,"green");
}

function PeriodPill({label,status}:{label:string;status:ChecklistPeriod}) {
  if(!status)return <span className="checklist-period-pill is-empty"><b>{label}</b><small>nincs feladat</small></span>;
  return <span className={`checklist-period-pill is-${status.state}`} title={`${status.completed}/${status.total} kész`}>
    <b>{label}</b><strong>{status.completed}/{status.total}</strong><small>{status.missing ? `${status.missing} hiányzik` : "kész"}</small>
  </span>;
}

export default function ExecutiveDashboardExtras({ stats, alerts = [] }: Props) {
  const navigate = useNavigate();
  const [checklists,setChecklists]=useState<ChecklistStatusResponse>({employees:[]});
  const [checklistLoading,setChecklistLoading]=useState(true);
  const [checklistError,setChecklistError]=useState("");

  useEffect(()=>{
    let active=true;
    setChecklistLoading(true);setChecklistError("");
    api.get<ChecklistStatusResponse>("/checklists/management/status")
      .then(response=>{if(active)setChecklists(response.data||{employees:[]});})
      .catch(error=>{if(active)setChecklistError(error?.response?.data?.error||error?.message||"A checklisták állapota nem tölthető be.");})
      .finally(()=>{if(active)setChecklistLoading(false);});
    return()=>{active=false};
  },[]);

  const checklistEmployees=useMemo(()=>[...(checklists.employees||[])].sort((a,b)=>{
    const stateDiff=stateRank[worstState(a)]-stateRank[worstState(b)];
    return stateDiff||a.full_name.localeCompare(b.full_name,"hu");
  }),[checklists.employees]);

  const checklistRiskCount=Number(checklists.summary?.red||0)+Number(checklists.summary?.amber||0);
  const summary = useMemo(() => {
    const appointments = Number(stats.activeAppointments || 0);
    const newClients = Number(stats.newClients || 0);
    const noShows = Number(stats.noShowCount || 0);
    const revenue = Number(stats.totalRevenue || 0);
    const capacity = Number(stats.averageCapacity || 0);
    const totalRiskCount=alerts.length+checklistRiskCount;
    const riskText = totalRiskCount ? `${totalRiskCount} vezetői teendő vagy kockázat vár ellenőrzésre.` : "Jelenleg nincs kiemelt vezetői kockázat.";
    return {
      headline: capacity >= 80 ? "A működés magas kihasználtság mellett stabil." : capacity >= 55 ? "A kapacitás megfelelő, de még van értékesíthető idő." : "A kapacitáskihasználtság alacsony, marketing- vagy beosztási beavatkozás indokolt.",
      body: `${number(appointments)} aktív időpont, ${number(newClients)} új vendég és ${number(noShows)} meg nem jelenés mellett ${money(revenue)} bevétel keletkezett a kiválasztott időszakban. ${riskText}`,
      totalRiskCount,
    };
  }, [alerts.length, checklistRiskCount, stats]);
  const actions = [
    { label: "Új időpont", path: "/modules/appointments/new", icon: CalendarPlus },
    { label: "Új munkalap", path: "/workorders/new", icon: ClipboardPlus },
    { label: "Új vendég", path: "/modules/customers/new", icon: UserPlus },
    { label: "Dolgozók", path: "/hr", icon: Users },
    { label: "Új beszerzés", path: "/inventory/purchase", icon: PackagePlus },
    { label: "Kimenő számlák", path: "/finance/invoices/out", icon: ReceiptText },
  ];
  return <section className="executive-extras">
    <article className="executive-summary-card"><div className="executive-summary-card__icon"><Sparkles aria-hidden="true" /></div><div className="executive-summary-card__content"><span>VEZETŐI ÖSSZEFOGLALÓ</span><h2>{summary.headline}</h2><p>{summary.body}</p></div>{summary.totalRiskCount > 0 && <div className="executive-summary-card__risk"><AlertTriangle aria-hidden="true" /><strong>{summary.totalRiskCount}</strong><small>teendő / kockázat</small></div>}</article>
    <article className="executive-actions-card"><header><div><span>GYORSMŰVELETEK</span><h2>Gyakori feladatok</h2></div></header><div className="executive-actions-grid">{actions.map(({ label, path, icon: Icon }) => <button key={path} type="button" onClick={() => navigate(path)}><Icon aria-hidden="true" /><span>{label}</span></button>)}</div></article>

    <article className="executive-checklist-card">
      <header>
        <div><span>VEZETŐI FIGYELMEZTETÉSEK</span><h2>Teendők és kockázatok</h2><p>A check listák aktuális teljesítési állapota. A piros tételek már figyelmeztetési időszakban vannak.</p></div>
        <div className="executive-checklist-card__summary">
          <span className="is-red"><b>{checklists.summary?.red||0}</b><small>kritikus</small></span>
          <span className="is-amber"><b>{checklists.summary?.amber||0}</b><small>folyamatban</small></span>
          <span className="is-green"><b>{checklists.summary?.green||0}</b><small>rendben</small></span>
        </div>
      </header>
      {checklistLoading ? <div className="executive-checklist-empty">Checklist állapotok betöltése…</div> : checklistError ? <div className="executive-checklist-error"><AlertTriangle/>{checklistError}</div> : checklistEmployees.length===0 ? <div className="executive-checklist-empty"><CheckCircle2/> Nincs kiosztott vagy értékelhető check lista.</div> :
      <div className="executive-checklist-scroll">
        {checklistEmployees.map(employee=>{const state=worstState(employee);return <button key={employee.employee_id} type="button" className={`executive-checklist-row is-${state}`} onClick={()=>navigate("/knowledge-base/checklists")}>
          <span className="executive-checklist-row__status">{state==="red"?<AlertTriangle/>:state==="green"?<CheckCircle2/>:<ClipboardCheck/>}</span>
          <span className="executive-checklist-row__person"><b>{employee.full_name}</b><small>{employee.position_name||"Munkatárs"}{employee.location_name?` · ${employee.location_name}`:""}</small></span>
          <span className="executive-checklist-row__periods"><PeriodPill label={periodLabel.daily} status={employee.daily}/><PeriodPill label={periodLabel.weekly} status={employee.weekly}/><PeriodPill label={periodLabel.monthly} status={employee.monthly}/></span>
        </button>})}
      </div>}
      <footer><button type="button" onClick={()=>navigate("/knowledge-base/checklists")}><ClipboardCheck/> Check listák megnyitása</button></footer>
    </article>

    <LoyaltyDashboardWidget />
  </section>;
}
