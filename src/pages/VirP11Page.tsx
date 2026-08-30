import React,{useCallback,useEffect,useState} from 'react';
import {analyzeP11Complaint,getP11Complaints,getP11ConversationMemory,getP11Status,previewP11Reception} from '../api/virP11';
import VirSearchSelect from '../components/VirSearchSelect';
import './VirWorkspace.css';

type Tab='reception'|'memory'|'complaints';
const tabs:[Tab,string,string][]=[
 ['reception','AI recepciós','56. Full AI Receptionist'],
 ['memory','Vendégelőzmények','57. AI Conversation Memory'],
 ['complaints','Panaszkezelő','58. AI Complaint Assistant'],
];
const friendlyError=(e:any)=>e?.response?.data?.message||e?.response?.data?.error||e?.message||'Az adatokat most nem sikerült betölteni.';

export default function VirP11Page(){
 const [tab,setTab]=useState<Tab>('reception');
 const [locationId,setLocationId]=useState('');
 const [clientId,setClientId]=useState('');
 const [workOrderId,setWorkOrderId]=useState('');
 const [data,setData]=useState<any>(null);
 const [status,setStatus]=useState<any>(null);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState('');
 const [text,setText]=useState('Holnap délután szeretnék időpontot hajvágásra.');
 const [complaint,setComplaint]=useState('');
 const load=useCallback(async()=>{setLoading(true);setError('');try{const params=locationId?{locationId}:{};setStatus(await getP11Status(params));if(tab==='memory')setData(clientId?await getP11ConversationMemory(clientId,params):null);else if(tab==='complaints')setData(await getP11Complaints(params));else setData(null);}catch(e:any){setError(friendlyError(e))}finally{setLoading(false)}},[clientId,locationId,tab]);
 useEffect(()=>{void load()},[load]);
 const preview=async()=>{setLoading(true);setError('');try{setData(await previewP11Reception({text,client_id:clientId||undefined,locationId:locationId||undefined}))}catch(e:any){setError(friendlyError(e))}finally{setLoading(false)}};
 const analyze=async()=>{setLoading(true);setError('');try{setData(await analyzeP11Complaint({summary:complaint,client_id:clientId||undefined,work_order_id:workOrderId||undefined,locationId:locationId||undefined}))}catch(e:any){setError(friendlyError(e))}finally{setLoading(false)}};
 return <div className="vir-workspace">
  <header className="vir-workspace-hero"><h1>AI recepció és vendégút</h1><p>A recepció munkáját támogatja: értelmezi a vendég kérését, megmutatja az előzményeket és előkészíti a panaszkezelést. Automatikus foglalás, pénzvisszatérítés vagy kompenzáció nincs.</p></header>
  <div className="vir-tabs">{tabs.map(([k,label,title])=><button key={k} title={title} className={tab===k?'active':''} onClick={()=>setTab(k)}>{label}</button>)}</div>
  <section className="vir-panel"><h2>Kiválasztás</h2><p className="vir-panel-subtitle">Nem kell azonosítókat másolni: keress névre, telefonszámra vagy e-mailre.</p><div className="vir-toolbar"><VirSearchSelect kind="locations" label="Telephely" value={locationId} onChange={setLocationId} optional placeholder="Telephely keresése..."/><VirSearchSelect kind="clients" label="Vendég" value={clientId} onChange={setClientId} optional={tab!=='memory'} placeholder="Vendég neve, telefonja vagy e-mailje..."/><button className="vir-btn secondary" onClick={()=>void load()} disabled={loading}>{loading?'Betöltés...':'Frissítés'}</button></div></section>
  {status&&<div className="vir-workspace-grid"><div className="vir-stat-card"><span>Nyitott beszélgetések</span><strong>{status.counts?.open_conversations??0}</strong></div><div className="vir-stat-card"><span>Emberi átadás</span><strong>{status.counts?.open_handoffs??0}</strong></div><div className="vir-stat-card"><span>Nyitott panaszok</span><strong>{status.counts?.open_complaints??0}</strong></div></div>}
  {error&&<div className="vir-error-friendly"><strong>Nem sikerült:</strong> {error}</div>}
  {tab==='reception'&&<section className="vir-panel"><h2>AI recepciós előnézet</h2><p className="vir-panel-subtitle">Írd le természetes nyelven, mit kér a vendég. A rendszer csak előnézetet készít, nem foglal automatikusan.</p><div className="vir-field"><label>Vendég kérése</label><textarea value={text} onChange={e=>setText(e.target.value)} rows={5}/></div><div style={{marginTop:12}}><button className="vir-btn" onClick={()=>void preview()} disabled={loading||!text.trim()}>Foglalási előnézet készítése</button></div><div className="vir-help" style={{marginTop:12}}><strong>Kontroll:</strong> vendégmegerősítés és szükség szerint emberi jóváhagyás kell.</div></section>}
  {tab==='memory'&&<section className="vir-panel"><h2>Vendégelőzmények</h2><p className="vir-panel-subtitle">Korábbi látogatások, beszélgetések és elérhető kommunikációs csatornák egy helyen.</p>{!clientId&&<div className="vir-empty-state">Válassz ki egy vendéget a fenti keresőből.</div>}</section>}
  {tab==='complaints'&&<section className="vir-panel"><h2>Panasz elemzése</h2><p className="vir-panel-subtitle">A rendszer összegyűjti a kapcsolódó adatokat és emberi felülvizsgálásra készíti elő az ügyet.</p><div className="vir-form-row"><VirSearchSelect kind="work-orders" label="Kapcsolódó munkalap" value={workOrderId} onChange={setWorkOrderId} optional placeholder="Munkalap keresése..."/></div><div className="vir-field" style={{marginTop:12}}><label>Panasz rövid leírása</label><textarea value={complaint} onChange={e=>setComplaint(e.target.value)} rows={5} placeholder="Mi történt? Mit jelez a vendég?"/></div><div style={{marginTop:12}}><button className="vir-btn" onClick={()=>void analyze()} disabled={loading||!complaint.trim()}>Elemzés és emberi átadás</button></div><div className="vir-help" style={{marginTop:12}}><strong>Kontroll:</strong> automatikus kompenzáció és refund: NEM.</div></section>}
  <section className="vir-panel"><h2>Eredmény</h2>{!data?<div className="vir-empty-state">Válassz funkciót vagy készíts előnézetet.</div>:<><div className="vir-help">Az eredmény döntéstámogatás. A részletes technikai adatokat csak akkor nyisd meg, ha szükséges.</div><details className="vir-json-details"><summary>Technikai részletek megjelenítése</summary><pre>{JSON.stringify(data,null,2)}</pre></details></>}</section>
 </div>;
}
