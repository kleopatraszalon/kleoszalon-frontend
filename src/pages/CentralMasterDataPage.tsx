import React,{FormEvent,useCallback,useEffect,useMemo,useRef,useState}from"react";
import{Archive,Boxes,Building2,ChevronRight,Database,Download,Edit3,Landmark,PackageSearch,Plus,RefreshCw,Search,Settings2,Tags,Truck,WalletCards,Wrench,X}from"lucide-react";
import{useNavigate}from"react-router-dom";
import api from"../api/api";
import"./CentralMasterDataPage.css";

type Option={value:string;label:string};
type Field={key:string;label:string;type:string;required?:boolean;options?:Option[];relationEntity?:string;relationValueKey?:string;placeholder?:string};
type EntityDef={key:string;title:string;singular:string;description:string;activeColumn:string;fields:Field[];listFields:string[];route:string;hasSystemRows?:boolean;lockSystemEdit?:boolean};
type Catalog={entities:EntityDef[];counts:Record<string,number>};
type Row=Record<string,any>&{id:string|number;system?:boolean};
type Props={entityKey?:string};

const CATALOG_TTL_MS=15*60*1000;
const ROW_TTL_MS=2*60*1000;
const RELATION_TTL_MS=5*60*1000;
const CATALOG_SESSION_KEY="kleo.masterdata.catalog.v2";
const readStoredCatalog=()=>{try{const raw=sessionStorage.getItem(CATALOG_SESSION_KEY);if(!raw)return null;const parsed=JSON.parse(raw);if(parsed?.expiresAt>Date.now()&&parsed?.value?.entities)return parsed as {value:Catalog;expiresAt:number};sessionStorage.removeItem(CATALOG_SESSION_KEY)}catch{}return null};
let catalogCache:{value:Catalog;expiresAt:number}|null=typeof sessionStorage!=="undefined"?readStoredCatalog():null;
let catalogInFlight:Promise<Catalog>|null=null;
const rowCache=new Map<string,{value:Row[];expiresAt:number}>();
const rowInFlight=new Map<string,Promise<Row[]>>();
const relationCache=new Map<string,{value:Row[];expiresAt:number}>();
const relationInFlight=new Map<string,Promise<Row[]>>();

const iconMap:Record<string,React.ReactNode>={
 salons:<Building2/>,departments:<Tags/>,"equipment-types":<Settings2/>,equipment:<Wrench/>,suppliers:<Truck/>,warehouses:<Boxes/>,units:<PackageSearch/>,"price-types":<Landmark/>,"leave-types":<Archive/>,"movement-types":<Boxes/>,"payment-methods":<WalletCards/>,"financial-transaction-types":<Database/>,
};
const relationLabel=(row:Row)=>String(row.name||row.code||row.item_number||row.id);
const isTrue=(value:any)=>value===true||value===1||value==="true";
const format=(value:any,field?:Field)=>{
 if(value==null||value==="")return"—";
 if(field?.type==="boolean")return isTrue(value)?"Igen":"Nem";
 if(field?.type==="number")return Number(value).toLocaleString("hu-HU");
 if(field?.type==="date")return String(value).slice(0,10);
 return String(value);
};
const err=(error:any)=>error?.response?.data?.message||error?.response?.data?.error||error?.message||"A művelet nem sikerült.";

async function getCatalog(force=false):Promise<Catalog>{
 if(!force&&catalogCache&&catalogCache.expiresAt>Date.now())return catalogCache.value;
 if(!force&&catalogInFlight)return catalogInFlight;
 const request=api.get("/transactions/masterdata/catalog").then(r=>{
  const next=(r.data||{entities:[],counts:{}}) as Catalog;
  catalogCache={value:next,expiresAt:Date.now()+CATALOG_TTL_MS};
  try{sessionStorage.setItem(CATALOG_SESSION_KEY,JSON.stringify(catalogCache))}catch{}
  return next;
 }).finally(()=>{if(catalogInFlight===request)catalogInFlight=null});
 catalogInFlight=request;
 return request;
}

async function getRows(entityKey:string,query:string,includeInactive:boolean,force=false):Promise<Row[]>{
 const key=`${entityKey}|${includeInactive?1:0}|${query.trim().toLowerCase()}`;
 const cached=rowCache.get(key);
 if(!force&&cached&&cached.expiresAt>Date.now())return cached.value;
 const running=rowInFlight.get(key);
 if(!force&&running)return running;
 const request=api.get(`/transactions/masterdata/${encodeURIComponent(entityKey)}`,{params:{q:query||undefined,include_inactive:includeInactive?1:undefined}}).then(r=>{
  const rows=Array.isArray(r.data)?r.data:[];
  rowCache.set(key,{value:rows,expiresAt:Date.now()+ROW_TTL_MS});
  return rows;
 }).finally(()=>{if(rowInFlight.get(key)===request)rowInFlight.delete(key)});
 rowInFlight.set(key,request);
 return request;
}

async function getRelation(key:string,force=false):Promise<Row[]>{
 const cached=relationCache.get(key);
 if(!force&&cached&&cached.expiresAt>Date.now())return cached.value;
 const running=relationInFlight.get(key);
 if(!force&&running)return running;
 const request=api.get(`/transactions/masterdata/${encodeURIComponent(key)}`,{params:{include_inactive:1}}).then(r=>{
  const rows=Array.isArray(r.data)?r.data:[];
  relationCache.set(key,{value:rows,expiresAt:Date.now()+RELATION_TTL_MS});
  return rows;
 }).catch(()=>[] as Row[]).finally(()=>{if(relationInFlight.get(key)===request)relationInFlight.delete(key)});
 relationInFlight.set(key,request);
 return request;
}

export default function CentralMasterDataPage({entityKey}:Props){
 const navigate=useNavigate();
 const rowRequestId=useRef(0);
 const[catalog,setCatalog]=useState<Catalog>(()=>catalogCache?.value||{entities:[],counts:{}}),[rows,setRows]=useState<Row[]>([]),[relations,setRelations]=useState<Record<string,Row[]>>({});
 const[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const[query,setQuery]=useState(""),[includeInactive,setIncludeInactive]=useState(false),[editing,setEditing]=useState<Row|null>(null),[showEditor,setShowEditor]=useState(false),[form,setForm]=useState<Record<string,any>>({});
 const current=useMemo(()=>catalog.entities.find(x=>x.key===entityKey)||null,[catalog.entities,entityKey]);
 const fieldMap=useMemo(()=>new Map((current?.fields||[]).map(f=>[f.key,f])),[current]);

 const loadCatalog=useCallback(async(force=false)=>{const next=await getCatalog(force);setCatalog(next);return next},[]);
 const loadRows=useCallback(async(force=false)=>{
  if(!entityKey)return;
  const requestId=++rowRequestId.current;
  const next=await getRows(entityKey,query,includeInactive,force);
  if(requestId!==rowRequestId.current)return;
  setRows(next);
 },[entityKey,query,includeInactive]);
 const loadRelations=useCallback(async(def:EntityDef|null,force=false)=>{
  if(!def)return;
  const keys=Array.from(new Set(def.fields.map(f=>f.relationEntity).filter(Boolean))) as string[];
  if(!keys.length)return;
  const entries=await Promise.all(keys.map(async key=>[key,await getRelation(key,force)] as const));
  setRelations(prev=>({...prev,...Object.fromEntries(entries)}));
 },[]);
 const invalidateEntityRows=useCallback(()=>{if(!entityKey)return;for(const key of Array.from(rowCache.keys()))if(key.startsWith(`${entityKey}|`))rowCache.delete(key)},[entityKey]);
 const refresh=useCallback(async()=>{
  setLoading(true);setError("");
  try{
   relationCache.clear();invalidateEntityRows();
   const tasks:Promise<any>[]=[loadCatalog(true)];
   if(entityKey)tasks.push(loadRows(true));
   await Promise.all(tasks);
   if(current)await loadRelations(current,true);
  }catch(e){setError(err(e))}finally{setLoading(false)}
 },[loadCatalog,loadRows,loadRelations,invalidateEntityRows,entityKey,current]);

 useEffect(()=>{
  let active=true;
  setLoading(true);setError("");
  void loadCatalog(false).catch(e=>{if(active)setError(err(e))}).finally(()=>{if(active&&!entityKey)setLoading(false)});
  return()=>{active=false};
 },[loadCatalog,entityKey]);
 useEffect(()=>{if(current)void loadRelations(current)},[current?.key,loadRelations]);
 useEffect(()=>{
  if(!entityKey)return;
  setLoading(true);
  const delay=query?220:0;
  const t=window.setTimeout(()=>{void loadRows(false).catch(e=>setError(err(e))).finally(()=>setLoading(false))},delay);
  return()=>window.clearTimeout(t);
 },[query,includeInactive,entityKey,loadRows]);

 function emptyForm(def:EntityDef){
  const next:Record<string,any>={};
  def.fields.forEach(f=>{if(f.type==="boolean")next[f.key]=f.key===def.activeColumn;else if(f.type==="number"&&f.key==="calendar_slot_minutes")next[f.key]=15;else if(f.type==="number"&&f.key==="pay_percent")next[f.key]=100;else next[f.key]=""});
  return next;
 }
 function openCreate(){if(!current)return;setEditing(null);setForm(emptyForm(current));setShowEditor(true);setError("");setNotice("")}
 function openEdit(row:Row){if(!current)return;const next=emptyForm(current);current.fields.forEach(f=>{const value=row[f.key];next[f.key]=f.type==="date"&&value?String(value).slice(0,10):value??(f.type==="boolean"?false:"")});setEditing(row);setForm(next);setShowEditor(true);setError("");setNotice("")}
 function closeEditor(){setShowEditor(false);setEditing(null)}
 function setValue(key:string,value:any){setForm(prev=>({...prev,[key]:value}))}

 async function save(e:FormEvent){
  e.preventDefault();if(!current)return;setSaving(true);setError("");setNotice("");
  try{
   if(editing)await api.patch(`/transactions/masterdata/${current.key}/${editing.id}`,form);
   else await api.post(`/transactions/masterdata/${current.key}`,form);
   invalidateEntityRows();
   setNotice(editing?"A törzsadat módosítása elmentve.":"Az új törzsadat létrejött.");closeEditor();await Promise.all([loadRows(true),loadCatalog(true)]);
  }catch(x){setError(err(x))}finally{setSaving(false)}
 }
 async function deactivate(row:Row){
  if(!current)return;
  if(!window.confirm(`Biztosan inaktiválod ezt a(z) ${current.singular} rekordot?`))return;
  setSaving(true);setError("");
  try{await api.delete(`/transactions/masterdata/${current.key}/${row.id}`);invalidateEntityRows();setNotice("A törzsadat inaktiválva.");await Promise.all([loadRows(true),loadCatalog(true)])}catch(x){setError(err(x))}finally{setSaving(false)}
 }
 async function exportCsv(){
  if(!current)return;
  try{
   const r=await api.get(`/transactions/masterdata/${current.key}/export.csv`,{responseType:"blob"});
   const url=URL.createObjectURL(r.data);const a=document.createElement("a");a.href=url;a.download=`${current.key}.csv`;document.body.appendChild(a);a.click();a.remove();URL.revokeObjectURL(url);
  }catch(x){setError(err(x))}
 }
 function relationValue(field:Field,value:any){
  const list=relations[field.relationEntity||""]||[];
  const key=field.relationValueKey||"id";
  const hit=list.find(x=>String(x[key])===String(value));
  return hit?relationLabel(hit):format(value,field);
 }
 function cell(row:Row,key:string){const field=fieldMap.get(key);if(field?.type==="relation")return relationValue(field,row[key]);return format(row[key],field)}

 if(!entityKey){
  return <main className="cmd-page"><header className="cmd-head"><div><small>TÖRZSADATOK</small><h1><Database/>Központi Törzsadatok</h1><p>A VIR közös alapadatai egy helyen: szalonok, részlegek, eszközök, beszállítók, raktárak, mértékegységek és pénzügyi törzsek.</p></div><button className="cmd-ghost" onClick={()=>void refresh()}><RefreshCw className={loading?"spin":""}/>Frissítés</button></header>{error&&<div className="cmd-alert error">{error}</div>}<section className="cmd-summary"><div><b>{catalog.entities.length}</b><span>törzsadattípus</span></div><div><b>{Object.values(catalog.counts).reduce((a,b)=>a+Number(b||0),0)}</b><span>aktív rekord</span></div><div><b>1</b><span>központi kezelőfelület</span></div></section><section className="cmd-catalog">{catalog.entities.map(def=><button key={def.key} onClick={()=>navigate(def.route)}><span className="cmd-icon">{iconMap[def.key]||<Database/>}</span><div><h2>{def.title}</h2><p>{def.description}</p><small>{catalog.counts[def.key]||0} aktív rekord</small></div><ChevronRight/></button>)}</section></main>
 }
 if(!current&&!loading)return <main className="cmd-page"><div className="cmd-alert error">Ez a törzsadattípus nincs konfigurálva.</div><button className="cmd-back" onClick={()=>navigate("/masterdata")}>Vissza a Központi Törzsadatokhoz</button></main>;
 return <main className="cmd-page"><header className="cmd-head"><div><button className="cmd-crumb" onClick={()=>navigate("/masterdata")}>Törzsadatok</button><small>{current?.key.toUpperCase()}</small><h1>{current&&iconMap[current.key]}{current?.title||"Betöltés…"}</h1><p>{current?.description}</p></div><div className="cmd-actions"><button className="cmd-ghost" onClick={()=>void refresh()}><RefreshCw className={loading?"spin":""}/>Frissítés</button><button className="cmd-ghost" onClick={()=>void exportCsv()}><Download/>Export CSV</button><button className="cmd-primary" onClick={openCreate}><Plus/>Új {current?.singular}</button></div></header>
 {current?.key==="equipment"&&<div className="cmd-related"><button onClick={()=>navigate("/masterdata/equipment-types")}><Settings2/>Eszköztípusok kezelése</button></div>}
 {current?.key==="equipment-types"&&<div className="cmd-related"><button onClick={()=>navigate("/masterdata/assets")}><Wrench/>Eszközök kezelése</button></div>}
 {error&&<div className="cmd-alert error">{error}</div>}{notice&&<div className="cmd-alert ok">{notice}</div>}
 <section className="cmd-toolbar"><div className="cmd-search"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Keresés a törzsben…"/></div><label className="cmd-check"><input type="checkbox" checked={includeInactive} onChange={e=>setIncludeInactive(e.target.checked)}/>Inaktív rekordok megjelenítése</label><span>{rows.length} találat</span></section>
 <section className="cmd-table-card"><div className="cmd-table-wrap"><table><thead><tr>{current?.listFields.map(key=><th key={key}>{fieldMap.get(key)?.label||key}</th>)}<th>Műveletek</th></tr></thead><tbody>{rows.map(row=><tr key={String(row.id)} className={!isTrue(row[current?.activeColumn||"active"])?"inactive":""}>{current?.listFields.map(key=><td key={key}>{key==="system"?<span className={row.system?"cmd-pill system":"cmd-pill"}>{row.system?"Rendszer":"Egyedi"}</span>:fieldMap.get(key)?.type==="boolean"?<span className={isTrue(row[key])?"cmd-pill yes":"cmd-pill no"}>{isTrue(row[key])?"Igen":"Nem"}</span>:cell(row,key)}</td>)}<td><div className="cmd-row-actions"><button title="Módosítás" disabled={Boolean(row.system&&current?.lockSystemEdit)} onClick={()=>openEdit(row)}><Edit3/></button><button title="Inaktiválás" disabled={Boolean(row.system)||!isTrue(row[current?.activeColumn||"active"])} onClick={()=>void deactivate(row)}><Archive/></button></div></td></tr>)}{!rows.length&&!loading&&<tr><td className="cmd-empty" colSpan={(current?.listFields.length||0)+1}>Nincs megjeleníthető törzsadat.</td></tr>}</tbody></table></div></section>
 {showEditor&&current&&<div className="cmd-modal-backdrop" onMouseDown={e=>{if(e.currentTarget===e.target)closeEditor()}}><form className="cmd-modal" onSubmit={save}><header><div><small>{editing?"MÓDOSÍTÁS":"ÚJ REKORD"}</small><h2>{editing?`${current.singular} módosítása`:`Új ${current.singular}`}</h2></div><button type="button" onClick={closeEditor}><X/></button></header><div className="cmd-form-grid">{current.fields.map(field=><EditorField key={field.key} field={field} value={form[field.key]} setValue={setValue} relationRows={relations[field.relationEntity||""]||[]} editingId={editing?.id}/>)}</div><footer><button type="button" className="cmd-ghost" onClick={closeEditor}>Mégse</button><button className="cmd-primary" disabled={saving}>{saving?"Mentés…":"Mentés"}</button></footer></form></div>}
 </main>
}

function EditorField({field,value,setValue,relationRows,editingId}:{field:Field;value:any;setValue:(key:string,value:any)=>void;relationRows:Row[];editingId?:string|number}){
 if(field.type==="boolean")return <label className="cmd-switch"><input type="checkbox" checked={isTrue(value)} onChange={e=>setValue(field.key,e.target.checked)}/><span>{field.label}</span></label>;
 if(field.type==="select")return <label><span>{field.label}{field.required&&<b>*</b>}</span><select required={field.required} value={value??""} onChange={e=>setValue(field.key,e.target.value)}><option value="">Válasszon…</option>{field.options?.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select></label>;
 if(field.type==="relation"){
  const valueKey=field.relationValueKey||"id";
  return <label><span>{field.label}{field.required&&<b>*</b>}</span><select required={field.required} value={value??""} onChange={e=>setValue(field.key,e.target.value)}><option value="">Nincs hozzárendelve</option>{relationRows.filter(row=>!(field.relationEntity==="payment-methods"&&editingId!=null&&String(row.id)===String(editingId))).map(row=><option key={String(row.id)} value={String(row[valueKey])}>{relationLabel(row)}{row.active===false?" (inaktív)":""}</option>)}</select></label>
 }
 const htmlType=field.type==="number"?"number":field.type==="date"?"date":field.type==="email"?"email":field.type==="url"?"url":"text";
 return <label><span>{field.label}{field.required&&<b>*</b>}</span><input type={htmlType} required={field.required} step={field.type==="number"?"any":undefined} value={value??""} placeholder={field.placeholder} onChange={e=>setValue(field.key,e.target.value)}/></label>
}