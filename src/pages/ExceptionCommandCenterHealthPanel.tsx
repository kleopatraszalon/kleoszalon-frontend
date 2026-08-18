import{useCallback,useEffect,useState}from'react';
import{AlertTriangle,CheckCircle2,Clock3,ExternalLink,RefreshCw,Siren,Users}from'lucide-react';
import{useNavigate}from'react-router-dom';
import api from'../api';
import'./ExceptionCommandCenterHealthPanel.css';

const BASE='/api/transactions/notifications/exceptions';
export default function ExceptionCommandCenterHealthPanel(){
 const navigate=useNavigate();
 const[data,setData]=useState<any>(null),[loading,setLoading]=useState(false),[error,setError]=useState('');
 const locationId=localStorage.getItem('kleo_location_id')||'';
 const load=useCallback(async()=>{setLoading(true);setError('');try{const q=locationId?`?location_id=${encodeURIComponent(locationId)}`:'';const r=await api.get(`${BASE}/summary${q}`);setData(r.data)}catch(e:any){setError(e?.response?.data?.message||'Az Exception Center állapota nem tölthető be.')}finally{setLoading(false)}},[locationId]);
 useEffect(()=>{void load();const t=window.setInterval(()=>void load(),60_000);return()=>window.clearInterval(t)},[load]);
 const critical=Number(data?.critical||0),breached=Number(data?.breached||0),unassigned=Number(data?.unassigned||0),open=Number(data?.open||0);
 const healthy=data&&critical===0&&breached===0;
 return <section className={`ecc-health-panel ${healthy?'ok':critical||breached?'critical':'warning'}`}><header><div><span>EXCEPTION MANAGEMENT</span><h2><Siren/> Exception Command Center Health</h2><p>Automatikusan észlelt üzleti és technikai eltérések, felelősi és SLA állapot egyetlen vezetői kontrollpontban.</p></div><div className="ecc-health-actions"><button onClick={load} disabled={loading}><RefreshCw className={loading?'spin':''}/>{loading?'Frissítés…':'Frissítés'}</button><button className="open" onClick={()=>navigate('/finance/exception-command-center')}><ExternalLink/> Command Center</button></div></header>{error&&<div className="ecc-health-error"><AlertTriangle/>{error}</div>}{data&&<div className="ecc-health-stats"><article className={critical?'danger':''}><AlertTriangle/><div><small>Kritikus</small><b>{critical}</b></div></article><article><Siren/><div><small>Nyitott</small><b>{open}</b></div></article><article className={breached?'danger':''}><Clock3/><div><small>SLA sértett</small><b>{breached}</b></div></article><article className={unassigned?'warn':''}><Users/><div><small>Kiosztatlan</small><b>{unassigned}</b></div></article><article className={healthy?'good':''}>{healthy?<CheckCircle2/>:<AlertTriangle/>}<div><small>Vezetői állapot</small><b>{healthy?'RENDBEN':critical?'AZONNALI BEAVATKOZÁS':'ELLENŐRZENDŐ'}</b></div></article></div>}</section>
}
