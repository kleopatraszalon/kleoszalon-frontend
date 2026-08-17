import React,{useEffect,useMemo,useState}from'react';
import {Link} from'react-router-dom';
import api from'../api';

type Settings={
 scope_id:string;effective_from:string;enabled:boolean;include_workorders:boolean;include_retail_sales:boolean;
 reporting_mode:'KOBAK_MANUAL'|'M2M';receipt_source:'COMPUTER'|'PAPER'|'MIXED';default_vat_rate_percent:number;
 currency:string;software_receipt_prefix:string;paper_receipt_book_code:string;warning_days_before_deadline:number;
 email_copy_enabled:boolean;m2m_enabled:boolean;m2m_environment:'test'|'live';
};
type VatLine={vat_rate_percent:number;gross:number;net:number;vat:number};
type DailyRow={
 report_date:string;location_id:string|null;currency:string;receipt_count:number;gross_total:number;net_total:number;vat_total:number;
 vat_breakdown:VatLine[];sources:{workorders:number;retail_sales:number};deadline_days:number;deadline_date:string;overdue:boolean;due_soon:boolean;
 status:string;report_method:string|null;external_reference:string|null;first_receipt_number:string|null;last_receipt_number:string|null;
 reported_at:string|null;reported_by:string|null;note:string|null;
};
type SourceRow={
 source_type:'WORK_ORDER'|'RETAIL_SALE';source_id:string;source_number:string;location_id:string|null;issued_at:string;report_date:string;
 gross_total:number;taxable_gross:number;receipt_eligible:boolean;exclusion_reason:string|null;customer_name:string|null;vat_lines:VatLine[];
};

const HUF=new Intl.NumberFormat('hu-HU',{maximumFractionDigits:0});
const today=()=>new Date().toISOString().slice(0,10);
const daysAgo=(n:number)=>{const d=new Date();d.setDate(d.getDate()-n);return d.toISOString().slice(0,10)};
const money=(v:any,currency='HUF')=>currency==='HUF'?`${HUF.format(Number(v||0))} Ft`:new Intl.NumberFormat('hu-HU',{style:'currency',currency}).format(Number(v||0));
const err=(e:any,fallback:string)=>e?.response?.data?.message||fallback;

export default function ReceiptCompliancePage(){
 const[settings,setSettings]=useState<Settings|null>(null);
 const[form,setForm]=useState<Settings|null>(null);
 const[rows,setRows]=useState<DailyRow[]>([]);
 const[sources,setSources]=useState<SourceRow[]>([]);
 const[stats,setStats]=useState<any>({});
 const[readiness,setReadiness]=useState<any>(null);
 const[from,setFrom]=useState(daysAgo(31));
 const[to,setTo]=useState(today());
 const[selected,setSelected]=useState<DailyRow|null>(null);
 const[busy,setBusy]=useState(false);
 const[error,setError]=useState('');
 const[notice,setNotice]=useState('');

 async function load(range={from,to}){
  setError('');
  try{
   const[s,d,src,r]=await Promise.all([
    api.get('/api/vir/receipt-compliance/settings'),
    api.get('/api/vir/receipt-compliance/daily',{params:range}),
    api.get('/api/vir/receipt-compliance/sources',{params:range}),
    api.get('/api/vir/receipt-compliance/readiness')
   ]);
   setSettings(s.data?.settings||null);setForm(s.data?.settings||null);
   setRows(d.data?.rows||[]);setStats(d.data?.stats||{});setSources(src.data?.rows||[]);setReadiness(r.data||null);
   if(!selected&&d.data?.rows?.length)setSelected(d.data.rows[0]);
  }catch(e:any){setError(err(e,'A nyugta/NAV modul adatai nem tölthetők be.'))}
 }
 useEffect(()=>{void load()},[]);// eslint-disable-line react-hooks/exhaustive-deps

 const selectedSources=useMemo(()=>selected?sources.filter(s=>s.report_date===selected.report_date&&String(s.location_id||'')===String(selected.location_id||'')):[],[sources,selected]);
 const eligibleSources=selectedSources.filter(s=>s.receipt_eligible);
 const excludedSources=selectedSources.filter(s=>!s.receipt_eligible);

 function patch<K extends keyof Settings>(key:K,value:Settings[K]){setForm(f=>f?{...f,[key]:value}:f)}
 async function run(fn:()=>Promise<void>){setBusy(true);setError('');setNotice('');try{await fn()}finally{setBusy(false)}}
 async function saveSettings(){if(!form)return;await run(async()=>{try{const r=await api.put('/api/vir/receipt-compliance/settings',form);setSettings(r.data.settings);setForm(r.data.settings);setNotice('A nyugta/NAV beállítások mentve.');await load()}catch(e:any){setError(err(e,'A beállítások mentése sikertelen.'))}})}
 async function refresh(){await run(async()=>{await load({from,to});setNotice('A napi nyugtaösszesítés frissítve.')})}
 async function markReported(row:DailyRow){
  const ref=window.prompt(row.status==='REPORTED'?'NAV/KOBAK hivatkozás módosítása:':'NAV/KOBAK visszaigazolás vagy saját hivatkozás (opcionális):',row.external_reference||'')??'';
  const first=(form?.receipt_source==='PAPER'||form?.receipt_source==='MIXED')?(window.prompt('Első nyugtasorszám / nyugtatömb kezdő sorszáma (ha alkalmazandó):',row.first_receipt_number||'')??''):'';
  const last=(form?.receipt_source==='PAPER'||form?.receipt_source==='MIXED')?(window.prompt('Utolsó nyugtasorszám (opcionális):',row.last_receipt_number||'')??''):'';
  await run(async()=>{try{await api.post(`/api/vir/receipt-compliance/daily/${row.report_date}/mark-reported`,{
   location_id:row.location_id,currency:row.currency,report_method:form?.reporting_mode==='M2M'?'M2M':'KOBAK',external_reference:ref||null,
   first_receipt_number:first||null,last_receipt_number:last||null
  });setNotice(`${row.report_date}: adatszolgáltatás teljesítettként rögzítve.`);await load();}catch(e:any){setError(err(e,'A teljesítés nem rögzíthető.'))}})
 }
 async function reopen(row:DailyRow){await run(async()=>{try{await api.post(`/api/vir/receipt-compliance/daily/${row.report_date}/reopen`,{location_id:row.location_id,note:'Újranyitva VIR ellenőrzésre'});setNotice(`${row.report_date}: újranyitva.`);await load()}catch(e:any){setError(err(e,'A nap nem nyitható újra.'))}})}

 const readyChecks=Array.isArray(readiness?.checks)?readiness.checks:[];
 return <main style={page}>
  <header style={head}>
   <div><div style={eyebrow}>PÉNZÜGYEK · NYUGTA · NAV</div><h1 style={{margin:'4px 0'}}>Nyugta / NAV adatszolgáltatás</h1>
    <p style={muted}>Munkalapok és termékeladások → számla/nyugta szétválasztás → napi ÁFA-bontás → KOBAK vagy előkészített M2M folyamat.</p></div>
   <div style={{display:'flex',gap:8,flexWrap:'wrap'}}><Link to="/workorders" style={linkButton}>Munkalapok</Link><Link to="/finance" style={linkButton}>Termékeladás / pénztár</Link></div>
  </header>

  <div style={legalBox}><b>2026. szeptember 1-től:</b> a kézi és számítógéppel előállított nyugták adatait a kibocsátást követő <b>3 naptári napon belül</b>, napi összesítésben és adómérték szerinti bontásban kell jelenteni. A VIR határidőfigyelése ezért naptári napokkal számol. A számlával lefedett tranzakciók nem kerülnek bele a nyugtaösszesítésbe.</div>
  {error&&<div style={bad}>{error}</div>}{notice&&<div style={ok}>{notice}</div>}

  <section style={statsGrid}>
   <Stat label="Jelentendő nyugták" value={stats.receipts??0}/><Stat label="Bruttó nyugtaforgalom" value={money(stats.gross_total||0,settings?.currency)}/>
   <Stat label="Lejárt tárgynap" value={stats.overdue_days??0} danger={Number(stats.overdue_days||0)>0}/><Stat label="Jelentett nap" value={stats.reported_days??0}/>
   <Stat label="Számla miatt kizárva" value={stats.excluded_as_invoice??0}/><Stat label="KOBAK készültség" value={readiness?.ready_for_kobak?'KÉSZ':'ELLENŐRIZENDŐ'} danger={!readiness?.ready_for_kobak}/>
  </section>

  <section style={card}>
   <div style={sectionHead}><div><h2 style={{margin:0}}>Beállítások</h2><p style={muted}>Telephelyi vagy központi megfelelési szabályok. Az e-mailes másolat opcionális, nem a NAV-adatszolgáltatás feltétele.</p></div><button style={button} disabled={busy||!form} onClick={()=>void saveSettings()}>Beállítások mentése</button></div>
   {form&&<div style={formGrid}>
    <Field label="Hatálybalépés" type="date" value={form.effective_from} onChange={v=>patch('effective_from',v)}/>
    <Select label="Adatszolgáltatás" value={form.reporting_mode} onChange={v=>patch('reporting_mode',v as Settings['reporting_mode'])} options={[['KOBAK_MANUAL','KOBAK · kézi rögzítés'],['M2M','M2M · gépi interfész']]}/>
    <Select label="Nyugta forrása" value={form.receipt_source} onChange={v=>patch('receipt_source',v as Settings['receipt_source'])} options={[['COMPUTER','Számítógépes nyugta'],['PAPER','Papíralapú nyugta'],['MIXED','Vegyes']]}/>
    <Field label="Alap ÁFA-kulcs (%)" type="number" value={String(form.default_vat_rate_percent)} onChange={v=>patch('default_vat_rate_percent',Number(v))}/>
    <Field label="Pénznem" value={form.currency} onChange={v=>patch('currency',v.toUpperCase().slice(0,3))}/>
    <Field label="Szoftveres nyugtaprefix" value={form.software_receipt_prefix} onChange={v=>patch('software_receipt_prefix',v)}/>
    <Field label="Papír nyugtatömb / sorozat" value={form.paper_receipt_book_code} onChange={v=>patch('paper_receipt_book_code',v)}/>
    <Field label="Figyelmeztetés a határidő előtt (nap)" type="number" value={String(form.warning_days_before_deadline)} onChange={v=>patch('warning_days_before_deadline',Math.max(0,Math.min(3,Number(v))))}/>
    <Toggle label="Modul aktív" checked={form.enabled} onChange={v=>patch('enabled',v)}/>
    <Toggle label="Munkalapok figyelése" checked={form.include_workorders} onChange={v=>patch('include_workorders',v)}/>
    <Toggle label="Termékeladás figyelése" checked={form.include_retail_sales} onChange={v=>patch('include_retail_sales',v)}/>
    <Toggle label="Nyugtamásolat e-mailben (opcionális)" checked={form.email_copy_enabled} onChange={v=>patch('email_copy_enabled',v)}/>
    <Toggle label="M2M aktiválás" checked={form.m2m_enabled} onChange={v=>patch('m2m_enabled',v)}/>
    <Select label="M2M környezet" value={form.m2m_environment} onChange={v=>patch('m2m_environment',v as 'test'|'live')} options={[['test','TEST'],['live','ÉLES']]}/>
   </div>}
   {form?.reporting_mode==='M2M'&&<div style={warning}><b>M2M:</b> az adatszerkezet és mód kapcsolható, de a hálózati beküldő adaptert csak NAV technikai konfiguráció és teszt után szabad élesíteni. A jelenlegi oldalon a „teljesített” státusz kézi kontrollpont marad.</div>}
  </section>

  <section style={card}>
   <div style={sectionHead}><div><h2 style={{margin:0}}>Készültség</h2><p style={muted}>A két forrásrendszer és a megfelelési beállítás ellenőrzése.</p></div><span style={readiness?.ready_for_kobak?badgeGood:badgeWarn}>{readiness?.ready_for_kobak?'KOBAK KÉSZ':'ELLENŐRIZENDŐ'}</span></div>
   <div style={checkGrid}>{readyChecks.map((x:any)=><div key={x.key} style={x.ok?checkOk:checkBad}><b>{x.ok?'✓':'!'}</b><span>{x.label}</span></div>)}</div>
  </section>

  <section style={card}>
   <div style={sectionHead}><div><h2 style={{margin:0}}>Napi nyugtaadat-összesítés</h2><p style={muted}>A számlás tételek automatikusan kimaradnak; a jelentendő forgalom ÁFA-kulcsonként összesül.</p></div>
    <div style={{display:'flex',gap:8,alignItems:'end',flexWrap:'wrap'}}><Field label="Tól" type="date" value={from} onChange={setFrom}/><Field label="Ig" type="date" value={to} onChange={setTo}/><button style={button} disabled={busy} onClick={()=>void refresh()}>Frissítés</button></div></div>
   <div style={{overflowX:'auto'}}><table style={table}><thead><tr><Th>Tárgynap</Th><Th>Telephely</Th><Th>Nyugták</Th><Th>Bruttó</Th><Th>ÁFA</Th><Th>Forrás</Th><Th>Határidő</Th><Th>Státusz</Th><Th>Művelet</Th></tr></thead><tbody>
    {rows.map(row=><tr key={`${row.report_date}-${row.location_id||'*'}`} style={selected?.report_date===row.report_date&&selected?.location_id===row.location_id?selectedRow:undefined} onClick={()=>setSelected(row)}>
     <Td><b>{row.report_date}</b></Td><Td>{row.location_id?shortId(row.location_id):'Összes / központ'}</Td><Td>{row.receipt_count}</Td><Td>{money(row.gross_total,row.currency)}</Td><Td>{money(row.vat_total,row.currency)}</Td>
     <Td>{row.sources.workorders} ML · {row.sources.retail_sales} termék</Td><Td><span style={row.overdue?dangerText:undefined}>{row.deadline_date}{row.overdue?' · LEJÁRT':''}</span></Td><Td><Status row={row}/></Td>
     <Td><div style={{display:'flex',gap:6,flexWrap:'wrap'}}>{row.status!=='REPORTED'?<button style={smallButton} disabled={busy} onClick={e=>{e.stopPropagation();void markReported(row)}}>Teljesítve</button>:<button style={smallSecondary} disabled={busy} onClick={e=>{e.stopPropagation();void reopen(row)}}>Újranyitás</button>}</div></Td>
    </tr>)}
    {!rows.length&&<tr><td colSpan={9} style={{padding:24,textAlign:'center',color:'#64748b'}}>A kiválasztott időszakban nincs jelentendő nyugtaforgalom.</td></tr>}
   </tbody></table></div>
  </section>

  {selected&&<section style={card}>
   <div style={sectionHead}><div><h2 style={{margin:0}}>{selected.report_date} · részletek</h2><p style={muted}>{selected.receipt_count} jelentendő tranzakció · {selected.currency}</p></div><Status row={selected}/></div>
   <h3>ÁFA-bontás</h3><div style={vatGrid}>{selected.vat_breakdown.map(v=><div key={v.vat_rate_percent} style={vatCard}><b>{v.vat_rate_percent}% ÁFA</b><span>Bruttó: {money(v.gross,selected.currency)}</span><span>Nettó: {money(v.net,selected.currency)}</span><span>ÁFA: {money(v.vat,selected.currency)}</span></div>)}</div>
   <h3>Jelentendő források</h3><div style={sourceGrid}>{eligibleSources.map(s=><SourceCard key={`${s.source_type}-${s.source_id}`} source={s}/>)}</div>
   {!!excludedSources.length&&<><h3>Nem kerül a nyugtaadatba</h3><p style={muted}>Ezek a tranzakciók a VIR-ben számlásként vagy nem lezártként szerepelnek.</p><div style={sourceGrid}>{excludedSources.map(s=><SourceCard key={`${s.source_type}-${s.source_id}`} source={s} excluded/>)}</div></>}
  </section>}
 </main>
}

function Stat({label,value,danger}:{label:string;value:any;danger?:boolean}){return <div style={{...statCard,...(danger?{borderColor:'#fecaca',background:'#fff7f7'}:{})}}><small>{label}</small><b style={{fontSize:22,color:danger?'#b91c1c':'#0f172a'}}>{value}</b></div>}
function Status({row}:{row:DailyRow}){const reported=row.status==='REPORTED';return <span style={reported?badgeGood:row.overdue?badgeBad:badgeWarn}>{reported?`JELENTVE${row.report_method?` · ${row.report_method}`:''}`:row.overdue?'LEJÁRT':'JELENTENDŐ'}</span>}
function SourceCard({source,excluded}:{source:SourceRow;excluded?:boolean}){return <div style={{...sourceCard,...(excluded?{opacity:.7}:{})}}><div style={{display:'flex',justifyContent:'space-between',gap:8}}><b>{source.source_type==='WORK_ORDER'?'Munkalap':'Termékeladás'}</b><span style={excluded?badgeNeutral:badgeGood}>{excluded?(source.exclusion_reason==='INVOICE'?'SZÁMLA':'KIZÁRVA'):'NYUGTA'}</span></div><strong>{source.source_number}</strong><span>{new Date(source.issued_at).toLocaleString('hu-HU')}</span><span>{source.customer_name||'Magánszemély / nincs megadva'}</span><b>{money(source.taxable_gross)}</b>{source.source_type==='WORK_ORDER'?<Link to={`/workorders/${source.source_id}`}>Munkalap megnyitása →</Link>:<Link to="/finance">Pénztár megnyitása →</Link>}</div>}
function Field({label,value,onChange,type='text'}:{label:string;value:string;onChange:(v:string)=>void;type?:string}){return <label style={field}><span>{label}</span><input style={input} type={type} value={value} onChange={e=>onChange(e.target.value)}/></label>}
function Select({label,value,onChange,options}:{label:string;value:string;onChange:(v:string)=>void;options:Array<[string,string]>}){return <label style={field}><span>{label}</span><select style={input} value={value} onChange={e=>onChange(e.target.value)}>{options.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></label>}
function Toggle({label,checked,onChange}:{label:string;checked:boolean;onChange:(v:boolean)=>void}){return <label style={toggle}><input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)}/><span>{label}</span></label>}
const Th=({children}:{children:React.ReactNode})=><th style={th}>{children}</th>;const Td=({children}:{children:React.ReactNode})=><td style={td}>{children}</td>;
const shortId=(v:string)=>v.length>12?`${v.slice(0,8)}…${v.slice(-4)}`:v;

const page:React.CSSProperties={padding:'22px',maxWidth:1600,margin:'0 auto',color:'#0f172a'};
const head:React.CSSProperties={display:'flex',justifyContent:'space-between',gap:16,alignItems:'flex-start',flexWrap:'wrap',marginBottom:16};
const eyebrow:React.CSSProperties={fontSize:12,fontWeight:800,letterSpacing:1.2,color:'#8a6d45'};
const muted:React.CSSProperties={color:'#64748b',margin:'6px 0',lineHeight:1.5};
const legalBox:React.CSSProperties={background:'#fff9e9',border:'1px solid #f2dfaa',borderRadius:12,padding:'14px 16px',marginBottom:14,lineHeight:1.55};
const card:React.CSSProperties={background:'#fff',border:'1px solid #e2e8f0',borderRadius:16,padding:18,marginTop:14,boxShadow:'0 8px 28px rgba(15,23,42,.04)'};
const sectionHead:React.CSSProperties={display:'flex',justifyContent:'space-between',gap:12,alignItems:'flex-start',flexWrap:'wrap'};
const statsGrid:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(170px,1fr))',gap:10};
const statCard:React.CSSProperties={background:'#fff',border:'1px solid #e2e8f0',borderRadius:14,padding:'12px 14px',display:'flex',flexDirection:'column',gap:5};
const formGrid:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:12,marginTop:14};
const field:React.CSSProperties={display:'flex',flexDirection:'column',gap:5,fontSize:13,fontWeight:700,color:'#475569'};
const input:React.CSSProperties={border:'1px solid #cbd5e1',borderRadius:9,padding:'9px 10px',background:'#fff',font: 'inherit',color:'#0f172a'};
const toggle:React.CSSProperties={display:'flex',alignItems:'center',gap:9,border:'1px solid #e2e8f0',borderRadius:10,padding:'10px 11px',fontSize:13,fontWeight:700};
const button:React.CSSProperties={border:0,borderRadius:10,padding:'10px 14px',background:'#111827',color:'#fff',fontWeight:800,cursor:'pointer'};
const smallButton:React.CSSProperties={...button,padding:'7px 10px',fontSize:12};
const smallSecondary:React.CSSProperties={...smallButton,background:'#fff',color:'#334155',border:'1px solid #cbd5e1'};
const linkButton:React.CSSProperties={...smallSecondary,textDecoration:'none',display:'inline-flex',alignItems:'center'};
const ok:React.CSSProperties={background:'#ecfdf5',border:'1px solid #a7f3d0',color:'#065f46',borderRadius:10,padding:'10px 12px',margin:'10px 0'};
const bad:React.CSSProperties={background:'#fef2f2',border:'1px solid #fecaca',color:'#991b1b',borderRadius:10,padding:'10px 12px',margin:'10px 0'};
const warning:React.CSSProperties={background:'#fff7ed',border:'1px solid #fed7aa',color:'#9a3412',borderRadius:10,padding:'10px 12px',marginTop:12};
const table:React.CSSProperties={width:'100%',borderCollapse:'collapse',minWidth:1050,marginTop:10};
const th:React.CSSProperties={textAlign:'left',fontSize:12,color:'#64748b',padding:'9px 8px',borderBottom:'1px solid #e2e8f0',whiteSpace:'nowrap'};
const td:React.CSSProperties={padding:'10px 8px',borderBottom:'1px solid #f1f5f9',fontSize:13,verticalAlign:'middle'};
const selectedRow:React.CSSProperties={background:'#f8fafc'};
const dangerText:React.CSSProperties={color:'#b91c1c',fontWeight:800};
const badgeGood:React.CSSProperties={display:'inline-flex',padding:'4px 8px',borderRadius:999,background:'#dcfce7',color:'#166534',fontSize:11,fontWeight:900};
const badgeWarn:React.CSSProperties={...badgeGood,background:'#fef3c7',color:'#92400e'};
const badgeBad:React.CSSProperties={...badgeGood,background:'#fee2e2',color:'#991b1b'};
const badgeNeutral:React.CSSProperties={...badgeGood,background:'#e2e8f0',color:'#475569'};
const checkGrid:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:8,marginTop:12};
const checkOk:React.CSSProperties={display:'flex',gap:8,alignItems:'center',padding:10,borderRadius:9,background:'#f0fdf4',color:'#166534'};
const checkBad:React.CSSProperties={...checkOk,background:'#fff7ed',color:'#9a3412'};
const vatGrid:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:8};
const vatCard:React.CSSProperties={display:'flex',flexDirection:'column',gap:4,border:'1px solid #e2e8f0',borderRadius:10,padding:10};
const sourceGrid:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(230px,1fr))',gap:8};
const sourceCard:React.CSSProperties={display:'flex',flexDirection:'column',gap:5,border:'1px solid #e2e8f0',borderRadius:12,padding:12,fontSize:13};
