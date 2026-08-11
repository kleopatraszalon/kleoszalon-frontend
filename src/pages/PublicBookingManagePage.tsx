import React,{useCallback,useEffect,useMemo,useState}from"react";
import{useParams}from"react-router-dom";
import api from"../api";
import"./PublicBookingManagePage.css";

type Service={id:string;name:string;duration_minutes:number;price:number|string|null};
type Booking={id:string;location_id:string;location_name:string;employee_id:string;employee_name:string;client_name:string;title:string;start_time:string;end_time:string;status:string;service_ids:string[];services:Service[];can_reschedule:boolean;can_cancel:boolean};
type Slot={employee_id:string;employee_name:string;start:string;end:string};

const huDateTime=(v:string)=>new Intl.DateTimeFormat("hu-HU",{timeZone:"Europe/Budapest",year:"numeric",month:"long",day:"numeric",weekday:"long",hour:"2-digit",minute:"2-digit"}).format(new Date(v));
const huTime=(v:string)=>new Intl.DateTimeFormat("hu-HU",{timeZone:"Europe/Budapest",hour:"2-digit",minute:"2-digit"}).format(new Date(v));
const isoDate=(v:string)=>new Intl.DateTimeFormat("en-CA",{timeZone:"Europe/Budapest",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(v));
const errText=(error:any)=>String(error?.response?.data?.error||error?.message||"Ismeretlen hiba");

export default function PublicBookingManagePage(){
 const{token=""}=useParams();
 const[booking,setBooking]=useState<Booking|null>(null);
 const[date,setDate]=useState("");
 const[slots,setSlots]=useState<Slot[]>([]);
 const[selected,setSelected]=useState<Slot|null>(null);
 const[loading,setLoading]=useState(true);
 const[slotLoading,setSlotLoading]=useState(false);
 const[actionLoading,setActionLoading]=useState(false);
 const[error,setError]=useState("");
 const[notice,setNotice]=useState("");
 const[cancelMode,setCancelMode]=useState(false);
 const[reason,setReason]=useState("");

 const loadBooking=useCallback(async()=>{
  setLoading(true);setError("");
  try{const{data}=await api.get(`/public/marketing/booking/manage/${encodeURIComponent(token)}`);setBooking(data);setDate(d=>d||isoDate(data.start_time));}
  catch(e){setError(errText(e));setBooking(null)}finally{setLoading(false)}
 },[token]);
 useEffect(()=>{void loadBooking()},[loadBooking]);

 const loadSlots=useCallback(async()=>{
  if(!booking||!date||!booking.service_ids?.length||!booking.can_reschedule){setSlots([]);return}
  setSlotLoading(true);setError("");setSelected(null);
  try{
   const params=new URLSearchParams({location_id:booking.location_id,date,service_ids:booking.service_ids.join(","),exclude_appointment_id:booking.id});
   const{data}=await api.get(`/public/marketing/booking/availability?${params.toString()}`);
   setSlots(Array.isArray(data?.slots)?data.slots:[]);
  }catch(e){setError(errText(e));setSlots([])}finally{setSlotLoading(false)}
 },[booking,date]);
 useEffect(()=>{void loadSlots()},[loadSlots]);

 const selectedSummary=useMemo(()=>selected?`${huDateTime(selected.start)} · ${selected.employee_name}`:"",[selected]);

 const reschedule=async()=>{
  if(!selected)return;
  setActionLoading(true);setError("");setNotice("");
  try{
   await api.post(`/public/marketing/booking/manage/${encodeURIComponent(token)}/reschedule`,{employee_id:selected.employee_id,start_time:selected.start,note:"Vendég által a nyilvános foglaláskezelő felületen módosítva"});
   setNotice("Az időpont módosítása sikerült. Az új időpont adatai lent láthatók.");setSelected(null);setSlots([]);setDate("");await loadBooking();
  }catch(e){setError(errText(e))}finally{setActionLoading(false)}
 };

 const cancelBooking=async()=>{
  setActionLoading(true);setError("");setNotice("");
  try{
   await api.post(`/public/marketing/booking/manage/${encodeURIComponent(token)}/cancel`,{reason:reason.trim()||"Vendég által online lemondva"});
   setNotice("Az időpontot sikeresen lemondta.");setCancelMode(false);await loadBooking();
  }catch(e){setError(errText(e))}finally{setActionLoading(false)}
 };

 return <main className="pbm-shell">
  <section className="pbm-hero">
   <div className="pbm-kicker">KLEOPÁTRA SZÉPSÉGSZALONOK</div>
   <h1>Foglalás kezelése</h1>
   <p>Időpont módosítása vagy lemondása biztonságos, személyes kezelőlinkkel.</p>
  </section>
  <section className="pbm-card">
   {loading&&<div className="pbm-state">Foglalás betöltése…</div>}
   {!loading&&error&&!booking&&<div className="pbm-error">{error}</div>}
   {booking&&<>
    <div className="pbm-summary">
     <div><span>Vendég</span><strong>{booking.client_name}</strong></div>
     <div><span>Szalon</span><strong>{booking.location_name}</strong></div>
     <div><span>Jelenlegi időpont</span><strong>{huDateTime(booking.start_time)}</strong></div>
     <div><span>Szakember</span><strong>{booking.employee_name}</strong></div>
     <div><span>Szolgáltatás</span><strong>{booking.services?.map(s=>s.name).join(", ")||booking.title}</strong></div>
     <div><span>Státusz</span><strong>{booking.status}</strong></div>
    </div>
    {notice&&<div className="pbm-success">{notice}</div>}
    {error&&<div className="pbm-error">{error}</div>}

    {booking.can_reschedule?<section className="pbm-section">
     <h2>Új időpont választása</h2>
     <label className="pbm-date">Dátum<input type="date" value={date} onChange={e=>setDate(e.target.value)}/></label>
     {slotLoading?<div className="pbm-state">Szabad időpontok keresése…</div>:slots.length?<div className="pbm-slots">{slots.map(slot=><button key={`${slot.employee_id}-${slot.start}`} className={selected?.start===slot.start&&selected?.employee_id===slot.employee_id?"active":""} onClick={()=>setSelected(slot)}><b>{huTime(slot.start)}</b><small>{slot.employee_name}</small></button>)}</div>:<div className="pbm-state">Erre a napra nincs elérhető időpont.</div>}
     {selected&&<div className="pbm-confirm"><div><span>Új időpont</span><strong>{selectedSummary}</strong></div><button disabled={actionLoading} onClick={reschedule}>{actionLoading?"Mentés…":"Módosítás megerősítése"}</button></div>}
    </section>:<div className="pbm-state">Ez a foglalás már nem módosítható online.</div>}

    {booking.can_cancel&&<section className="pbm-section pbm-cancel">
     {!cancelMode?<button className="pbm-linkbutton" onClick={()=>setCancelMode(true)}>Nem tudok elmenni – időpont lemondása</button>:<div className="pbm-cancelbox"><h2>Lemondás megerősítése</h2><p>A lemondás után az időpont felszabadul.</p><textarea value={reason} onChange={e=>setReason(e.target.value)} placeholder="Lemondás oka (nem kötelező)" maxLength={500}/><div><button className="pbm-secondary" onClick={()=>setCancelMode(false)}>Mégsem</button><button className="pbm-danger" disabled={actionLoading} onClick={cancelBooking}>{actionLoading?"Lemondás…":"Igen, lemondom"}</button></div></div>}
    </section>}
   </>}
  </section>
  <footer className="pbm-footer">Kleopátra Szépségszalonok · Foglalás 3.0</footer>
 </main>
}
