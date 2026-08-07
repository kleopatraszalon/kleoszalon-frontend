import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle, CalendarCheck2, Clock3, Gauge, RefreshCw,
  UserRoundCheck, UserRoundX, UsersRound,
} from "lucide-react";
import api from "../../api/api";
import "./BookingOperationsPanel.css";

export type BookingOperationAppointment = {
  id: string; start_time: string; end_time: string; employee_id: string | null;
  client_name?: string | null; title?: string | null; status?: string | null;
};
type WaitItem={id:string;client_name:string;phone?:string|null;email?:string|null;status:string;created_at:string;preferred_from?:string|null;employee_name?:string|null};
type BreakItem={id:string;title:string;start_time:string;end_time:string;employee_name?:string|null};
type Props = { appointments: BookingOperationAppointment[]; employeeCount: number; onOpenAppointment?: (id: string) => void; };
const normalizeStatus=(value?:string|null)=>String(value||"confirmed").trim().toLowerCase().replace(/[^a-z0-9_-]/g,"");
const minutesBetween=(start:string,end:string)=>Math.max(0,(new Date(end).getTime()-new Date(start).getTime())/60000);
const timeText=(value:string)=>new Date(value).toLocaleTimeString("hu-HU",{hour:"2-digit",minute:"2-digit"});

export default function BookingOperationsPanel({ appointments, employeeCount, onOpenAppointment }: Props) {
  const[waitlist,setWaitlist]=useState<WaitItem[]>([]),[breaks,setBreaks]=useState<BreakItem[]>([]),[opsError,setOpsError]=useState("");
  const loadOps=async()=>{setOpsError("");try{const[from,to]=[new Date(),new Date()];to.setDate(to.getDate()+7);const[w,b]=await Promise.all([api.get("/transactions/booking-operations/waitlist",{params:{status:"waiting"}}),api.get("/transactions/booking-operations/breaks",{params:{from:from.toISOString(),to:to.toISOString()}})]);setWaitlist(w.data||[]);setBreaks(b.data||[])}catch(e:any){setOpsError(e?.response?.data?.error||e?.message||"A foglalási műveletek nem tölthetők be.")}};
  useEffect(()=>{void loadOps()},[]);
  const setWaitStatus=async(id:string,status:string)=>{try{await api.patch(`/transactions/booking-operations/waitlist/${id}`,{status});await loadOps()}catch(e:any){setOpsError(e?.response?.data?.error||"A várólista nem módosítható.")}};
  const summary = useMemo(() => {
    const now=Date.now(),activeStatuses=new Set(["confirmed","pending","arrived","in_progress","booked"]),cancelledStatuses=new Set(["cancelled","canceled"]),noShowStatuses=new Set(["no_show","noshow"]);
    const active=appointments.filter(i=>activeStatuses.has(normalizeStatus(i.status))),completed=appointments.filter(i=>normalizeStatus(i.status)==="completed"),cancelled=appointments.filter(i=>cancelledStatuses.has(normalizeStatus(i.status))),noShow=appointments.filter(i=>noShowStatuses.has(normalizeStatus(i.status)));
    const plannedMinutes=appointments.reduce((sum,i)=>sum+minutesBetween(i.start_time,i.end_time),0),availableMinutes=Math.max(1,employeeCount*8*60),utilization=Math.min(100,Math.round(plannedMinutes/availableMinutes*100));
    const upcoming=active.filter(i=>new Date(i.start_time).getTime()>=now).sort((a,b)=>new Date(a.start_time).getTime()-new Date(b.start_time).getTime()).slice(0,5);
    const overloadedEmployees=Array.from(appointments.reduce((map,i)=>{if(i.employee_id)map.set(i.employee_id,(map.get(i.employee_id)||0)+minutesBetween(i.start_time,i.end_time));return map},new Map<string,number>())).filter(([,minutes])=>minutes>8*60).length;
    const warnings=[overloadedEmployees?`${overloadedEmployees} munkatársnál 8 órát meghaladó terhelés látható.`:"",noShow.length?`${noShow.length} meg nem jelenés igényel utánkövetést.`:"",cancelled.length>=3?`${cancelled.length} lemondás miatt érdemes várólistát aktiválni.`:"",waitlist.length?`${waitlist.length} vendég vár szabad időpontra.`:""].filter(Boolean);
    return{active,completed,cancelled,noShow,plannedMinutes,utilization,upcoming,warnings};
  },[appointments,employeeCount,waitlist.length]);

  return <section className="booking-operations" aria-label="Napi foglalási irányítóközpont">
    <header className="booking-operations__header"><div><span>FOGLALÁSI IRÁNYÍTÓKÖZPONT</span><h2>Napi működési áttekintés</h2><p>Kapacitás, vendégállapotok, várólista és technikai szünetek egy helyen.</p></div><div className="booking-operations__capacity"><Gauge/><strong>{summary.utilization}%</strong><small>tervezett kapacitás</small></div></header>
    <div className="booking-operations__metrics"><article><CalendarCheck2/><div><strong>{appointments.length}</strong><span>összes foglalás</span></div></article><article><UserRoundCheck/><div><strong>{summary.completed.length}</strong><span>befejezett</span></div></article><article><Clock3/><div><strong>{Math.round(summary.plannedMinutes/6)/10}</strong><span>tervezett óra</span></div></article><article><UsersRound/><div><strong>{waitlist.length}</strong><span>várólistán</span></div></article><article><UserRoundX/><div><strong>{summary.noShow.length}</strong><span>nem jelent meg</span></div></article></div>
    {opsError&&<div className="booking-operations__operror">{opsError}</div>}
    <div className="booking-operations__content"><article className="booking-operations__upcoming"><header><div><span>KÖVETKEZŐ VENDÉGEK</span><h3>Aktuális sorrend</h3></div><b>{summary.active.length} aktív</b></header>{summary.upcoming.length?summary.upcoming.map(item=><button key={item.id} type="button" onClick={()=>onOpenAppointment?.(item.id)}><time>{timeText(item.start_time)}</time><span><b>{item.client_name||item.title||"Vendég"}</b><small>{normalizeStatus(item.status)}</small></span><i>{Math.round(minutesBetween(item.start_time,item.end_time))} perc</i></button>):<p className="booking-operations__empty">Nincs további aktív foglalás.</p>}</article>
      <aside className="booking-operations__alerts"><header><AlertTriangle/><div><span>OPERATÍV JELZÉSEK</span><h3>Figyelmet igényel</h3></div><button className="booking-operations__refresh" onClick={loadOps} title="Frissítés"><RefreshCw size={14}/></button></header>{summary.warnings.length?summary.warnings.map(w=><p key={w}>{w}</p>):<p className="is-ok">Nincs kiemelt működési kockázat.</p>}<div className="booking-operations__statusline"><span><i className="is-confirmed"/> Aktív: {summary.active.length}</span><span><i className="is-cancelled"/> Lemondott: {summary.cancelled.length}</span><span>Technikai szünet: {breaks.length}</span></div></aside></div>
    {(waitlist.length>0||breaks.length>0)&&<div className="booking-operations__secondary"><article><header><span>VÁRÓLISTA</span><b>{waitlist.length}</b></header>{waitlist.slice(0,5).map(w=><div className="booking-operations__waitrow" key={w.id}><span><b>{w.client_name}</b><small>{w.phone||w.email||"Nincs elérhetőség"}{w.employee_name?` · ${w.employee_name}`:""}</small></span><div><button onClick={()=>setWaitStatus(w.id,"contacted")}>Kapcsolatfelvétel</button><button onClick={()=>setWaitStatus(w.id,"booked")}>Foglalva</button></div></div>)}{!waitlist.length&&<small>Nincs várakozó vendég.</small>}</article><article><header><span>KÖVETKEZŐ TECHNIKAI SZÜNETEK</span><b>{breaks.length}</b></header>{breaks.slice(0,5).map(b=><div className="booking-operations__breakrow" key={b.id}><b>{b.employee_name||"Munkatárs"}</b><small>{new Date(b.start_time).toLocaleString("hu-HU")} – {timeText(b.end_time)} · {b.title}</small></div>)}{!breaks.length&&<small>Nincs rögzített szünet.</small>}</article></div>}
  </section>;
}
