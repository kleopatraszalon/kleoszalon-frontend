import{useCallback,useEffect,useState}from'react';
import{AlertTriangle,CheckCircle2,Clock3,ExternalLink,MonitorPlay,RefreshCw,ShieldAlert,Users}from'lucide-react';
import{useNavigate}from'react-router-dom';
import api from'../api';
import'./MajorIncidentHealthPanel.css';

const BASE='/api/transactions/notifications/exceptions/intelligence/major-incidents';
export default function MajorIncidentHealthPanel(){
 const navigate=useNavigate();const[data,setData]=useState<any>(null),[loading,setLoading]=useState(false),[error,setError]=useState('');const locationId=localStorage.getItem('kleo_location_id')||'';
 const load=useCallback(async()=>{setLoading(true);setError('');try{const q=locationId?`?location_id=${encodeURIComponent(locationId)}`:'';const r=await api.get(`${BASE}/summary${q}`);setData(r.data)}catch(e:any){setError(e?.response?.data?.message||'A Major Incident állapot nem tölthető be.')}finally{setLoading(false)}},[locationId]);
 useEffect(()=>{void load();const t=window.setInterval(()=>void load(),45_000);return()=>window.clearInterval(t)},[load]);
 const sev1=Number(data?.sev1||0),sev2=Number(data?.sev2||0),missing=Number(data?.commander_missing||0),overdue=Number(data?.overdue_actions||0),post=Number(data?.awaiting_postmortem||0);const healthy=data&&sev1===0&&sev2===0&&missing===0&&overdue===0;
 return <section className={`mi-health ${healthy?'ok':sev1?'critical':'warning'}`}><header><div><span>MAJOR INCIDENT MANAGEMENT</span><h2><MonitorPlay/> War Room readiness</h2><p>Automatikusan deklarált Major Incidentek, command team, akciók és post-mortem governance állapota.</p></div><div><button onClick={load} disabled={loading}><RefreshCw className={loading?'spin':''}/>{loading?'Frissítés…':'Frissítés'}</button><button className="open" onClick={()=>navigate('/finance/exception-command-center/major-incidents')}><ExternalLink/> War Room</button></div></header>{error&&<div className="mi-health-error"><AlertTriangle/>{error}</div>}{data&&<section><article className={sev1?'danger':''}><ShieldAlert/><div><small>SEV1 aktív</small><b>{sev1}</b></div></article><article className={sev2?'warn':''}><MonitorPlay/><div><small>SEV2 aktív</small><b>{sev2}</b></div></article><article className={missing?'warn':''}><Users/><div><small>Commander hiányzik</small><b>{missing}</b></div></article><article className={overdue?'danger':''}><Clock3/><div><small>Lejárt akció</small><b>{overdue}</b></div></article><article className={post?'warn':'good'}><CheckCircle2/><div><small>Post-mortem vár</small><b>{post}</b></div></article></section>}</section>
}
