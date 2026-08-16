import React,{useCallback,useEffect,useState}from"react";
import axios from"axios";
import{Building2,Plus,RefreshCw,ShieldCheck,Store,Users}from"lucide-react";
import"./SaasFranchiseAdminPage.css";

const API_BASE=window.location.hostname==='localhost'||window.location.hostname==='127.0.0.1'?'http://localhost:5000/api':'https://kleoszalon-api-1.onrender.com/api';
const authConfig=()=>{const token=localStorage.getItem('kleo_token')||localStorage.getItem('token');return{withCredentials:true,headers:token?{Authorization:`Bearer ${token}`}:{}}};
const PLAN_OPTIONS=[['start','Start'],['pro','Pro'],['franchise','Franchise'],['enterprise','Enterprise']];

type TenantRow={id:string;slug:string;name:string;legal_name?:string|null;billing_email?:string|null;status:string;plan_code?:string|null;plan_name?:string|null;subscription_status?:string|null;location_count?:number;user_count?:number;franchise_location_count?:number;};

export default function PlatformTenantPanel(){
 const[rows,setRows]=useState<TenantRow[]>([]),[allowed,setAllowed]=useState<boolean|null>(null),[loading,setLoading]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const[form,setForm]=useState({slug:'',name:'',legal_name:'',billing_email:'',plan_code:'start',status:'trial'});
 const load=useCallback(async()=>{setLoading(true);setError('');try{const r=await axios.get(`${API_BASE}/saas/platform/tenants`,authConfig());setRows(Array.isArray(r.data?.rows)?r.data.rows:[]);setAllowed(true)}catch(e:any){if(e?.response?.status===403){setAllowed(false);return}setError(e?.response?.data?.error||'A platform tenant lista nem tölthető be.');setAllowed(true)}finally{setLoading(false)}},[]);
 useEffect(()=>{void load()},[load]);
 const createTenant=async(e:React.FormEvent)=>{e.preventDefault();setSaving(true);setError('');setMessage('');try{await axios.post(`${API_BASE}/saas/platform/tenants`,form,authConfig());setForm({slug:'',name:'',legal_name:'',billing_email:'',plan_code:'start',status:'trial'});setMessage('Az új SaaS tenant és előfizetés létrejött.');await load()}catch(e:any){setError(e?.response?.data?.error||'Az új tenant nem hozható létre.')}finally{setSaving(false)}};
 const changeStatus=async(row:TenantRow,status:string)=>{if(row.slug==='kleopatra'&&status!=='active')return;setSaving(true);setError('');setMessage('');try{await axios.patch(`${API_BASE}/saas/platform/tenants/${row.id}/status`,{status},authConfig());setMessage(`${row.name} státusza frissült.`);await load()}catch(e:any){setError(e?.response?.data?.error||'A tenant státusza nem módosítható.')}finally{setSaving(false)}};
 if(allowed===false)return null;
 return <div className="saas-admin-page" style={{paddingBottom:0}}>
  <section className="saas-panel">
   <div className="saas-panel-title"><div><h3>Platform tenantok / SaaS ügyfelek</h3><p>Központi ügyfél-, csomag- és tenant-életciklus kezelés. Ez a blokk csak a Kleopátra központi rendszergazdájának látható.</p></div><ShieldCheck size={20}/></div>
   {error&&<div className="saas-alert is-error">{error}</div>}{message&&<div className="saas-alert is-success">{message}</div>}
   <div className="saas-kpis"><article><Building2/><div><strong>{rows.length}</strong><span>Tenant</span></div></article><article><Store/><div><strong>{rows.reduce((n,r)=>n+Number(r.location_count||0),0)}</strong><span>Összes telephely</span></div></article><article><Users/><div><strong>{rows.reduce((n,r)=>n+Number(r.user_count||0),0)}</strong><span>Aktív tenant user</span></div></article><article><ShieldCheck/><div><strong>{rows.filter(r=>r.status==='active'||r.status==='trial').length}</strong><span>Aktív / trial</span></div></article></div>
   <form onSubmit={createTenant} className="saas-form-grid" style={{marginTop:18}}>
    <label>Tenant azonosító<input value={form.slug} onChange={e=>setForm({...form,slug:e.target.value.toLowerCase()})} placeholder="beauty-company" required/></label>
    <label>Megjelenő név<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Beauty Company Kft." required/></label>
    <label>Jogi név<input value={form.legal_name} onChange={e=>setForm({...form,legal_name:e.target.value})}/></label>
    <label>Számlázási e-mail<input type="email" value={form.billing_email} onChange={e=>setForm({...form,billing_email:e.target.value})}/></label>
    <label>Csomag<select value={form.plan_code} onChange={e=>setForm({...form,plan_code:e.target.value})}>{PLAN_OPTIONS.map(([code,name])=><option key={code} value={code}>{name}</option>)}</select></label>
    <label>Induló státusz<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="trial">14 napos próba</option><option value="active">Aktív</option></select></label>
    <button type="submit" disabled={saving}><Plus size={16}/>{saving?'Mentés…':'Új tenant létrehozása'}</button>
    <button type="button" className="is-secondary" onClick={()=>void load()} disabled={loading}><RefreshCw size={16}/>Frissítés</button>
   </form>
   <div className="saas-table-wrap" style={{marginTop:18}}><table><thead><tr><th>Tenant</th><th>Csomag</th><th>Státusz</th><th>Telephely</th><th>Felhasználó</th><th>Franchise</th><th>Művelet</th></tr></thead><tbody>{rows.length?rows.map(r=><tr key={r.id}><td><b>{r.name}</b><br/><small>{r.slug}</small></td><td>{r.plan_name||r.plan_code||'—'}</td><td><span className={`saas-status-pill status-${r.status}`}>{r.status}</span></td><td>{Number(r.location_count||0)}</td><td>{Number(r.user_count||0)}</td><td>{Number(r.franchise_location_count||0)}</td><td>{r.slug==='kleopatra'?<span>Központi tenant</span>:<select value={r.status} disabled={saving} onChange={e=>void changeStatus(r,e.target.value)}><option value="trial">Trial</option><option value="active">Aktív</option><option value="suspended">Felfüggesztett</option><option value="cancelled">Megszüntetett</option></select>}</td></tr>):<tr><td colSpan={7}>{loading?'Tenantok betöltése…':'Nincs megjeleníthető tenant.'}</td></tr>}</tbody></table></div>
  </section>
 </div>;
}
