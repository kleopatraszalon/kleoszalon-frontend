import React,{useEffect,useMemo,useState}from'react';
import{CheckCircle2,CloudDownload,ExternalLink,FileCheck2,FileSpreadsheet,FileUp,RefreshCw,Save,ShieldCheck,XCircle}from'lucide-react';
import{useSearchParams}from'react-router-dom';
import api from'../api';

type Location={id:string;name:string;city?:string|null;is_default?:boolean};
type Entity={id:string;legal_name:string;short_name?:string|null;tax_number:string;active:boolean;locations?:Location[]};
type ProviderSettings={
 legal_entity_id?:string;
 location_id?:string|null;
 receipt_provider:'internal'|'invee_manual'|'nav_epg'|'hardware_epg';
 drive_folder_id?:string|null;
 external_account_ref?:string|null;
 nav_reporting_owner:'vir'|'external'|'not_applicable';
 active:boolean;
};
type ExternalDoc={
 id:string;legal_entity_id:string;location_id?:string|null;legal_name:string;location_name?:string|null;
 source:string;document_type:string;external_document_number?:string|null;issue_date?:string|null;
 counterparty_name?:string|null;counterparty_tax_number?:string|null;currency:string;
 net_amount:number;vat_amount:number;gross_amount:number;payment_method?:string|null;work_order_id?:string|null;
 source_url?:string|null;file_name?:string|null;import_file_name?:string|null;import_profile?:string|null;
 status:string;nav_reporting_owner:string;nav_excluded:boolean;has_file?:boolean;created_at:string;
};
type ManualDraft={document_type:string;external_document_number:string;issue_date:string;counterparty_name:string;counterparty_tax_number:string;currency:string;net_amount:string;vat_amount:string;gross_amount:string;payment_method:string;source_url:string};

const today=()=>new Date().toISOString().slice(0,10);
const emptyManual=():ManualDraft=>({document_type:'receipt',external_document_number:'',issue_date:today(),counterparty_name:'',counterparty_tax_number:'',currency:'HUF',net_amount:'',vat_amount:'',gross_amount:'',payment_method:'',source_url:''});
const money=(v:unknown,c='HUF')=>c==='HUF'?`${new Intl.NumberFormat('hu-HU',{maximumFractionDigits:0}).format(Number(v||0))} Ft`:new Intl.NumberFormat('hu-HU',{style:'currency',currency:c}).format(Number(v||0));
const errorText=(e:any,f='A művelet nem sikerült.')=>e?.response?.data?.message||e?.response?.data?.error||e?.message||f;
const card:React.CSSProperties={background:'#fff',border:'1px solid #e2e8f0',borderRadius:16,padding:18,boxShadow:'0 8px 24px rgba(15,23,42,.04)'};
const input:React.CSSProperties={width:'100%',boxSizing:'border-box',minHeight:40,border:'1px solid #cbd5e1',borderRadius:9,padding:'8px 10px',background:'#fff'};
const label:React.CSSProperties={display:'grid',gap:5,fontSize:12,fontWeight:800,color:'#334155'};
const btn:React.CSSProperties={border:0,borderRadius:9,padding:'9px 13px',fontWeight:850,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:6};
const grid:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:11};
const td:React.CSSProperties={padding:'9px 8px',borderBottom:'1px solid #e2e8f0',verticalAlign:'top'};
const iso=(v:unknown)=>v?String(v).slice(0,10):'';

export default function ExternalDocumentIntakePage(){
 const[params]=useSearchParams();
 const[entities,setEntities]=useState<Entity[]>([]);
 const[entityId,setEntityId]=useState(params.get('legal_entity_id')||'');
 const[locationId,setLocationId]=useState('');
 const[settings,setSettings]=useState<ProviderSettings>({receipt_provider:'invee_manual',nav_reporting_owner:'external',active:true});
 const[providerStatus,setProviderStatus]=useState<any>(null);
 const[documents,setDocuments]=useState<ExternalDoc[]>([]);
 const[statusFilter,setStatusFilter]=useState('');
 const[sourceFilter,setSourceFilter]=useState('');
 const[manual,setManual]=useState<ManualDraft>(emptyManual());
 const[genericFile,setGenericFile]=useState<File|null>(null);
 const[genericSource,setGenericSource]=useState('file_upload');
 const[altegioFile,setAltegioFile]=useState<File|null>(null);
 const[editing,setEditing]=useState<ExternalDoc|null>(null);
 const[busy,setBusy]=useState(false);
 const[error,setError]=useState('');
 const[notice,setNotice]=useState('');

 const selected=useMemo(()=>entities.find(x=>x.id===entityId)||null,[entities,entityId]);
 const locations=selected?.locations||[];
 const pending=documents.filter(d=>d.status==='pending_review').length;
 const excluded=documents.filter(d=>d.nav_excluded).length;

 async function initial(){
  setError('');
  try{
   const[e,s]=await Promise.all([
    api.get('/vir/receipt-compliance/legal-entities',{params:{include_inactive:1}}),
    api.get('/vir/receipt-compliance/external-documents/status'),
   ]);
   const rows=Array.isArray(e.data?.rows)?e.data.rows:[];
   setEntities(rows);
   setProviderStatus(s.data);
   setEntityId(cur=>cur||String(rows[0]?.id||''));
  }catch(e){setError(errorText(e,'A bizonylat-beérkeztetés nem tölthető be.'))}
 }
 useEffect(()=>{void initial()},[]);

 async function loadContext(nextEntity=entityId,nextLocation=locationId){
  if(!nextEntity)return;
  setError('');
  try{
   const[s,d]=await Promise.all([
    api.get('/vir/receipt-compliance/external-documents/settings',{params:{legal_entity_id:nextEntity,location_id:nextLocation||undefined}}),
    api.get('/vir/receipt-compliance/external-documents/documents',{params:{legal_entity_id:nextEntity,location_id:nextLocation||undefined,status:statusFilter||undefined,source:sourceFilter||undefined}}),
   ]);
   setSettings(s.data?.settings?{
    ...s.data.settings,
    legal_entity_id:nextEntity,
    location_id:nextLocation||null,
   }:{legal_entity_id:nextEntity,location_id:nextLocation||null,receipt_provider:'invee_manual',nav_reporting_owner:'external',active:true});
   setDocuments(d.data?.rows||[]);
  }catch(e){setError(errorText(e,'A cég bizonylatai nem tölthetők be.'))}
 }

 useEffect(()=>{
  if(!entityId)return;
  const locs=entities.find(x=>x.id===entityId)?.locations||[];
  const def=locs.find(x=>x.is_default)?.id||locs[0]?.id||'';
  setLocationId(cur=>locs.some(x=>x.id===cur)?cur:def);
 },[entityId,entities]);
 useEffect(()=>{if(entityId)void loadContext()},[entityId,locationId,statusFilter,sourceFilter]);// eslint-disable-line react-hooks/exhaustive-deps

 function run(fn:()=>Promise<void>){setBusy(true);setError('');setNotice('');return fn().finally(()=>setBusy(false))}
 function patchSetting<K extends keyof ProviderSettings>(key:K,value:ProviderSettings[K]){setSettings(s=>({...s,[key]:value}))}

 async function saveSettings(){
  await run(async()=>{
   try{
    const payload={...settings,legal_entity_id:entityId,location_id:locationId||null};
    const r=await api.put('/vir/receipt-compliance/external-documents/settings',payload);
    setSettings(r.data.settings);
    setNotice('A cég bizonylatforrás-beállításai mentve.');
   }catch(e){setError(errorText(e))}
  });
 }

 async function createInvee(){
  if(!manual.external_document_number.trim()){setError('Az Invee bizonylatszám kötelező.');return}
  await run(async()=>{
   try{
    await api.post('/vir/receipt-compliance/external-documents/documents',{
     ...manual,legal_entity_id:entityId,location_id:locationId||null,source:'invee',
     net_amount:Number(manual.net_amount||0),vat_amount:Number(manual.vat_amount||0),gross_amount:Number(manual.gross_amount||0),
    });
    setManual(emptyManual());
    setNotice('Az Invee bizonylat ellenőrzésre váró külső bizonylatként bekerült. A VIR nem jelenti újra NAV-nak.');
    await loadContext();
   }catch(e){setError(errorText(e))}
  });
 }

 async function uploadGeneric(){
  if(!genericFile){setError('Válasszon feltöltendő fájlt.');return}
  await run(async()=>{
   try{
    const f=new FormData();
    f.append('file',genericFile);
    f.append('legal_entity_id',entityId);
    if(locationId)f.append('location_id',locationId);
    f.append('source',genericSource);
    const r=await api.post('/vir/receipt-compliance/external-documents/upload',f);
    setGenericFile(null);
    setNotice(`Import kész: ${r.data?.imported||0} új, ${r.data?.duplicates||0} duplikált sor.`);
    await loadContext();
   }catch(e){setError(errorText(e))}
  });
 }

 async function importAltegioExport(){
  if(!altegioFile){setError('Válassza ki az Altegio-ból exportált CSV/XLS/XLSX fájlt.');return}
  await run(async()=>{
   try{
    const f=new FormData();
    f.append('file',altegioFile);
    f.append('legal_entity_id',entityId);
    if(locationId)f.append('location_id',locationId);
    const r=await api.post('/vir/receipt-compliance/external-documents/altegio/import',f);
    setAltegioFile(null);
    if(r.data?.duplicate_batch){
     setNotice('Ez az Altegio exportfájl már korábban be lett olvasva; új duplikált könyvelési tételek nem készültek.');
    }else{
     setNotice(`Altegio export beolvasva: ${r.data?.rows||0} sorból ${r.data?.imported||0} új, ${r.data?.duplicates||0} duplikált.`);
    }
    await loadContext();
   }catch(e){setError(errorText(e,'Az Altegio exportfájl nem importálható.'))}
  });
 }

 async function syncDrive(){
  await run(async()=>{
   try{
    const r=await api.post('/vir/receipt-compliance/external-documents/google-drive/sync',{legal_entity_id:entityId,location_id:locationId||null});
    setNotice(`Google Drive szinkron: ${r.data?.imported||0} új, ${r.data?.duplicates||0} duplikált, ${r.data?.skipped||0} kihagyott.`);
    await loadContext();
   }catch(e){setError(errorText(e,'A Google Drive szinkron sikertelen.'))}
  });
 }

 async function approve(id:string){
  await run(async()=>{
   try{await api.post(`/vir/receipt-compliance/external-documents/documents/${encodeURIComponent(id)}/approve`);setNotice('Bizonylat jóváhagyva.');setEditing(null);await loadContext()}
   catch(e){setError(errorText(e))}
  });
 }
 async function reject(id:string){
  const reason=window.prompt('Elutasítás oka:','Hiányos vagy hibás bizonylat')||'';
  if(!reason)return;
  await run(async()=>{
   try{await api.post(`/vir/receipt-compliance/external-documents/documents/${encodeURIComponent(id)}/reject`,{reason});setNotice('Bizonylat elutasítva.');setEditing(null);await loadContext()}
   catch(e){setError(errorText(e))}
  });
 }
 async function saveEdit(){
  if(!editing)return;
  await run(async()=>{
   try{const r=await api.patch(`/vir/receipt-compliance/external-documents/documents/${encodeURIComponent(editing.id)}`,editing);setEditing(r.data.document);setNotice('A bizonylat adatai mentve.');await loadContext()}
   catch(e){setError(errorText(e))}
  });
 }
 async function openFile(d:ExternalDoc){
  try{
   const r=await api.get(`/vir/receipt-compliance/external-documents/documents/${encodeURIComponent(d.id)}/file`,{responseType:'blob'});
   const url=URL.createObjectURL(r.data);
   window.open(url,'_blank','noopener,noreferrer');
   window.setTimeout(()=>URL.revokeObjectURL(url),60000);
  }catch(e){setError(errorText(e,'A forrásfájl nem nyitható meg.'))}
 }

 return <main style={{maxWidth:1580,margin:'0 auto',padding:'26px 28px 70px',background:'#f8fafc',minHeight:'100vh'}}>
  <header style={{display:'flex',justifyContent:'space-between',gap:14,alignItems:'flex-start',flexWrap:'wrap',marginBottom:16}}>
   <div>
    <small style={{fontWeight:900,color:'#6d28d9',letterSpacing:'.08em'}}>PÉNZÜGY · KÜLSŐ BIZONYLATOK · TÖBBCÉGES VIR</small>
    <h1 style={{margin:'5px 0'}}>Bizonylat-beérkeztetés</h1>
    <p style={{margin:0,color:'#64748b',maxWidth:1000}}>Invee, Google Drive és <b>Altegio exportfájlok</b> egy ellenőrzési sorban. A VIR nem kapcsolódik az Altegio API-hoz: az Altegio-ból exportált CSV/XLS/XLSX fájl kerül beolvasásra.</p>
   </div>
   <button onClick={()=>void loadContext()} disabled={busy||!entityId} style={{...btn,background:'#fff',border:'1px solid #cbd5e1',color:'#334155'}}><RefreshCw size={16}/>Frissítés</button>
  </header>

  {error&&<div style={{...card,background:'#fff1f2',borderColor:'#fecaca',color:'#b91c1c',marginBottom:12,fontWeight:750}}>{error}</div>}
  {notice&&<div style={{...card,background:'#f0fdf4',borderColor:'#bbf7d0',color:'#166534',marginBottom:12,fontWeight:750,display:'flex',gap:8}}><CheckCircle2 size={18}/>{notice}</div>}

  <section style={{...card,marginBottom:14}}>
   <div style={grid}>
    <label style={label}>Kibocsátó / könyvelési cég<select style={input} value={entityId} onChange={e=>setEntityId(e.target.value)}>{entities.map(e=><option key={e.id} value={e.id}>{e.short_name||e.legal_name} · {e.tax_number}</option>)}</select></label>
    <label style={label}>Szalon / telephely<select style={input} value={locationId} onChange={e=>setLocationId(e.target.value)}><option value="">Cégszintű / nincs telephely</option>{locations.map(l=><option key={l.id} value={l.id}>{l.name}{l.city?` · ${l.city}`:''}</option>)}</select></label>
    <div style={{display:'grid',alignContent:'end'}}><div style={{padding:'9px 12px',borderRadius:10,background:'#f0fdf4',color:'#166534',fontWeight:850,display:'flex',gap:7,alignItems:'center'}}><ShieldCheck size={16}/> Külső NAV-védelem aktív</div></div>
   </div>
  </section>

  <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:14,marginBottom:14}}>
   <div style={card}>
    <h2 style={{marginTop:0}}>Céghez tartozó bizonylatforrás</h2>
    <div style={grid}>
     <label style={label}>Nyugtaszolgáltató<select style={input} value={settings.receipt_provider||'invee_manual'} onChange={e=>{const v=e.target.value as ProviderSettings['receipt_provider'];setSettings(s=>({...s,receipt_provider:v,nav_reporting_owner:v==='internal'?'vir':'external'}))}}><option value="internal">Saját VIR nyugta</option><option value="invee_manual">Invee · külső/kézi visszarögzítés</option><option value="nav_epg">NAV e-pénztárgép</option><option value="hardware_epg">Hardveralapú e-pénztárgép</option></select></label>
     <label style={label}>NAV adatszolgáltatás gazdája<select style={input} value={settings.nav_reporting_owner||'external'} onChange={e=>patchSetting('nav_reporting_owner',e.target.value as ProviderSettings['nav_reporting_owner'])}><option value="external">Külső szolgáltató · VIR nem küldi újra</option><option value="vir">VIR</option><option value="not_applicable">Nem alkalmazandó</option></select></label>
     <Field name="Google Drive mappa ID" value={settings.drive_folder_id||''} onChange={v=>patchSetting('drive_folder_id',v)}/>
     <Field name="Külső fiók / cég referencia" value={settings.external_account_ref||''} onChange={v=>patchSetting('external_account_ref',v)}/>
    </div>
    <button onClick={()=>void saveSettings()} disabled={busy||!entityId} style={{...btn,marginTop:12,background:'#166534',color:'#fff'}}><Save size={16}/>Beállítások mentése</button>
   </div>
   <div style={card}>
    <h2 style={{marginTop:0}}>Források állapota</h2>
    <StatusLine ok={!!providerStatus?.providers?.google_drive?.configured} title="Google Drive" detail={providerStatus?.providers?.google_drive?.configured?'Hozzáférés konfigurálva':'A Drive kapcsolat nincs konfigurálva; a kézi feltöltés ettől függetlenül működik.'}/>
    <StatusLine ok title="Altegio" detail="Nincs API-kapcsolat. CSV/XLS/XLSX exportfájl importálása."/>
    <StatusLine ok title="Invee" detail="Külső/kézi visszarögzítés; a VIR saját NAV-küldéséből kizárva."/>
    <div style={{marginTop:12,padding:10,borderRadius:10,background:'#f8fafc',fontSize:12,color:'#475569'}}>{providerStatus?.nav_guard||'A külső dokumentumok külön nyilvántartásban vannak.'}</div>
   </div>
  </section>

  <section style={{...card,marginBottom:14,borderColor:'#c4b5fd',background:'#fafaff'}}>
   <div style={{display:'flex',gap:10,alignItems:'flex-start',flexWrap:'wrap'}}>
    <FileSpreadsheet size={24} style={{color:'#6d28d9',marginTop:2}}/>
    <div style={{flex:'1 1 680px'}}>
     <h2 style={{margin:'0 0 5px'}}>Altegio exportfájl import</h2>
     <p style={{margin:'0 0 12px',color:'#64748b'}}>1. Az Altegio-ban exportálja a szükséges pénzügyi/értékesítési adatokat. 2. Mentse CSV, XLS vagy XLSX formátumba. 3. Válassza ki itt a fájlt. A VIR a sorokat külön ellenőrzési tételekké alakítja, az eredeti exportot audit célból egyben archiválja, és ugyanazt a fájlt nem engedi kétszer importálni.</p>
     <div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}>
      <input style={{...input,maxWidth:560}} type="file" accept=".csv,.xls,.xlsx" onChange={e=>setAltegioFile(e.target.files?.[0]||null)}/>
      <button onClick={()=>void importAltegioExport()} disabled={busy||!altegioFile||!entityId} style={{...btn,background:'#6d28d9',color:'#fff'}}><FileUp size={16}/>Altegio export beolvasása</button>
     </div>
     <small style={{display:'block',marginTop:8,color:'#475569'}}>Nincs Altegio partner token, user token, location ID vagy élő API-hívás.</small>
    </div>
   </div>
  </section>

  <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(340px,1fr))',gap:14,marginBottom:14}}>
   <div style={card}>
    <h2 style={{marginTop:0}}>Invee bizonylat rögzítése</h2>
    <div style={grid}>
     <label style={label}>Típus<select style={input} value={manual.document_type} onChange={e=>setManual(m=>({...m,document_type:e.target.value}))}><option value="receipt">Nyugta</option><option value="void_receipt">Sztornó/érvénytelenítő nyugta</option><option value="invoice">Számla</option><option value="credit_note">Módosító számla</option></select></label>
     <Field name="Invee bizonylatszám*" value={manual.external_document_number} onChange={v=>setManual(m=>({...m,external_document_number:v}))}/>
     <Field name="Kiállítás dátuma" type="date" value={manual.issue_date} onChange={v=>setManual(m=>({...m,issue_date:v}))}/>
     <Field name="Bruttó összeg" type="number" value={manual.gross_amount} onChange={v=>setManual(m=>({...m,gross_amount:v}))}/>
     <Field name="Nettó összeg" type="number" value={manual.net_amount} onChange={v=>setManual(m=>({...m,net_amount:v}))}/>
     <Field name="ÁFA" type="number" value={manual.vat_amount} onChange={v=>setManual(m=>({...m,vat_amount:v}))}/>
     <Field name="Partner / vevő" value={manual.counterparty_name} onChange={v=>setManual(m=>({...m,counterparty_name:v}))}/>
     <Field name="Partner adószáma" value={manual.counterparty_tax_number} onChange={v=>setManual(m=>({...m,counterparty_tax_number:v}))}/>
     <Field name="Fizetési mód" value={manual.payment_method} onChange={v=>setManual(m=>({...m,payment_method:v}))}/>
     <Field name="Invee / forrás link" value={manual.source_url} onChange={v=>setManual(m=>({...m,source_url:v}))}/>
    </div>
    <button onClick={()=>void createInvee()} disabled={busy||!entityId} style={{...btn,marginTop:12,background:'#5b21b6',color:'#fff'}}><FileCheck2 size={16}/>Ellenőrzésre rögzítés</button>
   </div>

   <div style={card}>
    <h2 style={{marginTop:0}}>Egyéb fájl / Google Drive</h2>
    <label style={label}>Fájlos import forrása<select style={input} value={genericSource} onChange={e=>setGenericSource(e.target.value)}><option value="file_upload">Általános CSV/XLSX/XML/PDF</option><option value="invee">Invee export / PDF</option><option value="google_drive">Google Drive-ból letöltött fájl</option></select></label>
    <input style={{...input,marginTop:8}} type="file" accept=".pdf,.xml,.csv,.xlsx,.xls" onChange={e=>setGenericFile(e.target.files?.[0]||null)}/>
    <button onClick={()=>void uploadGeneric()} disabled={busy||!genericFile} style={{...btn,marginTop:8,background:'#334155',color:'#fff'}}><FileUp size={16}/>Fájl beolvasása</button>
    <hr style={{border:0,borderTop:'1px solid #e2e8f0',margin:'16px 0'}}/>
    <button onClick={()=>void syncDrive()} disabled={busy||!entityId} style={{...btn,background:'#1d4ed8',color:'#fff'}}><CloudDownload size={16}/>Google Drive szinkron</button>
   </div>
  </section>

  <section style={card}>
   <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'flex-end',flexWrap:'wrap'}}>
    <div><h2 style={{margin:'0 0 4px'}}>Ellenőrzési munkasor</h2><small style={{color:'#64748b'}}>{documents.length} bizonylat · {pending} ellenőrzésre vár · {excluded} NAV-kizárt</small></div>
    <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
     <select style={{...input,width:170}} value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}><option value="">Minden állapot</option><option value="pending_review">Ellenőrzésre vár</option><option value="approved">Jóváhagyott</option><option value="rejected">Elutasított</option></select>
     <select style={{...input,width:170}} value={sourceFilter} onChange={e=>setSourceFilter(e.target.value)}><option value="">Minden forrás</option><option value="invee">Invee</option><option value="google_drive">Google Drive</option><option value="altegio">Altegio export</option><option value="file_upload">Fájl</option></select>
    </div>
   </div>
   <div style={{overflowX:'auto',marginTop:12}}>
    <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
     <thead><tr>{['Forrás','Bizonylat / tétel','Dátum','Partner','Bruttó','Állapot','NAV','Művelet'].map(h=><th key={h} style={{textAlign:'left',padding:'9px 8px',borderBottom:'1px solid #cbd5e1',color:'#475569'}}>{h}</th>)}</tr></thead>
     <tbody>{documents.map(d=><tr key={d.id}>
      <td style={td}><b>{sourceName(d.source)}</b><small style={{display:'block',color:'#64748b'}}>{d.import_file_name||d.file_name||d.location_name||''}</small></td>
      <td style={td}><button onClick={()=>setEditing({...d})} style={{border:0,background:'transparent',padding:0,color:'#4c1d95',fontWeight:850,cursor:'pointer'}}>{d.external_document_number||'Adatpótlás szükséges'}</button><small style={{display:'block',color:'#64748b'}}>{typeName(d.document_type)}</small></td>
      <td style={td}>{iso(d.issue_date)||'—'}</td>
      <td style={td}>{d.counterparty_name||'—'}</td>
      <td style={td}><b>{money(d.gross_amount,d.currency)}</b></td>
      <td style={td}><StatusBadge status={d.status}/></td>
      <td style={td}><span style={{fontWeight:800,color:d.nav_excluded?'#166534':'#b45309'}}>{d.nav_excluded?'KÜLSŐ · KIZÁRT':'VIR / ELLENŐRIZD'}</span></td>
      <td style={td}><div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
       {d.has_file&&<button onClick={()=>void openFile(d)} style={{...btn,padding:'6px 8px',background:'#e0e7ff',color:'#3730a3'}}><ExternalLink size={13}/>Forrásfájl</button>}
       {d.source_url&&<a href={d.source_url} target="_blank" rel="noreferrer" style={{...btn,padding:'6px 8px',background:'#f1f5f9',color:'#334155',textDecoration:'none'}}><ExternalLink size={13}/>Forrás</a>}
       {d.status==='pending_review'&&<button onClick={()=>void approve(d.id)} style={{...btn,padding:'6px 8px',background:'#dcfce7',color:'#166534'}}><CheckCircle2 size={13}/>Jóváhagy</button>}
      </div></td>
     </tr>)}</tbody>
    </table>
    {!documents.length&&<p style={{color:'#64748b'}}>Nincs a szűrésnek megfelelő külső bizonylat.</p>}
   </div>
  </section>

  {editing&&<div style={{position:'fixed',inset:0,background:'rgba(15,23,42,.45)',display:'grid',placeItems:'center',padding:20,zIndex:1000}} onMouseDown={e=>{if(e.target===e.currentTarget)setEditing(null)}}>
   <div style={{...card,width:'min(920px,96vw)',maxHeight:'90vh',overflow:'auto'}}>
    <div style={{display:'flex',justifyContent:'space-between',gap:12}}>
     <div><h2 style={{margin:0}}>Bizonylat ellenőrzése</h2><small>{sourceName(editing.source)} · {editing.legal_name}</small></div>
     <button onClick={()=>setEditing(null)} style={{...btn,background:'#f1f5f9'}}><XCircle size={16}/>Bezár</button>
    </div>
    <div style={{...grid,marginTop:14}}>
     <label style={label}>Típus<select style={input} value={editing.document_type} onChange={e=>setEditing(d=>d&&({...d,document_type:e.target.value}))}><option value="invoice">Számla</option><option value="receipt">Nyugta</option><option value="credit_note">Módosító számla</option><option value="void_receipt">Sztornó nyugta</option><option value="transaction">Altegio / pénzügyi tranzakció</option><option value="other">Egyéb</option></select></label>
     <EditField name="Bizonylatszám / azonosító*" value={editing.external_document_number||''} onChange={v=>setEditing(d=>d&&({...d,external_document_number:v}))}/>
     <EditField name="Dátum*" type="date" value={iso(editing.issue_date)} onChange={v=>setEditing(d=>d&&({...d,issue_date:v}))}/>
     <EditField name="Partner" value={editing.counterparty_name||''} onChange={v=>setEditing(d=>d&&({...d,counterparty_name:v}))}/>
     <EditField name="Partner adószáma" value={editing.counterparty_tax_number||''} onChange={v=>setEditing(d=>d&&({...d,counterparty_tax_number:v}))}/>
     <EditField name="Pénznem" value={editing.currency} onChange={v=>setEditing(d=>d&&({...d,currency:v.toUpperCase()}))}/>
     <EditField name="Nettó" type="number" value={String(editing.net_amount||0)} onChange={v=>setEditing(d=>d&&({...d,net_amount:Number(v)}))}/>
     <EditField name="ÁFA" type="number" value={String(editing.vat_amount||0)} onChange={v=>setEditing(d=>d&&({...d,vat_amount:Number(v)}))}/>
     <EditField name="Bruttó" type="number" value={String(editing.gross_amount||0)} onChange={v=>setEditing(d=>d&&({...d,gross_amount:Number(v)}))}/>
     <EditField name="Fizetési mód" value={editing.payment_method||''} onChange={v=>setEditing(d=>d&&({...d,payment_method:v}))}/>
     <EditField name="Munkalap azonosító" value={editing.work_order_id||''} onChange={v=>setEditing(d=>d&&({...d,work_order_id:v}))}/>
    </div>
    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:14}}>
     <button onClick={()=>void saveEdit()} disabled={busy} style={{...btn,background:'#334155',color:'#fff'}}><Save size={15}/>Mentés</button>
     {editing.has_file&&<button onClick={()=>void openFile(editing)} style={{...btn,background:'#e0e7ff',color:'#3730a3'}}><ExternalLink size={15}/>Eredeti export / fájl</button>}
     {editing.status==='pending_review'&&<button onClick={()=>void approve(editing.id)} disabled={busy} style={{...btn,background:'#166534',color:'#fff'}}><CheckCircle2 size={15}/>Jóváhagyás</button>}
     {editing.status==='pending_review'&&<button onClick={()=>void reject(editing.id)} disabled={busy} style={{...btn,background:'#fee2e2',color:'#991b1b'}}><XCircle size={15}/>Elutasítás</button>}
    </div>
    <div style={{marginTop:14,padding:11,borderRadius:10,background:'#f0fdf4',color:'#166534',fontSize:12,fontWeight:750}}><ShieldCheck size={15}/> Külső szolgáltatói/exportált bizonylat: a VIR saját NAV nyugta-adatszolgáltatásából kizárva.</div>
   </div>
  </div>}
 </main>;
}

function Field({name,value,onChange,type='text'}:{name:string;value:string;onChange:(value:string)=>void;type?:string}){
 return <label style={label}>{name}<input style={input} type={type} value={value} onChange={e=>onChange(e.target.value)}/></label>;
}
function EditField({name,value,onChange,type='text'}:{name:string;value:string;onChange:(value:string)=>void;type?:string}){
 return <Field name={name} value={value} onChange={onChange} type={type}/>;
}
function StatusLine({ok,title,detail}:{ok:boolean;title:string;detail:string}){
 return <div style={{display:'grid',gridTemplateColumns:'22px 1fr',gap:8,padding:'9px 0',borderBottom:'1px solid #f1f5f9'}}><span style={{fontWeight:900,color:ok?'#166534':'#b45309'}}>{ok?'✓':'!'}</span><div><b>{title}</b><small style={{display:'block',color:'#64748b'}}>{detail}</small></div></div>;
}
function StatusBadge({status}:{status:string}){
 const map:Record<string,{label:string;bg:string;fg:string}>={pending_review:{label:'Ellenőrzésre vár',bg:'#fef3c7',fg:'#92400e'},approved:{label:'Jóváhagyott',bg:'#dcfce7',fg:'#166534'},rejected:{label:'Elutasított',bg:'#fee2e2',fg:'#991b1b'},duplicate:{label:'Duplikált',bg:'#e2e8f0',fg:'#475569'},voided:{label:'Érvénytelen',bg:'#f1f5f9',fg:'#475569'}};
 const x=map[status]||{label:status,bg:'#f1f5f9',fg:'#475569'};
 return <span style={{display:'inline-block',padding:'4px 7px',borderRadius:999,background:x.bg,color:x.fg,fontSize:11,fontWeight:850}}>{x.label}</span>;
}
function sourceName(source:string){return source==='altegio'?'Altegio export':source==='google_drive'?'Google Drive':source==='invee'?'Invee':source==='file_upload'?'Fájl':'Kézi';}
function typeName(type:string){return type==='transaction'?'Pénzügyi tranzakció':type==='invoice'?'Számla':type==='receipt'?'Nyugta':type==='credit_note'?'Módosító számla':type==='void_receipt'?'Sztornó nyugta':'Egyéb';}
