import React,{useCallback,useEffect,useMemo,useState}from"react";
import{AlertTriangle,Building2,CalendarClock,CheckCircle2,CircleDollarSign,History,KeyRound,Mail,RefreshCw,Save,Settings2,ShieldCheck,SlidersHorizontal,Store,TestTube2,Wrench}from"lucide-react";
import api from"../api/api";
import{hasStoredRole}from"../utils/roles";
import"./SystemSettingsPage.css";

type Location={id:string;name:string;city?:string};
type Setting={key:string;category:string;category_label:string;label:string;description:string;type:"number"|"boolean"|"text"|"time";scope:"global"|"location";defaultValue:any;value:any;min?:number;max?:number;step?:number;unit?:string;spec_reference?:string;editable:boolean;updated_at?:string|null;updated_by?:string|null};
type Catalog={categories:Array<{key:string;label:string}>;settings:Setting[];selected_location_id?:string|null;specification?:Record<string,unknown>};
type Alerts={equipment:{warning_days:number;count:number;items:any[]};finance:{variance_warning_huf:number;count:number;items:any[]}};
type Audit={id:number;key:string;scope_type:string;scope_id:string;old_value:any;new_value:any;actor?:string;note?:string;created_at:string};
type MailchimpSecretStatus={configured:boolean;source:"database"|"environment"|"none";suffix?:string|null;audience_id?:string;server_prefix?:string};

const categoryIcons:Record<string,React.ElementType>={booking:CalendarClock,equipment:Wrench,finance:CircleDollarSign,supplier:Store,franchise:Mail};
const fmt=(v:any)=>new Intl.NumberFormat("hu-HU").format(Number(v||0));
const dt=(v?:string|null)=>v?new Intl.DateTimeFormat("hu-HU",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(v)):"—";
const date=(v?:string|null)=>v?new Intl.DateTimeFormat("hu-HU",{year:"numeric",month:"short",day:"numeric"}).format(new Date(v)):"—";
const err=(e:any)=>e?.response?.data?.message||e?.response?.data?.error||e?.message||"A művelet nem sikerült.";

export default function SystemSettingsPage(){
 const admin=hasStoredRole(["admin"]);
 const[catalog,setCatalog]=useState<Catalog|null>(null);
 const[locations,setLocations]=useState<Location[]>([]);
 const[locationId,setLocationId]=useState("");
 const[values,setValues]=useState<Record<string,any>>({});
 const[dirty,setDirty]=useState<Record<string,boolean>>({});
 const[applyAll,setApplyAll]=useState(false);
 const[alerts,setAlerts]=useState<Alerts|null>(null);
 const[audit,setAudit]=useState<Audit[]>([]);
 const[mailchimpStatus,setMailchimpStatus]=useState<MailchimpSecretStatus|null>(null);
 const[mailchimpKey,setMailchimpKey]=useState("");
 const[mailchimpBusy,setMailchimpBusy]=useState(false);
 const[loading,setLoading]=useState(true);
 const[saving,setSaving]=useState(false);
 const[error,setError]=useState("");
 const[notice,setNotice]=useState("");

 const loadLocations=useCallback(async()=>{
  const r=await api.get("/locations");
  const rows=Array.isArray(r.data)?r.data:Array.isArray(r.data?.locations)?r.data.locations:[];
  const list=rows.map((x:any)=>({id:String(x.id),name:String(x.name||"Szalon"),city:x.city?String(x.city):undefined}));
  setLocations(list);
  if(!locationId&&list.length){
   let saved="";try{saved=localStorage.getItem("kleo_location_id")||localStorage.getItem("location_id")||""}catch{}
   setLocationId(list.some((x:Location)=>x.id===saved)?saved:list[0].id);
  }
 },[locationId]);

 const load=useCallback(async()=>{
  setLoading(true);setError("");
  try{
   const params=locationId?{location_id:locationId}:{};
   const[c,a,h]=await Promise.all([
    api.get("/system-settings/catalog",{params}),
    api.get("/system-settings/alerts/summary"),
    api.get("/system-settings/audit/recent",{params:{limit:30}}),
   ]);
   setCatalog(c.data);setAlerts(a.data);setAudit(Array.isArray(h.data)?h.data:[]);
   const next:Record<string,any>={};(c.data?.settings||[]).forEach((s:Setting)=>{next[s.key]=s.value});setValues(next);setDirty({});
   if(admin){
    try{const s=await api.get("/system-settings/franchise/mailchimp-secret/status");setMailchimpStatus(s.data)}catch{setMailchimpStatus(null)}
   }
  }catch(e){setError(err(e))}finally{setLoading(false)}
 },[locationId,admin]);

 useEffect(()=>{void loadLocations().catch(e=>setError(err(e)))},[loadLocations]);
 useEffect(()=>{void load()},[load]);

 const groups=useMemo(()=>{
  const map=new Map<string,Setting[]>();
  (catalog?.settings||[]).forEach(s=>map.set(s.category,[...(map.get(s.category)||[]),s]));
  return Array.from(map.entries());
 },[catalog]);
 const dirtyCount=Object.values(dirty).filter(Boolean).length;
 const selectedLocation=locations.find(x=>x.id===locationId);
 const franchiseConfigured=(catalog?.settings||[]).some(s=>s.category==="franchise");

 function change(setting:Setting,value:any){setValues(v=>({...v,[setting.key]:value}));setDirty(d=>({...d,[setting.key]:true}))}
 function resetLocal(){if(!catalog)return;const next:Record<string,any>={};catalog.settings.forEach(s=>next[s.key]=s.value);setValues(next);setDirty({});setNotice("A nem mentett módosításokat visszavontuk.")}

 async function save(){
  if(!admin||!catalog||!dirtyCount)return;
  setSaving(true);setError("");
  try{
   const changed=catalog.settings.filter(s=>dirty[s.key]);
   for(const s of changed){
    await api.put(`/system-settings/${encodeURIComponent(s.key)}`,{
     value:values[s.key],
     location_id:s.scope==="location"?locationId:undefined,
     apply_to_all:s.scope==="location"?applyAll:false,
     note:applyAll&&s.scope==="location"?"Rendszerbeállítások: minden aktív szalonra alkalmazva":"Rendszerbeállítások felületéről módosítva",
    });
   }
   setNotice(`${changed.length} beállítás mentve${applyAll?"; a telephelyi értékek minden aktív szalonra alkalmazva":""}.`);
   await load();
  }catch(e){setError(err(e))}finally{setSaving(false)}
 }

 async function saveMailchimpKey(){
  const key=mailchimpKey.trim();if(!admin||!key)return;
  setMailchimpBusy(true);setError("");setNotice("");
  try{
   const r=await api.put("/system-settings/franchise/mailchimp-secret",{api_key:key});
   setMailchimpKey("");setMailchimpStatus({configured:true,source:r.data?.source||"database",suffix:r.data?.suffix||null});
   setNotice("A Mailchimp API-kulcs titkosítva elmentve. A kulcs értéke később nem olvasható vissza.");
  }catch(e){setError(err(e))}finally{setMailchimpBusy(false)}
 }

 async function testMailchimp(){
  if(!admin)return;setMailchimpBusy(true);setError("");setNotice("");
  try{
   const r=await api.post("/system-settings/franchise/mailchimp-test");
   setNotice(`Mailchimp kapcsolat rendben: ${r.data?.audience_name||r.data?.audience_id||"Audience"} · ${fmt(r.data?.member_count||0)} kontakt.`);
  }catch(e){setError(`Mailchimp kapcsolatteszt sikertelen: ${err(e)}`)}finally{setMailchimpBusy(false)}
 }

 return <main className="sysset-page">
  <header className="sysset-head">
   <div><small>KLEOPÁTRA VIR · KÖZPONTI KONFIGURÁCIÓ</small><h1><SlidersHorizontal/>Rendszerbeállítások</h1><p>A központi üzleti paraméterek egy helyen. Az online foglalás, a franchise funnel és a Mailchimp integráció is innen adminisztrálható, minden módosítás auditnaplóba kerül.</p></div>
   <div className="sysset-actions"><button className="sysset-ghost" onClick={()=>void load()} disabled={loading}><RefreshCw className={loading?"spin":""}/>Frissítés</button>{admin&&<button className="sysset-primary" onClick={save} disabled={saving||!dirtyCount}><Save/>{saving?"Mentés…":`Mentés${dirtyCount?` (${dirtyCount})`:""}`}</button>}</div>
  </header>

  {error&&<div className="sysset-alert error"><AlertTriangle/><span>{error}</span></div>}
  {notice&&<div className="sysset-alert ok"><CheckCircle2/><span>{notice}</span></div>}

  <section className="sysset-topbar">
   <label><Building2/><span>Telephelyi foglalási paraméterek</span><select value={locationId} onChange={e=>setLocationId(e.target.value)}><option value="">Válassz szalont…</option>{locations.map(l=><option key={l.id} value={l.id}>{l.name}{l.city?` · ${l.city}`:""}</option>)}</select></label>
   <div className="sysset-access"><ShieldCheck/><div><b>{admin?"Adminisztrátori szerkesztés":"Vezetői megtekintés"}</b><span>{admin?"Módosítás és audit naplózás engedélyezve.":"A rendszerbeállításokat csak adminisztrátor módosíthatja."}</span></div></div>
   {admin&&<label className="sysset-bulk"><input type="checkbox" checked={applyAll} onChange={e=>setApplyAll(e.target.checked)}/><span>Telephelyi módosítások alkalmazása <b>minden aktív szalonra</b></span></label>}
  </section>

  <section className="sysset-kpis">
   <article className={alerts?.equipment?.count?"warn":""}><Wrench/><div><span>Szervizfigyelmeztetés</span><b>{alerts?.equipment?.count||0} eszköz</b><small>{alerts?.equipment?.warning_days??30} napon belül esedékes</small></div></article>
   <article className={alerts?.finance?.count?"warn":""}><CircleDollarSign/><div><span>Kasszaeltérés</span><b>{alerts?.finance?.count||0} zárás</b><small>30 nap · ≥ {fmt(alerts?.finance?.variance_warning_huf||0)} Ft</small></div></article>
   <article><Building2/><div><span>Kiválasztott szalon</span><b>{selectedLocation?.name||"Nincs kiválasztva"}</b><small>{selectedLocation?.city||"Telephelyi beállításokhoz válassz szalont"}</small></div></article>
  </section>

  {franchiseConfigured&&<section className="sysset-panel" id="franchise-mailchimp" style={{marginBottom:24}}>
   <header><Mail/><div><h2>Franchise funnel / Mailchimp</h2><p>LP → LP_form → SP → SP_form → SP_form_TY. Az Audience, tagek, URL-ek és opt-in beállítások az alábbi Franchise kártyában módosíthatók.</p></div></header>
   <div className="sysset-fields" style={{marginTop:18}}>
    <div className="sysset-field">
     <div className="sysset-field-head"><div><label htmlFor="mailchimp-api-key">Mailchimp API-kulcs</label><p>Biztonsági okból csak cserélhető, vissza nem olvasható. Adatbázisban AES-256-GCM titkosítással tároljuk.</p></div><span className="sysset-scope global">Titkos</span></div>
     <div className="sysset-control">
      <div className="sysset-input-wrap"><KeyRound/><input id="mailchimp-api-key" type="password" autoComplete="new-password" placeholder={mailchimpStatus?.configured?`Beállítva · …${mailchimpStatus.suffix||""}`:"Új Mailchimp API-kulcs"} value={mailchimpKey} disabled={!admin||mailchimpBusy} onChange={e=>setMailchimpKey(e.target.value)}/></div>
      <small>Forrás: {mailchimpStatus?.source==="database"?"VIR titkos beállítás":mailchimpStatus?.source==="environment"?"Render Environment":"nincs beállítva"}</small>
     </div>
    </div>
    <div className="sysset-field">
     <div className="sysset-field-head"><div><label>Kapcsolat ellenőrzése</label><p>A teszt a beállított szerverprefixszel és Audience ID-val közvetlenül lekérdezi a Mailchimp API-t.</p></div><span className="sysset-scope global">Admin</span></div>
     <div className="sysset-actions" style={{justifyContent:"flex-start"}}>
      <button className="sysset-primary" type="button" disabled={!admin||mailchimpBusy||!mailchimpKey.trim()} onClick={saveMailchimpKey}><Save/>API-kulcs mentése</button>
      <button className="sysset-ghost" type="button" disabled={!admin||mailchimpBusy||!mailchimpStatus?.configured} onClick={testMailchimp}><TestTube2/>{mailchimpBusy?"Ellenőrzés…":"Kapcsolat tesztelése"}</button>
     </div>
    </div>
   </div>
  </section>}

  <section className="sysset-grid">
   {groups.map(([category,settings])=>{const Icon=categoryIcons[category]||Settings2;return <article className="sysset-card" key={category} id={category==="franchise"?"franchise-funnel":undefined}>
    <header><span className="sysset-icon"><Icon/></span><div><h2>{settings[0]?.category_label||category}</h2><p>{category==="booking"?"Szalononkénti, azonnal érvényes online foglalási paraméterek.":category==="franchise"?"Központi franchise kampány-, Mailchimp- és útvonalbeállítások.":"Központi, minden szalonra érvényes rendszerparaméterek."}</p></div></header>
    <div className="sysset-fields">{settings.map(s=>{
     const disabled=!admin||(s.scope==="location"&&!locationId);
     return <div className={`sysset-field ${dirty[s.key]?"dirty":""}`} key={s.key}>
      <div className="sysset-field-head"><div><label htmlFor={`setting-${s.key}`}>{s.label}</label><p>{s.description}</p></div><span className={`sysset-scope ${s.scope}`}>{s.scope==="global"?"Központi":"Szalon"}</span></div>
      <div className="sysset-control">
       {s.type==="boolean"?<label className="sysset-switch"><input id={`setting-${s.key}`} type="checkbox" checked={Boolean(values[s.key])} disabled={disabled} onChange={e=>change(s,e.target.checked)}/><span/><b>{values[s.key]?"Bekapcsolva":"Kikapcsolva"}</b></label>:
        <div className="sysset-input-wrap"><input id={`setting-${s.key}`} type={s.type==="time"?"time":s.type==="number"?"number":"text"} value={values[s.key]??""} min={s.min} max={s.max} step={s.step} disabled={disabled} onChange={e=>change(s,s.type==="number"?(e.target.value===""?"":Number(e.target.value)):e.target.value)}/>{s.unit&&<span>{s.unit}</span>}</div>}
       {s.updated_at&&<small>Utolsó módosítás: {dt(s.updated_at)}</small>}
       {s.spec_reference&&<small className="sysset-spec">{s.spec_reference}</small>}
      </div>
     </div>
    })}</div>
   </article>})}
  </section>

  {admin&&dirtyCount>0&&<div className="sysset-sticky"><span><b>{dirtyCount}</b> nem mentett módosítás</span><div><button className="sysset-ghost" onClick={resetLocal}>Visszavonás</button><button className="sysset-primary" onClick={save} disabled={saving}><Save/>{saving?"Mentés…":"Módosítások mentése"}</button></div></div>}

  <section className="sysset-detail-grid">
   <article className="sysset-panel"><header><Wrench/><div><h2>Közelgő eszközszervizek</h2><p>A központi szerviz-figyelmeztetési napérték alapján.</p></div></header><div className="sysset-list">{alerts?.equipment?.items?.length?alerts.equipment.items.slice(0,10).map((x:any)=><div key={x.id}><div><b>{x.name}</b><span>{x.item_number||"Nincs leltári szám"}</span></div><strong>{date(x.next_service_at)}</strong></div>):<div className="sysset-empty">Nincs a beállított időablakban esedékes eszköz.</div>}</div></article>
   <article className="sysset-panel"><header><CircleDollarSign/><div><h2>Kiemelt kasszaeltérések</h2><p>Az elmúlt 30 nap zárásai a beállított küszöb alapján.</p></div></header><div className="sysset-list">{alerts?.finance?.items?.length?alerts.finance.items.slice(0,10).map((x:any)=><div key={x.id}><div><b>{x.location_name||x.location_id}</b><span>{x.report_no||date(x.business_date)}</span></div><strong>{fmt(x.difference)} Ft</strong></div>):<div className="sysset-empty">Nincs küszöbértéket elérő kasszaeltérés.</div>}</div></article>
  </section>

  <section className="sysset-audit"><header><History/><div><h2>Beállításmódosítási napló</h2><p>Minden adminisztrátori változtatás előtt/után értékkel és hatókörrel naplózott. A titkos API-kulcs értéke soha nem kerül a naplóba.</p></div></header><div className="sysset-table-wrap"><table><thead><tr><th>Időpont</th><th>Beállítás</th><th>Hatókör</th><th>Régi érték</th><th>Új érték</th><th>Módosította</th></tr></thead><tbody>{audit.length?audit.map(a=><tr key={a.id}><td>{dt(a.created_at)}</td><td>{a.key}</td><td>{a.scope_type==="location"?locations.find(l=>l.id===a.scope_id)?.name||a.scope_id:a.scope_type==="all_locations"?"Minden szalon":"Központi"}</td><td>{typeof a.old_value==="object"?JSON.stringify(a.old_value):String(a.old_value??"—")}</td><td>{typeof a.new_value==="object"?JSON.stringify(a.new_value):String(a.new_value??"—")}</td><td>{a.actor||"—"}</td></tr>):<tr><td colSpan={6} className="sysset-empty">Még nincs naplózott beállításmódosítás.</td></tr>}</tbody></table></div></section>
 </main>
}