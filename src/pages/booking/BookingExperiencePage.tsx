import React,{useCallback,useEffect,useMemo,useRef,useState}from"react";
import{ArrowRight,CalendarDays,Check,CheckCircle2,ChevronRight,Clock3,MapPin,Mic,MicOff,RefreshCw,Search,ShieldCheck,Sparkles,Tag,UserRound,Volume2,X}from"lucide-react";
import api from"../../api/api";
import"./BookingExperiencePage.css";

type Mode="customer"|"public";
type Location={id:string;name:string};
type Service={id:string;name:string;duration_minutes:number;price:number|string;category_name?:string};
type Employee={id:string;full_name:string;photo_url?:string|null};
type Slot={employee_id:string;employee_name:string;start:string;end:string};
type Customer={full_name:string;email?:string|null;phone?:string|null};
type Guest={full_name:string;phone:string;email:string;marketing_consent:boolean};
type Recommendation={type:"service"|"promotion";service_id:string|null;title:string;message:string;name?:string;price?:number;duration_minutes?:number;ai_generated:boolean};
type VoicePeriod="morning"|"afternoon"|"evening"|null;
type VoiceResponse={ok:boolean;intent:{intent:"book"|"waitlist"|"cancel";location_id:string|null;service_ids:string[];employee_id:string|null;date:string|null;time:string|null;preferred_period:VoicePeriod};missing_fields?:string[];ai_used?:boolean;spoken_follow_up?:string};
type SuccessState={id:string;token?:string|null;confirmationRequired:boolean;slot:Slot;services:Service[];location:string};
type DayPart="all"|"morning"|"afternoon"|"evening";

type Props={mode:Mode};
const DRAFT_KEY="kleo.booking.draft.v3";
const pad=(n:number)=>String(n).padStart(2,"0");
const iso=(d:Date)=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const addDays=(d:Date,n:number)=>{const x=new Date(d);x.setHours(12,0,0,0);x.setDate(x.getDate()+n);return x};
const money=(v:unknown)=>`${Number(v||0).toLocaleString("hu-HU",{maximumFractionDigits:0})} Ft`;
const time=(v:string)=>new Date(v).toLocaleTimeString("hu-HU",{hour:"2-digit",minute:"2-digit"});
const dateText=(v:string)=>new Date(`${v}T12:00:00`).toLocaleDateString("hu-HU",{month:"long",day:"numeric",weekday:"long"});
const dateTimeText=(v:string)=>new Date(v).toLocaleString("hu-HU",{month:"long",day:"numeric",weekday:"long",hour:"2-digit",minute:"2-digit"});
const minuteOf=(v:string)=>{const d=new Date(v);return d.getHours()*60+d.getMinutes()};
const partOf=(v:string):Exclude<DayPart,"all">=>{const m=minuteOf(v);return m<720?"morning":m<1020?"afternoon":"evening"};
const errorText=(e:any,fallback:string)=>String(e?.response?.data?.error||e?.message||fallback);
function speak(text:string){try{if(!text||typeof window==="undefined"||!("speechSynthesis"in window))return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang="hu-HU";u.rate=.96;window.speechSynthesis.speak(u)}catch{}}
function readDraft(){try{const raw=sessionStorage.getItem(DRAFT_KEY);return raw?JSON.parse(raw):{}}catch{return{}}}

export default function BookingExperiencePage({mode}:Props){
 const initial=useMemo(()=>readDraft(),[]);
 const today=useMemo(()=>{const d=new Date();d.setHours(12,0,0,0);return d},[]);
 const[locations,setLocations]=useState<Location[]>([]),[locationId,setLocationId]=useState(String(initial.location_id||""));
 const[services,setServices]=useState<Service[]>([]),[serviceIds,setServiceIds]=useState<string[]>(Array.isArray(initial.service_ids)?initial.service_ids.map(String):[]);
 const[employees,setEmployees]=useState<Employee[]>([]),[employeeId,setEmployeeId]=useState(String(initial.employee_id||""));
 const[selectedDate,setSelectedDate]=useState(String(initial.date||iso(today))),[dayPart,setDayPart]=useState<DayPart>(["morning","afternoon","evening"].includes(String(initial.day_part))?initial.day_part:"all");
 const[slots,setSlots]=useState<Slot[]>([]),[selectedSlot,setSelectedSlot]=useState<Slot|null>(null),[settings,setSettings]=useState<any>(null);
 const[customer,setCustomer]=useState<Customer|null>(null),[guest,setGuest]=useState<Guest>({full_name:"",phone:"",email:"",marketing_consent:false});
 const[loading,setLoading]=useState(false),[booking,setBooking]=useState(false),[waiting,setWaiting]=useState(false),[nextSearching,setNextSearching]=useState(false);
 const[error,setError]=useState(""),[notice,setNotice]=useState(""),[confirmOpen,setConfirmOpen]=useState(false),[success,setSuccess]=useState<SuccessState|null>(null);
 const[search,setSearch]=useState(""),[category,setCategory]=useState("all");
 const[listening,setListening]=useState(false),[voiceLoading,setVoiceLoading]=useState(false),[voiceTranscript,setVoiceTranscript]=useState(""),[voiceResult,setVoiceResult]=useState<VoiceResponse|null>(null),[voiceUsed,setVoiceUsed]=useState(false);
 const[recommendations,setRecommendations]=useState<Recommendation[]>([]),[recommendationsLoading,setRecommendationsLoading]=useState(false),[recommendationsAi,setRecommendationsAi]=useState(false);
 const recognitionRef=useRef<any>(null),confirmButtonRef=useRef<HTMLButtonElement|null>(null);
 const locationRef=useRef<HTMLElement|null>(null),serviceRef=useRef<HTMLElement|null>(null),employeeRef=useRef<HTMLElement|null>(null),dateRef=useRef<HTMLElement|null>(null),slotRef=useRef<HTMLElement|null>(null);

 const guestValid=Boolean(guest.full_name.trim()&&(guest.phone.trim()||guest.email.trim()));
 const contactReady=mode==="customer"?Boolean(customer?.full_name&&(customer.phone||customer.email)):guestValid;

 useEffect(()=>{
  let active=true;
  api.get("/public/marketing/booking/catalog").then(r=>active&&setLocations((r.data?.locations||[]).map((x:any)=>({id:String(x.id),name:String(x.name||"")})))).catch(()=>active&&setError("A szalonok jelenleg nem tölthetők be."));
  if(mode==="customer")api.get("/customer-portal/dashboard").then(r=>active&&setCustomer(r.data?.customer||null)).catch(()=>active&&setError("A foglaláshoz bejelentkezett ügyfélprofil szükséges."));
  return()=>{active=false};
 },[mode]);

 useEffect(()=>{
  try{sessionStorage.setItem(DRAFT_KEY,JSON.stringify({location_id:locationId,service_ids:serviceIds,employee_id:employeeId,date:selectedDate,day_part:dayPart}))}catch{}
 },[locationId,serviceIds,employeeId,selectedDate,dayPart]);

 useEffect(()=>{
  setSelectedSlot(null);setConfirmOpen(false);setSlots([]);setSuccess(null);
  if(!locationId){setServices([]);setEmployees([]);setSettings(null);return;}
  let active=true;setLoading(true);setError("");
  api.get("/public/marketing/booking/catalog",{params:{location_id:locationId}}).then(r=>{
   if(!active)return;
   const ss=(r.data?.services||[]).map((x:any)=>({...x,id:String(x.id)})),ee=(r.data?.employees||[]).map((x:any)=>({...x,id:String(x.id)}));
   setServices(ss);setEmployees(ee);setSettings(r.data?.settings||null);
   const allowed=new Set(ss.map((x:Service)=>x.id));setServiceIds(ids=>ids.filter(id=>allowed.has(id)));
   const allowedEmployees=new Set(ee.map((x:Employee)=>x.id));setEmployeeId(id=>allowedEmployees.has(id)?id:"");
  }).catch((e:any)=>active&&setError(errorText(e,"A foglalási katalógus nem tölthető be."))).finally(()=>active&&setLoading(false));
  return()=>{active=false};
 },[locationId]);

 const loadAvailability=useCallback(async(date=selectedDate,quiet=false)=>{
  if(!locationId||!date||!serviceIds.length){setSlots([]);return[] as Slot[];}
  if(!quiet){setLoading(true);setError("");setSelectedSlot(null);setConfirmOpen(false)}
  try{
   const r=await api.get("/public/marketing/booking/availability",{params:{location_id:locationId,date,service_ids:serviceIds.join(","),employee_id:employeeId||undefined}});
   const next=(r.data?.slots||[]).map((x:any)=>({...x,employee_id:String(x.employee_id)})) as Slot[];
   if(date===selectedDate)setSlots(next);
   return next;
  }catch(e:any){if(!quiet)setError(errorText(e,"A szabad időpontok nem tölthetők be."));return[] as Slot[]}
  finally{if(!quiet)setLoading(false)}
 },[locationId,selectedDate,serviceIds,employeeId]);
 useEffect(()=>{void loadAvailability()},[loadAvailability]);

 useEffect(()=>{
  setRecommendations([]);setRecommendationsAi(false);if(!locationId||!serviceIds.length)return;
  let active=true;const timer=window.setTimeout(()=>{setRecommendationsLoading(true);api.get("/public/marketing/booking/recommendations",{params:{location_id:locationId,service_ids:serviceIds.join(",")}}).then(r=>{if(!active)return;setRecommendations(Array.isArray(r.data?.recommendations)?r.data.recommendations:[]);setRecommendationsAi(Boolean(r.data?.ai_used))}).catch(()=>active&&setRecommendations([])).finally(()=>active&&setRecommendationsLoading(false))},420);
  return()=>{active=false;window.clearTimeout(timer)};
 },[locationId,serviceIds]);

 useEffect(()=>{if(!confirmOpen)return;const onKey=(e:KeyboardEvent)=>{if(e.key==="Escape")setConfirmOpen(false)};window.addEventListener("keydown",onKey);window.setTimeout(()=>confirmButtonRef.current?.focus(),30);return()=>window.removeEventListener("keydown",onKey)},[confirmOpen]);

 const selectedServices=useMemo(()=>services.filter(s=>serviceIds.includes(s.id)),[services,serviceIds]);
 const categories=useMemo(()=>Array.from(new Set(services.map(s=>s.category_name||"Egyéb"))).sort((a,b)=>a.localeCompare(b,"hu")),[services]);
 const filteredServices=useMemo(()=>{const q=search.trim().toLocaleLowerCase("hu-HU");return services.filter(s=>(category==="all"||(s.category_name||"Egyéb")===category)&&(!q||`${s.name} ${s.category_name||""}`.toLocaleLowerCase("hu-HU").includes(q)))},[services,search,category]);
 const totalDuration=selectedServices.reduce((n,s)=>n+Number(s.duration_minutes||0),0),grossTotal=selectedServices.reduce((n,s)=>n+Number(s.price||0),0),discount=Number(settings?.online_discount_percent||0),estimatedTotal=Math.max(0,grossTotal*(1-discount/100));
 const filteredSlots=useMemo(()=>slots.filter(s=>dayPart==="all"||partOf(s.start)===dayPart).sort((a,b)=>new Date(a.start).getTime()-new Date(b.start).getTime()),[slots,dayPart]);
 const earliest=filteredSlots[0]||null;
 const quickDays=useMemo(()=>Array.from({length:14},(_,i)=>addDays(today,i)),[today]);
 const horizonMax=useMemo(()=>iso(addDays(today,Math.max(1,Number(settings?.booking_horizon_days||60)))),[today,settings]);
 const selectedLocation=locations.find(l=>l.id===locationId);
 const selectedEmployee=employees.find(e=>e.id===(selectedSlot?.employee_id||employeeId));

 const steps=[
  {id:"location",label:"Szalon",done:Boolean(locationId),ref:locationRef},
  {id:"service",label:"Szolgáltatás",done:serviceIds.length>0,ref:serviceRef},
  {id:"employee",label:"Szakember",done:serviceIds.length>0,ref:employeeRef,optional:true},
  {id:"date",label:"Dátum",done:Boolean(selectedDate),ref:dateRef},
  {id:"slot",label:"Időpont",done:Boolean(selectedSlot),ref:slotRef},
 ];
 const firstIncomplete=Math.max(0,steps.findIndex(s=>!s.done));

 const chooseLocation=(id:string)=>{setLocationId(id);setServiceIds([]);setEmployeeId("");setSelectedSlot(null);setVoiceUsed(false);setVoiceResult(null);setSearch("");setCategory("all")};
 const toggleService=(id:string)=>{setServiceIds(ids=>ids.includes(id)?ids.filter(x=>x!==id):[...ids,id]);setSelectedSlot(null);setVoiceUsed(false);setVoiceResult(null)};
 const addRecommendation=(r:Recommendation)=>{if(!r.service_id)return;setServiceIds(ids=>ids.includes(r.service_id as string)?ids:[...ids,r.service_id as string]);setNotice(`${r.name||r.title} hozzáadva. Az időpontokat frissítjük.`);setSelectedSlot(null)};
 const chooseEmployee=(id:string)=>{setEmployeeId(id);setSelectedSlot(null);setVoiceUsed(false);setVoiceResult(null)};
 const chooseDate=(d:string)=>{setSelectedDate(d);setSelectedSlot(null);setSuccess(null)};

 const findNext=async()=>{
  if(!locationId||!serviceIds.length)return;setNextSearching(true);setError("");
  try{for(let i=1;i<=14;i++){const d=iso(addDays(new Date(`${selectedDate}T12:00:00`),i));if(d>horizonMax)break;const found=await loadAvailability(d,true);if(found.length){setSelectedDate(d);setSlots(found);setNotice(`Találtunk szabad időpontot: ${dateText(d)}.`);slotRef.current?.scrollIntoView({behavior:"smooth",block:"start"});return}}setNotice("A következő 14 napban nem találtunk szabad időpontot a kiválasztott feltételekkel.")}
  finally{setNextSearching(false)}
 };

 const interpretVoice=async(transcript:string)=>{setVoiceLoading(true);setError("");setNotice("");try{const r=await api.post("/public/marketing/booking/voice/interpret",{transcript}),v=r.data as VoiceResponse;setVoiceResult(v);setVoiceUsed(true);if(v.intent.intent==="cancel"){const msg="A hangfelismerés lemondási szándékot érzékelt. Meglévő foglalást hang alapján nem törlünk.";setNotice(msg);speak(v.spoken_follow_up||msg);return}if(v.intent.location_id)setLocationId(v.intent.location_id);if(v.intent.service_ids?.length)setServiceIds(v.intent.service_ids);if(v.intent.employee_id)setEmployeeId(v.intent.employee_id);if(v.intent.date)setSelectedDate(v.intent.date);setSelectedSlot(null);setConfirmOpen(false);const msg=v.ai_used?"A hangos kérés AI-val értelmezve. Ellenőrizd a választásokat.":"A hangos kérés értelmezve. Ellenőrizd a választásokat.";setNotice(msg);speak(v.spoken_follow_up||msg)}catch(e:any){const msg=errorText(e,"A hangos foglalási kérés nem értelmezhető.");setError(msg);speak(msg)}finally{setVoiceLoading(false)}};
 const startListening=()=>{const Ctor=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;if(!Ctor){setError("Ez a böngésző nem támogatja a beépített beszédfelismerést. Chrome vagy Edge használata javasolt.");return}try{recognitionRef.current?.abort?.()}catch{}const r=new Ctor();r.lang="hu-HU";r.interimResults=false;r.maxAlternatives=1;r.onstart=()=>{setListening(true);setError("");setNotice("Mondd el: szalon, szolgáltatás, nap és ha szeretnéd, szakember vagy időpont.")};r.onend=()=>setListening(false);r.onerror=(e:any)=>{setListening(false);setError(e?.error==="not-allowed"?"A mikrofon használata nincs engedélyezve.":"A beszédfelismerés megszakadt. Próbáld újra.")};r.onresult=(e:any)=>{const text=String(e?.results?.[0]?.[0]?.transcript||"").trim();setVoiceTranscript(text);if(text)void interpretVoice(text)};recognitionRef.current=r;r.start()};
 const stopListening=()=>{try{recognitionRef.current?.stop?.()}catch{}setListening(false)};

 const book=async()=>{
  if(!confirmOpen||!selectedSlot||!locationId||!serviceIds.length||!contactReady)return;
  const contact=mode==="customer"?{client_name:customer?.full_name||"",phone:customer?.phone||"",email:customer?.email||"",marketing_consent:false}:{client_name:guest.full_name.trim(),phone:guest.phone.trim(),email:guest.email.trim(),marketing_consent:guest.marketing_consent};
  setBooking(true);setError("");setNotice("");
  try{const r=await api.post("/public/marketing/booking/book",{location_id:locationId,employee_id:selectedSlot.employee_id,service_ids:serviceIds,...contact,start_time:selectedSlot.start,booking_source:voiceUsed?"voice":"online"});const state:SuccessState={id:String(r.data?.id||""),token:r.data?.cancellation_token||null,confirmationRequired:Boolean(r.data?.confirmation_required),slot:selectedSlot,services:selectedServices,location:selectedLocation?.name||"Kleopátra"};setSuccess(state);setConfirmOpen(false);setNotice(state.confirmationRequired?"A foglalás rögzítve. A szalon visszaigazolása szükséges.":"A foglalás sikeresen rögzítve és megerősítve.");try{sessionStorage.removeItem(DRAFT_KEY)}catch{}speak(state.confirmationRequired?"A foglalás rögzítve. A szalon visszaigazolása szükséges.":"A foglalás sikeresen rögzítve.")}
  catch(e:any){if(Number(e?.response?.status)===409){setConfirmOpen(false);setSelectedSlot(null);await loadAvailability();setError("Ezt az időpontot közben lefoglalták. A lista frissült – válassz egy másik szabad időpontot.");slotRef.current?.scrollIntoView({behavior:"smooth",block:"start"})}else setError(errorText(e,"A foglalás nem sikerült."))}
  finally{setBooking(false)}
 };

 const joinWaitlist=async()=>{if(!locationId||!serviceIds.length||!contactReady)return;const contact=mode==="customer"?{client_name:customer?.full_name||"",phone:customer?.phone||"",email:customer?.email||""}:{client_name:guest.full_name.trim(),phone:guest.phone.trim(),email:guest.email.trim()};setWaiting(true);setError("");try{const from=new Date(`${selectedDate}T00:00:00`),to=new Date(`${selectedDate}T23:59:59`);await api.post("/public/marketing/booking/waitlist",{location_id:locationId,...contact,service_ids:serviceIds,employee_id:employeeId||null,preferred_from:from.toISOString(),preferred_to:to.toISOString(),booking_source:voiceUsed?"voice":"online"});setNotice("Felkerültél a várólistára erre a napra. Ha felszabadul időpont, a szalon kapcsolatba lép veled.")}catch(e:any){setError(errorText(e,"A várólistára jelentkezés nem sikerült."))}finally{setWaiting(false)}};

 const reset=()=>{setSuccess(null);setSelectedSlot(null);setConfirmOpen(false);setNotice("");void loadAvailability()};

 if(success)return <main className={`booking-final ${mode==="public"?"is-public":""}`}>
  {mode==="public"&&<PublicTop/>}
  <section className="bf-success" aria-live="polite"><div className="bf-success-icon"><CheckCircle2/></div><span>FOGLALÁS RÖGZÍTVE</span><h1>Köszönjük, várunk szeretettel!</h1><p>{success.confirmationRequired?"A szalon még visszaigazolja az időpontot.":"Az időpontod megerősítve."}</p><div className="bf-success-grid"><div><small>Szalon</small><b>{success.location}</b></div><div><small>Időpont</small><b>{dateTimeText(success.slot.start)}</b></div><div><small>Szakember</small><b>{success.slot.employee_name}</b></div><div><small>Szolgáltatás</small><b>{success.services.map(s=>s.name).join(", ")}</b></div></div><div className="bf-success-actions">{mode==="public"&&success.token&&<a className="bf-primary" href={`/booking/manage/${encodeURIComponent(success.token)}`}>Foglalás kezelése <ArrowRight/></a>}{mode==="customer"&&<a className="bf-primary" href="/customer">Saját fiókom <ArrowRight/></a>}<button type="button" className="bf-secondary" onClick={reset}>Új foglalás</button></div></section>
 </main>;

 return <main className={`booking-final ${mode==="public"?"is-public":""}`}>
  {mode==="public"&&<PublicTop/>}
  <header className="bf-hero"><div><span>FOGLALÁS 3.1</span><h1>Találd meg a neked való időpontot</h1><p>Gyors, átlátható foglalás. Több szolgáltatást is választhatsz, a rendszer pedig csak a végső megerősítés után ment.</p></div><button type="button" className={`bf-voice ${listening?"is-listening":""}`} onClick={listening?stopListening:startListening} disabled={voiceLoading}>{listening?<MicOff/>:<Mic/>}<span>{voiceLoading?"Értelmezés…":listening?"Leállítás":"Mondd el hangosan"}</span></button></header>

  <nav className="bf-progress" aria-label="Foglalás lépései">{steps.map((s,i)=><button type="button" key={s.id} className={`${s.done?"is-done":""} ${i===firstIncomplete?"is-current":""}`} aria-current={i===firstIncomplete?"step":undefined} onClick={()=>s.ref.current?.scrollIntoView({behavior:"smooth",block:"start"})}><i>{s.done?<Check/>:i+1}</i><span>{s.label}{s.optional&&<small> opcionális</small>}</span>{i<steps.length-1&&<ChevronRight className="bf-progress-arrow"/>}</button>)}</nav>

  {voiceTranscript&&<div className="bf-voice-result"><Mic/><div><b>Ezt értettem</b><span>„{voiceTranscript}”</span></div>{voiceResult?.spoken_follow_up&&<button type="button" onClick={()=>speak(voiceResult.spoken_follow_up||"")} aria-label="Visszajelzés felolvasása"><Volume2/></button>}</div>}
  {error&&<div className="bf-message is-error" role="alert">{error}</div>}{notice&&<div className="bf-message is-success" aria-live="polite"><CheckCircle2/>{notice}</div>}

  {mode==="public"&&<section className="bf-card bf-contact"><header><span>KAPCSOLATTARTÁS</span><h2>Hogyan érhetünk el?</h2><p>A foglaláshoz név és legalább telefonszám vagy e-mail szükséges.</p></header><div className="bf-contact-grid"><label><span>Név *</span><input value={guest.full_name} onChange={e=>setGuest(g=>({...g,full_name:e.target.value}))} autoComplete="name" placeholder="Teljes név"/></label><label><span>Telefonszám</span><input value={guest.phone} onChange={e=>setGuest(g=>({...g,phone:e.target.value}))} autoComplete="tel" inputMode="tel" placeholder="+36 ..."/></label><label><span>E-mail</span><input value={guest.email} onChange={e=>setGuest(g=>({...g,email:e.target.value}))} autoComplete="email" inputMode="email" type="email" placeholder="nev@email.hu"/></label></div><label className="bf-consent"><input type="checkbox" checked={guest.marketing_consent} onChange={e=>setGuest(g=>({...g,marketing_consent:e.target.checked}))}/><span>Szeretnék személyre szabott Kleopátra ajánlatokat kapni. Ez nem feltétele a foglalásnak.</span></label></section>}

  <div className="bf-layout"><div className="bf-main">
   <section className="bf-card" ref={locationRef}><SectionHead n="1" icon={<MapPin/>} title="Válassz szalont" text="A kínálat és a szabad időpontok szalononként eltérhetnek."/>
    <div className="bf-choice-grid">{locations.map(l=><button type="button" key={l.id} className={locationId===l.id?"is-active":""} aria-pressed={locationId===l.id} onClick={()=>chooseLocation(l.id)}><MapPin/><span>{l.name}</span>{locationId===l.id&&<Check/>}</button>)}</div>
   </section>

   <section className={`bf-card ${!locationId?"is-disabled":""}`} ref={serviceRef}><SectionHead n="2" icon={<Sparkles/>} title="Szolgáltatások" text="Keress névre, szűrj kategóriára, és akár több szolgáltatást is adj a foglaláshoz."/>
    {!locationId?<Empty text="Először válassz szalont."/>:<><div className="bf-service-tools"><label className="bf-search"><Search/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Keresés a szolgáltatások között…"/></label><div className="bf-category-row"><button type="button" className={category==="all"?"is-active":""} onClick={()=>setCategory("all")}>Mind</button>{categories.map(c=><button type="button" key={c} className={category===c?"is-active":""} onClick={()=>setCategory(c)}>{c}</button>)}</div></div>
     {selectedServices.length>0&&<div className="bf-selected-chips" aria-label="Kiválasztott szolgáltatások">{selectedServices.map(s=><button type="button" key={s.id} onClick={()=>toggleService(s.id)} title="Eltávolítás"><span>{s.name}</span><X/></button>)}</div>}
     <div className="bf-service-list">{filteredServices.map(s=><button type="button" key={s.id} className={serviceIds.includes(s.id)?"is-active":""} aria-pressed={serviceIds.includes(s.id)} onClick={()=>toggleService(s.id)}><div><small>{s.category_name||"Szolgáltatás"}</small><b>{s.name}</b><span><Clock3/>{s.duration_minutes} perc</span></div><strong>{money(s.price)}</strong><i>{serviceIds.includes(s.id)?<Check/>:"+"}</i></button>)}</div>{!filteredServices.length&&<Empty text="Nincs a keresésnek megfelelő szolgáltatás."/>}
    </>}
   </section>

   {(recommendationsLoading||recommendations.length>0)&&<section className="bf-card bf-recommend"><div className="bf-recommend-title"><Sparkles/><div><span>{recommendationsAi?"AI AJÁNLÁS":"AJÁNLÁS"}</span><h3>Ehhez még ezt szokták választani</h3></div></div>{recommendationsLoading?<div className="bf-loading-line">Személyre szabott ajánlás készül…</div>:<div className="bf-recommend-row">{recommendations.slice(0,4).map((r,i)=><article key={`${r.service_id||"r"}-${i}`}><Tag/><div><b>{r.title}</b><p>{r.message}</p></div>{r.service_id&&!serviceIds.includes(r.service_id)&&<button type="button" onClick={()=>addRecommendation(r)}>Hozzáadás</button>}</article>)}</div>}</section>}

   <section className={`bf-card ${!serviceIds.length?"is-disabled":""}`} ref={employeeRef}><SectionHead n="3" icon={<UserRound/>} title="Szakember" text="Ha a legkorábbi időpont a fontos, hagyd a „Bármely szakember” lehetőséget." optional/>
    {!serviceIds.length?<Empty text="Válassz legalább egy szolgáltatást."/>:<div className="bf-employee-grid"><button type="button" className={!employeeId?"is-active bf-any-employee":"bf-any-employee"} aria-pressed={!employeeId} onClick={()=>chooseEmployee("")}><div className="bf-avatar"><Sparkles/></div><div><b>Bármely szakember</b><span>A legjobb elérhető időpont</span></div>{!employeeId&&<Check/>}</button>{employees.map(e=><button type="button" key={e.id} className={employeeId===e.id?"is-active":""} aria-pressed={employeeId===e.id} onClick={()=>chooseEmployee(e.id)}>{e.photo_url?<img src={e.photo_url} alt=""/>:<div className="bf-avatar"><UserRound/></div>}<div><b>{e.full_name}</b><span>{slots.some(s=>s.employee_id===e.id)?"Van szabad időpont ezen a napon":"Másik nap is választható"}</span></div>{employeeId===e.id&&<Check/>}</button>)}</div>}
   </section>

   <section className={`bf-card ${!serviceIds.length?"is-disabled":""}`} ref={dateRef}><SectionHead n="4" icon={<CalendarDays/>} title="Dátum" text="A következő napok egy érintéssel választhatók, vagy megadhatsz egy konkrét dátumot."/>
    {!serviceIds.length?<Empty text="A dátumválasztáshoz előbb válassz szolgáltatást."/>:<><div className="bf-date-strip">{quickDays.map((d,i)=>{const v=iso(d),active=v===selectedDate;return <button type="button" key={v} className={active?"is-active":""} aria-pressed={active} onClick={()=>chooseDate(v)}><small>{i===0?"Ma":i===1?"Holnap":d.toLocaleDateString("hu-HU",{weekday:"short"})}</small><b>{d.getDate()}</b><span>{d.toLocaleDateString("hu-HU",{month:"short"})}</span></button>})}</div><label className="bf-date-input"><CalendarDays/><span>Másik dátum</span><input type="date" min={iso(today)} max={horizonMax} value={selectedDate} onChange={e=>chooseDate(e.target.value)}/></label></>}
   </section>

   <section className={`bf-card ${!serviceIds.length?"is-disabled":""}`} ref={slotRef}><div className="bf-slot-head"><SectionHead n="5" icon={<Clock3/>} title="Szabad időpontok" text={selectedDate?dateText(selectedDate):"Válassz dátumot."}/>{loading&&<RefreshCw className="bf-spin"/>}</div>
    {serviceIds.length>0&&<div className="bf-period-tabs" role="group" aria-label="Napszak szűrő">{([['all','Mind'],['morning','Reggel'],['afternoon','Délután'],['evening','Este']] as [DayPart,string][]).map(([k,l])=><button type="button" key={k} className={dayPart===k?"is-active":""} aria-pressed={dayPart===k} onClick={()=>setDayPart(k)}>{l}</button>)}</div>}
    {!serviceIds.length?<Empty text="Előbb válassz szolgáltatást."/>:loading?<div className="bf-slot-skeleton">Szabad időpontok keresése…</div>:filteredSlots.length?<><div className="bf-earliest">{earliest&&<><Sparkles/><span><small>LEGKORÁBBI</small><b>{time(earliest.start)} · {earliest.employee_name}</b></span><button type="button" onClick={()=>setSelectedSlot(earliest)}>Ezt választom</button></>}</div><div className="bf-slots">{filteredSlots.map(s=>{const active=selectedSlot?.start===s.start&&selectedSlot?.employee_id===s.employee_id;return <button type="button" key={`${s.employee_id}-${s.start}`} className={active?"is-active":""} aria-pressed={active} onClick={()=>setSelectedSlot(s)}><b>{time(s.start)}</b><span>{s.employee_name}</span>{active&&<Check/>}</button>})}</div></>:<div className="bf-no-slots"><CalendarDays/><h3>Erre a napra nincs szabad időpont</h3><p>Keressük meg a következő elérhető napot, vagy kérj értesítést várólistán.</p><div><button type="button" className="bf-secondary" disabled={nextSearching} onClick={findNext}>{nextSearching?"Keresés…":"Következő szabad idő"}</button><button type="button" className="bf-link" disabled={!contactReady||waiting} onClick={joinWaitlist}>{waiting?"Mentés…":"Várólistára kérem"}</button></div>{!contactReady&&<small>{mode==="customer"?"A várólistához érvényes ügyfélprofil szükséges.":"A várólistához add meg a kapcsolattartási adatokat."}</small>}</div>}
   </section>
  </div>

  <aside className="bf-summary" aria-label="Foglalás összegzése"><div className="bf-summary-card"><span>FOGLALÁSOD</span><h2>Összegzés</h2><SummaryRow icon={<MapPin/>} label="Szalon" value={selectedLocation?.name||"Még nincs kiválasztva"}/><SummaryRow icon={<Sparkles/>} label="Szolgáltatás" value={selectedServices.length?selectedServices.map(s=>s.name).join(", "):"Még nincs kiválasztva"}/><SummaryRow icon={<UserRound/>} label="Szakember" value={selectedSlot?.employee_name||selectedEmployee?.full_name||(!employeeId&&serviceIds.length?"Bármely elérhető":"Még nincs kiválasztva")}/><SummaryRow icon={<CalendarDays/>} label="Dátum" value={selectedDate?dateText(selectedDate):"—"}/><SummaryRow icon={<Clock3/>} label="Időpont" value={selectedSlot?time(selectedSlot.start):"Még nincs kiválasztva"}/>{selectedServices.length>0&&<div className="bf-total"><div><span>Teljes idő</span><b>{totalDuration} perc</b></div>{discount>0&&<div><span>Online kedvezmény</span><b>-{discount}%</b></div>}<div className="is-price"><span>Várható összeg</span><b>{money(estimatedTotal)}</b></div></div>}<button type="button" className="bf-primary bf-confirm-trigger" disabled={!selectedSlot||!contactReady||booking} onClick={()=>setConfirmOpen(true)}>Foglalás ellenőrzése <ArrowRight/></button>{!contactReady&&<small className="bf-summary-help">{mode==="public"?"Add meg a kapcsolattartási adatokat a foglaláshoz.":"Az ügyfélprofilon legalább telefon vagy e-mail szükséges."}</small>}<div className="bf-secure"><ShieldCheck/><span>Az időpont csak a következő lépésben, külön megerősítés után kerül mentésre.</span></div></div></aside>
  </div>

  {selectedSlot&&<div className="bf-mobile-bar"><div><small>{dateText(selectedDate)}</small><b>{time(selectedSlot.start)} · {selectedSlot.employee_name}</b></div><button type="button" disabled={!contactReady} onClick={()=>setConfirmOpen(true)}>Ellenőrzés</button></div>}

  {confirmOpen&&selectedSlot&&<div className="bf-modal-backdrop" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setConfirmOpen(false)}}><section className="bf-modal" role="dialog" aria-modal="true" aria-labelledby="bf-confirm-title"><button type="button" className="bf-modal-close" onClick={()=>setConfirmOpen(false)} aria-label="Bezárás"><X/></button><span>UTOLSÓ LÉPÉS</span><h2 id="bf-confirm-title">Ellenőrizd a foglalást</h2><p>A „Végleges foglalás” gomb megnyomásával az időpont rögzítésre kerül.</p><div className="bf-confirm-grid"><SummaryRow icon={<MapPin/>} label="Szalon" value={selectedLocation?.name||"—"}/><SummaryRow icon={<Sparkles/>} label="Szolgáltatás" value={selectedServices.map(s=>s.name).join(", ")}/><SummaryRow icon={<UserRound/>} label="Szakember" value={selectedSlot.employee_name}/><SummaryRow icon={<CalendarDays/>} label="Időpont" value={dateTimeText(selectedSlot.start)}/></div><div className="bf-modal-total"><span>Várható fizetendő</span><b>{money(estimatedTotal)}</b>{discount>0&&<small>Az online kedvezménnyel számolva.</small>}</div><div className="bf-modal-actions"><button type="button" className="bf-secondary" onClick={()=>setConfirmOpen(false)}>Módosítok</button><button ref={confirmButtonRef} type="button" className="bf-primary" disabled={booking} onClick={book}>{booking?"Foglalás mentése…":"Végleges foglalás"}<CheckCircle2/></button></div></section></div>}
 </main>;
}

function PublicTop(){return <nav className="bf-public-top"><a href="/booking" className="bf-brand"><b>KLEOPÁTRA</b><span>SZÉPSÉGSZALONOK</span></a><div><ShieldCheck/><span>Biztonságos online foglalás</span></div><a href="/login">Belépés</a></nav>}
function SectionHead({n,icon,title,text,optional}:{n:string;icon:React.ReactNode;title:string;text:string;optional?:boolean}){return <header className="bf-section-head"><div className="bf-step-icon">{icon}</div><div><span>{n}. LÉPÉS {optional&&"· OPCIONÁLIS"}</span><h2>{title}</h2><p>{text}</p></div></header>}
function Empty({text}:{text:string}){return <div className="bf-empty">{text}</div>}
function SummaryRow({icon,label,value}:{icon:React.ReactNode;label:string;value:string}){return <div className="bf-summary-row"><i>{icon}</i><div><small>{label}</small><b>{value}</b></div></div>}
