import React,{useCallback,useEffect,useState} from 'react';
import {analyzeP11Complaint,getP11Complaints,getP11ConversationMemory,getP11Status,previewP11Reception} from '../api/virP11';

type Tab='reception'|'memory'|'complaints';
const tabs:[Tab,string][]=[['reception','56. Full AI Receptionist'],['memory','57. AI Conversation Memory'],['complaints','58. AI Complaint Assistant']];
export default function VirP11Page(){
 const [tab,setTab]=useState<Tab>('reception');const [locationId,setLocationId]=useState('');const [data,setData]=useState<any>(null);const [status,setStatus]=useState<any>(null);const [loading,setLoading]=useState(false);
 const [text,setText]=useState('Holnap délután szeretnék időpontot hajvágásra.');const [clientId,setClientId]=useState('');const [complaint,setComplaint]=useState('');const [workOrderId,setWorkOrderId]=useState('');
 const load=useCallback(async()=>{setLoading(true);try{const params=locationId?{locationId}:{};setStatus(await getP11Status(params));if(tab==='memory'){setData(clientId?await getP11ConversationMemory(clientId,params):{ok:true,info:'Adj meg vendég UUID-t a memória megtekintéséhez.'});}else if(tab==='complaints'){setData(await getP11Complaints(params));}else setData({ok:true,info:'Írd le a vendég kérését, majd készíts booking preview-t.'});}finally{setLoading(false)}},[clientId,locationId,tab]);
 useEffect(()=>{void load()},[load]);
 const preview=async()=>{setLoading(true);try{setData(await previewP11Reception({text,client_id:clientId||undefined,locationId:locationId||undefined}))}finally{setLoading(false)}};
 const analyze=async()=>{setLoading(true);try{setData(await analyzeP11Complaint({summary:complaint,client_id:clientId||undefined,work_order_id:workOrderId||undefined,locationId:locationId||undefined}))}finally{setLoading(false)}};
 return <div style={{padding:24,maxWidth:1500,margin:'0 auto'}}><h1>VIR P11 · AI Reception & Customer Journey 3.0</h1><p>AI-alapú recepciós döntéstámogatás, első félből származó beszélgetési memória és panasz-asszisztens. Automatikus foglalás, pénzvisszatérítés vagy kompenzáció nincs.</p>
 <div style={{display:'flex',gap:8,flexWrap:'wrap',margin:'16px 0'}}>{tabs.map(([k,l])=><button key={k} onClick={()=>setTab(k)} style={{fontWeight:tab===k?800:500}}>{l}</button>)}</div>
 <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}><input value={locationId} onChange={e=>setLocationId(e.target.value)} placeholder="Telephely UUID (opcionális)" style={{minWidth:320}}/><input value={clientId} onChange={e=>setClientId(e.target.value)} placeholder="Vendég UUID (memóriához)" style={{minWidth:320}}/><button onClick={()=>void load()} disabled={loading}>{loading?'Betöltés...':'Frissítés'}</button></div>
 {status&&<div style={{marginBottom:16,padding:12,border:'1px solid #ddd',borderRadius:10}}>Nyitott beszélgetések: <strong>{status.counts?.open_conversations??0}</strong> · Human handoff: <strong>{status.counts?.open_handoffs??0}</strong> · Panaszok: <strong>{status.counts?.open_complaints??0}</strong></div>}
 {tab==='reception'&&<section style={{marginBottom:16}}><textarea value={text} onChange={e=>setText(e.target.value)} rows={4} style={{width:'100%'}}/><button onClick={()=>void preview()} disabled={loading||!text.trim()}>Booking preview készítése</button><p><strong>Kontroll:</strong> a preview nem ír foglalást; vendégmegerősítés és szükség szerint emberi jóváhagyás kell.</p></section>}
 {tab==='memory'&&<p>A memória kizárólag saját operatív előzményekből dolgozik: korábbi beszélgetések, látogatások és kommunikációs identitások. Érzékeny profilkövetkeztetés nincs.</p>}
 {tab==='complaints'&&<section style={{marginBottom:16}}><textarea value={complaint} onChange={e=>setComplaint(e.target.value)} rows={4} placeholder="Panasz összefoglalása" style={{width:'100%'}}/><input value={workOrderId} onChange={e=>setWorkOrderId(e.target.value)} placeholder="Munkalap UUID (opcionális)" style={{minWidth:320}}/><button onClick={()=>void analyze()} disabled={loading||!complaint.trim()}>Panasz elemzése és human handoff</button><p><strong>Kontroll:</strong> automatikus kompenzáció és refund: NEM.</p></section>}
 <section style={{background:'var(--surface,#fff)',border:'1px solid #ddd',borderRadius:12,padding:16}}><pre style={{whiteSpace:'pre-wrap',wordBreak:'break-word',margin:0}}>{data?JSON.stringify(data,null,2):'Nincs adat.'}</pre></section>
 </div>
}
