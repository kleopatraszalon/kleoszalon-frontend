import React,{useCallback,useEffect,useMemo,useRef,useState}from"react";
import{CalendarDays,CheckCircle2,ChevronLeft,ChevronRight,Clock3,MapPin,Mic,MicOff,RefreshCw,Scissors,UserRound,Volume2,X}from"lucide-react";
import api from"../api/api";
import"./CustomerBookingPage.css";

type Location={id:string;name:string};
type Service={id:string;name:string;duration_minutes:number;price:number|string;category_name?:string};
type Employee={id:string;full_name:string;photo_url?:string|null;color?:string|null};
type Slot={employee_id:string;employee_name:string;start:string;end:string};
type Customer={full_name:string;email?:string|null;phone?:string|null};
type VoicePeriod="morning"|"afternoon"|"evening"|null;
type VoiceResponse={
 ok:boolean;
 intent:{intent:"book"|"waitlist"|"cancel";location_id:string|null;service_ids:string[];employee_id:string|null;date:string|null;time:string|null;preferred_period:VoicePeriod};
 summary:{location:string|null;services:string[];employee:string|null;date:string|null;time:string|null;preferred_period:VoicePeriod};
 missing_fields:string[];recognized:boolean;ai_used:boolean;requires_confirmation:boolean;spoken_follow_up:string;
};

const pad=(n:number)=>String(n).padStart(2,"0");
const iso=(d:Date)=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const money=(v:unknown)=>`${Number(v||0).toLocaleString("hu-HU",{maximumFractionDigits:0})} Ft`;
const time=(v:string)=>new Date(v).toLocaleTimeString("hu-HU",{hour:"2-digit",minute:"2-digit"});
const minuteOf=(v:string)=>{const d=new Date(v);return d.getHours()*60+d.getMinutes();};
function monthCells(anchor:Date){const first=new Date(anchor.getFullYear(),anchor.getMonth(),1);const start=new Date(first);const day=first.getDay()||7;start.setDate(first.getDate()-day+1);return Array.from({length:42},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);return d})}
function speak(text:string){try{if(!text||typeof window==="undefined"||!("speechSynthesis"in window))return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang="hu-HU";u.rate=.96;window.speechSynthesis.speak(u)}catch{}}

export default function CustomerBookingPage(){
 const today=useMemo(()=>{const d=new Date();d.setHours(12,0,0,0);return d},[]);
 const[month,setMonth]=useState(new Date(today.getFullYear(),today.getMonth(),1));
 const[selectedDate,setSelectedDate]=useState(iso(today));
 const[locations,setLocations]=useState<Location[]>([]);
 const[locationId,setLocationId]=useState("");
 const[services,setServices]=useState<Service[]>([]);
 const[employees,setEmployees]=useState<Employee[]>([]);
 const[selectedServiceIds,setSelectedServiceIds]=useState<string[]>([]);
 const[employeeId,setEmployeeId]=useState("");
 const[slots,setSlots]=useState<Slot[]>([]);
 const[selectedSlot,setSelectedSlot]=useState<Slot|null>(null);
 const[customer,setCustomer]=useState<Customer|null>(null);
 const[settings,setSettings]=useState<any>(null);
 const[loading,setLoading]=useState(false);
 const[booking,setBooking]=useState(false);
 const[waiting,setWaiting]=useState(false);
 const[error,setError]=useState("");
 const[notice,setNotice]=useState("");
 const[confirmOpen,setConfirmOpen]=useState(false);
 const[listening,setListening]=useState(false);
 const[voiceLoading,setVoiceLoading]=useState(false);
 const[voiceTranscript,setVoiceTranscript]=useState("");
 const[voiceResult,setVoiceResult]=useState<VoiceResponse|null>(null);
 const[voiceUsed,setVoiceUsed]=useState(false);
 const recognitionRef=useRef<any>(null);
 const cells=useMemo(()=>monthCells(month),[month]);

 useEffect(()=>{
  api.get("/public/marketing/booking/catalog").then(r=>setLocations((r.data?.locations||[]).map((x:any)=>({id:String(x.id),name:x.name})))).catch(()=>setError("A szalonok nem tölthetők be."));
  api.get("/customer-portal/dashboard").then(r=>setCustomer(r.data?.customer||null)).catch(()=>setError("A foglaláshoz bejelentkezett ügyfélprofil szükséges."));
 },[]);

 useEffect(()=>{
  setSelectedSlot(null);setConfirmOpen(false);setSlots([]);
  if(!locationId){setServices([]);setEmployees([]);setSettings(null);return;}
  let active=true;setLoading(true);setError("");
  api.get("/public/marketing/booking/catalog",{params:{location_id:locationId}}).then(r=>{
   if(!active)return;
   const nextServices=(r.data?.services||[]).map((x:any)=>({...x,id:String(x.id)}));
   const nextEmployees=(r.data?.employees||[]).map((x:any)=>({...x,id:String(x.id)}));
   setServices(nextServices);setEmployees(nextEmployees);setSettings(r.data?.settings||null);
   const allowed=new Set(nextServices.map((x:Service)=>x.id));setSelectedServiceIds(ids=>ids.filter(id=>allowed.has(id)));
   const employeeAllowed=new Set(nextEmployees.map((x:Employee)=>x.id));setEmployeeId(id=>employeeAllowed.has(id)?id:"");
  }).catch((e:any)=>active&&setError(e?.response?.data?.error||"A foglalási katalógus nem tölthető be.")).finally(()=>active&&setLoading(false));
  return()=>{active=false};
 },[locationId]);

 const loadAvailability=useCallback(async()=>{
  setSelectedSlot(null);setConfirmOpen(false);setSlots([]);
  if(!locationId||!selectedDate||!selectedServiceIds.length)return;
  setLoading(true);setError("");
  try{
   const r=await api.get("/public/marketing/booking/availability",{params:{location_id:locationId,date:selectedDate,service_ids:selectedServiceIds.join(","),employee_id:employeeId||undefined}});
   setSlots((r.data?.slots||[]).map((x:any)=>({...x,employee_id:String(x.employee_id)})));
  }catch(e:any){setError(e?.response?.data?.error||e?.message||"A szabad időpontok nem tölthetők be.");}
  finally{setLoading(false)}
 },[locationId,selectedDate,selectedServiceIds,employeeId]);
 useEffect(()=>{void loadAvailability()},[loadAvailability]);

 const selectedServices=useMemo(()=>services.filter(s=>selectedServiceIds.includes(s.id)),[services,selectedServiceIds]);
 const totalDuration=selectedServices.reduce((sum,s)=>sum+Number(s.duration_minutes||0),0);
 const grossTotal=selectedServices.reduce((sum,s)=>sum+Number(s.price||0),0);
 const discount=Number(settings?.online_discount_percent||0);
 const estimatedTotal=Math.max(0,grossTotal*(1-discount/100));
 const availableEmployeeIds=useMemo(()=>new Set(slots.map(s=>s.employee_id)),[slots]);
 const visibleEmployees=selectedServiceIds.length&&!loading?employees.filter(e=>availableEmployeeIds.has(e.id)||e.id===employeeId):employees;

 useEffect(()=>{
  if(!voiceUsed||!voiceResult||!slots.length||selectedSlot)return;
  const pref=voiceResult.intent;let candidates=employeeId?slots.filter(s=>s.employee_id===employeeId):slots;
  if(!candidates.length)candidates=slots;
  if(pref.time){const[h,m]=pref.time.split(":").map(Number),target=h*60+m;candidates=[...candidates].sort((a,b)=>Math.abs(minuteOf(a.start)-target)-Math.abs(minuteOf(b.start)-target));}
  else if(pref.preferred_period){const inPeriod=(s:Slot)=>{const m=minuteOf(s.start);return pref.preferred_period==="morning"?m<720:pref.preferred_period==="afternoon"?m>=720&&m<1020:m>=1020};const filtered=candidates.filter(inPeriod);if(filtered.length)candidates=filtered;}
  if(candidates[0])setSelectedSlot(candidates[0]);
 },[slots,voiceUsed,voiceResult,employeeId,selectedSlot]);

 const chooseLocation=(id:string)=>{setVoiceUsed(false);setVoiceResult(null);setLocationId(id);setSelectedServiceIds([]);setEmployeeId("");setSelectedSlot(null)};
 const toggleService=(id:string)=>{setVoiceUsed(false);setVoiceResult(null);setSelectedServiceIds(ids=>ids.includes(id)?ids.filter(x=>x!==id):[...ids,id]);setSelectedSlot(null)};
 const chooseEmployee=(id:string)=>{setVoiceUsed(false);setVoiceResult(null);setEmployeeId(id===employeeId?"":id);setSelectedSlot(null)};
 const shiftMonth=(delta:number)=>setMonth(m=>new Date(m.getFullYear(),m.getMonth()+delta,1));

 const interpretVoice=async(transcript:string)=>{
  setVoiceLoading(true);setError("");setNotice("");
  try{
   const r=await api.post("/public/marketing/booking/voice/interpret",{transcript});const v=r.data as VoiceResponse;setVoiceResult(v);setVoiceUsed(true);
   if(v.intent.intent==="cancel"){setNotice("A hangfelismerés lemondási szándékot érzékelt. Biztonsági okból meglévő foglalást hang alapján nem törlünk.");speak(v.spoken_follow_up);return;}
   if(v.intent.location_id)setLocationId(v.intent.location_id);
   if(v.intent.service_ids?.length)setSelectedServiceIds(v.intent.service_ids);
   if(v.intent.employee_id)setEmployeeId(v.intent.employee_id);
   if(v.intent.date){setSelectedDate(v.intent.date);const d=new Date(`${v.intent.date}T12:00:00`);if(Number.isFinite(d.getTime()))setMonth(new Date(d.getFullYear(),d.getMonth(),1));}
   setSelectedSlot(null);setConfirmOpen(false);setNotice(v.ai_used?"A hangos kérés AI-val értelmezve. Ellenőrizd az adatokat és a javasolt időpontot.":"A hangos kérés értelmezve. Ellenőrizd az adatokat és a javasolt időpontot.");speak(v.spoken_follow_up);
  }catch(e:any){const msg=e?.response?.data?.error||"A hangos foglalási kérés nem értelmezhető.";setError(msg);speak(msg)}finally{setVoiceLoading(false)}
 };

 const startListening=()=>{
  if(typeof window==="undefined")return;
  const Ctor=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;
  if(!Ctor){setError("Ez a böngésző nem támogatja a beépített beszédfelismerést. Chrome vagy Edge használata javasolt.");return;}
  try{recognitionRef.current?.abort?.()}catch{}
  const recognition=new Ctor();recognition.lang="hu-HU";recognition.interimResults=false;recognition.maxAlternatives=1;
  recognition.onstart=()=>{setListening(true);setError("");setNotice("Mondd el egy mondatban: szalon, szolgáltatás, nap és ha szeretnéd, szakember/időpont.")};
  recognition.onend=()=>setListening(false);
  recognition.onerror=(e:any)=>{setListening(false);setError(e?.error==="not-allowed"?"A mikrofon használata nincs engedélyezve.":"A beszédfelismerés megszakadt. Próbáld újra.")};
  recognition.onresult=(event:any)=>{const text=String(event?.results?.[0]?.[0]?.transcript||"").trim();setVoiceTranscript(text);if(text)void interpretVoice(text)};
  recognitionRef.current=recognition;recognition.start();
 };
 const stopListening=()=>{try{recognitionRef.current?.stop?.()}catch{}setListening(false)};

 const book=async()=>{
  if(!confirmOpen||!selectedSlot||!locationId||!customer||!selectedServiceIds.length)return;
  setBooking(true);setError("");setNotice("");
  try{
   const r=await api.post("/public/marketing/booking/book",{location_id:locationId,employee_id:selectedSlot.employee_id,service_ids:selectedServiceIds,client_name:customer.full_name,phone:customer.phone||"",email:customer.email||"",start_time:selectedSlot.start,booking_source:voiceUsed?"voice":"online"});
   const state=r.data?.confirmation_required?"A foglalás rögzítve, a szalon visszaigazolása szükséges.":"A foglalás sikeresen rögzítve és megerősítve.";
   setNotice(state);speak(state);setSelectedSlot(null);setConfirmOpen(false);setVoiceUsed(false);setVoiceResult(null);await loadAvailability();
  }catch(e:any){setError(e?.response?.data?.error||e?.message||"A foglalás nem sikerült.")}finally{setBooking(false)}
 };

 const joinWaitlist=async()=>{
  if(!locationId||!customer||!selectedServiceIds.length)return;setWaiting(true);setError("");
  try{const from=new Date(`${selectedDate}T00:00:00`),to=new Date(`${selectedDate}T23:59:59`);await api.post("/public/marketing/booking/waitlist",{location_id:locationId,client_name:customer.full_name,phone:customer.phone||"",email:customer.email||"",service_ids:selectedServiceIds,employee_id:employeeId||null,preferred_from:from.toISOString(),preferred_to:to.toISOString(),booking_source:voiceUsed?"voice":"online"});const msg="Felkerültél a várólistára erre a napra.";setNotice(msg);speak(msg)}catch(e:any){setError(e?.response?.data?.error||"A várólistára jelentkezés nem sikerült.")}finally{setWaiting(false)}
 };

 return <main className="customer-booking">
  <header className="cb-hero">
   <div><span>FOGLALÁS 3.0</span><h1>Időpontfoglalás</h1><p>Válassz több szolgáltatást is, vagy mondd el hangosan, mit szeretnél. Mentés csak a végső összegzés külön megerősítése után történik.</p></div>
   <div className="cb-voice-actions"><button className={listening?"listening":""} onClick={listening?stopListening:startListening} disabled={voiceLoading}>{listening?<MicOff/>:<Mic/>}<span>{voiceLoading?"Értelmezés…":listening?"Leállítás":"Hangos foglalás"}</span></button>{loading&&<RefreshCw className="spin"/>}</div>
  </header>
  {voiceTranscript&&<div className="cb-voice-transcript"><Mic/><div><b>Ezt értettem:</b><span>„{voiceTranscript}”</span></div>{voiceResult?.spoken_follow_up&&<button onClick={()=>speak(voiceResult.spoken_follow_up)} title="Visszakérdezés felolvasása"><Volume2/></button>}</div>}
  {error&&<div className="cb-message is-error">{error}</div>}{notice&&<div className="cb-message is-success"><CheckCircle2/>{notice}</div>}
  <section className="cb-layout">
   <aside className="cb-filters">
    <label><span>1. Szalon</span><select value={locationId} onChange={e=>chooseLocation(e.target.value)}><option value="">Válassz szalont</option>{locations.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select></label>
    <div className="cb-filter-group"><header><div><span>2. Szolgáltatások</span><small>Több is választható</small></div>{selectedServiceIds.length>0&&<button onClick={()=>setSelectedServiceIds([])}>Mind törlése</button>}</header><div className="cb-choice-scroll">{services.map(s=><button key={s.id} className={selectedServiceIds.includes(s.id)?"active":""} onClick={()=>toggleService(s.id)} disabled={!locationId}><Scissors/><div><b>{s.name}</b><small>{s.duration_minutes} perc · {money(s.price)}</small></div></button>)}</div></div>
    <div className="cb-filter-group"><header><div><span>3. Szakember</span><small>Opcionális</small></div>{employeeId&&<button onClick={()=>setEmployeeId("")}>Törlés</button>}</header><div className="cb-choice-scroll">{visibleEmployees.map(e=><button key={e.id} className={employeeId===e.id?"active":""} onClick={()=>chooseEmployee(e.id)} disabled={!locationId}><UserRound/><div><b>{e.full_name}</b><small>{selectedServiceIds.length?"A kiválasztott szolgáltatásokhoz elérhető":"Válassz előbb szolgáltatást"}</small></div></button>)}</div></div>
   </aside>
   <section className="cb-calendar-panel">
    <header className="cb-calendar-head"><button onClick={()=>shiftMonth(-1)}><ChevronLeft/></button><div><span>4. DÁTUM</span><h2>{month.toLocaleDateString("hu-HU",{year:"numeric",month:"long"})}</h2></div><button onClick={()=>shiftMonth(1)}><ChevronRight/></button></header>
    <div className="cb-weekdays">{["H","K","Sze","Cs","P","Szo","V"].map(x=><span key={x}>{x}</span>)}</div>
    <div className="cb-month-grid">{cells.map(d=>{const key=iso(d),past=key<iso(today),outside=d.getMonth()!==month.getMonth();return <button key={key} disabled={past} className={`${key===selectedDate?"selected ":""}${outside?"outside ":""}${key===iso(today)?"today":""}`} onClick={()=>{setVoiceUsed(false);setSelectedDate(key);setSelectedSlot(null);if(d.getMonth()!==month.getMonth())setMonth(new Date(d.getFullYear(),d.getMonth(),1))}}><b>{d.getDate()}</b></button>})}</div>
    <div className="cb-selection"><MapPin/><span>{locations.find(x=>x.id===locationId)?.name||"Válassz szalont"}</span><CalendarDays/><span>{new Date(`${selectedDate}T12:00:00`).toLocaleDateString("hu-HU",{weekday:"long",month:"long",day:"numeric"})}</span>{selectedServiceIds.length>0&&<><Scissors/><span>{selectedServiceIds.length} szolgáltatás · {totalDuration} perc</span></>}</div>
    <div className="cb-slots"><header><div><span>5. SZABAD IDŐPONTOK</span><h2>{selectedServices.length?selectedServices.map(s=>s.name).join(" + "):"Válassz legalább egy szolgáltatást"}</h2></div><Clock3/></header>
     {!locationId?<div className="cb-empty">Először válassz szalont.</div>:!selectedServiceIds.length?<div className="cb-empty">Válassz egy vagy több szolgáltatást. A rendszer együtt kezeli az összes szükséges időtartamot.</div>:slots.length===0&&!loading?<div className="cb-empty"><span>Erre a napra nincs szabad időpont a kiválasztott feltételekkel.</span>{customer&&<button className="cb-waitlist" onClick={joinWaitlist} disabled={waiting}>{waiting?"Mentés…":"Várólistára kérem"}</button>}</div>:<div className="cb-slot-groups">{Array.from(new Map(slots.map(s=>[s.employee_id,s.employee_name])).entries()).map(([id,name])=><article key={id}><header><div><b>{name}</b><small>{totalDuration} perc összesen</small></div>{!employeeId&&<button onClick={()=>setEmployeeId(id)}>Szakember kiválasztása</button>}</header><div>{slots.filter(s=>s.employee_id===id).map(slot=><button key={`${slot.employee_id}-${slot.start}`} className={selectedSlot?.start===slot.start&&selectedSlot.employee_id===slot.employee_id?"active":""} onClick={()=>{setSelectedSlot(slot);setConfirmOpen(false)}}>{time(slot.start)}</button>)}</div></article>)}</div>}
    </div>
   </section>
  </section>
  {selectedSlot&&<div className="cb-confirm"><div><span>KIVÁLASZTOTT IDŐPONT</span><b>{selectedServices.map(s=>s.name).join(" + ")}</b><p>{selectedSlot.employee_name} · {new Date(selectedSlot.start).toLocaleString("hu-HU",{month:"long",day:"numeric",hour:"2-digit",minute:"2-digit"})} · kb. {money(estimatedTotal)}</p></div><button onClick={()=>setConfirmOpen(true)}>Összegzés és megerősítés</button></div>}
  {confirmOpen&&selectedSlot&&<div className="cb-confirm-overlay" role="dialog" aria-modal="true" aria-label="Foglalás végső összegzése"><section className="cb-confirm-dialog"><header><div><span>VÉGSŐ ELLENŐRZÉS</span><h2>Foglalási összegzés</h2></div><button onClick={()=>setConfirmOpen(false)} aria-label="Bezárás"><X/></button></header><div className="cb-summary-grid"><div><small>Szalon</small><b>{locations.find(x=>x.id===locationId)?.name}</b></div><div><small>Dátum és idő</small><b>{new Date(selectedSlot.start).toLocaleString("hu-HU",{year:"numeric",month:"long",day:"numeric",weekday:"long",hour:"2-digit",minute:"2-digit"})}</b></div><div><small>Szakember</small><b>{selectedSlot.employee_name}</b></div><div><small>Időtartam</small><b>{totalDuration} perc</b></div></div><div className="cb-summary-services">{selectedServices.map(s=><div key={s.id}><span>{s.name}</span><b>{money(s.price)}</b></div>)}</div><div className="cb-summary-total"><div><small>Listaár</small><span>{money(grossTotal)}</span></div>{discount>0&&<div><small>Online kedvezmény</small><span>-{discount}%</span></div>}<div className="total"><small>Becsült fizetendő</small><b>{money(estimatedTotal)}</b></div></div>{voiceUsed&&<div className="cb-voice-safe"><Mic/><span>Hangalapú kérésből készült. A foglalás csak az alábbi gomb megnyomásával kerül mentésre.</span></div>}<button className="cb-final-book" onClick={book} disabled={booking||!customer}>{booking?"Foglalás mentése…":"Megerősítem és lefoglalom"}</button></section></div>}
 </main>
}
