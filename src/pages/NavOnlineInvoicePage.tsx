import React,{useEffect,useState}from'react';
import api from'../api';

export default function NavOnlineInvoicePage(){
 const[settings,setSettings]=useState<any>(null);
 const[status,setStatus]=useState<any>(null);
 const[xsdInfo,setXsdInfo]=useState<any>(null);
 const[dash,setDash]=useState<any>({stats:{},invoices:[],queue:[]});
 const[busy,setBusy]=useState(false);
 const[error,setError]=useState('');
 const[notice,setNotice]=useState('');

 async function load(){
  setError('');
  try{
   const[s,d]=await Promise.all([
    api.get('/api/transactions/nav-online-invoice/settings'),
    api.get('/api/transactions/nav-online-invoice/dashboard')
   ]);
   setSettings(s.data);
   setDash(d.data||{stats:{},invoices:[],queue:[]});
  }catch(e:any){setError(e?.response?.data?.message||'A NAV adatok nem tölthetők be.')}
  try{
   const x=await api.get('/api/transactions/nav-online-invoice/xsd-status');
   setXsdInfo(x.data);
  }catch(e:any){
   setXsdInfo({ok:false,ready:false,fail_closed:true,message:e?.response?.data?.message||'A lokális NAV XSD validátor nem érhető el.'});
  }
 }
 useEffect(()=>{void load()},[]);

 async function test(){
  setBusy(true);setError('');setStatus(null);
  try{const r=await api.get('/api/transactions/nav-online-invoice/connection-test');setStatus(r.data)}
  catch(e:any){setError(e?.response?.data?.message||'A NAV kapcsolat tesztelése sikertelen.')}
  finally{setBusy(false)}
 }

 async function validate(id:string){
  setBusy(true);setError('');setNotice('');
  try{
   const r=await api.post(`/api/transactions/nav-online-invoice/invoices/${id}/validate`,{});
   setNotice(r.data.status==='passed'?'A számla üzleti validációja sikeres.':r.data.status==='warning'?'A számla validálható, de figyelmeztetések vannak.':'A számla validációja hibás.');
   await load();
  }catch(e:any){setError(e?.response?.data?.message||'A validáció sikertelen.')}
  finally{setBusy(false)}
 }

 async function xsdValidate(id:string){
  setBusy(true);setError('');setNotice('');
  try{
   const r=await api.post(`/api/transactions/nav-online-invoice/invoices/${id}/xsd-validate`,{});
   const revision=r.data?.xsd?.schema_revision;
   setNotice(`NAV XSD-validáció sikeres${revision?` · ${revision}`:''}.`);
   await load();
  }catch(e:any){
   const errors=e?.response?.data?.xsd?.errors?.map((x:any)=>`${x.line_number?`sor ${x.line_number}: `:''}${x.message}`).join(' · ');
   setError(errors||e?.response?.data?.message||'A NAV XSD-validáció sikertelen.');
   await load();
  }finally{setBusy(false)}
 }

 async function queue(id:string){
  setBusy(true);setError('');setNotice('');
  try{await api.post(`/api/transactions/nav-online-invoice/invoices/${id}/queue`,{});setNotice('A számla NAV beküldési sorba került.');await load()}
  catch(e:any){const details=e?.response?.data?.errors?.map((x:any)=>x.message).join(' · ');setError(details||e?.response?.data?.message||'A sorba állítás sikertelen.')}
  finally{setBusy(false)}
 }

 async function correction(id:string,mode:'MODIFY'|'STORNO'){
  const reason=window.prompt(mode==='STORNO'?'Sztornó oka:':'Módosítás oka:')||'';
  if(!reason)return;
  setBusy(true);setError('');setNotice('');
  try{const r=await api.post(`/api/transactions/nav-online-invoice/invoices/${id}/correction-draft`,{mode,reason});setNotice(`${mode==='STORNO'?'Sztornó':'Módosító'} számlatervezet létrejött: ${r.data.invoice_no}`);await load()}
  catch(e:any){setError(e?.response?.data?.message||'A korrekciós bizonylat nem hozható létre.')}
  finally{setBusy(false)}
 }

 return <main style={page}>
  <header style={head}>
   <div><div style={eyebrow}>PÉNZÜGYEK · NAV ONLINE SZÁMLA</div><h1 style={{margin:'4px 0'}}>NAV Online Számla 3.0</h1><p style={muted}>Kapcsolat, üzleti és XSD-validáció, korrekciós számlalánc és beküldési sor felügyelete.</p></div>
   <button onClick={()=>void test()} disabled={busy} style={button}>{busy?'Folyamatban…':'NAV kapcsolat tesztelése'}</button>
  </header>
  {error&&<div style={bad}>{error}</div>}
  {notice&&<div style={ok}>{notice}</div>}
  {status?.ok&&<div style={ok}>✓ {status.message} · környezet: <b>{status.environment}</b> · requestId: {status.request_id}</div>}
  {xsdInfo&&!xsdInfo.ok&&<div style={bad}>XSD validátor: {xsdInfo.message||'nem elérhető'} · a NAV beküldés fail-closed módon blokkolt.</div>}

  <section style={card}>
   <h2>Kapcsolati állapot</h2>
   {settings?<div style={grid}>
    <Item k="Környezet" v={settings.environment==='live'?'ÉLES':'TESZT'}/>
    <Item k="Kibocsátó" v={settings.supplier_name}/>
    <Item k="Adószám" v={settings.supplier_tax_number}/>
    <Item k="Számlaprefix" v={settings.invoice_prefix}/>
    <Item k="Szoftverazonosító" v={settings.software_id}/>
    <Item k="Technikai felhasználó" v={settings.technical_login?'beállítva':'HIÁNYZIK'}/>
    <Item k="XSD validátor" v={xsdInfo?.ok?'AKTÍV · FAIL-CLOSED':'NEM ELÉRHETŐ'}/>
    <Item k="XSD motor" v={xsdInfo?.validator||'—'}/>
    <Item k="XSD séma" v={shortRevision(xsdInfo?.schema_revision)}/>
   </div>:<p style={muted}>Nincs aktív NAV-konfiguráció.</p>}
  </section>

  <section style={card}>
   <h2>Állapot</h2>
   <div style={grid}>
    <Item k="Összes számla" v={dash.stats?.total||0}/>
    <Item k="NAV kész" v={dash.stats?.done||0}/>
    <Item k="Folyamatban" v={dash.stats?.pending||0}/>
    <Item k="Hibás" v={dash.stats?.failed||0}/>
    <Item k="Üzleti validációs hiba" v={dash.stats?.invalid||0}/>
    <Item k="XSD hiba" v={dash.stats?.xsd_invalid||0}/>
    <Item k="XSD motorhiba" v={dash.stats?.xsd_engine_error||0}/>
   </div>
  </section>

  <section style={card}>
   <h2>Legutóbbi számlák</h2>
   <div style={{overflowX:'auto'}}><table style={table}>
    <thead><tr><Th>Számla</Th><Th>Vevő</Th><Th>Bruttó</Th><Th>Üzleti validáció</Th><Th>XSD</Th><Th>NAV</Th><Th>Művelet</Th></tr></thead>
    <tbody>{(dash.invoices||[]).map((x:any)=><tr key={x.id}>
     <Td><b>{x.invoice_no}</b><div style={muted}>{x.invoice_type||'NORMAL'}{x.original_invoice_number?` · eredeti: ${x.original_invoice_number}`:''}</div></Td>
     <Td>{x.partner_name||'—'}</Td>
     <Td>{Number(x.gross_total||0).toLocaleString('hu-HU')} Ft</Td>
     <Td><Badge v={x.nav_validation_status}/></Td>
     <Td><Badge v={x.nav_xsd_validation_status}/>{x.nav_xsd_schema_revision&&<div style={tiny}>{shortRevision(x.nav_xsd_schema_revision)}</div>}</Td>
     <Td><Badge v={x.nav_status}/></Td>
     <Td><div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
      <Mini onClick={()=>void validate(x.id)}>Validálás</Mini>
      <Mini onClick={()=>void xsdValidate(x.id)}>XSD</Mini>
      <Mini onClick={()=>void queue(x.id)}>Sorba</Mini>
      <Mini onClick={()=>void correction(x.id,'MODIFY')}>Módosító</Mini>
      <Mini onClick={()=>void correction(x.id,'STORNO')}>Sztornó</Mini>
     </div></Td>
    </tr>)}{!(dash.invoices||[]).length&&<tr><Td colSpan={7}>Nincs számla.</Td></tr>}</tbody>
   </table></div>
  </section>

  <section style={card}>
   <h2>NAV beküldési sor</h2>
   <div style={{overflowX:'auto'}}><table style={table}>
    <thead><tr><Th>Számla</Th><Th>Művelet</Th><Th>Állapot</Th><Th>Próbálkozás</Th><Th>Utolsó hiba</Th></tr></thead>
    <tbody>{(dash.queue||[]).map((x:any)=><tr key={x.id}><Td>{x.invoice_no}</Td><Td>{x.operation}</Td><Td><Badge v={x.status}/></Td><Td>{x.attempts}</Td><Td>{x.last_error||'—'}</Td></tr>)}{!(dash.queue||[]).length&&<tr><Td colSpan={5}>A beküldési sor üres.</Td></tr>}</tbody>
   </table></div>
  </section>

  <section style={warn}>
   <b>NAV 4.1B védelem</b>
   <p>A generált NAV XML helyben, rögzített hivatalos NAV XSD-k ellen validálódik. A rendszer az előkészítéskor és közvetlenül a <code>tokenExchange/manageInvoice</code> előtt is ellenőriz; XSD-hiba vagy validátormotor-hiba esetén a beküldés fail-closed módon blokkolt. Éles beküldést csak NAV tesztkörnyezeti UAT után célszerű engedélyezni.</p>
  </section>
 </main>
}

function shortRevision(v:any){const s=String(v||'');if(!s)return'—';return s.replace(/online-invoice:/,'NAV ').replace(/;common:/,' · Common ').replace(/([0-9a-f]{10})[0-9a-f]+/g,'$1…')}
function Item({k,v}:{k:string,v:any}){return <div style={item}><span style={muted}>{k}</span><b title={String(v??'')}>{v??'—'}</b></div>}
function Badge({v}:{v:any}){const s=String(v||'not_validated');const good=['done','passed'].includes(s),badv=['error','aborted','failed','engine_error'].includes(s);return <span style={{padding:'3px 7px',borderRadius:999,fontSize:11,fontWeight:800,background:good?'#ecfdf3':badv?'#fff1f0':'#fff7e8',color:good?'#067647':badv?'#b42318':'#8a5a00'}}>{s}</span>}
function Mini({onClick,children}:{onClick:()=>void,children:React.ReactNode}){return <button type="button" onClick={onClick} disabled={false} style={mini}>{children}</button>}
function Th(p:any){return <th {...p} style={{textAlign:'left',padding:'9px 8px',fontSize:11,borderBottom:'1px solid #e5ddd4',whiteSpace:'nowrap'}}/>}
function Td(p:any){return <td {...p} style={{padding:'10px 8px',fontSize:12,borderBottom:'1px solid #f0e9e2',verticalAlign:'top'}}/>}

const page:React.CSSProperties={padding:24,background:'#f5f1ec',minHeight:'100vh',color:'#2b2118'};
const head:React.CSSProperties={maxWidth:1100,margin:'0 auto 18px',display:'flex',justifyContent:'space-between',gap:20,alignItems:'center'};
const eyebrow:React.CSSProperties={fontSize:11,letterSpacing:1.5,fontWeight:900,color:'#8a6d55'};
const muted:React.CSSProperties={fontSize:12,color:'#74675d'};
const tiny:React.CSSProperties={fontSize:9,color:'#8a8179',marginTop:4,maxWidth:150,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'};
const button:React.CSSProperties={border:0,borderRadius:10,padding:'10px 15px',background:'#2b2118',color:'#fff',fontWeight:800,cursor:'pointer'};
const mini:React.CSSProperties={border:'1px solid #d8d0c8',borderRadius:7,padding:'5px 7px',background:'#fff',fontSize:11,fontWeight:700,cursor:'pointer'};
const card:React.CSSProperties={maxWidth:1100,margin:'0 auto 16px',background:'#fff',borderRadius:16,padding:20,boxShadow:'0 8px 24px rgba(48,36,25,.08)'};
const grid:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:10};
const item:React.CSSProperties={display:'grid',gap:4,padding:12,border:'1px solid #eee5dc',borderRadius:10,overflow:'hidden'};
const ok:React.CSSProperties={maxWidth:1100,margin:'0 auto 16px',padding:12,borderRadius:10,background:'#ecfdf3',color:'#067647'};
const bad:React.CSSProperties={maxWidth:1100,margin:'0 auto 16px',padding:12,borderRadius:10,background:'#fff1f0',color:'#b42318'};
const warn:React.CSSProperties={maxWidth:1100,margin:'0 auto',padding:16,borderRadius:12,background:'#fff7e8',border:'1px solid #f0cf8d'};
const table:React.CSSProperties={width:'100%',borderCollapse:'collapse'};
