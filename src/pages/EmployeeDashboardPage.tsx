import React,{useEffect,useMemo,useState}from"react";
import{AlertTriangle,CalendarDays,CheckCircle2,Clock3,ClipboardCheck,MessageSquareText,RefreshCw,Umbrella,UserRound}from"lucide-react";
import{useNavigate}from"react-router-dom";
import api from"../api/api";
import"./EmployeeDashboardPage.css";

type Status={total:number;completed:number;missing:number;percent:number;warning:boolean;state:"green"|"amber"|"red"};
type SelfData={employee:{full_name:string;position_name?:string;location_name?:string};year:number;attendance:{worked_days_year?:number;worked_days_month?:number;regular_minutes_year?:number;overtime_minutes_year?:number};leave:{entitlement_days?:number|string;carried_days?:number|string;adjustment_days?:number|string;taken_days?:number|string;pending_days?:number|string;remaining_days?:number|string};leave_requests:any[];upcoming_shifts:any[]};
type ChecklistData={summary:Record<"daily"|"weekly"|"monthly",Status>};

const n=(v:any)=>Number(v||0);const hours=(m:any)=>`${(n(m)/60).toLocaleString("hu-HU",{maximumFractionDigits:1})} óra`;
const statusLabel={daily:"Napi",weekly:"Heti",monthly:"Havi"} as const;

export default function EmployeeDashboardPage(){
 const nav=useNavigate();const[data,setData]=useState<SelfData|null>(null);const[check,setCheck]=useState<ChecklistData|null>(null);const[loading,setLoading]=useState(true);const[error,setError]=useState("");
 const load=async()=>{setLoading(true);setError("");try{const[self,cl]=await Promise.all([api.get("/employee-self/dashboard"),api.get("/checklists/my")]);setData(self.data);setCheck(cl.data)}catch(e:any){setError(e?.response?.data?.error||e?.response?.data?.message||e?.message||"A saját dashboard nem tölthető be.")}finally{setLoading(false)}};
 useEffect(()=>{load()},[]);
 const alerts=useMemo(()=>check?(["daily","weekly","monthly"] as const).filter(k=>check.summary?.[k]?.state!=="green"):[],[check]);
 if(loading&&!data)return <main className="employee-dashboard"><div className="employee-state"><RefreshCw className="spin"/> Saját adatok betöltése…</div></main>;
 return <main className="employee-dashboard">
  <header className="employee-hero"><div><span>SAJÁT MUNKATÁRSI FELÜLET</span><h1>{data?.employee?.full_name||"Munkatársi dashboard"}</h1><p>{[data?.employee?.position_name,data?.employee?.location_name].filter(Boolean).join(" · ")||"A saját munkanapok, szabadságok és feladatok egy helyen."}</p></div><button onClick={load} disabled={loading}><RefreshCw size={17} className={loading?"spin":""}/> Frissítés</button></header>
  {error&&<div className="employee-error"><AlertTriangle size={18}/>{error}</div>}
  <section className="employee-kpis">
   <article><CalendarDays/><div><small>Ledolgozott napok</small><strong>{n(data?.attendance?.worked_days_month)} nap</strong><span>Ebben a hónapban · {n(data?.attendance?.worked_days_year)} nap az évben</span></div></article>
   <article><Clock3/><div><small>Rögzített munkaidő</small><strong>{hours(data?.attendance?.regular_minutes_year)}</strong><span>Túlóra: {hours(data?.attendance?.overtime_minutes_year)}</span></div></article>
   <article><Umbrella/><div><small>Kivett szabadság</small><strong>{n(data?.leave?.taken_days).toLocaleString("hu-HU")} nap</strong><span>Függőben: {n(data?.leave?.pending_days).toLocaleString("hu-HU")} nap</span></div></article>
   <article className={n(data?.leave?.remaining_days)<=3?"is-warning":""}><UserRound/><div><small>Még felhasználható</small><strong>{n(data?.leave?.remaining_days).toLocaleString("hu-HU")} nap</strong><span>Éves keret: {n(data?.leave?.entitlement_days)+n(data?.leave?.carried_days)+n(data?.leave?.adjustment_days)} nap</span></div></article>
  </section>
  <section className="employee-grid">
   <article className="employee-panel checklist-panel"><header><div><span>FELADATOK</span><h2>Checklista figyelmeztetések</h2></div><ClipboardCheck/></header>
    <div className="employee-check-status">{(["daily","weekly","monthly"] as const).map(k=>{const s=check?.summary?.[k];return <div key={k} className={`check-status is-${s?.state||"green"}`}><span>{s?.state==="green"?<CheckCircle2/>:<AlertTriangle/>}<b>{statusLabel[k]}</b></span><strong>{s?`${s.completed}/${s.total}`:"–"}</strong><small>{s?.state==="green"?"Rendben":s?.warning?`${s.missing} hiányzó – figyelmeztetés`:`${s?.missing||0} feladat még hátra van`}</small></div>})}</div>
    {alerts.length>0&&<div className="employee-alert"><AlertTriangle/><span><b>Van még elvégzendő feladat.</b><small>A piros jelzés határidős checklist-hiányt jelent.</small></span></div>}
    <button className="employee-primary" onClick={()=>nav("/knowledge-base/checklists")}>Check listák megnyitása</button>
   </article>
   <article className="employee-panel"><header><div><span>BEOSZTÁS</span><h2>Következő saját műszakok</h2></div><CalendarDays/></header>
    <div className="shift-list">{data?.upcoming_shifts?.length?data.upcoming_shifts.slice(0,7).map(s=><div key={s.id}><span><b>{new Date(String(s.work_date).slice(0,10)+"T12:00:00").toLocaleDateString("hu-HU",{weekday:"short",month:"short",day:"numeric"})}</b><small>{s.shift_type||"Műszak"}</small></span><strong>{new Date(s.starts_at).toLocaleTimeString("hu-HU",{hour:"2-digit",minute:"2-digit"})}–{new Date(s.ends_at).toLocaleTimeString("hu-HU",{hour:"2-digit",minute:"2-digit"})}</strong></div>):<div className="employee-empty">A következő 14 napra nincs rögzített műszak.</div>}</div>
    <button className="employee-secondary" onClick={()=>nav("/modules/team/timetable")}>Napi beosztás megnyitása</button>
   </article>
  </section>
  <section className="employee-actions"><button onClick={()=>nav("/modules/team/timetable")}><CalendarDays/><span><b>Saját beosztás</b><small>A napi beosztás látható, csak a saját sor szerkeszthető.</small></span></button><button onClick={()=>nav("/knowledge-base/checklists")}><ClipboardCheck/><span><b>Check listák</b><small>Napi, heti és havi saját feladatok.</small></span></button><button onClick={()=>nav("/staff/chat")}><MessageSquareText/><span><b>Munkatársi chat</b><small>Beszélgetés a kollégákkal.</small></span></button></section>
 </main>;
}
