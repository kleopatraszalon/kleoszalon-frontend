import{useCallback,useEffect,useState}from'react';
import{AlertTriangle,CheckCircle2,ClipboardCheck,Clock3,ExternalLink,RefreshCw,ShieldAlert}from'lucide-react';
import{useNavigate}from'react-router-dom';
import api from'../api';
import'./ExceptionCapaHealthPanel.css';

const BASE='/api/transactions/notifications/exceptions/intelligence/capa';
export default function ExceptionCapaHealthPanel(){
 const navigate=useNavigate();const[data,setData]=useState<any>(null),[loading,setLoading]=useState(false),[error,setError]=useState('');const locationId=localStorage.getItem('kleo_location_id')||'';
 const load=useCallback(async()=>{setLoading(true);setError('');try{const q=locationId?`?location_id=${encodeURIComponent(locationId)}`:'';const r=await api.get(`${BASE}/summary${q}`);setData(r.data)}catch(e:any){setError(e?.response?.data?.message||'A CAPA állapot nem tölthető be.')}finally{setLoading(false)}},[locationId]);
 useEffect(()=>{void load();const t=window.setInterval(()=>void load(),60_000);return()=>window.clearInterval(t)},[load]);
 const critical=Number(data?.critical_open||0),overdue=Number(data?.overdue||0),verification=Number(data?.verification||0),verified=Number(data?.verified_30d||0);const healthy=data&&critical===0&&overdue===0;
 return <section className={`capa-health ${healthy?'ok':critical?'critical':'warning'}`}><header><div><span>CAPA GOVERNANCE</span><h2><ClipboardCheck/> Javító és megelőző intézkedések</h2><p>Root-cause klaszterekből képzett CAPA-k jóváhagyási, határidő- és verifikációs állapota.</p></div><div><button onClick={load} disabled={loading}><RefreshCw className={loading?'spin':''}/>{loading?'Frissítés…':'Frissítés'}</button><button className="open" onClick={()=>navigate('/finance/exception-command-center/capa')}><ExternalLink/> CAPA központ</button></div></header>{error&&<div className="capa-health-error"><AlertTriangle/>{error}</div>}{data&&<section><article className={critical?'danger':''}><ShieldAlert/><div><small>Kritikus nyitott</small><b>{critical}</b></div></article><article className={overdue?'danger':''}><Clock3/><div><small>Lejárt CAPA</small><b>{overdue}</b></div></article><article><ClipboardCheck/><div><small>Verifikációra vár</small><b>{verification}</b></div></article><article className={healthy?'good':''}><CheckCircle2/><div><small>Igazolt 30 nap</small><b>{verified}</b></div></article></section>}</section>
}
