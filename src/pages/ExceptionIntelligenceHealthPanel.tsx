import{useCallback,useEffect,useState}from'react';
import{AlertTriangle,CheckCircle2,ExternalLink,GitMerge,Network,RefreshCw,ShieldAlert,TrendingUp}from'lucide-react';
import{useNavigate}from'react-router-dom';
import api from'../api';
import'./ExceptionIntelligenceHealthPanel.css';

const BASE='/api/transactions/notifications/exceptions';
export default function ExceptionIntelligenceHealthPanel(){
 const navigate=useNavigate();const[data,setData]=useState<any>(null),[loading,setLoading]=useState(false),[error,setError]=useState('');const locationId=localStorage.getItem('kleo_location_id')||'';
 const load=useCallback(async()=>{setLoading(true);setError('');try{const q=new URLSearchParams({days:'7'});if(locationId)q.set('location_id',locationId);const r=await api.get(`${BASE}/intelligence/dashboard?${q.toString()}`);setData(r.data)}catch(e:any){setError(e?.response?.data?.message||'Az Exception Intelligence állapota nem tölthető be.')}finally{setLoading(false)}},[locationId]);
 useEffect(()=>{void load();const t=window.setInterval(()=>void load(),60_000);return()=>window.clearInterval(t)},[load]);
 const h=data?.health||{};const score=Number(h.score??0);const healthy=data&&score>=80&&Number(h.critical||0)===0;
 return <section className={`eih-panel ${healthy?'ok':score<60?'critical':'warning'}`}><header><div><span>EXCEPTION INTELLIGENCE</span><h2><Network/> Korreláció és eszkaláció health</h2><p>Root-cause klaszterek, ismétlődés, SLA és automatikus eszkaláció vezetői állapota.</p></div><div className="eih-actions"><button onClick={load} disabled={loading}><RefreshCw className={loading?'spin':''}/>{loading?'Frissítés…':'Frissítés'}</button><button className="open" onClick={()=>navigate('/finance/exception-command-center/intelligence')}><ExternalLink/> Intelligence</button></div></header>{error&&<div className="eih-error"><AlertTriangle/>{error}</div>}{data&&<div className="eih-stats"><article className={score<60?'danger':score<80?'warn':'good'}>{healthy?<CheckCircle2/>:<ShieldAlert/>}<div><small>Health score</small><b>{score}/100</b></div></article><article><GitMerge/><div><small>Root-cause klaszter</small><b>{h.active_clusters||0}</b></div></article><article><TrendingUp/><div><small>Ismétlődési esemény</small><b>{h.recurrence_events||0}</b></div></article><article className={Number(h.critical)>0?'danger':''}><ShieldAlert/><div><small>Kritikus aktív</small><b>{h.critical||0}</b></div></article></div>}</section>
}
