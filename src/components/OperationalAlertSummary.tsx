import React,{useEffect,useState}from"react";
import{AlertTriangle,FileWarning,Play,RefreshCw,ShieldAlert,Truck}from"lucide-react";
import api from"../api/api";
import"./OperationalAlertSummary.css";

type Summary={total:number;critical:number;supplier_expiry:number;employee_document:number;complaint_sla:number};
const err=(e:any)=>e?.response?.data?.message||e?.response?.data?.error||e?.message||"A művelet nem sikerült.";

export default function OperationalAlertSummary(){
 const[data,setData]=useState<Summary|null>(null),[error,setError]=useState(""),[running,setRunning]=useState(false);
 async function load(){try{const r=await api.get("/transactions/notifications/automation/summary");setData(r.data);setError("")}catch(e:any){if(e?.response?.status===403)return;setError(err(e))}}
 useEffect(()=>{void load()},[]);
 async function run(){setRunning(true);setError("");try{await api.post("/transactions/notifications/automation/run");await load()}catch(e){setError(err(e))}finally{setRunning(false)}}
 if(!data&&!error)return null;
 return <section className="notify-automation"><header><div><small>AUTOMATIKUS ELLENŐRZÉSEK</small><h2>Lejáratok és SLA</h2><p>A VIR óránként ellenőrzi a beszállítói lejáratokat, dolgozói dokumentumokat és panaszkezelési határidőket.</p></div><button onClick={()=>void run()} disabled={running}><Play className={running?"spin":""}/>{running?"Futtatás…":"Ellenőrzés most"}</button></header>{error&&<div className="notify-error"><AlertTriangle/>{error}</div>}{data&&<div className="notify-automation-grid"><article className={data.supplier_expiry?"warn":""}><Truck/><div><span>Beszállítói lejárat</span><b>{data.supplier_expiry}</b></div></article><article className={data.employee_document?"warn":""}><FileWarning/><div><span>Dolgozói dokumentum</span><b>{data.employee_document}</b></div></article><article className={data.complaint_sla?"warn":""}><ShieldAlert/><div><span>Panasz SLA</span><b>{data.complaint_sla}</b></div></article><article className={data.critical?"critical":""}><AlertTriangle/><div><span>Kritikus</span><b>{data.critical}</b></div></article></div>}<button className="notify-mini-refresh" onClick={()=>void load()}><RefreshCw/>Frissítés</button></section>
}
