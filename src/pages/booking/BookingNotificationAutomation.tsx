import React,{useEffect,useMemo,useState}from"react";
import{BellRing,Mail,Play,RefreshCw,Save}from"lucide-react";
import api from"../../api/api";
import"./BookingNotificationAutomation.css";

type Location={id:string;name:string};
type Settings={confirmation_enabled:boolean;reminder_48h_enabled:boolean;reminder_24h_enabled:boolean;cancellation_enabled:boolean;waitlist_enabled:boolean;review_request_enabled:boolean;review_delay_hours:number};
type QueueItem={id:string;event_type:string;recipient:string;subject:string;status:string;scheduled_at:string;sent_at?:string|null;client_name?:string|null;location_name?:string|null};
const defaults:Settings={confirmation_enabled:true,reminder_48h_enabled:true,reminder_24h_enabled:true,cancellation_enabled:true,waitlist_enabled:true,review_request_enabled:true,review_delay_hours:24};
const labels:Record<string,string>={booking_created:"Foglalási igény",booking_confirmed:"Visszaigazolás",booking_rescheduled:"Időpont-módosítás",booking_cancelled:"Lemondás",reminder_48h:"48 órás emlékeztető",reminder_24h:"24 órás emlékeztető",review_request:"Értékeléskérés"};

export default function BookingNotificationAutomation({toast}:{toast?:(message:string)=>void}){
 const[locations,setLocations]=useState<Location[]>([]),[locationId,setLocationId]=useState("");
 const[settings,setSettings]=useState<Settings>(defaults),[queue,setQueue]=useState<QueueItem[]>([]);
 const[loading,setLoading]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState("");
 const loadLocations=async()=>{try{const r=await api.get("/locations");const rows=Array.isArray(r.data)?r.data:Array.isArray(r.data?.data)?r.data.data:[];setLocations(rows);setLocationId(v=>v||String(rows[0]?.id||localStorage.getItem("kleo_location_id")||""))}catch(e:any){setError(e?.response?.data?.error||e.message||"A telephelyek nem tölthetők be.")}};
 const load=async()=>{if(!locationId)return;setLoading(true);setError("");try{const[s,q]=await Promise.all([api.get("/transactions/booking-communications/settings",{params:{location_id:locationId}}),api.get("/transactions/booking-communications/queue",{params:{location_id:locationId}})]);setSettings({...defaults,...(s.data||{})});setQueue(Array.isArray(q.data)?q.data:[])}catch(e:any){setError(e?.response?.data?.error||e.message||"Az értesítési automatizmusok nem tölthetők be.")}finally{setLoading(false)}};
 useEffect(()=>{void loadLocations()},[]);useEffect(()=>{void load()},[locationId]);
 const save=async()=>{if(!locationId)return;setSaving(true);setError("");try{await api.put("/transactions/booking-communications/settings",{location_id:locationId,...settings});toast?.("Értesítési szabályok mentve.");await load()}catch(e:any){setError(e?.response?.data?.error||e.message||"A beállítások nem menthetők.")}finally{setSaving(false)}};
 const process=async()=>{setLoading(true);try{const r=await api.post("/transactions/booking-communications/process");toast?.(`${Number(r.data?.processed||0)} üzenet feldolgozva.`);await load()}catch(e:any){setError(e?.response?.data?.error||e.message||"A kommunikációs sor nem dolgozható fel.")}finally{setLoading(false)}};
 const counts=useMemo(()=>({pending:queue.filter(x=>x.status==="pending").length,sent:queue.filter(x=>x.status==="sent").length,failed:queue.filter(x=>x.status==="failed").length}),[queue]);
 const toggle=(key:keyof Settings)=>setSettings(s=>({...s,[key]:!s[key]}));
 const rules:[keyof Settings,string,string][]=[
  ["confirmation_enabled","Foglalás visszaigazolása","Azonnal a foglalás létrehozásakor vagy jóváhagyásakor."],
  ["reminder_48h_enabled","48 órás emlékeztető","Két nappal a vendég időpontja előtt."],
  ["reminder_24h_enabled","24 órás emlékeztető","Egy nappal az időpont előtt."],
  ["cancellation_enabled","Lemondás és áthelyezés","Azonnali tájékoztatás változás esetén."],
  ["waitlist_enabled","Várólista kommunikáció","Felszabaduló helyhez kapcsolódó vendégértesítés előkészítve."],
  ["review_request_enabled","Értékelés kérése","A látogatás teljesítése után automatikusan."],
 ];
 return <div className="booking-comms">
  <header className="booking-comms__toolbar"><div><span>AUTOMATIKUS VENDÉGKOMMUNIKÁCIÓ</span><h2>Foglalási értesítések</h2><p>Visszaigazolás, emlékeztető, lemondás és értékeléskérés egy központi sorból.</p></div><div><select value={locationId} onChange={e=>setLocationId(e.target.value)}><option value="">Válasszon telephelyet</option>{locations.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select><button onClick={process} disabled={loading}><Play size={15}/> Sor futtatása</button><button className="primary" onClick={save} disabled={saving||!locationId}><Save size={15}/>{saving?"Mentés…":"Mentés"}</button></div></header>
  {error&&<div className="booking-comms__error">{error}</div>}
  <section className="booking-comms__kpis"><article><BellRing/><b>{counts.pending}</b><span>ütemezve</span></article><article><Mail/><b>{counts.sent}</b><span>elküldve</span></article><article><RefreshCw/><b>{counts.failed}</b><span>hibás</span></article></section>
  <div className="booking-comms__grid"><section className="booking-comms__rules"><h3>Automatikus szabályok</h3>{rules.map(([key,title,detail])=><div className="booking-comms__rule" key={String(key)}><span><b>{title}</b><small>{detail}</small></span><button className={settings[key]?"on":""} onClick={()=>toggle(key)}><i/></button></div>)}<label className="booking-comms__delay"><span>Értékeléskérés késleltetése</span><input type="number" min={0} max={168} value={settings.review_delay_hours} onChange={e=>setSettings(s=>({...s,review_delay_hours:Number(e.target.value||0)}))}/><em>óra</em></label></section>
  <section className="booking-comms__queue"><header><div><h3>Kommunikációs sor</h3><p>A legutóbbi 300 esemény.</p></div><button onClick={load}><RefreshCw size={14}/> Frissítés</button></header>{loading&&!queue.length?<p className="booking-comms__empty">Betöltés…</p>:queue.length?queue.slice(0,80).map(item=><article key={item.id}><span className={`status-${item.status}`}>{item.status}</span><div><b>{labels[item.event_type]||item.event_type}</b><small>{item.client_name||item.recipient} · {item.recipient}</small></div><time>{new Date(item.scheduled_at).toLocaleString("hu-HU")}</time></article>):<p className="booking-comms__empty">Még nincs kommunikációs esemény.</p>}</section></div>
 </div>;
}
