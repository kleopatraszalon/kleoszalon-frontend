import React,{useEffect,useState}from'react';
import api from'../../api';

const money=(v:any)=>`${Number(v||0).toLocaleString('hu-HU')} Ft`;
type Billing={name:string;vat_status:'PRIVATE_PERSON'|'DOMESTIC';tax_number:string;country_code:string;postal_code:string;city:string;address:string};
const emptyBilling:Billing={name:'',vat_status:'PRIVATE_PERSON',tax_number:'',country_code:'HU',postal_code:'',city:'',address:''};

export default function WorkOrderInvoicePanel({workOrderId,locked,email}:{workOrderId:string;locked:boolean;email?:string}){
 const[invoice,setInvoice]=useState<any>(null),[readiness,setReadiness]=useState<any>(null),[submission,setSubmission]=useState<any>(null),[billing,setBilling]=useState<Billing>(emptyBilling),[busy,setBusy]=useState(false),[msg,setMsg]=useState(''),[err,setErr]=useState('');
 async function load(){
  if(!workOrderId)return;
  try{
   const[ir,rr]=await Promise.all([api.get(`/api/transactions/workorder-invoice/workorders/${workOrderId}`),api.get(`/api/transactions/workorder-invoice/workorders/${workOrderId}/readiness`)]);
   const inv=ir.data||null;setInvoice(inv);setReadiness(rr.data||null);
   if(rr.data?.billing)setBilling({...emptyBilling,...rr.data.billing});
   if(inv?.id){const sr=await api.get(`/api/transactions/nav-online-invoice/invoices/${inv.id}/submissions`);setSubmission(sr.data?.[0]||null)}else setSubmission(null);
  }catch(e:any){setErr(e?.response?.data?.message||'A számlázási állapot nem tölthető be.')}
 }
 useEffect(()=>{void load()},[workOrderId]);
 const fail=(e:any,fallback:string)=>setErr((e?.response?.data?.errors||[]).map((x:any)=>x.message||x).join(' · ')||e?.response?.data?.message||fallback);
 async function run(fn:()=>Promise<void>){setBusy(true);setErr('');setMsg('');try{await fn()}finally{setBusy(false)}}
 async function saveBilling(){await run(async()=>{try{await api.put(`/api/transactions/workorder-invoice/workorders/${workOrderId}/billing`,billing);setMsg('Számlázási adatok mentve.');await load()}catch(e:any){fail(e,'A számlázási adatok nem menthetők.') }})}
 async function draft(){await run(async()=>{try{const r=await api.post(`/api/transactions/workorder-invoice/workorders/${workOrderId}/draft`,{});setInvoice(r.data);setMsg('A számlatervezet elkészült.');await load()}catch(e:any){fail(e,'A számlatervezet nem készíthető el.') }})}
 async function issue(){await run(async()=>{try{const r=await api.post(`/api/transactions/workorder-invoice/workorders/${workOrderId}/issue`,{});setInvoice(r.data);setMsg(`A számla kiállítva: ${r.data?.invoice_no}. Következő lépés: NAV validáció és előkészítés.`);await load()}catch(e:any){fail(e,'A számla nem állítható ki.') }})}
 async function prepareNav(){if(!invoice)return;await run(async()=>{try{const business=await api.post(`/api/transactions/nav-online-invoice/invoices/${invoice.id}/validate`,{});if(business.data?.status==='failed')throw Object.assign(new Error('Az üzleti validáció hibás.'),{response:{data:{message:'Az üzleti validáció hibás.',errors:business.data?.errors}}});await api.post(`/api/transactions/nav-online-invoice/invoices/${invoice.id}/xsd-validate`,{});const p=await api.post(`/api/transactions/nav-online-invoice/invoices/${invoice.id}/prepare`,{});setSubmission(p.data?.submission);setMsg(`NAV adatszolgáltatás előkészítve és XSD-validálva${p.data?.xsd_validation?.schema_revision?` · ${p.data.xsd_validation.schema_revision}`:''}.`);await load()}catch(e:any){fail(e,'A NAV előkészítés sikertelen.') }})}
 async function submitNav(){if(!submission)return;const live=String(submission.environment)==='live';if(live&&!window.confirm('ÉLES NAV beküldés következik. Biztosan elküldi a kiállított számla adatait a NAV éles rendszerébe?'))return;await run(async()=>{try{const r=await api.post(`/api/transactions/nav-online-invoice/submissions/${submission.id}/submit`,{});setMsg(`NAV beküldve · transactionId: ${r.data?.transaction_id}`);await load()}catch(e:any){fail(e,'A NAV beküldés sikertelen.') }})}
 async function refreshNav(){if(!submission)return;await run(async()=>{try{const r=await api.post(`/api/transactions/nav-online-invoice/submissions/${submission.id}/refresh`,{});setMsg(`NAV státusz: ${r.data?.status}${r.data?.warning_count?` · ${r.data.warning_count} figyelmeztetés`:''}${r.data?.error_count?` · ${r.data.error_count} hiba`:''}`);await load()}catch(e:any){fail(e,'A NAV státusz lekérdezése sikertelen.') }})}
 async function pdf(){if(!invoice)return;await run(async()=>{try{const r=await api.get(`/api/transactions/workorder-invoice/invoices/${invoice.id}/pdf`,{responseType:'blob'});const u=URL.createObjectURL(r.data);window.open(u,'_blank','noopener,noreferrer');setTimeout(()=>URL.revokeObjectURL(u),60000)}catch(e:any){fail(e,'A PDF nem készíthető el.')}})}
 async function accounting(){if(!invoice)return;await run(async()=>{try{await api.post(`/api/transactions/workorder-invoice/invoices/${invoice.id}/post-accounting`,{});setMsg('A főkönyvi feladás elkészült.');await load()}catch(e:any){fail(e,'A főkönyvi feladás nem sikerült.')}})}
 async function send(){if(!invoice)return;await run(async()=>{try{const r=await api.post(`/api/transactions/workorder-invoice/invoices/${invoice.id}/email`,{to:email||undefined});setMsg(`E-mail elküldve: ${r.data?.to||email}`);await load()}catch(e:any){fail(e,'Az e-mail küldése nem sikerült.')}})}
 const official=Boolean(invoice?.issued_at)||invoice?.document_kind==='tax_invoice',navDone=['done','warning'].includes(String(invoice?.nav_status||'')),ready=Boolean(readiness?.ok);
 return <section style={box}>
  <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap'}}><div><h2 style={{margin:0,fontSize:18}}>Számlázás · munkalap → NAV Online Számla</h2><p style={{margin:'4px 0 0',fontSize:12,color:'#667085'}}>A munkalap számlázási adatai, hivatalos számlakiállítás, lokális XSD-validáció és NAV 3.0 adatszolgáltatás egy folyamatban.</p></div><Badge text={official?'KIÁLLÍTVA':'TERVEZET'} good={official}/></div>
  {err&&<div style={bad}>{err}</div>}{msg&&<div style={ok}>{msg}</div>}
  <div style={{marginTop:14,padding:14,border:'1px solid #eadfd5',borderRadius:12}}><div style={{fontWeight:900,marginBottom:8}}>Számlázási adatok</div><div style={formGrid}>
   <Field label="Név / cégnév" value={billing.name} onChange={v=>setBilling(x=>({...x,name:v}))}/>
   <label style={label}>Vevő típusa<select value={billing.vat_status} onChange={e=>setBilling(x=>({...x,vat_status:e.target.value as Billing['vat_status'],tax_number:e.target.value==='PRIVATE_PERSON'?'':x.tax_number}))} style={input}><option value="PRIVATE_PERSON">Magánszemély</option><option value="DOMESTIC">Belföldi adóalany / cég</option></select></label>
   <Field label="Adószám (11 számjegy)" value={billing.tax_number} disabled={billing.vat_status==='PRIVATE_PERSON'} onChange={v=>setBilling(x=>({...x,tax_number:v.replace(/\D/g,'').slice(0,11)}))}/>
   <Field label="Ország" value={billing.country_code} onChange={v=>setBilling(x=>({...x,country_code:v.toUpperCase().slice(0,2)}))}/>
   <Field label="Irányítószám" value={billing.postal_code} onChange={v=>setBilling(x=>({...x,postal_code:v}))}/>
   <Field label="Város" value={billing.city} onChange={v=>setBilling(x=>({...x,city:v}))}/>
   <Field label="Cím" value={billing.address} onChange={v=>setBilling(x=>({...x,address:v}))}/>
  </div><div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap',marginTop:10}}><button disabled={busy||official} onClick={()=>void saveBilling()} style={secondary}>Számlázási adatok mentése</button>{(readiness?.errors||[]).length>0&&<span style={{fontSize:11,color:'#b42318'}}>{readiness.errors.join(' · ')}</span>}</div></div>
  {invoice&&<div style={grid}><Metric label="Bizonylatszám" value={invoice.invoice_no}/><Metric label="Bruttó" value={money(invoice.gross_total)}/><Metric label="Számla" value={official?'Kiállítva':'Tervezet'}/><Metric label="NAV" value={invoice.nav_status||'not_submitted'}/><Metric label="NAV XSD" value={invoice.nav_xsd_validation_status||'not_validated'}/><Metric label="Főkönyv" value={invoice.accounting_posted_at?'Feladva':'Nincs feladva'}/></div>}
  <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:12}}>
   {!invoice&&<button disabled={busy||!locked} onClick={()=>void draft()} style={btn}>Számlatervezet készítése</button>}
   {invoice&&!official&&<button disabled={busy||!locked||!ready} onClick={()=>void issue()} style={btn}>Hivatalos számla kiállítása</button>}
   {invoice&&<button disabled={busy} onClick={()=>void pdf()} style={secondary}>PDF megnyitása</button>}
   {official&&!navDone&&<button disabled={busy} onClick={()=>void prepareNav()} style={secondary}>NAV ellenőrzés + előkészítés</button>}
   {submission?.status==='prepared'&&<button disabled={busy} onClick={()=>void submitNav()} style={navBtn}>Beküldés NAV-hoz ({String(submission.environment).toUpperCase()})</button>}
   {submission?.transaction_id&&<button disabled={busy} onClick={()=>void refreshNav()} style={secondary}>NAV státusz frissítése</button>}
   {official&&<button disabled={busy||!!invoice.accounting_posted_at} onClick={()=>void accounting()} style={secondary}>Főkönyvi feladás</button>}
   {official&&<button disabled={busy||!email} onClick={()=>void send()} style={secondary}>E-mail küldése</button>}
  </div>
  {submission&&<div style={{fontSize:11,color:'#667085',marginTop:9}}>NAV művelet: {submission.operation} · környezet: {String(submission.environment).toUpperCase()} · státusz: <b>{submission.status}</b>{submission.transaction_id?` · transactionId: ${submission.transaction_id}`:''}</div>}
  {(readiness?.warnings||[]).map((w:string,i:number)=><div key={i} style={{fontSize:11,color:'#8a5a00',marginTop:6}}>⚠ {w}</div>)}
  {invoice?.emailed_at&&<div style={{fontSize:11,color:'#667085',marginTop:8}}>Elküldve: {invoice.emailed_to||email} · {new Date(invoice.emailed_at).toLocaleString('hu-HU')}</div>}
 </section>
}
function Field({label:caption,value,onChange,disabled=false}:{label:string;value:string;onChange:(v:string)=>void;disabled?:boolean}){return <label style={label}>{caption}<input value={value||''} disabled={disabled} onChange={e=>onChange(e.target.value)} style={{...input,opacity:disabled ? .6 : 1}}/></label>}
function Badge({text,good}:{text:string;good:boolean}){return <span style={{padding:'5px 9px',borderRadius:999,fontSize:10,fontWeight:900,background:good?'#ecfdf3':'#fff7ed',color:good?'#067647':'#9a3412'}}>{text}</span>}
function Metric({label,value}:{label:string,value:any}){return <div style={{padding:10,borderRadius:10,background:'#f8f5f1'}}><span style={{fontSize:10,color:'#786b61'}}>{label}</span><div style={{fontWeight:900,marginTop:3,wordBreak:'break-word'}}>{value||'—'}</div></div>}
const box:React.CSSProperties={maxWidth:1040,margin:'0 auto 16px',background:'#fff',padding:18,borderRadius:14,boxShadow:'0 8px 30px rgba(48,36,25,.08)'};const grid:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(145px,1fr))',gap:8,marginTop:12};const formGrid:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:9};const label:React.CSSProperties={fontSize:10,fontWeight:800,color:'#62564c',display:'grid',gap:4};const input:React.CSSProperties={border:'1px solid #ddd2c8',borderRadius:8,padding:'8px 9px',fontSize:12,background:'#fff'};const btn:React.CSSProperties={border:0,borderRadius:9,padding:'9px 13px',background:'#2b2118',color:'#fff',fontWeight:800,cursor:'pointer'};const secondary:React.CSSProperties={...btn,background:'#f3ede6',color:'#2b2118',border:'1px solid #e2d7cc'};const navBtn:React.CSSProperties={...btn,background:'#7a254f'};const bad:React.CSSProperties={marginTop:10,padding:9,borderRadius:8,background:'#fff1f0',color:'#b42318',fontSize:12};const ok:React.CSSProperties={marginTop:10,padding:9,borderRadius:8,background:'#ecfdf3',color:'#067647',fontSize:12};
