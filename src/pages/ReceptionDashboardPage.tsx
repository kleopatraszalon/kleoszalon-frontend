import React,{useEffect,useMemo,useState}from"react";
import{CalendarDays,ClipboardPlus,Clock3,RefreshCw,UsersRound}from"lucide-react";
import{useNavigate}from"react-router-dom";
import{useCurrentUser}from"../hooks/useCurrentUser";
import{apiFetch}from"../utils/api";

type Appointment={id:string;start_time:string;end_time:string;client_name?:string|null;title?:string|null;status?:string|null;employee_id?:string|null;employee_name?:string|null;service_names?:string[]|null};
type Employee={id:string;full_name?:string|null;short_name?:string|null;position_name?:string|null;qualification?:string|null;location_id?:string|null};
const norm=(v?:string|null)=>String(v||"confirmed").toLowerCase();
const hm=(v:string)=>new Date(v).toLocaleTimeString("hu-HU",{hour:"2-digit",minute:"2-digit"});
const today=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
function arr<T>(raw:any):T[]{return Array.isArray(raw)?raw:Array.isArray(raw?.items)?raw.items:Array.isArray(raw?.data)?raw.data:[]}

export default function ReceptionDashboardPage(){
 const navigate=useNavigate();const{user}=useCurrentUser() as any;const[appointments,setAppointments]=useState<Appointment[]>([]);const[employees,setEmployees]=useState<Employee[]>([]);const[loading,setLoading]=useState(true);const[error,setError]=useState("");
 const load=async()=>{setLoading(true);setError("");try{const date=today();const p=new URLSearchParams({from:date,to:date});if(user?.location_id)p.set("location_id",String(user.location_id));const[e,a]=await Promise.all([apiFetch<any>(`/api/employees${user?.location_id?`?location_id=${encodeURIComponent(user.location_id)}`:""}`),apiFetch<any>(`/api/timetable?${p}`)]);setEmployees(arr<Employee>(e).filter(x=>!user?.location_id||!x.location_id||String(x.location_id)===String(user.location_id)));setAppointments(arr<Appointment>(a?.appointments));}catch(e:any){setError(e?.message||"A recepciós irányítópult nem tölthető be.")}finally{setLoading(false)}};
 useEffect(()=>{void load()},[user?.location_id]);
 const active=useMemo(()=>appointments.filter(a=>!["completed","cancelled","canceled","no_show"].includes(norm(a.status))).sort((a,b)=>+new Date(a.start_time)-+new Date(b.start_time)),[appointments]);
 const arrived=active.filter(a=>["arrived","in_progress"].includes(norm(a.status))).length;
 const arrive=async(a:Appointment)=>{try{if(!["arrived","in_progress"].includes(norm(a.status)))await apiFetch(`/api/appointments/${a.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:"arrived"})});navigate(`/workorders/new?appointment_id=${encodeURIComponent(a.id)}`)}catch(e:any){setError(e?.message||"A munkalap nem nyitható meg.")}};
 return <main style={{padding:"24px",maxWidth:1500,margin:0}}>
  <header style={{display:"flex",justifyContent:"space-between",gap:16,alignItems:"flex-start",marginBottom:20}}><div><span style={{fontSize:12,fontWeight:800,letterSpacing:1,color:"#765d85"}}>RECEPCIÓS MUNKAFOLYAMAT</span><h1 style={{margin:"5px 0"}}>Mai vendégek és munkalapok</h1><p style={{margin:0,color:"#666"}}>Innen közvetlenül indítható a vendég érkeztetése, a munkalap és az új foglalás.</p></div><button onClick={()=>void load()} style={{border:"1px solid #ddd",background:"white",padding:"10px 14px",borderRadius:10}}><RefreshCw size={16}/> Frissítés</button></header>
  <section style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:12,marginBottom:18}}>
   <button onClick={()=>navigate("/workorders/new")} style={{padding:18,textAlign:"left",border:"1px solid #e5e0e8",borderRadius:14,background:"white"}}><ClipboardPlus/><strong style={{display:"block",marginTop:8}}>Új walk-in munkalap</strong><small>Foglalás nélkül érkező vendég</small></button>
   <button onClick={()=>navigate("/appointments/calendar")} style={{padding:18,textAlign:"left",border:"1px solid #e5e0e8",borderRadius:14,background:"white"}}><CalendarDays/><strong style={{display:"block",marginTop:8}}>Időpontnaptár</strong><small>Új foglalás és napi beosztás</small></button>
   <article style={{padding:18,border:"1px solid #e5e0e8",borderRadius:14,background:"white"}}><Clock3/><strong style={{display:"block",fontSize:28,marginTop:8}}>{active.length}</strong><small>mai aktív időpont</small></article>
   <article style={{padding:18,border:"1px solid #e5e0e8",borderRadius:14,background:"white"}}><UsersRound/><strong style={{display:"block",fontSize:28,marginTop:8}}>{employees.length}</strong><small>munkatárs a szalonban · {arrived} érkezett vendég</small></article>
  </section>
  {error&&<div style={{padding:12,background:"#fff0f0",border:"1px solid #efcaca",marginBottom:12}}>{error}</div>}
  <section style={{background:"white",border:"1px solid #e6e1e9",borderRadius:14,overflow:"hidden"}}><header style={{padding:"14px 16px",borderBottom:"1px solid #eee"}}><b>Mai vendégsorrend</b></header>{loading?<div style={{padding:20}}>Betöltés…</div>:active.length?active.map(a=><div key={a.id} style={{display:"grid",gridTemplateColumns:"80px minmax(180px,1fr) minmax(160px,1fr) auto",gap:12,alignItems:"center",padding:"12px 16px",borderBottom:"1px solid #f0edf2"}}><b>{hm(a.start_time)}</b><div><strong>{a.client_name||a.title||"Vendég"}</strong><small style={{display:"block",color:"#777"}}>{a.service_names?.join(", ")||a.title||"Szolgáltatás"}</small></div><div><span>{a.employee_name||"Munkatárs"}</span><small style={{display:"block",color:"#777"}}>{norm(a.status)}</small></div><button onClick={()=>void arrive(a)} style={{border:0,borderRadius:10,padding:"9px 12px",background:"#765d85",color:"white",fontWeight:700}}>{["arrived","in_progress"].includes(norm(a.status))?"Munkalap":"Megérkezett → munkalap"}</button></div>):<div style={{padding:20,color:"#777"}}>Nincs aktív mai időpont.</div>}</section>
 </main>
}
