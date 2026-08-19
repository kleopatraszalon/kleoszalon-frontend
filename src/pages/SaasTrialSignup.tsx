import React,{useEffect,useMemo,useRef,useState}from'react';
import{useNavigate,useSearchParams}from'react-router-dom';
import axios from'axios';
import{BadgeCheck,Building2,Check,Clock3,MapPin,ShieldCheck,Sparkles}from'lucide-react';
import'./SaasTrialSignup.css';

const API_BASE=window.location.hostname==='localhost'||window.location.hostname==='127.0.0.1'?'http://localhost:5000/api':'https://kleoszalon-api-1.onrender.com/api';
type Plan={code:string;name:string;monthly_price:number|string;annual_price:number|string;currency:string;max_locations:number;max_users:number;trial_days:number;recommended:boolean;booking_commission_percent:number|string;features?:Record<string,boolean>};
const money=(v:number|string,c='HUF')=>new Intl.NumberFormat('hu-HU',{style:'currency',currency:c,maximumFractionDigits:0}).format(Number(v||0));
const requestKey=()=>typeof crypto!=='undefined'&&'randomUUID'in crypto?crypto.randomUUID():`signup-${Date.now()}-${Math.random().toString(36).slice(2)}`;

export default function SaasTrialSignup(){
 const navigate=useNavigate(),[params]=useSearchParams();const initialPlan=String(params.get('plan')||'pro').toLowerCase();
 const[plans,setPlans]=useState<Plan[]>([]),[planCode,setPlanCode]=useState(initialPlan==='start'?'start':'pro'),[interval,setInterval]=useState<'month'|'year'>('month');
 const[form,setForm]=useState({company_name:'',legal_name:'',tax_number:'',owner_email:'',location_name:'',city:'',address:'',terms_accepted:false,privacy_accepted:false,marketing_consent:false,website:''});
 const[loading,setLoading]=useState(false),[error,setError]=useState(''),[done,setDone]=useState<any>(null),[plansLoading,setPlansLoading]=useState(true);const idempotency=useRef(requestKey());
 useEffect(()=>{let live=true;(async()=>{try{const r=await axios.get(`${API_BASE}/saas/self-service/plans`,{withCredentials:false});if(live)setPlans(Array.isArray(r.data?.plans)?r.data.plans:[]);}catch(e:any){if(live)setError(e?.response?.data?.error||'A SaaS csomagok nem tölthetők be.');}finally{if(live)setPlansLoading(false)}})();return()=>{live=false}},[]);
 const selected=useMemo(()=>plans.find(p=>p.code===planCode),[plans,planCode]);
 const change=(e:React.ChangeEvent<HTMLInputElement>)=>{const t=e.target;setForm(v=>({...v,[t.name]:t.type==='checkbox'?t.checked:t.value}))};
 const submit=async(e:React.FormEvent)=>{e.preventDefault();setLoading(true);setError('');try{const r=await axios.post(`${API_BASE}/saas/self-service/signup`,{...form,legal_name:form.legal_name||form.company_name,location_name:form.location_name||form.company_name,plan_code:planCode,billing_interval:interval},{headers:{'Idempotency-Key':idempotency.current},withCredentials:false});setDone(r.data);}catch(err:any){setError(err?.response?.data?.error||'A próbaregisztráció nem sikerült.');}finally{setLoading(false)}};
 if(done)return <div className="saas-signup-page"><section className="saas-signup-success"><div className="saas-success-icon"><BadgeCheck size={42}/></div><span className="saas-signup-kicker">KLEO SAAS</span><h1>{done.activation_required?'Ellenőrizze az e-mail fiókját':'A próbaidő elindult'}</h1><p>{done.activation_required?'A tenant, az első telephely és a kiválasztott modulok előkészültek. Az adminisztrátori aktiváló link megnyitásakor indul a 14 napos próbaidő.':'A fiók már létezett, ezért a tenant aktiválása és a próbaidő indítása automatikusan megtörtént.'}</p><div className="saas-success-meta"><span><Building2 size={17}/>{done.signup?.tenant_name||form.company_name}</span><span><Sparkles size={17}/>{String(done.signup?.plan_code||planCode).toUpperCase()}</span></div><button type="button" onClick={()=>navigate('/login')}>Belépés</button></section></div>;
 return <div className="saas-signup-page"><main className="saas-signup-shell">
  <header><span className="saas-signup-kicker"><Sparkles size={15}/> KLEO SAAS</span><h1>Indítsa el a szalonját 14 napos próbaidővel</h1><p>Bankkártya nélkül. A próbaidő csak az e-mailes tulajdonosi aktiválás után indul.</p></header>
  <div className="saas-plan-switch">{plansLoading?<span>Csomagok betöltése…</span>:plans.map(p=><button type="button" key={p.code} className={planCode===p.code?'active':''} onClick={()=>setPlanCode(p.code)}><strong>{p.name}</strong>{p.recommended&&<em>AJÁNLOTT</em>}<span>{money(interval==='year'?p.annual_price:p.monthly_price,p.currency)} / {interval==='year'?'év':'hó'}</span><small>{p.max_locations} telephely · {p.max_users} felhasználó · {p.trial_days} nap próba</small></button>)}</div>
  <div className="saas-billing-toggle"><button type="button" className={interval==='month'?'active':''} onClick={()=>setInterval('month')}>Havi</button><button type="button" className={interval==='year'?'active':''} onClick={()=>setInterval('year')}>Éves · 2 hónap kedvezmény</button></div>
  {selected&&<div className="saas-trial-strip"><Clock3 size={18}/><span><b>{selected.trial_days} nap ingyenes próba</b> · {selected.booking_commission_percent}% foglalási jutalék · fizetés csak a próbaidő után</span></div>}
  {error&&<div className="saas-signup-error">{error}</div>}
  <form onSubmit={submit} className="saas-signup-form">
   <section><h2><Building2 size={20}/> Cégadatok</h2><div className="saas-form-grid"><label>Szalon / cég neve<input name="company_name" value={form.company_name} onChange={change} required/></label><label>Hivatalos cégnév<input name="legal_name" value={form.legal_name} onChange={change} placeholder="Ha eltér a szalon nevétől"/></label><label>Adószám<input name="tax_number" value={form.tax_number} onChange={change}/></label><label>Tulajdonos e-mail<input type="email" name="owner_email" value={form.owner_email} onChange={change} required/></label></div></section>
   <section><h2><MapPin size={20}/> Első telephely</h2><div className="saas-form-grid"><label>Telephely neve<input name="location_name" value={form.location_name} onChange={change} placeholder="Alapértelmezés: cégnév"/></label><label>Város<input name="city" value={form.city} onChange={change} required/></label><label className="wide">Cím<input name="address" value={form.address} onChange={change}/></label></div></section>
   <input className="saas-honeypot" tabIndex={-1} autoComplete="off" name="website" value={form.website} onChange={change}/>
   <section className="saas-consents"><label><input type="checkbox" name="terms_accepted" checked={form.terms_accepted} onChange={change} required/><span><ShieldCheck size={17}/> Elfogadom a SaaS ÁSZF-et.</span></label><label><input type="checkbox" name="privacy_accepted" checked={form.privacy_accepted} onChange={change} required/><span><ShieldCheck size={17}/> Elfogadom az adatkezelési tájékoztatót.</span></label><label><input type="checkbox" name="marketing_consent" checked={form.marketing_consent} onChange={change}/><span>Termékfrissítéseket és tippeket is kérek.</span></label></section>
   <div className="saas-signup-summary"><div><small>Kiválasztott csomag</small><strong>{selected?.name||planCode.toUpperCase()}</strong></div><div><small>Próbaidő</small><strong>14 nap</strong></div><div><small>Most fizetendő</small><strong>0 Ft</strong></div></div>
   <button className="saas-start-button" type="submit" disabled={loading||plansLoading}><Check size={18}/>{loading?'Tenant létrehozása…':'14 napos próba indítása'}</button>
  </form>
  <footer>Már van KleoSaaS fiókja? <button type="button" onClick={()=>navigate('/login')}>Belépés</button></footer>
 </main></div>;
}
