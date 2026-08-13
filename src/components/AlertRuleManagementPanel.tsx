import React,{useEffect,useState}from"react";
import{RefreshCw,Settings2}from"lucide-react";
import api from"../api/api";
export default function AlertRuleManagementPanel(){
 const[data,setData]=useState<any>({rules:[],catalog:[],escalation_flow:[]}),[loading,setLoading]=useState(false),[error,setError]=useState("");
 async function load(){setLoading(true);setError("");try{const r=await api.get("/transactions/alert-rules/rules");setData(r.data||{})}catch(e:any){setError(e?.response?.data?.message||e?.message||"A szabályok betöltése sikertelen.")}finally{setLoading(false)}}
 useEffect(()=>{void load()},[]);
 return <section className="notify-rule-panel"><header><div><small>RIASZTÁSI SZABÁLYMOTOR</small><h2><Settings2/>Szabályok és eszkaláció</h2></div><button onClick={()=>void load()}><RefreshCw className={loading?"spin":""}/>Frissítés</button></header>{error&&<div className="notify-error">{error}</div>}<div className="notify-flow">{(data.escalation_flow||[]).map((x:any)=><span key={x.level}>L{x.level} {x.label}</span>)}</div><div className="notify-rule-grid">{(data.catalog||[]).map((c:any)=>{const r=(data.rules||[]).find((x:any)=>x.rule_key===c.key&&x.scope_type==="global");return <article key={c.key}><h3>{c.title}</h3><p>{c.description}</p><small>Előriasztás: {r?.warning_value??"—"} {c.warning_unit} · L2: {r?.level2_after_hours??"—"} óra · L3: {r?.level3_after_hours??"—"} óra</small></article>})}</div></section>;
}
