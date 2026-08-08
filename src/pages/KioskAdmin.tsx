import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2, ChevronDown, ChevronUp, ExternalLink, Eye, Image as ImageIcon, Layers3,
  ListChecks, MonitorSmartphone, Palette, RefreshCw, Save, Search, Settings2, Sparkles, Star,
  Store, ToggleLeft, ToggleRight,
} from "lucide-react";
import "./KioskAdmin.css";
import {
  getKioskAdminLocations, getKioskAdminMenu, initKioskMenu, saveKioskItems, saveKioskSettings,
  type KioskLocation, type KioskMenu, type KioskMenuItem, type KioskSection, type KioskService, type KioskStats,
} from "../api/kioskAdmin";

type Tab = "general" | "appearance" | "categories" | "services";
const PUBLIC_KIOSK = "https://weblap-o3g6.onrender.com/kiosk";
const DEFAULT_THEME: Record<string, any> = {
  primaryColor: "#b69861", accentColor: "#ec008c", backgroundColor: "#f4efe7", surfaceColor: "#ffffff", textColor: "#181310",
  welcomeText: "Minden ami szépség, csak Neked!", heroTitle: "Mit szeretnél ma?", heroSubtitle: "Válassz kategóriát, majd szolgáltatást néhány érintéssel.",
  heroImageUrl: "/images/szolgaltatasok.jpg", startTitle: "Üdvözlünk a Kleopátra Szépségszalonban!", startSubtitle: "Érintsd meg a képernyőt a szolgáltatás kiválasztásához.",
  startButtonText: "Kezdés", logoUrl: "/images/kleo_logo@2x.png", showStartScreen: true, showPrices: true, showDuration: true,
  showEmployees: false, showProducts: false, showWebEmbed: false, autoResetSeconds: 30, cardRadius: 24,
};
const groupName=(s:KioskService)=>s.service_type_name||"Egyéb";
const money=(v:unknown)=>`${Number(v||0).toLocaleString("hu-HU",{maximumFractionDigits:0})} Ft`;

export default function KioskAdmin(){
  const[locations,setLocations]=useState<KioskLocation[]>([]);
  const[locationId,setLocationId]=useState(()=>localStorage.getItem("kiosk_admin_location_id")||localStorage.getItem("kleo_location_id")||"");
  const[menu,setMenu]=useState<KioskMenu|null>(null);
  const[sections,setSections]=useState<KioskSection[]>([]);
  const[services,setServices]=useState<KioskService[]>([]);
  const[stats,setStats]=useState<KioskStats|null>(null);
  const[theme,setTheme]=useState<Record<string,any>>(DEFAULT_THEME);
  const[menuName,setMenuName]=useState("Kiosk menü");
  const[isActive,setIsActive]=useState(true);
  const[tab,setTab]=useState<Tab>("general");
  const[query,setQuery]=useState("");
  const[category,setCategory]=useState("all");
  const[editingServiceId,setEditingServiceId]=useState("");
  const[loading,setLoading]=useState(false);
  const[saving,setSaving]=useState(false);
  const[error,setError]=useState("");
  const[notice,setNotice]=useState("");

  const loadLocations=useCallback(async()=>{
    try{const rows=await getKioskAdminLocations();setLocations(rows);setLocationId(current=>current&&rows.some(r=>r.id===current)?current:rows[0]?.id||"")}
    catch(e:any){setError(e?.message||"A szalonok nem tölthetők be.")}
  },[]);

  const load=useCallback(async()=>{
    if(!locationId)return;setLoading(true);setError("");setNotice("");
    try{
      localStorage.setItem("kiosk_admin_location_id",locationId);
      const data=await getKioskAdminMenu(locationId);
      setMenu(data.menu||null);setSections((data.sections||[]).sort((a,b)=>a.order-b.order));setServices(data.services||[]);setStats(data.stats||null);
      setTheme({...DEFAULT_THEME,...(data.defaults||{}),...(data.menu?.theme||{})});setMenuName(data.menu?.name||`${data.location?.name||"Szalon"} kiosk`);setIsActive(Boolean(data.menu?.is_active??true));
    }catch(e:any){setError(e?.message||"A kiosk beállításai nem tölthetők be.")}finally{setLoading(false)}
  },[locationId]);

  useEffect(()=>{void loadLocations()},[loadLocations]);
  useEffect(()=>{if(locationId)void load()},[load,locationId]);

  const itemMap=useMemo(()=>{const m=new Map<string,{section:KioskSection,item:KioskMenuItem}>();sections.forEach(section=>section.items.forEach(item=>m.set(item.serviceId,{section,item})));return m},[sections]);
  const categories=useMemo(()=>Array.from(new Set(services.map(groupName))).sort((a,b)=>a.localeCompare(b,"hu")),[services]);
  const filteredServices=useMemo(()=>services.filter(service=>{
    const catOk=category==="all"||groupName(service)===category;
    const hay=`${service.name} ${service.description||""} ${groupName(service)}`.toLocaleLowerCase("hu-HU");
    return catOk&&hay.includes(query.toLocaleLowerCase("hu-HU"));
  }),[services,category,query]);
  const enabledCount=useMemo(()=>services.filter(s=>itemMap.get(s.id)?.item.enabled&&itemMap.get(s.id)?.section.enabled!==false).length,[services,itemMap]);
  const selectedLocation=locations.find(x=>x.id===locationId)||null;
  const previewUrl=`${PUBLIC_KIOSK}?location_id=${encodeURIComponent(locationId)}`;

  function mutateTheme(key:string,value:any){setTheme(v=>({...v,[key]:value}))}
  function switchTheme(key:string){mutateTheme(key,!Boolean(theme[key]))}
  function updateSection(id:string,patch:Partial<KioskSection>){setSections(current=>current.map(s=>s.id===id?{...s,...patch}:s))}
  function moveSection(id:string,delta:number){setSections(current=>{const next=[...current];const i=next.findIndex(s=>s.id===id),j=i+delta;if(i<0||j<0||j>=next.length)return current;[next[i],next[j]]=[next[j],next[i]];return next.map((s,index)=>({...s,order:index}))})}
  function targetFor(service:KioskService,next:KioskSection[]){const existing=next.find(s=>s.items.some(i=>i.serviceId===service.id));if(existing)return existing;return next.find(s=>s.title.toLocaleLowerCase("hu-HU")===groupName(service).toLocaleLowerCase("hu-HU"))||next.find(s=>s.title.toLocaleLowerCase("hu-HU")==="egyéb")||next[0]}
  function patchService(service:KioskService,patch:Partial<KioskMenuItem>){setSections(current=>{const next=current.map(s=>({...s,items:s.items.map(i=>({...i}))}));const target=targetFor(service,next);if(!target)return current;let item=target.items.find(i=>i.serviceId===service.id);if(!item){item={serviceId:service.id,enabled:true,order:target.items.length};target.items.push(item)}Object.assign(item,patch);return next})}
  function setFilteredEnabled(enabled:boolean){filteredServices.forEach(s=>patchService(s,{enabled}))}

  async function initialize(){if(!locationId)return;setLoading(true);setError("");try{await initKioskMenu(locationId,`${selectedLocation?.name||"Szalon"} kiosk`);setNotice("Az alap kiosk létrejött. Most már teljesen szerkeszthető a VIR-ből.");await load()}catch(e:any){setError(e?.message||"A kiosk menü létrehozása sikertelen.")}finally{setLoading(false)}}
  async function saveAll(){if(!menu?.id)return setError("Előbb hozza létre a kiosk menüt.");setSaving(true);setError("");setNotice("");try{
    const normalized=sections.map((s,index)=>({...s,order:index}));
    await saveKioskSettings(menu.id,{name:menuName,is_active:isActive,theme,sections:normalized.map(s=>({id:s.id,title:s.title,subtitle:s.subtitle||"",imageUrl:s.imageUrl||"",enabled:s.enabled!==false,order:s.order}))});
    await saveKioskItems(menu.id,normalized.map(section=>({sectionId:section.id,items:section.items.map((item,index)=>({...item,order:index}))})));
    setNotice("A kiosk beállításai mentve. Az élő kiosk következő betöltéskor az új konfigurációt használja.");await load();
  }catch(e:any){setError(e?.message||"A kiosk mentése sikertelen.")}finally{setSaving(false)}}

  return <main className="kiosk-admin-page">
    <section className="kiosk-admin-hero">
      <div><span className="kiosk-admin-eyebrow"><MonitorSmartphone size={15}/> VIR · KIOSK ADMIN</span><h1>Önkiszolgáló kiosk vezérlőközpont</h1><p>A gyorséttermi önkiszolgáló kioskokhoz hasonló érintéses folyamat, teljes Kleopátra arculattal és VIR-adatokkal.</p></div>
      <div className="kiosk-admin-hero-actions"><button className="kiosk-admin-btn ghost" onClick={()=>void load()} disabled={loading||!locationId}><RefreshCw size={16}/> Frissítés</button><button className="kiosk-admin-btn ghost" onClick={()=>window.open(previewUrl,"_blank","noopener,noreferrer")} disabled={!locationId}><Eye size={16}/> Élő kiosk</button><button className="kiosk-admin-btn primary" onClick={()=>void saveAll()} disabled={!menu||saving}><Save size={16}/>{saving?"Mentés…":"Mentés és publikálás"}</button></div>
    </section>
    {error&&<div className="kiosk-admin-alert error">{error}</div>}{notice&&<div className="kiosk-admin-alert success"><CheckCircle2 size={17}/>{notice}</div>}

    <section className="kiosk-admin-locationbar">
      <div className="kiosk-admin-location-select"><Store size={18}/><div><span>Kezelt szalon</span><select value={locationId} onChange={e=>setLocationId(e.target.value)}>{locations.map(l=><option key={l.id} value={l.id}>{l.name}</option>)}</select></div></div>
      <div className={`kiosk-admin-status ${menu&&isActive?"active":"inactive"}`}><span className="dot"/><div><small>Publikálás</small><b>{menu?(isActive?"Aktív kiosk":"Kikapcsolva"):"Nincs menü"}</b></div></div>
      <div className="kiosk-admin-meta"><small>Utolsó mentés</small><b>{menu?.updated_at?new Date(menu.updated_at).toLocaleString("hu-HU"):"—"}</b></div>
    </section>

    {!menu&&!loading?<section className="kiosk-admin-empty"><Sparkles size={42}/><h2>Ehhez a szalonhoz még nincs kiosk menü</h2><p>Az alap kioskot a VIR-ben elérhető szolgáltatástípusokból és szolgáltatásokból építjük fel.</p><button className="kiosk-admin-btn primary" onClick={()=>void initialize()}><Sparkles size={17}/> Kiosk létrehozása</button></section>:<>
      <section className="kiosk-admin-kpis"><article><span>Adatbázis szolgáltatás</span><strong>{stats?.total_services??services.length}</strong><small>ebben a szalonban</small></article><article><span>Kioskban aktív</span><strong>{enabledCount}</strong><small>vendég választhatja</small></article><article><span>Kategória</span><strong>{sections.filter(s=>s.enabled!==false).length}</strong><small>aktív menücsoport</small></article><article><span>Indítóképernyő</span><strong>{theme.showStartScreen?"BE":"KI"}</strong><small>érintéses kezdés</small></article></section>

      <nav className="kiosk-admin-tabs">
        <button className={tab==="general"?"active":""} onClick={()=>setTab("general")}><Settings2 size={16}/> Működés</button>
        <button className={tab==="appearance"?"active":""} onClick={()=>setTab("appearance")}><Palette size={16}/> Megjelenés</button>
        <button className={tab==="categories"?"active":""} onClick={()=>setTab("categories")}><Layers3 size={16}/> Kategóriák <b>{sections.length}</b></button>
        <button className={tab==="services"?"active":""} onClick={()=>setTab("services")}><ListChecks size={16}/> Szolgáltatások <b>{enabledCount}</b></button>
      </nav>

      {tab==="general"&&<section className="kiosk-admin-grid two">
        <article className="kiosk-admin-card"><div className="kiosk-admin-card-title"><div><h2>Publikálás és alapműködés</h2><p>A kiosk teljes viselkedése szalononként állítható.</p></div></div>
          <label className="kiosk-admin-field"><span>Menü neve</span><input value={menuName} onChange={e=>setMenuName(e.target.value)}/></label>
          <SwitchRow active={isActive} title={isActive?"Kiosk engedélyezve":"Kiosk kikapcsolva"} text={isActive?"A vendégek használhatják a kioskot.":"A konfiguráció megmarad, de a menü nem jelenik meg."} onClick={()=>setIsActive(v=>!v)}/>
          <SwitchRow active={Boolean(theme.showStartScreen)} title="Indítóképernyő" text="Nagy, érintésre induló nyitóképernyő a rendelési folyamat előtt." onClick={()=>switchTheme("showStartScreen")}/>
          <SwitchRow active={Boolean(theme.showPrices)} title="Árak megjelenítése" text="A szolgáltatáskártyákon jelenjen meg az aktuális VIR ár." onClick={()=>switchTheme("showPrices")}/>
          <SwitchRow active={Boolean(theme.showDuration)} title="Időtartam megjelenítése" text="Mutassa a szolgáltatás adatbázisban rögzített időtartamát." onClick={()=>switchTheme("showDuration")}/>
          <SwitchRow active={Boolean(theme.showEmployees)} title="Munkatárs-választás fizetés előtt" text="A vendég opcionálisan választhat aktív munkatársat." onClick={()=>switchTheme("showEmployees")}/>
          <SwitchRow active={Boolean(theme.showProducts)} title="Kleoshop ajánlatok" text="A szolgáltatásoldalon kapcsolódó termékajánlatok is megjelenhetnek." onClick={()=>switchTheme("showProducts")}/>
          <label className="kiosk-admin-field compact"><span>Automatikus visszaállás sikeres rendelés után (mp)</span><input type="number" min={10} max={120} value={Number(theme.autoResetSeconds||30)} onChange={e=>mutateTheme("autoResetSeconds",Number(e.target.value))}/></label>
          <div className="kiosk-admin-linkbox"><span>Publikus kiosk</span><code>{previewUrl}</code><button onClick={()=>window.open(previewUrl,"_blank","noopener,noreferrer")}><ExternalLink size={15}/> Megnyitás</button></div>
        </article>
        <article className="kiosk-admin-card"><div className="kiosk-admin-card-title"><div><h2>Indító- és főképernyő szövegei</h2><p>A vendég által látott fő üzenetek.</p></div></div>
          <label className="kiosk-admin-field"><span>Indítóképernyő címe</span><input value={theme.startTitle||""} onChange={e=>mutateTheme("startTitle",e.target.value)}/></label>
          <label className="kiosk-admin-field"><span>Indítóképernyő alcíme</span><textarea value={theme.startSubtitle||""} onChange={e=>mutateTheme("startSubtitle",e.target.value)}/></label>
          <label className="kiosk-admin-field"><span>Kezdés gomb felirata</span><input value={theme.startButtonText||""} onChange={e=>mutateTheme("startButtonText",e.target.value)}/></label>
          <label className="kiosk-admin-field"><span>Főoldal címe</span><input value={theme.heroTitle||""} onChange={e=>mutateTheme("heroTitle",e.target.value)}/></label>
          <label className="kiosk-admin-field"><span>Főoldal leírása</span><textarea value={theme.heroSubtitle||""} onChange={e=>mutateTheme("heroSubtitle",e.target.value)}/></label>
        </article>
      </section>}

      {tab==="appearance"&&<section className="kiosk-admin-grid two">
        <article className="kiosk-admin-card"><div className="kiosk-admin-card-title"><div><h2>Arculati beállítások</h2><p>Kleopátra színek, képek és kártyamegjelenés.</p></div></div>
          <label className="kiosk-admin-field"><span>Logó URL / útvonal</span><input value={theme.logoUrl||""} onChange={e=>mutateTheme("logoUrl",e.target.value)}/></label>
          <label className="kiosk-admin-field"><span>Hero / indítókép URL</span><input value={theme.heroImageUrl||""} onChange={e=>mutateTheme("heroImageUrl",e.target.value)}/></label>
          <div className="kiosk-admin-color-grid"><ColorField label="Arany főszín" value={theme.primaryColor} onChange={v=>mutateTheme("primaryColor",v)}/><ColorField label="Magenta kiemelés" value={theme.accentColor} onChange={v=>mutateTheme("accentColor",v)}/><ColorField label="Háttér" value={theme.backgroundColor} onChange={v=>mutateTheme("backgroundColor",v)}/><ColorField label="Kártyák" value={theme.surfaceColor} onChange={v=>mutateTheme("surfaceColor",v)}/><ColorField label="Szöveg" value={theme.textColor} onChange={v=>mutateTheme("textColor",v)}/></div>
          <label className="kiosk-admin-field compact"><span>Kártya lekerekítés (px)</span><input type="range" min={12} max={38} value={Number(theme.cardRadius||24)} onChange={e=>mutateTheme("cardRadius",Number(e.target.value))}/><b>{Number(theme.cardRadius||24)} px</b></label>
        </article>
        <article className="kiosk-admin-card kiosk-admin-preview-card"><span className="kiosk-admin-card-kicker">ÉLŐ STÍLUS ELŐNÉZET</span><div className="kiosk-mini-preview-v2" style={{background:theme.backgroundColor,color:theme.textColor,borderRadius:Number(theme.cardRadius||24)}}><header><img src={theme.logoUrl||DEFAULT_THEME.logoUrl} alt="Kleopátra"/><span style={{background:theme.accentColor}}>KIOSK</span></header><div className="preview-hero" style={{backgroundImage:`linear-gradient(90deg,rgba(18,12,8,.78),rgba(18,12,8,.1)),url(${theme.heroImageUrl||DEFAULT_THEME.heroImageUrl})`}}><small>{selectedLocation?.name}</small><b>{theme.heroTitle}</b></div><div className="preview-grid"><i style={{borderColor:theme.primaryColor}}/><i style={{borderColor:theme.primaryColor}}/><i style={{borderColor:theme.primaryColor}}/><i style={{borderColor:theme.primaryColor}}/></div><button style={{background:theme.accentColor}}>Tovább a fizetéshez →</button></div></article>
      </section>}

      {tab==="categories"&&<section className="kiosk-admin-card"><div className="kiosk-admin-card-title"><div><h2>Kategóriakártyák</h2><p>A bal oldali navigáció és a főképernyő nagyméretű csempéi innen vezérelhetők.</p></div></div><div className="kiosk-category-admin-list">{sections.map((section,index)=><article key={section.id} className={!section.enabled?"disabled":""}>
        <div className="category-admin-image">{section.imageUrl?<img src={section.imageUrl} alt=""/>:<ImageIcon/>}</div>
        <div className="category-admin-fields"><label><span>Kategórianév</span><input value={section.title} onChange={e=>updateSection(section.id,{title:e.target.value})}/></label><label><span>Rövid leírás</span><input value={section.subtitle||""} onChange={e=>updateSection(section.id,{subtitle:e.target.value})}/></label><label className="wide"><span>Kategóriakép URL / útvonal</span><input value={section.imageUrl||""} onChange={e=>updateSection(section.id,{imageUrl:e.target.value})}/></label></div>
        <div className="category-admin-actions"><button className={section.enabled!==false?"on":""} onClick={()=>updateSection(section.id,{enabled:section.enabled===false})}>{section.enabled!==false?<ToggleRight/>:<ToggleLeft/>}<span>{section.enabled!==false?"Aktív":"Rejtett"}</span></button><div><button disabled={index===0} onClick={()=>moveSection(section.id,-1)}><ChevronUp/></button><button disabled={index===sections.length-1} onClick={()=>moveSection(section.id,1)}><ChevronDown/></button></div></div>
      </article>)}</div></section>}

      {tab==="services"&&<section className="kiosk-admin-card"><div className="kiosk-admin-card-title services-head"><div><h2>Szolgáltatáskártyák</h2><p>Az ár és időtartam a VIR törzsadatból jön; itt a kiosk megjelenés és láthatóság szabályozható.</p></div><div className="service-bulk"><button onClick={()=>setFilteredEnabled(true)}>Szűrt bekapcsolása</button><button onClick={()=>setFilteredEnabled(false)}>Szűrt kikapcsolása</button></div></div>
        <div className="kiosk-admin-filters"><div className="search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Szolgáltatás keresése…"/></div><select value={category} onChange={e=>setCategory(e.target.value)}><option value="all">Minden kategória</option>{categories.map(c=><option key={c} value={c}>{c}</option>)}</select><span>{filteredServices.length} találat</span></div>
        <div className="kiosk-service-admin-list">{filteredServices.map(service=>{const entry=itemMap.get(service.id),item=entry?.item,enabled=Boolean(item?.enabled&&entry?.section.enabled!==false),open=editingServiceId===service.id;return <article key={service.id} className={enabled?"enabled":"disabled"}>
          <div className="service-admin-main"><button className={`service-toggle ${enabled?"on":""}`} onClick={()=>patchService(service,{enabled:!Boolean(item?.enabled)})}>{enabled?<ToggleRight/>:<ToggleLeft/>}</button><div className="service-admin-copy"><b>{item?.displayName||service.name}</b><span>{groupName(service)} · {money(service.base_price)} · {service.duration_minutes||30} perc</span></div>{item?.featured&&<span className="featured-chip"><Star size={12}/> Ajánlott</span>}<button className="service-edit-btn" onClick={()=>setEditingServiceId(open?"":service.id)}>{open?"Bezárás":"Kiosk kártya szerkesztése"}</button></div>
          {open&&<div className="service-admin-editor"><label><span>Kiosk megnevezés</span><input value={item?.displayName||""} placeholder={service.name} onChange={e=>patchService(service,{displayName:e.target.value})}/></label><label><span>Kártyakép URL / útvonal</span><input value={item?.imageUrl||""} onChange={e=>patchService(service,{imageUrl:e.target.value})}/></label><label><span>Jelvény / badge</span><input value={item?.badgeText||""} placeholder="pl. TOP, ÚJ, AKCIÓ" onChange={e=>patchService(service,{badgeText:e.target.value})}/></label><button className={`featured-toggle ${item?.featured?"on":""}`} onClick={()=>patchService(service,{featured:!item?.featured})}><Star size={16}/>{item?.featured?"Ajánlott szolgáltatás":"Megjelölés ajánlottként"}</button></div>}
        </article>})}</div>
      </section>}
    </>}
  </main>;
}

function SwitchRow({active,title,text,onClick}:{active:boolean;title:string;text:string;onClick:()=>void}){return <button type="button" className={`kiosk-admin-switch ${active?"on":""}`} onClick={onClick}>{active?<ToggleRight size={30}/>:<ToggleLeft size={30}/>}<span><b>{title}</b><small>{text}</small></span></button>}
function ColorField({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void}){return <label className="kiosk-admin-color"><span>{label}</span><div><input type="color" value={value||"#ffffff"} onChange={e=>onChange(e.target.value)}/><input value={value||""} onChange={e=>onChange(e.target.value)}/></div></label>}
