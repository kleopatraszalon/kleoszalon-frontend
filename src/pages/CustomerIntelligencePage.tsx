import React,{useEffect,useMemo,useState}from"react";
import axios from"axios";
import{BrainCircuit,Check,CheckCircle2,Clock3,RefreshCw,Search,ShieldCheck,Sparkles,UserRoundCheck,UsersRound,X}from"lucide-react";
import"./CustomerIntelligencePage.css";

const API_BASE=window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1"?"http://localhost:5000/api":"https://kleoszalon-api-1.onrender.com/api";

type Recommendation={
 client_id:string;name:string;email?:string|null;phone?:string|null;visits:number;no_shows:number;last_visit?:string|null;next_visit?:string|null;lifetime_value:number;
 recency_days?:number|null;value_tier:"new"|"standard"|"loyal"|"vip";risk_level:"low"|"medium"|"high";action_code:string;action_title:string;action_reason:string;priority:number;
 suggested_channel:"email"|"sms"|"phone"|"in_app"|"none";marketing_allowed:boolean;
};
type Overview={
 ok:boolean;engine?:{version:string;explainable:boolean;automatic_sending:boolean};scope?:{tenant_id:string;tenant:string;location_id?:string|null};
 summary:{clients:number;high_priority:number;at_risk:number;vip:number;without_next_booking:number;marketing_blocked:number;potential_value:number};
 action_mix:Array<{action_code:string;title:string;count:number}>;rows:Recommendation[];
};

const auth=()=>{const token=localStorage.getItem("kleo_token")||localStorage.getItem("token");return{withCredentials:true,headers:token?{Authorization:`Bearer ${token}`}:{}}};};
const huf=(v:number)=>new Intl.NumberFormat("hu-HU",{style:"currency",currency:"HUF",maximumFractionDigits:0}).format(Number(v||0));
const date=(v?:string|null)=>v?new Intl.DateTimeFormat("hu-HU",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(v)):"—";
const tier=(v:Recommendation["value_tier"])=>v==="vip"?"VIP":v==="loyal"?"Törzsvendég":v==="new"?"Új":"Normál";
const risk=(v:Recommendation["risk_level"])=>v==="high"?"Magas":v==="medium"?"Közepes":"Alacsony";
const channel=(v:Recommendation["suggested_channel"])=>({email:"E-mail",sms:"SMS",phone:"Telefon",in_app:"VIR / személyes",none:"Nincs engedélyezett csatorna"}[v]||v);

export default function CustomerIntelligencePage(){
 const[data,setData]=useState<Overview|null>(null),[loading,setLoading]=useState(true),[error,setError]=useState(""),[q,setQ]=useState(""),[onlyPriority,setOnlyPriority]=useState(false),[busy,setBusy]=useState("");
 const load=async()=>{setLoading(true);setError("");try{const r=await axios.get(`${API_BASE}/clients/intelligence/overview?limit=500`,auth());setData(r.data);}catch(e:any){setError(e?.response?.data?.error||e?.message||"A Customer Intelligence nem tölthető be.");}finally{setLoading(false)}};
 useEffect(()=>{void load()},[]);
 const rows=useMemo(()=>{const needle=q.trim().toLowerCase();return(data?.rows||[]).filter(r=>(!onlyPriority||r.priority>=80)&&(!needle||r.name.toLowerCase().includes(needle)||(r.email||"").toLowerCase().includes(needle)||(r.phone||"").toLowerCase().includes(needle)||r.action_title.toLowerCase().includes(needle)));},[data,q,onlyPriority]);
 const record=async(row:Recommendation,status:"accepted"|"dismissed"|"completed")=>{setBusy(`${row.client_id}:${status}`);setError("");try{await axios.post(`${API_BASE}/clients/intelligence/actions`,{client_id:row.client_id,action_code:row.action_code,status,channel:row.suggested_channel},auth());await load();}catch(e:any){const changed=e?.response?.data?.code==="NBA_RECOMMENDATION_CHANGED";setError(changed?"Az ajánlás időközben megváltozott; a lista frissül.":e?.response?.data?.error||"A Next Best Action eseményt nem sikerült menteni.");if(changed)await load();}finally{setBusy("")}};
 if(loading&&!data)return <div className="ci-state"><RefreshCw className="ci-spin" size={22}/> Customer Intelligence betöltése…</div>;
 return <div className="ci-page">
  <header className="ci-hero"><div><div className="ci-kicker"><BrainCircuit size={18}/> Customer Intelligence v19</div><h1>Next Best Action</h1><p>Magyarázható, tenant- és telephely-scope-olt ügyfélintelligencia. A rendszer prioritást és következő lépést javasol, de marketingüzenetet nem küld automatikusan.</p></div><button className="ci-refresh" onClick={()=>void load()}><RefreshCw size={17}/> Frissítés</button></header>
  {error&&<div className="ci-error">{error}</div>}
  <section className="ci-cards">
   <article><UsersRound/><span>Elemzett vendég</span><strong>{data?.summary.clients||0}</strong></article>
   <article><Sparkles/><span>Magas prioritás</span><strong>{data?.summary.high_priority||0}</strong></article>
   <article><Clock3/><span>Magas lemorzsolódási kockázat</span><strong>{data?.summary.at_risk||0}</strong></article>
   <article><UserRoundCheck/><span>VIP vendég</span><strong>{data?.summary.vip||0}</strong></article>
   <article><ShieldCheck/><span>Marketing által blokkolt</span><strong>{data?.summary.marketing_blocked||0}</strong></article>
   <article><BrainCircuit/><span>Becsült ügyfélérték</span><strong>{huf(data?.summary.potential_value||0)}</strong></article>
  </section>
  <section className="ci-engine"><div><CheckCircle2 size={18}/><b>{data?.engine?.version||"nba-v1"}</b><span>magyarázható szabálymotor</span></div><div><ShieldCheck size={18}/><span>Automatikus küldés: <b>{data?.engine?.automatic_sending?"BE":"KI"}</b></span></div><div><span>Tenant: <b>{data?.scope?.tenant||"—"}</b>{data?.scope?.location_id?` · telephely: ${data.scope.location_id}`:""}</span></div></section>
  <section className="ci-actionmix"><h2>Ajánlási mix</h2><div>{(data?.action_mix||[]).slice(0,8).map(x=><span key={x.action_code}><b>{x.count}</b> {x.title}</span>)}</div></section>
  <section className="ci-toolbar"><label><Search size={16}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Vendég vagy ajánlás keresése…"/></label><button className={onlyPriority?"active":""} onClick={()=>setOnlyPriority(v=>!v)}><Sparkles size={16}/> Csak 80+ prioritás</button><span>{rows.length} találat</span></section>
  <div className="ci-table-wrap"><table className="ci-table"><thead><tr><th>Prioritás</th><th>Vendég</th><th>Érték / kockázat</th><th>Utolsó / következő</th><th>Next Best Action</th><th>Csatorna</th><th>Művelet</th></tr></thead><tbody>{rows.map(row=><tr key={row.client_id}>
   <td><span className={`ci-priority p${row.priority>=80?"high":row.priority>=60?"mid":"low"}`}>{row.priority}</span></td>
   <td><b>{row.name}</b><small>{row.visits} látogatás · {row.no_shows} no-show</small></td>
   <td><b>{huf(row.lifetime_value)}</b><small>{tier(row.value_tier)} · {risk(row.risk_level)} kockázat</small></td>
   <td><span>{date(row.last_visit)}</span><small>Következő: {date(row.next_visit)}</small></td>
   <td className="ci-action-cell"><b>{row.action_title}</b><small>{row.action_reason}</small></td>
   <td><span className={row.marketing_allowed?"ci-channel":"ci-channel blocked"}>{channel(row.suggested_channel)}</span></td>
   <td><div className="ci-buttons"><button title="Elfogadom" disabled={!!busy} onClick={()=>void record(row,"accepted")}><Check size={15}/></button><button title="Elvégezve" disabled={!!busy} onClick={()=>void record(row,"completed")}><CheckCircle2 size={15}/></button><button title="Elvetem" disabled={!!busy} onClick={()=>void record(row,"dismissed")}><X size={15}/></button></div></td>
  </tr>)}{!rows.length&&<tr><td colSpan={7} className="ci-empty">Nincs a szűrésnek megfelelő ajánlás.</td></tr>}</tbody></table></div>
 </div>;
}
