import React,{useEffect,useMemo,useState}from'react';
import{CloudDownload,FileSpreadsheet,FileUp,RefreshCw,ShieldCheck}from'lucide-react';
import{Link}from'react-router-dom';
import api from'../api';

type Location={id:string;name:string;city?:string|null;is_default?:boolean};
type Entity={id:string;legal_name:string;short_name?:string|null;tax_number:string;locations?:Location[]};

const today=()=>new Date().toISOString().slice(0,10);
const card:React.CSSProperties={background:'#fff',border:'1px solid #e2e8f0',borderRadius:16,padding:18,boxShadow:'0 8px 24px rgba(15,23,42,.04)'};
const input:React.CSSProperties={width:'100%',boxSizing:'border-box',minHeight:40,border:'1px solid #cbd5e1',borderRadius:9,padding:'8px 10px',background:'#fff'};
const label:React.CSSProperties={display:'grid',gap:5,fontSize:12,fontWeight:800,color:'#334155'};
const btn:React.CSSProperties={border:0,borderRadius:9,padding:'9px 13px',fontWeight:850,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:6};
const grid:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:11};
const err=(e:any,f='A művelet nem sikerült.')=>e?.response?.data?.message||e?.response?.data?.error||e?.message||f;

export default function AltegioDataIntakePage(){
 const[entities,setEntities]=useState<Entity[]>([]);
 const[entityId,setEntityId]=useState('');
 const[locationId,setLocationId]=useState('');
 const[altegioLocationId,setAltegioLocationId]=useState('');
 const[from,setFrom]=useState(new Date(Date.now()-31*86400000).toISOString().slice(0,10));
 const[to,setTo]=useState(today());
 const[file,setFile]=useState<File|null>(null);
 const[status,setStatus]=useState<any>(null);
 const[busy,setBusy]=useState(false);
 const[error,setError]=useState('');
 const[notice,setNotice]=useState('');

 const selected=useMemo(()=>entities.find(e=>e.id===entityId)||null,[entities,entityId]);
 const locations=selected?.locations||[];

 async function load(){
  setError('');
  try{
   const[e,s]=await Promise.all([
    api.get('/vir/receipt-compliance/legal-entities',{params:{include_inactive:1}}),
    api.get('/vir/receipt-compliance/external-documents/status'),
   ]);
   const rows=Array.isArray(e.data?.rows)?e.data.rows:[];
   setEntities(rows);
   setStatus(s.data);
   const next=entityId||String(rows[0]?.id||'');
   setEntityId(next);
   if(next){
    const set=await api.get('/vir/receipt-compliance/external-documents/settings',{params:{legal_entity_id:next,location_id:locationId||undefined}});
    setAltegioLocationId(String(set.data?.settings?.altegio_location_id||''));
   }
  }catch(e){setError(err(e,'Az Altegio adatátvételi oldal nem tölthető be.'))}
 }
 useEffect(()=>{void load()},[]);// eslint-disable-line react-hooks/exhaustive-deps
 useEffect(()=>{
  if(!entityId)return;
  const locs=entities.find(e=>e.id===entityId)?.locations||[];
  const def=locs.find(x=>x.is_default)?.id||locs[0]?.id||'';
  setLocationId(cur=>locs.some(x=>x.id===cur)?cur:def);
 },[entityId,entities]);
 useEffect(()=>{
  if(!entityId)return;
  void api.get('/vir/receipt-compliance/external-documents/settings',{params:{legal_entity_id:entityId,location_id:locationId||undefined}})
   .then(r=>setAltegioLocationId(String(r.data?.settings?.altegio_location_id||'')))
   .catch(()=>undefined);
 },[entityId,locationId]);

 async function saveLocationId(){
  if(!entityId)return;
  setBusy(true);setError('');setNotice('');
  try{
   const current=await api.get('/vir/receipt-compliance/external-documents/settings',{params:{legal_entity_id:entityId,location_id:locationId||undefined}});
   const settings=current.data?.settings||{};
   await api.put('/vir/receipt-compliance/external-documents/settings',{
    ...settings,
    legal_entity_id:entityId,
    location_id:locationId||null,
    altegio_location_id:altegioLocationId||null,
   });
   setNotice('Az Altegio location ID mentve.');
  }catch(e){setError(err(e,'Az Altegio location ID nem menthető.'))}
  finally{setBusy(false)}
 }

 async function syncAltegio(){
  if(!altegioLocationId.trim()){setError('Az élő szinkronhoz Altegio location ID szükséges.');return}
  setBusy(true);setError('');setNotice('');
  try{
   const r=await api.post('/vir/receipt-compliance/external-documents/altegio/sync',{
    legal_entity_id:entityId,
    location_id:locationId||null,
    altegio_location_id:altegioLocationId.trim(),
    from,to,
   });
   setNotice(`Altegio élő szinkron kész: ${r.data?.transactions||0} tranzakció, ${r.data?.imported||0} új, ${r.data?.duplicates||0} duplikált.`);
  }catch(e){setError(err(e,'Az Altegio élő szinkron sikertelen.'))}
  finally{setBusy(false)}
 }

 async function importExport(){
  if(!file){setError('Válassza ki az Altegio-ból exportált CSV/XLS/XLSX fájlt.');return}
  setBusy(true);setError('');setNotice('');
  try{
   const data=new FormData();
   data.append('file',file);
   data.append('legal_entity_id',entityId);
   if(locationId)data.append('location_id',locationId);
   const r=await api.post('/vir/receipt-compliance/external-documents/altegio/import',data);
   setFile(null);
   setNotice(r.data?.duplicate_batch
    ?'Ez az Altegio exportfájl már korábban be lett olvasva; új tétel nem készült.'
    :`Altegio export import kész: ${r.data?.rows||0} sorból ${r.data?.imported||0} új, ${r.data?.duplicates||0} duplikált.`);
  }catch(e){setError(err(e,'Az Altegio exportfájl nem importálható.'))}
  finally{setBusy(false)}
 }

 const apiConfigured=!!status?.providers?.altegio?.configured;
 return <main style={{maxWidth:1280,margin:'0 auto',padding:'26px 28px 70px',background:'#f8fafc',minHeight:'100vh'}}>
  <header style={{display:'flex',justifyContent:'space-between',gap:14,alignItems:'flex-start',flexWrap:'wrap',marginBottom:16}}>
   <div>
    <small style={{fontWeight:900,color:'#0f766e',letterSpacing:'.08em'}}>PÉNZÜGY · ALTEGIO</small>
    <h1 style={{margin:'5px 0'}}>Altegio adatátvétel</h1>
    <p style={{margin:0,color:'#64748b',maxWidth:900}}>Két egymás melletti lehetőség: <b>opcionális élő Altegio API-szinkron</b>, vagy <b>Altegio exportfájl import</b>. Az export-import API hitelesítés nélkül is használható.</p>
   </div>
   <button onClick={()=>void load()} disabled={busy} style={{...btn,background:'#fff',border:'1px solid #cbd5e1',color:'#334155'}}><RefreshCw size={16}/>Frissítés</button>
  </header>

  {error&&<div style={{...card,background:'#fff1f2',borderColor:'#fecaca',color:'#b91c1c',marginBottom:12,fontWeight:750}}>{error}</div>}
  {notice&&<div style={{...card,background:'#f0fdf4',borderColor:'#bbf7d0',color:'#166534',marginBottom:12,fontWeight:750}}>{notice}</div>}

  <section style={{...card,marginBottom:14}}>
   <div style={grid}>
    <label style={label}>Könyvelési cég<select style={input} value={entityId} onChange={e=>setEntityId(e.target.value)}>{entities.map(e=><option key={e.id} value={e.id}>{e.short_name||e.legal_name} · {e.tax_number}</option>)}</select></label>
    <label style={label}>Szalon / telephely<select style={input} value={locationId} onChange={e=>setLocationId(e.target.value)}><option value="">Cégszintű</option>{locations.map(l=><option key={l.id} value={l.id}>{l.name}{l.city?` · ${l.city}`:''}</option>)}</select></label>
   </div>
  </section>

  <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(390px,1fr))',gap:14,marginBottom:14}}>
   <div style={{...card,borderColor:apiConfigured?'#99f6e4':'#fcd34d'}}>
    <div style={{display:'flex',gap:9,alignItems:'center'}}><CloudDownload size={22}/><h2 style={{margin:0}}>1. Élő Altegio szinkron</h2></div>
    <p style={{color:'#64748b'}}>Opcionális. A VIR az Altegio pénzügyi tranzakcióit a megadott időszakra közvetlenül átveszi, majd ellenőrzési munkasorba teszi.</p>
    <div style={{padding:10,borderRadius:10,background:apiConfigured?'#f0fdfa':'#fffbeb',fontWeight:800,color:apiConfigured?'#115e59':'#92400e',marginBottom:11}}>{apiConfigured?'Altegio API hitelesítés elérhető.':'Altegio API tokenek nincsenek konfigurálva; az exportfájl-import ettől még használható.'}</div>
    <div style={grid}>
     <label style={label}>Altegio location ID<input style={input} value={altegioLocationId} onChange={e=>setAltegioLocationId(e.target.value)}/></label>
     <label style={label}>Ettől<input style={input} type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label>
     <label style={label}>Eddig<input style={input} type="date" value={to} onChange={e=>setTo(e.target.value)}/></label>
    </div>
    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:11}}>
     <button onClick={()=>void saveLocationId()} disabled={busy||!entityId} style={{...btn,background:'#334155',color:'#fff'}}>Location ID mentése</button>
     <button onClick={()=>void syncAltegio()} disabled={busy||!entityId||!apiConfigured} style={{...btn,background:'#0f766e',color:'#fff'}}><CloudDownload size={16}/>Élő szinkron indítása</button>
    </div>
   </div>

   <div style={{...card,borderColor:'#c4b5fd'}}>
    <div style={{display:'flex',gap:9,alignItems:'center'}}><FileSpreadsheet size={22}/><h2 style={{margin:0}}>2. Altegio export import</h2></div>
    <p style={{color:'#64748b'}}>Az Altegio-ból exportált <b>CSV, XLS vagy XLSX</b> fájl tölthető fel. A VIR felismeri a sorokat, archiválja az eredeti exportot, és ugyanazt a fájlt nem engedi kétszer feldolgozni.</p>
    <input style={input} type="file" accept=".csv,.xls,.xlsx" onChange={e=>setFile(e.target.files?.[0]||null)}/>
    <button onClick={()=>void importExport()} disabled={busy||!file||!entityId} style={{...btn,marginTop:11,background:'#6d28d9',color:'#fff'}}><FileUp size={16}/>Exportfájl importálása</button>
    <div style={{marginTop:12,padding:10,borderRadius:10,background:'#f8fafc',fontSize:12,color:'#475569'}}><ShieldCheck size={15}/> Az importált Altegio tételek külső bizonylatként kerülnek be, ezért a VIR saját NAV nyugtakötegébe alapértelmezetten nem kerülnek be.</div>
   </div>
  </section>

  <section style={{...card,display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'}}>
   <div><b>Import és szinkron után</b><small style={{display:'block',color:'#64748b'}}>A tételek ugyanabba a külső bizonylat ellenőrzési munkasorba kerülnek.</small></div>
   <Link to="/finance/document-intake" style={{...btn,background:'#166534',color:'#fff',textDecoration:'none'}}>Ellenőrzési munkasor megnyitása</Link>
  </section>
 </main>;
}
