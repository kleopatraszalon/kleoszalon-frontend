import React,{useCallback,useEffect,useMemo,useState}from'react';
import axios from'axios';
import{Gauge,RefreshCw,TrendingUp,Users,MapPin}from'lucide-react';
import'./SaasFranchiseAdminPage.css';

const API_BASE=window.location.hostname==='localhost'||window.location.hostname==='127.0.0.1'?'http://localhost:5000/api':'https://kleoszalon-api-1.onrender.com/api';
const authConfig=()=>{const token=localStorage.getItem('kleo_token')||localStorage.getItem('token');return{withCredentials:true,headers:token?{Authorization:`Bearer ${token}`}:{}}};
type Plan={code:string;name:string;monthly_price:number|string;max_locations:number|null;max_users:number|null};
type Tenant={id:string;slug:string;name:string;status:string;subscription_status?:string|null;plan_code?:string|null;plan_name?:string|null;location_count:number;user_count:number};
type Meter={used:number;limit:number|null;percent:number|null;near:boolean;exceeded:boolean};
const meter=(used:number,limit:number|null):Meter=>{if(limit==null||limit<=0)return{used,limit:null,percent:null,near:false,exceeded:false};const percent=Math.round((used/limit)*100);return{used,limit,percent,near:percent>=80,exceeded:used>limit}};
const fmt=(m:Meter)=>m.limit==null?`${m.used} / ∞`:`${m.used} / ${m.limit} (${m.percent}%)`;

export default function SaasQuotaUsagePanel(){
 const[plans,setPlans]=useState<Plan[]>([]),[tenants,setTenants]=useState<Tenant[]>([]),[loading,setLoading]=useState(false),[error,setError]=useState('');
 const load=useCallback(async()=>{setLoading(true);setError('');try{const[p,t]=await Promise.all([axios.get(`${API_BASE}/saas/platform/plans`,authConfig()),axios.get(`${API_BASE}/saas/platform/tenants`,authConfig())]);setPlans(Array.isArray(p.data?.rows)?p.data.rows:[]);setTenants(Array.isArray(t.data?.rows)?t.data.rows:[])}catch(e:any){if(e?.response?.status!==403)setError(e?.response?.data?.error||'A SaaS kvóták nem tölthetők be.')}finally{setLoading(false)}},[]);
 useEffect(()=>{void load()},[load]);
 const rows=useMemo(()=>tenants.filter(t=>t.slug!=='kleopatra').map(t=>{const plan=plans.find(p=>p.code===t.plan_code)||null;const locations=meter(Number(t.location_count||0),plan?.max_locations==null?null:Number(plan.max_locations));const users=meter(Number(t.user_count||0),plan?.max_users==null?null:Number(plan.max_users));const candidates=plans.filter(p=>p.code!=='internal'&&p.code!==plan?.code&&(p.max_locations==null||Number(p.max_locations)>=locations.used)&&(p.max_users==null||Number(p.max_users)>=users.used)).sort((a,b)=>Number(a.monthly_price||0)-Number(b.monthly_price||0));const currentPrice=Number(plan?.monthly_price||0);const upgrade=candidates.find(p=>Number(p.monthly_price||0)>currentPrice)||null;const state=locations.exceeded||users.exceeded?'exceeded':locations.near||users.near?'near':'ok';return{...t,plan,locations,users,upgrade,state}}),[tenants,plans]);
 const near=rows.filter(r=>r.state==='near').length,exceeded=rows.filter(r=>r.state==='exceeded').length,upgradeCandidates=rows.filter(r=>r.upgrade&&(r.state==='near'||r.state==='exceeded')).length;
 return <div className="saas-admin-page" style={{paddingBottom:0}}><section className="saas-panel"><div className="saas-panel-title"><div><h3>Csomagkvóták és kihasználtság</h3><p>Telephely- és felhasználólimit valós idejű kihasználtsága, limitközeli tenantok és csomagváltási javaslat.</p></div><Gauge size={20}/></div>{error&&<div className="saas-alert is-error">{error}</div>}
 <div className="saas-kpis"><article><MapPin/><div><strong>{rows.length}</strong><span>Mért tenant</span></div></article><article><Gauge/><div><strong>{near}</strong><span>80% feletti kihasználtság</span></div></article><article><Users/><div><strong>{exceeded}</strong><span>Limit feletti állapot</span></div></article><article><TrendingUp/><div><strong>{upgradeCandidates}</strong><span>Upgrade-jelölt</span></div></article></div>
 <div style={{display:'flex',justifyContent:'flex-end',marginTop:12}}><button type="button" className="is-secondary" onClick={()=>void load()} disabled={loading}><RefreshCw size={16}/>Frissítés</button></div>
 <div className="saas-table-wrap" style={{marginTop:12}}><table><thead><tr><th>Tenant</th><th>Csomag</th><th>Telephely</th><th>Felhasználó</th><th>Kvótaállapot</th><th>Javasolt csomag</th></tr></thead><tbody>{rows.length?rows.map(r=><tr key={r.id}><td><strong>{r.name}</strong><br/><small>{r.slug}</small></td><td>{r.plan?.name||r.plan_name||r.plan_code||'—'}</td><td>{fmt(r.locations)}</td><td>{fmt(r.users)}</td><td>{r.state==='exceeded'?<b>Limit felett</b>:r.state==='near'?<b>Upgrade közelében</b>:'Rendben'}</td><td>{r.state!=='ok'?(r.upgrade?.name||'Egyedi / Enterprise'): '—'}</td></tr>):<tr><td colSpan={6}>Nincs mérhető külső SaaS tenant.</td></tr>}</tbody></table></div>
 </section></div>;
}
