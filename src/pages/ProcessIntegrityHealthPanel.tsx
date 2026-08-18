import React,{useCallback,useEffect,useState}from'react';
import{AlertTriangle,CheckCircle2,RefreshCw,Workflow,XCircle}from'lucide-react';
import api from'../api';

type Status='ok'|'warning'|'critical';
type Process={key:string;label:string;status:Status;entity_count:number;exception_count:number};
type Result={business_date:string;status:Status;exception_count:number;processes:Process[];generated_at:string};
const yesterday=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Budapest',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(Date.now()-86400000));
const names:Record<string,string>={finance:'Pénzügyi lánc',stock:'Készletintegritás',procurement:'Beszerzési lánc',system:'Rendszer-invariánsok'};
const icon=(s:Status)=>s==='ok'?<CheckCircle2/>:s==='warning'?<AlertTriangle/>:<XCircle/>;

export default function ProcessIntegrityHealthPanel(){
 const[data,setData]=useState<Result|null>(null),[loading,setLoading]=useState(false),[error,setError]=useState('');
 const load=useCallback(async()=>{setLoading(true);setError('');try{const q=new URLSearchParams({date:yesterday()});const locationId=localStorage.getItem('kleo_location_id')||'';if(locationId)q.set('location_id',locationId);const r=await api.get(`/api/transactions/notifications/reconciliation/process-integrity?${q}`);setData(r.data)}catch(e:any){setError(e?.response?.data?.message||'A folyamatintegritási állapot nem tölthető be.')}finally{setLoading(false)}},[]);
 useEffect(()=>{void load()},[load]);
 return <div className="health-page"><section className="health-card"><div className="health-card-head"><div><h2><Workflow size={20}/> Üzleti folyamatintegritás</h2><small>{data?`${data.business_date} · ${data.exception_count} kivétel`:'Előző üzleti nap teljes lánckontrollja'}</small></div><button onClick={load} disabled={loading}><RefreshCw size={15}/> {loading?'Frissítés…':'Frissítés'}</button></div>{error&&<div className="health-error">{error}</div>}{data&&<div className="health-list">{data.processes.map(p=><div className={`health-row ${p.status==='critical'?'error':p.status}`} key={p.key}><div className="health-icon">{icon(p.status)}</div><div><b>{names[p.key]||p.key}</b><small>{p.label}</small></div><div className="health-meta"><span>{p.entity_count} ellenőrzött</span><span>{p.exception_count} kivétel</span></div></div>)}</div>}{data?.status==='ok'&&<div className="health-notice">Az előző üzleti nap minden kritikus üzleti lánca konzisztensen zárt.</div>}</section></div>
}
