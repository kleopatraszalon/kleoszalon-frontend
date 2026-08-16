import React,{useCallback,useEffect,useMemo,useState}from"react";
import axios from"axios";
import{Building2,CheckCircle2,Clock3,Plus,RefreshCw,Rocket,ShieldCheck,Store,Users}from"lucide-react";
import"./SaasFranchiseAdminPage.css";

const API_BASE=window.location.hostname==='localhost'||window.location.hostname==='127.0.0.1'?'http://localhost:5000/api':'https://kleoszalon-api-1.onrender.com/api';
const authConfig=()=>{const token=localStorage.getItem('kleo_token')||localStorage.getItem('token');return{withCredentials:true,headers:token?{Authorization:`Bearer ${token}`}:{}}};
const PLAN_OPTIONS=[['start','Start'],['pro','Pro'],['franchise','Franchise'],['enterprise','Enterprise']];
const STEP_LABELS:Record<string,string>={company:'cégadatok',admin:'admin aktiválás',location:'telephely',branding:'arculat',modules:'modulok',subscription:'előfizetés',ready:'üzemkész'};

type TenantRow={
 id:string;slug:string;name:string;legal_name?:string|null;billing_email?:string|null;status:string;
 plan_code?:string|null;plan_name?:string|null;subscription_status?:string|null;location_count?:number;user_count?:number;franchise_location_count?:number;
 onboarding_status?:string|null;onboarding_progress?:number;onboarding_ready?:boolean;onboarding_next_step?:string|null;onboarding_started_at?:string|null;onboarding_completed_at?:string|null;
 admin_invitation_status?:string|null;admin_invitation_email?:string|null;admin_invitation_expires_at?:string|null;
};

type ProvisionForm={
 slug:string;name:string;legal_name:string;billing_email:string;plan_code:string;status:string;
 auto_invite_admin:boolean;admin_email:string;provision_location:boolean;location_name:string;location_city:string;location_address:string;location_email:string;apply_plan_modules:boolean;
};

const EMPTY_FORM:ProvisionForm={slug:'',name:'',legal_name:'',billing_email:'',plan_code:'start',status:'trial',auto_invite_admin:true,admin_email:'',provision_location:true,location_name:'',location_city:'',location_address:'',location_email:'',apply_plan_modules:true};

function invitationLabel(row:TenantRow){
 if(row.onboarding_ready||row.onboarding_next_step!=='admin')return row.user_count?'Admin aktív':'—';
 if(row.admin_invitation_status==='pending')return 'Meghívó kiküldve';
 if(row.admin_invitation_status==='expired')return 'Meghívó lejárt';
 if(row.admin_invitation_status==='revoked')return 'Meghívó visszavonva';
 if(row.admin_invitation_status==='accepted')return 'Admin aktiválva';
 return 'Meghívás szükséges';
}

export default function PlatformTenantPanel(){
 const[rows,setRows]=useState<TenantRow[]>([]),[allowed,setAllowed]=useState<boolean|null>(null),[loading,setLoading]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const[form,setForm]=useState<ProvisionForm>(EMPTY_FORM);
 const load=useCallback(async()=>{setLoading(true);setError('');try{const r=await axios.get(`${API_BASE}/saas/platform/tenants`,authConfig());setRows(Array.isArray(r.data?.rows)?r.data.rows:[]);setAllowed(true)}catch(e:any){if(e?.response?.status===403){setAllowed(false);return}setError(e?.response?.data?.error||'A platform tenant lista nem tölthető be.');setAllowed(true)}finally{setLoading(false)}},[]);
 useEffect(()=>{void load()},[load]);
 const customerRows=useMemo(()=>rows.filter(r=>r.slug!=='kleopatra'),[rows]);
 const createTenant=async(e:React.FormEvent)=>{e.preventDefault();setSaving(true);setError('');setMessage('');try{const r=await axios.post(`${API_BASE}/saas/platform/tenants`,form,authConfig());const p=r.data?.provisioning;const invite=p?.admin_invitation?.status;const details=[p?.default_location?.created?'alap telephely kész':null,p?.plan_modules?.applied?.length?`${p.plan_modules.applied.length} modul beállítva`:null,invite==='sent'?'admin meghívó elküldve':invite==='assigned'?'admin hozzárendelve':invite==='failed'?'admin meghívó újraküldendő':null].filter(Boolean).join(' · ');setForm(EMPTY_FORM);setMessage(`${r.data?.tenant?.name||'Az új tenant'} létrejött, az onboarding automatikusan elindult${details?` · ${details}`:''}.`);await load()}catch(e:any){setError(e?.response?.data?.error||'Az új tenant nem hozható létre.')}finally{setSaving(false)}};
 const changeStatus=async(row:TenantRow,status:string)=>{if(row.slug==='kleopatra'&&status!=='active')return;setSaving(true);setError('');setMessage('');try{await axios.patch(`${API_BASE}/saas/platform/tenants/${row.id}/status`,{status},authConfig());setMessage(`${row.name} státusza frissült.`);await load()}catch(e:any){setError(e?.response?.data?.error||'A tenant státusza nem módosítható.')}finally{setSaving(false)}};
 if(allowed===false)return null;
 return <div className="saas-admin-page" style={{paddingBottom:0}}>
  <section className="saas-panel">
   <div className="saas-panel-title"><div><h3>Platform tenantok / SaaS provisioning</h3><p>Központi ügyfél-, csomag-, tenant-életciklus és onboarding állapot. A készültség mindig a tényleges tenant erőforrásokból számolódik.</p></div><ShieldCheck size={20}/></div>
   {error&&<div className="saas-alert is-error">{error}</div>}{message&&<div className="saas-alert is-success">{message}</div>}
   <div className="saas-kpis">
    <article><Building2/><div><strong>{customerRows.length}</strong><span>SaaS ügyfél</span></div></article>
    <article><Rocket/><div><strong>{customerRows.filter(r=>r.onboarding_ready).length}</strong><span>Üzemkész tenant</span></div></article>
    <article><Clock3/><div><strong>{customerRows.filter(r=>!r.onboarding_ready).length}</strong><span>Onboarding alatt</span></div></article>
    <article><ShieldCheck/><div><strong>{customerRows.filter(r=>r.admin_invitation_status==='pending').length}</strong><span>Admin meghívó függőben</span></div></article>
   </div>
   <div className="saas-kpis" style={{marginTop:10}}>
    <article><Store/><div><strong>{rows.reduce((n,r)=>n+Number(r.location_count||0),0)}</strong><span>Összes telephely</span></div></article>
    <article><Users/><div><strong>{rows.reduce((n,r)=>n+Number(r.user_count||0),0)}</strong><span>Aktív tenant user</span></div></article>
    <article><CheckCircle2/><div><strong>{customerRows.length?Math.round(customerRows.reduce((n,r)=>n+Number(r.onboarding_progress||0),0)/customerRows.length):0}%</strong><span>Átlagos onboarding</span></div></article>
    <article><ShieldCheck/><div><strong>{rows.filter(r=>r.status==='active'||r.status==='trial').length}</strong><span>Aktív / trial</span></div></article>
   </div>
   <form onSubmit={createTenant} className="saas-form-grid" style={{marginTop:18}}>
    <label>Tenant azonosító<input value={form.slug} onChange={e=>setForm({...form,slug:e.target.value.toLowerCase()})} placeholder="beauty-company" required/></label>
    <label>Megjelenő név<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Beauty Company Kft." required/></label>
    <label>Jogi név<input value={form.legal_name} onChange={e=>setForm({...form,legal_name:e.target.value})}/></label>
    <label>Számlázási e-mail<input type="email" value={form.billing_email} onChange={e=>setForm({...form,billing_email:e.target.value})}/></label>
    <label>Csomag<select value={form.plan_code} onChange={e=>setForm({...form,plan_code:e.target.value})}>{PLAN_OPTIONS.map(([code,name])=><option key={code} value={code}>{name}</option>)}</select></label>
    <label>Induló státusz<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option value="trial">14 napos próba</option><option value="active">Aktív</option></select></label>

    <div style={{gridColumn:'1/-1',borderTop:'1px solid #e5e7eb',paddingTop:12}}><b>Egykattintásos provisioning</b><div style={{display:'flex',gap:18,flexWrap:'wrap',marginTop:8}}>
     <label style={{display:'inline-flex',flexDirection:'row',alignItems:'center',gap:7}}><input type="checkbox" checked={form.apply_plan_modules} onChange={e=>setForm({...form,apply_plan_modules:e.target.checked})}/>Csomag moduljainak automatikus beállítása</label>
     <label style={{display:'inline-flex',flexDirection:'row',alignItems:'center',gap:7}}><input type="checkbox" checked={form.auto_invite_admin} onChange={e=>setForm({...form,auto_invite_admin:e.target.checked})}/>Első admin automatikus meghívása</label>
     <label style={{display:'inline-flex',flexDirection:'row',alignItems:'center',gap:7}}><input type="checkbox" checked={form.provision_location} onChange={e=>setForm({...form,provision_location:e.target.checked})}/>Alap telephely létrehozása</label>
    </div></div>

    <label>Első admin e-mail<input type="email" value={form.admin_email} disabled={!form.auto_invite_admin} required={form.auto_invite_admin} onChange={e=>setForm({...form,admin_email:e.target.value})} placeholder="admin@ceg.hu"/></label>
    <label>Alap telephely neve<input value={form.location_name} disabled={!form.provision_location} required={form.provision_location} onChange={e=>setForm({...form,location_name:e.target.value})} placeholder="Központi szalon"/></label>
    <label>Telephely városa<input value={form.location_city} disabled={!form.provision_location} required={form.provision_location} onChange={e=>setForm({...form,location_city:e.target.value})} placeholder="Budapest"/></label>
    <label>Telephely címe<input value={form.location_address} disabled={!form.provision_location} onChange={e=>setForm({...form,location_address:e.target.value})}/></label>
    <label>Telephely e-mail<input type="email" value={form.location_email} disabled={!form.provision_location} onChange={e=>setForm({...form,location_email:e.target.value})}/></label>

    <button type="submit" disabled={saving} title="Új tenant + onboarding + provisioning"><Plus size={16}/>{saving?'Provisioning…':'Új tenant létrehozása + provisioning'}</button>
    <button type="button" className="is-secondary" onClick={()=>void load()} disabled={loading}><RefreshCw size={16}/>Frissítés</button>
   </form>
   <div className="saas-table-wrap" style={{marginTop:18}}><table><thead><tr><th>Tenant</th><th>Csomag</th><th>Státusz</th><th>Provisioning</th><th>Következő lépés</th><th>Első admin</th><th>Telephely</th><th>Felhasználó</th><th>Művelet</th></tr></thead><tbody>{rows.length?rows.map(r=>{
    const progress=Math.max(0,Math.min(100,Number(r.onboarding_progress||0)));
    const next=STEP_LABELS[String(r.onboarding_next_step||'')]||String(r.onboarding_next_step||'—');
    const invite=invitationLabel(r);
    return <tr key={r.id}>
     <td><b>{r.name}</b><br/><small>{r.slug}</small></td>
     <td>{r.plan_name||r.plan_code||'—'}</td>
     <td><span className={`saas-status-pill status-${r.status}`}>{r.status}</span></td>
     <td>{r.slug==='kleopatra'?<span>Központ</span>:<div style={{minWidth:130}}><div style={{display:'flex',justifyContent:'space-between',gap:8,fontSize:12}}><b>{progress}%</b><span>{r.onboarding_ready?'Üzemkész':'Folyamatban'}</span></div><div style={{height:7,background:'#e5e7eb',borderRadius:999,overflow:'hidden',marginTop:5}}><div style={{height:'100%',width:`${progress}%`,background:'currentColor'}}/></div></div>}</td>
     <td>{r.slug==='kleopatra'?'—':<><b>{next}</b>{r.admin_invitation_status==='pending'&&r.onboarding_next_step==='admin'?<><br/><small>aktiválásra vár</small></>:null}</>}</td>
     <td>{r.slug==='kleopatra'?'—':<><span>{invite}</span>{r.admin_invitation_email?<><br/><small>{r.admin_invitation_email}</small></>:null}{r.admin_invitation_status==='pending'&&r.admin_invitation_expires_at?<><br/><small>Lejár: {new Date(r.admin_invitation_expires_at).toLocaleString('hu-HU')}</small></>:null}</>}</td>
     <td>{Number(r.location_count||0)}</td><td>{Number(r.user_count||0)}</td>
     <td>{r.slug==='kleopatra'?<span>Központi tenant</span>:<select value={r.status} disabled={saving} onChange={e=>void changeStatus(r,e.target.value)}><option value="trial">Trial</option><option value="active">Aktív</option><option value="suspended">Felfüggesztett</option><option value="cancelled">Megszüntetett</option></select>}</td>
    </tr>}) : <tr><td colSpan={9}>{loading?'Tenantok betöltése…':'Nincs megjeleníthető tenant.'}</td></tr>}</tbody></table></div>
  </section>
 </div>;
}
