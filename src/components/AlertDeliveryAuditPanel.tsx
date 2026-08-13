import React,{useEffect,useState}from"react";
import{History,RefreshCw}from"lucide-react";
import api from"../api/api";
export default function AlertDeliveryAuditPanel(){
 const[data,setData]=useState<any>({items:[],stats:{}}),[loading,setLoading]=useState(false),[error,setError]=useState("");
 async function load(){setLoading(true);try{const r=await api.get("/transactions/alert-rules/deliveries",{params:{limit:200}});setData(r.data||{})}catch(e:any){setError(e?.response?.data?.message||"A napló betöltése sikertelen.")}finally{setLoading(false)}}useEffect(()=>{void load()},[]);
 return <section className="notify-delivery-panel"><header><h2><History/>Kézbesítési audit</h2><button onClick={()=>void load()}><RefreshCw className={loading?"spin":""}/>Frissítés</button></header>{error&&<div className="notify-error">{error}</div>}<div className="notify-delivery-stats"><article><span>30 nap</span><b>{data.stats?.total||0}</b></article><article><span>Sikeres</span><b>{data.stats?.sent||0}</b></article><article><span>Hibás</span><b>{data.stats?.failed||0}</b></article><article><span>Eszkaláció</span><b>{data.stats?.escalation||0}</b></article></div></section>;
}
