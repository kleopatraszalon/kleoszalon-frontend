import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  CheckCircle2, ExternalLink, Eye, GripVertical, Layers3, MonitorSmartphone, Palette,
  RefreshCw, Save, Search, Settings2, ShoppingBag, Sparkles, Store, ToggleLeft, ToggleRight,
} from "lucide-react";
import "./KioskAdmin.css";
import {
  getKioskAdminLocations, getKioskAdminMenu, initKioskMenu, saveKioskItems, saveKioskSettings,
  type KioskDevice, type KioskLocation, type KioskMenu, type KioskMenuItem, type KioskProduct,
  type KioskProductItem, type KioskProductSection, type KioskSection, type KioskService, type KioskStats,
} from "../api/kioskAdmin";

type Tab = "layout" | "appearance" | "services" | "products" | "settings";
const PUBLIC_KIOSK = "https://weblap-o3g6.onrender.com/kiosk";
const DEFAULT_THEME: Record<string, any> = {
  primaryColor: "#b69861", accentColor: "#ec008c", backgroundColor: "#f4efe7", surfaceColor: "#ffffff", textColor: "#181310",
  welcomeText: "Minden ami szépség, csak Neked!", heroTitle: "Mit szeretnél ma?", heroSubtitle: "Válassz kategóriát, majd szolgáltatást vagy terméket néhány érintéssel.",
  heroImageUrl: "/images/szolgaltatasok.jpg", startTitle: "Üdvözlünk a Kleopátra Szépségszalonban!", startSubtitle: "Érintsd meg a képernyőt a választás megkezdéséhez.",
  startButtonText: "Kezdés", logoUrl: "/images/kleo_logo@2x.png", showStartScreen: true, showPrices: true, showDuration: true, showEmployees: false,
  showProducts: true, autoResetSeconds: 30, cardRadius: 24, contentWidth: 760, categoryColumns: 2, productColumns: 2,
  layoutOrder: ["hero", "services", "products"], layoutVisibility: { hero: true, services: true, products: true },
};
const BLOCKS: Record<string, { title: string; text: string }> = {
  hero: { title: "Hero / üdvözlő blokk", text: "Főkép, cím és rövid útmutató." },
  services: { title: "Szolgáltatás menü", text: "Csoportosított szolgáltatáskategóriák." },
  products: { title: "Termék menü", text: "Csoportosított Kleoshop termékek." },
};
const money=(v:unknown)=>`${Number(v||0).toLocaleString("hu-HU",{maximumFractionDigits:0})} Ft`;
const reorder=<T,>(arr:T[],from:number,to:number)=>{const next=[...arr];const [m]=next.splice(from,1);next.splice(to,0,m);return next};

export default function KioskAdmin(){
  const[locations,setLocations]=useState<KioskLocation[]>([]);
  const[device,setDevice]=useState<KioskDevice|null>(null);
  const[locationId,setLocationId]=useState("");
  const[menu,setMenu]=useState<KioskMenu|null>(null);
  const[sections,setSections]=useState<KioskSection[]>([]);
  const[productSections,setProductSections]=useState<KioskProductSection[]>([]);
  const[services,setServices]=useState<KioskService[]>([]);
  const[products,setProducts]=useState<KioskProduct[]>([]);
  const[stats,setStats]=useState<KioskStats|null>(null);
  const[theme,setTheme]=useState<Record<string,any>>(DEFAULT_THEME);
  const[menuName,setMenuName]=useState("Gyöngyös kiosk");
  const[isActive,setIsActive]=useState(true);
  const[tab,setTab]=useState<Tab>("layout");
  const[serviceQuery,setServiceQuery]=useState("");
  const[productQuery,setProductQuery]=useState("");
  const[loading,setLoading]=useState(false);
  const[saving,setSaving]=useState(false);
  const[error,setError]=useState("");
  const[notice,setNotice]=useState("");

  const loadLocations=useCallback(async()=>{
    try{
      const data=await getKioskAdminLocations();
      setLocations(data.locations);setDevice(data.device);
      const bound=data.device?.location_id||data.locations.find(x=>x.is_device_location)?.id||data.locations[0]?.id||"";
      setLocationId(bound);
    }catch(e:any){setError(e?.message||"A kiosk telephelye nem tölthető be.")}
  },[]);
  const load=useCallback(async()=>{
    if(!locationId)return;setLoading(true);setError("");
    try{
      const data=await getKioskAdminMenu(locationId);
      setDevice(data.device||device);setMenu(data.menu||null);setSections([...(data.sections||[])].sort((a,b)=>a.order-b.order));
      setProductSections([...(data.productSections||[])].sort((a,b)=>a.order-b.order));setServices(data.services||[]);setProducts(data.products||[]);setStats(data.stats||null);
      setTheme({...DEFAULT_THEME,...(data.defaults||{}),...(data.menu?.theme||{})});setMenuName(data.menu?.name||`${data.location?.name||"Gyöngyös"} kiosk`);setIsActive(Boolean(data.menu?.is_active??true));
    }catch(e:any){setError(e?.message||"A kiosk konfigurációja nem tölthető be.")}finally{setLoading(false)}
  },[locationId,device]);
  useEffect(()=>{void loadLocations()},[loadLocations]);
  useEffect(()=>{if(locationId)void load()},[locationId,load]);

  const serviceMap=useMemo(()=>new Map(services.map(s=>[s.id,s])),[services]);
  const productMap=useMemo(()=>new Map(products.map(p=>[p.id,p])),[products]);
  const layoutOrder=useMemo(()=>{
    const raw=Array.isArray(theme.layoutOrder)?theme.layoutOrder.filter((x:string)=>BLOCKS[x]):[];
    return [...raw,...Object.keys(BLOCKS).filter(x=>!raw.includes(x))];
  },[theme.layoutOrder]);
  const previewUrl=`${PUBLIC_KIOSK}?location_id=${encodeURIComponent(locationId)}`;
  const boundLocation=locations.find(x=>x.id===locationId)||device?.location||null;
  const enabledServices=sections.reduce((n,s)=>n+(s.enabled===false?0:s.items.filter(i=>i.enabled).length),0);
  const enabledProducts=productSections.reduce((n,s)=>n+(s.enabled===false?0:s.items.filter(i=>i.enabled).length),0);

  function mutateTheme(key:string,value:any){setTheme(v=>({...v,[key]:value}))}
  function switchTheme(key:string){mutateTheme(key,!Boolean(theme[key]))}
  function toggleLayoutVisibility(key:string){setTheme(v=>({...v,layoutVisibility:{...(v.layoutVisibility||{}),[key]:v.layoutVisibility?.[key]===false}}))}
  function updateSection(id:string,patch:Partial<KioskSection>){setSections(v=>v.map(s=>s.id===id?{...s,...patch}:s))}
  function updateProductSection(id:string,patch:Partial<KioskProductSection>){setProductSections(v=>v.map(s=>s.id===id?{...s,...patch}:s))}
  function updateService(sectionId:string,serviceId:string,patch:Partial<KioskMenuItem>){setSections(v=>v.map(s=>s.id!==sectionId?s:{...s,items:s.items.map(i=>i.serviceId===serviceId?{...i,...patch}:i)}))}
  function updateProduct(sectionId:string,productId:string,patch:Partial<KioskProductItem>){setProductSections(v=>v.map(s=>s.id!==sectionId?s:{...s,items:s.items.map(i=>i.productId===productId?{...i,...patch}:i)}))}

  function dragData(e:React.DragEvent,payload:any){e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("application/json",JSON.stringify(payload))}
  function dropLayout(e:React.DragEvent,target:string){e.preventDefault();try{const p=JSON.parse(e.dataTransfer.getData("application/json"));if(p.kind!=="layout")return;const from=layoutOrder.indexOf(p.id),to=layoutOrder.indexOf(target);if(from<0||to<0||from===to)return;mutateTheme("layoutOrder",reorder(layoutOrder,from,to))}catch{}}
  function dropSection(e:React.DragEvent,targetId:string,kind:"service-section"|"product-section"){
    e.preventDefault();try{const p=JSON.parse(e.dataTransfer.getData("application/json"));if(p.kind!==kind)return;
      if(kind==="service-section"){const from=sections.findIndex(s=>s.id===p.id),to=sections.findIndex(s=>s.id===targetId);if(from>=0&&to>=0)setSections(reorder(sections,from,to).map((s,i)=>({...s,order:i})))}
      else{const from=productSections.findIndex(s=>s.id===p.id),to=productSections.findIndex(s=>s.id===targetId);if(from>=0&&to>=0)setProductSections(reorder(productSections,from,to).map((s,i)=>({...s,order:i})))}
    }catch{}
  }
  function dropItem(e:React.DragEvent,sectionId:string,targetId:string,kind:"service"|"product"){
    e.preventDefault();try{const p=JSON.parse(e.dataTransfer.getData("application/json"));if(p.kind!==kind||p.sectionId!==sectionId)return;
      if(kind==="service")setSections(v=>v.map(s=>{if(s.id!==sectionId)return s;const from=s.items.findIndex(i=>i.serviceId===p.id),to=s.items.findIndex(i=>i.serviceId===targetId);return from<0||to<0?s:{...s,items:reorder(s.items,from,to).map((i,n)=>({...i,order:n}))}}));
      else setProductSections(v=>v.map(s=>{if(s.id!==sectionId)return s;const from=s.items.findIndex(i=>i.productId===p.id),to=s.items.findIndex(i=>i.productId===targetId);return from<0||to<0?s:{...s,items:reorder(s.items,from,to).map((i,n)=>({...i,order:n}))}}));
    }catch{}
  }

  async function initialize(){if(!locationId)return;setLoading(true);setError("");try{await initKioskMenu(locationId,`${boundLocation?.name||"Gyöngyös"} kiosk`);setNotice("A Gyöngyöshöz rendelt kiosk menü létrejött.");await load()}catch(e:any){setError(e?.message||"A kiosk menü létrehozása sikertelen.")}finally{setLoading(false)}}
  async function saveAll(){if(!menu?.id)return setError("Előbb hozza létre a kiosk menüt.");setSaving(true);setError("");setNotice("");try{
    const serviceSections=sections.map((s,i)=>({...s,order:i}));const productGroups=productSections.map((s,i)=>({...s,order:i}));
    await saveKioskSettings(menu.id,{name:menuName,is_active:isActive,theme:{...theme,layoutOrder},sections:serviceSections.map(s=>({id:s.id,title:s.title,subtitle:s.subtitle||"",imageUrl:s.imageUrl||"",enabled:s.enabled!==false,order:s.order})),productSections:productGroups.map(s=>({id:s.id,title:s.title,subtitle:s.subtitle||"",imageUrl:s.imageUrl||"",enabled:s.enabled!==false,order:s.order}))});
    await saveKioskItems(menu.id,{sections:serviceSections.map(s=>({sectionId:s.id,items:s.items.map((i,n)=>({...i,order:n}))})),productSections:productGroups.map(s=>({sectionId:s.id,items:s.items.map((i,n)=>({...i,order:n}))}))});
    setNotice("Mentve és publikálva. A Gyöngyös kiosk következő betöltéskor az új elrendezést használja.");await load();
  }catch(e:any){setError(e?.message||"A kiosk mentése sikertelen.")}finally{setSaving(false)}}

  return <main className="kiosk-admin-page">
    <section className="kiosk-admin-hero"><div><span className="kiosk-admin-eyebrow"><MonitorSmartphone size={15}/> VIR · KIOSK BUILDER</span><h1>Gyöngyös kiosk szerkesztő</h1><p>A fizikai kiosk a gyöngyösi szalonhoz van rögzítve. A felület, menük, szolgáltatás- és termékcsoportok innen szerkeszthetők.</p></div><div className="kiosk-admin-hero-actions"><button className="kiosk-admin-btn ghost" onClick={()=>void load()} disabled={loading}><RefreshCw size={16}/> Frissítés</button><button className="kiosk-admin-btn ghost" onClick={()=>window.open(previewUrl,"_blank","noopener,noreferrer")}><Eye size={16}/> Élő előnézet</button><button className="kiosk-admin-btn primary" onClick={()=>void saveAll()} disabled={!menu||saving}><Save size={16}/>{saving?"Mentés…":"Mentés és publikálás"}</button></div></section>
    {error&&<div className="kiosk-admin-alert error">{error}</div>}{notice&&<div className="kiosk-admin-alert success"><CheckCircle2 size={17}/>{notice}</div>}

    <section className="kiosk-admin-locationbar"><div className="kiosk-admin-location-select"><Store size={18}/><div><span>Telepített kiosk</span><b>{device?.name||"Gyöngyös szalon kiosk"}</b><small>{boundLocation?.name||"Gyöngyös"} · fix hozzárendelés</small></div></div><div className={`kiosk-admin-status ${menu&&isActive?"active":"inactive"}`}><span className="dot"/><div><small>Publikálás</small><b>{menu?(isActive?"Aktív":"Kikapcsolva"):"Nincs menü"}</b></div></div><div className="kiosk-admin-meta"><small>Utolsó mentés</small><b>{menu?.updated_at?new Date(menu.updated_at).toLocaleString("hu-HU"):"—"}</b></div></section>

    {!menu&&!loading?<section className="kiosk-admin-empty"><Sparkles size={42}/><h2>A Gyöngyös kiosk még nincs inicializálva</h2><p>Az alap menü a gyöngyösi szalon szolgáltatásaiból, valamint a VIR terméktörzséből épül fel.</p><button className="kiosk-admin-btn primary" onClick={()=>void initialize()}><Sparkles size={17}/> Gyöngyös kiosk létrehozása</button></section>:<>
      <section className="kiosk-admin-kpis"><article><span>Aktív szolgáltatás</span><strong>{enabledServices}</strong><small>{stats?.total_services??services.length} elérhető</small></article><article><span>Aktív termék</span><strong>{enabledProducts}</strong><small>{stats?.total_products??products.length} termékből</small></article><article><span>Szolgáltatáscsoport</span><strong>{sections.filter(s=>s.enabled!==false).length}</strong><small>drag & drop sorrend</small></article><article><span>Termékcsoport</span><strong>{productSections.filter(s=>s.enabled!==false).length}</strong><small>drag & drop sorrend</small></article></section>

      <nav className="kiosk-admin-tabs"><button className={tab==="layout"?"active":""} onClick={()=>setTab("layout")}><Layers3 size={16}/> Elrendezés</button><button className={tab==="appearance"?"active":""} onClick={()=>setTab("appearance")}><Palette size={16}/> Megjelenés</button><button className={tab==="services"?"active":""} onClick={()=>setTab("services")}><Settings2 size={16}/> Szolgáltatások <b>{enabledServices}</b></button><button className={tab==="products"?"active":""} onClick={()=>setTab("products")}><ShoppingBag size={16}/> Termékek <b>{enabledProducts}</b></button><button className={tab==="settings"?"active":""} onClick={()=>setTab("settings")}><MonitorSmartphone size={16}/> Működés</button></nav>

      {tab==="layout"&&<section className="kiosk-builder-grid">
        <article className="kiosk-admin-card"><h2>Drag & drop oldalblokkok</h2><p className="kiosk-admin-help">Fogja meg a blokkot, és húzza a kívánt helyre. A szem kapcsolóval elrejthető.</p><div className="kiosk-layout-list">{layoutOrder.map(key=><div key={key} className={`kiosk-drag-block ${theme.layoutVisibility?.[key]===false?"muted-block":""}`} draggable onDragStart={e=>dragData(e,{kind:"layout",id:key})} onDragOver={e=>e.preventDefault()} onDrop={e=>dropLayout(e,key)}><GripVertical size={20}/><div><b>{BLOCKS[key].title}</b><small>{BLOCKS[key].text}</small></div><button onClick={()=>toggleLayoutVisibility(key)}>{theme.layoutVisibility?.[key]===false?<ToggleLeft/>:<ToggleRight/>}</button></div>)}</div></article>
        <article className="kiosk-admin-card kiosk-admin-preview-card"><h2>Élő szerkezeti előnézet</h2><div className="kiosk-builder-preview" style={{background:theme.backgroundColor,color:theme.textColor,borderRadius:Number(theme.cardRadius||24)}}><header><img src={theme.logoUrl||DEFAULT_THEME.logoUrl} alt="Kleopátra"/><span>GYÖNGYÖS</span></header>{layoutOrder.filter(k=>theme.layoutVisibility?.[k]!==false).map(key=>key==="hero"?<section key={key} className="preview-hero" style={{backgroundImage:`linear-gradient(90deg,rgba(18,12,8,.78),rgba(18,12,8,.15)),url(${theme.heroImageUrl||DEFAULT_THEME.heroImageUrl})`}}><b>{theme.heroTitle}</b><small>{theme.heroSubtitle}</small></section>:<section key={key} className="preview-menu-block"><b>{key==="services"?"Szolgáltatások":"Termékek"}</b><div>{[0,1,2,3].map(x=><i key={x}/>)}</div></section>)}</div></article>
      </section>}

      {tab==="appearance"&&<section className="kiosk-admin-grid two"><article className="kiosk-admin-card"><h2>Arculat és méretezés</h2><ColorField label="Arany főszín" value={theme.primaryColor} onChange={v=>mutateTheme("primaryColor",v)}/><ColorField label="Magenta kiemelés" value={theme.accentColor} onChange={v=>mutateTheme("accentColor",v)}/><ColorField label="Háttér" value={theme.backgroundColor} onChange={v=>mutateTheme("backgroundColor",v)}/><ColorField label="Kártyaszín" value={theme.surfaceColor} onChange={v=>mutateTheme("surfaceColor",v)}/><ColorField label="Szövegszín" value={theme.textColor} onChange={v=>mutateTheme("textColor",v)}/><label className="kiosk-admin-field"><span>Logó URL</span><input value={theme.logoUrl||""} onChange={e=>mutateTheme("logoUrl",e.target.value)}/></label><label className="kiosk-admin-field"><span>Hero kép URL</span><input value={theme.heroImageUrl||""} onChange={e=>mutateTheme("heroImageUrl",e.target.value)}/></label><label className="kiosk-admin-field"><span>Kártya lekerekítés: {Number(theme.cardRadius||24)} px</span><input type="range" min="8" max="40" value={Number(theme.cardRadius||24)} onChange={e=>mutateTheme("cardRadius",Number(e.target.value))}/></label><label className="kiosk-admin-field"><span>Kategória oszlopok</span><select value={Number(theme.categoryColumns||2)} onChange={e=>mutateTheme("categoryColumns",Number(e.target.value))}><option value={1}>1</option><option value={2}>2</option><option value={3}>3</option></select></label></article><article className="kiosk-admin-card"><h2>Szövegek</h2><label className="kiosk-admin-field"><span>Indító cím</span><input value={theme.startTitle||""} onChange={e=>mutateTheme("startTitle",e.target.value)}/></label><label className="kiosk-admin-field"><span>Indító alcím</span><textarea value={theme.startSubtitle||""} onChange={e=>mutateTheme("startSubtitle",e.target.value)}/></label><label className="kiosk-admin-field"><span>Kezdés gomb</span><input value={theme.startButtonText||""} onChange={e=>mutateTheme("startButtonText",e.target.value)}/></label><label className="kiosk-admin-field"><span>Főcím</span><input value={theme.heroTitle||""} onChange={e=>mutateTheme("heroTitle",e.target.value)}/></label><label className="kiosk-admin-field"><span>Főoldali leírás</span><textarea value={theme.heroSubtitle||""} onChange={e=>mutateTheme("heroSubtitle",e.target.value)}/></label></article></section>}

      {tab==="services"&&<section className="kiosk-admin-card"><div className="kiosk-admin-services-head"><div><h2>Szolgáltatások csoportosítva</h2><p>A csoportok és a csoporton belüli szolgáltatások is húzással rendezhetők.</p></div><label className="kiosk-admin-search"><Search size={16}/><input placeholder="Szolgáltatás keresése…" value={serviceQuery} onChange={e=>setServiceQuery(e.target.value)}/></label></div><div className="kiosk-group-stack">{sections.map(section=><div key={section.id} className={`kiosk-group-editor ${section.enabled===false?"disabled":""}`} draggable onDragStart={e=>dragData(e,{kind:"service-section",id:section.id})} onDragOver={e=>e.preventDefault()} onDrop={e=>dropSection(e,section.id,"service-section")}><div className="kiosk-group-header"><GripVertical/><div className="kiosk-group-fields"><input value={section.title} onChange={e=>updateSection(section.id,{title:e.target.value})}/><input placeholder="Rövid leírás" value={section.subtitle||""} onChange={e=>updateSection(section.id,{subtitle:e.target.value})}/><input placeholder="Kategóriakép URL" value={section.imageUrl||""} onChange={e=>updateSection(section.id,{imageUrl:e.target.value})}/></div><button onClick={()=>updateSection(section.id,{enabled:section.enabled===false})}>{section.enabled===false?<ToggleLeft/>:<ToggleRight/>}</button></div><div className="kiosk-group-items">{section.items.filter(i=>{const s=serviceMap.get(i.serviceId);return !serviceQuery||`${s?.name||""} ${i.displayName||""}`.toLowerCase().includes(serviceQuery.toLowerCase())}).map(item=>{const service=serviceMap.get(item.serviceId);if(!service)return null;return <div key={item.serviceId} className={`kiosk-catalog-editor-row ${item.enabled?"enabled":""}`} draggable onDragStart={e=>{e.stopPropagation();dragData(e,{kind:"service",sectionId:section.id,id:item.serviceId})}} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.stopPropagation();dropItem(e,section.id,item.serviceId,"service")}}><GripVertical size={18}/><div className="kiosk-catalog-main"><b>{service.name}</b><small>{money(service.base_price)} · {service.duration_minutes||30} perc</small></div><input placeholder="Kiosk név" value={item.displayName||""} onChange={e=>updateService(section.id,item.serviceId,{displayName:e.target.value})}/><input placeholder="Jelvény" value={item.badgeText||""} onChange={e=>updateService(section.id,item.serviceId,{badgeText:e.target.value})}/><input placeholder="Kép URL" value={item.imageUrl||""} onChange={e=>updateService(section.id,item.serviceId,{imageUrl:e.target.value})}/><button className={item.featured?"starred":""} onClick={()=>updateService(section.id,item.serviceId,{featured:!item.featured})}>★</button><button onClick={()=>updateService(section.id,item.serviceId,{enabled:!item.enabled})}>{item.enabled?<ToggleRight/>:<ToggleLeft/>}</button></div>})}</div></div>)}</div></section>}

      {tab==="products"&&<section className="kiosk-admin-card"><div className="kiosk-admin-services-head"><div><h2>Termékek csoportosítva</h2><p>A VIR terméktörzs csoportjai külön kiosk menüként kezelhetők és húzással rendezhetők.</p></div><label className="kiosk-admin-search"><Search size={16}/><input placeholder="Termék keresése…" value={productQuery} onChange={e=>setProductQuery(e.target.value)}/></label></div><div className="kiosk-group-stack">{productSections.map(section=><div key={section.id} className={`kiosk-group-editor product ${section.enabled===false?"disabled":""}`} draggable onDragStart={e=>dragData(e,{kind:"product-section",id:section.id})} onDragOver={e=>e.preventDefault()} onDrop={e=>dropSection(e,section.id,"product-section")}><div className="kiosk-group-header"><GripVertical/><div className="kiosk-group-fields"><input value={section.title} onChange={e=>updateProductSection(section.id,{title:e.target.value})}/><input placeholder="Rövid leírás" value={section.subtitle||""} onChange={e=>updateProductSection(section.id,{subtitle:e.target.value})}/><input placeholder="Csoportkép URL" value={section.imageUrl||""} onChange={e=>updateProductSection(section.id,{imageUrl:e.target.value})}/></div><button onClick={()=>updateProductSection(section.id,{enabled:section.enabled===false})}>{section.enabled===false?<ToggleLeft/>:<ToggleRight/>}</button></div><div className="kiosk-group-items">{section.items.filter(i=>{const p=productMap.get(i.productId);return !productQuery||`${p?.name||""} ${i.displayName||""}`.toLowerCase().includes(productQuery.toLowerCase())}).map(item=>{const product=productMap.get(item.productId);if(!product)return null;return <div key={item.productId} className={`kiosk-catalog-editor-row ${item.enabled?"enabled":""}`} draggable onDragStart={e=>{e.stopPropagation();dragData(e,{kind:"product",sectionId:section.id,id:item.productId})}} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.stopPropagation();dropItem(e,section.id,item.productId,"product")}}><GripVertical size={18}/><div className="kiosk-catalog-main"><b>{product.name}</b><small>{money(product.price)} · {product.group_name}</small></div><input placeholder="Kiosk név" value={item.displayName||""} onChange={e=>updateProduct(section.id,item.productId,{displayName:e.target.value})}/><input placeholder="Jelvény" value={item.badgeText||""} onChange={e=>updateProduct(section.id,item.productId,{badgeText:e.target.value})}/><input placeholder="Kép URL" value={item.imageUrl||product.image_url||""} onChange={e=>updateProduct(section.id,item.productId,{imageUrl:e.target.value})}/><button className={item.featured?"starred":""} onClick={()=>updateProduct(section.id,item.productId,{featured:!item.featured})}>★</button><button onClick={()=>updateProduct(section.id,item.productId,{enabled:!item.enabled})}>{item.enabled?<ToggleRight/>:<ToggleLeft/>}</button></div>})}</div></div>)}</div></section>}

      {tab==="settings"&&<section className="kiosk-admin-grid two"><article className="kiosk-admin-card"><h2>Kiosk működés</h2><label className="kiosk-admin-field"><span>Menü neve</span><input value={menuName} onChange={e=>setMenuName(e.target.value)}/></label><SwitchRow active={isActive} title="Kiosk aktív" text="A gyöngyösi terminál használható." onClick={()=>setIsActive(v=>!v)}/><SwitchRow active={Boolean(theme.showStartScreen)} title="Indítóképernyő" text="Érintésre induló kezdőképernyő." onClick={()=>switchTheme("showStartScreen")}/><SwitchRow active={Boolean(theme.showPrices)} title="Árak" text="VIR árak megjelenítése." onClick={()=>switchTheme("showPrices")}/><SwitchRow active={Boolean(theme.showDuration)} title="Időtartam" text="Szolgáltatási idők megjelenítése." onClick={()=>switchTheme("showDuration")}/><SwitchRow active={Boolean(theme.showProducts)} title="Termékek" text="Termékcsoportok megjelenítése a kioskon." onClick={()=>switchTheme("showProducts")}/><label className="kiosk-admin-field"><span>Automatikus visszaállás (mp)</span><input type="number" min={10} max={180} value={Number(theme.autoResetSeconds||30)} onChange={e=>mutateTheme("autoResetSeconds",Number(e.target.value))}/></label></article><article className="kiosk-admin-card"><h2>Telepítés</h2><div className="kiosk-device-card"><MonitorSmartphone/><div><small>Eszköz kulcs</small><b>{device?.device_key||"gyongyos-main"}</b><small>Hozzárendelve: {boundLocation?.name||"Gyöngyös"}</small></div></div><div className="kiosk-admin-linkbox"><span>Publikus kiosk URL</span><code>{previewUrl}</code><button onClick={()=>window.open(previewUrl,"_blank","noopener,noreferrer")}><ExternalLink size={15}/> Megnyitás</button></div></article></section>}
    </>}
  </main>;
}

function SwitchRow({active,title,text,onClick}:{active:boolean;title:string;text:string;onClick:()=>void}){return <button type="button" className={`kiosk-admin-switch ${active?"on":""}`} onClick={onClick}>{active?<ToggleRight size={30}/>:<ToggleLeft size={30}/>}<span><b>{title}</b><small>{text}</small></span></button>}
function ColorField({label,value,onChange}:{label:string;value:string;onChange:(v:string)=>void}){return <label className="kiosk-admin-color"><span>{label}</span><div><input type="color" value={value||"#ffffff"} onChange={e=>onChange(e.target.value)}/><input value={value||""} onChange={e=>onChange(e.target.value)}/></div></label>}
