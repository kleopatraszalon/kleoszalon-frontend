import React,{useEffect,useState}from'react';
import api from'../api';

type TestConfigForm={supplier_name:string;supplier_tax_number:string;supplier_postal_code:string;supplier_city:string;supplier_address:string;invoice_prefix:string;technical_login:string;technical_password:string;signing_key:string;exchange_key:string};
const emptyTestConfig:TestConfigForm={supplier_name:'',supplier_tax_number:'',supplier_postal_code:'',supplier_city:'',supplier_address:'',invoice_prefix:'KLEO',technical_login:'',technical_password:'',signing_key:'',exchange_key:''};
const message=(e:any,fallback:string)=>e?.response?.data?.message||fallback;

export default function NavOnlineInvoicePage(){
 const[settings,setSettings]=useState<any>(null);
 const[testConfig,setTestConfig]=useState<any>(null);
 const[form,setForm]=useState<TestConfigForm>(emptyTestConfig);
 const[connection,setConnection]=useState<any>(null);
 const[runtime,setRuntime]=useState<any>(null);
 const[bootstrap,setBootstrap]=useState<any>(null);
 const[dash,setDash]=useState<any>({stats:{},invoices:[],queue:[]});
 const[worker,setWorker]=useState<any>(null);
 const[automation,setAutomation]=useState<any>(null);
 const[busy,setBusy]=useState(false);
 const[error,setError]=useState('');
 const[notice,setNotice]=useState('');

 async function load(){
  setError('');
  try{const r=await api.get('/api/transactions/nav-online-invoice/runtime-status');setRuntime(r.data)}
  catch(e:any){setRuntime({ok:false,xsd:{ready:false,message:message(e,'A NAV runtime állapot nem kérdezhető le.')}})}
  let coreOk=false;
  try{const r=await api.get('/api/transactions/nav-online-invoice/bootstrap-status');setBootstrap(r.data);coreOk=Boolean(r.data?.ok)}
  catch(e:any){const b=e?.response?.data;setBootstrap(b||{ok:false});setError(`NAV adatbázis-mag hiba${b?.bootstrap?.stage?` · lépés: ${b.bootstrap.stage}`:''}${b?.bootstrap?.db_code?` · DB: ${b.bootstrap.db_code}`:''}${b?.bootstrap?.constraint?` · constraint: ${b.bootstrap.constraint}`:''}. ${b?.message||'A rendszer újrapróbálja.'}`)}
  if(!coreOk)return;
  try{
   const[s,d,w]=await Promise.all([
    api.get('/api/transactions/nav-online-invoice/settings'),
    api.get('/api/transactions/nav-online-invoice/dashboard'),
    api.get('/api/transactions/nav-online-invoice/queue-worker/status')
   ]);
   setSettings(s.data);setDash(d.data||{stats:{},invoices:[],queue:[]});setWorker(w.data?.worker||null);setAutomation(w.data?.automation||null);
  }catch(e:any){setError(message(e,'A NAV számlaadatok vagy a queue worker állapota nem tölthető be.'))}
  try{
   const c=await api.get('/api/transactions/nav-test-uat/configuration');setTestConfig(c.data);const x=c.data?.config;
   if(x)setForm(f=>({...f,supplier_name:x.supplier_name||'',supplier_tax_number:x.supplier_tax_number||'',supplier_postal_code:x.supplier_postal_code||'',supplier_city:x.supplier_city||'',supplier_address:x.supplier_address||'',invoice_prefix:x.invoice_prefix||'KLEO',technical_login:x.technical_login||'',technical_password:'',signing_key:'',exchange_key:''}));
  }catch(e:any){setTestConfig({ok:false,message:message(e,'A NAV tesztkonfiguráció nem kérdezhető le.')})}
 }
 useEffect(()=>{void load()},[]);
 function setField<K extends keyof TestConfigForm>(key:K,value:TestConfigForm[K]){setForm(f=>({...f,[key]:value}))}
 async function run(fn:()=>Promise<void>){setBusy(true);setError('');setNotice('');try{await fn()}finally{setBusy(false)}}
 async function repair(){await run(async()=>{try{const r=await api.get('/api/transactions/nav-online-invoice/bootstrap-status');setNotice(r.data?.ok?'A NAV adatbázis-mag ellenőrzése sikeres.':'A NAV adatbázis-mag még nem kész.');await load()}catch(e:any){setError(message(e,'A NAV séma ellenőrzése sikertelen.'));await load()}})}
 async function saveTestConfig(){await run(async()=>{try{const r=await api.put('/api/transactions/nav-test-uat/configuration',{...form,environment:'test'});setTestConfig({ok:true,configured:true,active:true,config:r.data?.config});setForm(f=>({...f,technical_password:'',signing_key:'',exchange_key:''}));setNotice('NAV tesztkonfiguráció mentve. A titkos adatok nem olvashatók vissza.');await load()}catch(e:any){setError(message(e,'A NAV tesztkonfiguráció mentése sikertelen.'))}})}
 async function test(){await run(async()=>{try{const r=await api.get('/api/transactions/nav-online-invoice/connection-test');setConnection(r.data);setNotice('A NAV tokenExchange kapcsolat sikeres.')}catch(e:any){setConnection(null);setError(message(e,'A NAV kapcsolat tesztelése sikertelen.'))}})}
 async function validate(id:string){await run(async()=>{try{const r=await api.post(`/api/transactions/nav-online-invoice/invoices/${id}/validate`,{});setNotice(r.data.status==='passed'?'Üzleti validáció sikeres.':r.data.status==='warning'?'Üzleti validáció: figyelmeztetéssel elfogadható.':'Üzleti validáció hibás.');await load()}catch(e:any){setError(message(e,'A validáció sikertelen.'))}})}
 async function xsdValidate(id:string){await run(async()=>{try{const r=await api.post(`/api/transactions/nav-online-invoice/invoices/${id}/xsd-validate`,{});setNotice(`NAV XSD-validáció sikeres${r.data?.xsd?.schema_revision?` · ${shortRevision(r.data.xsd.schema_revision)}`:''}.`);await load()}catch(e:any){const xs=e?.response?.data?.xsd?.errors?.map((x:any)=>`${x.line_number?`sor ${x.line_number}: `:''}${x.message}`).join(' · ');setError(xs||message(e,'A NAV XSD-validáció sikertelen.'));await load()}})}
 async function queue(id:string){await run(async()=>{try{await api.post(`/api/transactions/nav-online-invoice/invoices/${id}/queue`,{});setNotice('A hivatalosan kiállított számla a NAV beküldési sorba került.');await load()}catch(e:any){const details=e?.response?.data?.errors?.map((x:any)=>x.message).join(' · ');setError(details||message(e,'A sorba állítás sikertelen.'))}})}
 async function correction(id:string,mode:'MODIFY'|'STORNO'){const reason=window.prompt(mode==='STORNO'?'Sztornó oka:':'Módosítás oka:')||'';if(!reason)return;await run(async()=>{try{const r=await api.post(`/api/transactions/nav-online-invoice/invoices/${id}/correction-draft`,{mode,reason});setNotice(`${mode==='STORNO'?'Sztornó':'Módosító'} tervezet létrejött: ${r.data.invoice_no}`);await load()}catch(e:any){setError(message(e,'A korrekciós bizonylat nem hozható létre.'))}})}
 async function runWorker(){await run(async()=>{try{await api.post('/api/transactions/nav-online-invoice/queue-worker/run-now',{});setNotice('A NAV queue worker kézi ciklusa lefutott.');await load()}catch(e:any){setError(message(e,'A NAV queue worker futtatása sikertelen.'))}})}
 async function saveAutomation(patch:any){await run(async()=>{try{const next={auto_submit:Boolean(automation?.auto_submit),auto_refresh:automation?.auto_refresh!==false,auto_submit_test_only:automation?.auto_submit_test_only!==false,...patch};const r=await api.put('/api/transactions/nav-online-invoice/automation',next);setAutomation(r.data?.automation||next);setNotice('NAV automatizálási beállítás mentve.');await load()}catch(e:any){setError(message(e,'A NAV automatizálási beállítás nem menthető.'))}})}
 async function retryQueue(id:string){await run(async()=>{try{await api.post(`/api/transactions/nav-online-invoice/queue/${id}/retry`,{});setNotice('A NAV sor tétel újrapróbálásra visszaállítva.');await load()}catch(e:any){setError(message(e,'Az újrapróbálás nem indítható.'))}})}
 async function cancelQueue(id:string){const reason=window.prompt('Megszakítás oka:')||'Kézi megszakítás';await run(async()=>{try{await api.post(`/api/transactions/nav-online-invoice/queue/${id}/cancel`,{reason});setNotice('A NAV sor tétel megszakítva.');await load()}catch(e:any){setError(message(e,'A NAV sor tétel nem szakítható meg.'))}})}

 const xsd=runtime?.xsd||runtime,boot=bootstrap?.bootstrap||bootstrap,tc=testConfig?.config;
 const credentials=automation?.credentials_configured||{};
 const credentialsReady=['technical_login','technical_password','signing_key','exchange_key'].every(k=>Boolean(credentials[k]));
 const queueCounts=(worker?.queue_counts||[]).reduce((a:any,x:any)=>({...a,[x.status]:x.count}),{});
 return <main style={page}>
  <header style={head}><div><div style={eyebrow}>PÉNZÜGYEK · NAV ONLINE SZÁMLA</div><h1 style={{margin:'4px 0'}}>NAV Online Számla 3.0</h1><p style={muted}>Munkalap → számla → üzleti validáció → hivatalos XSD → NAV adatszolgáltatás → státusz és korrekció.</p></div><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button onClick={()=>void repair()} disabled={busy} style={secondary}>Séma újraellenőrzése</button><button onClick={()=>void test()} disabled={busy||!settings} style={button}>NAV kapcsolat tesztelése</button></div></header>
  {error&&<div style={bad}>{error}</div>}{notice&&<div style={ok}>{notice}</div>}{connection?.ok&&<div style={ok}>✓ {connection.message} · {String(connection.environment).toUpperCase()} · requestId: {connection.request_id}</div>}

  <section style={card}><h2>Rendszerkészültség</h2><div style={grid}><Item k="NAV adatbázis-mag" v={boot?.ready||bootstrap?.ok?'KÉSZ':'HIBÁS / NEM KÉSZ'}/><Item k="Bootstrap lépés" v={boot?.stage||'—'}/><Item k="DB hibakód" v={boot?.db_code||'—'}/><Item k="XSD validátor" v={xsd?.ready||xsd?.ok?'AKTÍV · FAIL-CLOSED':'NEM ELÉRHETŐ'}/><Item k="XSD motor" v={xsd?.validator||'—'}/><Item k="XSD séma" v={shortRevision(xsd?.schema_revision)}/></div>{xsd&&!(xsd.ready||xsd.ok)&&<div style={bad}>A lokális NAV XSD motor ténylegesen nem érhető el: {xsd.message||xsd.detail||'ismeretlen hiba'}. Beküldés blokkolva.</div>}</section>

  <section style={card}><h2>Kapcsolati állapot</h2>{settings?<div style={grid}><Item k="Környezet" v={settings.environment==='live'?'ÉLES':'TESZT'}/><Item k="Kibocsátó" v={settings.supplier_name}/><Item k="Adószám" v={settings.supplier_tax_number}/><Item k="Számlaprefix" v={settings.invoice_prefix}/><Item k="Szoftverazonosító" v={settings.software_id}/><Item k="Technikai felhasználó" v={settings.technical_login?'BEÁLLÍTVA':'HIÁNYZIK'}/><Item k="Éles beküldés" v={settings.environment==='live'&&settings.live_submit_enabled?'ENGEDÉLYEZVE':'ZÁROLVA'}/></div>:<p style={muted}>Nincs aktív NAV konfiguráció. A számlázás és a helyi ellenőrzés előkészíthető, de NAV hálózati beküldés nem indul.</p>}</section>

  <section style={card}><div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}><div><h2 style={{marginTop:0}}>Automatikus NAV sor · retry · státuszfigyelés</h2><p style={muted}>A worker a kiállított számlákat biztonságos adatbázis-zárolással dolgozza fel, átmeneti pre-submit hibánál exponenciális visszavárással próbálkozik, transactionId után pedig DONE/WARNING/ERROR/ABORTED végállapotig kérdezi le a NAV státuszt. Bizonytalan manageInvoice hálózati eredménynél nem küld újra automatikusan.</p></div><Badge v={worker?.enabled?'worker_on':'worker_off'}/></div>
   <div style={grid}><Item k="Worker" v={worker?.enabled?'AKTÍV':'KIKAPCSOLVA'}/><Item k="Fut most" v={worker?.running?'IGEN':'NEM'}/><Item k="Utolsó siker" v={worker?.last_success_at?new Date(worker.last_success_at).toLocaleString('hu-HU'):'—'}/><Item k="Max. próbálkozás" v={worker?.max_attempts||'—'}/><Item k="Sorban" v={queueCounts.queued||0}/><Item k="Beküldve / poll" v={queueCounts.submitted||0}/><Item k="Hibás" v={queueCounts.error||0}/></div>
   <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'center',marginTop:12}}>
    <Toggle label="Automatikus beküldés" checked={Boolean(automation?.auto_submit)} disabled={busy||!automation||!credentialsReady} onChange={v=>void saveAutomation({auto_submit:v})}/>
    <Toggle label="Automatikus státuszfrissítés" checked={automation?.auto_refresh!==false} disabled={busy||!automation} onChange={v=>void saveAutomation({auto_refresh:v})}/>
    <Toggle label="Csak TEST automatikusan" checked={automation?.auto_submit_test_only!==false} disabled={busy||!automation} onChange={v=>void saveAutomation({auto_submit_test_only:v})}/>
    <button onClick={()=>void runWorker()} disabled={busy||!worker?.enabled} style={secondary}>Worker futtatása most</button>
   </div>
   {!credentialsReady&&<p style={{...muted,color:'#9a3412',marginTop:10}}>Az automatikus beküldés zárolva marad, amíg a NAV technikai login, jelszó, aláírókulcs és cserekulcs nincs beállítva. A worker ettől még telepítve és felügyelhető.</p>}
  </section>

  <section style={card}><div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}><div><h2 style={{marginTop:0}}>NAV tesztkörnyezeti UAT konfiguráció</h2><p style={muted}>Ez a felület csak TEST környezetet ment. Az éles kulcsokat ne chatben add meg.</p></div><Badge v={tc?.test_ready?'passed':'not_ready'}/></div><div style={grid}><Field label="Kibocsátó neve" value={form.supplier_name} onChange={v=>setField('supplier_name',v)}/><Field label="Adószám (11 számjegy)" value={form.supplier_tax_number} onChange={v=>setField('supplier_tax_number',v.replace(/\D/g,'').slice(0,11))}/><Field label="Irányítószám" value={form.supplier_postal_code} onChange={v=>setField('supplier_postal_code',v)}/><Field label="Város" value={form.supplier_city} onChange={v=>setField('supplier_city',v)}/><Field label="Cím" value={form.supplier_address} onChange={v=>setField('supplier_address',v)}/><Field label="Számlaprefix" value={form.invoice_prefix} onChange={v=>setField('invoice_prefix',v.toUpperCase())}/><Field label="NAV technikai login" value={form.technical_login} onChange={v=>setField('technical_login',v)}/><Field secret label={`Technikai jelszó${tc?.technical_password_configured?' · beállítva':''}`} value={form.technical_password} onChange={v=>setField('technical_password',v)} placeholder={tc?.technical_password_configured?'Hagyd üresen a meglévő megtartásához':'NAV technikai jelszó'}/><Field secret label={`Aláírókulcs${tc?.signing_key_configured?' · beállítva':''}`} value={form.signing_key} onChange={v=>setField('signing_key',v)} placeholder={tc?.signing_key_configured?'Hagyd üresen a meglévő megtartásához':'NAV aláírókulcs'}/><Field secret label={`Cserekulcs${tc?.exchange_key_configured?' · beállítva':''}`} value={form.exchange_key} onChange={v=>setField('exchange_key',v)} placeholder={tc?.exchange_key_configured?'Hagyd üresen a meglévő megtartásához':'32 hexadecimális karakter'}/></div><div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap',marginTop:14}}><button onClick={()=>void saveTestConfig()} disabled={busy||!bootstrap?.ok} style={button}>Teszt NAV konfiguráció mentése</button><span style={muted}>A jelszó és a kulcsok mentés után maszkoltak.</span></div></section>

  <section style={card}><h2>Állapot</h2><div style={grid}><Item k="Összes számla" v={dash.stats?.total||0}/><Item k="NAV kész" v={dash.stats?.done||0}/><Item k="Folyamatban" v={dash.stats?.pending||0}/><Item k="Hibás" v={dash.stats?.failed||0}/><Item k="Üzleti validációs hiba" v={dash.stats?.invalid||0}/><Item k="XSD hiba" v={dash.stats?.xsd_invalid||0}/><Item k="XSD motorhiba" v={dash.stats?.xsd_engine_error||0}/></div></section>

  <section style={card}><h2>Legutóbbi számlák</h2><div style={{overflowX:'auto'}}><table style={table}><thead><tr><Th>Számla</Th><Th>Vevő</Th><Th>Bruttó</Th><Th>Üzleti</Th><Th>XSD</Th><Th>NAV</Th><Th>Művelet</Th></tr></thead><tbody>{(dash.invoices||[]).map((x:any)=><tr key={x.id}><Td><b>{x.invoice_no}</b><div style={tiny}>{x.invoice_type||'NORMAL'}{x.original_invoice_number?` · eredeti: ${x.original_invoice_number}`:''}</div></Td><Td>{x.partner_name||'—'}</Td><Td>{Number(x.gross_total||0).toLocaleString('hu-HU')} Ft</Td><Td><Badge v={x.nav_validation_status}/></Td><Td><Badge v={x.nav_xsd_validation_status}/>{x.nav_xsd_schema_revision&&<div style={tiny}>{shortRevision(x.nav_xsd_schema_revision)}</div>}</Td><Td><Badge v={x.nav_status}/></Td><Td><div style={{display:'flex',gap:5,flexWrap:'wrap'}}><Mini onClick={()=>void validate(x.id)}>Validálás</Mini><Mini onClick={()=>void xsdValidate(x.id)}>XSD</Mini><Mini onClick={()=>void queue(x.id)}>Sorba</Mini><Mini onClick={()=>void correction(x.id,'MODIFY')}>Módosító</Mini><Mini onClick={()=>void correction(x.id,'STORNO')}>Sztornó</Mini></div></Td></tr>)}{!(dash.invoices||[]).length&&<tr><Td colSpan={7}>Nincs számla.</Td></tr>}</tbody></table></div></section>

  <section style={card}><h2>NAV beküldési sor</h2><div style={{overflowX:'auto'}}><table style={table}><thead><tr><Th>Számla</Th><Th>Művelet</Th><Th>Állapot</Th><Th>Próbálkozás</Th><Th>Következő</Th><Th>Utolsó hiba</Th><Th>Művelet</Th></tr></thead><tbody>{(dash.queue||[]).map((x:any)=><tr key={x.id}><Td>{x.invoice_no}</Td><Td>{x.operation}</Td><Td><Badge v={x.status}/></Td><Td>{x.attempts||0}</Td><Td>{x.next_attempt_at?new Date(x.next_attempt_at).toLocaleString('hu-HU'):'—'}</Td><Td>{x.last_error||'—'}{x.last_error_code&&<div style={tiny}>{x.last_error_code}</div>}</Td><Td><div style={{display:'flex',gap:5,flexWrap:'wrap'}}>{['error','cancelled'].includes(String(x.status))&&<Mini onClick={()=>void retryQueue(x.id)}>Újra</Mini>}{['queued','processing'].includes(String(x.status))&&<Mini onClick={()=>void cancelQueue(x.id)}>Megszakítás</Mini>}</div></Td></tr>)}{!(dash.queue||[]).length&&<tr><Td colSpan={7}>A beküldési sor üres.</Td></tr>}</tbody></table></div></section>

  <section style={note}><b>NAV védelem</b><p style={{marginBottom:0}}>A NAV számlázási útvonal külön adatbázis-bootstrapot és külön queue workert kapott. A lokális XSD ellenőrzés fail-closed. Éles automatikus beküldéshez külön DB engedély, külön deployment-kapu és deployment secretként tárolt NAV hitelesítő adatok szükségesek; ezek hiányában hálózati beküldés nem indul.</p></section>
 </main>
}

function shortRevision(v:any){const s=String(v||'—');return s.length>32?`${s.slice(0,13)}…${s.slice(-13)}`:s}
function Item({k,v}:{k:string;v:any}){return <div style={item}><span style={tiny}>{k}</span><b style={{display:'block',marginTop:3,wordBreak:'break-word'}}>{v??'—'}</b></div>}
function Field({label,value,onChange,secret=false,placeholder}:{label:string;value:string;onChange:(v:string)=>void;secret?:boolean;placeholder?:string}){return <label style={{fontSize:10,fontWeight:800,color:'#62564c',display:'grid',gap:4}}>{label}<input type={secret?'password':'text'} autoComplete="off" value={value} placeholder={placeholder} onChange={e=>onChange(e.target.value)} style={input}/></label>}
function Toggle({label,checked,disabled,onChange}:{label:string;checked:boolean;disabled?:boolean;onChange:(v:boolean)=>void}){return <label style={{display:'flex',alignItems:'center',gap:6,fontSize:10,fontWeight:800,color:'#62564c',opacity:disabled?.55:1}}><input type="checkbox" checked={checked} disabled={disabled} onChange={e=>onChange(e.target.checked)}/>{label}</label>}
function Badge({v}:{v:any}){const x=String(v||'—').toLowerCase(),good=['done','passed','warning','submitted','prepared','worker_on'].includes(x),badv=['error','aborted','failed','engine_error','worker_off'].includes(x);return <span style={{padding:'3px 7px',borderRadius:999,fontSize:9,fontWeight:900,background:badv?'#fee4e2':good?'#dcfae6':'#f2f4f7',color:badv?'#b42318':good?'#067647':'#475467'}}>{String(v||'—')}</span>}
function Mini({children,onClick}:{children:React.ReactNode;onClick:()=>void}){return <button onClick={onClick} style={mini}>{children}</button>}
function Th({children}:{children:React.ReactNode}){return <th style={th}>{children}</th>}
function Td({children,colSpan}:{children:React.ReactNode;colSpan?:number}){return <td colSpan={colSpan} style={td}>{children}</td>}

const page:React.CSSProperties={maxWidth:1120,margin:'0 auto',padding:'22px 16px 56px',color:'#241a13'};
const head:React.CSSProperties={display:'flex',justifyContent:'space-between',gap:18,alignItems:'center',flexWrap:'wrap',marginBottom:16};
const eyebrow:React.CSSProperties={fontSize:9,fontWeight:900,letterSpacing:1.5,color:'#7a5e4b'};
const muted:React.CSSProperties={fontSize:11,color:'#786b61',margin:'4px 0'};
const tiny:React.CSSProperties={fontSize:9,color:'#786b61'};
const card:React.CSSProperties={background:'#fff',padding:16,borderRadius:14,boxShadow:'0 7px 28px rgba(55,41,28,.08)',marginBottom:12};
const grid:React.CSSProperties={display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(145px,1fr))',gap:8};
const item:React.CSSProperties={border:'1px solid #eee5dc',borderRadius:9,padding:'9px 10px'};
const button:React.CSSProperties={border:0,borderRadius:8,padding:'9px 12px',background:'#2b2118',color:'#fff',fontWeight:900,cursor:'pointer'};
const secondary:React.CSSProperties={...button,background:'#f3ede6',color:'#2b2118',border:'1px solid #e2d7cc'};
const input:React.CSSProperties={border:'1px solid #ddd2c8',borderRadius:7,padding:'8px 9px',fontSize:11};
const bad:React.CSSProperties={background:'#fff1f0',color:'#b42318',padding:10,borderRadius:9,marginBottom:10,fontSize:11};
const ok:React.CSSProperties={background:'#ecfdf3',color:'#067647',padding:10,borderRadius:9,marginBottom:10,fontSize:11};
const table:React.CSSProperties={width:'100%',borderCollapse:'collapse',fontSize:10};
const th:React.CSSProperties={textAlign:'left',padding:'7px 6px',borderBottom:'1px solid #e9e2db',whiteSpace:'nowrap'};
const td:React.CSSProperties={padding:'8px 6px',borderBottom:'1px solid #f0ebe6',verticalAlign:'top'};
const mini:React.CSSProperties={border:'1px solid #dfd4ca',background:'#faf7f4',borderRadius:6,padding:'4px 6px',fontSize:9,cursor:'pointer'};
const note:React.CSSProperties={background:'#fff8e8',border:'1px solid #ecd49b',padding:13,borderRadius:12,fontSize:10,color:'#614b22'};
