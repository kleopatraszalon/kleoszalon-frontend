import React, { useEffect, useMemo, useState } from "react";
import { Building2, ChevronDown, ChevronRight, Clock3, Plus, Search, SlidersHorizontal, Tag } from "lucide-react";
import withBase from "../utils/apiBase";
import ServiceNewModal from "../components/ServiceNewModal";

type LocationRef = { id: string; name: string };
type Service = {
  id: string;
  name: string;
  code?: string | null;
  service_type_id?: string | null;
  service_type_name?: string | null;
  list_price?: number | null;
  base_price?: number | null;
  duration_minutes?: number | null;
  is_active?: boolean | null;
  online_bookable?: boolean | null;
  locations?: LocationRef[];
};

type ServiceType = { id: string; name: string };

const token = () => localStorage.getItem("kleo_token") || localStorage.getItem("token") || "";
const headers = () => token() ? { Authorization: `Bearer ${token()}` } : undefined;
const money = (v: number | null | undefined) => v == null ? "—" : `${Number(v).toLocaleString("hu-HU")} Ft`;

export default function ServicesCatalogPage() {
  const [services,setServices]=useState<Service[]>([]);
  const [types,setTypes]=useState<ServiceType[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [name,setName]=useState("");
  const [typeId,setTypeId]=useState("");
  const [salonId,setSalonId]=useState("");
  const [minPrice,setMinPrice]=useState("");
  const [maxPrice,setMaxPrice]=useState("");
  const [minTime,setMinTime]=useState("");
  const [maxTime,setMaxTime]=useState("");
  const [includeInactive,setIncludeInactive]=useState(false);
  const [expanded,setExpanded]=useState<Record<string,boolean>>({});
  const [newOpen,setNewOpen]=useState(false);

  const load=async()=>{
    try {
      setLoading(true); setError("");
      const [s,t]=await Promise.all([
        fetch(withBase(`services${includeInactive?"?include_inactive=1":""}`),{headers:headers()}),
        fetch(withBase("service-types"),{headers:headers()})
      ]);
      if(!s.ok) throw new Error(`Szolgáltatások: HTTP ${s.status}`);
      const sd=await s.json(); const td=t.ok?await t.json():[];
      setServices(Array.isArray(sd)?sd:[]); setTypes(Array.isArray(td)?td:[]);
    } catch(e:any) { setError(e?.message||"A szolgáltatások betöltése nem sikerült."); }
    finally { setLoading(false); }
  };

  useEffect(()=>{ void load(); },[includeInactive]);

  const salons=useMemo(()=>{
    const map=new Map<string,string>();
    services.forEach(s=>(s.locations||[]).forEach(l=>map.set(String(l.id),l.name)));
    return Array.from(map.entries()).map(([id,name])=>({id,name})).sort((a,b)=>a.name.localeCompare(b.name,"hu"));
  },[services]);

  const filtered=useMemo(()=>services.filter(s=>{
    const q=name.trim().toLocaleLowerCase("hu-HU");
    const price=Number(s.list_price??s.base_price??0);
    const time=Number(s.duration_minutes??0);
    if(q && !`${s.name} ${s.code||""} ${s.service_type_name||""}`.toLocaleLowerCase("hu-HU").includes(q)) return false;
    if(typeId && String(s.service_type_id)!==typeId) return false;
    if(salonId && !(s.locations||[]).some(l=>String(l.id)===salonId)) return false;
    if(minPrice && price<Number(minPrice)) return false;
    if(maxPrice && price>Number(maxPrice)) return false;
    if(minTime && time<Number(minTime)) return false;
    if(maxTime && time>Number(maxTime)) return false;
    return true;
  }),[services,name,typeId,salonId,minPrice,maxPrice,minTime,maxTime]);

  const grouped=useMemo(()=>{
    const order=new Map(types.map((t,i)=>[String(t.id),i]));
    const m=new Map<string,{id:string;name:string;items:Service[]}>();
    filtered.forEach(s=>{
      const key=String(s.service_type_id||"none");
      if(!m.has(key)) m.set(key,{id:key,name:s.service_type_name||"Egyéb / kategória nélkül",items:[]});
      m.get(key)!.items.push(s);
    });
    return Array.from(m.values()).sort((a,b)=>(order.get(a.id)??9999)-(order.get(b.id)??9999)||a.name.localeCompare(b.name,"hu"));
  },[filtered,types]);

  const reset=()=>{setName("");setTypeId("");setSalonId("");setMinPrice("");setMaxPrice("");setMinTime("");setMaxTime("");};

  return <div style={{padding:"18px 22px 36px",maxWidth:1680,margin:"0 auto"}}>
    <section style={{background:"#fff",border:"1px solid #eee8de",borderRadius:18,boxShadow:"0 12px 34px rgba(45,34,21,.06)",overflow:"hidden"}}>
      <div style={{padding:"22px 24px 16px",display:"flex",justifyContent:"space-between",gap:20,alignItems:"flex-start",borderBottom:"1px solid #f0ece5"}}>
        <div><div style={{fontSize:12,fontWeight:800,letterSpacing:".08em",textTransform:"uppercase",color:"#9b7c43"}}>Törzsadatok</div><h1 style={{margin:"5px 0 4px",fontSize:26,color:"#211b16"}}>Szolgáltatások</h1><p style={{margin:0,color:"#756d64",fontSize:13}}>Kategóriahierarchia, árak, időtartamok és szalon-hozzárendelések egy helyen.</p></div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>setIncludeInactive(v=>!v)} style={secondaryBtn}>{includeInactive?"Csak aktív":"Inaktívak is"}</button>
          <button onClick={()=>setNewOpen(true)} style={primaryBtn}><Plus size={16}/>Új szolgáltatás</button>
        </div>
      </div>

      <div style={{padding:"16px 20px 18px",background:"linear-gradient(180deg,#fff,#fcfaf6)",borderBottom:"1px solid #eee8de"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,color:"#6b5b48",fontWeight:800,fontSize:13}}><SlidersHorizontal size={16}/>Szűrés</div>
        <div style={{display:"grid",gridTemplateColumns:"minmax(260px,1.8fr) minmax(180px,1fr) minmax(200px,1fr) 130px 130px 120px 120px auto",gap:10,alignItems:"end"}}>
          <Field label="Név / kód"><div style={inputWrap}><Search size={15}/><input style={input} value={name} onChange={e=>setName(e.target.value)} placeholder="pl. géllakk, hajvágás…"/></div></Field>
          <Field label="Kategória"><select style={select} value={typeId} onChange={e=>setTypeId(e.target.value)}><option value="">Összes kategória</option>{types.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}</select></Field>
          <Field label="Szalon"><div style={inputWrap}><Building2 size={15}/><select style={{...select,border:0,padding:0,boxShadow:"none",background:"transparent"}} value={salonId} onChange={e=>setSalonId(e.target.value)}><option value="">Minden szalon</option>{salons.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div></Field>
          <Field label="Min. ár"><input style={inputBare} type="number" min={0} value={minPrice} onChange={e=>setMinPrice(e.target.value)} placeholder="Ft"/></Field>
          <Field label="Max. ár"><input style={inputBare} type="number" min={0} value={maxPrice} onChange={e=>setMaxPrice(e.target.value)} placeholder="Ft"/></Field>
          <Field label="Min. idő"><input style={inputBare} type="number" min={0} value={minTime} onChange={e=>setMinTime(e.target.value)} placeholder="perc"/></Field>
          <Field label="Max. idő"><input style={inputBare} type="number" min={0} value={maxTime} onChange={e=>setMaxTime(e.target.value)} placeholder="perc"/></Field>
          <button onClick={reset} style={{...secondaryBtn,height:38}}>Törlés</button>
        </div>
      </div>

      <div style={{padding:"12px 20px 6px",display:"flex",justifyContent:"space-between",alignItems:"center",color:"#756d64",fontSize:12}}><span><b style={{color:"#211b16"}}>{filtered.length}</b> szolgáltatás · <b style={{color:"#211b16"}}>{grouped.length}</b> kategória</span><span>A kategóriák lenyithatók</span></div>

      {error&&<div style={{margin:20,padding:"12px 14px",borderRadius:10,background:"#fff0f0",color:"#9c2d2d",fontWeight:700}}>{error}</div>}
      {loading?<div style={{padding:30,color:"#756d64"}}>Szolgáltatások betöltése…</div>:<div style={{padding:"4px 14px 18px"}}>
        {grouped.map(g=>{
          const open=expanded[g.id]??true;
          return <div key={g.id} style={{border:"1px solid #eee8de",borderRadius:12,margin:"8px 0",overflow:"hidden",background:"#fff"}}>
            <button onClick={()=>setExpanded(p=>({...p,[g.id]:!open}))} style={{width:"100%",border:0,background:"#fbfaf7",padding:"13px 15px",display:"flex",alignItems:"center",gap:10,cursor:"pointer",textAlign:"left"}}>
              {open?<ChevronDown size={17}/>:<ChevronRight size={17}/>}<strong style={{fontSize:14,flex:1,color:"#2a221a"}}>{g.name}</strong><span style={{fontSize:11,fontWeight:800,color:"#9b7c43",background:"#f4eddf",padding:"4px 8px",borderRadius:999}}>{g.items.length} szolgáltatás</span>
            </button>
            {open&&<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}><thead><tr style={{background:"#fff"}}><Th>Név</Th><Th>Kód</Th><Th>Ár</Th><Th>Időtartam</Th><Th>Szalon</Th><Th>Online</Th><Th>Állapot</Th></tr></thead><tbody>{g.items.map(s=><tr key={s.id} style={{borderTop:"1px solid #f1ede6"}}><Td><div style={{fontWeight:750,color:"#2a221a"}}>{s.name}</div></Td><Td>{s.code||"—"}</Td><Td><span style={{display:"inline-flex",gap:5,alignItems:"center"}}><Tag size={13}/>{money(s.list_price??s.base_price)}</span></Td><Td><span style={{display:"inline-flex",gap:5,alignItems:"center"}}><Clock3 size={13}/>{s.duration_minutes??"—"}{s.duration_minutes!=null?" perc":""}</span></Td><Td>{(s.locations||[]).length?(s.locations||[]).map(l=>l.name).join(", "):"Hálózat / nincs külön hozzárendelés"}</Td><Td>{s.online_bookable===false?"nem":"igen"}</Td><Td><span style={{fontWeight:800,color:s.is_active===false?"#9a514b":"#2f7654"}}>{s.is_active===false?"inaktív":"aktív"}</span></Td></tr>)}</tbody></table></div>}
          </div>
        })}
        {!grouped.length&&!error&&<div style={{padding:32,textAlign:"center",color:"#756d64"}}>Nincs találat a megadott szűrőkre.</div>}
      </div>}
    </section>
    <ServiceNewModal isOpen={newOpen} onRequestClose={()=>setNewOpen(false)} onServiceCreated={()=>{setNewOpen(false);void load();}} />
  </div>;
}

function Field({label,children}:{label:string;children:React.ReactNode}){return <label style={{display:"grid",gap:6,fontSize:11,fontWeight:800,color:"#6f655c"}}>{label}{children}</label>}
function Th({children}:{children:React.ReactNode}){return <th style={{textAlign:"left",padding:"10px 13px",fontSize:10,letterSpacing:".07em",textTransform:"uppercase",color:"#8a7f74",fontWeight:900}}>{children}</th>}
function Td({children}:{children:React.ReactNode}){return <td style={{padding:"11px 13px",color:"#62594f",verticalAlign:"top"}}>{children}</td>}
const inputWrap:React.CSSProperties={height:38,border:"1px solid #ddd5ca",borderRadius:9,display:"flex",alignItems:"center",gap:7,padding:"0 10px",background:"#fff",color:"#8c8175"};
const input:React.CSSProperties={border:0,outline:"none",width:"100%",fontSize:12,background:"transparent",color:"#29221c"};
const inputBare:React.CSSProperties={height:38,border:"1px solid #ddd5ca",borderRadius:9,padding:"0 10px",fontSize:12,outline:"none",background:"#fff",boxSizing:"border-box"};
const select:React.CSSProperties={height:38,border:"1px solid #ddd5ca",borderRadius:9,padding:"0 10px",fontSize:12,outline:"none",background:"#fff",color:"#29221c",width:"100%"};
const primaryBtn:React.CSSProperties={height:38,border:0,borderRadius:9,padding:"0 14px",background:"#e83f99",color:"#fff",fontWeight:800,display:"inline-flex",alignItems:"center",gap:7,cursor:"pointer"};
const secondaryBtn:React.CSSProperties={height:38,border:"1px solid #ddd5ca",borderRadius:9,padding:"0 13px",background:"#fff",color:"#5f554b",fontWeight:750,cursor:"pointer"};
