import React,{useCallback,useEffect,useMemo,useState}from"react";
import axios from"axios";
import{AlertTriangle,Mail,RefreshCw,ShieldAlert}from"lucide-react";
import"./SaasFranchiseAdminPage.css";

const API_BASE=window.location.hostname==='localhost'||window.location.hostname==='127.0.0.1'?'http://localhost:5000/api':'https://kleoszalon-api-1.onrender.com/api';
const authConfig=()=>{const token=localStorage.getItem('kleo_token')||localStorage.getItem('token');return{withCredentials:true,headers:token?{Authorization:`Bearer ${token}`}:{}}};
const STEP_LABELS:Record<string,string>={company:'Cégadatok hiányoznak',admin:'Első admin aktiválása szükséges',location:'Első telephely hiányzik',branding:'Arculat nincs kész',modules:'Modulbeállítás hiányzik',subscription:'Előfizetés nincs kész',ready:'Üzemkész'};

type RecoveryTenant={id:string;slug:string;name:string;status:string;onboarding_ready?:boolean;onboarding_progress?:number;onboarding_next_step?:string|null;admin_invitation_status?:string|null;admin_invitation_email?:string|null;admin_invitation_expires_at?:string|null};

export default function ProvisioningRecoveryPanel(){
 const[rows,setRows]=useState<RecoveryTenant[]>([]),[allowed,setAllowed]=useState<boolean|null>(null),[loading,setLoading]=useState(false),[savingId,setSavingId]=useState(''),[error,setError]=useState(''),[message,setMessage]=useState('');
 const load=useCallback(async()=>{setLoading(true);setError('');try{const r=await axios.get(`${API_BASE}/saas/platform/tenants`,authConfig());setRows(Array.isArray(r.data?.rows)?r.data.rows:[]);setAllowed(true)}catch(e:any){if(e?.response?.status===403){setAllowed(false);return}setAllowed(true);setError(e?.response?.data?.error||'A provisioning recovery lista nem tölthető be.')}finally{setLoading(false)}},[]);
 useEffect(()=>{void load()},[load]);
 const attention=useMemo(()=>rows.filter(r=>r.slug!=='kleopatra'&&!r.onboarding_ready&&r.status!=='cancelled'),[rows]);
 const retryInvite=async(row:RecoveryTenant)=>{const email=String(row.admin_invitation_email||'').trim();if(!email)return;setSavingId(row.id);setError('');setMessage('');try{const r=await axios.post(`${API_BASE}/saas/platform/tenants/${row.id}/admin-invitation`,{email},authConfig());setMessage(r.data?.message||`${row.name}: admin meghívó újraküldve.`);await load()}catch(e:any){setError(e?.response?.data?.error||`${row.name}: az admin meghívó nem küldhető újra.`)}finally{setSavingId('')}};
 if(allowed===false||(!loading&&!attention.length))return null;
 return <div className="saas-admin-page" style={{paddingBottom:0}}><section className="saas-panel">
  <div className="saas-panel-title"><div><h3>Provisioning recovery center</h3><p>Félkész vagy beavatkozást igénylő SaaS tenantok. A rendszer csak célzott, idempotens helyreállítási műveleteket enged.</p></div><ShieldAlert size={22}/></div>
  {error&&<div className="saas-alert is-error">{error}</div>}{message&&<div className="saas-alert is-success">{message}</div>}
  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:12,marginBottom:12}}><span><b>{attention.length}</b> tenant igényel beavatkozást.</span><button type="button" className="is-secondary" disabled={loading} onClick={()=>void load()}><RefreshCw size={16}/>Frissítés</button></div>
  <div className="saas-table-wrap"><table><thead><tr><th>Tenant</th><th>Készültség</th><th>Probléma</th><th>Admin meghívó</th><th>Helyreállítás</th></tr></thead><tbody>{attention.map(row=>{
   const step=String(row.onboarding_next_step||'');const inviteStatus=String(row.admin_invitation_status||'');const retryable=step==='admin'&&Boolean(row.admin_invitation_email)&&['pending','expired','revoked'].includes(inviteStatus);
   return <tr key={row.id}><td><b>{row.name}</b><br/><small>{row.slug}</small></td><td>{Number(row.onboarding_progress||0)}%</td><td><span style={{display:'inline-flex',alignItems:'center',gap:6}}><AlertTriangle size={15}/>{STEP_LABELS[step]||step||'Onboarding befejezése szükséges'}</span></td><td>{row.admin_invitation_email?<><span>{inviteStatus||'ismeretlen'}</span><br/><small>{row.admin_invitation_email}</small>{row.admin_invitation_expires_at&&<><br/><small>Lejár: {new Date(row.admin_invitation_expires_at).toLocaleString('hu-HU')}</small></>}</>:'—'}</td><td>{retryable?<button type="button" disabled={savingId===row.id} onClick={()=>void retryInvite(row)}><Mail size={16}/>{savingId===row.id?'Küldés…':'Admin meghívó újraküldése'}</button>:<span>Folytatás a Tenant onboarding panelen: <b>{step||'checklist'}</b></span>}</td></tr>})}</tbody></table></div>
 </section></div>;
}
