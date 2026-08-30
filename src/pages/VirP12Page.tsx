import React,{useEffect,useState} from 'react';
import {getP12Journey,getP12NextStep,getP12RecoveryQueue,getP12Status} from '../api/virP12';
import VirSearchSelect from '../components/VirSearchSelect';
import './VirWorkspace.css';
const friendlyError=(e:any)=>e?.response?.data?.message||e?.response?.data?.error||e?.message||'Az adatokat most nem sikerült betölteni.';
export default function VirP12Page(){
 const[clientId,setClientId]=useState('');const[data,setData]=useState<any>(null);const[status,setStatus]=useState<any>(null);const[loading,setLoading]=useState(false);const[error,setError]=useState('');
 useEffect(()=>{void getP12Status().then(setStatus).catch(e=>setError(friendlyError(e)))},[]);
 const run=async(kind:'journey'|'next'|'queue')=>{setLoading(true);setError('');try{setData(kind==='queue'?await getP12RecoveryQueue():kind==='journey'?await getP12Journey(clientId):await getP12NextStep(clientId))}catch(e:any){setError(friendlyError(e))}finally{setLoading(false)}};
 const items=Array.isArray(data?.items)?data.items:[];
 return <div className="vir-workspace">
  <header className="vir-workspace-hero"><h1>Vendégút és visszanyerés</h1><p>Megmutatja egy vendég teljes kapcsolatát a szalonnal, javasolja a következő lépést, és listázza azokat, akiket érdemes visszahívni vagy újrafoglalásra ösztönözni.</p></header>
  <div className="vir-workspace-grid"><div className="vir-stat-card"><span>Nyitott emberi átadás</span><strong>{status?.counts?.open_handoffs??0}</strong></div><div className="vir-stat-card"><span>Nyitott panasz</span><strong>{status?.counts?.open_complaints??0}</strong></div><div className="vir-stat-card"><span>Automatikus megkeresés</span><strong>NEM</strong></div></div>
  <section className="vir-panel"><h2>Vendég kiválasztása</h2><p className="vir-panel-subtitle">Keress névre, telefonszámra vagy e-mail-címre. Nincs szükség UUID másolására.</p><div className="vir-toolbar"><VirSearchSelect kind="clients" label="Vendég" value={clientId} onChange={setClientId} placeholder="Vendég keresése..."/><button className="vir-btn" onClick={()=>void run('journey')} disabled={loading||!clientId}>Vendégút</button><button className="vir-btn secondary" onClick={()=>void run('next')} disabled={loading||!clientId}>Következő legjobb lépés</button><button className="vir-btn secondary" onClick={()=>void run('queue')} disabled={loading}>Visszanyerési lista</button></div><div className="vir-help" style={{marginTop:12}}>Automatikus ügyfélprofil-módosítás és automatikus outreach nincs.</div></section>
  {error&&<div className="vir-error-friendly"><strong>Nem sikerült:</strong> {error}</div>}
  <section className="vir-panel"><h2>Eredmény</h2>{!data?<div className="vir-empty-state">Válassz vendéget vagy nyisd meg a visszanyerési listát.</div>:<>{items.length>0&&<div className="vir-result-list">{items.slice(0,30).map((x:any,i:number)=><article className="vir-result-card" key={x.id||x.client_id||i}><h4>{x.full_name||x.label||x.type||'Vendégadat'}</h4><p>{x.detail||x.reason||''}</p>{x.no_shows_90d!==undefined&&<span className="vir-chip warning">No-show: {x.no_shows_90d}</span>}{x.open_complaint&&<span className="vir-chip danger" style={{marginLeft:6}}>Nyitott panasz</span>}</article>)}</div>}<details className="vir-json-details"><summary>Technikai részletek</summary><pre>{JSON.stringify(data,null,2)}</pre></details></>}</section>
 </div>;
}
