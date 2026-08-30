import React,{useEffect,useState} from 'react';
import {getP13LoyaltyHealth,getP13Status,previewP13Protection,previewP13SaveOffer} from '../api/virP13';
import VirSearchSelect from '../components/VirSearchSelect';
import './VirWorkspace.css';
const friendlyError=(e:any)=>e?.response?.data?.message||e?.response?.data?.error||e?.message||'Az adatokat most nem sikerült betölteni.';
export default function VirP13Page(){
 const[clientId,setClientId]=useState('');const[data,setData]=useState<any>(null);const[status,setStatus]=useState<any>(null);const[loading,setLoading]=useState(false);const[error,setError]=useState('');
 useEffect(()=>{void getP13Status().then(setStatus).catch(e=>setError(friendlyError(e)))},[]);
 const run=async(kind:'protect'|'loyalty'|'save')=>{setLoading(true);setError('');try{setData(kind==='protect'?await previewP13Protection({client_id:clientId||undefined}):kind==='loyalty'?await getP13LoyaltyHealth(clientId):await previewP13SaveOffer({client_id:clientId}))}catch(e:any){setError(friendlyError(e))}finally{setLoading(false)}};
 const recommendation=data?.recommendation;
 return <div className="vir-workspace">
  <header className="vir-workspace-hero"><h1>Bevételvédelem és vendéghűség</h1><p>Segít csökkenteni a no-show és lemondás miatti veszteséget, megmutatja a vendéghűség állapotát, és kontrollált megtartó ajánlatot készít elő.</p></header>
  <div className="vir-workspace-grid"><div className="vir-stat-card"><span>No-show · 30 nap</span><strong>{status?.counts?.no_shows_30d??0}</strong></div><div className="vir-stat-card"><span>Lemondás · 30 nap</span><strong>{status?.counts?.cancellations_30d??0}</strong></div><div className="vir-stat-card"><span>Automatikus terhelés/kedvezmény</span><strong>NEM</strong></div></div>
  <section className="vir-panel"><h2>Vendég kiválasztása</h2><p className="vir-panel-subtitle">Válassz vendéget kereshető listából. A kockázati előnézet vendég nélkül is megnyitható általános szabályként.</p><div className="vir-toolbar"><VirSearchSelect kind="clients" label="Vendég" value={clientId} onChange={setClientId} optional placeholder="Név, telefon vagy e-mail..."/><button className="vir-btn" onClick={()=>void run('protect')} disabled={loading}>No-show védelem előnézet</button><button className="vir-btn secondary" onClick={()=>void run('loyalty')} disabled={loading||!clientId}>Hűségállapot</button><button className="vir-btn secondary" onClick={()=>void run('save')} disabled={loading||!clientId}>Megtartó ajánlat</button></div><div className="vir-help" style={{marginTop:12}}>Automatikus terhelés vagy kedvezmény: NEM.</div></section>
  {error&&<div className="vir-error-friendly"><strong>Nem sikerült:</strong> {error}</div>}
  <section className="vir-panel"><h2>Javaslat</h2>{!data?<div className="vir-empty-state">Válassz egy elemzést.</div>:<><div className="vir-workspace-grid">{data.health&&<div className="vir-stat-card"><span>Hűségállapot</span><strong>{data.health}</strong></div>}{recommendation?.deposit_percent!==undefined&&<div className="vir-stat-card"><span>Javasolt előleg</span><strong>{recommendation.deposit_percent}%</strong></div>}{recommendation?.discount_percent!==undefined&&<div className="vir-stat-card"><span>Javasolt kedvezmény</span><strong>{recommendation.discount_percent}%</strong></div>}</div><details className="vir-json-details"><summary>Technikai részletek</summary><pre>{JSON.stringify(data,null,2)}</pre></details></>}</section>
 </div>;
}
