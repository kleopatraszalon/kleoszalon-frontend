import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle, CalendarCheck2, Clock3, Gauge, RefreshCw,
  UserRoundCheck, UserRoundX, UsersRound,
} from "lucide-react";
import api from "../../api/api";
import { useCurrentUser } from "../../hooks/useCurrentUser";
import AppointmentTerminationModal from "./AppointmentTerminationModal";
import "./BookingOperationsPanel.css";

export type BookingOperationAppointment = {
  id: string; start_time: string; end_time: string; employee_id: string | null;
  client_name?: string | null; title?: string | null; status?: string | null;
  work_order_id?: string | null; work_order_number?: string | null;
};
type WaitItem={id:string;client_name:string;phone?:string|null;email?:string|null;status:string;created_at:string;preferred_from?:string|null;employee_name?:string|null};
type BreakItem={id:string;title:string;start_time:string;end_time:string;employee_name?:string|null};
type WorkOrderLink={appointment_id:string;work_order_id:string|null;work_order_number:string|null;created?:boolean;skipped?:boolean};
type Props = { appointments: BookingOperationAppointment[]; employeeCount: number; onOpenAppointment?: (id: string) => void; };
const normalizeStatus=(value?:string|null)=>String(value||"confirmed").trim().toLowerCase().replace(/[^a-z0-9_-]/g,"");
const minutesBetween=(start:string,end:string)=>Math.max(0,(new Date(end).getTime()-new Date(start).getTime())/60000);
const timeText=(value:string)=>new Date(value).toLocaleTimeString("hu-HU",{hour:"2-digit",minute:"2-digit"});
const roleList=(raw:unknown)=>{if(Array.isArray(raw))return raw.map(String).map(x=>x.toLowerCase());try{const parsed=JSON.parse(String(raw||''));if(Array.isArray(parsed))return parsed.map(String).map(x=>x.toLowerCase())}catch{}return String(raw||'').split(',').map(x=>x.replace(/[\[\]"]/g,'').trim().toLowerCase()).filter(Boolean)};
const EDITOR_ROLES=new Set(['admin','administrator','rendszergazda','superadmin','super_admin','receptionist','recepciós','recepcios','reception','location_manager','üzletvezető','uzletvezeto','store_manager','branch_manager']);

export default function BookingOperationsPanel({ appointments, employeeCount, onOpenAppointment }: Props) {
  const navigate=useNavigate();
  const{user}=useCurrentUser() as any;
  const canEditBooking=useMemo(()=>roleList(user?.role).some(role=>EDITOR_ROLES.has(role)),[user?.role]);
  const[waitlist,setWaitlist]=useState<WaitItem[]>([]),[breaks,setBreaks]=useState<BreakItem[]>([]),[opsError,setOpsError]=useState(""),[arrivalBusy,setArrivalBusy]=useState<string|null>(null);
  const[links,setLinks]=useState<Record<string,WorkOrderLink>>({});
  const[termination,setTermination]=useState<{item:BookingOperationAppointment;mode:'cancelled'|'no_show'}|null>(null);
  const loadOps=async()=>{setOpsError("");try{const[from,to]=[new Date(),new Date()];to.setDate(to.getDate()+7);const[w,b]=await Promise.all([api.get("/transactions/booking-operations/waitlist",{params:{status:"waiting"}}),api.get("/transactions/booking-operations/breaks",{params:{from:from.toISOString(),to:to.toISOString()}})]);setWaitlist(w.data||[]);setBreaks(b.data||[])}catch(e:any){setOpsError(e?.response?.data?.error||e?.message||"A foglalási műveletek nem tölthetők be.")}};
  useEffect(()=>{void loadOps()},[]);

  const appointmentKey=useMemo(()=>appointments.map(item=>item.id).sort().join(','),[appointments]);
  useEffect(()=>{
    if(!appointmentKey||!canEditBooking)return;
    let active=true;
    void(async()=>{
      try{
        const response=await api.post('/transactions/booking-workorder/ensure',{appointment_ids:appointments.map(item=>item.id)});
        if(!active)return;
        const next:Record<string,WorkOrderLink>={};
        for(const item of Array.isArray(response.data?.items)?response.data.items:[]){if(item?.appointment_id)next[String(item.appointment_id)]=item}
        for(const item of appointments){if(item.work_order_id)next[item.id]={appointment_id:item.id,work_order_id:item.work_order_id,work_order_number:item.work_order_number||null,created:false}}
        setLinks(current=>({...current,...next}));
      }catch(e:any){
        if(!active)return;
        const status=Number(e?.response?.status||0);
        if(status!==403&&status!==404)setOpsError(e?.response?.data?.message||e?.response?.data?.error||"A foglalások munkalap-kapcsolata nem frissíthető.");
      }
    })();
    return()=>{active=false};
  },[appointmentKey,canEditBooking]);

  const setWaitStatus=async(id:string,status:string)=>{try{await api.patch(`/transactions/booking-operations/waitlist/${id}`,{status});await loadOps()}catch(e:any){setOpsError(e?.response?.data?.error||"A várólista nem módosítható.")}};
  const arriveAndOpen=async(item:BookingOperationAppointment)=>{
    if(!canEditBooking)return;
    setOpsError("");setArrivalBusy(item.id);
    try{
      const response=await api.post(`/transactions/booking-workorder/appointments/${item.id}/arrive`,{});
      const workOrderId=String(response.data?.work_order_id||links[item.id]?.work_order_id||item.work_order_id||'');
      if(!workOrderId)throw new Error('A kapcsolódó munkalap azonosítója nem érkezett vissza.');
      setLinks(current=>({...current,[item.id]:{appointment_id:item.id,work_order_id:workOrderId,work_order_number:response.data?.work_order_number||current[item.id]?.work_order_number||item.work_order_number||null,created:Boolean(response.data?.created)}}));
      navigate(`/workorders/${encodeURIComponent(workOrderId)}`);
    }catch(e:any){setOpsError(e?.response?.data?.error||e?.response?.data?.message||e?.message||"A vendég érkeztetése nem sikerült.")}
    finally{setArrivalBusy(null)}
  };
  const openWorkOrder=async(item:BookingOperationAppointment)=>{
    const workOrderId=String(links[item.id]?.work_order_id||item.work_order_id||'');
    if(workOrderId){navigate(`/workorders/${encodeURIComponent(workOrderId)}`);return}
    await arriveAndOpen(item);
  };
  const summary = useMemo(() => {
    const now=Date.now(),activeStatuses=new Set(["confirmed","pending","arrived","in_progress","booked"]),cancelledStatuses=new Set(["cancelled","canceled"]),noShowStatuses=new Set(["no_show","noshow"]);
    const active=appointments.filter(i=>activeStatuses.has(normalizeStatus(i.status))),completed=appointments.filter(i=>normalizeStatus(i.status)==="completed"),cancelled=appointments.filter(i=>cancelledStatuses.has(normalizeStatus(i.status))),noShow=appointments.filter(i=>noShowStatuses.has(normalizeStatus(i.status)));
    const plannedMinutes=appointments.reduce((sum,i)=>sum+minutesBetween(i.start_time,i.end_time),0),availableMinutes=Math.max(1,employeeCount*8*60),utilization=Math.min(100,Math.round(plannedMinutes/availableMinutes*100));
    const upcoming=active.filter(i=>new Date(i.start_time).getTime()>=now-6*60*60*1000).sort((a,b)=>new Date(a.start_time).getTime()-new Date(b.start_time).getTime()).slice(0,8);
    const overloadedEmployees=Array.from(appointments.reduce((map,i)=>{if(i.employee_id)map.set(i.employee_id,(map.get(i.employee_id)||0)+minutesBetween(i.start_time,i.end_time));return map},new Map<string,number>())).filter(([,minutes])=>minutes>8*60).length;
    const warnings=[overloadedEmployees?`${overloadedEmployees} munkatársnál 8 órát meghaladó terhelés látható.`:"",noShow.length?`${noShow.length} meg nem jelenés igényel utánkövetést.`:"",cancelled.length>=3?`${cancelled.length} lemondás miatt érdemes várólistát aktiválni.`:"",waitlist.length?`${waitlist.length} vendég vár szabad időpontra.`:""].filter(Boolean);
    return{active,completed,cancelled,noShow,plannedMinutes,utilization,upcoming,warnings};
  },[appointments,employeeCount,waitlist.length]);

  return <section className="booking-operations" aria-label="Napi foglalási irányítóközpont">
    <header className="booking-operations__header"><div><span>FOGLALÁSI IRÁNYÍTÓKÖZPONT</span><h2>Napi működési áttekintés</h2><p>Kapacitás, vendégállapotok, várólista és technikai szünetek egy helyen.</p></div><div className="booking-operations__capacity"><Gauge/><strong>{summary.utilization}%</strong><small>tervezett kapacitás</small></div></header>
    <div className="booking-operations__metrics"><article><CalendarCheck2/><div><strong>{appointments.length}</strong><span>összes foglalás</span></div></article><article><UserRoundCheck/><div><strong>{summary.completed.length}</strong><span>befejezett</span></div></article><article><Clock3/><div><strong>{Math.round(summary.plannedMinutes/6)/10}</strong><span>tervezett óra</span></div></article><article><UsersRound/><div><strong>{waitlist.length}</strong><span>várólistán</span></div></article><article><UserRoundX/><div><strong>{summary.noShow.length}</strong><span>nem jelent meg</span></div></article></div>
    {opsError&&<div className="booking-operations__operror">{opsError}</div>}
    <div className="booking-operations__content"><article className="booking-operations__upcoming"><header><div><span>KÖVETKEZŐ VENDÉGEK</span><h3>Aktuális sorrend</h3></div><b>{summary.active.length} aktív</b></header>{summary.upcoming.length?summary.upcoming.map(item=>{const link=links[item.id];const hasWorkOrder=Boolean(link?.work_order_id||item.work_order_id);const status=normalizeStatus(item.status);const arrived=['arrived','in_progress'].includes(status);return <div key={item.id} className="booking-operations__arrivalrow" style={{display:"grid",gridTemplateColumns:"80px minmax(0,1fr) auto",gap:8,alignItems:"center",padding:"8px 0",borderBottom:"1px solid rgba(0,0,0,.06)"}}><time>{timeText(item.start_time)}</time><button type="button" onClick={()=>onOpenAppointment?.(item.id)} style={{border:0,background:"transparent",textAlign:"left",padding:0,cursor:"pointer"}}><b>{item.client_name||item.title||"Vendég"}</b><small style={{display:"block"}}>{status} · {Math.round(minutesBetween(item.start_time,item.end_time))} perc{link?.work_order_number?` · ${link.work_order_number}`:''}</small></button>{canEditBooking?<div style={{display:'flex',gap:6,flexWrap:'wrap',justifyContent:'flex-end'}}><button type="button" disabled={arrivalBusy===item.id} onClick={()=>void(arrived?openWorkOrder(item):arriveAndOpen(item))} style={{border:"1px solid #d6d0dc",borderRadius:10,padding:"7px 10px",background:hasWorkOrder?'#f7f3ff':'#fff',fontWeight:700,cursor:"pointer"}}>{arrivalBusy===item.id?"Nyitás…":arrived?"Munkalap":"Megérkezett + munkalap"}</button><button type="button" onClick={()=>setTermination({item,mode:'cancelled'})} style={{border:'1px solid #e3d2d2',borderRadius:10,padding:'7px 10px',background:'#fff8f8',fontWeight:700,cursor:'pointer'}}>Lemondás</button><button type="button" onClick={()=>setTermination({item,mode:'no_show'})} style={{border:'1px solid #e1d6c6',borderRadius:10,padding:'7px 10px',background:'#fffaf1',fontWeight:700,cursor:'pointer'}}>Nem jelent meg</button></div>:<small style={{color:'#74695f'}}>Csak olvasható</small>}</div>}):<p className="booking-operations__empty">Nincs további aktív foglalás.</p>}</article>
      <aside className="booking-operations__alerts"><header><AlertTriangle/><div><span>OPERATÍV JELZÉSEK</span><h3>Figyelmet igényel</h3></div><button className="booking-operations__refresh" onClick={loadOps} title="Frissítés"><RefreshCw size={14}/></button></header>{summary.warnings.length?summary.warnings.map(w=><p key={w}>{w}</p>):<p className="is-ok">Nincs kiemelt működési kockázat.</p>}<div className="booking-operations__statusline"><span><i className="is-confirmed"/> Aktív: {summary.active.length}</span><span><i className="is-cancelled"/> Lemondott: {summary.cancelled.length}</span><span>Technikai szünet: {breaks.length}</span></div></aside></div>
    {(waitlist.length>0||breaks.length>0)&&<div className="booking-operations__secondary"><article><header><span>VÁRÓLISTA</span><b>{waitlist.length}</b></header>{waitlist.slice(0,5).map(w=><div className="booking-operations__waitrow" key={w.id}><span><b>{w.client_name}</b><small>{w.phone||w.email||"Nincs elérhetőség"}{w.employee_name?` · ${w.employee_name}`:""}</small></span>{canEditBooking&&<div><button onClick={()=>setWaitStatus(w.id,"contacted")}>Kapcsolatfelvétel</button><button onClick={()=>setWaitStatus(w.id,"booked")}>Foglalva</button></div>}</div>)}{!waitlist.length&&<small>Nincs várakozó vendég.</small>}</article><article><header><span>KÖVETKEZŐ TECHNIKAI SZÜNETEK</span><b>{breaks.length}</b></header>{breaks.slice(0,5).map(b=><div className="booking-operations__breakrow" key={b.id}><b>{b.employee_name||"Munkatárs"}</b><small>{new Date(b.start_time).toLocaleString("hu-HU")} – {timeText(b.end_time)} · {b.title}</small></div>)}{!breaks.length&&<small>Nincs rögzített szünet.</small>}</article></div>}
    {canEditBooking&&<AppointmentTerminationModal appointment={termination?.item||null} mode={termination?.mode||null} onClose={()=>setTermination(null)} onDone={()=>window.location.reload()}/>} 
  </section>;
}
